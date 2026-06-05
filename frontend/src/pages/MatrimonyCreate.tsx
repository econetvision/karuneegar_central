import { useState } from 'react';
import type { ChangeEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, User } from 'lucide-react';
import api from '../api/client';

type FieldEl = ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>;

export default function MatrimonyCreate() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    full_name: '', gender: 'male', seeking: 'female', age: '',
    height: '', education: '', occupation: '', salary_range: '',
    gothram: '', native_place: '', star: '', raasi: '',
    about: '', contact_email: '', contact_phone: '',
  });
  const [photoFilename, setPhotoFilename] = useState('');
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const set = (k: string) => (e: FieldEl) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const handlePhotoUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const fd = new FormData();
    fd.append('file', file);
    try {
      const r = await api.post('/upload', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setPhotoFilename(r.data.filename);
    } catch {
      setError('Photo upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: { preventDefault(): void }) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const payload = { ...form, age: form.age ? parseInt(form.age) : null, photo_filename: photoFilename };
      const r = await api.post('/matrimony', payload);
      navigate(`/matrimony/${r.data.profile.id}`);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
      setError(msg || 'Failed to create profile');
    } finally {
      setSaving(false);
    }
  };

  const photoUrl = photoFilename ? `http://localhost:5000/api/uploads/${photoFilename}` : null;

  const STARS = [
    'Ashwini', 'Bharani', 'Krittika', 'Rohini', 'Mrigashira', 'Ardra',
    'Punarvasu', 'Pushya', 'Ashlesha', 'Magha', 'Purva Phalguni', 'Uttara Phalguni',
    'Hasta', 'Chitra', 'Swati', 'Vishakha', 'Anuradha', 'Jyeshtha',
    'Mula', 'Purva Ashadha', 'Uttara Ashadha', 'Shravana', 'Dhanishta',
    'Shatabhisha', 'Purva Bhadrapada', 'Uttara Bhadrapada', 'Revati',
  ];
  const RAASIS = [
    'Mesha', 'Vrishabha', 'Mithuna', 'Karka', 'Simha', 'Kanya',
    'Tula', 'Vrischika', 'Dhanu', 'Makara', 'Kumbha', 'Meena',
  ];

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <h1 className="font-display font-bold text-2xl text-gray-900 mb-6">Create Matrimony Profile</h1>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm">{error}</div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Photo */}
        <div className="card p-6">
          <h2 className="font-semibold text-gray-800 mb-4">Profile Photo</h2>
          <div className="flex items-center gap-5">
            <div className="w-20 h-20 rounded-2xl bg-rose-100 border-2 border-rose-200 overflow-hidden flex items-center justify-center">
              {photoUrl ? (
                <img src={photoUrl} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <User size={30} className="text-rose-400" />
              )}
            </div>
            <label className="btn-outline flex items-center gap-2 cursor-pointer">
              <Upload size={16} />
              {uploading ? 'Uploading...' : 'Upload Photo'}
              <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} disabled={uploading} />
            </label>
          </div>
        </div>

        {/* Basic */}
        <div className="card p-6 space-y-4">
          <h2 className="font-semibold text-gray-800">Basic Details</h2>
          <div>
            <label className="label">Full Name *</label>
            <input type="text" className="input" value={form.full_name} onChange={set('full_name')} required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Gender *</label>
              <select className="input" value={form.gender} onChange={set('gender')}>
                <option value="male">Male (Groom)</option>
                <option value="female">Female (Bride)</option>
              </select>
            </div>
            <div>
              <label className="label">Seeking</label>
              <select className="input" value={form.seeking} onChange={set('seeking')}>
                <option value="female">Bride</option>
                <option value="male">Groom</option>
              </select>
            </div>
            <div>
              <label className="label">Age</label>
              <input type="number" className="input" placeholder="25" value={form.age} onChange={set('age')} min={18} max={60} />
            </div>
            <div>
              <label className="label">Height</label>
              <input type="text" className="input" placeholder="e.g. 5ft 6in" value={form.height} onChange={set('height')} />
            </div>
          </div>
        </div>

        {/* Education and Career */}
        <div className="card p-6 space-y-4">
          <h2 className="font-semibold text-gray-800">Education and Career</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Education</label>
              <input type="text" className="input" placeholder="B.E. Computer Science" value={form.education} onChange={set('education')} />
            </div>
            <div>
              <label className="label">Occupation</label>
              <input type="text" className="input" placeholder="Software Engineer" value={form.occupation} onChange={set('occupation')} />
            </div>
            <div className="col-span-2">
              <label className="label">Salary Range</label>
              <input type="text" className="input" placeholder="10-15 LPA" value={form.salary_range} onChange={set('salary_range')} />
            </div>
          </div>
        </div>

        {/* Community Details */}
        <div className="card p-6 space-y-4">
          <h2 className="font-semibold text-gray-800">Community and Horoscope</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Native Place</label>
              <input type="text" className="input" value={form.native_place} onChange={set('native_place')} />
            </div>
            <div>
              <label className="label">Gothram</label>
              <input type="text" className="input" value={form.gothram} onChange={set('gothram')} />
            </div>
            <div>
              <label className="label">Star (Natchathiram)</label>
              <select className="input" value={form.star} onChange={set('star')}>
                <option value="">Select Star</option>
                {STARS.map((s) => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Raasi</label>
              <select className="input" value={form.raasi} onChange={set('raasi')}>
                <option value="">Select Raasi</option>
                {RAASIS.map((r) => <option key={r}>{r}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* About */}
        <div className="card p-6 space-y-4">
          <h2 className="font-semibold text-gray-800">About and Contact</h2>
          <div>
            <label className="label">About</label>
            <textarea
              className="input min-h-[90px] resize-none"
              placeholder="A brief introduction..."
              value={form.about}
              onChange={set('about')}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Contact Email</label>
              <input type="email" className="input" value={form.contact_email} onChange={set('contact_email')} />
            </div>
            <div>
              <label className="label">Contact Phone</label>
              <input type="tel" className="input" value={form.contact_phone} onChange={set('contact_phone')} />
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <button type="submit" disabled={saving} className="btn-primary flex-1">
            {saving ? 'Creating...' : 'Create Profile'}
          </button>
          <button type="button" onClick={() => navigate('/matrimony')} className="btn-outline">
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
