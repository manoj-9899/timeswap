import {
  Controller,
  Get,
  Patch,
  Post,
  Param,
  Body,
  UseGuards,
  UsePipes,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ProfilesService } from './profiles.service';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { SessionAuthGuard } from '../../common/guards/session-auth.guard';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import {
  updateProfileSchema,
  completeOnboardingSchema,
  UpdateProfileDto,
  CompleteOnboardingDto,
} from '@timeswap/contracts';

@Controller()
@UseGuards(SessionAuthGuard)
export class ProfilesController {
  constructor(private profilesService: ProfilesService) {}

  @Get('users/me/profile')
  @HttpCode(HttpStatus.OK)
  async getMyProfile(@CurrentUser('id') userId: string) {
    const profile = await this.profilesService.getAuthenticatedProfile(userId);
    return {
      success: true,
      data: profile,
    };
  }

  @Patch('users/me/profile')
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ZodValidationPipe(updateProfileSchema))
  async updateMyProfile(
    @CurrentUser('id') userId: string,
    @Body() dto: UpdateProfileDto,
  ) {
    const profile = await this.profilesService.updateAuthenticatedProfile(
      userId,
      dto,
    );
    return {
      success: true,
      data: profile,
    };
  }

  @Post('users/me/profile/complete')
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ZodValidationPipe(completeOnboardingSchema))
  async completeOnboarding(
    @CurrentUser('id') userId: string,
    @Body() dto: CompleteOnboardingDto,
  ) {
    const result = await this.profilesService.completeOnboarding(userId, dto);
    return {
      success: true,
      data: result,
    };
  }

  @Public()
  @Get('profiles/:handle')
  @HttpCode(HttpStatus.OK)
  async getPublicProfile(@Param('handle') handle: string) {
    const profile = await this.profilesService.getPublicProfile(handle);
    return {
      success: true,
      data: profile,
    };
  }
}
