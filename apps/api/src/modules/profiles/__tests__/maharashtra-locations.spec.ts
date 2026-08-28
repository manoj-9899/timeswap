import { describe, it, expect } from 'vitest';
import {
  getAllDistricts,
  getTalukasForDistrict,
  getPlacesForTaluka,
  lookupPinCode,
} from '@timeswap/contracts';

describe('Maharashtra Location Hierarchy Invariant Tests', () => {
  it('1. Empty or new profile does NOT default to Mumbai Suburban', () => {
    const districts = getAllDistricts();
    expect(districts).toContain('Kolhapur');
    expect(districts).toContain('Pune');
    expect(districts).toContain('Mumbai Suburban');
    expect(getTalukasForDistrict('')).toEqual([]);
    expect(getPlacesForTaluka('', '')).toEqual([]);
  });

  it('2. Selecting a District loads ONLY its Talukas', () => {
    const kolhapurTalukas = getTalukasForDistrict('Kolhapur');
    expect(kolhapurTalukas).toContain('Karveer');
    expect(kolhapurTalukas).toContain('Kagal');
    expect(kolhapurTalukas).toContain('Hatkanangle');
    expect(kolhapurTalukas).not.toContain('Haveli');
    expect(kolhapurTalukas).not.toContain('Andheri');
  });

  it('3. Selecting a Taluka loads ONLY its Places / Areas', () => {
    const karveerPlaces = getPlacesForTaluka('Kolhapur', 'Karveer');
    expect(karveerPlaces).toContain('Rajarampuri');
    expect(karveerPlaces).toContain('Shahupuri');
    expect(karveerPlaces).not.toContain('Kothrud');
    expect(karveerPlaces).not.toContain('Bandra West');
  });

  it('4. Changing District invalidates previous Taluka', () => {
    const kolhapurTalukas = getTalukasForDistrict('Kolhapur');
    expect(kolhapurTalukas.includes('Karveer')).toBe(true);

    const puneTalukas = getTalukasForDistrict('Pune');
    expect(puneTalukas.includes('Karveer')).toBe(false);
  });

  it('5. Valid PIN auto-lookup resolves complete location hierarchy (Kolhapur -> Karveer -> Rajarampuri)', () => {
    const match = lookupPinCode('416008');
    expect(match).not.toBeNull();
    expect(match?.district).toBe('Kolhapur');
    expect(match?.taluka).toBe('Karveer');
    expect(match?.place).toBe('Rajarampuri');
  });

  it('6. Valid PIN auto-lookup resolves Pune (Pune -> Haveli -> Kothrud)', () => {
    const match = lookupPinCode('411038');
    expect(match).not.toBeNull();
    expect(match?.district).toBe('Pune');
    expect(match?.taluka).toBe('Haveli');
    expect(match?.place).toBe('Kothrud');
  });

  it('7. Invalid PIN does not corrupt location data', () => {
    const match = lookupPinCode('000000');
    expect(match).toBeNull();
  });
});
