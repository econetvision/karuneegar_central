import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Building2, Search, MapPin, Tag, Users, ArrowRight } from 'lucide-react';
import api from '../api/client';

interface Business {
  id: number;
  company_name: string;
  tagline?: string;
  category?: string;
  city?: string;
  state?: string;
  employees?: string;
  logo_filename?: string;
  established_year?: number;
  owner_name?: string;
}

const CATEGORIES = [
  'Agriculture & Farming', 'Automotive', 'Construction & Real Estate',
  'Education & Training', 'Finance & Insurance', 'Food & Hospitality',
  'Healthcare & Medical', 'IT & Technology', 'Manufacturing',
  'Retail & Trading', 'Services', 'Textiles & Garments',
  'Transport & Logistics', 'Other',
];

export default function Businesses() {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [category, setCategory] = useState('');

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    setLoading(true);
    const params: Record<string, string> = {};
    if (debouncedSearch) params.q = debouncedSearch;
    if (category) params.category = category;
    api.get('/business', { params })
      .then((r) => setBusinesses(r.data.businesses))
      .finally(() => setLoading(false));
  }, [debouncedSearch, category]);

  return (
    <div className="max-w-7xl mx-auto px-4 py-10">
      <div className="mb-8">
        <h1 className="section-title flex items-center gap-2 mb-2">
          <Building2 className="text-saffron-600" size={28} /> Community Businesses
        </h1>
        <p className="text-gray-500">Discover businesses run by Karuneegar community members.</p>
      </div>

      {/* Filters */}
      <div className="card p-4 mb-6 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search businesses…"
            className="input pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          className="input sm:w-56"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        >
          <option value="">All Categories</option>
          {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-4 border-saffron-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : businesses.length === 0 ? (
        <div className="card p-16 text-center">
          <Building2 size={48} className="text-gray-200 mx-auto mb-4" />
          <h3 className="font-semibold text-gray-600 mb-2">No businesses found</h3>
          <p className="text-gray-400 text-sm">Set your occupation to Business or Self-Employed and create a business profile.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {businesses.map((b) => {
            const logoUrl = b.logo_filename
              ? `http://localhost:5000/api/uploads/${b.logo_filename}`
              : null;
            return (
              <Link key={b.id} to={`/business/${b.id}`} className="card p-5 group flex gap-4">
                <div className="w-14 h-14 rounded-xl bg-saffron-50 border border-saffron-100 overflow-hidden flex items-center justify-center flex-shrink-0">
                  {logoUrl
                    ? <img src={logoUrl} alt={b.company_name} className="w-full h-full object-contain p-1.5" />
                    : <Building2 size={22} className="text-saffron-400" />}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 group-hover:text-saffron-700 transition-colors leading-snug break-words">
                    {b.company_name}
                  </h3>
                  {b.tagline && (
                    <p className="text-xs text-gray-500 mt-0.5 truncate">{b.tagline}</p>
                  )}
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {b.category && (
                      <span className="badge bg-saffron-50 text-saffron-600 flex items-center gap-0.5">
                        <Tag size={9} /> {b.category}
                      </span>
                    )}
                    {b.city && (
                      <span className="badge bg-gray-100 text-gray-500 flex items-center gap-0.5">
                        <MapPin size={9} /> {b.city}
                      </span>
                    )}
                    {b.employees && (
                      <span className="badge bg-emerald-50 text-emerald-600 flex items-center gap-0.5">
                        <Users size={9} /> {b.employees}
                      </span>
                    )}
                  </div>
                  {b.owner_name && (
                    <p className="text-xs text-gray-400 mt-1.5">by {b.owner_name}</p>
                  )}
                </div>
                <ArrowRight size={15} className="text-gray-300 group-hover:text-saffron-500 transition-colors self-center flex-shrink-0" />
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
