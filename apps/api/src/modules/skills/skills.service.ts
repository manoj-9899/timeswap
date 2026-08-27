import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { prisma } from '@timeswap/database';
import { SkillRole } from '@timeswap/types';

@Injectable()
export class SkillsService {
  async getCategories() {
    return prisma.skillCategory.findMany({
      orderBy: { name: 'asc' },
      include: {
        skills: {
          orderBy: { name: 'asc' },
        },
      },
    });
  }

  async listSkills(categoryId?: string, search?: string) {
    const where: any = {};
    if (categoryId) {
      where.categoryId = categoryId;
    }
    if (search && search.trim() !== '') {
      where.name = {
        contains: search.trim(),
        mode: 'insensitive',
      };
    }

    return prisma.skill.findMany({
      where,
      orderBy: { name: 'asc' },
      include: {
        category: {
          select: { id: true, name: true, slug: true },
        },
      },
    });
  }

  async attachSkillToProfile(userId: string, skillId: string, role: SkillRole) {
    const profile = await prisma.profile.findUnique({
      where: { userId },
    });

    if (!profile) {
      throw new NotFoundException({
        code: 'PROFILE_NOT_FOUND',
        message: 'User profile not found.',
      });
    }

    const skill = await prisma.skill.findUnique({
      where: { id: skillId },
    });

    if (!skill) {
      throw new NotFoundException({
        code: 'SKILL_NOT_FOUND',
        message: 'Skill does not exist.',
      });
    }

    const existing = await prisma.profileSkill.findUnique({
      where: {
        profileId_skillId_skillRole: {
          profileId: profile.id,
          skillId,
          skillRole: role,
        },
      },
    });

    if (existing) {
      return existing;
    }

    return prisma.profileSkill.create({
      data: {
        profileId: profile.id,
        skillId,
        skillRole: role,
      },
    });
  }

  async removeSkillFromProfile(userId: string, skillId: string, role: SkillRole) {
    const profile = await prisma.profile.findUnique({
      where: { userId },
    });

    if (!profile) {
      throw new NotFoundException({
        code: 'PROFILE_NOT_FOUND',
        message: 'User profile not found.',
      });
    }

    const existing = await prisma.profileSkill.findUnique({
      where: {
        profileId_skillId_skillRole: {
          profileId: profile.id,
          skillId,
          skillRole: role,
        },
      },
    });

    if (!existing) {
      return { success: true };
    }

    await prisma.profileSkill.delete({
      where: { id: existing.id },
    });

    return { success: true };
  }
}
