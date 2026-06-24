import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Bell, BellOff, ArrowLeft, Calendar } from 'lucide-react';
import api from '../api/client';
import { useAuth } from '../contexts/AuthContext';

interface NotificationItem {
  id: number;
  title: string;
  body?: string;
  event_id?: number;
  read: boolean;
  created_at: string;
}

export default function Notifications() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [subscribed, setSubscribed] = useState(false);
  const [subLoading, setSubLoading] = useState(false);

  useEffect(() => {
    if (!user) return;
    Promise.all([
      api.get('/notifications').then((r) => setItems(r.data.notifications || [])),
      api.get('/events/subscription').then((r) => setSubscribed(r.data.subscribed)),
    ])
      .catch(() => {})
      .finally(() => setLoading(false));

    // mark all read after brief delay so user sees the notifications first
    const t = setTimeout(() => {
      api.put('/notifications/read-all').catch(() => {});
    }, 1500);
    return () => clearTimeout(t);
  }, [user]);

  const toggleSub = async () => {
    setSubLoading(true);
    try {
      if (subscribed) {
        await api.delete('/events/subscribe');
        setSubscribed(false);
      } else {
        await api.post('/events/subscribe');
        setSubscribed(true);
      }
    } finally {
      setSubLoading(false);
    }
  };

  const fmtDate = (d: string) => {
    try {
      return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    } catch { return d; }
  };

  if (!user) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <p className="text-gray-400">Please log in to view notifications.</p>
        <Link to="/login" className="btn-primary mt-4 inline-block">Log In</Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <button onClick={() => navigate(-1)} className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-saffron-600 mb-6">
        <ArrowLeft size={16} /> Back
      </button>

      <div className="flex items-center justify-between mb-6 gap-4">
        <h1 className="font-display font-bold text-2xl text-gray-900 flex items-center gap-2">
          <Bell size={22} className="text-saffron-600" /> Notifications
        </h1>
        <button
          onClick={toggleSub}
          disabled={subLoading}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-semibold transition-colors ${
            subscribed
              ? 'bg-saffron-50 border-saffron-300 text-saffron-700 hover:bg-saffron-100'
              : 'bg-white border-gray-200 text-gray-600 hover:border-saffron-300 hover:text-saffron-600'
          }`}
        >
          {subscribed
            ? <><Bell size={14} className="fill-saffron-500 text-saffron-500" /> Subscribed to Events</>
            : <><BellOff size={14} /> Subscribe to Events</>}
        </button>
      </div>

      {!subscribed && !loading && (
        <div className="mb-6 p-4 rounded-xl bg-amber-50 border border-amber-200 flex items-start gap-3">
          <Bell size={18} className="text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-amber-800">Stay in the loop!</p>
            <p className="text-xs text-amber-700 mt-0.5">
              Subscribe above to receive notifications whenever a new community event is posted.
            </p>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-24">
          <div className="w-8 h-8 border-4 border-saffron-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : items.length === 0 ? (
        <div className="card p-16 text-center">
          <Bell size={40} className="text-gray-200 mx-auto mb-4" />
          <p className="text-gray-500 font-medium">No notifications yet</p>
          <p className="text-gray-400 text-sm mt-1">
            {subscribed ? 'You\'ll be notified when new events are posted.' : 'Subscribe to events to get notified.'}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((n) => (
            <div
              key={n.id}
              className={`card p-4 flex gap-3 transition-colors ${n.read ? 'opacity-70' : 'border-saffron-200 bg-saffron-50/30'}`}
            >
              <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${n.read ? 'bg-gray-300' : 'bg-saffron-500'}`} />
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900 text-sm">{n.title}</p>
                {n.body && <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{n.body}</p>}
                <div className="flex items-center gap-3 mt-2">
                  <span className="text-xs text-gray-400 flex items-center gap-1">
                    <Calendar size={11} /> {fmtDate(n.created_at)}
                  </span>
                  {n.event_id && (
                    <Link to={`/events/${n.event_id}`} className="text-xs text-saffron-600 font-medium hover:underline">
                      View Event →
                    </Link>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
