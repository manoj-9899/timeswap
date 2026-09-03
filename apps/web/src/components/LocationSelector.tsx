'use client';

import { useState, useEffect, useRef } from 'react';
import { useMaharashtraLocations } from '@/hooks/useMaharashtraLocations';
import { TalukaContractDto, LocalityContractDto } from '@timeswap/contracts';

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

  // Address State
  const [selectedDistrictObj, setSelectedDistrictObj] = useState<any | null>(null);
  const [districtName, setDistrictName] = useState<string>('');
  const [talukas, setTalukas] = useState<TalukaContractDto[]>([]);
  const [selectedTalukaObj, setSelectedTalukaObj] = useState<TalukaContractDto | null>(null);
  const [talukaName, setTalukaName] = useState<string>('');
  const [localities, setLocalities] = useState<LocalityContractDto[]>([]);
  const [localityName, setLocalityName] = useState<string>('');
  const [meetingSpot, setMeetingSpot] = useState<string>('');

  const {
    districts,
    loadingDistricts,
    loadingTalukas,
    getTalukasForDistrict,
    getLocalitiesForTaluka,
    resolvePincode,
  } = useMaharashtraLocations();

  const isInitialMount = useRef(true);

  // Parse existing district / city string props on mount
  useEffect(() => {
    if (selectedCity && !districtName) {
      setDistrictName(selectedCity);
    }
  }, [selectedCity]);

  // Load Talukas when District changes
  useEffect(() => {
    let isCurrent = true;
    async function loadTalukas() {
      if (!districtName) {
        setTalukas([]);
        setSelectedTalukaObj(null);
        return;
      }

      // Find matching district object from API list
      const matchedDist = districts.find((d) => {
        const name = d.nameEn || d.name_en || '';
        return name.toLowerCase() === districtName.toLowerCase() || d.id === districtName;
      });
      if (matchedDist) {
        setSelectedDistrictObj(matchedDist);
      }

      const idOrName = matchedDist ? matchedDist.id : districtName;
      const resultTalukas = await getTalukasForDistrict(idOrName);

      if (isCurrent) {
        setTalukas(resultTalukas);
      }
    }

    loadTalukas();
    return () => {
      isCurrent = false;
    };
  }, [districtName, districts, getTalukasForDistrict]);

  // Load Localities when Taluka changes
  useEffect(() => {
    let isCurrent = true;
    async function loadLocalities() {
      if (!talukaName) {
        setLocalities([]);
        return;
      }

      const matchedTal = talukas.find((t) => {
        const name = t.nameEn || t.name_en || '';
        return name.toLowerCase() === talukaName.toLowerCase() || t.id === talukaName;
      });
      if (matchedTal) {
        setSelectedTalukaObj(matchedTal);
      }

      const idOrName = matchedTal ? matchedTal.id : talukaName;
      const resultLocalities = await getLocalitiesForTaluka(idOrName);

      if (isCurrent) {
        setLocalities(resultLocalities);
      }
    }

    loadLocalities();
    return () => {
      isCurrent = false;
    };
  }, [talukaName, talukas, getLocalitiesForTaluka]);

  // Emit change payload to parent component
  const triggerChange = (
    dName: string,
    tName: string,
    pName: string,
    pin?: string,
    dId?: string,
    tId?: string,
  ) => {
    let formattedDistrictStr = '';
    if (tName && pName) {
      formattedDistrictStr = `${tName}, ${pName}`;
    } else if (tName) {
      formattedDistrictStr = tName;
    } else if (pName) {
      formattedDistrictStr = pName;
    } else {
      formattedDistrictStr = dName;
    }

    onChange({
      city: dName,
      district: formattedDistrictStr,
      districtId: dId || selectedDistrictObj?.id,
      talukaId: tId || selectedTalukaObj?.id,
      localityName: pName || undefined,
      pincode: pin || pinCode || undefined,
    });
  };

  // PIN Code Auto-Lookup
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
          const resDist = match.district?.nameEn || match.district?.name_en || '';
          const resTalukaObj = match.talukas?.[0];
          const resTaluka = resTalukaObj?.nameEn || resTalukaObj?.name_en || '';
          const resLocality = match.localities?.[0]?.nameEn || match.localities?.[0]?.name_en || '';

          setDistrictName(resDist);
          if (resTaluka) setTalukaName(resTaluka);
          if (resLocality) setLocalityName(resLocality);

          setPinSuccessInfo(
            `Auto-filled: ${resLocality ? `${resLocality}, ` : ''}${resTaluka ? `Ta. ${resTaluka}, ` : ''}Dist. ${resDist}`,
          );

          triggerChange(
            resDist,
            resTaluka,
            resLocality,
            val,
            match.district?.id,
            resTalukaObj?.id,
          );
        } else {
          setPinError('PIN code details not found. Please select address manually below.');
        }
      } catch (err: any) {
        setIsSearchingPin(false);
        setPinError(err?.message || 'Could not auto-fetch PIN details. Please select address manually.');
      }
    }
  };

  const handleDistrictSelect = (dVal: string) => {
    setDistrictName(dVal);
    setTalukaName('');
    setLocalityName('');
    setPinSuccessInfo(null);
    const matched = districts.find((d) => d.nameEn === dVal || d.id === dVal);
    triggerChange(dVal, '', '', undefined, matched?.id, undefined);
  };

  const handleTalukaSelect = (tVal: string) => {
    setTalukaName(tVal);
    setLocalityName('');
    setPinSuccessInfo(null);
    const matched = talukas.find((t) => t.nameEn === tVal || t.id === tVal);
    triggerChange(districtName, tVal, '', undefined, selectedDistrictObj?.id, matched?.id);
  };

  const handleLocalitySelect = (lVal: string) => {
    setLocalityName(lVal);
    setPinSuccessInfo(null);
    triggerChange(
      districtName,
      talukaName,
      lVal,
      undefined,
      selectedDistrictObj?.id,
      selectedTalukaObj?.id,
    );
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* 1. PIN Code Auto-Fill Banner */}
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

      {/* 2. Cascading Address Dropdowns */}
      <div className="space-y-3">
        <div className="text-[11px] font-extrabold text-[#515f5d] uppercase tracking-wider flex items-center gap-1">
          <span className="material-symbols-outlined text-sm">map</span>
          <span>Address Details (स्वयंचलित पत्ता माहिती)</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* District Select */}
          <div className="space-y-1">
            <label className="block text-xs font-bold text-[#191c1b]">
              District (जिल्हा)
            </label>
            <select
              value={districtName}
              onChange={(e) => handleDistrictSelect(e.target.value)}
              className="w-full px-3 py-2.5 bg-white border border-[#e2e8f7] rounded-xl text-xs font-semibold text-[#191c1b] focus:outline-none focus:border-[#0b6057]"
            >
              <option value="">
                {loadingDistricts ? 'Loading Districts...' : '[ Select District ▼ ]'}
              </option>
              {districts.map((d) => (
                <option key={d.id} value={d.nameEn}>
                  {d.nameEn}
                </option>
              ))}
            </select>
          </div>

          {/* Taluka Select */}
          <div className="space-y-1">
            <label className="block text-xs font-bold text-[#191c1b]">
              Taluka (तालुका)
            </label>
            <select
              disabled={!districtName || loadingTalukas}
              value={talukaName}
              onChange={(e) => handleTalukaSelect(e.target.value)}
              className={`w-full px-3 py-2.5 border rounded-xl text-xs font-semibold focus:outline-none transition-all ${
                !districtName
                  ? 'bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed'
                  : 'bg-white border-[#e2e8f7] text-[#191c1b] focus:border-[#0b6057]'
              }`}
            >
              <option value="">
                {loadingTalukas
                  ? 'Loading Talukas...'
                  : !districtName
                  ? '[ Select District First ▼ ]'
                  : '[ Select Taluka ▼ ]'}
              </option>
              {talukas.map((t) => (
                <option key={t.id} value={t.nameEn}>
                  {t.nameEn}
                </option>
              ))}
            </select>
          </div>

          {/* Place / Locality Select or Input */}
          <div className="space-y-1">
            <label className="block text-xs font-bold text-[#191c1b]">
              Place / Area (ठिकाण)
            </label>
            {localities.length > 0 ? (
              <select
                disabled={!districtName || !talukaName}
                value={localityName}
                onChange={(e) => handleLocalitySelect(e.target.value)}
                className={`w-full px-3 py-2.5 border rounded-xl text-xs font-semibold focus:outline-none transition-all ${
                  !districtName || !talukaName
                    ? 'bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed'
                    : 'bg-white border-[#e2e8f7] text-[#191c1b] focus:border-[#0b6057]'
                }`}
              >
                <option value="">
                  {!districtName
                    ? '[ Select District First ▼ ]'
                    : !talukaName
                    ? '[ Select Taluka First ▼ ]'
                    : '[ Select Place / Area ▼ ]'}
                </option>
                {localities.map((loc) => (
                  <option key={loc.id} value={loc.nameEn || loc.name_en}>
                    {loc.nameEn || loc.name_en}
                  </option>
                ))}
              </select>
            ) : (
              <input
                type="text"
                disabled={!districtName || !talukaName}
                value={localityName}
                onChange={(e) => handleLocalitySelect(e.target.value)}
                placeholder={
                  !districtName
                    ? 'Select District First'
                    : !talukaName
                    ? 'Select Taluka First'
                    : 'Enter Place / Area'
                }
                className={`w-full px-3 py-2.5 border rounded-xl text-xs font-semibold focus:outline-none transition-all ${
                  !districtName || !talukaName
                    ? 'bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed'
                    : 'bg-white border-[#e2e8f7] text-[#191c1b] focus:border-[#0b6057]'
                }`}
              />
            )}
          </div>
        </div>
      </div>

      {/* 3. Meeting Spot Helper */}
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
