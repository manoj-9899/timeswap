import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  UsePipes,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { SessionAuthGuard } from '../../common/guards/session-auth.guard.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe.js';
import { BookingsService } from './bookings.service.js';
import { createBookingSchema, cancelBookingSchema, CreateBookingDto, CancelBookingDto } from '@timeswap/contracts';

@Controller('bookings')
@UseGuards(SessionAuthGuard)
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UsePipes(new ZodValidationPipe(createBookingSchema))
  async createBooking(@CurrentUser('id') userId: string, @Body() dto: CreateBookingDto) {
    const booking = await this.bookingsService.createBooking(userId, dto);
    return {
      success: true,
      data: booking,
    };
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  async getUserBookings(@CurrentUser('id') userId: string, @Query('status') filter?: string) {
    const bookings = await this.bookingsService.getUserBookings(userId, filter);
    return {
      success: true,
      data: bookings,
    };
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  async getBookingById(@CurrentUser('id') userId: string, @Param('id') id: string) {
    const booking = await this.bookingsService.getBookingById(userId, id);
    return {
      success: true,
      data: booking,
    };
  }

  @Post(':id/accept')
  @HttpCode(HttpStatus.OK)
  async acceptBooking(@CurrentUser('id') userId: string, @Param('id') id: string) {
    const booking = await this.bookingsService.acceptBooking(userId, id);
    return {
      success: true,
      data: booking,
    };
  }

  @Post(':id/decline')
  @HttpCode(HttpStatus.OK)
  async declineBooking(@CurrentUser('id') userId: string, @Param('id') id: string) {
    const booking = await this.bookingsService.declineBooking(userId, id);
    return {
      success: true,
      data: booking,
    };
  }

  @Post(':id/cancel')
  @HttpCode(HttpStatus.OK)
  async cancelBooking(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Body() body?: any,
  ) {
    const validatedDto = body && Object.keys(body).length > 0 ? cancelBookingSchema.parse(body) : undefined;
    const booking = await this.bookingsService.cancelBooking(userId, id, validatedDto);
    return {
      success: true,
      data: booking,
    };
  }

  @Post(':id/attest-completion')
  @HttpCode(HttpStatus.OK)
  async attestCompletion(@CurrentUser('id') userId: string, @Param('id') id: string) {
    const booking = await this.bookingsService.attestCompletion(userId, id);
    return {
      success: true,
      data: booking,
    };
  }
}
