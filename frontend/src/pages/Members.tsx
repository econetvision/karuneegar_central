import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Users, MapPin, Briefcase, User } from 'lucide-react';
import api, { uploadUrl } from '../api/client';

interface Member {
  id: number;
  username: string;
  profile?: {
    full_name?: string;
    location?: string;
    occupation?: string;
    native_place?: string;
    gothram?: string;
    photo_filename?: string;
  };
}

export default function Members() {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    setLoading(true);
    api.get('/members', { params: debouncedSearch ? { q: debouncedSearch } : {} })
      .then((r) => setMembers(r.data.members))
      .finally(() => setLoading(false));
  }, [debouncedSearch]);

  return (
    <div className="max-w-7xl mx-auto px-4 py-10">
      <div className="mb-8">
        <h1 className="section-title flex items-center gap-2 mb-2">
          <Users className="text-saffron-600" size={28} /> Community Members
        </h1>
        <p className="text-gray-500">Connect with fellow Karuneegar community members.</p>
      </div>

      <div className="relative mb-6">
        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Search by name, location, or occupation…"
          className="input pl-11 max-w-lg"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-4 border-saffron-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : members.length === 0 ? (
        <div className="card p-16 text-center">
          <Users size={48} className="text-gray-200 mx-auto mb-4" />
          <p className="text-gray-500">No members found.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {members.map((m) => (
            <Link key={m.id} to={`/u/${m.username}`} className="card p-5 group text-center">
              <div className="w-16 h-16 rounded-2xl bg-saffron-100 mx-auto mb-3 flex items-center justify-center overflow-hidden">
                {m.profile?.photo_filename ? (
                  <img
                    src={uploadUrl(m.profile.photo_filename)}
                    alt={m.profile.full_name || m.username}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User size={26} className="text-saffron-400" />
                )}
              </div>
              <h3 className="font-semibold text-gray-900 group-hover:text-saffron-700 transition-colors break-words leading-snug">
                {m.profile?.full_name || m.username}
              </h3>
              <p className="text-xs text-gray-400 mt-0.5 truncate">@{m.username}</p>
              {m.profile?.location && (
                <p className="flex items-center justify-center gap-1 text-xs text-gray-500 mt-2">
                  <MapPin size={10} /> {m.profile.location}
                </p>
              )}
              {m.profile?.occupation && (
                <p className="flex items-center justify-center gap-1 text-xs text-gray-500 mt-1">
                  <Briefcase size={10} /> {m.profile.occupation}
                </p>
              )}
              {m.profile?.gothram && (
                <p className="mt-2 text-xs text-saffron-600 font-medium">{m.profile.gothram} Gothram</p>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
