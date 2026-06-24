import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Calendar, Phone, Heart, UserCheck, ArrowLeft, Trash2, ExternalLink } from 'lucide-react';
import api, { uploadUrl } from '../api/client';
import { useAuth } from '../contexts/AuthContext';

export default function EventView() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [event, setEvent] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/events/${id}`)
      .then((r) => setEvent(r.data.event))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return (
    <div className="flex justify-center py-32">
      <div className="w-8 h-8 border-4 border-saffron-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!event) return (
    <div className="max-w-2xl mx-auto px-4 py-20 text-center">
      <p className="text-gray-400 text-lg">Event not found.</p>
      <Link to="/events" className="btn-primary mt-4 inline-block">Back to Events</Link>
    </div>
  );

  const isOwn = user?.username === event.poster_username;
  const mediaUrl = event.media_filename ? uploadUrl(event.media_filename) : null;
  const isVideo = event.media_type === 'video';

  const fmtDate = (d?: string) => {
    if (!d) return null;
    try { return new Date(d).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }); } catch { return d; }
  };

  const handleDelete = async () => {
    if (!window.confirm('Delete this event permanently?')) return;
    await api.delete(`/events/${id}`);
    navigate('/events');
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <Link to="/events" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-saffron-600 mb-6">
        <ArrowLeft size={16} /> Back to Events
      </Link>

      <div className="card overflow-hidden">
        {/* Media */}
        {mediaUrl && (
          isVideo ? (
            <video src={mediaUrl} controls className="w-full max-h-[420px] object-cover bg-black" />
          ) : (
            <img src={mediaUrl} alt={event.title} className="w-full max-h-[420px] object-cover" />
          )
        )}
        {!mediaUrl && (
          <div className="w-full h-48 bg-gradient-to-br from-sky-100 to-blue-100 flex items-center justify-center">
            <span className="text-6xl">🎉</span>
          </div>
        )}

        <div className="p-6 md:p-8">
          <div className="flex items-start justify-between gap-4 mb-4">
            <h1 className="font-display font-bold text-2xl md:text-3xl text-gray-900">{event.title}</h1>
            {isOwn && (
              <button onClick={handleDelete}
                className="flex items-center gap-1.5 text-sm text-red-500 hover:bg-red-50 border border-red-200 rounded-lg px-3 py-1.5 transition-colors flex-shrink-0">
                <Trash2 size={14} /> Delete
              </button>
            )}
          </div>

          <div className="flex flex-wrap gap-3 mb-6">
            {event.event_date && (
              <span className="inline-flex items-center gap-1.5 bg-saffron-50 text-saffron-700 text-sm font-medium px-3 py-1.5 rounded-full">
                <Calendar size={14} /> {fmtDate(event.event_date)}
              </span>
            )}
            {event.show_on_home && (
              <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-700 text-sm font-medium px-3 py-1.5 rounded-full">
                ⭐ Featured
              </span>
            )}
          </div>

          <p className="text-xs text-gray-400 mb-6">
            Posted by <span className="font-medium text-gray-600">{event.poster_name || event.poster_username}</span>
          </p>

          {event.description && (
            <div className="prose prose-sm max-w-none text-gray-700 leading-relaxed mb-6">
              <h3 className="font-semibold text-gray-900 mb-2">About this Event</h3>
              <p className="whitespace-pre-line">{event.description}</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-3">
            {event.contact_no && (
              <a href={`tel:${event.contact_no}`}
                className="inline-flex items-center gap-2 bg-saffron-600 text-white font-semibold px-5 py-2.5 rounded-xl hover:bg-saffron-700 transition-colors">
                <Phone size={16} /> Call Organiser
              </a>
            )}
            {event.contact_no && (
              <a href={`https://wa.me/${event.contact_no.replace(/\D/g, '')}`} target="_blank" rel="noreferrer"
                className="inline-flex items-center gap-2 bg-green-600 text-white font-semibold px-5 py-2.5 rounded-xl hover:bg-green-700 transition-colors">
                <ExternalLink size={16} /> WhatsApp
              </a>
            )}
            {event.donate_url && (
              <a href={event.donate_url} target="_blank" rel="noreferrer"
                className="inline-flex items-center gap-2 bg-rose-600 text-white font-semibold px-5 py-2.5 rounded-xl hover:bg-rose-700 transition-colors">
                <Heart size={16} /> Donate
              </a>
            )}
            {event.register_url && (
              <a href={event.register_url} target="_blank" rel="noreferrer"
                className="inline-flex items-center gap-2 bg-violet-600 text-white font-semibold px-5 py-2.5 rounded-xl hover:bg-violet-700 transition-colors">
                <UserCheck size={16} /> Register
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
