import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ChevronLeft, MapPin, GraduationCap, Briefcase, Phone, Mail, Star, User, Lock } from 'lucide-react';
import api from '../api/client';

interface Profile {
  id: number;
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
  about: string;
  photo_filename: string;
  contact_email: string;
  contact_phone: string;
  phone_public: boolean;
}

export default function MatrimonyView() {
  const { profileId } = useParams<{ profileId: string }>();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/matrimony/${profileId}`)
      .then((r) => setProfile(r.data.profile))
      .finally(() => setLoading(false));
  }, [profileId]);

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <div className="w-8 h-8 border-4 border-rose-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!profile) return <div className="text-center py-20 text-gray-500">Profile not found.</div>;

  const photoUrl = profile.photo_filename
    ? `http://localhost:5000/api/uploads/${profile.photo_filename}`
    : null;

  const isFemale = profile.gender === 'female';

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <Link to="/matrimony" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-rose-600 mb-6">
        <ChevronLeft size={16} /> Back to Matrimony
      </Link>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left */}
        <div className="space-y-5">
          <div className={`card overflow-hidden`}>
            <div className={`h-64 flex items-center justify-center
              ${isFemale ? 'bg-gradient-to-br from-rose-100 to-pink-100' : 'bg-gradient-to-br from-blue-100 to-indigo-100'}`}>
              {photoUrl ? (
                <img src={photoUrl} alt={profile.full_name} className="w-full h-full object-cover" />
              ) : (
                <User size={60} className={isFemale ? 'text-rose-300' : 'text-blue-300'} />
              )}
            </div>
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

        {/* Right */}
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
        </div>
      </div>
    </div>
  );
}
