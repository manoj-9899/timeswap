import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { SessionAuthGuard } from '../../common/guards/session-auth.guard.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { NotificationsService } from './notifications.service.js';
import { notificationQuerySchema } from '@timeswap/contracts';

@Controller('notifications')
@UseGuards(SessionAuthGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  async getNotifications(@CurrentUser('id') userId: string, @Query() query: any) {
    const validatedQuery = notificationQuerySchema.parse(query);
    const result = await this.notificationsService.getNotifications(userId, validatedQuery);
    return {
      success: true,
      data: {
        items: result.items,
        unread_count: result.unread_count,
      },
      meta: result.meta,
    };
  }

  @Get('unread-count')
  @HttpCode(HttpStatus.OK)
  async getUnreadCount(@CurrentUser('id') userId: string) {
    const data = await this.notificationsService.getUnreadCount(userId);
    return {
      success: true,
      data,
    };
  }

  @Patch(':id/read')
  @HttpCode(HttpStatus.OK)
  async markAsRead(@CurrentUser('id') userId: string, @Param('id') id: string) {
    const data = await this.notificationsService.markAsRead(userId, id);
    return {
      success: true,
      data,
    };
  }

  @Post('read-all')
  @HttpCode(HttpStatus.OK)
  async markAllAsRead(@CurrentUser('id') userId: string) {
    const data = await this.notificationsService.markAllAsRead(userId);
    return {
      success: true,
      data,
    };
  }

  @Post('mark-read')
  @HttpCode(HttpStatus.OK)
  async markAllAsReadLegacy(@CurrentUser('id') userId: string) {
    const data = await this.notificationsService.markAllAsRead(userId);
    return {
      success: true,
      data,
    };
  }
}
