'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { apiClient } from '@/lib/api-client';

interface PublicProfileData {
  id: string;
  user_id: string;
  display_name: string;
  handle: string;
  avatar_url: string | null;
  bio: string | null;
  city: string;
  general_district: string;
  delivery_preference: string;
  rating_average: number;
  completed_exchanges_count: number;
  reliability_score: number;
  offered_skills: Array<{ id: string; name: string; slug: string; category: string }>;
  learning_skills: Array<{ id: string; name: string; slug: string; category: string }>;
  service_offers: Array<{
    id: string;
    title: string;
    description: string;
    duration_minutes: number;
    format: string;
    category_name: string;
    created_at: string;
  }>;
  help_requests: Array<{
    id: string;
    title: string;
    description: string;
    duration_minutes: number;
    format: string;
    category_name: string;
    created_at: string;
  }>;
  reviews: Array<{
    id: string;
    rating: number;
    comment_text: string | null;
    attribute_tags: string[];
    created_at: string;
    author: {
      display_name: string;
      handle?: string;
      avatar_url?: string | null;
    };
  }>;
  created_at: string;
}

export default function PublicProfilePage() {
  const params = useParams();
  const handle = params?.handle as string;

  const [profile, setProfile] = useState<PublicProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'listings' | 'reviews'>('overview');

  useEffect(() => {
    async function loadProfile() {
      if (!handle) return;
      setLoading(true);
      try {
        const res = await apiClient<PublicProfileData>(`/profiles/${handle}`);
        if (res.success && res.data) {
          setProfile(res.data);
        } else {
          setError(res.error?.message || 'Profile not found');
        }
      } catch (err) {
        setError('Failed to load profile');
      }
      setLoading(false);
    }
    loadProfile();
  }, [handle]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#fcfdfd] text-[#191c1b] flex items-center justify-center">
        <div className="text-[#0b6057] text-sm font-bold animate-pulse flex items-center gap-2">
          <span className="material-symbols-outlined text-lg animate-spin">refresh</span>
          Loading reputation profile...
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen bg-[#fcfdfd] text-[#191c1b] flex flex-col items-center justify-center p-4">
        <div className="p-8 bg-white border border-[#e2e8f7] rounded-3xl text-center space-y-4 shadow-sm max-w-md w-full">
          <span className="material-symbols-outlined text-4xl text-[#93000a]">person_off</span>
          <h2 className="text-lg font-extrabold text-[#191c1b]">Profile Not Found</h2>
          <p className="text-xs text-[#515f5d]">{error || "The profile you are looking for does not exist or has been modified."}</p>
          <Link href="/discover" className="px-5 py-2.5 bg-[#0b6057] hover:bg-[#00473f] text-white rounded-xl text-xs font-bold shadow-sm inline-block">
            Back to Discovery
          </Link>
        </div>
      </div>
    );
  }

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

  const totalListingsCount = (profile.service_offers?.length || 0) + (profile.help_requests?.length || 0);

  return (
    <div className="min-h-screen bg-[#fcfdfd] text-[#191c1b] p-4 sm:p-8 flex justify-center">
      <div className="max-w-4xl w-full space-y-6">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between">
          <Link href="/discover" className="text-xs text-[#0b6057] hover:underline font-bold flex items-center gap-1">
            <span className="material-symbols-outlined text-sm">arrow_back</span>
            <span>Back to Marketplace</span>
          </Link>
          <span className="text-xs text-[#515f5d] font-semibold bg-[#f2f4f2] px-3 py-1 rounded-full border border-[#e2e8f7]">
            Verified Member Profile
          </span>
        </div>

        {/* Profile Card Header */}
        <div className="bg-white border border-[#e2e8f7] rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 border-b border-[#e2e8f7] pb-6">
            <div className="flex items-center gap-5">
              <div className={`w-20 h-20 rounded-full ${getAvatarGradient(profile.display_name)} text-white flex items-center justify-center text-3xl font-extrabold shadow-md border-2 border-white`}>
                {profile.display_name.charAt(0).toUpperCase()}
              </div>
              <div className="space-y-1">
                <h1 className="text-2xl font-extrabold text-[#191c1b] tracking-tight">{profile.display_name}</h1>
                <p className="text-[#515f5d] text-sm font-semibold">@{profile.handle}</p>
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <span className="px-3 py-1 bg-[#f2f4f2] text-[#3f4947] text-xs rounded-lg font-semibold border border-[#e2e8f7] flex items-center gap-1">
                    <span className="material-symbols-outlined text-sm text-[#0b6057]">location_on</span>
                    {profile.city}, {profile.general_district}
                  </span>
                  <span className="px-3 py-1 bg-[#9cf2e8]/40 text-[#00504a] border border-[#80d5cb] text-xs rounded-lg font-semibold">
                    {profile.delivery_preference === 'BOTH'
                      ? 'Online & In-Person'
                      : profile.delivery_preference === 'ONLINE'
                      ? 'Online Only'
                      : 'In-Person Only'}
                  </span>
                </div>
              </div>
            </div>

            {/* Trust Metrics Capsules */}
            <div className="flex flex-wrap gap-3 w-full sm:w-auto">
              <div className="flex items-center gap-2 bg-[#f2f4f2] px-4 py-2.5 rounded-2xl border border-[#e2e8f7]">
                <span className="material-symbols-outlined text-[#fe932c] text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                <div>
                  <p className="text-xs font-extrabold text-[#191c1b]">{profile.rating_average.toFixed(1)} / 5.0</p>
                  <p className="text-[10px] text-[#515f5d]">Average Rating</p>
                </div>
              </div>
              <div className="flex items-center gap-2 bg-[#f2f4f2] px-4 py-2.5 rounded-2xl border border-[#e2e8f7]">
                <span className="material-symbols-outlined text-[#0b6057] text-xl">swap_calls</span>
                <div>
                  <p className="text-xs font-extrabold text-[#191c1b]">{profile.completed_exchanges_count}</p>
                  <p className="text-[10px] text-[#515f5d]">Completed Sessions</p>
                </div>
              </div>
              <div className="flex items-center gap-2 bg-[#f2f4f2] px-4 py-2.5 rounded-2xl border border-[#e2e8f7]">
                <span className="material-symbols-outlined text-[#0b6057] text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
                <div>
                  <p className="text-xs font-extrabold text-[#191c1b]">{profile.reliability_score}%</p>
                  <p className="text-[10px] text-[#515f5d]">Reliability Score</p>
                </div>
              </div>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex border-b border-[#e2e8f7] gap-2 pt-2">
            <button
              onClick={() => setActiveTab('overview')}
              className={`pb-3 px-4 text-xs font-bold transition border-b-2 flex items-center gap-2 ${
                activeTab === 'overview'
                  ? 'border-[#0b6057] text-[#0b6057]'
                  : 'border-transparent text-[#515f5d] hover:text-[#191c1b]'
              }`}
            >
              <span className="material-symbols-outlined text-sm">person</span>
              Overview & Skills
            </button>
            <button
              onClick={() => setActiveTab('listings')}
              className={`pb-3 px-4 text-xs font-bold transition border-b-2 flex items-center gap-2 ${
                activeTab === 'listings'
                  ? 'border-[#0b6057] text-[#0b6057]'
                  : 'border-transparent text-[#515f5d] hover:text-[#191c1b]'
              }`}
            >
              <span className="material-symbols-outlined text-sm">storefront</span>
              Active Listings ({totalListingsCount})
            </button>
            <button
              onClick={() => setActiveTab('reviews')}
              className={`pb-3 px-4 text-xs font-bold transition border-b-2 flex items-center gap-2 ${
                activeTab === 'reviews'
                  ? 'border-[#0b6057] text-[#0b6057]'
                  : 'border-transparent text-[#515f5d] hover:text-[#191c1b]'
              }`}
            >
              <span className="material-symbols-outlined text-sm">rate_review</span>
              Verified Reviews ({profile.reviews?.length || 0})
            </button>
          </div>

          {/* Tab Content */}
          {activeTab === 'overview' && (
            <div className="space-y-6 pt-2">
              {/* About Me Section */}
              <div className="space-y-2">
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-[#515f5d]">About Me</h3>
                <p className="text-sm text-[#3f4947] leading-relaxed bg-[#f7faf8] p-4 rounded-2xl border border-[#e2e8f7]">
                  {profile.bio || 'No bio provided.'}
                </p>
              </div>

              {/* Skills Matrix */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {/* Offered Skills */}
                <div className="space-y-3 bg-[#f7faf8] p-5 rounded-2xl border border-[#e2e8f7]">
                  <h3 className="text-xs font-extrabold text-[#0b6057] uppercase tracking-wider flex items-center gap-1">
                    <span className="material-symbols-outlined text-sm">share</span>
                    Skills Offered ({profile.offered_skills.length})
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {profile.offered_skills.length === 0 ? (
                      <span className="text-xs text-[#515f5d]">No skills listed yet.</span>
                    ) : (
                      profile.offered_skills.map((s) => (
                        <span
                          key={s.id}
                          className="px-3 py-1.5 bg-[#9cf2e8]/40 border border-[#80d5cb] text-[#00504a] text-xs rounded-full font-bold shadow-sm"
                        >
                          {s.name}
                        </span>
                      ))
                    )}
                  </div>
                </div>

                {/* Learning Goals */}
                <div className="space-y-3 bg-[#f7faf8] p-5 rounded-2xl border border-[#e2e8f7]">
                  <h3 className="text-xs font-extrabold text-[#191c1b] uppercase tracking-wider flex items-center gap-1">
                    <span className="material-symbols-outlined text-sm">school</span>
                    Skills Learning ({profile.learning_skills.length})
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {profile.learning_skills.length === 0 ? (
                      <span className="text-xs text-[#515f5d]">No learning goals listed yet.</span>
                    ) : (
                      profile.learning_skills.map((s) => (
                        <span
                          key={s.id}
                          className="px-3 py-1.5 bg-[#e6e8ea] border border-[#bec9c6] text-[#191c1b] text-xs rounded-full font-bold shadow-sm"
                        >
                          {s.name}
                        </span>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'listings' && (
            <div className="space-y-6 pt-2">
              {/* Published Service Offers */}
              <div className="space-y-3">
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-[#0b6057] flex items-center gap-1">
                  <span className="material-symbols-outlined text-sm">handshake</span>
                  Service Offers ({profile.service_offers?.length || 0})
                </h3>
                {profile.service_offers && profile.service_offers.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {profile.service_offers.map((offer) => (
                      <div key={offer.id} className="bg-[#f7faf8] p-5 rounded-2xl border border-[#e2e8f7] space-y-3 flex flex-col justify-between">
                        <div className="space-y-1.5">
                          <div className="flex justify-between items-start gap-2">
                            <span className="text-[10px] font-bold text-[#0b6057] bg-teal-50 px-2 py-0.5 rounded-full border border-teal-200">
                              {offer.category_name}
                            </span>
                            <span className="text-[10px] font-bold text-[#515f5d]">
                              ⏱ {offer.duration_minutes} min (1 Credit)
                            </span>
                          </div>
                          <h4 className="text-sm font-bold text-[#191c1b]">{offer.title}</h4>
                          <p className="text-xs text-[#515f5d] line-clamp-2">{offer.description}</p>
                        </div>
                        <Link
                          href={`/marketplace/offers/${offer.id}`}
                          className="w-full text-center py-2 bg-[#0b6057] hover:bg-[#00473f] text-white rounded-xl text-xs font-bold shadow-sm block transition"
                        >
                          Book Session
                        </Link>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-6 text-center text-xs text-[#515f5d] bg-[#f7faf8] rounded-2xl border border-[#e2e8f7]">
                    No active service offers published.
                  </div>
                )}
              </div>

              {/* Open Help Requests */}
              <div className="space-y-3 pt-2">
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-[#191c1b] flex items-center gap-1">
                  <span className="material-symbols-outlined text-sm">help</span>
                  Help Requests ({profile.help_requests?.length || 0})
                </h3>
                {profile.help_requests && profile.help_requests.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {profile.help_requests.map((req) => (
                      <div key={req.id} className="bg-[#f7faf8] p-5 rounded-2xl border border-[#e2e8f7] space-y-3 flex flex-col justify-between">
                        <div className="space-y-1.5">
                          <div className="flex justify-between items-start gap-2">
                            <span className="text-[10px] font-bold text-[#191c1b] bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200">
                              {req.category_name}
                            </span>
                            <span className="text-[10px] font-bold text-[#515f5d]">
                              ⏱ {req.duration_minutes} min (1 Credit)
                            </span>
                          </div>
                          <h4 className="text-sm font-bold text-[#191c1b]">{req.title}</h4>
                          <p className="text-xs text-[#515f5d] line-clamp-2">{req.description}</p>
                        </div>
                        <Link
                          href={`/marketplace/requests/${req.id}`}
                          className="w-full text-center py-2 bg-[#191c1b] hover:bg-black text-white rounded-xl text-xs font-bold shadow-sm block transition"
                        >
                          Offer Help
                        </Link>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-6 text-center text-xs text-[#515f5d] bg-[#f7faf8] rounded-2xl border border-[#e2e8f7]">
                    No open help requests posted.
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'reviews' && (
            <div className="space-y-4 pt-2">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-[#515f5d] flex items-center gap-1">
                <span className="material-symbols-outlined text-sm text-[#fe932c]">star</span>
                Verified Exchange Reviews ({profile.reviews?.length || 0})
              </h3>
              {profile.reviews && profile.reviews.length > 0 ? (
                <div className="space-y-3">
                  {profile.reviews.map((rev) => (
                    <div key={rev.id} className="bg-[#f7faf8] p-4 sm:p-5 rounded-2xl border border-[#e2e8f7] space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-[#0b6057] text-white flex items-center justify-center text-xs font-bold">
                            {rev.author.display_name.charAt(0)}
                          </div>
                          <div>
                            <p className="text-xs font-bold text-[#191c1b]">{rev.author.display_name}</p>
                            {rev.author.handle && (
                              <p className="text-[10px] text-[#515f5d]">@{rev.author.handle}</p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-1 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-lg text-amber-700 font-extrabold text-xs">
                          <span>{rev.rating}.0</span>
                          <span className="material-symbols-outlined text-xs" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                        </div>
                      </div>

                      {rev.comment_text && (
                        <p className="text-xs text-[#3f4947] leading-relaxed pt-1">{rev.comment_text}</p>
                      )}

                      {rev.attribute_tags && rev.attribute_tags.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 pt-2">
                          {rev.attribute_tags.map((tag, idx) => (
                            <span key={idx} className="text-[10px] font-bold text-[#00504a] bg-[#9cf2e8]/40 border border-[#80d5cb] px-2 py-0.5 rounded-full">
                              ✓ {tag}
                            </span>
                          ))}
                        </div>
                      )}
                      <span className="text-[9px] text-[#515f5d] block text-right">
                        Verified Exchange • {new Date(rev.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center text-xs text-[#515f5d] bg-[#f7faf8] rounded-2xl border border-[#e2e8f7] space-y-2">
                  <span className="material-symbols-outlined text-3xl opacity-40">rate_review</span>
                  <p>No verified reviews revealed yet. Reviews are double-blind and reveal post-exchange completion.</p>
                </div>
              )}
            </div>
          )}

          {/* Privacy Note */}
          <div className="text-center pt-4 border-t border-[#e2e8f7]">
            <span className="text-xs text-[#515f5d]">
              🔒 Privacy by Default: Email address, private credentials, and residential details remain strictly confidential.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
