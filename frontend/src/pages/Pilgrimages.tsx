import { useEffect, useState, type ChangeEvent } from 'react';
import { Link } from 'react-router-dom';
import {
  MapPin, Calendar, IndianRupee, Users, Phone,
  Plus, X, Upload, BadgeCheck, ChevronRight,
} from 'lucide-react';
import api, { uploadUrl } from '../api/client';
import { useAuth } from '../contexts/AuthContext';

interface PilgrimageItem {
  id: number;
  title: string;
  destination: string;
  description?: string;
  start_date?: string;
  end_date?: string;
  cost?: string;
  capacity?: number;
  organizer_name?: string;
  organizer_mobile?: string;
  photo_filename?: string;
  poster_username: string;
  poster_name?: string;
  created_at: string;
}

const EMPTY_FORM = {
  title: '',
  destination: '',
  description: '',
  itinerary: '',
  start_date: '',
  end_date: '',
  cost: '',
  capacity: '',
  organizer_name: '',
  organizer_mobile: '',
  photo_filename: '',
};

export default function Pilgrimages() {
  const { user } = useAuth();
  const [items, setItems] = useState<PilgrimageItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const fetchItems = () => {
    setLoading(true);
    api.get('/pilgrimages')
      .then((r) => setItems(r.data.pilgrimages))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchItems(); }, []);

  const set = (k: string) => (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const handlePhotoUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const fd = new FormData();
    fd.append('file', file);
    try {
      const r = await api.post('/upload', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setForm((f) => ({ ...f, photo_filename: r.data.filename }));
    } catch {
      setError('Photo upload failed.');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) { setError('Trip title is required.'); return; }
    if (!form.destination.trim()) { setError('Destination is required.'); return; }
    setSaving(true);
    setError('');
    try {
      await api.post('/pilgrimages', {
        ...form,
        capacity: form.capacity ? parseInt(form.capacity) : null,
      });
      setShowForm(false);
      setForm({ ...EMPTY_FORM });
      fetchItems();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to post trip. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Remove this pilgrimage post?')) return;
    await api.delete(`/pilgrimages/${id}`);
    setItems((prev) => prev.filter((p) => p.id !== id));
  };

  const formatDateRange = (start?: string, end?: string) => {
    if (!start && !end) return null;
    const fmt = (d: string) => new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
    if (start && end && start !== end) return `${fmt(start)} – ${fmt(end)}`;
    if (start) return fmt(start);
    return fmt(end!);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      {/* Header */}
      <div className="flex items-start justify-between mb-8 gap-4">
        <div>
          <h1 className="section-title flex items-center gap-2">
            <span className="text-2xl">🛕</span> Pilgrimages
          </h1>
          <p className="text-gray-500 mt-1">Bhakti trips and group pilgrimages organised by community members.</p>
        </div>
        {user && (
          <button onClick={() => { setShowForm(true); setError(''); setForm({ ...EMPTY_FORM }); }}
            className="btn-primary flex items-center gap-2 flex-shrink-0">
            <Plus size={16} /> Post a Trip
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
          <div className="text-6xl mb-4">🛕</div>
          <h3 className="font-semibold text-gray-600 mb-2">No pilgrimages posted yet</h3>
          <p className="text-gray-400 text-sm mb-6">Be the first to organise a community bhakti trip!</p>
          {user && (
            <button onClick={() => setShowForm(true)} className="btn-primary mx-auto">
              <Plus size={15} className="mr-1" /> Post a Trip
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((trip) => (
            <div key={trip.id} className="card overflow-hidden group flex flex-col">
              {/* Photo */}
              {trip.photo_filename ? (
                <img
                  src={uploadUrl(trip.photo_filename)}
                  alt={trip.title}
                  className="w-full h-44 object-cover"
                />
              ) : (
                <div className="w-full h-44 bg-gradient-to-br from-saffron-100 to-amber-100 flex items-center justify-center">
                  <span className="text-5xl">🛕</span>
                </div>
              )}

              <div className="p-4 flex flex-col flex-1">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h3 className="font-display font-bold text-gray-900 leading-snug">{trip.title}</h3>
                  {user?.username === trip.poster_username && (
                    <button onClick={() => handleDelete(trip.id)}
                      className="p-1 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors flex-shrink-0">
                      <X size={15} />
                    </button>
                  )}
                </div>

                <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-gray-500 mb-3">
                  <span className="flex items-center gap-1">
                    <MapPin size={12} className="text-saffron-500" /> {trip.destination}
                  </span>
                  {(trip.start_date || trip.end_date) && (
                    <span className="flex items-center gap-1">
                      <Calendar size={12} className="text-saffron-500" />
                      {formatDateRange(trip.start_date, trip.end_date)}
                    </span>
                  )}
                  {trip.cost && (
                    <span className="flex items-center gap-1">
                      <IndianRupee size={12} className="text-saffron-500" /> {trip.cost}
                    </span>
                  )}
                  {trip.capacity && (
                    <span className="flex items-center gap-1">
                      <Users size={12} className="text-saffron-500" /> {trip.capacity} seats
                    </span>
                  )}
                </div>

                {trip.description && (
                  <p className="text-sm text-gray-600 leading-relaxed line-clamp-2 mb-3">{trip.description}</p>
                )}

                {(trip.organizer_name || trip.organizer_mobile) && (
                  <div className="mt-auto pt-3 border-t border-gray-50 flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                      {trip.organizer_name && (
                        <p className="text-xs font-semibold text-gray-700 truncate">{trip.organizer_name}</p>
                      )}
                      {trip.organizer_mobile && (
                        <a href={`tel:${trip.organizer_mobile}`}
                          className="flex items-center gap-1 text-xs text-saffron-600 hover:underline">
                          <Phone size={10} /> {trip.organizer_mobile}
                        </a>
                      )}
                    </div>
                    <Link to={`/pilgrimages/${trip.id}`}
                      className="text-xs text-saffron-600 font-medium flex items-center gap-0.5 hover:underline flex-shrink-0">
                      Details <ChevronRight size={13} />
                    </Link>
                  </div>
                )}

                {!trip.organizer_name && !trip.organizer_mobile && (
                  <div className="mt-auto pt-3 border-t border-gray-50 flex justify-between items-center">
                    <p className="text-xs text-gray-400">
                      By <span className="font-medium text-gray-600">{trip.poster_name || trip.poster_username}</span>
                    </p>
                    <Link to={`/pilgrimages/${trip.id}`}
                      className="text-xs text-saffron-600 font-medium flex items-center gap-0.5 hover:underline">
                      Details <ChevronRight size={13} />
                    </Link>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Create Trip Modal ───────────────────────────────────────────────────── */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-gray-100 sticky top-0 bg-white z-10">
              <h2 className="font-display font-bold text-lg text-gray-900 flex items-center gap-2">
                🛕 Post a Pilgrimage Trip
              </h2>
              <button onClick={() => setShowForm(false)} className="p-1 rounded-lg hover:bg-gray-100">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-5">
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm">{error}</div>
              )}

              {/* Trip Photo */}
              <div>
                <label className="label flex items-center gap-1.5"><Upload size={14} className="text-gray-400" /> Trip Photo / Poster</label>
                <label className={`flex items-center gap-3 border-2 border-dashed rounded-xl px-4 py-3 cursor-pointer transition-colors
                  ${form.photo_filename ? 'border-green-300 bg-green-50' : 'border-gray-200 hover:border-saffron-300 bg-gray-50'}`}>
                  {form.photo_filename ? (
                    <>
                      <BadgeCheck size={18} className="text-green-600 flex-shrink-0" />
                      <span className="text-sm text-green-700 truncate">{form.photo_filename.split('/').pop()}</span>
                    </>
                  ) : (
                    <>
                      <Upload size={18} className="text-gray-400 flex-shrink-0" />
                      <span className="text-sm text-gray-500">{uploading ? 'Uploading…' : 'Upload trip photo or poster (JPG / PNG)'}</span>
                    </>
                  )}
                  <input type="file" accept=".jpg,.jpeg,.png,.webp" className="hidden" onChange={handlePhotoUpload} disabled={uploading} />
                </label>
              </div>

              {/* Basic Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="label">Trip Title *</label>
                  <input className="input" placeholder="e.g. Tirupati Darshan 2026" value={form.title} onChange={set('title')} required />
                </div>
                <div className="sm:col-span-2">
                  <label className="label flex items-center gap-1"><MapPin size={13} className="text-gray-400" /> Destination *</label>
                  <input className="input" placeholder="e.g. Tirupati, Rameswaram, Varanasi" value={form.destination} onChange={set('destination')} required />
                </div>
                <div>
                  <label className="label flex items-center gap-1"><Calendar size={13} className="text-gray-400" /> Start Date</label>
                  <input type="date" className="input" value={form.start_date} onChange={set('start_date')} />
                </div>
                <div>
                  <label className="label flex items-center gap-1"><Calendar size={13} className="text-gray-400" /> End Date</label>
                  <input type="date" className="input" value={form.end_date} onChange={set('end_date')} />
                </div>
                <div>
                  <label className="label flex items-center gap-1"><IndianRupee size={13} className="text-gray-400" /> Cost per Person</label>
                  <input className="input" placeholder="e.g. ₹5,000" value={form.cost} onChange={set('cost')} />
                </div>
                <div>
                  <label className="label flex items-center gap-1"><Users size={13} className="text-gray-400" /> Total Seats</label>
                  <input type="number" min="1" className="input" placeholder="e.g. 40" value={form.capacity} onChange={set('capacity')} />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="label">Description</label>
                <textarea className="input min-h-[80px] resize-none"
                  placeholder="Brief overview of the trip — temples to visit, transport, accommodation…"
                  value={form.description} onChange={set('description')} />
              </div>

              {/* Itinerary */}
              <div>
                <label className="label">Day-wise Itinerary</label>
                <textarea className="input min-h-[100px] resize-none"
                  placeholder={`Day 1: Depart Chennai — arrive Tirupati\nDay 2: Balaji darshan, Padmavathi temple\nDay 3: Return journey`}
                  value={form.itinerary} onChange={set('itinerary')} />
              </div>

              {/* Organizer */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="label">Organizer Name</label>
                  <input className="input" placeholder="Contact person's name" value={form.organizer_name} onChange={set('organizer_name')} />
                </div>
                <div>
                  <label className="label flex items-center gap-1"><Phone size={13} className="text-gray-400" /> Organizer Mobile</label>
                  <input type="tel" className="input" placeholder="+919876543210" value={form.organizer_mobile} onChange={set('organizer_mobile')} />
                </div>
              </div>

              <div className="flex gap-3 pt-1">
                <button type="submit" disabled={saving || uploading} className="btn-primary flex-1">
                  {saving ? 'Posting…' : 'Post Trip'}
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
