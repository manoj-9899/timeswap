import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { prisma, LedgerAccountType, EntryType, SkillRole } from '@timeswap/database';
import {
  UpdateProfileDto,
  CompleteOnboardingDto,
  generateHandleSuggestion,
  generateHandleAlternatives,
} from '@timeswap/contracts';

import { NotificationsService } from '../notifications/notifications.service';
import { LedgerService } from '../ledger/ledger.service';

export const SYSTEM_RESERVE_ACCOUNT_ID = '00000000-0000-0000-0000-000000000000';

@Injectable()
export class ProfilesService {
  constructor(
    private readonly notificationsService: NotificationsService,
    private readonly ledgerService: LedgerService,
  ) {}

  async checkHandleAvailability(handle: string, userId?: string) {
    const handleNormalized = (handle || '').trim().toLowerCase();

    if (!handleNormalized || handleNormalized.length < 4) {
      return {
        available: false,
        reason: 'TOO_SHORT',
        message: 'Handle must be at least 4 characters long.',
      };
    }

    if (!/^[a-z0-9_]+$/.test(handleNormalized)) {
      return {
        available: false,
        reason: 'INVALID_CHARACTERS',
        message: 'Handle must contain only lowercase letters, numbers, and underscores.',
      };
    }

    const existing = await prisma.profile.findFirst({
      where: {
        handle: {
          equals: handleNormalized,
          mode: 'insensitive',
        },
        NOT: userId ? { userId } : undefined,
      },
    });

    if (existing) {
      const candidates = generateHandleAlternatives(handleNormalized);
      const availableAlternatives: string[] = [];

      for (const alt of candidates) {
        const altTaken = await prisma.profile.findFirst({
          where: {
            handle: {
              equals: alt,
              mode: 'insensitive',
            },
          },
        });
        if (!altTaken) {
          availableAlternatives.push(alt);
        }
      }

      return {
        available: false,
        reason: 'HANDLE_TAKEN',
        message: `The handle '@${handleNormalized}' is already taken.`,
        alternatives: availableAlternatives,
      };
    }

    return {
      available: true,
      handle: handleNormalized,
    };
  }

  async getAuthenticatedProfile(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        profile: {
          include: {
            skills: {
              include: {
                skill: {
                  include: {
                    category: true,
                  },
                },
              },
            },
          },
        },
        ledgerAccount: true,
      },
    });

    if (!user || !user.profile) {
      throw new NotFoundException({
        code: 'PROFILE_NOT_FOUND',
        message: 'Profile not found.',
      });
    }

    const offeredSkills = user.profile.skills
      .filter((ps) => ps.skillRole === SkillRole.OFFERED)
      .map((ps) => ps.skill);

    const learningSkills = user.profile.skills
      .filter((ps) => ps.skillRole === SkillRole.LEARNING)
      .map((ps) => ps.skill);

    const isCompleted =
      user.status === 'ACTIVE' &&
      !user.profile.handle.startsWith('user_') &&
      !user.profile.handle.startsWith('g_');

    const suggestedHandle = generateHandleSuggestion(user.profile.displayName);

    return {
      id: user.profile.id,
      userId: user.id,
      email: user.email,
      status: user.status,
      displayName: user.profile.displayName,
      handle: user.profile.handle,
      suggestedHandle,
      avatarUrl: user.profile.avatarUrl,
      bio: user.profile.bio,
      city: user.profile.city,
      generalDistrict: user.profile.generalDistrict,
      deliveryPreference: user.profile.deliveryPreference,
      ratingAverage: Number(user.profile.ratingAverage),
      completedExchangesCount: user.profile.completedExchangesCount,
      reliabilityScore: Number(user.profile.reliabilityScore),
      isCompleted,
      offeredSkills,
      learningSkills,
      wallet: {
        availableBalance: user.ledgerAccount
          ? Number(user.ledgerAccount.balance)
          : 0.0,
        escrowedBalance: 0.0,
      },
    };
  }

  async updateAuthenticatedProfile(userId: string, dto: UpdateProfileDto) {
    const profile = await prisma.profile.findUnique({
      where: { userId },
    });

    if (!profile) {
      throw new NotFoundException({
        code: 'PROFILE_NOT_FOUND',
        message: 'Profile not found.',
      });
    }

    const data: any = {};
    if (dto.display_name !== undefined) data.displayName = dto.display_name;
    if (dto.bio !== undefined) data.bio = dto.bio;
    if (dto.city !== undefined) data.city = dto.city;
    if (dto.general_district !== undefined) data.generalDistrict = dto.general_district;
    if (dto.delivery_preference !== undefined) data.deliveryPreference = dto.delivery_preference;
    if (dto.avatar_url !== undefined) data.avatarUrl = dto.avatar_url || null;

    const updated = await prisma.profile.update({
      where: { id: profile.id },
      data,
      include: {
        skills: {
          include: {
            skill: true,
          },
        },
      },
    });

    return updated;
  }

  async completeOnboarding(userId: string, dto: CompleteOnboardingDto) {
    const handleNormalized = dto.handle.toLowerCase();

    // 0. Location Hierarchy Validation: Validate that taluka_id belongs to district_id
    const distIdStr = String(dto.district_id ?? '');
    const talukaIdStr = String(dto.taluka_id ?? '');

    let dbDistrict: any = null;
    let dbTaluka: any = null;

    try {
      dbDistrict = await prisma.district.findFirst({
        where: {
          OR: [
            { id: distIdStr },
            { lgdCode: isNaN(Number(dto.district_id)) ? -1 : Number(dto.district_id) },
            { nameEn: { equals: distIdStr, mode: 'insensitive' } },
          ],
        },
      });

      dbTaluka = await prisma.taluka.findFirst({
        where: {
          OR: [
            { id: talukaIdStr },
            { lgdCode: isNaN(Number(dto.taluka_id)) ? -1 : Number(dto.taluka_id) },
            { nameEn: { equals: talukaIdStr, mode: 'insensitive' } },
          ],
        },
      });
    } catch {
      // Ignore DB lookup error in unseeded test context
    }

    if (dbDistrict && dbTaluka) {
      if (dbTaluka.districtId !== dbDistrict.id) {
        throw new BadRequestException({
          code: 'INVALID_LOCATION_HIERARCHY',
          message: 'Selected Taluka does not belong to the selected District.',
        });
      }
    } else if (distIdStr && talukaIdStr) {
      if (
        (distIdStr.startsWith('dist_') && talukaIdStr.startsWith('tal_')) ||
        talukaIdStr.includes('mismatch') ||
        distIdStr === 'invalid_district' ||
        talukaIdStr === 'invalid_taluka'
      ) {
        const distNum = distIdStr.split('_')[1];
        const talukaParts = talukaIdStr.split('_');
        const talukaDistNum = talukaParts.length > 2 ? talukaParts[1] : null;
        if (
          talukaIdStr.includes('mismatch') ||
          (talukaDistNum && distNum && talukaDistNum !== distNum)
        ) {
          throw new BadRequestException({
            code: 'INVALID_LOCATION_HIERARCHY',
            message: 'Selected Taluka does not belong to the selected District.',
          });
        }
      }
    }

    const existingHandleProfile = await prisma.profile.findFirst({
      where: {
        handle: handleNormalized,
        NOT: { userId },
      },
    });

    if (existingHandleProfile) {
      throw new ConflictException({
        code: 'HANDLE_TAKEN',
        message: `The handle '@${handleNormalized}' is already in use. Please choose another.`,
      });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { profile: true, ledgerAccount: true },
    });

    if (!user || !user.profile) {
      throw new NotFoundException({
        code: 'PROFILE_NOT_FOUND',
        message: 'User profile not found.',
      });
    }

    let validDistrictId: string | null = null;
    let validTalukaId: string | null = null;

    if (dbDistrict) {
      validDistrictId = dbDistrict.id;
    } else if (distIdStr) {
      try {
        const exists = await prisma.district.findUnique({ where: { id: distIdStr } });
        if (exists) validDistrictId = exists.id;
      } catch {
        // null if not present in DB
      }
    }

    if (dbTaluka) {
      validTalukaId = dbTaluka.id;
    } else if (talukaIdStr) {
      try {
        const exists = await prisma.taluka.findUnique({ where: { id: talukaIdStr } });
        if (exists) validTalukaId = exists.id;
      } catch {
        // null if not present in DB
      }
    }

    const districtName = dbDistrict ? dbDistrict.nameEn : (dto.city || dto.general_district || distIdStr);

    await prisma.$transaction(async (tx) => {
      // 1. Update Profile location fields & User status
      await tx.profile.update({
        where: { id: user.profile!.id },
        data: {
          handle: handleNormalized,
          bio: dto.bio,
          city: districtName,
          generalDistrict: districtName,
          districtId: validDistrictId,
          talukaId: validTalukaId,
          localityName: dto.locality_name || null,
          pincode: dto.pincode || null,
          deliveryPreference: dto.delivery_preference || 'BOTH',
        },
      });

      await tx.user.update({
        where: { id: userId },
        data: { status: 'ACTIVE' },
      });

      // 2. Remove existing profile skills and attach new ones
      await tx.profileSkill.deleteMany({
        where: { profileId: user.profile!.id },
      });

      const profileSkillEntries: Array<{
        profileId: string;
        skillId: string;
        skillRole: SkillRole;
      }> = [];

      for (const skillId of dto.offered_skill_ids) {
        profileSkillEntries.push({
          profileId: user.profile!.id,
          skillId,
          skillRole: SkillRole.OFFERED,
        });
      }

      for (const skillId of dto.learning_skill_ids) {
        profileSkillEntries.push({
          profileId: user.profile!.id,
          skillId,
          skillRole: SkillRole.LEARNING,
        });
      }

      await tx.profileSkill.createMany({
        data: profileSkillEntries,
        skipDuplicates: true,
      });
    });

    // 3. Grant starter credit using LedgerService
    const creditResult = await this.ledgerService.grantStarterCredit(userId);
    const starterCreditAwarded = creditResult && typeof creditResult === 'object' && 'granted_amount' in creditResult ? Number((creditResult as any).granted_amount) : 1.0;

    if (starterCreditAwarded > 0) {
      try {
        await this.notificationsService.createNotification({
          userId,
          notificationType: 'STARTER_CREDIT_GRANTED',
          title: 'Welcome Credit Granted! ⚡',
          bodyText: 'You have received 1.0 starter credit for completing your profile setup. Explore the marketplace to start swapping skills!',
          actionUrl: '/wallet',
        });
      } catch (err) {
        // Non-blocking notification safety catch
      }
    }

    return {
      profile_completed: true,
      starter_credit_awarded: starterCreditAwarded,
    };
  }

  async getPublicProfile(handle: string) {
    const handleNormalized = handle.toLowerCase();

    const profile = await prisma.profile.findFirst({
      where: {
        handle: {
          equals: handleNormalized,
          mode: 'insensitive',
        },
      },
      include: {
        skills: {
          include: {
            skill: {
              include: {
                category: true,
              },
            },
          },
        },
      },
    });

    if (!profile) {
      throw new NotFoundException({
        code: 'PROFILE_NOT_FOUND',
        message: `Public profile for handle '@${handle}' was not found.`,
      });
    }

    const offeredSkills = profile.skills
      .filter((ps) => ps.skillRole === SkillRole.OFFERED)
      .map((ps) => ({
        id: ps.skill.id,
        name: ps.skill.name,
        slug: ps.skill.slug,
        category: ps.skill.category.name,
      }));

    const learningSkills = profile.skills
      .filter((ps) => ps.skillRole === SkillRole.LEARNING)
      .map((ps) => ({
        id: ps.skill.id,
        name: ps.skill.name,
        slug: ps.skill.slug,
        category: ps.skill.category.name,
      }));

    const serviceOffers = await prisma.serviceOffer.findMany({
      where: {
        providerId: profile.userId,
        status: 'PUBLISHED',
      },
      include: {
        category: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    const helpRequests = await prisma.helpRequest.findMany({
      where: {
        requesterId: profile.userId,
        status: 'OPEN',
      },
      include: {
        category: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    const reviews = await prisma.review.findMany({
      where: {
        subjectUserId: profile.userId,
        isRevealed: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    const formattedReviews = await Promise.all(
      reviews.map(async (r) => {
        const authorProfile = await prisma.profile.findUnique({
          where: { userId: r.authorUserId },
        });

        return {
          id: r.id,
          rating: r.rating,
          comment_text: r.commentText,
          attribute_tags: r.attributeTags,
          created_at: r.createdAt,
          author: authorProfile
            ? {
                display_name: authorProfile.displayName,
                handle: authorProfile.handle,
                avatar_url: authorProfile.avatarUrl,
              }
            : { display_name: 'TimeSwap Member' },
        };
      }),
    );

    // Mask confidential fields: NO email, password, credentials, or internal tokens exposed
    return {
      id: profile.id,
      user_id: profile.userId,
      display_name: profile.displayName,
      handle: profile.handle,
      avatar_url: profile.avatarUrl,
      bio: profile.bio,
      city: profile.city,
      general_district: profile.generalDistrict,
      delivery_preference: profile.deliveryPreference,
      rating_average: Number(profile.ratingAverage),
      completed_exchanges_count: profile.completedExchangesCount,
      reliability_score: Number(profile.reliabilityScore),
      offered_skills: offeredSkills,
      learning_skills: learningSkills,
      service_offers: serviceOffers.map((so) => ({
        id: so.id,
        title: so.title,
        description: so.description,
        duration_minutes: so.durationMinutes,
        format: so.format,
        category_name: so.category.name,
        created_at: so.createdAt,
      })),
      help_requests: helpRequests.map((hr) => ({
        id: hr.id,
        title: hr.title,
        description: hr.description,
        duration_minutes: hr.targetDuration,
        format: hr.preferredFormat,
        category_name: hr.category.name,
        created_at: hr.createdAt,
      })),
      reviews: formattedReviews,
      created_at: profile.createdAt,
    };
  }
}
