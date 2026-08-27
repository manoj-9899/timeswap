import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { prisma, DisputeStatus, DisputeOutcome, BookingStatus } from '@timeswap/database';
import { CreateDisputeDto, ResolveDisputeDto } from '@timeswap/contracts';
import { LedgerService } from '../ledger/ledger.service.js';

@Injectable()
export class DisputesService {
  constructor(private readonly ledgerService: LedgerService) {}

  async createDispute(userId: string, dto: CreateDisputeDto) {
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
        message: 'Only participants in this session can file a dispute.',
      });
    }

    const existingDispute = await prisma.disputeCase.findUnique({
      where: { sessionId: session.id },
    });

    if (existingDispute) {
      throw new BadRequestException({
        code: 'DISPUTE_ALREADY_EXISTS',
        message: 'A dispute has already been filed for this session.',
      });
    }

    const respondentUserId = userId === booking.requesterId ? booking.providerId : booking.requesterId;

    const dispute = await prisma.disputeCase.create({
      data: {
        sessionId: session.id,
        initiatorUserId: userId,
        respondentUserId,
        disputeReason: dto.dispute_reason,
        evidenceText: dto.evidence_text || null,
        status: DisputeStatus.OPEN,
      },
    });

    // Mark booking status as DISPUTED to prevent auto-settlement
    await prisma.booking.update({
      where: { id: booking.id },
      data: { status: BookingStatus.DISPUTED },
    });

    return dispute;
  }

  async getDisputes(userId: string) {
    const disputes = await prisma.disputeCase.findMany({
      where: {
        OR: [{ initiatorUserId: userId }, { respondentUserId: userId }],
      },
      include: {
        session: {
          include: {
            booking: {
              include: {
                requester: { include: { profile: true } },
                provider: { include: { profile: true } },
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return disputes.map((d) => this.formatDispute(d));
  }

  async getAllDisputesForAdmin() {
    const disputes = await prisma.disputeCase.findMany({
      include: {
        session: {
          include: {
            booking: {
              include: {
                requester: { include: { profile: true } },
                provider: { include: { profile: true } },
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return disputes.map((d) => this.formatDispute(d));
  }

  async resolveDispute(moderatorId: string, disputeId: string, dto: ResolveDisputeDto) {
    const dispute = await prisma.disputeCase.findUnique({
      where: { id: disputeId },
      include: {
        session: {
          include: { booking: true },
        },
      },
    });

    if (!dispute || !dispute.session || !dispute.session.booking) {
      throw new NotFoundException({
        code: 'DISPUTE_NOT_FOUND',
        message: 'Dispute case not found.',
      });
    }

    if (dispute.status === DisputeStatus.RESOLVED) {
      throw new BadRequestException({
        code: 'DISPUTE_ALREADY_RESOLVED',
        message: 'Dispute case has already been resolved.',
      });
    }

    const bookingId = dispute.session.booking.id;

    if (dto.resolution_outcome === 'FULL_REFUND_REQUESTER') {
      await this.ledgerService.refundEscrow(bookingId);
    } else if (dto.resolution_outcome === 'FULL_RELEASE_PROVIDER') {
      await this.ledgerService.settleEscrow(bookingId);
    } else if (dto.resolution_outcome === 'SPLIT_50_50') {
      await this.ledgerService.resolveDisputeSplit(bookingId);
    }

    const updatedDispute = await prisma.disputeCase.update({
      where: { id: disputeId },
      data: {
        status: DisputeStatus.RESOLVED,
        resolutionOutcome: dto.resolution_outcome as DisputeOutcome,
        resolutionNotes: dto.resolution_notes,
        resolvedByUserId: moderatorId,
        resolvedAt: new Date(),
      },
    });

    return this.formatDispute(updatedDispute);
  }

  private formatDispute(d: any) {
    return {
      id: d.id,
      session_id: d.sessionId,
      initiator_user_id: d.initiatorUserId,
      respondent_user_id: d.respondentUserId,
      dispute_reason: d.disputeReason,
      evidence_text: d.evidenceText,
      status: d.status,
      resolution_outcome: d.resolutionOutcome,
      resolution_notes: d.resolutionNotes,
      resolved_at: d.resolvedAt,
      created_at: d.createdAt,
      booking: d.session?.booking
        ? {
            id: d.session.booking.id,
            credit_amount: Number(d.session.booking.creditAmount),
            requester_name: d.session.booking.requester?.profile?.displayName || 'Requester',
            provider_name: d.session.booking.provider?.profile?.displayName || 'Provider',
          }
        : null,
    };
  }
}
