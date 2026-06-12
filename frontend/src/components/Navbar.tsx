import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { Menu, X, User, LogOut, ChevronDown } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { LogoIcon } from './KarunegarLogo';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [dropOpen, setDropOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const navLinks = [
    { to: '/', label: 'Home' },
    { to: '/members', label: 'Members' },
    { to: '/family-tree', label: 'Family Tree' },
    { to: '/forums', label: 'Forums' },
    { to: '/businesses', label: 'Businesses' },
    { to: '/matrimony', label: 'Matrimony' },
    { to: '/scholarships', label: 'Scholarships' },
    { to: '/about', label: 'About' },
  ];

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

          {/* Auth */}
          <div className="hidden md:flex items-center gap-2">
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
                      <User size={15} /> My Profile
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50"
                    >
                      <LogOut size={15} /> Logout
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <>
                <Link to="/login" className="btn-ghost text-sm">Login</Link>
                <Link to="/register" className="btn-primary text-sm">Join Now</Link>
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
          <div className="pt-2 border-t border-gray-100 flex gap-2">
            {user ? (
              <>
                <Link to="/profile" className="btn-outline text-sm flex-1 text-center" onClick={() => setOpen(false)}>Profile</Link>
                <button onClick={handleLogout} className="btn-ghost text-sm text-red-500 flex-1">Logout</button>
              </>
            ) : (
              <>
                <Link to="/login" className="btn-outline text-sm flex-1 text-center" onClick={() => setOpen(false)}>Login</Link>
                <Link to="/register" className="btn-primary text-sm flex-1 text-center" onClick={() => setOpen(false)}>Join</Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
