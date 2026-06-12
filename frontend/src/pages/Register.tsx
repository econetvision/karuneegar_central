import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Phone, CheckCircle2, RefreshCw } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import api from '../api/client';
import PhoneInput from '../components/PhoneInput';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [form, setForm] = useState({
    full_name: '', username: '', email: '', password: '', confirm: '', mobile: '',
  });
  const [mobilePublic, setMobilePublic] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [devOtp, setDevOtp] = useState('');
  const [otpVia, setOtpVia] = useState<'sms' | 'email'>('sms');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  // Countdown tick
  useEffect(() => {
    if (countdown <= 0) return;
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  const isIndian = form.mobile.startsWith('+91');

  const handleSendOtp = async () => {
    const mobile = form.mobile.trim();
    if (!mobile) { setError('Please enter your mobile number first.'); return; }
    if (!mobile.startsWith('+') || mobile.length < 10) {
      setError('Include country code, e.g. +919876543210');
      return;
    }
    if (!isIndian && !form.email.trim()) {
      setError('Please enter your email above — OTP will be sent there for international numbers.');
      return;
    }
    setSendingOtp(true);
    setError('');
    try {
      const payload: { mobile: string; email?: string } = { mobile };
      if (!isIndian) payload.email = form.email.trim();
      const r = await api.post('/auth/send-otp', payload);
      setOtpSent(true);
      setOtpVia(r.data.via ?? 'sms');
      setCountdown(60);
      if (r.data.dev_otp) {
        setDevOtp(r.data.dev_otp);
        setOtpCode(r.data.dev_otp);
      } else {
        setOtpCode('');
        setDevOtp('');
      }
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
      setError(msg || 'Failed to send OTP. Try again.');
    } finally {
      setSendingOtp(false);
    }
  };

  const handleSubmit = async (e: { preventDefault(): void }) => {
    e.preventDefault();
    setError('');
    const usernameNorm = form.username.trim().toLowerCase();
    if (!/^[a-z0-9_]{3,30}$/.test(usernameNorm)) {
      setError('Username must be 3–30 characters: letters, numbers, and underscore only.');
      return;
    }
    if (form.password !== form.confirm) { setError('Passwords do not match.'); return; }
    if (!otpSent || otpCode.length !== 5) { setError('Please verify your mobile number first.'); return; }
    setLoading(true);
    try {
      await register(form.username, form.email, form.password, form.full_name, form.mobile, otpCode, mobilePublic);
      navigate('/profile');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
      setError(msg || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-gradient-to-br from-orange-50 to-amber-50">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-saffron-500 to-saffron-700 flex items-center justify-center text-white font-bold text-xl">
              K
            </div>
          </Link>
          <h1 className="font-display font-bold text-2xl text-gray-900">{t('auth.joinTitle')}</h1>
          <p className="text-gray-500 mt-1">{t('auth.createProfileSubtitle')}</p>
        </div>

        <div className="card p-8">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Basic fields */}
            <div>
              <label className="label">{t('auth.fullName')}</label>
              <input type="text" className="input" placeholder={t('auth.fullNamePlaceholder')}
                value={form.full_name} onChange={set('full_name')} required />
            </div>
            <div>
              <label className="label">{t('auth.username')}</label>
              <input
                type="text"
                className="input"
                placeholder={t('auth.usernamePlaceholder')}
                value={form.username}
                onChange={(e) => setForm((f) => ({ ...f, username: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '') }))}
                minLength={3}
                maxLength={30}
                required
              />
              <p className="mt-1 text-xs text-gray-400">{t('auth.usernameHint')}</p>
            </div>
            <div>
              <label className="label">{t('auth.email')}</label>
              <input type="email" className="input" placeholder={t('auth.emailFieldPlaceholder')}
                value={form.email} onChange={set('email')} required />
            </div>
            <div>
              <label className="label">{t('auth.password')}</label>
              <input type="password" className="input" placeholder={t('auth.passwordMin')}
                value={form.password} onChange={set('password')} required minLength={6} />
            </div>
            <div>
              <label className="label">{t('auth.confirmPassword')}</label>
              <input type="password" className="input" placeholder={t('auth.confirmPasswordPlaceholder')}
                value={form.confirm} onChange={set('confirm')} required />
            </div>

            {/* Mobile + OTP */}
            <div className="pt-1 border-t border-gray-100">
              <label className="label flex items-center gap-1.5">
                <Phone size={13} className="text-saffron-600" /> {t('auth.mobileNumber')}
              </label>
              <div className="flex gap-2">
                <PhoneInput
                  value={form.mobile}
                  onChange={(v) => setForm((f) => ({ ...f, mobile: v }))}
                  onReset={() => { if (otpSent) { setOtpSent(false); setOtpCode(''); } }}
                  disabled={sendingOtp || loading}
                  required
                />
                <button
                  type="button"
                  onClick={handleSendOtp}
                  disabled={sendingOtp || countdown > 0}
                  className="flex-shrink-0 flex items-center gap-1.5 px-4 py-2.5 rounded-xl border-2 border-saffron-600 text-saffron-600 font-semibold text-sm
                    hover:bg-saffron-600 hover:text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {sendingOtp ? (
                    <RefreshCw size={14} className="animate-spin" />
                  ) : countdown > 0 ? (
                    `${countdown}s`
                  ) : otpSent ? (
                    t('auth.resend')
                  ) : isIndian ? (
                    t('auth.sendOtp')
                  ) : (
                    t('auth.emailOtp')
                  )}
                </button>
              </div>

              {!isIndian && !otpSent && (
                <p className="mt-1.5 text-xs text-amber-600">
                  {t('auth.otpEmailHint')}
                </p>
              )}

              {/* OTP input — shown after sending */}
              {otpSent && (
                <div className="mt-3">
                  <label className="label flex items-center gap-1.5">
                    {otpCode.length === 5
                      ? <CheckCircle2 size={13} className="text-green-500" />
                      : <span className="w-3.5 h-3.5 rounded-full border-2 border-gray-300 inline-block" />}
                    {t('auth.otpPrompt', { destination: otpVia === 'email' ? `email (${form.email})` : `mobile (${form.mobile})` })}
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={5}
                    pattern="\d{5}"
                    className="input tracking-[0.5em] font-mono text-center text-xl"
                    placeholder="·····"
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 5))}
                    required
                    autoFocus
                  />
                  {devOtp && (
                    <div className="mt-2 flex items-center gap-2 px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-700">
                      <span className="font-semibold">Dev mode:</span>
                      OTP auto-filled — <span className="font-mono font-bold tracking-widest">{devOtp}</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Mobile visibility consent */}
            <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-50 border border-amber-100">
              <input
                type="checkbox"
                id="mobile_public"
                checked={mobilePublic}
                onChange={(e) => setMobilePublic(e.target.checked)}
                className="mt-0.5 w-4 h-4 accent-saffron-600 flex-shrink-0"
              />
              <label htmlFor="mobile_public" className="text-sm text-gray-700 cursor-pointer select-none">
                {t('auth.mobilePublicConsent')}
                <span className="block text-xs text-gray-400 mt-0.5">
                  {t('auth.mobilePublicHint')}
                </span>
              </label>
            </div>

            <button
              type="submit"
              disabled={loading || !otpSent || otpCode.length !== 5}
              className="btn-primary w-full justify-center flex"
            >
              {loading ? t('auth.creatingAccount') : t('auth.createAccountBtn')}
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-gray-500 mt-6">
          {t('auth.alreadyMember')}{' '}
          <Link to="/login" className="text-saffron-600 font-medium hover:underline">{t('auth.signInLink')}</Link>
        </p>
      </div>
    </div>
  );
}
