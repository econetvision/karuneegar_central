import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Search, Users, MapPin, Briefcase, User, Star, Award,
  Plus, Trash2, X, Shield, Eye, EyeOff,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import api, { uploadUrl } from '../api/client';
import { useAuth } from '../contexts/AuthContext';

interface Member {
  id: number;
  username: string;
  email?: string;
  member_id: string | null;
  is_admin?: boolean;
  created_at?: string;
  profile?: {
    full_name?: string;
    location?: string;
    occupation?: string;
    native_place?: string;
    gothram?: string;
    photo_filename?: string;
    achievements?: string;
    is_prominent?: boolean;
    is_public?: boolean;
  };
}

const EMPTY_FORM = { username: '', email: '', password: '', full_name: '', member_id: '' };

export default function Members() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const isAdmin = !!user?.is_admin;

  // Public members state
  const [members, setMembers] = useState<Member[]>([]);
  const [prominent, setProminent] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Admin state
  const [adminMembers, setAdminMembers] = useState<Member[]>([]);
  const [adminLoading, setAdminLoading] = useState(false);
  const [adminSearch, setAdminSearch] = useState('');
  const [adminDebouncedSearch, setAdminDebouncedSearch] = useState('');
  const [adminTotal, setAdminTotal] = useState(0);
  const [showAddForm, setShowAddForm] = useState(false);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [showPwd, setShowPwd] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [deletingId, setDeletingId] = useState<number | null>(null);

  // Public members
  useEffect(() => {
    api.get('/members', { params: { prominent: '1' } })
      .then((r) => setProminent(r.data.members));
  }, []);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    setLoading(true);
    api.get('/members', { params: debouncedSearch ? { q: debouncedSearch } : {} })
      .then((r) => setMembers(r.data.members))
      .finally(() => setLoading(false));
  }, [debouncedSearch]);

  // Admin members
  const fetchAdminMembers = (q = adminDebouncedSearch) => {
    if (!isAdmin) return;
    setAdminLoading(true);
    api.get('/admin/members', { params: q ? { q } : {} })
      .then((r) => { setAdminMembers(r.data.members); setAdminTotal(r.data.total); })
      .catch(() => {})
      .finally(() => setAdminLoading(false));
  };

  useEffect(() => {
    if (isAdmin) fetchAdminMembers('');
  }, [isAdmin]);

  useEffect(() => {
    const t = setTimeout(() => setAdminDebouncedSearch(adminSearch), 400);
    return () => clearTimeout(t);
  }, [adminSearch]);

  useEffect(() => {
    if (isAdmin) fetchAdminMembers(adminDebouncedSearch);
  }, [adminDebouncedSearch]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.username.trim() || !form.email.trim() || !form.password.trim()) {
      setFormError('Username, email and password are required.');
      return;
    }
    setSaving(true);
    setFormError('');
    try {
      await api.post('/admin/members', form);
      setShowAddForm(false);
      setForm({ ...EMPTY_FORM });
      fetchAdminMembers();
    } catch (err: any) {
      setFormError(err.response?.data?.error || 'Failed to create member.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (uid: number, name: string) => {
    if (!window.confirm(`Delete account for "${name}"? This cannot be undone.`)) return;
    setDeletingId(uid);
    try {
      await api.delete(`/admin/members/${uid}`);
      setAdminMembers((prev) => prev.filter((m) => m.id !== uid));
      setAdminTotal((n) => n - 1);
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to delete.');
    } finally {
      setDeletingId(null);
    }
  };

  const fmtDate = (d?: string) => {
    if (!d) return '';
    try { return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }); } catch { return d; }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-10">

      {/* ─── Admin Panel ──────────────────────────────────────────────── */}
      {isAdmin && (
        <section className="mb-12">
          <div className="flex items-center justify-between mb-5 gap-4">
            <div className="flex items-center gap-2">
              <Shield size={22} className="text-saffron-600" />
              <h2 className="font-display font-bold text-xl text-gray-900">Admin — All Members</h2>
              <span className="bg-saffron-100 text-saffron-700 text-xs font-bold px-2 py-0.5 rounded-full">{adminTotal}</span>
            </div>
            <button
              onClick={() => { setShowAddForm(true); setFormError(''); setForm({ ...EMPTY_FORM }); }}
              className="btn-primary flex items-center gap-2"
            >
              <Plus size={16} /> Add Member
            </button>
          </div>

          <div className="relative mb-4">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by username, email or member ID…"
              className="input pl-10 max-w-md"
              value={adminSearch}
              onChange={(e) => setAdminSearch(e.target.value)}
            />
          </div>

          {adminLoading ? (
            <div className="flex justify-center py-12">
              <div className="w-7 h-7 border-4 border-saffron-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <div className="card overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="text-left px-4 py-3 font-semibold text-gray-600">Member</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-600 hidden md:table-cell">Email</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-600 hidden sm:table-cell">ID</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-600 hidden lg:table-cell">Joined</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-600 hidden sm:table-cell">Visibility</th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {adminMembers.map((m) => {
                    const name = m.profile?.full_name || m.username;
                    const photo = m.profile?.photo_filename ? uploadUrl(m.profile.photo_filename) : null;
                    return (
                      <tr key={m.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-saffron-100 flex-shrink-0 overflow-hidden flex items-center justify-center">
                              {photo
                                ? <img src={photo} alt={name} className="w-full h-full object-cover" />
                                : <User size={16} className="text-saffron-500" />}
                            </div>
                            <div>
                              <p className="font-semibold text-gray-900 leading-tight">{name}</p>
                              <p className="text-xs text-gray-400">@{m.username}</p>
                            </div>
                            {m.is_admin && (
                              <span className="text-xs bg-saffron-100 text-saffron-700 font-bold px-1.5 py-0.5 rounded">Admin</span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-gray-500 hidden md:table-cell">{m.email}</td>
                        <td className="px-4 py-3 hidden sm:table-cell">
                          {m.member_id
                            ? <span className="text-xs bg-blue-50 text-blue-700 font-semibold px-2 py-0.5 rounded-full">{m.member_id}</span>
                            : <span className="text-xs text-gray-300">—</span>}
                        </td>
                        <td className="px-4 py-3 text-gray-400 text-xs hidden lg:table-cell">{fmtDate(m.created_at)}</td>
                        <td className="px-4 py-3 hidden sm:table-cell">
                          {m.profile?.is_public === true
                            ? <span className="flex items-center gap-1 text-xs text-green-600"><Eye size={12} /> Public</span>
                            : m.profile?.is_public === false
                              ? <span className="flex items-center gap-1 text-xs text-gray-400"><EyeOff size={12} /> Private</span>
                              : <span className="text-xs text-gray-300">—</span>}
                        </td>
                        <td className="px-4 py-3">
                          {m.id !== user?.id && (
                            <button
                              onClick={() => handleDelete(m.id, name)}
                              disabled={deletingId === m.id}
                              className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                              title="Delete member"
                            >
                              <Trash2 size={15} />
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                  {adminMembers.length === 0 && (
                    <tr><td colSpan={6} className="px-4 py-12 text-center text-gray-400">No members found.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {/* ─── Public Members ───────────────────────────────────────────── */}
      <div className="mb-8">
        <h1 className="section-title flex items-center gap-2 mb-2">
          <Users className="text-saffron-600" size={28} /> {t('members.title')}
        </h1>
        <p className="text-gray-500">{t('members.subtitle')}</p>
      </div>

      {prominent.length > 0 && (
        <section className="mb-10">
          <div className="flex items-center gap-2 mb-5">
            <Star size={20} className="text-amber-500 fill-amber-400" />
            <h2 className="font-display font-bold text-xl text-gray-900">{t('members.prominentTitle')}</h2>
            <span className="badge bg-amber-100 text-amber-700 ml-1">{t('members.prominentBadge')}</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {prominent.map((m) => (
              <Link
                key={m.id}
                to={`/u/${m.username}`}
                className="card group overflow-hidden flex gap-4 p-4 border-2 border-amber-100 hover:border-amber-300 transition-colors"
              >
                <div className="w-20 h-20 rounded-2xl bg-amber-50 border border-amber-200 flex-shrink-0 overflow-hidden flex items-center justify-center">
                  {m.profile?.photo_filename
                    ? <img src={uploadUrl(m.profile.photo_filename)} alt={m.profile.full_name || m.username} className="w-full h-full object-cover" />
                    : <User size={28} className="text-amber-400" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start gap-1.5">
                    <Award size={14} className="text-amber-500 mt-0.5 flex-shrink-0" />
                    <h3 className="font-semibold text-gray-900 group-hover:text-saffron-700 transition-colors leading-snug break-words">
                      {m.profile?.full_name || m.username}
                    </h3>
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">@{m.username}</p>
                  {m.profile?.occupation && <p className="flex items-center gap-1 text-xs text-gray-500 mt-1.5"><Briefcase size={10} /> {m.profile.occupation}</p>}
                  {m.profile?.location && <p className="flex items-center gap-1 text-xs text-gray-500 mt-0.5"><MapPin size={10} /> {m.profile.location}</p>}
                  {m.profile?.achievements && <p className="mt-1.5 text-xs text-amber-700 line-clamp-2 leading-relaxed">{m.profile.achievements}</p>}
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      <div className="relative mb-6">
        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
        <input type="text" placeholder={t('members.searchPlaceholder')} className="input pl-11 max-w-lg"
          value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-4 border-saffron-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : members.length === 0 ? (
        <div className="card p-16 text-center">
          <Users size={48} className="text-gray-200 mx-auto mb-4" />
          <p className="text-gray-500">{t('members.noMembers')}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {members.map((m) => (
            <Link key={m.id} to={`/u/${m.username}`} className="card p-5 group text-center">
              <div className="w-16 h-16 rounded-2xl bg-saffron-100 mx-auto mb-3 flex items-center justify-center overflow-hidden relative">
                {m.profile?.photo_filename
                  ? <img src={uploadUrl(m.profile.photo_filename)} alt={m.profile.full_name || m.username} className="w-full h-full object-cover" />
                  : <User size={26} className="text-saffron-400" />}
                {m.profile?.is_prominent && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-amber-400 rounded-full flex items-center justify-center">
                    <Star size={10} className="text-white fill-white" />
                  </span>
                )}
              </div>
              <h3 className="font-semibold text-gray-900 group-hover:text-saffron-700 transition-colors break-words leading-snug">
                {m.profile?.full_name || m.username}
              </h3>
              <p className="text-xs text-gray-400 mt-0.5 truncate">@{m.username}</p>
              {m.profile?.location && <p className="flex items-center justify-center gap-1 text-xs text-gray-500 mt-2"><MapPin size={10} /> {m.profile.location}</p>}
              {m.profile?.occupation && <p className="flex items-center justify-center gap-1 text-xs text-gray-500 mt-1"><Briefcase size={10} /> {m.profile.occupation}</p>}
              {m.profile?.gothram && <p className="mt-2 text-xs text-saffron-600 font-medium">{m.profile.gothram} Gothram</p>}
            </Link>
          ))}
        </div>
      )}

      {/* ─── Add Member Modal ─────────────────────────────────────────── */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h2 className="font-display font-bold text-lg text-gray-900 flex items-center gap-2">
                <Plus size={18} className="text-saffron-600" /> Add Member
              </h2>
              <button onClick={() => setShowAddForm(false)} className="p-1 rounded-lg hover:bg-gray-100"><X size={18} /></button>
            </div>
            <form onSubmit={handleAdd} className="p-5 space-y-4">
              {formError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm">{formError}</div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Username *</label>
                  <input className="input" placeholder="lowercase letters/digits" value={form.username}
                    onChange={(e) => setForm((f) => ({ ...f, username: e.target.value.toLowerCase() }))} />
                </div>
                <div>
                  <label className="label">Member ID</label>
                  <input className="input" placeholder="e.g. KN-0042" value={form.member_id}
                    onChange={(e) => setForm((f) => ({ ...f, member_id: e.target.value }))} />
                </div>
              </div>
              <div>
                <label className="label">Full Name</label>
                <input className="input" placeholder="e.g. Arjun Karuneegar" value={form.full_name}
                  onChange={(e) => setForm((f) => ({ ...f, full_name: e.target.value }))} />
              </div>
              <div>
                <label className="label">Email *</label>
                <input type="email" className="input" placeholder="member@example.com" value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} />
              </div>
              <div>
                <label className="label">Password *</label>
                <div className="relative">
                  <input type={showPwd ? 'text' : 'password'} className="input pr-10" placeholder="Temporary password"
                    value={form.password} onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))} />
                  <button type="button" onClick={() => setShowPwd((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              <div className="flex gap-3 pt-1">
                <button type="submit" disabled={saving} className="btn-primary flex-1">
                  {saving ? 'Creating…' : 'Create Account'}
                </button>
                <button type="button" onClick={() => setShowAddForm(false)} className="btn-outline">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
