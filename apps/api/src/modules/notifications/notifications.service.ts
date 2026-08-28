import { Injectable, NotFoundException } from '@nestjs/common';
import { prisma } from '@timeswap/database';
import { CreateNotificationInput, NotificationQueryInput } from '@timeswap/contracts';

@Injectable()
export class NotificationsService {
  /**
   * Creates a notification record for a specified user
   */
  async createNotification(data: CreateNotificationInput) {
    return prisma.notification.create({
      data: {
        userId: data.userId,
        notificationType: data.notificationType,
        title: data.title,
        bodyText: data.bodyText,
        actionUrl: data.actionUrl,
      },
    });
  }

  /**
   * Retrieves paginated notifications and total unread count for a user
   */
  async getNotifications(userId: string, query: NotificationQueryInput) {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = { userId };
    if (query.unread_only) {
      where.isRead = false;
    }

    const [items, totalItems, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.notification.count({ where }),
      prisma.notification.count({
        where: { userId, isRead: false },
      }),
    ]);

    const totalPages = Math.ceil(totalItems / limit) || 1;

    return {
      items: items.map((item) => ({
        id: item.id,
        user_id: item.userId,
        notification_type: item.notificationType,
        title: item.title,
        body_text: item.bodyText,
        action_url: item.actionUrl,
        is_read: item.isRead,
        created_at: item.createdAt.toISOString(),
      })),
      unread_count: unreadCount,
      meta: {
        page,
        limit,
        total_items: totalItems,
        total_pages: totalPages,
        has_next_page: page < totalPages,
        has_previous_page: page > 1,
      },
    };
  }

  /**
   * Retrieves light-weight unread count metric for top navigation badge
   */
  async getUnreadCount(userId: string) {
    const unreadCount = await prisma.notification.count({
      where: { userId, isRead: false },
    });
    return { unread_count: unreadCount };
  }

  /**
   * Marks a single notification as read for the owner user
   */
  async markAsRead(userId: string, notificationId: string) {
    const notification = await prisma.notification.findFirst({
      where: { id: notificationId, userId },
    });

    if (!notification) {
      throw new NotFoundException({
        code: 'NOTIFICATION_NOT_FOUND',
        message: 'Notification not found or access denied.',
      });
    }

    const updated = await prisma.notification.update({
      where: { id: notificationId },
      data: { isRead: true },
    });

    return {
      id: updated.id,
      is_read: updated.isRead,
    };
  }

  /**
   * Marks all notifications for a user as read
   */
  async markAllAsRead(userId: string) {
    const res = await prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });

    return { updated_count: res.count };
  }
}
