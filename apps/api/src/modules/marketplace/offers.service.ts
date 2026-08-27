import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { prisma, ServiceOfferStatus, DeliveryFormat } from '@timeswap/database';
import { CreateOfferDto, UpdateOfferDto } from '@timeswap/contracts';

@Injectable()
export class OffersService {
  async createOffer(userId: string, dto: CreateOfferDto) {
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

    const primaryDuration = dto.supported_durations.includes(60) ? 60 : 30;

    const offer = await prisma.serviceOffer.create({
      data: {
        providerId: userId,
        categoryId: dto.category_id,
        title: dto.title,
        description: dto.description,
        durationMinutes: primaryDuration,
        format: dto.delivery_format as DeliveryFormat,
        city,
        generalDistrict,
        status: ServiceOfferStatus.PUBLISHED,
      },
      include: {
        category: true,
        provider: {
          include: {
            profile: true,
          },
        },
      },
    });

    return this.formatOfferResponse(offer);
  }

  async getOfferById(id: string) {
    const offer = await prisma.serviceOffer.findUnique({
      where: { id },
      include: {
        category: true,
        provider: {
          include: {
            profile: true,
          },
        },
      },
    });

    if (!offer) {
      throw new NotFoundException({
        code: 'OFFER_NOT_FOUND',
        message: 'Service offer not found.',
      });
    }

    return this.formatOfferResponse(offer);
  }

  async updateOffer(userId: string, id: string, dto: UpdateOfferDto) {
    const offer = await prisma.serviceOffer.findUnique({
      where: { id },
    });

    if (!offer) {
      throw new NotFoundException({
        code: 'OFFER_NOT_FOUND',
        message: 'Service offer not found.',
      });
    }

    if (offer.providerId !== userId) {
      throw new ForbiddenException({
        code: 'FORBIDDEN_RESOURCE',
        message: 'You are not authorized to modify this service offer.',
      });
    }

    const data: any = {};
    if (dto.title !== undefined) data.title = dto.title;
    if (dto.description !== undefined) data.description = dto.description;
    if (dto.category_id !== undefined) data.categoryId = dto.category_id;
    if (dto.delivery_format !== undefined) data.format = dto.delivery_format as DeliveryFormat;
    if (dto.city !== undefined) data.city = dto.city;
    if (dto.general_district !== undefined) data.generalDistrict = dto.general_district;
    if (dto.supported_durations !== undefined && dto.supported_durations.length > 0) {
      data.durationMinutes = dto.supported_durations.includes(60) ? 60 : 30;
    }

    const updated = await prisma.serviceOffer.update({
      where: { id },
      data,
      include: {
        category: true,
        provider: {
          include: {
            profile: true,
          },
        },
      },
    });

    return this.formatOfferResponse(updated);
  }

  async pauseOffer(userId: string, id: string) {
    return this.changeStatus(userId, id, ServiceOfferStatus.PAUSED);
  }

  async publishOffer(userId: string, id: string) {
    return this.changeStatus(userId, id, ServiceOfferStatus.PUBLISHED);
  }

  async archiveOffer(userId: string, id: string) {
    return this.changeStatus(userId, id, ServiceOfferStatus.ARCHIVED);
  }

  async getUserOffers(userId: string) {
    const offers = await prisma.serviceOffer.findMany({
      where: { providerId: userId },
      orderBy: { createdAt: 'desc' },
      include: {
        category: true,
        provider: {
          include: {
            profile: true,
          },
        },
      },
    });

    return offers.map((offer) => this.formatOfferResponse(offer));
  }

  private async changeStatus(userId: string, id: string, status: ServiceOfferStatus) {
    const offer = await prisma.serviceOffer.findUnique({
      where: { id },
    });

    if (!offer) {
      throw new NotFoundException({
        code: 'OFFER_NOT_FOUND',
        message: 'Service offer not found.',
      });
    }

    if (offer.providerId !== userId) {
      throw new ForbiddenException({
        code: 'FORBIDDEN_RESOURCE',
        message: 'You are not authorized to modify this service offer status.',
      });
    }

    const updated = await prisma.serviceOffer.update({
      where: { id },
      data: { status },
      include: {
        category: true,
        provider: {
          include: {
            profile: true,
          },
        },
      },
    });

    return this.formatOfferResponse(updated);
  }

  private formatOfferResponse(offer: any) {
    const profile = offer.provider?.profile;
    return {
      id: offer.id,
      title: offer.title,
      description: offer.description,
      duration_minutes: offer.durationMinutes,
      supported_durations: offer.durationMinutes === 60 ? [30, 60] : [30],
      delivery_format: offer.format,
      city: offer.city,
      general_district: offer.generalDistrict,
      status: offer.status,
      created_at: offer.createdAt,
      updated_at: offer.updatedAt,
      category: {
        id: offer.category.id,
        name: offer.category.name,
        slug: offer.category.slug,
      },
      provider: profile
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
