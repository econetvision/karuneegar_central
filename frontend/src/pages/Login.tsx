import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const from = searchParams.get('from') || '/';
  const { t } = useTranslation();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: { preventDefault(): void }) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(identifier, password);
      navigate(from, { replace: true });
    } catch (err: any) {
      setError(err.response?.data?.error || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-gradient-to-br from-orange-50 to-amber-50">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-saffron-500 to-saffron-700 flex items-center justify-center text-white font-bold text-xl">
              K
            </div>
          </Link>
          <h1 className="font-display font-bold text-2xl text-gray-900">{t('auth.welcomeBack')}</h1>
          <p className="text-gray-500 mt-1">{t('auth.signInSubtitle')}</p>
        </div>

        <div className="card p-8">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm">
              {error}
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="label">{t('auth.emailOrUsername')}</label>
              <input
                type="text"
                className="input"
                placeholder={t('auth.emailPlaceholder')}
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                required
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="label !mb-0">{t('auth.password')}</label>
                <Link to="/forgot-password" className="text-xs text-saffron-600 hover:underline">
                  {t('auth.forgotPassword')}
                </Link>
              </div>
              <input
                type="password"
                className="input"
                placeholder={t('auth.passwordPlaceholder')}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full text-center justify-center flex"
            >
              {loading ? t('auth.signingIn') : t('auth.signIn')}
            </button>
          </form>
        </div>

        {/* Join Now CTA */}
        <div className="mt-4 card p-5 text-center border-2 border-saffron-100">
          <p className="text-sm font-medium text-gray-700 mb-3">New to Karuneegar Central?</p>
          <Link
            to={`/register${from !== '/' ? `?from=${encodeURIComponent(from)}` : ''}`}
            className="inline-flex items-center gap-2 bg-saffron-600 hover:bg-saffron-700 text-white font-semibold px-6 py-2.5 rounded-xl transition-colors w-full justify-center"
          >
            Join Now <ArrowRight size={16} />
          </Link>
          <p className="text-xs text-gray-400 mt-2">Free · Takes less than 2 minutes</p>
        </div>
      </div>
    </div>
  );
}
