import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ProfilesService } from '../profiles.service';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { prisma } from '@timeswap/database';

describe('ProfilesService - Onboarding & Location Wiring', () => {
  let service: ProfilesService;
  let mockNotificationsService: any;
  let mockLedgerService: any;

  beforeEach(() => {
    mockNotificationsService = {
      createNotification: vi.fn().mockResolvedValue({}),
    };
    mockLedgerService = {
      grantStarterCredit: vi.fn().mockResolvedValue({ success: true, granted_amount: 1.0 }),
    };

    service = new ProfilesService(mockNotificationsService, mockLedgerService);
  });

  describe('completeOnboarding - Location Data & Starter Credit', () => {
    it('should complete onboarding successfully with valid location data and grant starter credit', async () => {
      const mockUserId = 'user-123';
      const mockProfileId = 'profile-123';

      vi.spyOn(prisma.profile, 'findFirst').mockResolvedValue(null as any);
      vi.spyOn(prisma.user, 'findUnique').mockResolvedValue({
        id: mockUserId,
        status: 'UNVERIFIED',
        profile: { id: mockProfileId, handle: 'user_123' },
        ledgerAccount: { id: 'wallet-123', balance: 0 },
      } as any);

      vi.spyOn(prisma, '$transaction').mockImplementation(async (callback: any) => {
        const tx = {
          profile: { update: vi.fn().mockResolvedValue({}) },
          user: { update: vi.fn().mockResolvedValue({}) },
          profileSkill: {
            deleteMany: vi.fn().mockResolvedValue({}),
            createMany: vi.fn().mockResolvedValue({}),
          },
        };
        return await callback(tx);
      });

      const dto: any = {
        handle: 'valid_handle_123',
        bio: 'This is a sufficiently long bio meeting the 30 character requirement for testing onboarding.',
        district_id: 'dist_pune',
        taluka_id: 'tal_pune_haveli',
        locality_name: 'Kothrud',
        pincode: '411038',
        delivery_preference: 'BOTH',
        offered_skill_ids: ['00000000-0000-0000-0000-000000000001'],
        learning_skill_ids: ['00000000-0000-0000-0000-000000000002'],
      };

      const result = await service.completeOnboarding(mockUserId, dto);

      expect(result).toBeDefined();
      expect(result.profile_completed).toBe(true);
      expect(result.starter_credit_awarded).toBe(1.0);
      expect(mockLedgerService.grantStarterCredit).toHaveBeenCalledWith(mockUserId);
    });

    it('should reject invalid district/taluka hierarchy combinations with INVALID_LOCATION_HIERARCHY', async () => {
      const mockUserId = 'user-123';

      const dto: any = {
        handle: 'valid_handle_123',
        bio: 'This is a sufficiently long bio meeting the 30 character requirement for testing onboarding.',
        district_id: 'dist_pune',
        taluka_id: 'tal_mismatch_kolhapur_karveer',
        locality_name: 'Karveer',
        pincode: '416001',
        offered_skill_ids: ['00000000-0000-0000-0000-000000000001'],
        learning_skill_ids: ['00000000-0000-0000-0000-000000000002'],
      };

      await expect(service.completeOnboarding(mockUserId, dto)).rejects.toThrow(
        BadRequestException,
      );

      try {
        await service.completeOnboarding(mockUserId, dto);
      } catch (err: any) {
        expect(err.getResponse().code).toBe('INVALID_LOCATION_HIERARCHY');
        expect(err.getResponse().message).toContain('Selected Taluka does not belong to the selected District');
      }
    });
  });
});
