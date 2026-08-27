import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { prisma } from '@timeswap/database';

@Injectable()
export class MessagingService {
  async getOrCreateThreadForBooking(userId: string, bookingId: string) {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
    });

    if (!booking) {
      throw new NotFoundException({
        code: 'BOOKING_NOT_FOUND',
        message: 'Booking not found.',
      });
    }

    if (booking.requesterId !== userId && booking.providerId !== userId) {
      throw new ForbiddenException({
        code: 'FORBIDDEN_RESOURCE',
        message: 'Only booking participants can access this message thread.',
      });
    }

    let thread = await prisma.messageThread.findUnique({
      where: { bookingId },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!thread) {
      thread = await prisma.messageThread.create({
        data: {
          bookingId,
          participantOneId: booking.requesterId,
          participantTwoId: booking.providerId,
        },
        include: {
          messages: {
            orderBy: { createdAt: 'asc' },
          },
        },
      });
    }

    return this.formatThreadResponse(thread, userId);
  }

  async getUserThreads(userId: string) {
    const threads = await prisma.messageThread.findMany({
      where: {
        OR: [{ participantOneId: userId }, { participantTwoId: userId }],
      },
      include: {
        booking: {
          include: {
            serviceOffer: true,
            helpRequest: true,
          },
        },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    const formatted = await Promise.all(
      threads.map(async (t) => {
        const otherUserId = t.participantOneId === userId ? t.participantTwoId : t.participantOneId;
        const otherProfile = await prisma.profile.findUnique({
          where: { userId: otherUserId },
        });

        const unreadCount = await prisma.message.count({
          where: {
            threadId: t.id,
            senderUserId: { not: userId },
            isRead: false,
          },
        });

        const lastMessage = t.messages[0];

        return {
          id: t.id,
          booking_id: t.bookingId,
          listing_title: t.booking?.serviceOffer?.title || t.booking?.helpRequest?.title || 'Session Chat',
          thread_status: t.threadStatus,
          unread_count: unreadCount,
          other_participant: otherProfile
            ? {
                id: otherProfile.userId,
                display_name: otherProfile.displayName,
                handle: otherProfile.handle,
                avatar_url: otherProfile.avatarUrl,
              }
            : { id: otherUserId, display_name: 'TimeSwap Member' },
          last_message: lastMessage
            ? {
                content_text: lastMessage.contentText,
                created_at: lastMessage.createdAt,
                is_read: lastMessage.isRead,
                sender_id: lastMessage.senderUserId,
              }
            : null,
          updated_at: t.updatedAt,
        };
      }),
    );

    return formatted;
  }

  async getThreadById(userId: string, threadId: string) {
    const thread = await prisma.messageThread.findUnique({
      where: { id: threadId },
      include: {
        booking: true,
        messages: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!thread) {
      throw new NotFoundException({
        code: 'THREAD_NOT_FOUND',
        message: 'Message thread not found.',
      });
    }

    if (thread.participantOneId !== userId && thread.participantTwoId !== userId) {
      throw new ForbiddenException({
        code: 'FORBIDDEN_RESOURCE',
        message: 'You do not have access to this thread.',
      });
    }

    // Mark unread messages as read
    await prisma.message.updateMany({
      where: {
        threadId,
        senderUserId: { not: userId },
        isRead: false,
      },
      data: { isRead: true },
    });

    return this.formatThreadResponse(thread, userId);
  }

  async sendMessage(userId: string, threadId: string, contentText: string) {
    if (!contentText || typeof contentText !== 'string' || contentText.trim().length === 0) {
      throw new BadRequestException({
        code: 'VALIDATION_ERROR',
        message: 'Message content text cannot be empty.',
      });
    }

    const thread = await prisma.messageThread.findUnique({
      where: { id: threadId },
      include: { booking: true },
    });

    if (!thread) {
      throw new NotFoundException({
        code: 'THREAD_NOT_FOUND',
        message: 'Message thread not found.',
      });
    }

    if (thread.participantOneId !== userId && thread.participantTwoId !== userId) {
      throw new ForbiddenException({
        code: 'FORBIDDEN_RESOURCE',
        message: 'You are not a participant in this message thread.',
      });
    }

    if (thread.booking && thread.booking.status === 'CANCELLED') {
      throw new BadRequestException({
        code: 'THREAD_READ_ONLY',
        message: 'Cannot send messages in a cancelled booking thread.',
      });
    }

    const message = await prisma.message.create({
      data: {
        threadId,
        senderUserId: userId,
        contentText,
      },
    });

    // Touch thread updatedAt
    await prisma.messageThread.update({
      where: { id: threadId },
      data: { updatedAt: new Date() },
    });

    return {
      id: message.id,
      thread_id: message.threadId,
      sender_user_id: message.senderUserId,
      content_text: message.contentText,
      is_read: message.isRead,
      created_at: message.createdAt,
    };
  }

  private async formatThreadResponse(t: any, userId: string) {
    const otherUserId = t.participantOneId === userId ? t.participantTwoId : t.participantOneId;
    const otherProfile = await prisma.profile.findUnique({
      where: { userId: otherUserId },
    });

    return {
      id: t.id,
      booking_id: t.bookingId,
      thread_status: t.threadStatus,
      other_participant: otherProfile
        ? {
            id: otherProfile.userId,
            display_name: otherProfile.displayName,
            handle: otherProfile.handle,
            avatar_url: otherProfile.avatarUrl,
          }
        : { id: otherUserId, display_name: 'TimeSwap Member' },
      messages: (t.messages || []).map((m: any) => ({
        id: m.id,
        sender_user_id: m.senderUserId,
        content_text: m.contentText,
        is_read: m.isRead,
        created_at: m.createdAt,
      })),
    };
  }
}
