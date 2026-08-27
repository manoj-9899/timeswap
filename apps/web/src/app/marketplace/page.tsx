'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { apiClient } from '@/lib/api-client';

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface Offer {
  id: string;
  title: string;
  description: string;
  duration_minutes: number;
  supported_durations: number[];
  delivery_format: string;
  city: string;
  general_district: string;
  status: string;
  category: Category;
  provider: {
    id: string;
    display_name: string;
    handle: string;
    avatar_url: string | null;
    rating_average: number;
    completed_exchanges_count: number;
    city: string;
    general_district: string;
  } | null;
}

interface HelpRequest {
  id: string;
  title: string;
  description: string;
  target_duration_minutes: number;
  delivery_format: string;
  urgency_tag?: string;
  city: string;
  general_district: string;
  status: string;
  category: Category;
  requester: {
    id: string;
    display_name: string;
    handle: string;
    avatar_url: string | null;
    rating_average: number;
    completed_exchanges_count: number;
    city: string;
    general_district: string;
  } | null;
}

interface Member {
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
  offered_skills: { id: string; name: string }[];
  learning_skills: { id: string; name: string }[];
}

interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export default function MarketplacePage() {
  const [activeTab, setActiveTab] = useState<'offers' | 'requests' | 'members'>('offers');
  const [categories, setCategories] = useState<Category[]>([]);
  
  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedFormat, setSelectedFormat] = useState('');
  const [selectedDuration, setSelectedDuration] = useState('');
  const [locationQuery, setLocationQuery] = useState('');
  const [page, setPage] = useState(1);

  // Result state
  const [offersData, setOffersData] = useState<PaginatedResponse<Offer>>({ items: [], total: 0, page: 1, limit: 10, totalPages: 1 });
  const [requestsData, setRequestsData] = useState<PaginatedResponse<HelpRequest>>({ items: [], total: 0, page: 1, limit: 10, totalPages: 1 });
  const [membersData, setMembersData] = useState<PaginatedResponse<Member>>({ items: [], total: 0, page: 1, limit: 10, totalPages: 1 });
  const [loading, setLoading] = useState(true);

  // Load categories taxonomy
  useEffect(() => {
    async function loadCategories() {
      try {
        const res = await apiClient.get<Category[]>('/skills/categories');
        if (res.success && Array.isArray(res.data)) {
          setCategories(res.data);
        }
      } catch (err) {
        console.error('Failed to load categories', err);
      }
    }
    loadCategories();
  }, []);

  // Fetch items based on activeTab and filters
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      if (activeTab === 'offers') {
        const params = new URLSearchParams();
        if (searchQuery) params.append('q', searchQuery);
        if (selectedCategory) params.append('category_id', selectedCategory);
        if (selectedFormat) params.append('delivery_format', selectedFormat);
        if (selectedDuration) params.append('duration', selectedDuration);
        if (locationQuery) params.append('city', locationQuery);
        params.append('page', String(page));
        params.append('limit', '10');

        const res = await apiClient.get<PaginatedResponse<Offer>>(`/discovery/offers?${params.toString()}`);
        if (res.success && res.data) {
          setOffersData(res.data);
        }
      } else if (activeTab === 'requests') {
        const params = new URLSearchParams();
        if (searchQuery) params.append('q', searchQuery);
        if (selectedCategory) params.append('category_id', selectedCategory);
        if (selectedFormat) params.append('preferred_format', selectedFormat);
        if (selectedDuration) params.append('target_duration', selectedDuration);
        if (locationQuery) params.append('city', locationQuery);
        params.append('page', String(page));
        params.append('limit', '10');

        const res = await apiClient.get<PaginatedResponse<HelpRequest>>(`/discovery/requests?${params.toString()}`);
        if (res.success && res.data) {
          setRequestsData(res.data);
        }
      } else if (activeTab === 'members') {
        const params = new URLSearchParams();
        if (searchQuery) params.append('q', searchQuery);
        if (selectedFormat) params.append('delivery_preference', selectedFormat);
        if (locationQuery) params.append('city', locationQuery);
        params.append('page', String(page));
        params.append('limit', '10');

        const res = await apiClient.get<PaginatedResponse<Member>>(`/discovery/members?${params.toString()}`);
        if (res.success && res.data) {
          setMembersData(res.data);
        }
      }
    } catch (err) {
      console.error('Discovery search failed:', err);
    } finally {
      setLoading(false);
    }
  }, [activeTab, searchQuery, selectedCategory, selectedFormat, selectedDuration, locationQuery, page]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedCategory('');
    setSelectedFormat('');
    setSelectedDuration('');
    setLocationQuery('');
    setPage(1);
  };

  return (
    <div className="min-h-screen bg-[#fcfdfd] text-[#191c1b] py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-[1200px] mx-auto space-y-8">
        {/* Header Banner */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-[#e2e8f7] pb-6">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-[#ffdcc3]/60 text-[#663500] border border-[#ffb77d] uppercase tracking-wider">
                Discovery Catalog
              </span>
            </div>
            <h1 className="text-3xl font-extrabold text-[#191c1b] tracking-tight sm:text-4xl mt-2">
              TimeSwap Skill Marketplace
            </h1>
            <p className="text-[#3f4947] mt-1 text-sm sm:text-base">
              Discover skill offers, community requests, and verified local members. 60 min = 1.0 credit.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/marketplace/publish"
              className="inline-flex items-center justify-center px-5 py-2.5 rounded-xl bg-[#0b6057] hover:bg-[#00473f] font-bold text-white shadow-sm transition text-sm"
            >
              + Create Listing
            </Link>
            <Link
              href="/users/me/listings"
              className="inline-flex items-center justify-center px-4 py-2.5 rounded-xl bg-white text-[#3f4947] hover:bg-[#f2f4f2] font-semibold text-sm border border-[#e2e8f7] transition shadow-sm"
            >
              My Listings
            </Link>
          </div>
        </div>

        {/* Search Bar & Primary Filters Container */}
        <div className="bg-white p-6 rounded-3xl border border-[#e2e8f7] space-y-5 shadow-sm">
          {/* Main Search Bar */}
          <div className="relative">
            <span className="material-symbols-outlined absolute left-4 top-3.5 text-[#515f5d]">search</span>
            <input
              type="text"
              placeholder="Search coding, Spanish, music, design, or keywords..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(1);
              }}
              className="w-full bg-white border border-[#e2e8f7] rounded-xl pl-12 pr-10 py-3 text-sm text-[#191c1b] placeholder-[#515f5d] focus:outline-none focus:border-[#0b6057] transition"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3.5 top-3 text-[#515f5d] hover:text-[#191c1b] text-sm font-bold"
              >
                &times;
              </button>
            )}
          </div>

          {/* Category Pills Bar */}
          <div className="flex overflow-x-auto pb-2 gap-2 no-scrollbar">
            <button
              onClick={() => { setSelectedCategory(''); setPage(1); }}
              className={`whitespace-nowrap px-4 py-2 rounded-full font-bold text-xs transition-colors ${
                selectedCategory === ''
                  ? 'bg-[#0b6057] text-white'
                  : 'bg-white border border-[#e2e8f7] text-[#3f4947] hover:bg-[#f2f4f2]'
              }`}
            >
              All Categories
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => { setSelectedCategory(cat.id); setPage(1); }}
                className={`whitespace-nowrap px-4 py-2 rounded-full font-bold text-xs transition-colors ${
                  selectedCategory === cat.id
                    ? 'bg-[#0b6057] text-white'
                    : 'bg-white border border-[#e2e8f7] text-[#3f4947] hover:bg-[#f2f4f2]'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>

          {/* Format & Duration Filter Toggles */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-[#e2e8f7]">
            <div>
              <label className="block text-[11px] font-extrabold text-[#515f5d] uppercase tracking-wider mb-1">
                Format
              </label>
              <select
                value={selectedFormat}
                onChange={(e) => { setSelectedFormat(e.target.value); setPage(1); }}
                className="w-full bg-[#f2f4f2] border border-[#e2e8f7] rounded-xl px-3 py-2 text-xs font-semibold text-[#191c1b] focus:outline-none focus:border-[#0b6057]"
              >
                <option value="">All Formats</option>
                <option value="ONLINE">Online Session</option>
                <option value="IN_PERSON">In-Person</option>
                <option value="BOTH">Hybrid / Both</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-extrabold text-[#515f5d] uppercase tracking-wider mb-1">
                Duration
              </label>
              <select
                value={selectedDuration}
                onChange={(e) => { setSelectedDuration(e.target.value); setPage(1); }}
                className="w-full bg-[#f2f4f2] border border-[#e2e8f7] rounded-xl px-3 py-2 text-xs font-semibold text-[#191c1b] focus:outline-none focus:border-[#0b6057]"
                disabled={activeTab === 'members'}
              >
                <option value="">All Durations</option>
                <option value="30">30 minutes (0.5 Credit)</option>
                <option value="60">60 minutes (1.0 Credit)</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-extrabold text-[#515f5d] uppercase tracking-wider mb-1">
                City / Location
              </label>
              <input
                type="text"
                placeholder="e.g. San Francisco"
                value={locationQuery}
                onChange={(e) => { setLocationQuery(e.target.value); setPage(1); }}
                className="w-full bg-[#f2f4f2] border border-[#e2e8f7] rounded-xl px-3 py-2 text-xs font-semibold text-[#191c1b] focus:outline-none focus:border-[#0b6057]"
              />
            </div>
          </div>

          {(searchQuery || selectedCategory || selectedFormat || selectedDuration || locationQuery) && (
            <div className="flex items-center justify-between pt-2 border-t border-[#e2e8f7]">
              <span className="text-xs text-[#515f5d]">Active discovery filters applied</span>
              <button
                onClick={handleResetFilters}
                className="text-xs text-[#0b6057] font-bold hover:underline"
              >
                Reset All Filters
              </button>
            </div>
          )}
        </div>

        {/* Category Navigation Tabs */}
        <div className="flex items-center gap-6 border-b border-[#e2e8f7]">
          <button
            onClick={() => { setActiveTab('offers'); setPage(1); }}
            className={`pb-3 font-bold text-sm transition border-b-2 ${
              activeTab === 'offers'
                ? 'border-[#0b6057] text-[#0b6057]'
                : 'border-transparent text-[#515f5d] hover:text-[#191c1b]'
            }`}
          >
            Service Offers ({offersData.total})
          </button>
          <button
            onClick={() => { setActiveTab('requests'); setPage(1); }}
            className={`pb-3 font-bold text-sm transition border-b-2 ${
              activeTab === 'requests'
                ? 'border-[#0b6057] text-[#0b6057]'
                : 'border-transparent text-[#515f5d] hover:text-[#191c1b]'
            }`}
          >
            Help Requests ({requestsData.total})
          </button>
          <button
            onClick={() => { setActiveTab('members'); setPage(1); }}
            className={`pb-3 font-bold text-sm transition border-b-2 ${
              activeTab === 'members'
                ? 'border-[#0b6057] text-[#0b6057]'
                : 'border-transparent text-[#515f5d] hover:text-[#191c1b]'
            }`}
          >
            Community Members ({membersData.total})
          </button>
        </div>

        {/* Content Section */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-64 bg-white rounded-3xl border border-[#e2e8f7] shadow-sm" />
            ))}
          </div>
        ) : activeTab === 'offers' ? (
          offersData.items.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-3xl border border-[#e2e8f7] space-y-4 shadow-sm">
              <span className="material-symbols-outlined text-4xl text-[#515f5d]">search_off</span>
              <p className="text-[#191c1b] font-extrabold text-base">No matching service offers found</p>
              <button
                onClick={handleResetFilters}
                className="px-4 py-2 rounded-xl bg-[#9cf2e8]/40 text-[#00504a] font-bold text-xs border border-[#80d5cb]"
              >
                Reset All Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {offersData.items.map((offer) => (
                <div
                  key={offer.id}
                  className="bg-white rounded-2xl border border-[#e2e8f7] p-6 hover:shadow-md transition-all duration-300 group flex flex-col justify-between"
                >
                  <div className="space-y-4">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-[#0b6057] text-white flex items-center justify-center font-bold text-base shadow-sm">
                          {offer.provider?.display_name?.[0] || 'P'}
                        </div>
                        <div>
                          <h4 className="font-bold text-sm text-[#191c1b]">{offer.provider?.display_name || 'Provider'}</h4>
                          <div className="flex items-center text-xs text-[#fe932c]">
                            <span className="material-symbols-outlined text-xs" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                            <span className="ml-1 font-bold">{Number(offer.provider?.rating_average || 5.0).toFixed(1)}</span>
                          </div>
                        </div>
                      </div>
                      <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-[#ffdcc3]/50 text-[#663500] border border-[#ffb77d] text-xs font-bold">
                        <span className="material-symbols-outlined text-xs text-[#904d00]">schedule</span>
                        {offer.duration_minutes === 60 ? '60 min • 1.0 CR' : '30 min • 0.5 CR'}
                      </div>
                    </div>

                    <h3 className="text-lg font-bold text-[#191c1b] group-hover:text-[#0b6057] transition line-clamp-2">
                      {offer.title}
                    </h3>
                    <p className="text-[#3f4947] text-xs line-clamp-3 leading-relaxed">
                      {offer.description}
                    </p>

                    <div className="flex flex-wrap gap-2 pt-1">
                      <span className="px-2.5 py-1 bg-[#f2f4f2] text-[#515f5d] rounded-md text-xs font-bold">
                        {offer.category?.name || 'General'}
                      </span>
                      <span className="px-2.5 py-1 bg-[#f2f4f2] text-[#515f5d] rounded-md text-xs font-bold">
                        {offer.delivery_format}
                      </span>
                    </div>
                  </div>

                  <div className="pt-6 mt-4 border-t border-[#e2e8f7]">
                    <Link
                      href={`/marketplace/offers/${offer.id}`}
                      className="w-full py-2.5 rounded-xl border-2 border-[#0b6057] text-[#0b6057] font-bold text-xs flex items-center justify-center gap-1 hover:bg-[#0b6057] hover:text-white transition-all shadow-sm"
                    >
                      Request Session
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )
        ) : activeTab === 'requests' ? (
          requestsData.items.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-3xl border border-[#e2e8f7] space-y-4 shadow-sm">
              <span className="material-symbols-outlined text-4xl text-[#515f5d]">search_off</span>
              <p className="text-[#191c1b] font-extrabold text-base">No matching help requests found</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {requestsData.items.map((req) => (
                <div
                  key={req.id}
                  className="bg-white rounded-2xl border border-[#e2e8f7] p-6 hover:shadow-md transition-all duration-300 group flex flex-col justify-between"
                >
                  <div className="space-y-4">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-[#0b6057] text-white flex items-center justify-center font-bold text-base shadow-sm">
                          {req.requester?.display_name?.[0] || 'R'}
                        </div>
                        <div>
                          <h4 className="font-bold text-sm text-[#191c1b]">{req.requester?.display_name || 'Requester'}</h4>
                          <span className="text-xs text-[#515f5d]">{req.city || 'Online'}</span>
                        </div>
                      </div>
                      <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-[#ffdcc3]/50 text-[#663500] border border-[#ffb77d] text-xs font-bold">
                        <span className="material-symbols-outlined text-xs text-[#904d00]">schedule</span>
                        {req.target_duration_minutes === 60 ? '60 min • 1.0 CR' : '30 min • 0.5 CR'}
                      </div>
                    </div>

                    <h3 className="text-lg font-bold text-[#191c1b] group-hover:text-[#0b6057] transition line-clamp-2">
                      {req.title}
                    </h3>
                    <p className="text-[#3f4947] text-xs line-clamp-3 leading-relaxed">
                      {req.description}
                    </p>
                  </div>

                  <div className="pt-6 mt-4 border-t border-[#e2e8f7]">
                    <Link
                      href={`/marketplace/requests/${req.id}`}
                      className="w-full py-2.5 rounded-xl border-2 border-[#0b6057] text-[#0b6057] font-bold text-xs flex items-center justify-center gap-1 hover:bg-[#0b6057] hover:text-white transition-all shadow-sm"
                    >
                      Offer Help
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )
        ) : (
          /* Members Grid */
          membersData.items.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-3xl border border-[#e2e8f7] space-y-4 shadow-sm">
              <span className="material-symbols-outlined text-4xl text-[#515f5d]">search_off</span>
              <p className="text-[#191c1b] font-extrabold text-base">No community members found</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {membersData.items.map((member) => (
                <div
                  key={member.id}
                  className="bg-white rounded-2xl border border-[#e2e8f7] p-6 hover:shadow-md transition-all duration-300 group flex flex-col justify-between"
                >
                  <div className="space-y-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-[#0b6057] text-white flex items-center justify-center font-bold text-base shadow-sm">
                          {member.display_name[0]}
                        </div>
                        <div>
                          <h4 className="font-bold text-sm text-[#191c1b] group-hover:text-[#0b6057] transition">{member.display_name}</h4>
                          <p className="text-xs text-[#515f5d]">@{member.handle}</p>
                        </div>
                      </div>
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#ffdcc3]/50 text-[#663500] border border-[#ffb77d] flex items-center gap-1">
                        <span className="material-symbols-outlined text-xs text-[#fe932c]" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                        {Number(member.rating_average || 5.0).toFixed(1)}
                      </span>
                    </div>

                    <p className="text-[#3f4947] text-xs line-clamp-2 leading-relaxed">
                      {member.bio || 'Verified TimeSwap community member sharing skills non-monetarily.'}
                    </p>

                    <div className="flex items-center gap-2 text-xs text-[#515f5d]">
                      <span>📍 {member.city}, {member.general_district}</span>
                      <span>•</span>
                      <span>🤝 {member.completed_exchanges_count} exchanges</span>
                    </div>
                  </div>

                  <div className="pt-6 mt-4 border-t border-[#e2e8f7]">
                    <Link
                      href={`/profiles/${member.handle}`}
                      className="w-full py-2.5 rounded-xl border border-[#0b6057] text-[#0b6057] hover:bg-[#0b6057] hover:text-white font-bold text-xs flex items-center justify-center transition-all shadow-sm"
                    >
                      View Reputation Profile
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )
        )}
      </div>
    </div>
  );
}
