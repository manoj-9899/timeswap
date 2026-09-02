'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiClient } from '@/lib/api-client';
import { useAuth } from '@/providers/auth-provider';
import LocationSelector from '@/components/LocationSelector';
import { generateHandleSuggestion } from '@timeswap/contracts';

interface Skill {
  id: string;
  name: string;
  slug: string;
}

interface SkillCategory {
  id: string;
  name: string;
  slug: string;
  skills: Skill[];
}

export default function OnboardingPage() {
  const router = useRouter();
  const { refreshUser } = useAuth();
  const [step, setStep] = useState(1);
  const [categories, setCategories] = useState<SkillCategory[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [completionData, setCompletionData] = useState<{
    profile_completed: boolean;
    starter_credit_awarded: number;
  } | null>(null);

  // Form states
  const [handle, setHandle] = useState('');
  const [handleChecking, setHandleChecking] = useState(false);
  const [handleStatus, setHandleStatus] = useState<{
    available: boolean;
    reason?: string;
    message?: string;
    alternatives?: string[];
  } | null>(null);

  const [bio, setBio] = useState('');
  const [city, setCity] = useState('');
  const [generalDistrict, setGeneralDistrict] = useState('');
  const [districtId, setDistrictId] = useState<string>('');
  const [talukaId, setTalukaId] = useState<string>('');
  const [localityName, setLocalityName] = useState<string>('');
  const [pincode, setPincode] = useState<string>('');

  const [deliveryPreference, setDeliveryPreference] = useState<'ONLINE' | 'IN_PERSON' | 'BOTH'>('BOTH');
  const [offeredSkillIds, setOfferedSkillIds] = useState<string[]>([]);
  const [learningSkillIds, setLearningSkillIds] = useState<string[]>([]);

  useEffect(() => {
    async function loadData() {
      // 1. Fetch categories
      const catRes = await apiClient<SkillCategory[]>('/skills/categories');
      if (catRes.success && catRes.data) {
        setCategories(catRes.data);
      }

      // 2. Fetch authenticated profile to generate initial clean handle suggestion
      const profRes = await apiClient<any>('/users/me/profile');
      if (profRes.success && profRes.data) {
        const p = profRes.data;
        if (p.handle && !p.handle.startsWith('user_')) {
          setHandle(p.handle);
        } else if (p.displayName) {
          const suggested = generateHandleSuggestion(p.displayName);
          setHandle(suggested);
        }
      }
    }
    loadData();
  }, []);

  // Debounced handle availability check
  useEffect(() => {
    const clean = handle.trim().toLowerCase();
    if (!clean) {
      setHandleStatus(null);
      setHandleChecking(false);
      return;
    }

    if (clean.length < 4) {
      setHandleStatus({
        available: false,
        reason: 'TOO_SHORT',
        message: 'Username must be at least 4 characters long.',
      });
      setHandleChecking(false);
      return;
    }

    if (!/^[a-z0-9_]+$/.test(clean)) {
      setHandleStatus({
        available: false,
        reason: 'INVALID_CHARACTERS',
        message: 'Username must contain only lowercase letters, numbers, and underscores.',
      });
      setHandleChecking(false);
      return;
    }

    setHandleChecking(true);
    const timer = setTimeout(async () => {
      const res = await apiClient<{
        available: boolean;
        reason?: string;
        message?: string;
        alternatives?: string[];
      }>(`/profiles/check-handle?handle=${encodeURIComponent(clean)}`);

      setHandleChecking(false);
      if (res.success && res.data) {
        setHandleStatus(res.data);
      } else {
        setHandleStatus({
          available: false,
          message: 'Failed to verify username availability.',
        });
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [handle]);

  const toggleSkillOffered = (id: string) => {
    setOfferedSkillIds((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  };

  const toggleSkillLearning = (id: string) => {
    setLearningSkillIds((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  };

  const handleNextStep = () => {
    setError(null);

    if (step === 1) {
      const handleClean = handle.trim().toLowerCase();
      if (!handleClean || handleClean.length < 4) {
        setError('Username must be at least 4 characters long');
        return;
      }
      if (!/^[a-z0-9_]+$/.test(handleClean)) {
        setError('Username must only contain lowercase letters, numbers, and underscores');
        return;
      }
      if (handleChecking) {
        setError('Please wait while we check username availability');
        return;
      }
      if (handleStatus && !handleStatus.available) {
        setError(handleStatus.message || 'Please choose an available username');
        return;
      }
      if (!bio || bio.trim().length < 30) {
        setError('Bio must be at least 30 characters long to help community members know you');
        return;
      }
    }

    if (step === 2) {
      if (!city.trim() || !generalDistrict.trim() || !districtId || !talukaId) {
        setError('Please select a valid Maharashtra District and Taluka to proceed.');
        return;
      }
    }

    if (step === 3) {
      if (offeredSkillIds.length === 0) {
        setError('Please select at least 1 skill you can share with others');
        return;
      }
    }

    setStep((prev) => prev + 1);
  };

  const handleSubmit = async () => {
    setError(null);
    if (learningSkillIds.length === 0) {
      setError('Please select at least 1 skill you want to learn');
      return;
    }

    setLoading(true);
    const res = await apiClient<{
      profile_completed: boolean;
      starter_credit_awarded: number;
    }>('/users/me/profile/complete', {
      method: 'POST',
      body: JSON.stringify({
        handle: handle.trim().toLowerCase(),
        bio: bio.trim(),
        city: city.trim(),
        general_district: generalDistrict.trim(),
        district_id: districtId,
        taluka_id: talukaId,
        locality_name: localityName || undefined,
        pincode: pincode || undefined,
        delivery_preference: deliveryPreference,
        offered_skill_ids: offeredSkillIds,
        learning_skill_ids: learningSkillIds,
      }),
    });

    setLoading(false);

    if (!res.success) {
      setError(res.error?.message || 'Failed to complete profile onboarding');
      return;
    }

    await refreshUser();
    setCompletionData(res.data || { profile_completed: true, starter_credit_awarded: 1.0 });
  };

  if (completionData) {
    return (
      <div className="min-h-screen bg-[#fcfdfd] flex items-center justify-center p-4 text-[#191c1b]">
        <div className="max-w-md w-full bg-white border border-[#e2e8f7] rounded-3xl p-8 text-center shadow-lg space-y-6">
          <div className="w-20 h-20 bg-[#ffdcc3]/50 border border-[#ffb77d] rounded-full flex items-center justify-center mx-auto text-4xl text-[#904d00]">
            <span className="material-symbols-outlined text-4xl" style={{ fontVariationSettings: "'FILL' 1" }}>stars</span>
          </div>
          <h2 className="text-2xl font-extrabold text-[#191c1b]">Profile Verified!</h2>
          <p className="text-[#3f4947] text-sm leading-relaxed">
            Welcome to <span className="text-[#0b6057] font-extrabold">TimeSwap</span>! Your account has been granted starter credits.
          </p>

          <div className="bg-[#f2f4f2] border border-[#e2e8f7] rounded-2xl p-5 text-center space-y-1">
            <span className="text-[#904d00] text-xs font-bold uppercase tracking-wider block">Starter Grant Awarded</span>
            <span className="text-4xl font-extrabold text-[#191c1b] block">
              +{Math.round(completionData.starter_credit_awarded)} Credit
            </span>
            <span className="text-[#515f5d] text-xs block">
              1 Time Credit = 1 Hour of verified community service
            </span>
          </div>

          <div className="flex flex-col gap-3 pt-2">
            <Link
              href="/dashboard"
              className="w-full py-3.5 bg-[#0b6057] hover:bg-[#00473f] text-white font-bold rounded-xl text-center transition-all shadow-sm"
            >
              Go to Dashboard
            </Link>
            <Link
              href="/discover"
              className="w-full py-3.5 bg-[#f2f4f2] hover:bg-[#e2e8f7] text-[#0b6057] font-bold rounded-xl text-center transition-all"
            >
              Explore Marketplace Catalog
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fcfdfd] text-[#191c1b] flex flex-col justify-center items-center p-6">
      <div className="w-full max-w-lg bg-white border border-[#e2e8f7] rounded-3xl shadow-sm overflow-hidden">
        {/* Progress Bar Header */}
        <div className="w-full bg-[#e2e8f7] h-1.5 overflow-hidden">
          <div
            className="bg-[#0b6057] h-full transition-all duration-500"
            style={{ width: `${(step / 4) * 100}%` }}
          />
        </div>

        <div className="p-8 space-y-6">
          {/* Header */}
          <div className="text-center space-y-2">
            <span className="material-symbols-outlined text-[#0b6057] text-4xl">
              {step === 1 && 'person_add'}
              {step === 2 && 'pin_drop'}
              {step === 3 && 'school'}
              {step === 4 && 'local_library'}
            </span>
            <h1 className="text-2xl font-extrabold text-[#191c1b]">
              {step === 1 && 'Create Your Identity'}
              {step === 2 && 'Location & Format'}
              {step === 3 && 'Skills You Can Teach'}
              {step === 4 && 'Skills You Want to Learn'}
            </h1>
            <p className="text-sm text-[#3f4947]">
              {step === 1 && 'Step 1 of 4: Create your public username and bio.'}
              {step === 2 && 'Step 2 of 4: Set your location and exchange format preferences.'}
              {step === 3 && 'Step 3 of 4: Select skills you can teach or offer help with.'}
              {step === 4 && 'Step 4 of 4: Select skills you want to learn or receive help with.'}
            </p>
          </div>

          {error && (
            <div className="p-3 bg-[#ffdad6] border border-[#ba1a1a]/30 text-[#93000a] rounded-xl text-xs font-semibold">
              {error}
            </div>
          )}

          {/* Step 1 */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-[#191c1b]">Choose your username</label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-[#6f7977] text-sm font-semibold">@</span>
                  <input
                    type="text"
                    value={handle}
                    onChange={(e) => setHandle(e.target.value)}
                    placeholder="manojpawar"
                    className={`w-full pl-8 pr-10 py-2.5 bg-white border rounded-xl text-[#191c1b] text-sm focus:outline-none transition-all ${
                      handleStatus
                        ? handleStatus.available
                          ? 'border-[#0b6057] focus:border-[#0b6057]'
                          : 'border-red-400 focus:border-red-500'
                        : 'border-[#e2e8f7] focus:border-[#0b6057]'
                    }`}
                  />
                  {handleChecking && (
                    <span className="material-symbols-outlined absolute right-3 top-2.5 text-base text-[#515f5d] animate-spin">
                      sync
                    </span>
                  )}
                </div>

                {/* Status Indicator & Suggestions */}
                {handleStatus && (
                  <div className="space-y-1.5 pt-1">
                    {handleChecking ? (
                      <p className="text-xs text-[#515f5d] font-semibold flex items-center gap-1">
                        Checking availability...
                      </p>
                    ) : handleStatus.available ? (
                      <p className="text-xs text-[#0b6057] font-bold flex items-center gap-1">
                        <span className="material-symbols-outlined text-sm">check_circle</span>
                        Username available
                      </p>
                    ) : (
                      <div className="space-y-2">
                        <p className="text-xs text-red-600 font-semibold flex items-center gap-1">
                          <span className="material-symbols-outlined text-sm">error</span>
                          {handleStatus.message || 'Username is already taken'}
                        </p>
                        {handleStatus.alternatives && handleStatus.alternatives.length > 0 && (
                          <div className="space-y-1">
                            <span className="text-[11px] font-bold text-[#515f5d] block">
                              Available Suggestions:
                            </span>
                            <div className="flex flex-wrap gap-1.5">
                              {handleStatus.alternatives.map((alt) => (
                                <button
                                  key={alt}
                                  type="button"
                                  onClick={() => setHandle(alt)}
                                  className="px-2.5 py-1 bg-[#9cf2e8]/30 hover:bg-[#9cf2e8]/60 border border-[#80d5cb] text-[#00504a] text-xs font-bold rounded-lg transition-all"
                                >
                                  @{alt}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-[#191c1b]">Tell the community about yourself</label>
                <textarea
                  rows={4}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="I'm a software developer and designer in Pune looking to swap skills in acoustic guitar..."
                  className="w-full p-3 bg-white border border-[#e2e8f7] rounded-xl text-[#191c1b] text-sm focus:outline-none focus:border-[#0b6057]"
                />
                <div className="text-right text-[11px] text-[#6f7977]">
                  {bio.length}/30 min characters
                </div>
              </div>
            </div>
          )}

          {/* Step 2 */}
          {step === 2 && (
            <div className="space-y-4">
              <LocationSelector
                selectedCity={city}
                selectedDistrict={generalDistrict}
                onChange={(data) => {
                  setCity(data.city);
                  setGeneralDistrict(data.district);
                  setDistrictId(data.districtId || '');
                  setTalukaId(data.talukaId || '');
                  setLocalityName(data.localityName || '');
                  setPincode(data.pincode || '');
                }}
              />

              <div className="space-y-2">
                <label className="block text-xs font-bold text-[#191c1b]">Exchange Format Preference</label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { id: 'ONLINE', label: 'Online Only' },
                    { id: 'IN_PERSON', label: 'In-Person' },
                    { id: 'BOTH', label: 'Both' },
                  ].map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setDeliveryPreference(item.id as any)}
                      className={`p-3 rounded-xl border text-xs font-semibold text-center transition-all ${
                        deliveryPreference === item.id
                          ? 'bg-[#0b6057] text-white border-[#0b6057]'
                          : 'bg-[#fcfdfd] border-[#e2e8f7] text-[#3f4947] hover:border-[#0b6057]'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 3 */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="max-h-64 overflow-y-auto space-y-4 pr-1">
                {categories
                  .map((cat) => ({
                    ...cat,
                    skills: (cat.skills || []).filter(
                      (s) =>
                        !s.name.toLowerCase().includes('dispute') &&
                        !s.name.toLowerCase().includes('test'),
                    ),
                  }))
                  .filter(
                    (cat) =>
                      cat.skills.length > 0 &&
                      !cat.name.toLowerCase().includes('dispute') &&
                      !cat.name.toLowerCase().includes('test'),
                  )
                  .map((cat) => (
                    <div key={cat.id} className="space-y-2">
                      <h3 className="text-xs font-bold text-[#0b6057] uppercase tracking-wider">{cat.name}</h3>
                      <div className="flex flex-wrap gap-2">
                        {cat.skills.map((skill) => {
                          const selected = offeredSkillIds.includes(skill.id);
                          return (
                            <button
                              key={skill.id}
                              type="button"
                              onClick={() => toggleSkillOffered(skill.id)}
                              className={`px-3 py-1.5 rounded-lg border text-xs transition-all ${
                                selected
                                  ? 'bg-[#0b6057] text-white border-[#0b6057] font-semibold'
                                  : 'bg-[#f2f4f2] border-[#e2e8f7] text-[#3f4947] hover:border-[#0b6057]'
                              }`}
                            >
                              {selected ? '✓ ' : '+ '}
                              {skill.name}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* Step 4 */}
          {step === 4 && (
            <div className="space-y-4">
              <div className="max-h-64 overflow-y-auto space-y-4 pr-1">
                {categories
                  .map((cat) => ({
                    ...cat,
                    skills: (cat.skills || []).filter(
                      (s) =>
                        !s.name.toLowerCase().includes('dispute') &&
                        !s.name.toLowerCase().includes('test'),
                    ),
                  }))
                  .filter(
                    (cat) =>
                      cat.skills.length > 0 &&
                      !cat.name.toLowerCase().includes('dispute') &&
                      !cat.name.toLowerCase().includes('test'),
                  )
                  .map((cat) => (
                    <div key={cat.id} className="space-y-2">
                      <h3 className="text-xs font-bold text-[#0b6057] uppercase tracking-wider">{cat.name}</h3>
                      <div className="flex flex-wrap gap-2">
                        {cat.skills.map((skill) => {
                          const selected = learningSkillIds.includes(skill.id);
                          return (
                            <button
                              key={skill.id}
                              type="button"
                              onClick={() => toggleSkillLearning(skill.id)}
                              className={`px-3 py-1.5 rounded-lg border text-xs transition-all ${
                                selected
                                  ? 'bg-[#0b6057] text-white border-[#0b6057] font-semibold'
                                  : 'bg-[#f2f4f2] border-[#e2e8f7] text-[#3f4947] hover:border-[#0b6057]'
                              }`}
                            >
                              {selected ? '✓ ' : '+ '}
                              {skill.name}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* Buttons */}
          <div className="pt-4 border-t border-[#e2e8f7] flex justify-between items-center">
            {step > 1 ? (
              <button
                type="button"
                onClick={() => setStep((prev) => prev - 1)}
                className="px-5 py-2.5 bg-white border border-[#e2e8f7] hover:bg-[#f2f4f2] text-[#3f4947] text-xs font-semibold rounded-xl transition-all"
              >
                Back
              </button>
            ) : (
              <div />
            )}

            {step < 4 ? (
              <button
                type="button"
                onClick={handleNextStep}
                className="px-6 py-2.5 bg-[#0b6057] hover:bg-[#00473f] text-white text-xs font-bold rounded-xl transition-all shadow-sm flex items-center gap-1"
              >
                <span>Next Step</span>
                <span className="material-symbols-outlined text-sm">arrow_forward</span>
              </button>
            ) : (
              <button
                type="button"
                disabled={loading}
                onClick={handleSubmit}
                className="px-6 py-2.5 bg-[#0b6057] hover:bg-[#00473f] text-white text-xs font-bold rounded-xl transition-all shadow-sm disabled:opacity-50 flex items-center gap-1"
              >
                <span>{loading ? 'Completing...' : 'Complete & Claim 1.0 Credit'}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
