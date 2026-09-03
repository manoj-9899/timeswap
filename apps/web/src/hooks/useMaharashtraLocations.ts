import { useState, useEffect, useCallback } from 'react';
import {
  DistrictContractDto,
  TalukaContractDto,
  LocalityContractDto,
  ResolvedPincodeContractDto,
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
        // Fallback
      }

      if (isMounted) {
        setLoadingDistricts(false);
      }
    }

    loadDistricts();
    return () => {
      isMounted = false;
    };
  }, []);

  const getTalukasForDistrict = useCallback(
    async (districtIdOrName: string): Promise<TalukaContractDto[]> => {
      if (!districtIdOrName) return [];
      setLoadingTalukas(true);
      try {
        const res = await fetch(
          `${API_BASE}/api/v1/locations/districts/${encodeURIComponent(districtIdOrName)}/talukas`,
        );
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

      setLoadingTalukas(false);
      return [];
    },
    [],
  );

  const getLocalitiesForTaluka = useCallback(
    async (talukaIdOrName: string, search?: string): Promise<LocalityContractDto[]> => {
      if (!talukaIdOrName) return [];
      setLoadingLocalities(true);
      try {
        const url = new URL(
          `${API_BASE}/api/v1/locations/talukas/${encodeURIComponent(talukaIdOrName)}/localities`,
        );
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

      setLoadingLocalities(false);
      return [];
    },
    [],
  );

  const resolvePincode = useCallback(
    async (pincode: string): Promise<ResolvedPincodeContractDto | null> => {
      if (!pincode || !/^\d{6}$/.test(pincode)) {
        setPinLookupStatus('error');
        return null;
      }

      setPinLookupStatus('loading');

      // 1. Try backend NestJS API first
      try {
        const res = await fetch(`${API_BASE}/api/v1/locations/resolve-pincode/${pincode}`);
        if (res.ok) {
          const json = await res.json();
          if (json.success && json.data) {
            setPinLookupStatus('success');
            return json.data;
          }
        }
      } catch {
        // Fallback to Next.js route API
      }

      // 2. Try Next.js local API route fallback (/api/locations/pincode)
      try {
        const res = await fetch(`/api/locations/pincode?pin=${pincode}`);
        if (res.ok) {
          const json = await res.json();
          if (json.success && json.data) {
            setPinLookupStatus('success');
            const item = json.data;
            return {
              pincode,
              district: {
                id: `dist_${item.district.toLowerCase().replace(/\s+/g, '_')}`,
                lgdCode: 490,
                nameEn: item.district,
                name_en: item.district,
                nameMr: item.district,
                stateCode: 'MH',
              },
              talukas: [
                {
                  id: `tal_${item.taluka.toLowerCase().replace(/\s+/g, '_')}`,
                  lgdCode: 4900,
                  districtId: `dist_${item.district.toLowerCase().replace(/\s+/g, '_')}`,
                  nameEn: item.taluka,
                  name_en: item.taluka,
                  nameMr: item.taluka,
                },
              ],
              localities: (item.availablePlaces || [item.place]).map((p: string, idx: number) => ({
                id: `loc_${idx + 1}`,
                talukaId: `tal_${item.taluka.toLowerCase().replace(/\s+/g, '_')}`,
                name_en: p,
                nameEn: p,
                pincode,
              })),
            };
          }
        }
      } catch (err) {
        console.warn('PIN lookup error:', err);
      }

      setPinLookupStatus('error');
      return null;
    },
    [],
  );

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
