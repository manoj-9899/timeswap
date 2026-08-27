'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiClient } from '@/lib/api-client';

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
  const [bio, setBio] = useState('');
  const [city, setCity] = useState('San Francisco');
  const [generalDistrict, setGeneralDistrict] = useState('Mission District');
  const [deliveryPreference, setDeliveryPreference] = useState<'ONLINE' | 'IN_PERSON' | 'BOTH'>('BOTH');
  const [offeredSkillIds, setOfferedSkillIds] = useState<string[]>([]);
  const [learningSkillIds, setLearningSkillIds] = useState<string[]>([]);

  useEffect(() => {
    async function loadTaxonomy() {
      const res = await apiClient<SkillCategory[]>('/skills/categories');
      if (res.success && res.data) {
        setCategories(res.data);
      }
    }
    loadTaxonomy();
  }, []);

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
      if (!handleClean || handleClean.length < 3) {
        setError('Handle must be at least 3 characters long');
        return;
      }
      if (!/^[a-z0-9_]+$/.test(handleClean)) {
        setError('Handle must only contain lowercase letters, numbers, and underscores');
        return;
      }
      if (!bio || bio.trim().length < 30) {
        setError('Bio must be at least 30 characters long to help community members know you');
        return;
      }
    }

    if (step === 2) {
      if (!city.trim() || !generalDistrict.trim()) {
        setError('Please enter your city and general district for local matching');
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
        offered_skill_ids: offeredSkillIds,
        learning_skill_ids: learningSkillIds,
      }),
    });

    setLoading(false);

    if (!res.success) {
      setError(res.error?.message || 'Failed to complete profile onboarding');
      return;
    }

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
              +{completionData.starter_credit_awarded.toFixed(2)} Credit
            </span>
            <span className="text-[#515f5d] text-xs block">
              1.00 Time Credit = 1 Hour of verified community service
            </span>
          </div>

          <div className="flex flex-col gap-3 pt-2">
            <Link
              href="/discover"
              className="w-full py-3.5 bg-[#0b6057] hover:bg-[#00473f] text-white font-bold rounded-xl text-center transition-all shadow-sm"
            >
              Explore Marketplace Catalog
            </Link>
            <Link
              href="/users/me/profile"
              className="w-full py-3.5 bg-white border border-[#e2e8f7] hover:bg-[#f2f4f2] text-[#3f4947] font-semibold rounded-xl text-center transition-all"
            >
              View Profile & Wallet
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
              Step {step} of 4: Let's set up your skill exchange profile.
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
              <div className="space-y-1">
                <label className="block text-xs font-bold text-[#191c1b]">Unique @handle</label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-[#6f7977] text-sm font-semibold">@</span>
                  <input
                    type="text"
                    value={handle}
                    onChange={(e) => setHandle(e.target.value)}
                    placeholder="alex_dev"
                    className="w-full pl-8 pr-4 py-2.5 bg-white border border-[#e2e8f7] rounded-xl text-[#191c1b] text-sm focus:outline-none focus:border-[#0b6057]"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-[#191c1b]">Tell the community about yourself</label>
                <textarea
                  rows={4}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="I'm a designer looking to learn guitar..."
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
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-[#191c1b]">City</label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="San Francisco"
                    className="w-full px-3 py-2.5 bg-white border border-[#e2e8f7] rounded-xl text-[#191c1b] text-sm focus:outline-none focus:border-[#0b6057]"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-[#191c1b]">General District</label>
                  <input
                    type="text"
                    value={generalDistrict}
                    onChange={(e) => setGeneralDistrict(e.target.value)}
                    placeholder="Mission District"
                    className="w-full px-3 py-2.5 bg-white border border-[#e2e8f7] rounded-xl text-[#191c1b] text-sm focus:outline-none focus:border-[#0b6057]"
                  />
                </div>
              </div>

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
              <p className="text-xs text-[#3f4947]">Select skills you can teach or offer help with:</p>
              <div className="max-h-64 overflow-y-auto space-y-4 pr-1">
                {categories.map((cat) => (
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
              <p className="text-xs text-[#3f4947]">Select skills you want to learn or receive mentorship in:</p>
              <div className="max-h-64 overflow-y-auto space-y-4 pr-1">
                {categories.map((cat) => (
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
