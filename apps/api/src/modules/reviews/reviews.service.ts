import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { prisma, Prisma } from '@timeswap/database';
import { CreateReviewDto } from '@timeswap/contracts';

@Injectable()
export class ReviewsService {
  async createReview(userId: string, dto: CreateReviewDto) {
    const session = await prisma.session.findUnique({
      where: { id: dto.session_id },
      include: { booking: true },
    });

    if (!session || !session.booking) {
      throw new NotFoundException({
        code: 'SESSION_NOT_FOUND',
        message: 'Session not found.',
      });
    }

    const { booking } = session;

    if (booking.requesterId !== userId && booking.providerId !== userId) {
      throw new ForbiddenException({
        code: 'FORBIDDEN_RESOURCE',
        message: 'Only participants in this session can submit a review.',
      });
    }

    if (booking.status !== 'COMPLETED') {
      throw new BadRequestException({
        code: 'INVALID_SESSION_STATE',
        message: 'Reviews can only be submitted for completed sessions.',
      });
    }

    const subjectUserId = userId === booking.requesterId ? booking.providerId : booking.requesterId;

    if (userId === subjectUserId) {
      throw new BadRequestException({
        code: 'SELF_REVIEW_NOT_ALLOWED',
        message: 'You cannot review yourself.',
      });
    }

    const existingReview = await prisma.review.findUnique({
      where: {
        sessionId_authorUserId: {
          sessionId: session.id,
          authorUserId: userId,
        },
      },
    });

    if (existingReview) {
      throw new BadRequestException({
        code: 'REVIEW_ALREADY_SUBMITTED',
        message: 'You have already submitted a review for this session.',
      });
    }

    // Check if counterpart has submitted a review
    const counterpartReview = await prisma.review.findFirst({
      where: {
        sessionId: session.id,
        authorUserId: subjectUserId,
      },
    });

    const isBothSubmitted = !!counterpartReview;

    const review = await prisma.review.create({
      data: {
        sessionId: session.id,
        authorUserId: userId,
        subjectUserId,
        rating: dto.rating,
        attributeTags: dto.attribute_tags || [],
        commentText: dto.comment_text || null,
        isRevealed: isBothSubmitted,
      },
    });

    if (isBothSubmitted && counterpartReview) {
      // Reveal both reviews
      await prisma.review.update({
        where: { id: counterpartReview.id },
        data: { isRevealed: true },
      });

      // Recalculate profile reputation stats for both users
      await this.recalculateProfileReputation(userId);
      await this.recalculateProfileReputation(subjectUserId);
    }

    return {
      id: review.id,
      session_id: review.sessionId,
      rating: review.rating,
      comment_text: review.commentText,
      is_revealed: review.isRevealed,
      created_at: review.createdAt,
      message: isBothSubmitted
        ? 'Double-blind review revealed! Thank you for rating your session.'
        : 'Review submitted! It will remain hidden until the counterpart submits their review.',
    };
  }

  async getProfileReviews(handle: string) {
    const profile = await prisma.profile.findUnique({
      where: { handle },
    });

    if (!profile) {
      throw new NotFoundException({
        code: 'PROFILE_NOT_FOUND',
        message: 'Profile not found.',
      });
    }

    const reviews = await prisma.review.findMany({
      where: {
        subjectUserId: profile.userId,
        isRevealed: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    const formattedReviews = await Promise.all(
      reviews.map(async (r) => {
        const authorProfile = await prisma.profile.findUnique({
          where: { userId: r.authorUserId },
        });

        return {
          id: r.id,
          rating: r.rating,
          comment_text: r.commentText,
          attribute_tags: r.attributeTags,
          created_at: r.createdAt,
          author: authorProfile
            ? {
                display_name: authorProfile.displayName,
                handle: authorProfile.handle,
                avatar_url: authorProfile.avatarUrl,
              }
            : { display_name: 'TimeSwap Member' },
        };
      }),
    );

    return {
      profile_handle: handle,
      rating_average: Number(profile.ratingAverage),
      completed_exchanges_count: profile.completedExchangesCount,
      reviews: formattedReviews,
    };
  }

  private async recalculateProfileReputation(userId: string) {
    const reviews = await prisma.review.findMany({
      where: {
        subjectUserId: userId,
        isRevealed: true,
      },
    });

    const count = reviews.length;
    let avg = 0;

    if (count > 0) {
      const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
      avg = Math.round((sum / count) * 100) / 100;
    }

    await prisma.profile.updateMany({
      where: { userId },
      data: {
        ratingAverage: new Prisma.Decimal(avg),
        completedExchangesCount: count,
      },
    });
  }
}
