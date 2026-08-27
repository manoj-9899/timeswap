import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { prisma, HelpRequestStatus, DeliveryFormat } from '@timeswap/database';
import {
  CreateHelpRequestDto,
  UpdateHelpRequestDto,
  SubmitProposalDto,
} from '@timeswap/contracts';

@Injectable()
export class RequestsService {
  async createHelpRequest(userId: string, dto: CreateHelpRequestDto) {
    const category = await prisma.skillCategory.findUnique({
      where: { id: dto.category_id },
    });

    if (!category) {
      throw new NotFoundException({
        code: 'CATEGORY_NOT_FOUND',
        message: 'Skill category not found.',
      });
    }

    const userProfile = await prisma.profile.findUnique({
      where: { userId },
    });

    const city = dto.city || userProfile?.city || 'Online';
    const generalDistrict = dto.general_district || userProfile?.generalDistrict || 'Global';

    const helpRequest = await prisma.helpRequest.create({
      data: {
        requesterId: userId,
        categoryId: dto.category_id,
        title: dto.title,
        description: dto.description,
        targetDuration: dto.target_duration,
        preferredFormat: dto.preferred_format as DeliveryFormat,
        urgency: dto.urgency || 'FLEXIBLE',
        city,
        generalDistrict,
        status: HelpRequestStatus.OPEN,
      },
      include: {
        category: true,
        requester: {
          include: {
            profile: true,
          },
        },
      },
    });

    return this.formatRequestResponse(helpRequest);
  }

  async getRequestById(id: string) {
    const helpRequest = await prisma.helpRequest.findUnique({
      where: { id },
      include: {
        category: true,
        requester: {
          include: {
            profile: true,
          },
        },
      },
    });

    if (!helpRequest) {
      throw new NotFoundException({
        code: 'REQUEST_NOT_FOUND',
        message: 'Help request not found.',
      });
    }

    return this.formatRequestResponse(helpRequest);
  }

  async updateHelpRequest(userId: string, id: string, dto: UpdateHelpRequestDto) {
    const helpRequest = await prisma.helpRequest.findUnique({
      where: { id },
    });

    if (!helpRequest) {
      throw new NotFoundException({
        code: 'REQUEST_NOT_FOUND',
        message: 'Help request not found.',
      });
    }

    if (helpRequest.requesterId !== userId) {
      throw new ForbiddenException({
        code: 'FORBIDDEN_RESOURCE',
        message: 'You are not authorized to modify this help request.',
      });
    }

    const data: any = {};
    if (dto.title !== undefined) data.title = dto.title;
    if (dto.description !== undefined) data.description = dto.description;
    if (dto.category_id !== undefined) data.categoryId = dto.category_id;
    if (dto.target_duration !== undefined) data.targetDuration = dto.target_duration;
    if (dto.preferred_format !== undefined) data.preferredFormat = dto.preferred_format as DeliveryFormat;
    if (dto.urgency !== undefined) data.urgency = dto.urgency;
    if (dto.city !== undefined) data.city = dto.city;
    if (dto.general_district !== undefined) data.generalDistrict = dto.general_district;

    const updated = await prisma.helpRequest.update({
      where: { id },
      data,
      include: {
        category: true,
        requester: {
          include: {
            profile: true,
          },
        },
      },
    });

    return this.formatRequestResponse(updated);
  }

  async closeHelpRequest(userId: string, id: string) {
    const helpRequest = await prisma.helpRequest.findUnique({
      where: { id },
    });

    if (!helpRequest) {
      throw new NotFoundException({
        code: 'REQUEST_NOT_FOUND',
        message: 'Help request not found.',
      });
    }

    if (helpRequest.requesterId !== userId) {
      throw new ForbiddenException({
        code: 'FORBIDDEN_RESOURCE',
        message: 'You are not authorized to close this help request.',
      });
    }

    const updated = await prisma.helpRequest.update({
      where: { id },
      data: { status: HelpRequestStatus.CLOSED },
      include: {
        category: true,
        requester: {
          include: {
            profile: true,
          },
        },
      },
    });

    return this.formatRequestResponse(updated);
  }

  async getUserRequests(userId: string) {
    const requests = await prisma.helpRequest.findMany({
      where: { requesterId: userId },
      orderBy: { createdAt: 'desc' },
      include: {
        category: true,
        requester: {
          include: {
            profile: true,
          },
        },
      },
    });

    return requests.map((req) => this.formatRequestResponse(req));
  }

  async submitProposal(providerUserId: string, requestId: string, dto: SubmitProposalDto) {
    const helpRequest = await prisma.helpRequest.findUnique({
      where: { id: requestId },
    });

    if (!helpRequest) {
      throw new NotFoundException({
        code: 'REQUEST_NOT_FOUND',
        message: 'Help request not found.',
      });
    }

    if (helpRequest.requesterId === providerUserId) {
      throw new ForbiddenException({
        code: 'CANNOT_PROPOSE_TO_SELF',
        message: 'You cannot submit a proposal to your own help request.',
      });
    }

    if (helpRequest.status !== HelpRequestStatus.OPEN) {
      throw new BadRequestException({
        code: 'REQUEST_NOT_OPEN',
        message: 'This help request is no longer open for proposals.',
      });
    }

    // Create or find message thread between provider and requester
    let thread = await prisma.messageThread.findFirst({
      where: {
        OR: [
          { participantOneId: providerUserId, participantTwoId: helpRequest.requesterId },
          { participantOneId: helpRequest.requesterId, participantTwoId: providerUserId },
        ],
      },
    });

    if (!thread) {
      thread = await prisma.messageThread.create({
        data: {
          participantOneId: providerUserId,
          participantTwoId: helpRequest.requesterId,
          listingId: requestId,
        },
      });
    }

    // Send introductory proposal message in chat thread
    const proposalContent = `[PROPOSAL OFFER] Proposed Time: ${dto.proposed_start_time} (${dto.duration_minutes} min)\n\n${dto.message}`;
    await prisma.message.create({
      data: {
        threadId: thread.id,
        senderUserId: providerUserId,
        contentText: proposalContent,
      },
    });

    return {
      proposal_submitted: true,
      thread_id: thread.id,
      message: 'Proposal successfully submitted to requester.',
    };
  }

  private formatRequestResponse(req: any) {
    const profile = req.requester?.profile;
    return {
      id: req.id,
      title: req.title,
      description: req.description,
      target_duration: req.targetDuration,
      preferred_format: req.preferredFormat,
      urgency: req.urgency,
      city: req.city,
      general_district: req.generalDistrict,
      status: req.status,
      created_at: req.createdAt,
      updated_at: req.updatedAt,
      category: {
        id: req.category.id,
        name: req.category.name,
        slug: req.category.slug,
      },
      requester: profile
        ? {
            id: profile.id,
            display_name: profile.displayName,
            handle: profile.handle,
            avatar_url: profile.avatarUrl,
            city: profile.city,
            general_district: profile.generalDistrict,
            rating_average: Number(profile.ratingAverage),
            completed_exchanges_count: profile.completedExchangesCount,
            reliability_score: Number(profile.reliabilityScore),
          }
        : null,
    };
  }
}
