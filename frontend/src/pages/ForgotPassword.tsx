import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/client';

type Step = 'mobile' | 'otp' | 'password';

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>('mobile');

  const [mobile, setMobile] = useState('');
  const [email, setEmail] = useState('');
  const [via, setVia] = useState<'sms' | 'email'>('sms');

  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');

  const isIndian = mobile.startsWith('+91');

  const sendOtp = async (e: { preventDefault(): void }) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const body: Record<string, string> = { mobile };
      if (!isIndian && email) body.email = email;
      const res = await api.post('/auth/forgot-password', body);
      setVia(res.data.via);
      setInfo(res.data.message);
      setStep('otp');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to send OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (e: { preventDefault(): void }) => {
    e.preventDefault();
    setError('');
    if (newPassword !== confirmPassword) { setError('Passwords do not match.'); return; }
    if (newPassword.length < 6) { setError('Password must be at least 6 characters.'); return; }
    setLoading(true);
    try {
      await api.post('/auth/reset-password', { mobile, otp_code: otp, new_password: newPassword });
      navigate('/login', { state: { message: 'Password reset successfully. Please sign in.' } });
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to reset password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-gradient-to-br from-orange-50 to-amber-50">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-saffron-500 to-saffron-700 flex items-center justify-center text-white font-bold text-xl">
              K
            </div>
          </Link>
          <h1 className="font-display font-bold text-2xl text-gray-900">Reset Password</h1>
          <p className="text-gray-500 mt-1">
            {step === 'mobile' && 'Enter your registered mobile number'}
            {step === 'otp'    && `Enter the OTP sent to your ${via === 'sms' ? 'mobile' : 'email'}`}
            {step === 'password' && 'Choose a new password'}
          </p>
        </div>

        <div className="card p-8">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm">
              {error}
            </div>
          )}
          {info && step === 'otp' && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 rounded-xl text-sm">
              {info}
            </div>
          )}

          {/* Step 1 — mobile */}
          {step === 'mobile' && (
            <form onSubmit={sendOtp} className="space-y-5">
              <div>
                <label className="label">Mobile Number</label>
                <input
                  type="tel"
                  className="input"
                  placeholder="+919876543210"
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value)}
                  required
                />
                <p className="text-xs text-gray-400 mt-1">Include country code, e.g. +919876543210</p>
              </div>
              {mobile && !isIndian && (
                <div>
                  <label className="label">Email (for OTP delivery)</label>
                  <input
                    type="email"
                    className="input"
                    placeholder="your@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              )}
              <button type="submit" disabled={loading} className="btn-primary w-full justify-center flex">
                {loading ? 'Sending OTP…' : 'Send OTP'}
              </button>
            </form>
          )}

          {/* Step 2 — OTP */}
          {step === 'otp' && (
            <form onSubmit={(e) => { e.preventDefault(); setStep('password'); }} className="space-y-5">
              <div>
                <label className="label">OTP Code</label>
                <input
                  type="text"
                  inputMode="numeric"
                  className="input tracking-widest text-center text-xl"
                  placeholder="------"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                  required
                />
              </div>
              <button type="submit" disabled={otp.length < 4} className="btn-primary w-full justify-center flex">
                Verify OTP
              </button>
              <button
                type="button"
                className="w-full text-sm text-saffron-600 hover:underline"
                onClick={() => { setStep('mobile'); setOtp(''); setInfo(''); }}
              >
                ← Change mobile number
              </button>
            </form>
          )}

          {/* Step 3 — new password */}
          {step === 'password' && (
            <form onSubmit={resetPassword} className="space-y-5">
              <div>
                <label className="label">New Password</label>
                <input
                  type="password"
                  className="input"
                  placeholder="At least 6 characters"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="label">Confirm Password</label>
                <input
                  type="password"
                  className="input"
                  placeholder="Repeat new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>
              <button type="submit" disabled={loading} className="btn-primary w-full justify-center flex">
                {loading ? 'Resetting…' : 'Reset Password'}
              </button>
            </form>
          )}
        </div>

        <p className="text-center text-sm text-gray-500 mt-4">
          Remember your password?{' '}
          <Link to="/login" className="text-saffron-600 font-medium hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
