import { useState, useEffect, useCallback } from 'react';
import {
  DistrictContractDto,
  TalukaContractDto,
  LocalityContractDto,
  ResolvedPincodeContractDto,
  MAHARASHTRA_DISTRICTS,
  MAHARASHTRA_LOCATION_DATA,
  lookupPinCode,
} from '@timeswap/contracts';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export function useMaharashtraLocations() {
  const [districts, setDistricts] = useState<DistrictContractDto[]>([]);
  const [loadingDistricts, setLoadingDistricts] = useState(false);
  const [loadingTalukas, setLoadingTalukas] = useState(false);
  const [loadingLocalities, setLoadingLocalities] = useState(false);
  const [pinLookupStatus, setPinLookupStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  // Fetch districts on mount
  useEffect(() => {
    let isMounted = true;
    async function loadDistricts() {
      setLoadingDistricts(true);
      try {
        const res = await fetch(`${API_BASE}/api/v1/locations/districts`);
        if (res.ok) {
          const json = await res.json();
          if (json.success && Array.isArray(json.data) && json.data.length > 0) {
            if (isMounted) {
              setDistricts(json.data);
              setLoadingDistricts(false);
              return;
            }
          }
        }
      } catch {
        // Fall back to static dataset
      }

      if (isMounted) {
        setDistricts(
          (MAHARASHTRA_DISTRICTS as any[]).map((item: any, index: number) => {
            const name = typeof item === 'string' ? item : item.district || item.city;
            return {
              id: `dist_${index + 1}`,
              lgdCode: 490 + index,
              nameEn: name,
              nameMr: name,
              stateCode: 'MH',
            };
          }),
        );
        setLoadingDistricts(false);
      }
    }

    loadDistricts();
    return () => {
      isMounted = false;
    };
  }, []);

  const getTalukasForDistrict = useCallback(async (districtIdOrName: string): Promise<TalukaContractDto[]> => {
    if (!districtIdOrName) return [];
    setLoadingTalukas(true);
    try {
      const res = await fetch(`${API_BASE}/api/v1/locations/districts/${encodeURIComponent(districtIdOrName)}/talukas`);
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.data) && json.data.length > 0) {
          setLoadingTalukas(false);
          return json.data;
        }
      }
    } catch {
      // Fallback
    }

    // Static fallback
    const locMap = MAHARASHTRA_LOCATION_DATA as Record<string, any>;
    const locData = locMap[districtIdOrName];
    setLoadingTalukas(false);
    if (!locData) return [];

    return locData.talukas.map((t: any, index: number) => ({
      id: `tal_${districtIdOrName}_${index + 1}`,
      lgdCode: 4900 + index,
      districtId: districtIdOrName,
      nameEn: t.name,
      nameMr: t.name,
    }));
  }, []);

  const getLocalitiesForTaluka = useCallback(async (talukaIdOrName: string, search?: string): Promise<LocalityContractDto[]> => {
    if (!talukaIdOrName) return [];
    setLoadingLocalities(true);
    try {
      const url = new URL(`${API_BASE}/api/v1/locations/talukas/${encodeURIComponent(talukaIdOrName)}/localities`);
      if (search) url.searchParams.set('search', search);

      const res = await fetch(url.toString());
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          setLoadingLocalities(false);
          return json.data;
        }
      }
    } catch {
      // Fallback
    }

    let places: string[] = [];
    const locMap = MAHARASHTRA_LOCATION_DATA as Record<string, any>;
    for (const dName of Object.keys(locMap)) {
      const distObj = locMap[dName];
      const matchTaluka = distObj.talukas.find((t: any) => t.name === talukaIdOrName);
      if (matchTaluka) {
        places = matchTaluka.places;
        break;
      }
    }

    const filtered = search
      ? places.filter((p) => p.toLowerCase().includes(search.toLowerCase()))
      : places;

    setLoadingLocalities(false);
    return filtered.map((p, index) => ({
      id: `loc_${talukaIdOrName}_${index + 1}`,
      talukaId: talukaIdOrName,
      name_en: p,
      nameEn: p,
      nameMr: p,
      type: 'TOWN',
      pincode: '',
    }));
  }, []);

  const resolvePincode = useCallback(async (pincode: string): Promise<ResolvedPincodeContractDto | null> => {
    if (!/^\d{6}$/.test(pincode)) {
      setPinLookupStatus('error');
      return null;
    }

    setPinLookupStatus('loading');
    try {
      const res = await fetch(`${API_BASE}/api/v1/locations/resolve-pincode/${pincode}`);
      const json = await res.json();
      if (res.ok && json.success && json.data) {
        setPinLookupStatus('success');
        return json.data;
      } else if (json?.error?.message) {
        setPinLookupStatus('error');
        throw new Error(json.error.message);
      }
    } catch {
      // Fallback
    }

    // Static fallback
    const staticPin = lookupPinCode(pincode);
    if (staticPin) {
      setPinLookupStatus('success');
      const places = (staticPin as any).places || [(staticPin as any).place].filter(Boolean);
      return {
        pincode,
        district: {
          id: `dist_${staticPin.district}`,
          lgdCode: 490,
          nameEn: staticPin.district,
          name_en: staticPin.district,
          nameMr: staticPin.district,
          stateCode: 'MH',
        },
        talukas: [
          {
            id: `tal_${staticPin.taluka}`,
            lgdCode: 4900,
            districtId: `dist_${staticPin.district}`,
            nameEn: staticPin.taluka,
            name_en: staticPin.taluka,
            nameMr: staticPin.taluka,
          },
        ],
        localities: places.map((p: string, idx: number) => ({
          id: `loc_${idx + 1}`,
          talukaId: `tal_${staticPin.taluka}`,
          name_en: p,
          nameEn: p,
          pincode,
        })),
      };
    }

    setPinLookupStatus('error');
    return null;
  }, []);

  return {
    districts,
    loadingDistricts,
    loadingTalukas,
    loadingLocalities,
    pinLookupStatus,
    getTalukasForDistrict,
    getLocalitiesForTaluka,
    resolvePincode,
  };
}
