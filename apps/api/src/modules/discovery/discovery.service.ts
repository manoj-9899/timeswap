import { Injectable } from '@nestjs/common';
import { prisma, ServiceOfferStatus, HelpRequestStatus, DeliveryFormat, Prisma } from '@timeswap/database';
import {
  DiscoveryOfferQueryDto,
  DiscoveryRequestQueryDto,
  DiscoveryMemberQueryDto,
} from '@timeswap/contracts';

@Injectable()
export class DiscoveryService {
  async searchOffers(query: DiscoveryOfferQueryDto) {
    const {
      q,
      category_id,
      delivery_format,
      duration,
      min_duration,
      max_duration,
      city,
      general_district,
      page = 1,
      limit = 10,
    } = query;

    const skip = (page - 1) * limit;

    const where: Prisma.ServiceOfferWhereInput = {
      status: ServiceOfferStatus.PUBLISHED,
    };

    if (category_id) {
      where.categoryId = category_id;
    }

    if (delivery_format) {
      where.format = delivery_format as DeliveryFormat;
    }

    if (duration) {
      where.durationMinutes = duration;
    } else if (min_duration || max_duration) {
      where.durationMinutes = {
        ...(min_duration ? { gte: min_duration } : {}),
        ...(max_duration ? { lte: max_duration } : {}),
      };
    }

    if (city) {
      where.city = { contains: city, mode: 'insensitive' };
    }

    if (general_district) {
      where.generalDistrict = { contains: general_district, mode: 'insensitive' };
    }

    if (q && q.trim().length > 0) {
      const searchTerm = q.trim();
      where.OR = [
        { title: { contains: searchTerm, mode: 'insensitive' } },
        { description: { contains: searchTerm, mode: 'insensitive' } },
        { category: { name: { contains: searchTerm, mode: 'insensitive' } } },
        { provider: { profile: { displayName: { contains: searchTerm, mode: 'insensitive' } } } },
        { provider: { profile: { handle: { contains: searchTerm, mode: 'insensitive' } } } },
      ];
    }

    const [total, offers] = await Promise.all([
      prisma.serviceOffer.count({ where }),
      prisma.serviceOffer.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          category: true,
          provider: {
            include: {
              profile: true,
            },
          },
        },
      }),
    ]);

    const items = offers.map((offer) => {
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
    });

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  async searchRequests(query: DiscoveryRequestQueryDto) {
    const {
      q,
      category_id,
      preferred_format,
      target_duration,
      urgency,
      city,
      general_district,
      page = 1,
      limit = 10,
    } = query;

    const skip = (page - 1) * limit;

    const where: Prisma.HelpRequestWhereInput = {
      status: HelpRequestStatus.OPEN,
    };

    if (category_id) {
      where.categoryId = category_id;
    }

    if (preferred_format) {
      where.preferredFormat = preferred_format as DeliveryFormat;
    }

    if (target_duration) {
      where.targetDuration = target_duration;
    }

    if (urgency) {
      where.urgency = urgency;
    }

    if (city) {
      where.city = { contains: city, mode: 'insensitive' };
    }

    if (general_district) {
      where.generalDistrict = { contains: general_district, mode: 'insensitive' };
    }

    if (q && q.trim().length > 0) {
      const searchTerm = q.trim();
      where.OR = [
        { title: { contains: searchTerm, mode: 'insensitive' } },
        { description: { contains: searchTerm, mode: 'insensitive' } },
        { category: { name: { contains: searchTerm, mode: 'insensitive' } } },
        { requester: { profile: { displayName: { contains: searchTerm, mode: 'insensitive' } } } },
        { requester: { profile: { handle: { contains: searchTerm, mode: 'insensitive' } } } },
      ];
    }

    const [total, requests] = await Promise.all([
      prisma.helpRequest.count({ where }),
      prisma.helpRequest.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          category: true,
          requester: {
            include: {
              profile: true,
            },
          },
        },
      }),
    ]);

    const items = requests.map((request) => {
      const profile = request.requester?.profile;
      return {
        id: request.id,
        title: request.title,
        description: request.description,
        target_duration_minutes: request.targetDuration,
        delivery_format: request.preferredFormat,
        urgency_tag: request.urgency,
        city: request.city,
        general_district: request.generalDistrict,
        status: request.status,
        created_at: request.createdAt,
        updated_at: request.updatedAt,
        category: {
          id: request.category.id,
          name: request.category.name,
          slug: request.category.slug,
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
    });

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  async searchMembers(query: DiscoveryMemberQueryDto) {
    const {
      q,
      skill_id,
      role,
      delivery_preference,
      city,
      general_district,
      page = 1,
      limit = 10,
    } = query;

    const skip = (page - 1) * limit;

    const where: Prisma.ProfileWhereInput = {};

    if (delivery_preference) {
      where.deliveryPreference = delivery_preference as DeliveryFormat;
    }

    if (city) {
      where.city = { contains: city, mode: 'insensitive' };
    }

    if (general_district) {
      where.generalDistrict = { contains: general_district, mode: 'insensitive' };
    }

    if (skill_id) {
      where.skills = {
        some: {
          skillId: skill_id,
          ...(role ? { skillRole: role as any } : {}),
        },
      };
    }

    if (q && q.trim().length > 0) {
      const searchTerm = q.trim();
      where.OR = [
        { displayName: { contains: searchTerm, mode: 'insensitive' } },
        { handle: { contains: searchTerm, mode: 'insensitive' } },
        { bio: { contains: searchTerm, mode: 'insensitive' } },
        { city: { contains: searchTerm, mode: 'insensitive' } },
        { generalDistrict: { contains: searchTerm, mode: 'insensitive' } },
        {
          skills: {
            some: {
              skill: {
                name: { contains: searchTerm, mode: 'insensitive' },
              },
            },
          },
        },
      ];
    }

    const [total, profiles] = await Promise.all([
      prisma.profile.count({ where }),
      prisma.profile.findMany({
        where,
        skip,
        take: limit,
        orderBy: { completedExchangesCount: 'desc' },
        include: {
          skills: {
            include: {
              skill: true,
            },
          },
        },
      }),
    ]);

    const items = profiles.map((p) => ({
      id: p.id,
      user_id: p.userId,
      display_name: p.displayName,
      handle: p.handle,
      avatar_url: p.avatarUrl,
      bio: p.bio,
      city: p.city,
      general_district: p.generalDistrict,
      delivery_preference: p.deliveryPreference,
      rating_average: Number(p.ratingAverage),
      completed_exchanges_count: p.completedExchangesCount,
      reliability_score: Number(p.reliabilityScore),
      offered_skills: p.skills
        .filter((s) => s.skillRole === 'OFFERED')
        .map((s) => ({ id: s.skill.id, name: s.skill.name })),
      learning_skills: p.skills
        .filter((s) => s.skillRole === 'LEARNING')
        .map((s) => ({ id: s.skill.id, name: s.skill.name })),
    }));

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }
}
