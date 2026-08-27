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

    // Enqueue verification email asynchronously
    await this.emailQueueService.sendVerificationEmail(email, verificationTokenStr);

    return {
      user_id: user.id,
      email: user.email,
      status: user.status,
      message: 'Verification email sent.',
    };
  }

  async verifyEmail(dto: VerifyEmailDto) {
    const verificationToken = await prisma.verificationToken.findUnique({
      where: { token: dto.token },
      include: { user: true },
    });

    if (!verificationToken || new Date() > verificationToken.expiresAt) {
      throw new BadRequestException({
        code: 'INVALID_VERIFICATION_TOKEN',
        message: 'The email verification token is invalid or has expired.',
      });
    }

    const updatedUser = await prisma.$transaction(async (tx) => {
      const user = await tx.user.update({
        where: { id: verificationToken.userId },
        data: { status: 'ACTIVE' },
      });

      await tx.verificationToken.delete({
        where: { id: verificationToken.id },
      });

      return user;
    });

    return {
      user_id: updatedUser.id,
      status: updatedUser.status,
      email_verified: true,
    };
  }

  async login(dto: LoginDto, ipAddress?: string, userAgent?: string) {
    const email = dto.email.trim().toLowerCase();

    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        credential: true,
        profile: true,
      },
    });

    if (!user || !user.credential) {
      throw new UnauthorizedException({
        code: 'INVALID_CREDENTIALS',
        message: 'Invalid email or password.',
      });
    }

    if (user.status === 'SUSPENDED') {
      throw new ForbiddenException({
        code: 'ACCOUNT_SUSPENDED',
        message: 'Your account has been suspended. Please contact support.',
      });
    }

    const isPasswordValid = await this.passwordService.verifyPassword(
      user.credential.passwordHash,
      dto.password,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException({
        code: 'INVALID_CREDENTIALS',
        message: 'Invalid email or password.',
      });
    }

    const session = await this.sessionService.createSession(
      user.id,
      ipAddress,
      userAgent,
    );

    const isProfileCompleted =
      user.status === 'ACTIVE' &&
      Boolean(user.profile?.handle && !user.profile.handle.startsWith('user_'));

    return {
      sessionToken: session.token,
      data: {
        user_id: user.id,
        email: user.email,
        roles: [user.role],
        profile_completed: isProfileCompleted,
      },
    };
  }

  async logout(sessionToken?: string) {
    if (sessionToken) {
      await this.sessionService.revokeSession(sessionToken);
    }
    return { success: true };
  }

  async getMe(user: any) {
    const fullUser = await prisma.user.findUnique({
      where: { id: user.id },
      include: { profile: true },
    });

    if (!fullUser) {
      throw new UnauthorizedException({
        code: 'UNAUTHORIZED',
        message: 'User session invalid.',
      });
    }

    const isCompleted =
      fullUser.status === 'ACTIVE' &&
      Boolean(fullUser.profile?.handle && !fullUser.profile.handle.startsWith('user_'));

    return {
      user_id: fullUser.id,
      email: fullUser.email,
      roles: [fullUser.role],
      status: fullUser.status,
      profile: fullUser.profile
        ? {
            id: fullUser.profile.id,
            handle: fullUser.profile.handle,
            display_name: fullUser.profile.displayName,
            avatar_url: fullUser.profile.avatarUrl,
            is_completed: isCompleted,
          }
        : null,
    };
  }

  async forgotPassword(dto: ForgotPasswordDto) {
    const email = dto.email.trim().toLowerCase();

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (user) {
      const resetTokenStr = randomBytes(32).toString('hex');
      const tokenExpiresAt = new Date();
      tokenExpiresAt.setHours(tokenExpiresAt.getHours() + 1);

      await prisma.passwordResetToken.create({
        data: {
          userId: user.id,
          token: resetTokenStr,
          expiresAt: tokenExpiresAt,
        },
      });

      await this.emailQueueService.sendPasswordResetEmail(email, resetTokenStr);
    }

    // Always return success message to prevent user enumeration
    return {
      message: 'If an account with that email exists, a password reset link has been sent.',
    };
  }

  async resetPassword(dto: ResetPasswordDto) {
    const resetToken = await prisma.passwordResetToken.findUnique({
      where: { token: dto.token },
    });

    if (!resetToken || new Date() > resetToken.expiresAt) {
      throw new BadRequestException({
        code: 'INVALID_RESET_TOKEN',
        message: 'The password reset token is invalid or has expired.',
      });
    }

    const newPasswordHash = await this.passwordService.hashPassword(dto.new_password);

    await prisma.$transaction(async (tx) => {
      await tx.userCredential.update({
        where: { userId: resetToken.userId },
        data: { passwordHash: newPasswordHash },
      });

      // Revoke all active sessions for security
      await tx.sessionToken.deleteMany({
        where: { userId: resetToken.userId },
      });

      await tx.passwordResetToken.delete({
        where: { id: resetToken.id },
      });
    });

    return {
      success: true,
      message: 'Password reset successful. Please log in with your new password.',
    };
  }

  async changePassword(userId: string, dto: ChangePasswordDto) {
    const credential = await prisma.userCredential.findUnique({
      where: { userId },
    });

    if (!credential) {
      throw new BadRequestException({
        code: 'CREDENTIALS_NOT_FOUND',
        message: 'User credentials not found.',
      });
    }

    const isCurrentValid = await this.passwordService.verifyPassword(
      credential.passwordHash,
      dto.current_password,
    );

    if (!isCurrentValid) {
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

    return { success: true };
  }
}
