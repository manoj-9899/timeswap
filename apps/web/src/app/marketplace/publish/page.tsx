'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiClient } from '@/lib/api-client';

interface Category {
  id: string;
  name: string;
  slug: string;
}

export default function PublishListingPage() {
  const router = useRouter();
  const [listingType, setListingType] = useState<'offer' | 'request'>('offer');

  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryId, setCategoryId] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [deliveryFormat, setDeliveryFormat] = useState<'ONLINE' | 'IN_PERSON' | 'BOTH'>('ONLINE');
  const [durations, setDurations] = useState<number[]>([60]);
  const [targetDuration, setTargetDuration] = useState<number>(60);
  const [urgency, setUrgency] = useState<'URGENT' | 'THIS_WEEK' | 'FLEXIBLE'>('FLEXIBLE');
  const [city, setCity] = useState('');
  const [district, setDistrict] = useState('');

  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const res = await apiClient.get<Category[]>('/skills/categories');
      if (res.success && res.data && res.data.length > 0) {
        setCategories(res.data);
        setCategoryId(res.data[0].id);
      }
    } catch (err) {
      console.error('Failed to load categories:', err);
    }
  };

  const handleDurationToggle = (mins: number) => {
    if (durations.includes(mins)) {
      if (durations.length > 1) {
        setDurations(durations.filter((d) => d !== mins));
      }
    } else {
      setDurations([...durations, mins]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (title.trim().length < 5) {
      setErrorMsg('Title must be at least 5 characters long.');
      return;
    }
    if (description.trim().length < 20) {
      setErrorMsg('Description must be at least 20 characters long.');
      return;
    }
    if (!categoryId) {
      setErrorMsg('Please select a valid category.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (listingType === 'offer') {
        const payload = {
          title: title.trim(),
          description: description.trim(),
          category_id: categoryId,
          supported_durations: durations,
          delivery_format: deliveryFormat,
          city: city.trim() || undefined,
          general_district: district.trim() || undefined,
        };

        const res = await apiClient.post<{ id: string }>('/offers', payload);
        if (res.success && res.data) {
          router.push(`/marketplace/offers/${res.data.id}`);
        } else {
          setErrorMsg(res.error?.message || 'Failed to create service offer.');
        }
      } else {
        const payload = {
          title: title.trim(),
          description: description.trim(),
          category_id: categoryId,
          target_duration: targetDuration,
          preferred_format: deliveryFormat,
          urgency,
          city: city.trim() || undefined,
          general_district: district.trim() || undefined,
        };

        const res = await apiClient.post<{ id: string }>('/requests', payload);
        if (res.success && res.data) {
          router.push(`/marketplace/requests/${res.data.id}`);
        } else {
          setErrorMsg(res.error?.message || 'Failed to create help request.');
        }
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'An unexpected error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#fcfdfd] text-[#191c1b] py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#e2e8f7] pb-6">
          <div>
            <Link
              href="/marketplace"
              className="text-xs font-bold text-[#0b6057] hover:underline transition mb-2 inline-flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-sm">arrow_back</span>
              <span>Back to Marketplace</span>
            </Link>
            <h1 className="text-3xl font-extrabold text-[#191c1b] tracking-tight">
              Create Marketplace Listing
            </h1>
          </div>
        </div>

        {/* Listing Type Switcher */}
        <div className="grid grid-cols-2 gap-3 bg-white p-2 rounded-3xl border border-[#e2e8f7] shadow-sm">
          <button
            type="button"
            onClick={() => setListingType('offer')}
            className={`py-3.5 rounded-2xl font-extrabold text-sm transition flex flex-col items-center justify-center gap-0.5 ${
              listingType === 'offer'
                ? 'bg-[#0b6057] text-white shadow-sm'
                : 'text-[#515f5d] hover:text-[#191c1b]'
            }`}
          >
            <span>Offer a Skill</span>
            <span className="text-[11px] font-normal opacity-90">I want to share my knowledge</span>
          </button>
          <button
            type="button"
            onClick={() => setListingType('request')}
            className={`py-3.5 rounded-2xl font-extrabold text-sm transition flex flex-col items-center justify-center gap-0.5 ${
              listingType === 'request'
                ? 'bg-[#0b6057] text-white shadow-sm'
                : 'text-[#515f5d] hover:text-[#191c1b]'
            }`}
          >
            <span>Request Help</span>
            <span className="text-[11px] font-normal opacity-90">I need assistance from others</span>
          </button>
        </div>

        {/* Form Container */}
        <form onSubmit={handleSubmit} className="bg-white border border-[#e2e8f7] rounded-3xl p-6 sm:p-8 space-y-6 shadow-sm">
          {errorMsg && (
            <div className="p-4 rounded-2xl bg-[#ffdad6] border border-[#ba1a1a]/30 text-[#93000a] text-xs font-bold flex items-center gap-2">
              <span className="material-symbols-outlined text-sm">error</span>
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Title */}
          <div className="space-y-2">
            <label className="block text-xs font-extrabold text-[#191c1b]">
              Listing Title <span className="text-[#ba1a1a]">*</span>
            </label>
            <input
              type="text"
              required
              minLength={5}
              maxLength={100}
              placeholder={
                listingType === 'offer'
                  ? 'e.g. 1-on-1 Python & Data Science Mentorship'
                  : 'e.g. Need assistance setting up Next.js App Router'
              }
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-white border border-[#e2e8f7] rounded-xl px-4 py-3 text-sm text-[#191c1b] placeholder-[#515f5d]/60 focus:outline-none focus:border-[#0b6057] transition font-medium"
            />
            <p className="text-[11px] text-[#515f5d]">Clear, descriptive title between 5 and 100 characters.</p>
          </div>

          {/* Category Selection */}
          <div className="space-y-2">
            <label className="block text-xs font-extrabold text-[#191c1b]">
              Skill Category <span className="text-[#ba1a1a]">*</span>
            </label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full bg-white border border-[#e2e8f7] rounded-xl px-4 py-3 text-sm text-[#191c1b] focus:outline-none focus:border-[#0b6057] transition font-medium"
            >
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <label className="block text-xs font-extrabold text-[#191c1b]">
              Detailed Description <span className="text-[#ba1a1a]">*</span>
            </label>
            <textarea
              required
              minLength={20}
              maxLength={2000}
              rows={5}
              placeholder={
                listingType === 'offer'
                  ? 'Describe what you will cover, prerequisites, and what learners can expect to achieve during the session...'
                  : 'Describe your issue, what tools you are using, and specific help you need...'
              }
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-white border border-[#e2e8f7] rounded-xl p-4 text-sm text-[#191c1b] placeholder-[#515f5d]/60 focus:outline-none focus:border-[#0b6057] transition font-medium"
            />
            <div className="flex justify-between text-[11px] text-[#515f5d]">
              <span>Minimum 20 characters</span>
              <span>{description.length} / 2000</span>
            </div>
          </div>

          {/* Duration & Non-monetary Economics */}
          <div className="space-y-3 pt-2">
            <label className="block text-xs font-extrabold text-[#191c1b]">
              {listingType === 'offer' ? 'Supported Session Durations' : 'Target Session Duration'}
            </label>
            {listingType === 'offer' ? (
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 cursor-pointer bg-[#f2f4f2] border border-[#e2e8f7] rounded-xl px-4 py-3 hover:border-[#0b6057] transition">
                  <input
                    type="checkbox"
                    checked={durations.includes(30)}
                    onChange={() => handleDurationToggle(30)}
                    className="accent-[#0b6057] rounded"
                  />
                  <span className="text-xs font-bold text-[#191c1b]">30 min (0.5 Credit)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer bg-[#f2f4f2] border border-[#e2e8f7] rounded-xl px-4 py-3 hover:border-[#0b6057] transition">
                  <input
                    type="checkbox"
                    checked={durations.includes(60)}
                    onChange={() => handleDurationToggle(60)}
                    className="accent-[#0b6057] rounded"
                  />
                  <span className="text-xs font-bold text-[#191c1b]">60 min (1.0 Credit)</span>
                </label>
              </div>
            ) : (
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 cursor-pointer bg-[#f2f4f2] border border-[#e2e8f7] rounded-xl px-4 py-3 hover:border-[#0b6057] transition">
                  <input
                    type="radio"
                    name="targetDuration"
                    checked={targetDuration === 30}
                    onChange={() => setTargetDuration(30)}
                    className="accent-[#0b6057]"
                  />
                  <span className="text-xs font-bold text-[#191c1b]">30 min (0.5 Credit)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer bg-[#f2f4f2] border border-[#e2e8f7] rounded-xl px-4 py-3 hover:border-[#0b6057] transition">
                  <input
                    type="radio"
                    name="targetDuration"
                    checked={targetDuration === 60}
                    onChange={() => setTargetDuration(60)}
                    className="accent-[#0b6057]"
                  />
                  <span className="text-xs font-bold text-[#191c1b]">60 min (1.0 Credit)</span>
                </label>
              </div>
            )}
          </div>

          {/* Delivery Format */}
          <div className="space-y-3 pt-2">
            <label className="block text-xs font-extrabold text-[#191c1b]">Delivery Format</label>
            <div className="grid grid-cols-3 gap-3">
              {(['ONLINE', 'IN_PERSON', 'BOTH'] as const).map((fmt) => (
                <button
                  key={fmt}
                  type="button"
                  onClick={() => setDeliveryFormat(fmt)}
                  className={`py-3 rounded-xl text-xs font-bold border transition ${
                    deliveryFormat === fmt
                      ? 'bg-[#9cf2e8]/40 border-[#80d5cb] text-[#00504a]'
                      : 'bg-[#f2f4f2] border-[#e2e8f7] text-[#3f4947] hover:text-[#191c1b]'
                  }`}
                >
                  {fmt === 'ONLINE' ? 'Online' : fmt === 'IN_PERSON' ? 'In-Person' : 'Hybrid / Both'}
                </button>
              ))}
            </div>
          </div>

          {/* Location details for In-Person */}
          {(deliveryFormat === 'IN_PERSON' || deliveryFormat === 'BOTH') && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="space-y-2">
                <label className="block text-xs font-bold text-[#191c1b]">City</label>
                <input
                  type="text"
                  placeholder="e.g. San Francisco"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full bg-white border border-[#e2e8f7] rounded-xl px-3.5 py-2.5 text-xs text-[#191c1b] focus:outline-none focus:border-[#0b6057]"
                />
              </div>
              <div className="space-y-2">
                <label className="block text-xs font-bold text-[#191c1b]">General District</label>
                <input
                  type="text"
                  placeholder="e.g. Mission District"
                  value={district}
                  onChange={(e) => setDistrict(e.target.value)}
                  className="w-full bg-white border border-[#e2e8f7] rounded-xl px-3.5 py-2.5 text-xs text-[#191c1b] focus:outline-none focus:border-[#0b6057]"
                />
              </div>
            </div>
          )}

          {/* Submit Action */}
          <div className="pt-6">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 rounded-xl font-bold text-xs text-white bg-[#0b6057] hover:bg-[#00473f] shadow-sm transition flex items-center justify-center disabled:opacity-50"
            >
              {isSubmitting
                ? 'Publishing...'
                : listingType === 'offer'
                ? 'Publish Skill Offer'
                : 'Publish Help Request'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
