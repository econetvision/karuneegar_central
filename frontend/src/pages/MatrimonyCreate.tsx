import { useState } from 'react';
import type { ChangeEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, User, Globe, Lock, X, Loader2, Sparkles } from 'lucide-react';
import api, { uploadUrl } from '../api/client';

type FieldEl = ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>;

const LANGS = [
  { code: 'en', label: 'English' },
  { code: 'ta', label: 'தமிழ்' },
  { code: 'te', label: 'తెలుగు' },
  { code: 'kn', label: 'ಕನ್ನಡ' },
] as const;

type Lang = typeof LANGS[number]['code'];

export default function MatrimonyCreate() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    full_name: '', gender: 'male', seeking: 'female', age: '',
    height: '', education: '', occupation: '', salary_range: '',
    gothram: '', native_place: '', star: '', raasi: '',
    birth_time: '', birth_place: '',
    about: '', contact_email: '', contact_phone: '',
  });
  const [phonePublic, setPhonePublic] = useState(false);
  const [photos, setPhotos] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [horoscopeTexts, setHoroscopeTexts] = useState<Record<Lang, string>>({ en: '', ta: '', te: '', kn: '' });
  const [activeLang, setActiveLang] = useState<Lang>('en');
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const set = (k: string) => (e: FieldEl) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const handlePhotoUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    if (photos.length + files.length > 5) {
      setError('Maximum 5 photos allowed.');
      return;
    }
    setUploading(true);
    try {
      const uploaded: string[] = [];
      for (const file of files.slice(0, 5 - photos.length)) {
        const fd = new FormData();
        fd.append('file', file);
        const r = await api.post('/upload', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
        uploaded.push(r.data.filename);
      }
      setPhotos((prev) => [...prev, ...uploaded]);
    } catch {
      setError('Photo upload failed');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const removePhoto = (idx: number) =>
    setPhotos((prev) => prev.filter((_, i) => i !== idx));

  const handleSubmit = async (e: { preventDefault(): void }) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const payload = {
        ...form,
        age: form.age ? parseInt(form.age) : null,
        photo_filename: photos[0] || '',
        photos,
        phone_public: phonePublic,
        horoscope_en: horoscopeTexts.en,
        horoscope_ta: horoscopeTexts.ta,
        horoscope_te: horoscopeTexts.te,
        horoscope_kn: horoscopeTexts.kn,
      };
      const r = await api.post('/matrimony', payload);
      navigate(`/matrimony/${r.data.profile.id}`);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
      setError(msg || 'Failed to create profile');
    } finally {
      setSaving(false);
    }
  };

  const handleGenerateHoroscope = async () => {
    setGenerating(true);
    setError('');
    try {
      // Save current data first (or send as temp payload)
      const tempPayload = {
        ...form,
        age: form.age ? parseInt(form.age) : null,
        photo_filename: photos[0] || '',
        photos,
        phone_public: phonePublic,
      };
      const r = await api.post('/matrimony', tempPayload);
      const profileId = r.data.profile.id;
      const gen = await api.post(`/matrimony/${profileId}/generate-horoscope?lang=${activeLang}`);
      setHoroscopeTexts((prev) => ({ ...prev, [activeLang]: gen.data.horoscope }));
      navigate(`/matrimony/${profileId}`);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
      setError(msg || 'Failed to generate horoscope');
    } finally {
      setGenerating(false);
    }
  };

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
        {/* Photos */}
        <div className="card p-6">
          <h2 className="font-semibold text-gray-800 mb-1">Photos <span className="text-xs font-normal text-gray-400">(up to 5)</span></h2>
          <p className="text-xs text-gray-400 mb-4">First photo will be used as the profile cover. All photos visible to logged-in members.</p>

          {/* Photo grid */}
          {photos.length > 0 && (
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 mb-4">
              {photos.map((fn, idx) => (
                <div key={fn} className="relative aspect-[3/4] rounded-xl overflow-hidden bg-rose-50 border border-rose-100 group">
                  <img src={uploadUrl(fn)} alt={`Photo ${idx + 1}`} className="w-full h-full object-cover" />
                  {idx === 0 && (
                    <span className="absolute top-1 left-1 text-[10px] bg-saffron-500 text-white px-1.5 py-0.5 rounded-full font-medium">Cover</span>
                  )}
                  <button
                    type="button"
                    onClick={() => removePhoto(idx)}
                    className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X size={10} />
                  </button>
                </div>
              ))}
              {photos.length < 5 && (
                <label className="aspect-[3/4] rounded-xl border-2 border-dashed border-rose-200 flex flex-col items-center justify-center cursor-pointer hover:border-rose-400 transition-colors">
                  {uploading ? <Loader2 size={18} className="animate-spin text-rose-400" /> : <Upload size={18} className="text-rose-300" />}
                  <span className="text-[10px] text-gray-400 mt-1">{uploading ? 'Uploading' : 'Add'}</span>
                  <input type="file" accept="image/*" multiple className="hidden" onChange={handlePhotoUpload} disabled={uploading} />
                </label>
              )}
            </div>
          )}

          {photos.length === 0 && (
            <label className="flex flex-col items-center gap-3 p-8 border-2 border-dashed border-rose-200 rounded-2xl cursor-pointer hover:border-rose-400 hover:bg-rose-50 transition-all">
              {uploading ? (
                <>
                  <Loader2 size={32} className="text-rose-400 animate-spin" />
                  <span className="text-sm text-gray-500">Uploading...</span>
                </>
              ) : (
                <>
                  <div className="flex flex-col items-center gap-1 text-rose-300">
                    <User size={40} />
                    <Upload size={20} />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium text-gray-700">Upload up to 5 photos</p>
                    <p className="text-xs text-gray-400">Portrait orientation recommended</p>
                  </div>
                </>
              )}
              <input type="file" accept="image/*" multiple className="hidden" onChange={handlePhotoUpload} disabled={uploading} />
            </label>
          )}
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

        {/* Community and Horoscope Details */}
        <div className="card p-6 space-y-4">
          <h2 className="font-semibold text-gray-800">Community and Horoscope Details</h2>
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
            <div>
              <label className="label">Birth Time</label>
              <input type="text" className="input" placeholder="e.g. 10:30 AM" value={form.birth_time} onChange={set('birth_time')} />
            </div>
            <div>
              <label className="label">Birth Place</label>
              <input type="text" className="input" placeholder="e.g. Chennai" value={form.birth_place} onChange={set('birth_place')} />
            </div>
          </div>
        </div>

        {/* Horoscope */}
        <div className="card p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-gray-800">Horoscope / Jathakam</h2>
            <span className="text-xs text-gray-400">Optional — add manually or generate with AI</span>
          </div>

          {/* Language tabs */}
          <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
            {LANGS.map(({ code, label }) => (
              <button
                key={code}
                type="button"
                onClick={() => setActiveLang(code)}
                className={`flex-1 text-xs font-medium py-1.5 rounded-lg transition-all
                  ${activeLang === code ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
              >
                {label}
              </button>
            ))}
          </div>

          <textarea
            className="input min-h-[140px] resize-none text-sm"
            placeholder={`Enter horoscope in ${LANGS.find(l => l.code === activeLang)?.label}...`}
            value={horoscopeTexts[activeLang]}
            onChange={(e) => setHoroscopeTexts((prev) => ({ ...prev, [activeLang]: e.target.value }))}
          />

          <div className="flex items-center gap-3 text-xs text-gray-400">
            <Sparkles size={14} className="text-saffron-500 flex-shrink-0" />
            <span>
              After saving, you can also generate AI horoscope in each language from the profile page.
            </span>
          </div>
        </div>

        {/* About and Contact */}
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
          <div>
            <label className="label">Phone Visibility</label>
            <p className="text-xs text-gray-400 mb-2">Choose whether your phone number is visible to other members.</p>
            <div className="flex gap-3">
              <button type="button" onClick={() => setPhonePublic(false)}
                className={`flex-1 flex items-center gap-2 p-3 rounded-xl border-2 transition-all text-left
                  ${!phonePublic ? 'border-gray-400 bg-gray-50' : 'border-gray-100 hover:border-gray-200'}`}>
                <Lock size={15} className={!phonePublic ? 'text-gray-600' : 'text-gray-400'} />
                <div>
                  <p className="font-medium text-sm text-gray-700">Hidden</p>
                  <p className="text-xs text-gray-400">Masked from members</p>
                </div>
              </button>
              <button type="button" onClick={() => setPhonePublic(true)}
                className={`flex-1 flex items-center gap-2 p-3 rounded-xl border-2 transition-all text-left
                  ${phonePublic ? 'border-green-400 bg-green-50' : 'border-gray-100 hover:border-gray-200'}`}>
                <Globe size={15} className={phonePublic ? 'text-green-600' : 'text-gray-400'} />
                <div>
                  <p className={`font-medium text-sm ${phonePublic ? 'text-green-700' : 'text-gray-700'}`}>Visible</p>
                  <p className="text-xs text-gray-400">Full number shown</p>
                </div>
              </button>
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <button type="submit" disabled={saving || generating} className="btn-primary flex-1">
            {saving ? 'Creating...' : 'Create Profile'}
          </button>
          <button
            type="button"
            onClick={handleGenerateHoroscope}
            disabled={saving || generating}
            className="btn-outline flex items-center gap-2"
          >
            {generating ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
            {generating ? 'Generating...' : 'Save & Generate Horoscope'}
          </button>
          <button type="button" onClick={() => navigate('/matrimony')} className="btn-outline">
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
