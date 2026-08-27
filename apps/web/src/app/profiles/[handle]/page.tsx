import Link from 'next/link';
import { notFound } from 'next/navigation';

interface PublicProfileData {
  id: string;
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
  created_at: string;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

async function getPublicProfile(handle: string): Promise<PublicProfileData | null> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/v1/profiles/${handle}`, {
      cache: 'no-store',
    });
    if (!res.ok) return null;
    const json = await res.json();
    return json.success ? json.data : null;
  } catch (err) {
    return null;
  }
}

export default async function PublicProfilePage({
  params,
}: {
  params: Promise<{ handle: string }>;
}) {
  const { handle } = await params;
  const profile = await getPublicProfile(handle);

  if (!profile) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-[#fcfdfd] text-[#191c1b] p-4 sm:p-8 flex justify-center">
      <div className="max-w-4xl w-full space-y-6">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between">
          <Link href="/discover" className="text-xs text-[#0b6057] hover:underline font-bold flex items-center gap-1">
            <span className="material-symbols-outlined text-sm">arrow_back</span>
            <span>Back to Marketplace</span>
          </Link>
          <span className="text-xs text-[#515f5d] font-semibold">Reputation Profile</span>
        </div>

        {/* Profile Card Header */}
        <div className="bg-white border border-[#e2e8f7] rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 border-b border-[#e2e8f7] pb-6">
            <div className="flex items-center gap-5">
              <div className="w-20 h-20 rounded-full bg-[#0b6057] text-white flex items-center justify-center text-3xl font-extrabold shadow-sm">
                {profile.display_name.charAt(0)}
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
              <div className="flex items-center gap-2 bg-[#f2f4f2] px-4 py-2 rounded-xl border border-[#e2e8f7]">
                <span className="material-symbols-outlined text-[#fe932c] text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                <div>
                  <p className="text-xs font-bold text-[#191c1b]">{profile.rating_average.toFixed(1)} Rating</p>
                </div>
              </div>
              <div className="flex items-center gap-2 bg-[#f2f4f2] px-4 py-2 rounded-xl border border-[#e2e8f7]">
                <span className="material-symbols-outlined text-[#0b6057] text-lg">swap_calls</span>
                <div>
                  <p className="text-xs font-bold text-[#191c1b]">{profile.completed_exchanges_count} Exchanges</p>
                </div>
              </div>
              <div className="flex items-center gap-2 bg-[#f2f4f2] px-4 py-2 rounded-xl border border-[#e2e8f7]">
                <span className="material-symbols-outlined text-[#0b6057] text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
                <div>
                  <p className="text-xs font-bold text-[#191c1b]">{profile.reliability_score}% Reliability</p>
                </div>
              </div>
            </div>
          </div>

          {/* About Me Section */}
          <div className="space-y-2">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-[#515f5d]">About Me</h3>
            <p className="text-sm text-[#3f4947] leading-relaxed bg-[#f7faf8] p-4 rounded-2xl border border-[#e2e8f7]">
              {profile.bio || 'No bio provided.'}
            </p>
          </div>

          {/* Skills Matrix */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
            {/* Offered Skills */}
            <div className="space-y-3 bg-[#f7faf8] p-5 rounded-2xl border border-[#e2e8f7]">
              <h3 className="text-xs font-extrabold text-[#0b6057] uppercase tracking-wider">
                Skills I Can Share ({profile.offered_skills.length})
              </h3>
              <div className="flex flex-wrap gap-2">
                {profile.offered_skills.length === 0 ? (
                  <span className="text-xs text-[#515f5d]">None listed.</span>
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
              <h3 className="text-xs font-extrabold text-[#191c1b] uppercase tracking-wider">
                Skills I Want to Learn ({profile.learning_skills.length})
              </h3>
              <div className="flex flex-wrap gap-2">
                {profile.learning_skills.length === 0 ? (
                  <span className="text-xs text-[#515f5d]">None listed.</span>
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
