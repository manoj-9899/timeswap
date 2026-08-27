import {
  Controller,
  Post,
  Get,
  Body,
  Query,
  Req,
  Res,
  UsePipes,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { FastifyRequest, FastifyReply } from 'fastify';
import { AuthService } from './auth.service';
import { GoogleOAuthService } from './google-oauth.service';
import {
  registerSchema,
  verifyEmailSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  changePasswordSchema,
  RegisterDto,
  VerifyEmailDto,
  LoginDto,
  ForgotPasswordDto,
  ResetPasswordDto,
  ChangePasswordDto,
} from '@timeswap/contracts';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { SessionAuthGuard } from '../../common/guards/session-auth.guard';

@Controller('auth')
@UseGuards(SessionAuthGuard)
export class AuthController {
  constructor(
    private authService: AuthService,
    private googleOAuthService: GoogleOAuthService,
  ) {}

  @Public()
  @Get('google')
  async googleAuth(@Res() res: FastifyReply) {
    const url = this.googleOAuthService.getGoogleAuthUrl();
    return res.redirect(url, 302);
  }

  @Public()
  @Get('google/callback')
  async googleAuthCallback(
    @Query('code') code: string,
    @Res() res: FastifyReply,
  ) {
    const clientUrl = process.env.CORS_ORIGIN || 'http://localhost:3000';
    try {
      if (!code) {
        return res.redirect(`${clientUrl}/login?error=missing_google_code`, 302);
      }

      const googleProfile = await this.googleOAuthService.getGoogleUserProfile(code);
      const result = await this.authService.handleGoogleAuth(googleProfile);

      res.setCookie('timeswap_session', result.token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
      });

      return res.redirect(`${clientUrl}/discover`, 302);
    } catch (err: any) {
      console.error('[GoogleCallbackError]', err);
      return res.redirect(`${clientUrl}/login?error=google_auth_failed`, 302);
    }
  }

  @Public()
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @UsePipes(new ZodValidationPipe(registerSchema))
  async register(@Body() dto: RegisterDto) {
    const result = await this.authService.register(dto);
    return {
      success: true,
      data: result,
    };
  }

  @Public()
  @Post('verify-email')
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ZodValidationPipe(verifyEmailSchema))
  async verifyEmail(@Body() dto: VerifyEmailDto) {
    const result = await this.authService.verifyEmail(dto);
    return {
      success: true,
      data: result,
    };
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ZodValidationPipe(loginSchema))
  async login(
    @Body() dto: LoginDto,
    @Req() req: FastifyRequest,
    @Res({ passthrough: true }) res: FastifyReply,
  ) {
    const result = await this.authService.login(dto);

    // Set signed, HTTP-Only session cookie
    res.setCookie('timeswap_session', result.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
    });

    return {
      success: true,
      data: result.user,
    };
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(
    @Req() req: any,
    @Res({ passthrough: true }) res: FastifyReply,
  ) {
    const sessionToken = req.sessionToken;
    if (sessionToken) {
      await this.authService.logout(sessionToken);
    }

    res.clearCookie('timeswap_session', { path: '/' });

    return {
      success: true,
      data: { success: true },
    };
  }

  @Get('me')
  @HttpCode(HttpStatus.OK)
  async getMe(@CurrentUser() user: any) {
    return {
      success: true,
      data: user,
    };
  }

  @Public()
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ZodValidationPipe(forgotPasswordSchema))
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    const result = await this.authService.forgotPassword(dto);
    return {
      success: true,
      data: result,
    };
  }

  @Public()
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ZodValidationPipe(resetPasswordSchema))
  async resetPassword(@Body() dto: ResetPasswordDto) {
    const result = await this.authService.resetPassword(dto);
    return {
      success: true,
      data: result,
    };
  }

  @Post('change-password')
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ZodValidationPipe(changePasswordSchema))
  async changePassword(
    @CurrentUser('id') userId: string,
    @Body() dto: ChangePasswordDto,
  ) {
    const result = await this.authService.changePassword(userId, dto);
    return {
      success: true,
      data: result,
    };
  }
}
