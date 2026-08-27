import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { prisma, LedgerAccountType, EntryType, SkillRole } from '@timeswap/database';
import { UpdateProfileDto, CompleteOnboardingDto } from '@timeswap/contracts';

export const SYSTEM_RESERVE_ACCOUNT_ID = '00000000-0000-0000-0000-000000000000';

@Injectable()
export class ProfilesService {
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
      user.status === 'ACTIVE' && !user.profile.handle.startsWith('user_');

    return {
      id: user.profile.id,
      userId: user.id,
      email: user.email,
      status: user.status,
      displayName: user.profile.displayName,
      handle: user.profile.handle,
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

    let starterCreditAwarded = 0.0;

    await prisma.$transaction(async (tx) => {
      // 1. Update Profile & User status
      await tx.profile.update({
        where: { id: user.profile!.id },
        data: {
          handle: handleNormalized,
          bio: dto.bio,
          city: dto.city,
          generalDistrict: dto.general_district,
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

      // 3. Check / Ensure User Wallet
      let userWallet = await tx.ledgerAccount.findUnique({
        where: { userId },
      });

      if (!userWallet) {
        userWallet = await tx.ledgerAccount.create({
          data: {
            userId,
            accountType: LedgerAccountType.USER_WALLET,
            balance: 0.0,
          },
        });
      }

      // 4. Check if onboarding grant already awarded
      const existingGrant = await tx.ledgerTransaction.findFirst({
        where: {
          transactionType: 'ONBOARDING_GRANT',
          journalEntries: {
            some: {
              accountId: userWallet.id,
            },
          },
        },
      });

      if (!existingGrant) {
        // Ensure SYSTEM_RESERVE account exists
        let systemReserve = await tx.ledgerAccount.findUnique({
          where: { id: SYSTEM_RESERVE_ACCOUNT_ID },
        });

        if (!systemReserve) {
          systemReserve = await tx.ledgerAccount.create({
            data: {
              id: SYSTEM_RESERVE_ACCOUNT_ID,
              accountType: LedgerAccountType.SYSTEM_RESERVE,
              balance: 1000000.0,
            },
          });
        }

        // Create Ledger Transaction for Onboarding Grant ($1.00 credit)
        const ledgerTx = await tx.ledgerTransaction.create({
          data: {
            transactionType: 'ONBOARDING_GRANT',
          },
        });

        // Debit SYSTEM_RESERVE, Credit USER_WALLET
        await tx.journalEntry.createMany({
          data: [
            {
              transactionId: ledgerTx.id,
              accountId: SYSTEM_RESERVE_ACCOUNT_ID,
              entryType: EntryType.DEBIT,
              amount: 1.0,
            },
            {
              transactionId: ledgerTx.id,
              accountId: userWallet.id,
              entryType: EntryType.CREDIT,
              amount: 1.0,
            },
          ],
        });

        // Update user wallet balance
        await tx.ledgerAccount.update({
          where: { id: userWallet.id },
          data: {
            balance: {
              increment: 1.0,
            },
          },
        });

        starterCreditAwarded = 1.0;
      }
    });

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
        duration_minutes: hr.durationMinutes,
        format: hr.format,
        category_name: hr.category.name,
        created_at: hr.createdAt,
      })),
      reviews: formattedReviews,
      created_at: profile.createdAt,
    };
  }
}
