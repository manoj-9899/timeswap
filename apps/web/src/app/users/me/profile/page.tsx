'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { apiClient } from '@/lib/api-client';
import LocationSelector from '@/components/LocationSelector';

interface ProfileData {
  id: string;
  userId: string;
  email: string;
  status: string;
  displayName: string;
  handle: string;
  avatarUrl: string | null;
  bio: string | null;
  city: string;
  generalDistrict: string;
  deliveryPreference: string;
  ratingAverage: number;
  completedExchangesCount: number;
  reliabilityScore: number;
  isCompleted: boolean;
  offeredSkills: Array<{ id: string; name: string }>;
  learningSkills: Array<{ id: string; name: string }>;
  wallet: {
    availableBalance: number;
    escrowedBalance: number;
  };
}

interface SkillCategory {
  id: string;
  name: string;
  skills: Array<{ id: string; name: string }>;
}

export default function MyProfilePage() {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [categories, setCategories] = useState<SkillCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Edit fields
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [city, setCity] = useState('');
  const [generalDistrict, setGeneralDistrict] = useState('');
  const [deliveryPreference, setDeliveryPreference] = useState<'ONLINE' | 'IN_PERSON' | 'BOTH'>('BOTH');

  // Add skill modal multi-select state
  const [showAddSkillModal, setShowAddSkillModal] = useState(false);
  const [selectedSkillIds, setSelectedSkillIds] = useState<string[]>([]);
  const [selectedRole, setSelectedRole] = useState<'OFFERED' | 'LEARNING'>('OFFERED');
  const [skillSearchQuery, setSkillSearchQuery] = useState('');
  const [activeCategoryTab, setActiveCategoryTab] = useState<string>('ALL');
  const [attachingSkills, setAttachingSkills] = useState(false);

  const fetchProfile = async () => {
    const res = await apiClient<ProfileData>('/users/me/profile');
    if (res.success && res.data) {
      setProfile(res.data);
      setDisplayName(res.data.displayName || '');
      setBio(res.data.bio || '');
      setAvatarUrl(res.data.avatarUrl || '');
      setCity(res.data.city || '');
      setGeneralDistrict(res.data.generalDistrict || '');
      setDeliveryPreference((res.data.deliveryPreference as any) || 'BOTH');
    } else {
      setError(res.error?.message || 'Failed to fetch profile details');
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchProfile();
    async function loadCategories() {
      const res = await apiClient<SkillCategory[]>('/skills/categories');
      if (res.success && res.data) {
        setCategories(res.data);
      }
    }
    loadCategories();
  }, []);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccessMsg(null);

    const payload: any = {
      display_name: displayName,
      bio,
      city,
      general_district: generalDistrict,
      delivery_preference: deliveryPreference,
    };
    if (avatarUrl) {
      payload.avatar_url = avatarUrl;
    }

    const res = await apiClient('/users/me/profile', {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });

    setSaving(false);
    if (res.success) {
      setSuccessMsg('Profile updated successfully!');
      fetchProfile();
    } else {
      setError(res.error?.message || 'Failed to update profile');
    }
  };

  const handleRemoveSkill = async (skillId: string, role: 'OFFERED' | 'LEARNING') => {
    const res = await apiClient(`/skills/me/skills/${skillId}?role=${role}`, {
      method: 'DELETE',
    });
    if (res.success) {
      fetchProfile();
    }
  };

  const toggleSkillSelection = (skillId: string) => {
    if (selectedSkillIds.includes(skillId)) {
      setSelectedSkillIds(selectedSkillIds.filter((id) => id !== skillId));
    } else {
      setSelectedSkillIds([...selectedSkillIds, skillId]);
    }
  };

  const handleAddMultipleSkills = async () => {
    if (selectedSkillIds.length === 0) return;
    setAttachingSkills(true);

    try {
      await Promise.all(
        selectedSkillIds.map((skillId) =>
          apiClient('/skills/me/skills', {
            method: 'POST',
            body: JSON.stringify({
              skill_id: skillId,
              role: selectedRole,
            }),
          })
        )
      );

      setShowAddSkillModal(false);
      setSelectedSkillIds([]);
      setSkillSearchQuery('');
      fetchProfile();
    } catch (err) {
      console.error('Failed attaching skills:', err);
    } finally {
      setAttachingSkills(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#fcfdfd] text-[#191c1b] flex items-center justify-center">
        <div className="text-[#515f5d] text-sm font-semibold animate-pulse">Loading profile...</div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-[#fcfdfd] text-[#191c1b] flex flex-col items-center justify-center p-4">
        <div className="p-8 bg-white border border-[#e2e8f7] rounded-3xl text-center space-y-4 shadow-sm">
          <p className="text-[#93000a] text-sm font-bold">{error || 'Profile not found'}</p>
          <Link href="/onboarding" className="px-5 py-2.5 bg-[#0b6057] hover:bg-[#00473f] text-white rounded-xl text-xs font-bold shadow-sm inline-block">
            Go to Onboarding Setup
          </Link>
        </div>
      </div>
    );
  }

  const completionScore =
    (bio.trim().length > 0 ? 25 : 0) +
    (city && generalDistrict ? 25 : 0) +
    ((profile?.offeredSkills?.length || 0) > 0 ? 25 : 0) +
    ((profile?.learningSkills?.length || 0) > 0 ? 25 : 0);

  const getAvatarGradient = (name: string) => {
    const colors = [
      'bg-gradient-to-br from-[#0b6057] to-[#00473f]',
      'bg-gradient-to-br from-[#4f46e5] to-[#3730a3]',
      'bg-gradient-to-br from-[#d97706] to-[#92400e]',
      'bg-gradient-to-br from-[#059669] to-[#065f46]',
      'bg-gradient-to-br from-[#dc2626] to-[#991b1b]',
      'bg-gradient-to-br from-[#7c3aed] to-[#5b21b6]',
      'bg-gradient-to-br from-[#0284c7] to-[#075985]',
    ];
    let hash = 0;
    for (let i = 0; i < (name || '').length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  };

  return (
    <div className="min-h-screen bg-[#fcfdfd] text-[#191c1b] p-4 sm:p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Profile Completion Progress Card (Only shown when under 100%) */}
        {completionScore < 100 && (
          <div className="bg-white border border-[#e2e8f7] rounded-3xl p-5 shadow-sm space-y-2 animate-fadeIn">
            <div className="flex justify-between items-center text-xs font-extrabold text-[#191c1b]">
              <span className="flex items-center gap-1.5 text-[#0b6057]">
                <span className="material-symbols-outlined text-base">verified</span>
                Profile Completeness Score
              </span>
              <span>{completionScore}%</span>
            </div>
            <div className="w-full bg-[#f2f4f2] h-2.5 rounded-full overflow-hidden border border-[#e2e8f7]">
              <div
                className="bg-[#0b6057] h-full transition-all duration-500 rounded-full"
                style={{ width: `${completionScore}%` }}
              />
            </div>
            <p className="text-[10px] text-[#515f5d]">
              Add your bio, location, offered skills, and learning goals to reach 100% profile completeness.
            </p>
          </div>
        )}

        {/* Top Header Card */}
        <div className="bg-white border border-[#e2e8f7] rounded-3xl p-6 sm:p-8 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
          <div className="flex items-center gap-5">
            <div className={`w-16 h-16 rounded-full ${getAvatarGradient(profile.displayName)} flex items-center justify-center text-2xl font-extrabold text-white shadow-md border-2 border-white`}>
              {profile.displayName.charAt(0).toUpperCase()}
            </div>
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl font-extrabold text-[#191c1b]">{profile.displayName}</h1>
                <span
                  className={`px-2.5 py-0.5 text-[10px] font-bold rounded-full uppercase tracking-wider ${
                    profile.status === 'ACTIVE'
                      ? 'bg-[#9cf2e8]/40 text-[#00504a] border border-[#80d5cb]'
                      : 'bg-[#ffdcc3]/50 text-[#663500] border border-[#ffb77d]'
                  }`}
                >
                  {profile.status}
                </span>
                {completionScore === 100 && (
                  <span className="px-2.5 py-0.5 text-[10px] font-extrabold rounded-full bg-[#9cf2e8]/40 text-[#00504a] border border-[#80d5cb] flex items-center gap-1">
                    <span className="material-symbols-outlined text-xs">verified</span>
                    <span>100% Complete</span>
                  </span>
                )}
              </div>
              <p className="text-[#515f5d] text-xs font-semibold">@{profile.handle}</p>
              <div className="flex items-center gap-3 text-xs text-[#3f4947]">
                <span>📍 {profile.city}, {profile.generalDistrict}</span>
                <span>•</span>
                <span>⭐ {profile.ratingAverage.toFixed(1)}</span>
                <span>•</span>
                <span>{profile.completedExchangesCount} Exchanges</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:items-end space-y-2 w-full sm:w-auto">
            {/* Wallet summary capsule */}
            <div className="bg-[#f2f4f2] border border-[#e2e8f7] rounded-2xl p-4 text-center sm:text-right">
              <span className="text-[10px] text-[#0b6057] uppercase font-bold tracking-wider block">Spendable Wallet Balance</span>
              <span className="text-2xl font-extrabold text-[#191c1b] block mt-0.5">
                {Math.round(profile.wallet.availableBalance)} {Math.round(profile.wallet.availableBalance) === 1 ? 'Credit' : 'Credits'}
              </span>
              <span className="text-[10px] text-[#515f5d] block">
                1 Credit = 1 Hour • Escrowed: {Math.round(profile.wallet.escrowedBalance)} {Math.round(profile.wallet.escrowedBalance) === 1 ? 'Credit' : 'Credits'}
              </span>
            </div>

            <Link
              href={`/profiles/${profile.handle}`}
              className="text-xs text-[#0b6057] hover:underline font-bold text-right flex items-center gap-1 self-end"
            >
              <span>View Public Reputation Card</span>
              <span className="material-symbols-outlined text-sm">open_in_new</span>
            </Link>
          </div>
        </div>

        {/* Form & Skills Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Left 2 Cols: Edit Form */}
          <div className="md:col-span-2 bg-white border border-[#e2e8f7] rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
            <h2 className="text-xs font-extrabold uppercase tracking-wider text-[#515f5d] border-b border-[#e2e8f7] pb-3">
              Edit Persona & Location
            </h2>

            {error && <div className="p-3 bg-[#ffdad6] border border-[#ba1a1a]/30 text-[#93000a] text-xs rounded-xl font-bold">{error}</div>}
            {successMsg && <div className="p-3 bg-[#9cf2e8]/30 border border-[#80d5cb] text-[#00504a] text-xs rounded-xl font-bold">{successMsg}</div>}

            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#191c1b] mb-1">Display Name</label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white border border-[#e2e8f7] rounded-xl text-[#191c1b] text-sm focus:outline-none focus:border-[#0b6057]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#191c1b] mb-1">Personal Bio</label>
                <textarea
                  rows={4}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  className="w-full p-3.5 bg-white border border-[#e2e8f7] rounded-xl text-[#191c1b] text-sm focus:outline-none focus:border-[#0b6057]"
                />
              </div>

              <LocationSelector
                selectedCity={city}
                selectedDistrict={generalDistrict}
                onChange={({ city: c, district: d }) => {
                  setCity(c);
                  setGeneralDistrict(d);
                }}
              />

              <div>
                <label className="block text-xs font-bold text-[#191c1b] mb-1">Delivery Preference</label>
                <select
                  value={deliveryPreference}
                  onChange={(e) => setDeliveryPreference(e.target.value as any)}
                  className="w-full px-3.5 py-2.5 bg-white border border-[#e2e8f7] rounded-xl text-[#191c1b] text-sm focus:outline-none focus:border-[#0b6057]"
                >
                  <option value="BOTH">Both (Online & In-Person)</option>
                  <option value="ONLINE">Online Only</option>
                  <option value="IN_PERSON">In-Person Only</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={saving}
                className="w-full py-3 bg-[#0b6057] hover:bg-[#00473f] text-white font-bold text-xs rounded-xl transition-all shadow-sm disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save Profile Changes'}
              </button>
            </form>
          </div>

          {/* Right Col: Skills Matrix */}
          <div className="space-y-6">
            {/* Skills Offered Card */}
            <div className="bg-white border border-[#e2e8f7] rounded-3xl p-6 shadow-sm space-y-4">
              <div className="flex justify-between items-center border-b border-[#e2e8f7] pb-3">
                <h3 className="text-xs font-extrabold text-[#0b6057] uppercase tracking-wider">
                  Skills Offered
                </h3>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedRole('OFFERED');
                    setShowAddSkillModal(true);
                  }}
                  className="text-[11px] bg-[#9cf2e8]/40 hover:bg-[#9cf2e8]/60 text-[#00504a] font-bold px-2.5 py-1 rounded-lg border border-[#80d5cb]"
                >
                  + Add
                </button>
              </div>

              <div className="flex flex-wrap gap-2">
                {profile.offeredSkills.length === 0 ? (
                  <p className="text-xs text-[#515f5d]">No skills offered yet.</p>
                ) : (
                  profile.offeredSkills.map((s) => (
                    <span
                      key={s.id}
                      className="inline-flex items-center gap-1 px-3 py-1.5 bg-[#9cf2e8]/40 border border-[#80d5cb] text-[#00504a] text-xs rounded-full font-bold"
                    >
                      <span>{s.name}</span>
                      <button
                        onClick={() => handleRemoveSkill(s.id, 'OFFERED')}
                        className="text-[#00504a] hover:text-[#191c1b] font-bold ml-1 text-xs"
                      >
                        ×
                      </button>
                    </span>
                  ))
                )}
              </div>
            </div>

            {/* Skills Seeking Card */}
            <div className="bg-white border border-[#e2e8f7] rounded-3xl p-6 shadow-sm space-y-4">
              <div className="flex justify-between items-center border-b border-[#e2e8f7] pb-3">
                <h3 className="text-xs font-extrabold text-[#191c1b] uppercase tracking-wider">
                  Skills Seeking
                </h3>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedRole('LEARNING');
                    setShowAddSkillModal(true);
                  }}
                  className="text-[11px] bg-[#e6e8ea] hover:bg-[#d8dadc] text-[#191c1b] font-bold px-2.5 py-1 rounded-lg border border-[#bec9c6]"
                >
                  + Add
                </button>
              </div>

              <div className="flex flex-wrap gap-2">
                {profile.learningSkills.length === 0 ? (
                  <p className="text-xs text-[#515f5d]">No learning goals yet.</p>
                ) : (
                  profile.learningSkills.map((s) => (
                    <span
                      key={s.id}
                      className="inline-flex items-center gap-1 px-3 py-1.5 bg-[#e6e8ea] border border-[#bec9c6] text-[#191c1b] text-xs rounded-full font-bold"
                    >
                      <span>{s.name}</span>
                      <button
                        onClick={() => handleRemoveSkill(s.id, 'LEARNING')}
                        className="text-[#3f4947] hover:text-[#191c1b] font-bold ml-1 text-xs"
                      >
                        ×
                      </button>
                    </span>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Multi-Skill Selector Modal */}
      {showAddSkillModal && (
        <div className="fixed inset-0 bg-[#191c1b]/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white border border-[#e2e8f7] rounded-3xl p-6 max-w-2xl w-full max-h-[85vh] flex flex-col space-y-4 shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="flex justify-between items-center border-b border-[#e2e8f7] pb-3">
              <div>
                <h3 className="text-sm font-extrabold text-[#191c1b] uppercase tracking-wider flex items-center gap-2">
                  <span className="material-symbols-outlined text-lg text-[#0b6057]">
                    {selectedRole === 'OFFERED' ? 'workspace_premium' : 'school'}
                  </span>
                  <span>
                    Choose {selectedRole === 'OFFERED' ? 'Teaching' : 'Learning'} Skills
                  </span>
                </h3>
                <p className="text-[11px] text-[#515f5d] mt-0.5 font-medium">
                  Select multiple skills at once to quickly expand your profile!
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowAddSkillModal(false);
                  setSelectedSkillIds([]);
                  setSkillSearchQuery('');
                }}
                className="text-[#515f5d] hover:text-[#191c1b] p-1 rounded-lg text-lg font-bold"
              >
                ✕
              </button>
            </div>

            {/* Search Bar & Category Filter Tabs */}
            <div className="space-y-2.5">
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-2.5 text-base text-[#515f5d]">
                  search
                </span>
                <input
                  type="text"
                  value={skillSearchQuery}
                  onChange={(e) => setSkillSearchQuery(e.target.value)}
                  placeholder="Search skills (e.g. Python, Graphic Design, Speaking, Music...)"
                  className="w-full pl-9 pr-4 py-2 bg-[#f2f4f2] border border-[#e2e8f7] rounded-xl text-xs text-[#191c1b] placeholder-[#515f5d]/70 focus:outline-none focus:border-[#0b6057]"
                />
                {skillSearchQuery && (
                  <button
                    type="button"
                    onClick={() => setSkillSearchQuery('')}
                    className="absolute right-3 top-2 text-xs text-[#515f5d] font-bold"
                  >
                    Clear
                  </button>
                )}
              </div>

              {/* Category Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                <button
                  type="button"
                  onClick={() => setActiveCategoryTab('ALL')}
                  className={`px-3 py-1 rounded-lg text-[11px] font-bold whitespace-nowrap transition-all ${
                    activeCategoryTab === 'ALL'
                      ? 'bg-[#0b6057] text-white'
                      : 'bg-[#f2f4f2] text-[#515f5d] hover:bg-[#e2e8f7]'
                  }`}
                >
                  All Categories
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setActiveCategoryTab(cat.id)}
                    className={`px-3 py-1 rounded-lg text-[11px] font-bold whitespace-nowrap transition-all ${
                      activeCategoryTab === cat.id
                        ? 'bg-[#0b6057] text-white'
                        : 'bg-[#f2f4f2] text-[#515f5d] hover:bg-[#e2e8f7]'
                    }`}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Scrollable Multi-Select Skill Cards Grid */}
            <div className="flex-1 overflow-y-auto pr-1 space-y-4 max-h-[45vh]">
              {categories
                .filter((cat) => activeCategoryTab === 'ALL' || activeCategoryTab === cat.id)
                .map((cat) => {
                  const matchingSkills = cat.skills.filter((s) =>
                    s.name.toLowerCase().includes(skillSearchQuery.toLowerCase())
                  );

                  if (matchingSkills.length === 0) return null;

                  const existingSkillIds =
                    selectedRole === 'OFFERED'
                      ? profile?.offeredSkills.map((s) => s.id) || []
                      : profile?.learningSkills.map((s) => s.id) || [];

                  return (
                    <div key={cat.id} className="space-y-2">
                      <div className="text-[11px] font-extrabold text-[#515f5d] uppercase tracking-wider">
                        {cat.name}
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {matchingSkills.map((s) => {
                          const isAlreadyAttached = existingSkillIds.includes(s.id);
                          const isSelected = selectedSkillIds.includes(s.id);

                          if (isAlreadyAttached) {
                            return (
                              <div
                                key={s.id}
                                className="flex items-center justify-between p-2.5 bg-[#f2f4f2]/70 border border-[#e2e8f7] rounded-xl text-xs text-[#515f5d]/70 font-semibold cursor-not-allowed"
                              >
                                <span>{s.name}</span>
                                <span className="text-[10px] bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full font-bold">
                                  ✓ Added
                                </span>
                              </div>
                            );
                          }

                          return (
                            <button
                              key={s.id}
                              type="button"
                              onClick={() => toggleSkillSelection(s.id)}
                              className={`flex items-center justify-between p-2.5 rounded-xl text-xs font-bold transition-all text-left border ${
                                isSelected
                                  ? selectedRole === 'OFFERED'
                                    ? 'bg-[#9cf2e8]/40 border-[#0b6057] text-[#00504a] shadow-sm'
                                    : 'bg-[#e0e7ff] border-[#4f46e5] text-[#3730a3] shadow-sm'
                                  : 'bg-white border-[#e2e8f7] text-[#191c1b] hover:border-[#0b6057]/50 hover:bg-[#f2f4f2]/50'
                              }`}
                            >
                              <span>{s.name}</span>
                              <span
                                className={`w-5 h-5 rounded-md flex items-center justify-center text-xs font-extrabold transition-all ${
                                  isSelected
                                    ? selectedRole === 'OFFERED'
                                      ? 'bg-[#0b6057] text-white'
                                      : 'bg-[#4f46e5] text-white'
                                    : 'border border-[#bec9c6] text-transparent'
                                }`}
                              >
                                ✓
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
            </div>

            {/* Action Bar Footer */}
            <div className="flex justify-between items-center border-t border-[#e2e8f7] pt-3">
              <div className="text-xs font-bold text-[#191c1b]">
                {selectedSkillIds.length > 0 ? (
                  <span className="text-[#0b6057] bg-[#9cf2e8]/40 px-2.5 py-1 rounded-full text-xs font-extrabold">
                    {selectedSkillIds.length} Skill{selectedSkillIds.length > 1 ? 's' : ''} Selected
                  </span>
                ) : (
                  <span className="text-[#515f5d]">Click skills above to select</span>
                )}
              </div>

              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddSkillModal(false);
                    setSelectedSkillIds([]);
                    setSkillSearchQuery('');
                  }}
                  className="px-4 py-2 bg-white border border-[#e2e8f7] text-[#3f4947] text-xs rounded-xl font-bold hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={selectedSkillIds.length === 0 || attachingSkills}
                  onClick={handleAddMultipleSkills}
                  className={`px-5 py-2 text-white text-xs font-bold rounded-xl shadow-sm transition-all flex items-center gap-1.5 ${
                    selectedSkillIds.length === 0 || attachingSkills
                      ? 'bg-gray-300 cursor-not-allowed'
                      : 'bg-[#0b6057] hover:bg-[#00473f]'
                  }`}
                >
                  {attachingSkills ? (
                    <>
                      <span className="material-symbols-outlined text-xs animate-spin">sync</span>
                      <span>Attaching {selectedSkillIds.length}...</span>
                    </>
                  ) : (
                    <span>Attach {selectedSkillIds.length > 0 ? `${selectedSkillIds.length} ` : ''}Skills</span>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
