import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { prisma, BookingStatus, DeliveryFormat } from '@timeswap/database';
import { CreateBookingDto, CancelBookingDto } from '@timeswap/contracts';
import { LedgerService } from '../ledger/ledger.service.js';
import { NotificationsService } from '../notifications/notifications.service.js';

@Injectable()
export class BookingsService {
  constructor(
    private readonly ledgerService: LedgerService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async createBooking(userId: string, dto: CreateBookingDto) {
    let providerId: string;
    let requesterId: string;
    let deliveryFormat: DeliveryFormat = DeliveryFormat.ONLINE;

    if (dto.service_offer_id) {
      const offer = await prisma.serviceOffer.findUnique({
        where: { id: dto.service_offer_id },
      });

      if (!offer) {
        throw new NotFoundException({
          code: 'OFFER_NOT_FOUND',
          message: 'Service offer not found.',
        });
      }

      if (offer.status !== 'PUBLISHED') {
        throw new BadRequestException({
          code: 'OFFER_NOT_AVAILABLE',
          message: 'Service offer is not currently published for booking.',
        });
      }

      providerId = offer.providerId;
      requesterId = userId;

      if (providerId === requesterId) {
        throw new BadRequestException({
          code: 'SELF_BOOKING_NOT_ALLOWED',
          message: 'You cannot book your own service offer.',
        });
      }

      deliveryFormat = offer.format;
    } else if (dto.help_request_id) {
      const request = await prisma.helpRequest.findUnique({
        where: { id: dto.help_request_id },
      });

      if (!request) {
        throw new NotFoundException({
          code: 'REQUEST_NOT_FOUND',
          message: 'Help request not found.',
        });
      }

      if (request.status !== 'OPEN') {
        throw new BadRequestException({
          code: 'REQUEST_NOT_AVAILABLE',
          message: 'Help request is no longer open for responses.',
        });
      }

      requesterId = request.requesterId;
      providerId = userId;

      if (providerId === requesterId) {
        throw new BadRequestException({
          code: 'SELF_BOOKING_NOT_ALLOWED',
          message: 'You cannot offer help on your own request.',
        });
      }

      deliveryFormat = request.preferredFormat;
    } else {
      throw new BadRequestException({
        code: 'MISSING_LISTING_REFERENCE',
        message: 'Either service_offer_id or help_request_id must be provided.',
      });
    }

    const scheduledStartTime = new Date(dto.scheduled_start_time);
    const durationMinutes = dto.duration_minutes;
    const scheduledEndTime = new Date(scheduledStartTime.getTime() + durationMinutes * 60 * 1000);
    const creditAmount = Math.max(1.0, durationMinutes / 60);

    // Ensure requester has starter credit if eligible
    await this.ledgerService.grantStarterCredit(requesterId);

    const booking = await prisma.booking.create({
      data: {
        requesterId,
        providerId,
        serviceOfferId: dto.service_offer_id || null,
        helpRequestId: dto.help_request_id || null,
        scheduledStartTime,
        scheduledEndTime,
        durationMinutes,
        creditAmount,
        status: BookingStatus.PENDING_ACCEPTANCE,
        session: {
          create: {
            deliveryFormat,
            autoSettleAt: new Date(scheduledEndTime.getTime() + 24 * 60 * 60 * 1000),
          },
        },
      },
      include: {
        serviceOffer: true,
        helpRequest: true,
        session: true,
        requester: { include: { profile: true } },
        provider: { include: { profile: true } },
      },
    });

    // Lock Escrow Credits
    await this.ledgerService.lockEscrow(requesterId, booking.id, creditAmount);

    try {
      await this.notificationsService.createNotification({
        userId: providerId,
        notificationType: 'BOOKING_REQUESTED',
        title: 'New Booking Request',
        bodyText: `${booking.requester.profile?.displayName || 'A member'} requested a ${durationMinutes} min session.`,
        actionUrl: `/bookings/${booking.id}`,
      });
    } catch (err) {
      // Non-blocking background notification safety catch
    }

    return this.formatBookingResponse(booking);
  }

  async getUserBookings(userId: string, filter?: string) {
    const where: any = {
      OR: [{ requesterId: userId }, { providerId: userId }],
    };

    if (filter === 'upcoming') {
      where.status = { in: [BookingStatus.PENDING_ACCEPTANCE, BookingStatus.CONFIRMED, BookingStatus.IN_PROGRESS] };
    } else if (filter === 'needs_attestation') {
      where.status = { in: [BookingStatus.CONFIRMED, BookingStatus.IN_PROGRESS] };
    } else if (filter === 'past') {
      where.status = { in: [BookingStatus.COMPLETED, BookingStatus.CANCELLED, BookingStatus.DISPUTED] };
    }

    const bookings = await prisma.booking.findMany({
      where,
      orderBy: { scheduledStartTime: 'desc' },
      include: {
        serviceOffer: true,
        helpRequest: true,
        session: true,
        requester: { include: { profile: true } },
        provider: { include: { profile: true } },
      },
    });

    return bookings.map((b) => this.formatBookingResponse(b));
  }

  async getBookingById(userId: string, bookingId: string) {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        serviceOffer: true,
        helpRequest: true,
        session: true,
        requester: { include: { profile: true } },
        provider: { include: { profile: true } },
      },
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
        message: 'You are not authorized to view this booking.',
      });
    }

    return this.formatBookingResponse(booking);
  }

  async acceptBooking(userId: string, bookingId: string) {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
    });

    if (!booking) {
      throw new NotFoundException({
        code: 'BOOKING_NOT_FOUND',
        message: 'Booking not found.',
      });
    }

    if (booking.providerId !== userId) {
      throw new ForbiddenException({
        code: 'FORBIDDEN_RESOURCE',
        message: 'Only the designated provider can accept this booking.',
      });
    }

    if (booking.status !== BookingStatus.PENDING_ACCEPTANCE) {
      throw new BadRequestException({
        code: 'INVALID_BOOKING_STATE_TRANSITION',
        message: `Booking cannot be accepted from state '${booking.status}'.`,
      });
    }

    const updated = await prisma.booking.update({
      where: { id: bookingId },
      data: { status: BookingStatus.CONFIRMED },
      include: {
        serviceOffer: true,
        helpRequest: true,
        session: true,
        requester: { include: { profile: true } },
        provider: { include: { profile: true } },
      },
    });

    try {
      await this.notificationsService.createNotification({
        userId: updated.requesterId,
        notificationType: 'BOOKING_CONFIRMED',
        title: 'Booking Confirmed!',
        bodyText: `${updated.provider.profile?.displayName || 'Your provider'} accepted your session request.`,
        actionUrl: `/bookings/${bookingId}`,
      });
    } catch (err) {
      // Non-blocking notification safety catch
    }

    return this.formatBookingResponse(updated);
  }

  async declineBooking(userId: string, bookingId: string) {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { escrowHold: true },
    });

    if (!booking) {
      throw new NotFoundException({
        code: 'BOOKING_NOT_FOUND',
        message: 'Booking not found.',
      });
    }

    if (booking.providerId !== userId) {
      throw new ForbiddenException({
        code: 'FORBIDDEN_RESOURCE',
        message: 'Only the designated provider can decline this booking.',
      });
    }

    if (booking.status !== BookingStatus.PENDING_ACCEPTANCE) {
      throw new BadRequestException({
        code: 'INVALID_BOOKING_STATE_TRANSITION',
        message: `Booking cannot be declined from state '${booking.status}'.`,
      });
    }

    if (booking.escrowHold && booking.escrowHold.status === 'HELD') {
      await this.ledgerService.refundEscrow(bookingId);
    }

    await prisma.booking.update({
      where: { id: bookingId },
      data: {
        status: BookingStatus.CANCELLED,
        cancelledByUserId: userId,
        cancellationType: 'PROVIDER_DECLINED',
      },
    });

    const updated = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        serviceOffer: true,
        helpRequest: true,
        session: true,
        requester: { include: { profile: true } },
        provider: { include: { profile: true } },
      },
    });

    if (updated) {
      try {
        await this.notificationsService.createNotification({
          userId: updated.requesterId,
          notificationType: 'BOOKING_CANCELLED',
          title: 'Booking Request Declined',
          bodyText: `${updated.provider.profile?.displayName || 'The provider'} declined your booking request. Your escrowed credits have been refunded.`,
          actionUrl: `/bookings/${bookingId}`,
        });
      } catch (err) {
        // Non-blocking notification catch
      }
    }

    return this.formatBookingResponse(updated);
  }

  async cancelBooking(userId: string, bookingId: string, dto?: CancelBookingDto) {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { escrowHold: true },
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
        message: 'You are not authorized to cancel this booking.',
      });
    }

    if (booking.status === BookingStatus.COMPLETED || booking.status === BookingStatus.CANCELLED) {
      throw new BadRequestException({
        code: 'INVALID_BOOKING_STATE_TRANSITION',
        message: `Cannot cancel a booking that is already '${booking.status}'.`,
      });
    }

    const hoursUntilStart = (new Date(booking.scheduledStartTime).getTime() - Date.now()) / (1000 * 3600);

    if (booking.escrowHold && booking.escrowHold.status === 'HELD') {
      if (hoursUntilStart >= 12) {
        // Early Cancellation: Full Refund to Requester
        await this.ledgerService.refundEscrow(bookingId);
      } else {
        // Late Cancellation (<12 hours)
        if (userId === booking.requesterId) {
          // Requester Late Cancellation -> Provider Indemnity
          await this.ledgerService.indemnifyProvider(bookingId);
        } else {
          // Provider Late Cancellation -> Full Refund to Requester
          await this.ledgerService.refundEscrow(bookingId);
        }
      }
    }

    const updated = await prisma.booking.update({
      where: { id: bookingId },
      data: {
        status: BookingStatus.CANCELLED,
        cancelledByUserId: userId,
        cancellationReason: dto?.cancellation_reason || null,
        cancellationType: 'USER_CANCELLED',
      },
      include: {
        serviceOffer: true,
        helpRequest: true,
        session: true,
        requester: { include: { profile: true } },
        provider: { include: { profile: true } },
      },
    });

    try {
      const recipientId = userId === updated.requesterId ? updated.providerId : updated.requesterId;
      const cancellingUserName = userId === updated.requesterId
        ? (updated.requester.profile?.displayName || 'Your exchange partner')
        : (updated.provider.profile?.displayName || 'Your exchange partner');

      await this.notificationsService.createNotification({
        userId: recipientId,
        notificationType: 'BOOKING_CANCELLED',
        title: 'Booking Cancelled',
        bodyText: `${cancellingUserName} cancelled the upcoming session.`,
        actionUrl: `/bookings/${bookingId}`,
      });
    } catch (err) {
      // Non-blocking notification catch
    }

    return this.formatBookingResponse(updated);
  }

  async attestCompletion(userId: string, bookingId: string) {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { session: true, escrowHold: true },
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
        message: 'You are not authorized to attest completion for this booking.',
      });
    }

    if (booking.status === BookingStatus.CANCELLED || booking.status === BookingStatus.COMPLETED) {
      throw new BadRequestException({
        code: 'INVALID_BOOKING_STATE_TRANSITION',
        message: `Cannot attest completion for a booking in state '${booking.status}'.`,
      });
    }

    if (booking.session) {
      const isRequester = userId === booking.requesterId;
      await prisma.session.update({
        where: { id: booking.session.id },
        data: {
          ...(isRequester ? { requesterAttestedAt: new Date() } : { providerAttestedAt: new Date() }),
        },
      });
    }

    // Settle Escrow to Provider
    if (booking.escrowHold && booking.escrowHold.status === 'HELD') {
      await this.ledgerService.settleEscrow(bookingId);
    } else {
      await prisma.booking.update({
        where: { id: bookingId },
        data: { status: BookingStatus.COMPLETED },
      });
    }

    const updated = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        serviceOffer: true,
        helpRequest: true,
        session: true,
        requester: { include: { profile: true } },
        provider: { include: { profile: true } },
      },
    });

    if (updated) {
      try {
        const recipientId = userId === updated.requesterId ? updated.providerId : updated.requesterId;
        const attesterName = userId === updated.requesterId
          ? (updated.requester.profile?.displayName || 'Your partner')
          : (updated.provider.profile?.displayName || 'Your partner');

        await this.notificationsService.createNotification({
          userId: recipientId,
          notificationType: updated.status === BookingStatus.COMPLETED ? 'SESSION_SETTLED' : 'COMPLETION_REQUIRED',
          title: updated.status === BookingStatus.COMPLETED ? 'Session Completed & Settled' : 'Session Attested',
          bodyText: updated.status === BookingStatus.COMPLETED
            ? `Session completion was attested by both parties. Time credits have been settled!`
            : `${attesterName} attested session completion. Please attest to finalize session settlement.`,
          actionUrl: `/bookings/${bookingId}`,
        });
      } catch (err) {
        // Non-blocking notification catch
      }
    }

    return this.formatBookingResponse(updated);
  }

  private formatBookingResponse(b: any) {
    const reqProfile = b.requester?.profile;
    const provProfile = b.provider?.profile;

    return {
      id: b.id,
      service_offer_id: b.serviceOfferId,
      help_request_id: b.helpRequestId,
      scheduled_start_time: b.scheduledStartTime,
      scheduled_end_time: b.scheduledEndTime,
      duration_minutes: b.durationMinutes,
      credit_amount: Number(b.creditAmount),
      status: b.status,
      cancelled_by_user_id: b.cancelledByUserId,
      cancellation_reason: b.cancellationReason,
      cancellation_type: b.cancellationType,
      created_at: b.createdAt,
      updated_at: b.updatedAt,
      listing_title: b.serviceOffer?.title || b.helpRequest?.title || 'TimeSwap Session',
      requester: reqProfile
        ? {
            id: b.requesterId,
            display_name: reqProfile.displayName,
            handle: reqProfile.handle,
            avatar_url: reqProfile.avatarUrl,
            city: reqProfile.city,
            general_district: reqProfile.generalDistrict,
          }
        : { id: b.requesterId, display_name: 'Requester' },
      provider: provProfile
        ? {
            id: b.providerId,
            display_name: provProfile.displayName,
            handle: provProfile.handle,
            avatar_url: provProfile.avatarUrl,
            city: provProfile.city,
            general_district: provProfile.generalDistrict,
          }
        : { id: b.providerId, display_name: 'Provider' },
      session: b.session
        ? {
            id: b.session.id,
            delivery_format: b.session.deliveryFormat,
            meeting_link: b.session.meetingLink,
            meeting_location_text: b.session.meetingLocationText,
            requester_attested_at: b.session.requesterAttestedAt,
            provider_attested_at: b.session.providerAttestedAt,
          }
        : null,
    };
  }
}
