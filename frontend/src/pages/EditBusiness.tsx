import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, Building2 } from 'lucide-react';
import api, { uploadUrl } from '../api/client';

const CATEGORIES = [
  'Agriculture & Farming', 'Automotive', 'Construction & Real Estate',
  'Education & Training', 'Finance & Insurance', 'Food & Hospitality',
  'Healthcare & Medical', 'IT & Technology', 'Manufacturing',
  'Retail & Trading', 'Services', 'Textiles & Garments',
  'Transport & Logistics', 'Other',
];

const EMPLOYEE_RANGES = ['1–5', '6–10', '11–50', '51–200', '200+'];

type FieldEl = React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>;

export default function EditBusiness() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    company_name: '', tagline: '', category: '', description: '',
    address: '', city: '', state: '', pincode: '',
    phone: '', email: '', website: '',
    established_year: '', employees: '',
  });
  const [logoFilename, setLogoFilename] = useState('');
  const [coverFilename, setCoverFilename] = useState('');
  const [existingId, setExistingId] = useState<number | null>(null);
  const [uploading, setUploading] = useState<'logo' | 'cover' | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    api.get('/business/mine').then((r) => {
      const b = r.data.business;
      if (!b) return;
      setExistingId(b.id);
      setForm({
        company_name: b.company_name || '',
        tagline: b.tagline || '',
        category: b.category || '',
        description: b.description || '',
        address: b.address || '',
        city: b.city || '',
        state: b.state || '',
        pincode: b.pincode || '',
        phone: b.phone || '',
        email: b.email || '',
        website: b.website || '',
        established_year: b.established_year?.toString() || '',
        employees: b.employees || '',
      });
      setLogoFilename(b.logo_filename || '');
      setCoverFilename(b.cover_filename || '');
    }).catch(() => {});
  }, []);

  const set = (k: string) => (e: FieldEl) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const uploadFile = async (file: File, type: 'logo' | 'cover') => {
    setUploading(type);
    const fd = new FormData();
    fd.append('file', file);
    try {
      const r = await api.post('/upload', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      if (type === 'logo') setLogoFilename(r.data.filename);
      else setCoverFilename(r.data.filename);
    } catch {
      setError('Upload failed');
    } finally {
      setUploading(null);
    }
  };

  const handleSubmit = async (e: { preventDefault(): void }) => {
    e.preventDefault();
    if (!form.company_name.trim()) { setError('Company name is required'); return; }
    setSaving(true);
    setError('');
    const payload = {
      ...form,
      established_year: form.established_year ? parseInt(form.established_year) : null,
      logo_filename: logoFilename,
      cover_filename: coverFilename,
    };
    try {
      const r = existingId
        ? await api.put(`/business/${existingId}`, payload)
        : await api.post('/business', payload);
      setSuccess(true);
      setTimeout(() => navigate(`/business/${r.data.business.id}`), 1000);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
      setError(msg || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const logoUrl  = logoFilename  ? uploadUrl(logoFilename)  : null;
  const coverUrl = coverFilename ? uploadUrl(coverFilename) : null;

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <h1 className="font-display font-bold text-2xl text-gray-900 mb-6">
        {existingId ? 'Edit' : 'Create'} Business Profile
      </h1>

      {error   && <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm">{error}</div>}
      {success && <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 rounded-xl text-sm">Saved! Redirecting…</div>}

      <form onSubmit={handleSubmit} className="space-y-6">

        {/* Cover photo */}
        <div className="card overflow-hidden">
          <div
            className="h-28 bg-gradient-to-r from-amber-400 to-saffron-600 relative flex items-center justify-center"
            style={coverUrl ? { backgroundImage: `url(${coverUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' } : {}}
          >
            <label className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 hover:opacity-100 transition-opacity cursor-pointer rounded-t-2xl">
              <span className="text-white text-sm font-medium flex items-center gap-1.5">
                <Upload size={14} /> {uploading === 'cover' ? 'Uploading…' : 'Change Cover'}
              </span>
              <input type="file" accept="image/*" className="hidden"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadFile(f, 'cover'); }}
                disabled={uploading !== null} />
            </label>
          </div>

          {/* Logo */}
          <div className="px-6 pb-5 -mt-8">
            <div className="relative w-16 h-16">
              <div className="w-16 h-16 rounded-xl border-4 border-white shadow bg-white overflow-hidden flex items-center justify-center">
                {logoUrl
                  ? <img src={logoUrl} alt="Logo" className="w-full h-full object-contain p-1" />
                  : <Building2 size={24} className="text-saffron-400" />}
              </div>
              <label className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-xl opacity-0 hover:opacity-100 transition-opacity cursor-pointer">
                <Upload size={14} className="text-white" />
                <input type="file" accept="image/*" className="hidden"
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadFile(f, 'logo'); }}
                  disabled={uploading !== null} />
              </label>
            </div>
            <p className="text-xs text-gray-400 mt-1.5">Hover logo or cover to change</p>
          </div>
        </div>

        {/* Basic info */}
        <div className="card p-6 space-y-4">
          <h2 className="font-semibold text-gray-800">Business Details</h2>
          <div>
            <label className="label">Company Name *</label>
            <input type="text" className="input" value={form.company_name} onChange={set('company_name')} required />
          </div>
          <div>
            <label className="label">Tagline</label>
            <input type="text" className="input" placeholder="A short catchy line about your business" value={form.tagline} onChange={set('tagline')} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Category</label>
              <select className="input" value={form.category} onChange={set('category')}>
                <option value="">Select category</option>
                {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Team Size</label>
              <select className="input" value={form.employees} onChange={set('employees')}>
                <option value="">Select range</option>
                {EMPLOYEE_RANGES.map((r) => <option key={r}>{r}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Established Year</label>
              <input type="number" className="input" placeholder="e.g. 2010"
                min={1900} max={new Date().getFullYear()}
                value={form.established_year} onChange={set('established_year')} />
            </div>
          </div>
          <div>
            <label className="label">Description</label>
            <textarea className="input min-h-[110px] resize-none" placeholder="Tell people about your business, products, or services…" value={form.description} onChange={set('description')} />
          </div>
        </div>

        {/* Address */}
        <div className="card p-6 space-y-4">
          <h2 className="font-semibold text-gray-800">Address</h2>
          <div>
            <label className="label">Street Address</label>
            <input type="text" className="input" value={form.address} onChange={set('address')} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">City</label>
              <input type="text" className="input" value={form.city} onChange={set('city')} />
            </div>
            <div>
              <label className="label">State</label>
              <input type="text" className="input" value={form.state} onChange={set('state')} />
            </div>
            <div>
              <label className="label">Pincode</label>
              <input type="text" className="input" maxLength={10} value={form.pincode} onChange={set('pincode')} />
            </div>
          </div>
        </div>

        {/* Contact */}
        <div className="card p-6 space-y-4">
          <h2 className="font-semibold text-gray-800">Contact</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Phone</label>
              <input type="tel" className="input" value={form.phone} onChange={set('phone')} />
            </div>
            <div>
              <label className="label">Email</label>
              <input type="email" className="input" value={form.email} onChange={set('email')} />
            </div>
            <div className="sm:col-span-2">
              <label className="label">Website</label>
              <input type="url" className="input" placeholder="https://yourbusiness.com" value={form.website} onChange={set('website')} />
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <button type="submit" disabled={saving} className="btn-primary flex-1">
            {saving ? 'Saving…' : existingId ? 'Save Changes' : 'Create Business Profile'}
          </button>
          <button type="button" onClick={() => navigate(-1)} className="btn-outline">Cancel</button>
        </div>
      </form>
    </div>
  );
}
