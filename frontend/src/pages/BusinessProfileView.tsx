import { useEffect, useState, useRef } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  ChevronLeft, MapPin, Phone, Mail, Globe, Building2,
  Calendar, Users, Edit2, Tag, Camera, CheckCircle2,
} from 'lucide-react';
import api, { uploadUrl } from '../api/client';
import { useAuth } from '../contexts/AuthContext';

interface Business {
  id: number;
  user_id: number;
  company_name: string;
  tagline?: string;
  category?: string;
  description?: string;
  logo_filename?: string;
  cover_filename?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  phone?: string;
  email?: string;
  website?: string;
  established_year?: number;
  employees?: string;
  owner_username?: string;
  owner_name?: string;
}

export default function BusinessProfileView() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [business, setBusiness] = useState<Business | null>(null);
  const [loading, setLoading] = useState(true);
  const [logoFilename, setLogoFilename] = useState('');
  const [uploading, setUploading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    api.get(`/business/${id}`)
      .then((r) => {
        setBusiness(r.data.business);
        setLogoFilename(r.data.business?.logo_filename || '');
      })
      .finally(() => setLoading(false));
  }, [id]);

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !business) return;
    setUploading(true);
    setUploadError('');
    setSaved(false);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const uploadRes = await api.post('/upload', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const filename = uploadRes.data.filename;
      await api.put(`/business/${business.id}`, { logo_filename: filename });
      setLogoFilename(filename);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch {
      setUploadError('Upload failed. Please try again.');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <div className="w-8 h-8 border-4 border-saffron-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!business) return <div className="text-center py-20 text-gray-500">Business not found.</div>;

  const isOwn = user?.id === business.user_id;
  const currentLogoUrl = logoFilename ? uploadUrl(logoFilename) : null;
  const coverUrl = business.cover_filename ? uploadUrl(business.cover_filename) : null;

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <Link to="/businesses" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-saffron-600 mb-6">
        <ChevronLeft size={16} /> All Businesses
      </Link>

      {/* Cover + Logo */}
      <div className="card overflow-hidden mb-6">
        <div
          className="h-40 bg-gradient-to-r from-amber-400 via-saffron-500 to-orange-600"
          style={coverUrl ? { backgroundImage: `url(${coverUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' } : {}}
        />

        <div className="px-5 sm:px-6 pb-6 relative">
          {/* Edit button — absolute top-right, independent of logo/text layout */}
          {isOwn && (
            <Link to="/business/edit" className="btn-outline flex items-center gap-2 absolute top-4 right-5 sm:right-6 text-sm">
              <Edit2 size={14} /> Edit
            </Link>
          )}

          {/* Row 1: Logo — overlaps cover, no text beside it */}
          <div className="-mt-10 mb-4 inline-block">
            <div className="relative">
              <div className="w-20 h-20 rounded-2xl border-4 border-white shadow-md bg-white flex items-center justify-center overflow-hidden">
                {uploading ? (
                  <div className="w-6 h-6 border-2 border-saffron-400 border-t-transparent rounded-full animate-spin" />
                ) : currentLogoUrl ? (
                  <img src={currentLogoUrl} alt={business.company_name} className="w-full h-full object-contain p-1.5" />
                ) : (
                  <Building2 size={32} className="text-saffron-400" />
                )}
              </div>

              {/* Hover-to-change overlay (desktop) */}
              {isOwn && (
                <label
                  className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-2xl opacity-0 hover:opacity-100 transition-opacity cursor-pointer"
                  title="Upload logo"
                >
                  <Camera size={18} className="text-white" />
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/gif"
                    className="hidden"
                    onChange={handleLogoUpload}
                    disabled={uploading}
                  />
                </label>
              )}

              {saved && (
                <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center shadow">
                  <CheckCircle2 size={14} className="text-white" />
                </div>
              )}
            </div>
          </div>

          {/* Row 2: Company name + tagline — full width */}
          <div className="mb-3 pr-20">
            <h1 className="font-display font-bold text-xl sm:text-2xl text-gray-900 break-words leading-snug">
              {business.company_name}
            </h1>
            {business.tagline && (
              <p className="text-gray-500 mt-1 text-sm sm:text-base break-words">{business.tagline}</p>
            )}

            {/* Upload link for mobile/touch (tap-friendly) */}
            {isOwn && (
              <div className="mt-2">
                {uploadError && <p className="text-xs text-red-500 mb-1">{uploadError}</p>}
                <label className="inline-flex items-center gap-1.5 text-xs text-saffron-600 hover:text-saffron-700 cursor-pointer font-medium">
                  <Camera size={12} />
                  {currentLogoUrl ? 'Change logo' : 'Upload logo'}
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/gif"
                    className="hidden"
                    onChange={handleLogoUpload}
                    disabled={uploading}
                  />
                </label>
              </div>
            )}
          </div>

          {/* Row 3: Badges */}
          <div className="flex flex-wrap gap-2">
            {business.category && (
              <span className="badge bg-saffron-100 text-saffron-700 flex items-center gap-1">
                <Tag size={11} /> {business.category}
              </span>
            )}
            {business.city && (
              <span className="badge bg-gray-100 text-gray-600 flex items-center gap-1">
                <MapPin size={11} /> {[business.city, business.state].filter(Boolean).join(', ')}
              </span>
            )}
            {business.established_year && (
              <span className="badge bg-blue-50 text-blue-600 flex items-center gap-1">
                <Calendar size={11} /> Est. {business.established_year}
              </span>
            )}
            {business.employees && (
              <span className="badge bg-emerald-50 text-emerald-600 flex items-center gap-1">
                <Users size={11} /> {business.employees} employees
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* About */}
        <div className="md:col-span-2 space-y-5">
          {business.description && (
            <div className="card p-6">
              <h2 className="font-semibold text-gray-800 mb-3">About</h2>
              <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{business.description}</p>
            </div>
          )}

          {(business.address || business.city) && (
            <div className="card p-6">
              <h2 className="font-semibold text-gray-800 mb-3">Address</h2>
              <address className="text-gray-700 not-italic leading-relaxed text-sm">
                {business.address && <div>{business.address}</div>}
                {(business.city || business.state) && (
                  <div>{[business.city, business.state, business.pincode].filter(Boolean).join(', ')}</div>
                )}
              </address>
            </div>
          )}
        </div>

        {/* Contact sidebar */}
        <div className="space-y-5">
          <div className="card p-6">
            <h2 className="font-semibold text-gray-800 mb-4">Contact</h2>
            <div className="space-y-3">
              {business.phone && (
                <a href={`tel:${business.phone}`}
                  className="flex items-center gap-2.5 text-sm text-gray-700 hover:text-saffron-600">
                  <Phone size={15} className="text-saffron-500 flex-shrink-0" />
                  {business.phone}
                </a>
              )}
              {business.email && (
                <a href={`mailto:${business.email}`}
                  className="flex items-center gap-2.5 text-sm text-gray-700 hover:text-saffron-600 break-all">
                  <Mail size={15} className="text-saffron-500 flex-shrink-0" />
                  {business.email}
                </a>
              )}
              {business.website && (
                <a href={business.website} target="_blank" rel="noreferrer"
                  className="flex items-center gap-2.5 text-sm text-blue-600 hover:underline break-all">
                  <Globe size={15} className="flex-shrink-0" />
                  {business.website.replace(/^https?:\/\//, '')}
                </a>
              )}
              {!business.phone && !business.email && !business.website && (
                <p className="text-gray-400 text-sm">No contact info provided.</p>
              )}
            </div>
          </div>

          {business.owner_username && (
            <div className="card p-5">
              <p className="text-xs text-gray-400 mb-2">Listed by</p>
              <Link to={`/u/${business.owner_username}`}
                className="font-medium text-saffron-600 hover:underline text-sm">
                {business.owner_name || business.owner_username}
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
