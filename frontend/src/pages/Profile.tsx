import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  MapPin, Briefcase, Calendar, Phone, ExternalLink,
  Edit2, User, Building2, PlusCircle, ArrowRight, Globe, Lock,
} from 'lucide-react';
import api, { uploadUrl } from '../api/client';
import { useAuth } from '../contexts/AuthContext';
import VisibilityPrompt from '../components/VisibilityPrompt';

interface ProfileData {
  full_name?: string;
  bio?: string;
  phone?: string;
  location?: string;
  occupation?: string;
  dob?: string;
  native_place?: string;
  gothram?: string;
  photo_filename?: string;
  linkedin?: string;
  website?: string;
  is_public?: boolean | null;
}

interface BusinessData {
  id: number;
  company_name: string;
  tagline?: string;
  category?: string;
  city?: string;
  logo_filename?: string;
}

const BUSINESS_OCCUPATIONS = ['Business', 'Self-Employed'];

function InfoChip({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="flex items-center gap-1.5 text-sm text-gray-600 bg-gray-50 rounded-lg px-3 py-1.5">
      <span className="text-gray-400">{icon}</span>
      {text}
    </div>
  );
}

export default function Profile() {
  const { username } = useParams();
  const { user: authUser } = useAuth();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [userData, setUserData] = useState<any>(null);
  const [business, setBusiness] = useState<BusinessData | null | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [showPrompt, setShowPrompt] = useState(false);

  const isOwn = !username || username === authUser?.username;
  const resolvedUsername = username || authUser?.username;

  useEffect(() => {
    const req = isOwn ? api.get('/profile') : api.get(`/users/${username}`);
    req
      .then((r) => {
        const p = r.data.profile;
        setProfile(p);
        setUserData(r.data.user);
        if (isOwn && p && p.is_public === null) setShowPrompt(true);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [username, isOwn]);

  useEffect(() => {
    if (!resolvedUsername) return;
    api.get(`/users/${resolvedUsername}/business`)
      .then((r) => setBusiness(r.data.business))
      .catch(() => setBusiness(null));
  }, [resolvedUsername]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="w-8 h-8 border-4 border-saffron-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Non-owner viewing a private profile
  if (!isOwn && profile?.is_public === false) {
    return (
      <div className="max-w-lg mx-auto px-4 py-20 text-center">
        <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-4">
          <Lock size={28} className="text-gray-400" />
        </div>
        <h2 className="font-display font-bold text-xl text-gray-800 mb-2">Private Profile</h2>
        <p className="text-gray-500">This member has chosen to keep their profile private.</p>
      </div>
    );
  }

  const displayName = profile?.full_name || userData?.username || 'Community Member';
  const photoUrl = profile?.photo_filename ? uploadUrl(profile.photo_filename) : null;
  const isBizOccupation = BUSINESS_OCCUPATIONS.includes(profile?.occupation || '');

  return (
    <>
      {showPrompt && (
        <VisibilityPrompt
          onDecision={(isPublic) => {
            setShowPrompt(false);
            setProfile((p) => (p ? { ...p, is_public: isPublic } : p));
          }}
        />
      )}

      <div className="max-w-4xl mx-auto px-4 py-10">
        {/* Cover + Avatar */}
        <div className="card overflow-hidden mb-6">
          <div className="h-36 bg-gradient-to-r from-saffron-500 via-saffron-600 to-orange-700" />
          <div className="px-5 sm:px-6 pb-6 relative">
            {/* Edit button — absolute top-right, never competes with text */}
            {isOwn && (
              <Link to="/profile/edit" className="btn-outline flex items-center gap-2 absolute top-4 right-5 sm:right-6 text-sm">
                <Edit2 size={14} /> Edit
              </Link>
            )}

            {/* Row 1: Avatar only — overlaps cover */}
            <div className="-mt-12 mb-4 inline-block">
              <div className="w-24 h-24 rounded-2xl border-4 border-white shadow-md bg-saffron-100 flex items-center justify-center overflow-hidden">
                {photoUrl ? (
                  <img src={photoUrl} alt={displayName} className="w-full h-full object-cover" />
                ) : (
                  <User size={36} className="text-saffron-400" />
                )}
              </div>
            </div>

            {/* Row 2: Name + username — full width, no crowding */}
            <div className="mb-3">
              <h1 className="font-display font-bold text-xl sm:text-2xl text-gray-900 break-words leading-snug pr-20">
                {displayName}
              </h1>
              <div className="flex items-center flex-wrap gap-2 mt-1">
                <p className="text-gray-500 text-sm">@{userData?.username}</p>
                {isOwn && profile?.is_public !== null && profile?.is_public !== undefined && (
                  <button
                    onClick={() => setShowPrompt(true)}
                    title="Click to change visibility"
                    className={`badge flex items-center gap-1 text-xs cursor-pointer hover:opacity-70 transition-opacity
                      ${profile.is_public ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}
                  >
                    {profile.is_public
                      ? <><Globe size={10} /> Public</>
                      : <><Lock size={10} /> Private</>}
                  </button>
                )}
              </div>
            </div>

            {/* Bio */}
            {profile?.bio && (
              <p className="text-gray-600 mb-4 leading-relaxed text-sm sm:text-base">{profile.bio}</p>
            )}

            {/* Info chips */}
            <div className="flex flex-wrap gap-2">
              {profile?.location && <InfoChip icon={<MapPin size={14} />} text={profile.location} />}
              {profile?.occupation && <InfoChip icon={<Briefcase size={14} />} text={profile.occupation} />}
              {profile?.dob && <InfoChip icon={<Calendar size={14} />} text={profile.dob} />}
              {profile?.phone && isOwn && <InfoChip icon={<Phone size={14} />} text={profile.phone} />}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Left column */}
          <div className="md:col-span-2 space-y-6">
            {/* Community Details */}
            <div className="card p-6">
              <h2 className="font-display font-semibold text-lg text-gray-900 mb-4">Community Details</h2>
              <dl className="space-y-3">
                {([['Native Place', profile?.native_place], ['Gothram', profile?.gothram]] as [string, string | undefined][])
                  .filter(([, v]) => v)
                  .map(([label, val]) => (
                    <div key={label} className="flex gap-3">
                      <dt className="w-32 text-sm font-medium text-gray-500 flex-shrink-0">{label}</dt>
                      <dd className="text-sm text-gray-900">{val}</dd>
                    </div>
                  ))}
              </dl>
              {!profile?.native_place && !profile?.gothram && (
                <p className="text-gray-400 text-sm">No community details added yet.</p>
              )}
            </div>

            {/* Business Profile card */}
            {isBizOccupation && (
              <div className="card p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-display font-semibold text-lg text-gray-900 flex items-center gap-2">
                    <Building2 size={20} className="text-saffron-600" /> Business Profile
                  </h2>
                  {isOwn && business && (
                    <Link to="/business/edit" className="text-sm text-saffron-600 hover:underline flex items-center gap-1">
                      <Edit2 size={13} /> Edit
                    </Link>
                  )}
                </div>

                {business === undefined && (
                  <div className="h-10 flex items-center">
                    <div className="w-5 h-5 border-2 border-saffron-400 border-t-transparent rounded-full animate-spin" />
                  </div>
                )}

                {business === null && isOwn && (
                  <div className="border-2 border-dashed border-saffron-200 rounded-xl p-6 text-center">
                    <Building2 size={32} className="text-saffron-300 mx-auto mb-2" />
                    <p className="text-gray-500 text-sm mb-4">You haven't created a business profile yet.</p>
                    <Link to="/business/edit" className="btn-primary flex items-center gap-2 justify-center">
                      <PlusCircle size={16} /> Create Business Profile
                    </Link>
                  </div>
                )}

                {business === null && !isOwn && (
                  <p className="text-gray-400 text-sm">No business profile yet.</p>
                )}

                {business && (
                  <Link to={`/business/${business.id}`} className="flex items-center gap-4 group">
                    <div className="w-14 h-14 rounded-xl bg-saffron-50 border border-saffron-100 overflow-hidden flex items-center justify-center flex-shrink-0">
                      {business.logo_filename ? (
                        <img
                          src={uploadUrl(business.logo_filename)}
                          alt={business.company_name}
                          className="w-full h-full object-contain p-1"
                        />
                      ) : (
                        <Building2 size={24} className="text-saffron-400" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 group-hover:text-saffron-700 transition-colors">
                        {business.company_name}
                      </p>
                      {business.tagline && <p className="text-sm text-gray-500 truncate">{business.tagline}</p>}
                      <div className="flex items-center gap-2 mt-1">
                        {business.category && (
                          <span className="badge bg-saffron-100 text-saffron-700">{business.category}</span>
                        )}
                        {business.city && (
                          <span className="text-xs text-gray-400 flex items-center gap-0.5">
                            <MapPin size={10} />{business.city}
                          </span>
                        )}
                      </div>
                    </div>
                    <ArrowRight size={16} className="text-gray-400 group-hover:text-saffron-600 transition-colors" />
                  </Link>
                )}
              </div>
            )}
          </div>

          {/* Right column — Links + Quick links */}
          <div className="card p-6 self-start">
            <h2 className="font-display font-semibold text-lg text-gray-900 mb-4">Links</h2>
            <div className="space-y-3">
              {profile?.linkedin && (
                <a href={profile.linkedin} target="_blank" rel="noreferrer"
                  className="flex items-center gap-2 text-sm text-blue-600 hover:underline">
                  <ExternalLink size={14} /> LinkedIn
                </a>
              )}
              {profile?.website && (
                <a href={profile.website} target="_blank" rel="noreferrer"
                  className="flex items-center gap-2 text-sm text-saffron-600 hover:underline">
                  <ExternalLink size={14} /> Website
                </a>
              )}
              {!profile?.linkedin && !profile?.website && (
                <p className="text-gray-400 text-sm">No links added.</p>
              )}
            </div>

            {isOwn && (
              <div className="mt-5 pt-5 border-t border-gray-100 space-y-2">
                <p className="text-xs text-gray-400 mb-2">Quick links</p>
                <Link to="/family-tree" className="block text-sm text-saffron-600 hover:underline">→ My Family Tree</Link>
                <Link to="/matrimony/create" className="block text-sm text-saffron-600 hover:underline">→ Matrimony Profile</Link>
                {isBizOccupation && (
                  <Link to="/business/edit" className="block text-sm text-saffron-600 hover:underline">→ Business Profile</Link>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
