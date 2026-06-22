import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ChevronLeft, ChevronRight, MapPin, GraduationCap, Briefcase, Phone, Mail, Star, User, Lock, Sparkles, Loader2, Clock, Home } from 'lucide-react';
import api, { uploadUrl } from '../api/client';
import ProtectedPhoto from '../components/ProtectedPhoto';

const LANGS = [
  { code: 'en', label: 'English' },
  { code: 'ta', label: 'தமிழ்' },
  { code: 'te', label: 'తెలుగు' },
  { code: 'kn', label: 'ಕನ್ನಡ' },
] as const;

type Lang = typeof LANGS[number]['code'];

interface Profile {
  id: number;
  user_id: number;
  full_name: string;
  gender: string;
  seeking: string;
  age: number;
  height: string;
  education: string;
  occupation: string;
  salary_range: string;
  gothram: string;
  native_place: string;
  star: string;
  raasi: string;
  birth_time: string;
  birth_place: string;
  about: string;
  photo_filename: string;
  photos: string[];
  horoscope_en: string;
  horoscope_ta: string;
  horoscope_te: string;
  horoscope_kn: string;
  contact_email: string;
  contact_phone: string;
  phone_public: boolean;
}

export default function MatrimonyView() {
  const { profileId } = useParams<{ profileId: string }>();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [photoIdx, setPhotoIdx] = useState(0);
  const [activeLang, setActiveLang] = useState<Lang>('en');
  const [generating, setGenerating] = useState(false);
  const [genError, setGenError] = useState('');

  useEffect(() => {
    api.get(`/matrimony/${profileId}`)
      .then((r) => setProfile(r.data.profile))
      .finally(() => setLoading(false));
  }, [profileId]);

  const horoscopeKey = `horoscope_${activeLang}` as keyof Profile;
  const currentHoroscope = profile?.[horoscopeKey] as string | undefined;

  const handleGenerate = async () => {
    if (!profile) return;
    setGenerating(true);
    setGenError('');
    try {
      const r = await api.post(`/matrimony/${profile.id}/generate-horoscope?lang=${activeLang}`);
      setProfile((prev) => prev ? { ...prev, [horoscopeKey]: r.data.horoscope } : prev);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
      setGenError(msg || 'Generation failed. Please try again.');
    } finally {
      setGenerating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <div className="w-8 h-8 border-4 border-rose-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!profile) return <div className="text-center py-20 text-gray-500">Profile not found.</div>;

  const allPhotos = profile.photos?.length ? profile.photos : profile.photo_filename ? [profile.photo_filename] : [];
  const isFemale = profile.gender === 'female';
  const hasHoroscope = !!(profile.horoscope_en || profile.horoscope_ta || profile.horoscope_te || profile.horoscope_kn);

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <Link to="/matrimony" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-rose-600 mb-6">
        <ChevronLeft size={16} /> Back to Matrimony
      </Link>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left column */}
        <div className="space-y-5">
          {/* Photo carousel */}
          <div className="card overflow-hidden">
            <div className={`relative aspect-[3/4] flex items-center justify-center
              ${isFemale ? 'bg-gradient-to-br from-rose-100 to-pink-100' : 'bg-gradient-to-br from-blue-100 to-indigo-100'}`}>
              {allPhotos.length > 0 ? (
                <>
                  <ProtectedPhoto
                    src={uploadUrl(allPhotos[photoIdx])}
                    alt={profile.full_name}
                    className="w-full h-full object-cover"
                  />
                  {allPhotos.length > 1 && (
                    <>
                      <button
                        onClick={() => setPhotoIdx((i) => (i - 1 + allPhotos.length) % allPhotos.length)}
                        className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/40 text-white flex items-center justify-center hover:bg-black/60"
                      >
                        <ChevronLeft size={16} />
                      </button>
                      <button
                        onClick={() => setPhotoIdx((i) => (i + 1) % allPhotos.length)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/40 text-white flex items-center justify-center hover:bg-black/60"
                      >
                        <ChevronRight size={16} />
                      </button>
                      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
                        {allPhotos.map((_, i) => (
                          <button
                            key={i}
                            onClick={() => setPhotoIdx(i)}
                            className={`w-1.5 h-1.5 rounded-full transition-all ${i === photoIdx ? 'bg-white w-3' : 'bg-white/60'}`}
                          />
                        ))}
                      </div>
                    </>
                  )}
                </>
              ) : (
                <User size={80} className={isFemale ? 'text-rose-300' : 'text-blue-300'} />
              )}
            </div>

            {/* Photo thumbnails */}
            {allPhotos.length > 1 && (
              <div className="flex gap-1.5 p-2 overflow-x-auto">
                {allPhotos.map((fn, i) => (
                  <button
                    key={fn}
                    onClick={() => setPhotoIdx(i)}
                    className={`flex-shrink-0 w-12 h-16 rounded-lg overflow-hidden border-2 transition-all
                      ${i === photoIdx ? 'border-rose-400' : 'border-transparent opacity-60 hover:opacity-100'}`}
                  >
                    <ProtectedPhoto src={uploadUrl(fn)} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}

            <div className="p-5">
              <div className="flex items-start justify-between gap-3">
                <h1 className="font-display font-bold text-xl text-gray-900 break-words leading-snug">
                  {profile.full_name}
                </h1>
                <span className={`badge flex-shrink-0 mt-0.5 ${isFemale ? 'bg-rose-100 text-rose-700' : 'bg-blue-100 text-blue-700'}`}>
                  {isFemale ? 'Bride' : 'Groom'}
                </span>
              </div>
              {profile.age && <p className="text-gray-500 text-sm mt-1">{profile.age} years</p>}
            </div>
          </div>

          {/* Contact */}
          <div className="card p-5">
            <h3 className="font-semibold text-gray-800 mb-3">Contact</h3>
            <div className="space-y-2">
              {profile.contact_email && (
                <a href={`mailto:${profile.contact_email}`} className="flex items-center gap-2 text-sm text-blue-600 hover:underline">
                  <Mail size={14} /> {profile.contact_email}
                </a>
              )}
              {profile.contact_phone && (
                profile.phone_public ? (
                  <a href={`tel:${profile.contact_phone}`} className="flex items-center gap-2 text-sm text-saffron-600 hover:underline">
                    <Phone size={14} /> {profile.contact_phone}
                  </a>
                ) : (
                  <div className="flex items-center gap-2 text-sm text-gray-400">
                    <Lock size={14} /> {profile.contact_phone}
                  </div>
                )
              )}
              {!profile.contact_email && !profile.contact_phone && (
                <p className="text-gray-400 text-sm">Contact info not provided.</p>
              )}
            </div>
          </div>
        </div>

        {/* Right column */}
        <div className="md:col-span-2 space-y-5">
          {profile.about && (
            <div className="card p-6">
              <h3 className="font-semibold text-gray-800 mb-3">About</h3>
              <p className="text-gray-700 leading-relaxed">{profile.about}</p>
            </div>
          )}

          <div className="card p-6">
            <h3 className="font-semibold text-gray-800 mb-4">Profile Details</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { icon: <MapPin size={15} />, label: 'Native Place', val: profile.native_place },
                { icon: <GraduationCap size={15} />, label: 'Education', val: profile.education },
                { icon: <Briefcase size={15} />, label: 'Occupation', val: profile.occupation },
                { icon: <Star size={15} />, label: 'Salary Range', val: profile.salary_range },
                { icon: null, label: 'Height', val: profile.height },
                { icon: null, label: 'Gothram', val: profile.gothram },
                { icon: null, label: 'Star', val: profile.star },
                { icon: null, label: 'Raasi', val: profile.raasi },
                { icon: <Clock size={15} />, label: 'Birth Time', val: profile.birth_time },
                { icon: <Home size={15} />, label: 'Birth Place', val: profile.birth_place },
                { icon: null, label: 'Seeking', val: profile.seeking === 'female' ? 'Bride' : 'Groom' },
              ].filter((row) => row.val).map((row) => (
                <div key={row.label} className="flex items-start gap-2">
                  {row.icon && <span className="text-saffron-500 mt-0.5">{row.icon}</span>}
                  <div>
                    <p className="text-xs font-medium text-gray-500">{row.label}</p>
                    <p className="text-sm text-gray-900 mt-0.5">{row.val}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Horoscope section */}
          <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                <Sparkles size={16} className="text-saffron-500" />
                Horoscope / Jathakam
              </h3>
              {!hasHoroscope && (
                <span className="text-xs text-gray-400">Not added yet</span>
              )}
            </div>

            {/* Language tabs */}
            <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-4">
              {LANGS.map(({ code, label }) => (
                <button
                  key={code}
                  onClick={() => setActiveLang(code)}
                  className={`flex-1 text-xs font-medium py-1.5 rounded-lg transition-all
                    ${activeLang === code ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  {label}
                  {(profile[`horoscope_${code}` as keyof Profile] as string) && (
                    <span className="ml-1 inline-block w-1.5 h-1.5 rounded-full bg-saffron-400 align-middle" />
                  )}
                </button>
              ))}
            </div>

            {currentHoroscope ? (
              <div className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap bg-amber-50 rounded-xl p-4 border border-amber-100">
                {currentHoroscope}
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3 py-8 text-center">
                <Sparkles size={32} className="text-saffron-300" />
                <p className="text-sm text-gray-500">
                  No horoscope added in {LANGS.find(l => l.code === activeLang)?.label} yet.
                </p>
                <button
                  onClick={handleGenerate}
                  disabled={generating}
                  className="btn-primary flex items-center gap-2 text-sm px-5 py-2.5"
                >
                  {generating ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                  {generating ? 'Generating...' : `Generate with AI in ${LANGS.find(l => l.code === activeLang)?.label}`}
                </button>
                {genError && <p className="text-xs text-red-600">{genError}</p>}
              </div>
            )}

            {currentHoroscope && (
              <div className="mt-4 pt-4 border-t border-gray-100 flex justify-end">
                <button
                  onClick={handleGenerate}
                  disabled={generating}
                  className="btn-outline flex items-center gap-2 text-xs py-1.5 px-3"
                >
                  {generating ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
                  {generating ? 'Generating...' : 'Regenerate with AI'}
                </button>
              </div>
            )}
            {genError && currentHoroscope && <p className="text-xs text-red-600 mt-2">{genError}</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
