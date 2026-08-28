import { describe, it, expect, beforeEach } from 'vitest';
import { LocationsService } from '../locations.service';
import { NotFoundException } from '@nestjs/common';

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

    it('should return talukas for Kolhapur district', async () => {
      const talukas = await service.getTalukasByDistrict('Kolhapur');
      expect(talukas.length).toBeGreaterThan(0);
      const names = talukas.map((t: any) => t.nameEn);
      expect(names).toContain('Karveer');
    });
  });

  describe('resolvePincode', () => {
    it('should resolve PIN code 416008 to Kolhapur -> Karveer -> Rajarampuri', async () => {
      const resolved = await service.resolvePincode('416008');
      expect(resolved.pincode).toBe('416008');
      expect(resolved.district.nameEn).toBe('Kolhapur');
      expect(resolved.taluka.nameEn).toBe('Karveer');
      expect(resolved.localities.some((l: any) => l.nameEn === 'Rajarampuri')).toBe(true);
    });

    it('should resolve PIN code 411038 to Pune -> Haveli / Kothrud', async () => {
      const resolved = await service.resolvePincode('411038');
      expect(resolved.pincode).toBe('411038');
      expect(resolved.district.nameEn).toBe('Pune');
    });

    it('should throw NotFoundException for unmapped PIN code', async () => {
      await expect(service.resolvePincode('000000')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
