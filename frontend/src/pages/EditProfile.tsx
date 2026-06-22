import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera, Upload, User, Globe, Lock, Star, Smartphone } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import api, { uploadUrl } from '../api/client';
import { useAuth } from '../contexts/AuthContext';

export default function EditProfile() {
  const navigate = useNavigate();
  const { refreshUser } = useAuth();
  const { t } = useTranslation();
  const [form, setForm] = useState({
    full_name: '', bio: '', phone: '', location: '',
    occupation: '', dob: '', native_place: '', gothram: '',
    linkedin: '', website: '', achievements: '',
  });
  const [isPublic, setIsPublic] = useState<boolean | null>(null);
  const [mobilePublic, setMobilePublic] = useState(false);
  const [isProminent, setIsProminent] = useState(false);
  const [photoFilename, setPhotoFilename] = useState('');
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Mobile change state
  const [currentMobile, setCurrentMobile] = useState('');
  const [showMobileChange, setShowMobileChange] = useState(false);
  const [mobileStep, setMobileStep] = useState<'enter' | 'otp'>('enter');
  const [newMobile, setNewMobile] = useState('');
  const [mobileEmail, setMobileEmail] = useState('');
  const [mobileOtp, setMobileOtp] = useState('');
  const [mobileInfo, setMobileInfo] = useState('');
  const [mobileError, setMobileError] = useState('');
  const [mobileLoading, setMobileLoading] = useState(false);

  useEffect(() => {
    api.get('/profile').then((r) => {
      const p = r.data.profile || {};
      setForm({
        full_name: p.full_name || '',
        bio: p.bio || '',
        phone: p.phone || '',
        location: p.location || '',
        occupation: p.occupation || '',
        dob: p.dob || '',
        native_place: p.native_place || '',
        gothram: p.gothram || '',
        linkedin: p.linkedin || '',
        website: p.website || '',
        achievements: p.achievements || '',
      });
      setPhotoFilename(p.photo_filename || '');
      setIsPublic(p.is_public ?? null);
      setMobilePublic(r.data.user?.mobile_public ?? false);
      setIsProminent(p.is_prominent ?? false);
      setCurrentMobile(r.data.user?.mobile || '');
    });
  }, []);

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
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
      await api.put('/profile', { ...form, photo_filename: photoFilename, is_public: isPublic, mobile_public: mobilePublic, is_prominent: isProminent });
      await refreshUser();
      setSuccess(true);
      setTimeout(() => navigate('/profile'), 1200);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  const isNewMobileIndian = newMobile.startsWith('+91');

  const sendMobileOtp = async () => {
    setMobileError('');
    setMobileLoading(true);
    try {
      const body: Record<string, string> = { new_mobile: newMobile };
      if (!isNewMobileIndian && mobileEmail) body.email = mobileEmail;
      const res = await api.post('/profile/request-mobile-change', body);
      setMobileInfo(res.data.message);
      setMobileStep('otp');
    } catch (err: any) {
      setMobileError(err.response?.data?.error || 'Failed to send OTP.');
    } finally {
      setMobileLoading(false);
    }
  };

  const confirmMobileChange = async () => {
    setMobileError('');
    setMobileLoading(true);
    try {
      const res = await api.post('/profile/confirm-mobile-change', { new_mobile: newMobile, otp_code: mobileOtp });
      setCurrentMobile(res.data.user.mobile);
      await refreshUser();
      setShowMobileChange(false);
      setMobileStep('enter');
      setNewMobile(''); setMobileOtp(''); setMobileInfo('');
    } catch (err: any) {
      setMobileError(err.response?.data?.error || 'Failed to update mobile number.');
    } finally {
      setMobileLoading(false);
    }
  };

  const photoUrl = photoFilename ? uploadUrl(photoFilename) : null;

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <h1 className="font-display font-bold text-2xl text-gray-900 mb-6">{t('editProfile.title')}</h1>

      {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm">{error}</div>}
      {success && <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 rounded-xl text-sm">{t('editProfile.profileSaved')}</div>}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Photo */}
        <div className="card p-6">
          <h2 className="font-semibold text-gray-800 mb-4">{t('editProfile.profilePhoto')}</h2>
          <div className="flex items-center gap-5">
            <div className="w-20 h-20 rounded-2xl bg-saffron-100 border-2 border-saffron-200 overflow-hidden flex items-center justify-center">
              {photoUrl ? (
                <img src={photoUrl} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <User size={30} className="text-saffron-400" />
              )}
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <label className="btn-outline flex items-center gap-2 cursor-pointer">
                <Upload size={16} />
                {uploading ? t('editProfile.uploading') : t('editProfile.uploadPhoto')}
                <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} disabled={uploading} />
              </label>
              <label className="btn-outline flex items-center gap-2 cursor-pointer">
                <Camera size={16} />
                {t('editProfile.takePhoto')}
                <input type="file" accept="image/*" capture="user" className="hidden" onChange={handlePhotoUpload} disabled={uploading} />
              </label>
            </div>
          </div>
        </div>

        {/* Basic Info */}
        <div className="card p-6 space-y-4">
          <h2 className="font-semibold text-gray-800">{t('editProfile.basicInfo')}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label">{t('editProfile.fullName')}</label>
              <input type="text" className="input" value={form.full_name} onChange={set('full_name')} />
            </div>
            <div>
              <label className="label">{t('editProfile.dob')}</label>
              <input type="date" className="input" value={form.dob} onChange={set('dob')} />
            </div>
            <div>
              <label className="label">{t('editProfile.phone')}</label>
              <input type="tel" className="input" value={form.phone} onChange={set('phone')} />
            </div>
            <div>
              <label className="label">{t('editProfile.location')}</label>
              <input type="text" className="input" placeholder={t('editProfile.locationPlaceholder')} value={form.location} onChange={set('location')} />
            </div>
            <div>
              <label className="label">{t('editProfile.occupationType')}</label>
              <select className="input" value={form.occupation} onChange={set('occupation') as any}>
                <option value="">{t('editProfile.selectType')}</option>
                <option value="Self-Employed">{t('editProfile.selfEmployed')}</option>
                <option value="Business">{t('editProfile.business')}</option>
                <option value="Public">{t('editProfile.public')}</option>
                <option value="Private">{t('editProfile.private')}</option>
              </select>
            </div>
          </div>
          <div>
            <label className="label">{t('editProfile.bio')}</label>
            <textarea className="input min-h-[90px] resize-none" value={form.bio} onChange={set('bio') as any} placeholder={t('editProfile.bioPlaceholder')} />
          </div>
        </div>

        {/* Community Details */}
        <div className="card p-6 space-y-4">
          <h2 className="font-semibold text-gray-800">{t('editProfile.communityDetails')}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label">{t('editProfile.nativePlaceLabel')}</label>
              <input type="text" className="input" value={form.native_place} onChange={set('native_place')} />
            </div>
            <div>
              <label className="label">{t('editProfile.gothramLabel')}</label>
              <input type="text" className="input" value={form.gothram} onChange={set('gothram')} />
            </div>
          </div>
        </div>

        {/* Achievements & Prominent Figure */}
        <div className="card p-6 space-y-4">
          <div className="flex items-center gap-2">
            <Star size={16} className="text-amber-500 fill-amber-400" />
            <h2 className="font-semibold text-gray-800">{t('editProfile.achievementsTitle')}</h2>
          </div>
          <div>
            <label className="label">{t('editProfile.achievementsLabel')}</label>
            <textarea
              className="input min-h-[90px] resize-none"
              placeholder={t('editProfile.achievementsPlaceholder')}
              value={form.achievements}
              onChange={set('achievements') as any}
            />
            <p className="text-xs text-gray-400 mt-1">{t('editProfile.achievementsHint')}</p>
          </div>
          <div>
            <label className="label flex items-center gap-1.5">
              <Star size={13} className="text-amber-500 fill-amber-400" /> {t('editProfile.prominentLabel')}
            </label>
            <p className="text-xs text-gray-400 mb-3">
              {t('editProfile.prominentDesc')}
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setIsProminent(true)}
                className={`flex-1 flex items-center gap-2 p-3 rounded-xl border-2 transition-all text-left
                  ${isProminent ? 'border-amber-400 bg-amber-50' : 'border-gray-100 hover:border-gray-200'}`}
              >
                <Star size={15} className={isProminent ? 'text-amber-500 fill-amber-400' : 'text-gray-400'} />
                <div>
                  <p className={`font-medium text-sm ${isProminent ? 'text-amber-700' : 'text-gray-700'}`}>{t('editProfile.prominentYes')}</p>
                  <p className="text-xs text-gray-400">{t('editProfile.prominentYesDesc')}</p>
                </div>
              </button>
              <button
                type="button"
                onClick={() => setIsProminent(false)}
                className={`flex-1 flex items-center gap-2 p-3 rounded-xl border-2 transition-all text-left
                  ${!isProminent ? 'border-gray-400 bg-gray-50' : 'border-gray-100 hover:border-gray-200'}`}
              >
                <User size={15} className={!isProminent ? 'text-gray-600' : 'text-gray-400'} />
                <div>
                  <p className="font-medium text-sm text-gray-700">{t('editProfile.prominentNo')}</p>
                  <p className="text-xs text-gray-400">{t('editProfile.prominentNoDesc')}</p>
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Links */}
        <div className="card p-6 space-y-4">
          <h2 className="font-semibold text-gray-800">{t('editProfile.linksTitle')}</h2>
          <div>
            <label className="label">{t('editProfile.linkedInUrl')}</label>
            <input type="url" className="input" placeholder={t('editProfile.linkedInPlaceholder')} value={form.linkedin} onChange={set('linkedin')} />
          </div>
          <div>
            <label className="label">{t('editProfile.websiteUrl')}</label>
            <input type="url" className="input" placeholder={t('editProfile.websitePlaceholder')} value={form.website} onChange={set('website')} />
          </div>
        </div>

        {/* Privacy */}
        <div className="card p-6 space-y-5">
          <div>
            <h2 className="font-semibold text-gray-800 mb-1">{t('editProfile.privacy')}</h2>
            <p className="text-sm text-gray-400 mb-4">{t('editProfile.privacyDesc')}</p>
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                onClick={() => setIsPublic(true)}
                className={`flex-1 flex items-center gap-3 p-4 rounded-xl border-2 transition-all text-left
                  ${isPublic === true ? 'border-green-400 bg-green-50' : 'border-gray-100 hover:border-gray-200'}`}
              >
                <Globe size={18} className={isPublic === true ? 'text-green-600' : 'text-gray-400'} />
                <div>
                  <p className={`font-medium text-sm ${isPublic === true ? 'text-green-700' : 'text-gray-700'}`}>{t('editProfile.publicOption')}</p>
                  <p className="text-xs text-gray-400">{t('editProfile.publicOptionDesc')}</p>
                </div>
              </button>
              <button
                type="button"
                onClick={() => setIsPublic(false)}
                className={`flex-1 flex items-center gap-3 p-4 rounded-xl border-2 transition-all text-left
                  ${isPublic === false ? 'border-gray-400 bg-gray-50' : 'border-gray-100 hover:border-gray-200'}`}
              >
                <Lock size={18} className={isPublic === false ? 'text-gray-600' : 'text-gray-400'} />
                <div>
                  <p className={`font-medium text-sm ${isPublic === false ? 'text-gray-700' : 'text-gray-700'}`}>{t('editProfile.privateOption')}</p>
                  <p className="text-xs text-gray-400">{t('editProfile.privateOptionDesc')}</p>
                </div>
              </button>
            </div>
          </div>

          <div className="border-t border-gray-100 pt-5">
            <h2 className="font-semibold text-gray-800 mb-1">{t('editProfile.mobileVisibility')}</h2>
            <p className="text-sm text-gray-400 mb-3">{t('editProfile.mobileVisibilityDesc')}</p>
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                onClick={() => setMobilePublic(true)}
                className={`flex-1 flex items-center gap-3 p-4 rounded-xl border-2 transition-all text-left
                  ${mobilePublic ? 'border-green-400 bg-green-50' : 'border-gray-100 hover:border-gray-200'}`}
              >
                <Globe size={18} className={mobilePublic ? 'text-green-600' : 'text-gray-400'} />
                <div>
                  <p className={`font-medium text-sm ${mobilePublic ? 'text-green-700' : 'text-gray-700'}`}>{t('editProfile.showNumber')}</p>
                  <p className="text-xs text-gray-400">{t('editProfile.showNumberDesc')}</p>
                </div>
              </button>
              <button
                type="button"
                onClick={() => setMobilePublic(false)}
                className={`flex-1 flex items-center gap-3 p-4 rounded-xl border-2 transition-all text-left
                  ${!mobilePublic ? 'border-gray-400 bg-gray-50' : 'border-gray-100 hover:border-gray-200'}`}
              >
                <Lock size={18} className={!mobilePublic ? 'text-gray-600' : 'text-gray-400'} />
                <div>
                  <p className="font-medium text-sm text-gray-700">{t('editProfile.hideNumber')}</p>
                  <p className="text-xs text-gray-400">{t('editProfile.hideNumberDesc')}</p>
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Change Mobile Number */}
        <div className="card p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Smartphone size={16} className="text-saffron-600" />
              <h2 className="font-semibold text-gray-800">Mobile Number</h2>
            </div>
            {!showMobileChange && (
              <button
                type="button"
                onClick={() => setShowMobileChange(true)}
                className="text-sm text-saffron-600 font-medium hover:underline"
              >
                Change
              </button>
            )}
          </div>

          <p className="text-sm text-gray-500">
            Current: <span className="font-mono font-medium text-gray-700">{currentMobile || '—'}</span>
          </p>

          {showMobileChange && (
            <div className="border-t border-gray-100 pt-4 space-y-4">
              {mobileError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm">{mobileError}</div>
              )}
              {mobileInfo && (
                <div className="p-3 bg-green-50 border border-green-200 text-green-700 rounded-xl text-sm">{mobileInfo}</div>
              )}

              {mobileStep === 'enter' && (
                <div className="space-y-3">
                  <div>
                    <label className="label">New Mobile Number</label>
                    <input
                      type="tel"
                      className="input"
                      placeholder="+919876543210"
                      value={newMobile}
                      onChange={(e) => setNewMobile(e.target.value)}
                    />
                    <p className="text-xs text-gray-400 mt-1">Include country code, e.g. +919876543210</p>
                  </div>
                  {newMobile && !isNewMobileIndian && (
                    <div>
                      <label className="label">Email (for OTP delivery)</label>
                      <input
                        type="email"
                        className="input"
                        placeholder="your@email.com"
                        value={mobileEmail}
                        onChange={(e) => setMobileEmail(e.target.value)}
                      />
                    </div>
                  )}
                  <div className="flex gap-2">
                    <button type="button" onClick={sendMobileOtp} disabled={mobileLoading} className="btn-primary">
                      {mobileLoading ? 'Sending…' : 'Send OTP'}
                    </button>
                    <button
                      type="button"
                      onClick={() => { setShowMobileChange(false); setMobileError(''); setNewMobile(''); }}
                      className="btn-outline"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {mobileStep === 'otp' && (
                <div className="space-y-3">
                  <div>
                    <label className="label">Enter OTP</label>
                    <input
                      type="text"
                      inputMode="numeric"
                      className="input tracking-widest text-center text-xl"
                      placeholder="------"
                      maxLength={6}
                      value={mobileOtp}
                      onChange={(e) => setMobileOtp(e.target.value.replace(/\D/g, ''))}
                    />
                  </div>
                  <div className="flex gap-2">
                    <button type="button" onClick={confirmMobileChange} disabled={mobileLoading || mobileOtp.length < 4} className="btn-primary">
                      {mobileLoading ? 'Verifying…' : 'Confirm Change'}
                    </button>
                    <button
                      type="button"
                      onClick={() => { setMobileStep('enter'); setMobileOtp(''); setMobileInfo(''); setMobileError(''); }}
                      className="btn-outline"
                    >
                      ← Back
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex gap-3">
          <button type="submit" disabled={saving} className="btn-primary flex-1">
            {saving ? t('common.saving') : t('editProfile.saveProfile')}
          </button>
          <button type="button" onClick={() => navigate('/profile')} className="btn-outline">
            {t('common.cancel')}
          </button>
        </div>
      </form>
    </div>
  );
}
