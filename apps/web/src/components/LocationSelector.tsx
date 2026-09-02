'use client';

import { useState, useEffect, useRef } from 'react';
import {
  getAllDistricts,
  getTalukasForDistrict,
  getPlacesForTaluka,
  getCityForDistrict,
} from '@/lib/locations/maharashtra-locations';
import { useMaharashtraLocations } from '@/hooks/useMaharashtraLocations';

export interface LocationData {
  city: string;
  district: string;
  districtId?: string;
  talukaId?: string;
  localityName?: string;
  pincode?: string;
}

interface LocationSelectorProps {
  selectedCity: string;
  selectedDistrict: string;
  onChange: (data: LocationData) => void;
  className?: string;
  compact?: boolean;
}

export default function LocationSelector({
  selectedCity,
  selectedDistrict,
  onChange,
  className = '',
  compact = false,
}: LocationSelectorProps) {
  const [pinCode, setPinCode] = useState('');
  const [isSearchingPin, setIsSearchingPin] = useState(false);
  const [pinSuccessInfo, setPinSuccessInfo] = useState<string | null>(null);
  const [pinError, setPinError] = useState<string | null>(null);

  // Address Sections: District, Taluka, Place
  const [district, setDistrict] = useState<string>('');
  const [taluka, setTaluka] = useState<string>('');
  const [place, setPlace] = useState<string>('');
  const [meetingSpot, setMeetingSpot] = useState<string>('');

  const { resolvePincode, districts: apiDistricts } = useMaharashtraLocations();
  const isInitialMount = useRef(true);

  // Helper to parse stored "Taluka, Place" string into [taluka, place]
  const parseStoredLocation = (cityVal: string, distStr: string) => {
    let parsedDist = cityVal ? cityVal.trim() : '';
    let parsedTaluka = '';
    let parsedPlace = '';

    if (distStr) {
      if (distStr.includes(',')) {
        const parts = distStr.split(',').map((s) => s.trim());
        parsedTaluka = parts[0] || '';
        parsedPlace = parts.slice(1).join(', ') || '';
      } else {
        parsedPlace = distStr.trim();
      }
    }

    if (parsedDist) {
      const validTalukas = getTalukasForDistrict(parsedDist);
      if (validTalukas.length > 0 && !validTalukas.includes(parsedTaluka)) {
        if (validTalukas.includes(parsedPlace)) {
          parsedTaluka = parsedPlace;
          parsedPlace = '';
        }
      }
    }

    return { parsedDist, parsedTaluka, parsedPlace };
  };

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      const { parsedDist, parsedTaluka, parsedPlace } = parseStoredLocation(
        selectedCity,
        selectedDistrict,
      );
      setDistrict(parsedDist);
      setTaluka(parsedTaluka);
      setPlace(parsedPlace);
    } else {
      if (selectedCity && selectedCity !== district) {
        setDistrict(selectedCity);
      }
    }
  }, [selectedCity, selectedDistrict]);

  const triggerChange = (d: string, t: string, p: string, pin?: string, explicitMatch?: any) => {
    let formattedDistrict = '';
    if (t && p) {
      formattedDistrict = `${t}, ${p}`;
    } else if (t) {
      formattedDistrict = t;
    } else if (p) {
      formattedDistrict = p;
    } else {
      formattedDistrict = d;
    }

    const distObj = explicitMatch?.district || apiDistricts.find(
      (item) => item.nameEn?.toLowerCase() === d.toLowerCase(),
    );
    const talukaObj = explicitMatch?.taluka || explicitMatch?.talukas?.[0] || distObj?.talukas?.find(
      (item: any) => item.nameEn?.toLowerCase() === t.toLowerCase(),
    );

    const districtId = distObj?.id || (d ? `dist_${d.toLowerCase().replace(/\s+/g, '_')}` : undefined);
    const talukaId = talukaObj?.id || (t ? `tal_${t.toLowerCase().replace(/\s+/g, '_')}` : undefined);

    onChange({
      city: d,
      district: formattedDistrict,
      districtId,
      talukaId,
      localityName: p || undefined,
      pincode: pin || pinCode || undefined,
    });
  };

  // Step 1: PIN Code Auto-Lookup
  const handlePinChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, '').slice(0, 6);
    setPinCode(val);
    setPinSuccessInfo(null);
    setPinError(null);

    if (val.length === 6) {
      setIsSearchingPin(true);
      try {
        const match = await resolvePincode(val);
        setIsSearchingPin(false);

        if (match) {
          const m = match as any;
          const resolvedDist = m.district?.nameEn || m.district?.name_en || '';
          const resolvedTaluka = m.talukas?.[0]?.nameEn || m.talukas?.[0]?.name_en || m.taluka?.nameEn || m.taluka?.name_en || '';
          const resolvedPlace = m.localities?.[0]?.name_en || m.localities?.[0]?.nameEn || '';

          setDistrict(resolvedDist);
          if (resolvedTaluka) setTaluka(resolvedTaluka);
          if (resolvedPlace) setPlace(resolvedPlace);

          setPinSuccessInfo(
            `Auto-filled: ${resolvedPlace ? `${resolvedPlace}, ` : ''}${resolvedTaluka ? `Ta. ${resolvedTaluka}, ` : ''}Dist. ${resolvedDist}`,
          );
          triggerChange(resolvedDist, resolvedTaluka, resolvedPlace, val, m);
        } else {
          setPinError('PIN code details not found. Please select address manually below.');
        }
      } catch (err: any) {
        setIsSearchingPin(false);
        setPinError(err?.message || 'Could not auto-fetch PIN details. Please select address manually below.');
      }
    }
  };

  const handleDistrictChange = (newDistrict: string) => {
    setDistrict(newDistrict);
    setTaluka('');
    setPlace('');
    setPinSuccessInfo(null);
    triggerChange(newDistrict, '', '');
  };

  const handleTalukaChange = (newTaluka: string) => {
    setTaluka(newTaluka);
    setPlace('');
    setPinSuccessInfo(null);
    triggerChange(district, newTaluka, '');
  };

  const handlePlaceChange = (newPlace: string) => {
    setPlace(newPlace);
    setPinSuccessInfo(null);
    triggerChange(district, taluka, newPlace);
  };

  const availableDistricts = apiDistricts.length > 0
    ? apiDistricts.map((d) => d.nameEn)
    : getAllDistricts();
  const availableTalukas = district ? getTalukasForDistrict(district) : [];
  const availablePlaces = district && taluka ? getPlacesForTaluka(district, taluka) : [];

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Step 1: PIN Code Auto-Fill */}
      <div className="bg-[#f2f4f2] border border-[#e2e8f7] rounded-2xl p-4 space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-xs font-extrabold text-[#0b6057] flex items-center gap-1.5">
            <span className="material-symbols-outlined text-base">pin_drop</span>
            <span>PIN Code (पिन कोड) - Auto-fills Address</span>
          </label>
          {isSearchingPin && (
            <span className="text-[10px] text-[#0b6057] font-bold animate-pulse flex items-center gap-1">
              <span className="material-symbols-outlined text-xs animate-spin">sync</span>
              <span>Fetching Address...</span>
            </span>
          )}
        </div>
        <input
          type="text"
          maxLength={6}
          value={pinCode}
          onChange={handlePinChange}
          placeholder="Enter 6-digit PIN (e.g. 416008, 411057, 400050)"
          className="w-full px-3.5 py-2.5 bg-white border border-[#e2e8f7] rounded-xl text-xs font-semibold text-[#191c1b] placeholder-[#515f5d]/60 focus:outline-none focus:border-[#0b6057]"
        />
        {pinSuccessInfo && (
          <div className="text-[11px] bg-[#9cf2e8]/40 border border-[#0b6057]/20 text-[#00504a] px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5">
            <span className="material-symbols-outlined text-sm text-[#0b6057]">check_circle</span>
            <span>{pinSuccessInfo}</span>
          </div>
        )}
        {pinError && (
          <div className="text-[11px] bg-red-50 border border-red-200 text-red-700 px-3 py-1.5 rounded-xl font-semibold">
            ⚠️ {pinError}
          </div>
        )}
      </div>

      {/* Step 2: Auto-filled 3-Section Address */}
      <div className="space-y-3">
        <div className="text-[11px] font-extrabold text-[#515f5d] uppercase tracking-wider flex items-center gap-1">
          <span className="material-symbols-outlined text-sm">map</span>
          <span>Address Details (स्वयंचलित पत्ता माहिती)</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* District */}
          <div className="space-y-1">
            <label className="block text-xs font-bold text-[#191c1b]">
              District (जिल्हा)
            </label>
            <select
              value={district}
              onChange={(e) => handleDistrictChange(e.target.value)}
              className="w-full px-3 py-2.5 bg-white border border-[#e2e8f7] rounded-xl text-xs font-semibold text-[#191c1b] focus:outline-none focus:border-[#0b6057]"
            >
              <option value="">[ Select District ▼ ]</option>
              {availableDistricts.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>

          {/* Taluka */}
          <div className="space-y-1">
            <label className="block text-xs font-bold text-[#191c1b]">
              Taluka (तालुका)
            </label>
            <select
              disabled={!district}
              value={taluka}
              onChange={(e) => handleTalukaChange(e.target.value)}
              className={`w-full px-3 py-2.5 border rounded-xl text-xs font-semibold focus:outline-none transition-all ${
                !district
                  ? 'bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed'
                  : 'bg-white border-[#e2e8f7] text-[#191c1b] focus:border-[#0b6057]'
              }`}
            >
              <option value="">
                {!district ? '[ Select District First ▼ ]' : '[ Select Taluka ▼ ]'}
              </option>
              {availableTalukas.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          {/* Place / Area */}
          <div className="space-y-1">
            <label className="block text-xs font-bold text-[#191c1b]">
              Place / Area (ठिकाण)
            </label>
            {availablePlaces.length > 0 ? (
              <select
                disabled={!district || !taluka}
                value={place}
                onChange={(e) => handlePlaceChange(e.target.value)}
                className={`w-full px-3 py-2.5 border rounded-xl text-xs font-semibold focus:outline-none transition-all ${
                  !district || !taluka
                    ? 'bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed'
                    : 'bg-white border-[#e2e8f7] text-[#191c1b] focus:border-[#0b6057]'
                }`}
              >
                <option value="">
                  {!district
                    ? '[ Select District First ▼ ]'
                    : !taluka
                    ? '[ Select Taluka First ▼ ]'
                    : '[ Select Place / Area ▼ ]'}
                </option>
                {availablePlaces.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            ) : (
              <input
                type="text"
                disabled={!district || !taluka}
                value={place}
                onChange={(e) => handlePlaceChange(e.target.value)}
                placeholder={
                  !district
                    ? 'Select District First'
                    : !taluka
                    ? 'Select Taluka First'
                    : 'Enter Place / Area'
                }
                className={`w-full px-3 py-2.5 border rounded-xl text-xs font-semibold focus:outline-none transition-all ${
                  !district || !taluka
                    ? 'bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed'
                    : 'bg-white border-[#e2e8f7] text-[#191c1b] focus:border-[#0b6057]'
                }`}
              />
            )}
          </div>
        </div>
      </div>

      {/* Step 3: Meeting Facilitation Helper */}
      <div className="bg-[#fcfdfd] border border-[#e2e8f7] rounded-2xl p-3.5 space-y-1.5">
        <label className="block text-xs font-extrabold text-[#191c1b] flex items-center gap-1.5">
          <span className="material-symbols-outlined text-sm text-[#0b6057]">handshake</span>
          <span>Preferred Meeting Landmark (भेटण्याचे सार्वजनिक ठिकाण)</span>
        </label>
        <input
          type="text"
          value={meetingSpot}
          onChange={(e) => setMeetingSpot(e.target.value)}
          placeholder="e.g. Near Metro Station / Town Public Library / Central Park Cafe"
          className="w-full px-3 py-2 bg-white border border-[#e2e8f7] rounded-xl text-xs text-[#191c1b] placeholder-[#515f5d]/60 focus:outline-none focus:border-[#0b6057]"
        />
        <div className="text-[10px] text-[#515f5d] font-medium flex items-center gap-1 pt-0.5">
          <span className="material-symbols-outlined text-xs text-[#0b6057]">lock</span>
          <span>Exact residential addresses are kept private. Only District, Taluka & Place are shown publicly for safety.</span>
        </div>
      </div>
    </div>
  );
}
