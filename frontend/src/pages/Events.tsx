import { useEffect, useState, useRef, type ChangeEvent } from 'react';
import { Link } from 'react-router-dom';
import {
  Calendar, Phone, Plus, X, Upload, BadgeCheck,
  Heart, UserCheck, Video, ChevronRight,
} from 'lucide-react';
import api, { uploadUrl } from '../api/client';
import { useAuth } from '../contexts/AuthContext';

interface EventItem {
  id: number;
  title: string;
  description?: string;
  event_date?: string;
  contact_no?: string;
  donate_url?: string;
  register_url?: string;
  media_filename?: string;
  media_type?: string;
  show_on_home?: boolean;
  poster_username: string;
  poster_name?: string;
  created_at: string;
}

const EMPTY = {
  title: '', description: '', event_date: '',
  contact_no: '', donate_url: '', register_url: '',
  media_filename: '', media_type: 'photo', show_on_home: false,
};

export default function Events() {
  const { user } = useAuth();
  const [items, setItems] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ ...EMPTY });
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const fetchItems = () => {
    setLoading(true);
    api.get('/events')
      .then((r) => setItems(r.data.events))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchItems(); }, []);

  const set = (k: string) => (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleMediaUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const fd = new FormData();
    fd.append('file', file);
    try {
      const r = await api.post('/upload', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setForm((f) => ({ ...f, media_filename: r.data.filename, media_type: r.data.media_type || 'photo' }));
    } catch {
      setError('Media upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) { setError('Event name is required.'); return; }
    setSaving(true);
    setError('');
    try {
      await api.post('/events', form);
      setShowForm(false);
      setForm({ ...EMPTY });
      fetchItems();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to post event. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Remove this event?')) return;
    await api.delete(`/events/${id}`);
    setItems((prev) => prev.filter((e) => e.id !== id));
  };

  const fmtDate = (d?: string) => {
    if (!d) return null;
    try { return new Date(d).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }); } catch { return d; }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      {/* Header */}
      <div className="flex items-start justify-between mb-8 gap-4">
        <div>
          <h1 className="section-title flex items-center gap-2">
            <span className="text-2xl">🎉</span> Events
          </h1>
          <p className="text-gray-500 mt-1">Community events, gatherings and celebrations.</p>
        </div>
        {user && (
          <button onClick={() => { setShowForm(true); setError(''); setForm({ ...EMPTY }); }}
            className="btn-primary flex items-center gap-2 flex-shrink-0">
            <Plus size={16} /> Post Event
          </button>
        )}
      </div>

      {/* List */}
      {loading ? (
        <div className="flex justify-center py-24">
          <div className="w-8 h-8 border-4 border-saffron-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : items.length === 0 ? (
        <div className="card p-16 text-center">
          <div className="text-6xl mb-4">🎉</div>
          <h3 className="font-semibold text-gray-600 mb-2">No events posted yet</h3>
          <p className="text-gray-400 text-sm mb-6">Be the first to post a community event!</p>
          {user && (
            <button onClick={() => setShowForm(true)} className="btn-primary mx-auto">
              <Plus size={15} className="mr-1" /> Post an Event
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((ev) => {
            const mediaUrl = ev.media_filename ? uploadUrl(ev.media_filename) : null;
            return (
              <div key={ev.id} className="card overflow-hidden group flex flex-col">
                {/* Media */}
                {mediaUrl ? (
                  <div className="relative w-full h-44">
                    <img src={mediaUrl} alt={ev.title} className="w-full h-full object-cover" />
                    {ev.media_type === 'video' && (
                      <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                        <div className="w-12 h-12 rounded-full bg-white/80 flex items-center justify-center">
                          <Video size={22} className="text-gray-800 ml-1" />
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="w-full h-44 bg-gradient-to-br from-sky-100 to-blue-100 flex items-center justify-center">
                    <Calendar size={48} className="text-sky-400" />
                  </div>
                )}

                <div className="p-4 flex flex-col flex-1">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h3 className="font-display font-bold text-gray-900 leading-snug">{ev.title}</h3>
                    {user?.username === ev.poster_username && (
                      <button onClick={() => handleDelete(ev.id)}
                        className="p-1 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors flex-shrink-0">
                        <X size={15} />
                      </button>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-gray-500 mb-3">
                    {ev.event_date && (
                      <span className="flex items-center gap-1">
                        <Calendar size={12} className="text-saffron-500" /> {fmtDate(ev.event_date)}
                      </span>
                    )}
                    {ev.contact_no && (
                      <a href={`tel:${ev.contact_no}`} className="flex items-center gap-1 hover:text-saffron-600">
                        <Phone size={12} className="text-saffron-500" /> {ev.contact_no}
                      </a>
                    )}
                  </div>

                  {ev.description && (
                    <p className="text-sm text-gray-600 leading-relaxed line-clamp-2 mb-3">{ev.description}</p>
                  )}

                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {ev.donate_url && (
                      <span className="inline-flex items-center gap-1 text-xs bg-rose-50 text-rose-600 px-2 py-0.5 rounded-full font-medium">
                        <Heart size={10} /> Donate
                      </span>
                    )}
                    {ev.register_url && (
                      <span className="inline-flex items-center gap-1 text-xs bg-violet-50 text-violet-600 px-2 py-0.5 rounded-full font-medium">
                        <UserCheck size={10} /> Register
                      </span>
                    )}
                    {ev.show_on_home && (
                      <span className="inline-flex items-center gap-1 text-xs bg-amber-50 text-amber-600 px-2 py-0.5 rounded-full font-medium">
                        ⭐ Featured
                      </span>
                    )}
                  </div>

                  <div className="mt-auto pt-3 border-t border-gray-50 flex justify-between items-center">
                    <p className="text-xs text-gray-400">
                      By <span className="font-medium text-gray-600">{ev.poster_name || ev.poster_username}</span>
                    </p>
                    <Link to={`/events/${ev.id}`}
                      className="text-xs text-saffron-600 font-medium flex items-center gap-0.5 hover:underline">
                      Details <ChevronRight size={13} />
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-gray-100 sticky top-0 bg-white z-10">
              <h2 className="font-display font-bold text-lg text-gray-900 flex items-center gap-2">
                🎉 Post an Event
              </h2>
              <button onClick={() => setShowForm(false)} className="p-1 rounded-lg hover:bg-gray-100">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-5">
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm">{error}</div>
              )}

              {/* Media Upload */}
              <div>
                <label className="label flex items-center gap-1.5">
                  <Upload size={14} className="text-gray-400" /> Event Photo or Video
                </label>
                <label className={`flex items-center gap-3 border-2 border-dashed rounded-xl px-4 py-3 cursor-pointer transition-colors
                  ${form.media_filename ? 'border-green-300 bg-green-50' : 'border-gray-200 hover:border-saffron-300 bg-gray-50'}`}>
                  {form.media_filename ? (
                    <>
                      <BadgeCheck size={18} className="text-green-600 flex-shrink-0" />
                      <span className="text-sm text-green-700 truncate">
                        {form.media_type === 'video' ? '📹 Video uploaded' : '🖼️ Photo uploaded'}
                      </span>
                    </>
                  ) : (
                    <>
                      <Upload size={18} className="text-gray-400 flex-shrink-0" />
                      <span className="text-sm text-gray-500">
                        {uploading ? 'Uploading…' : 'Upload photo or video (JPG, PNG, MP4, MOV)'}
                      </span>
                    </>
                  )}
                  <input
                    ref={fileRef}
                    type="file"
                    accept=".jpg,.jpeg,.png,.webp,.mp4,.mov,.webm,.avi"
                    className="hidden"
                    onChange={handleMediaUpload}
                    disabled={uploading}
                  />
                </label>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="label">Event Name *</label>
                  <input className="input" placeholder="e.g. Annual Temple Festival 2026" value={form.title} onChange={set('title')} required />
                </div>
                <div>
                  <label className="label flex items-center gap-1"><Calendar size={13} className="text-gray-400" /> Event Date</label>
                  <input type="date" className="input" value={form.event_date} onChange={set('event_date')} />
                </div>
                <div>
                  <label className="label flex items-center gap-1"><Phone size={13} className="text-gray-400" /> Contact Number</label>
                  <input type="tel" className="input" placeholder="+919876543210" value={form.contact_no} onChange={set('contact_no')} />
                </div>
              </div>

              <div>
                <label className="label">Description</label>
                <textarea className="input min-h-[80px] resize-none"
                  placeholder="Event details, venue, programme, timings…"
                  value={form.description} onChange={set('description')} />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="label flex items-center gap-1"><Heart size={13} className="text-rose-400" /> Donation Link</label>
                  <input type="url" className="input" placeholder="https://…" value={form.donate_url} onChange={set('donate_url')} />
                </div>
                <div>
                  <label className="label flex items-center gap-1"><UserCheck size={13} className="text-violet-400" /> Registration Link</label>
                  <input type="url" className="input" placeholder="https://…" value={form.register_url} onChange={set('register_url')} />
                </div>
              </div>

              <label className="flex items-center gap-3 p-3 rounded-xl border border-gray-200 cursor-pointer hover:bg-amber-50 hover:border-amber-300 transition-colors">
                <input
                  type="checkbox"
                  checked={form.show_on_home}
                  onChange={(e) => setForm((f) => ({ ...f, show_on_home: e.target.checked }))}
                  className="w-4 h-4 accent-saffron-600"
                />
                <div>
                  <p className="text-sm font-semibold text-gray-800">⭐ Show on Home Page</p>
                  <p className="text-xs text-gray-500">Feature this event in the home page carousel</p>
                </div>
              </label>

              <div className="flex gap-3 pt-1">
                <button type="submit" disabled={saving || uploading} className="btn-primary flex-1">
                  {saving ? 'Publishing…' : 'Publish Event'}
                </button>
                <button type="button" onClick={() => setShowForm(false)} className="btn-outline">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
