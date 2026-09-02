import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { prisma } from '@timeswap/database';
import {
  RegisterDto,
  VerifyEmailDto,
  LoginDto,
  ForgotPasswordDto,
  ResetPasswordDto,
  ChangePasswordDto,
} from '@timeswap/contracts';
import { PasswordService } from './password.service';
import { SessionService } from './session.service';
import { EmailQueueService } from './email-queue.service';
import { GoogleUserProfile } from './google-oauth.service';
import { randomBytes } from 'crypto';

@Injectable()
export class AuthService {
  constructor(
    private passwordService: PasswordService,
    private sessionService: SessionService,
    private emailQueueService: EmailQueueService,
  ) {}

  async register(dto: RegisterDto) {
    const email = dto.email.trim().toLowerCase();

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new ConflictException({
        code: 'EMAIL_ALREADY_REGISTERED',
        message: 'An account with this email address already exists.',
      });
    }

    const passwordHash = await this.passwordService.hashPassword(dto.password);
    const verificationTokenStr = randomBytes(32).toString('hex');
    const tokenExpiresAt = new Date();
    tokenExpiresAt.setHours(tokenExpiresAt.getHours() + 24);

    const tempHandle = `user_${randomBytes(4).toString('hex')}`;

    const user = await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          email,
          status: 'UNVERIFIED',
          role: 'USER',
        },
      });

      await tx.userCredential.create({
        data: {
          userId: newUser.id,
          passwordHash,
        },
      });

      await tx.profile.create({
        data: {
          userId: newUser.id,
          displayName: dto.display_name.trim(),
          handle: tempHandle,
          city: 'Unspecified',
          generalDistrict: 'Unspecified',
        },
      });

      await tx.verificationToken.create({
        data: {
          userId: newUser.id,
          token: verificationTokenStr,
          expiresAt: tokenExpiresAt,
        },
      });

      return newUser;
    });

    await this.emailQueueService.sendVerificationEmail(user.email, verificationTokenStr);

    return {
      message: 'Registration successful. Please check your email to verify your account.',
      user_id: user.id,
      email: user.email,
      status: user.status,
    };
  }

  async handleGoogleAuth(googleProfile: GoogleUserProfile) {
    const email = googleProfile.email.trim().toLowerCase();

    let user = await prisma.user.findFirst({
      where: {
        OR: [{ googleId: googleProfile.id }, { email }],
      },
    });

    if (!user) {
      const tempHandle = `g_${googleProfile.name.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 10)}_${randomBytes(3).toString('hex')}`;

      user = await prisma.$transaction(async (tx) => {
        const newUser = await tx.user.create({
          data: {
            email,
            googleId: googleProfile.id,
            status: 'ACTIVE',
            role: 'USER',
          },
        });

        await tx.profile.create({
          data: {
            userId: newUser.id,
            displayName: googleProfile.name || 'Google User',
            handle: tempHandle,
            avatarUrl: googleProfile.picture,
            city: 'Unspecified',
            generalDistrict: 'Unspecified',
          },
        });

        // Create Wallet
        const userWallet = await tx.ledgerAccount.create({
          data: {
            userId: newUser.id,
            accountType: 'USER_WALLET',
            balance: 1.0,
          },
        });

        // Fetch System Reserve
        let systemReserve = await tx.ledgerAccount.findFirst({
          where: { accountType: 'SYSTEM_RESERVE' },
        });

        if (!systemReserve) {
          systemReserve = await tx.ledgerAccount.create({
            data: {
              accountType: 'SYSTEM_RESERVE',
              balance: 1000000.0,
            },
          });
        }

        const journalEntry = await tx.ledgerTransaction.create({
          data: {
            transactionType: 'STARTER_GRANT',
          },
        });

        await tx.journalEntry.createMany({
          data: [
            {
              transactionId: journalEntry.id,
              accountId: systemReserve.id,
              entryType: 'DEBIT',
              amount: 1.0,
            },
            {
              transactionId: journalEntry.id,
              accountId: userWallet.id,
              entryType: 'CREDIT',
              amount: 1.0,
            },
          ],
        });

        return newUser;
      });
    } else if (!user.googleId) {
      user = await prisma.user.update({
        where: { id: user.id },
        data: { googleId: googleProfile.id, status: 'ACTIVE' },
      });
    }

    const session = await this.sessionService.createSession(user.id);
    return { user, token: session.rawToken };
  }

  async verifyEmail(dto: VerifyEmailDto) {
    const vToken = await prisma.verificationToken.findUnique({
      where: { token: dto.token },
      include: { user: true },
    });

    if (!vToken) {
      throw new BadRequestException({
        code: 'INVALID_VERIFICATION_TOKEN',
        message: 'The verification link is invalid or has already been used.',
      });
    }

    if (vToken.expiresAt < new Date()) {
      throw new BadRequestException({
        code: 'EXPIRED_VERIFICATION_TOKEN',
        message: 'The verification link has expired.',
      });
    }

    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: vToken.userId },
        data: { status: 'ACTIVE' },
      });

      await tx.verificationToken.delete({
        where: { id: vToken.id },
      });
    });

    return { message: 'Email address verified successfully. You may now log in.' };
  }

  // OWASP-compliant dummy Argon2id hash for constant-time email enumeration prevention
  private readonly DUMMY_HASH =
    '$argon2id$v=19$m=65536,t=3,p=1$c29tZXNhbHQ$R39yVq0/9l92L4u/D165gX/Z/6s00';

  async login(dto: LoginDto) {
    const email = dto.email.trim().toLowerCase();

    const user = await prisma.user.findUnique({
      where: { email },
      include: { credential: true, profile: true },
    });

    if (!user || !user.credential) {
      // Execute dummy Argon2id verification to prevent timing attack enumeration
      await this.passwordService.verifyPassword(this.DUMMY_HASH, dto.password);
      throw new UnauthorizedException({
        code: 'INVALID_CREDENTIALS',
        message: 'Invalid email or password.',
      });
    }

    const isValid = await this.passwordService.verifyPassword(
      user.credential.passwordHash,
      dto.password,
    );

    if (!isValid) {
      throw new UnauthorizedException({
        code: 'INVALID_CREDENTIALS',
        message: 'Invalid email or password.',
      });
    }

    if (user.status === 'UNVERIFIED') {
      throw new ForbiddenException({
        code: 'EMAIL_NOT_VERIFIED',
        message: 'Please verify your email address before logging in.',
      });
    }

    if (user.status === 'SUSPENDED' || user.status === 'DEACTIVATED') {
      throw new ForbiddenException({
        code: 'ACCOUNT_INACTIVE',
        message: 'Your account is suspended or deactivated.',
      });
    }

    const session = await this.sessionService.createSession(user.id);

    return {
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        status: user.status,
        profile: user.profile,
      },
      token: session.rawToken,
    };
  }

  async logout(token: string) {
    await this.sessionService.revokeSession(token);
    return { message: 'Logged out successfully.' };
  }

  async forgotPassword(dto: ForgotPasswordDto) {
    const email = dto.email.trim().toLowerCase();
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      return { message: 'If an account exists with that email, a password reset link has been sent.' };
    }

    const resetTokenStr = randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1);

    await prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        token: resetTokenStr,
        expiresAt,
      },
    });

    await this.emailQueueService.sendPasswordResetEmail(user.email, resetTokenStr);

    return { message: 'If an account exists with that email, a password reset link has been sent.' };
  }

  async resetPassword(dto: ResetPasswordDto) {
    const pToken = await prisma.passwordResetToken.findUnique({
      where: { token: dto.token },
    });

    if (!pToken || pToken.expiresAt < new Date()) {
      throw new BadRequestException({
        code: 'INVALID_OR_EXPIRED_TOKEN',
        message: 'Password reset link is invalid or has expired.',
      });
    }

    const newPasswordHash = await this.passwordService.hashPassword(dto.new_password);

    await prisma.$transaction(async (tx) => {
      await tx.userCredential.update({
        where: { userId: pToken.userId },
        data: { passwordHash: newPasswordHash },
      });

      await tx.passwordResetToken.deleteMany({
        where: { userId: pToken.userId },
      });

      await tx.sessionToken.deleteMany({
        where: { userId: pToken.userId },
      });
    });

    return { message: 'Password reset successfully. You may now log in with your new password.' };
  }

  async changePassword(userId: string, dto: ChangePasswordDto) {
    const credential = await prisma.userCredential.findUnique({
      where: { userId },
    });

    if (!credential) {
      throw new BadRequestException('User credentials not found.');
    }

    const isValid = await this.passwordService.verifyPassword(
      credential.passwordHash,
      dto.current_password,
    );

    if (!isValid) {
      throw new BadRequestException({
        code: 'INVALID_CURRENT_PASSWORD',
        message: 'Current password is incorrect.',
      });
    }

    const newPasswordHash = await this.passwordService.hashPassword(dto.new_password);

    await prisma.userCredential.update({
      where: { userId },
      data: { passwordHash: newPasswordHash },
    });

    return { message: 'Password changed successfully.' };
  }
}
