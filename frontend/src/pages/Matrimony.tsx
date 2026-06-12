import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Heart, MapPin, GraduationCap, Briefcase, Plus, Search, User } from 'lucide-react';
import api from '../api/client';
import { useAuth } from '../contexts/AuthContext';
import ProtectedPhoto from '../components/ProtectedPhoto';

interface MatrimonyProfile {
  id: number;
  full_name: string;
  gender: string;
  age: number;
  height: string;
  education: string;
  occupation: string;
  native_place: string;
  gothram: string;
  star: string;
  raasi: string;
  about: string;
  photo_filename: string;
  created_at: string;
}

export default function Matrimony() {
  const { user } = useAuth();
  const [profiles, setProfiles] = useState<MatrimonyProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterGender, setFilterGender] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    const params: Record<string, string> = {};
    if (filterGender) params.gender = filterGender;
    api.get('/matrimony', { params })
      .then((r) => setProfiles(r.data.profiles))
      .finally(() => setLoading(false));
  }, [filterGender]);

  const filtered = profiles.filter((p) =>
    !search ||
    p.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    p.native_place?.toLowerCase().includes(search.toLowerCase()) ||
    p.occupation?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto px-4 py-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="section-title flex items-center gap-2">
            <Heart className="text-rose-500" size={28} /> Matrimony
          </h1>
          <p className="text-gray-500 mt-1">Find your life partner within the Karuneegar community</p>
        </div>
        {user && (
          <Link to="/matrimony/create" className="btn-primary flex items-center gap-2 self-start">
            <Plus size={16} /> Create Profile
          </Link>
        )}
      </div>

      {/* Filters */}
      <div className="card p-4 mb-6 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name, place, occupation…"
            className="input pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          className="input sm:w-44"
          value={filterGender}
          onChange={(e) => setFilterGender(e.target.value)}
        >
          <option value="">All Profiles</option>
          <option value="male">Groom Profiles</option>
          <option value="female">Bride Profiles</option>
        </select>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-4 border-rose-400 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="card p-16 text-center">
          <Heart size={48} className="text-gray-200 mx-auto mb-4" />
          <h3 className="font-semibold text-gray-600 mb-2">No profiles found</h3>
          <p className="text-gray-400 text-sm mb-6">Be the first to create a matrimony profile!</p>
          {user && <Link to="/matrimony/create" className="btn-primary">Create Profile</Link>}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {filtered.map((p) => (
            <Link key={p.id} to={`/matrimony/${p.id}`} className="card group overflow-hidden">
              {/* Photo */}
              <div className={`h-52 flex items-center justify-center
                ${p.gender === 'female' ? 'bg-gradient-to-br from-rose-100 to-pink-100' : 'bg-gradient-to-br from-blue-100 to-indigo-100'}`}>
                {p.photo_filename ? (
                  <ProtectedPhoto
                    src={`http://localhost:5000/api/uploads/${p.photo_filename}`}
                    alt={p.full_name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User size={40} className={p.gender === 'female' ? 'text-rose-300' : 'text-blue-300'} />
                )}
              </div>

              <div className="p-4">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <h3 className="font-semibold text-gray-900 group-hover:text-saffron-700 transition-colors break-words leading-snug">
                    {p.full_name}
                  </h3>
                  <span className={`badge text-xs ml-2 flex-shrink-0
                    ${p.gender === 'female' ? 'bg-rose-100 text-rose-700' : 'bg-blue-100 text-blue-700'}`}>
                    {p.age ? `${p.age} yrs` : ''}
                  </span>
                </div>

                <div className="space-y-1 mt-2">
                  {p.native_place && (
                    <div className="flex items-center gap-1.5 text-xs text-gray-500">
                      <MapPin size={11} /> {p.native_place}
                    </div>
                  )}
                  {p.education && (
                    <div className="flex items-center gap-1.5 text-xs text-gray-500">
                      <GraduationCap size={11} /> {p.education}
                    </div>
                  )}
                  {p.occupation && (
                    <div className="flex items-center gap-1.5 text-xs text-gray-500">
                      <Briefcase size={11} /> {p.occupation}
                    </div>
                  )}
                </div>

                {p.gothram && (
                  <p className="mt-2 text-xs text-gray-400">Gothram: {p.gothram}</p>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
