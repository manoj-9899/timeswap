import { describe, it, expect, beforeEach } from 'vitest';
import { LocationsService } from '../locations.service';
import { NotFoundException, BadRequestException } from '@nestjs/common';

describe('LocationsService', () => {
  let service: LocationsService;

  beforeEach(() => {
    service = new LocationsService();
  });

  describe('getDistricts', () => {
    it('should return all 36 Maharashtra districts', async () => {
      const districts = await service.getDistricts();
      expect(districts.length).toBeGreaterThanOrEqual(36);
      const names = districts.map((d: any) => d.nameEn);
      expect(names).toContain('Kolhapur');
      expect(names).toContain('Pune');
      expect(names).toContain('Mumbai Suburban');
    });
  });

  describe('getTalukasByDistrict', () => {
    it('should return talukas for Pune district', async () => {
      const talukas = await service.getTalukasByDistrict('Pune');
      expect(talukas.length).toBeGreaterThan(0);
      const names = talukas.map((t: any) => t.nameEn);
      expect(names).toContain('Haveli');
    });
  });

  describe('resolvePincode', () => {
    it('1. Valid Maharashtra PIN: 411038 returns Pune district and post offices', async () => {
      const resolved = await service.resolvePincode('411038');
      expect(resolved.pincode).toBe('411038');
      expect(resolved.district.nameEn).toBe('Pune');
      expect(resolved.localities.length).toBeGreaterThan(0);
    });

    it('2. Renamed District Aliases: Aurangabad/Chhatrapati Sambhajinagar (431001), Dharashiv (413501), Ahilyanagar (414001)', async () => {
      const resolvedAurangabad = await service.resolvePincode('431001');
      expect(resolvedAurangabad.district.nameEn).toBe('Chhatrapati Sambhajinagar');

      const resolvedOsmanabad = await service.resolvePincode('413501');
      expect(resolvedOsmanabad.district.nameEn).toBe('Dharashiv');

      const resolvedAhmednagar = await service.resolvePincode('414001');
      expect(resolvedAhmednagar.district.nameEn).toBe('Ahilyanagar');
    });

    it('3. Out-of-State PIN: 560001 (Bangalore, Karnataka) throws 400 PINCODE_OUTSIDE_MAHARASHTRA', async () => {
      try {
        await service.resolvePincode('560001');
        expect.fail('Should have thrown BadRequestException');
      } catch (err: any) {
        expect(err).toBeInstanceOf(BadRequestException);
        const res = err.getResponse();
        expect(res.code).toBe('PINCODE_OUTSIDE_MAHARASHTRA');
      }
    });

    it('4. Invalid Format: abcd or 012345 throws 400 INVALID_PINCODE_FORMAT', async () => {
      try {
        await service.resolvePincode('abcd');
        expect.fail('Should have thrown BadRequestException');
      } catch (err: any) {
        expect(err).toBeInstanceOf(BadRequestException);
        const res = err.getResponse();
        expect(res.code).toBe('INVALID_PINCODE_FORMAT');
      }

      try {
        await service.resolvePincode('012345');
        expect.fail('Should have thrown BadRequestException');
      } catch (err: any) {
        expect(err).toBeInstanceOf(BadRequestException);
        const res = err.getResponse();
        expect(res.code).toBe('INVALID_PINCODE_FORMAT');
      }
    });

    it('5. Non-Existent PIN: 999999 throws 404 PINCODE_NOT_FOUND', async () => {
      try {
        await service.resolvePincode('999999');
        expect.fail('Should have thrown NotFoundException');
      } catch (err: any) {
        expect(err).toBeInstanceOf(NotFoundException);
        const res = err.getResponse();
        expect(res.code).toBe('PINCODE_NOT_FOUND');
      }
    });
  });
});
