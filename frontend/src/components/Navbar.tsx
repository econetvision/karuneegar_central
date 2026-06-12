import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { Menu, X, User, LogOut, ChevronDown, Languages } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { LogoIcon } from './KarunegarLogo';
import { useTranslation } from 'react-i18next';

const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'ta', label: 'தமிழ்' },
  { code: 'te', label: 'తెలుగు' },
  { code: 'kn', label: 'ಕನ್ನಡ' },
];

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const [open, setOpen] = useState(false);
  const [dropOpen, setDropOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const navLinks = [
    { to: '/', label: t('nav.home') },
    { to: '/members', label: t('nav.members') },
    { to: '/family-tree', label: t('nav.familyTree') },
    { to: '/forums', label: t('nav.forums') },
    { to: '/businesses', label: t('nav.businesses') },
    { to: '/matrimony', label: t('nav.matrimony') },
    { to: '/scholarships', label: t('nav.scholarships') },
    { to: '/about', label: t('nav.about') },
  ];

  const currentLang = LANGUAGES.find((l) => l.code === i18n.language) ?? LANGUAGES[0];

  return (
    <nav className="bg-white border-b border-orange-100 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <LogoIcon size={36} />
            <span className="font-display font-bold text-xl text-gray-900 hidden sm:block leading-none">
              Karuneegar{' '}
              <span className="text-saffron-600">Central</span>
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                end={l.to === '/'}
                className={({ isActive }) =>
                  `px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'text-saffron-600 bg-saffron-50'
                      : 'text-gray-600 hover:text-saffron-600 hover:bg-saffron-50'
                  }`
                }
              >
                {l.label}
              </NavLink>
            ))}
          </div>

          {/* Auth + Language */}
          <div className="hidden md:flex items-center gap-2">
            {/* Language switcher */}
            <div className="relative">
              <button
                onClick={() => setLangOpen(!langOpen)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm text-gray-600 hover:text-saffron-600 hover:bg-saffron-50 transition-colors"
                title="Switch language"
              >
                <Languages size={16} />
                <span className="font-medium">{currentLang.label}</span>
              </button>
              {langOpen && (
                <div className="absolute right-0 mt-1 w-36 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-50">
                  {LANGUAGES.map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => {
                        i18n.changeLanguage(lang.code);
                        setLangOpen(false);
                      }}
                      className={`w-full text-left px-4 py-2.5 text-sm hover:bg-saffron-50 hover:text-saffron-600 ${
                        i18n.language === lang.code ? 'text-saffron-600 font-medium' : 'text-gray-700'
                      }`}
                    >
                      {lang.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {user ? (
              <div className="relative">
                <button
                  onClick={() => setDropOpen(!dropOpen)}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-saffron-50 transition-colors"
                >
                  <div className="w-8 h-8 rounded-full bg-saffron-100 flex items-center justify-center">
                    <User size={16} className="text-saffron-700" />
                  </div>
                  <span className="text-sm font-medium text-gray-700">{user.username}</span>
                  <ChevronDown size={14} className="text-gray-400" />
                </button>
                {dropOpen && (
                  <div className="absolute right-0 mt-1 w-48 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-50">
                    <Link
                      to="/profile"
                      className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-saffron-50 hover:text-saffron-600"
                      onClick={() => setDropOpen(false)}
                    >
                      <User size={15} /> {t('nav.myProfile')}
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50"
                    >
                      <LogOut size={15} /> {t('nav.logout')}
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <>
                <Link to="/login" className="btn-ghost text-sm">{t('nav.login')}</Link>
                <Link to="/register" className="btn-primary text-sm">{t('nav.joinNow')}</Link>
              </>
            )}
          </div>

          {/* Mobile toggle */}
          <button onClick={() => setOpen(!open)} className="md:hidden p-2 rounded-lg hover:bg-gray-100">
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden border-t border-gray-100 bg-white px-4 pb-4 pt-2 space-y-1">
          {navLinks.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.to === '/'}
              className={({ isActive }) =>
                `block px-3 py-2.5 rounded-lg text-sm font-medium ${
                  isActive ? 'text-saffron-600 bg-saffron-50' : 'text-gray-600'
                }`
              }
              onClick={() => setOpen(false)}
            >
              {l.label}
            </NavLink>
          ))}
          {/* Mobile language switcher */}
          <div className="pt-2 border-t border-gray-100">
            <p className="text-xs text-gray-400 px-3 pb-1">Language</p>
            <div className="flex gap-2 flex-wrap px-1">
              {LANGUAGES.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => {
                    i18n.changeLanguage(lang.code);
                    setOpen(false);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                    i18n.language === lang.code
                      ? 'bg-saffron-600 text-white border-saffron-600'
                      : 'bg-white text-gray-600 border-gray-200 hover:border-saffron-400'
                  }`}
                >
                  {lang.label}
                </button>
              ))}
            </div>
          </div>
          <div className="pt-2 border-t border-gray-100 flex gap-2">
            {user ? (
              <>
                <Link to="/profile" className="btn-outline text-sm flex-1 text-center" onClick={() => setOpen(false)}>{t('nav.profile')}</Link>
                <button onClick={handleLogout} className="btn-ghost text-sm text-red-500 flex-1">{t('nav.logout')}</button>
              </>
            ) : (
              <>
                <Link to="/login" className="btn-outline text-sm flex-1 text-center" onClick={() => setOpen(false)}>{t('nav.login')}</Link>
                <Link to="/register" className="btn-primary text-sm flex-1 text-center" onClick={() => setOpen(false)}>{t('nav.joinNow')}</Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
