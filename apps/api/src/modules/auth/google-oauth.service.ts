import { Injectable, Logger, BadRequestException } from '@nestjs/common';

export interface GoogleUserProfile {
  id: string;
  email: string;
  verified_email: boolean;
  name: string;
  given_name?: string;
  family_name?: string;
  picture?: string;
}

@Injectable()
export class GoogleOAuthService {
  private readonly logger = new Logger(GoogleOAuthService.name);

  getGoogleAuthUrl(): string {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const redirectUri = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/v1/auth/google/callback`;

    if (!clientId) {
      this.logger.warn('GOOGLE_CLIENT_ID is not configured in .env');
    }

    const params = new URLSearchParams({
      client_id: clientId || '',
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: 'openid email profile',
      access_type: 'offline',
      prompt: 'consent',
    });

    return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  }

  async getGoogleUserProfile(code: string): Promise<GoogleUserProfile> {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const redirectUri = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/v1/auth/google/callback`;

    if (!clientId || !clientSecret) {
      throw new BadRequestException('Google OAuth is not configured on this server (missing GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET).');
    }

    try {
      // Exchange code for tokens
      const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          code,
          client_id: clientId,
          client_secret: clientSecret,
          redirect_uri: redirectUri,
          grant_type: 'authorization_code',
        }),
      });

      if (!tokenResponse.ok) {
        const errText = await tokenResponse.text();
        this.logger.error(`Google token exchange error (${tokenResponse.status}): ${errText}`);
        throw new BadRequestException('Failed to exchange authorization code with Google.');
      }

      const tokens = (await tokenResponse.json()) as { access_token: string; id_token: string };

      // Fetch user profile info
      const userResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: {
          Authorization: `Bearer ${tokens.access_token}`,
        },
      });

      if (!userResponse.ok) {
        throw new BadRequestException('Failed to retrieve user profile from Google.');
      }

      const profile = (await userResponse.json()) as GoogleUserProfile;
      return profile;
    } catch (err: any) {
      this.logger.error(`Google OAuth authentication failed: ${err.message}`);
      throw new BadRequestException(err.message || 'Google OAuth authentication failed.');
    }
  }
}
