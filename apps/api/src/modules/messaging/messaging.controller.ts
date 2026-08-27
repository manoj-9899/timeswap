import { Controller, Get, Post, Param, Body, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { SessionAuthGuard } from '../../common/guards/session-auth.guard.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { MessagingService } from './messaging.service.js';

@Controller('messages')
@UseGuards(SessionAuthGuard)
export class MessagingController {
  constructor(private readonly messagingService: MessagingService) {}

  @Get('threads')
  @HttpCode(HttpStatus.OK)
  async getUserThreads(@CurrentUser('id') userId: string) {
    const threads = await this.messagingService.getUserThreads(userId);
    return {
      success: true,
      data: threads,
    };
  }

  @Get('booking/:bookingId')
  @HttpCode(HttpStatus.OK)
  async getThreadForBooking(
    @CurrentUser('id') userId: string,
    @Param('bookingId') bookingId: string,
  ) {
    const thread = await this.messagingService.getOrCreateThreadForBooking(userId, bookingId);
    return {
      success: true,
      data: thread,
    };
  }

  @Get('threads/:id')
  @HttpCode(HttpStatus.OK)
  async getThreadById(
    @CurrentUser('id') userId: string,
    @Param('id') threadId: string,
  ) {
    const thread = await this.messagingService.getThreadById(userId, threadId);
    return {
      success: true,
      data: thread,
    };
  }

  @Post('threads/:id/messages')
  @HttpCode(HttpStatus.CREATED)
  async sendMessage(
    @CurrentUser('id') userId: string,
    @Param('id') threadId: string,
    @Body('content_text') contentText: string,
  ) {
    const message = await this.messagingService.sendMessage(userId, threadId, contentText);
    return {
      success: true,
      data: message,
    };
  }
}
