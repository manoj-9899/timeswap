import { Controller, Post, Get, Param, Body, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { SessionAuthGuard } from '../../common/guards/session-auth.guard.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe.js';
import { createReviewSchema, CreateReviewDto } from '@timeswap/contracts';
import { ReviewsService } from './reviews.service.js';

@Controller('reviews')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Post()
  @UseGuards(SessionAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  async createReview(
    @CurrentUser('id') userId: string,
    @Body(new ZodValidationPipe(createReviewSchema)) dto: CreateReviewDto,
  ) {
    const review = await this.reviewsService.createReview(userId, dto);
    return {
      success: true,
      data: review,
    };
  }

  @Get('profile/:handle')
  @HttpCode(HttpStatus.OK)
  async getProfileReviews(@Param('handle') handle: string) {
    const result = await this.reviewsService.getProfileReviews(handle);
    return {
      success: true,
      data: result,
    };
  }
}
