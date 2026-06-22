import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  MapPin, Calendar, IndianRupee, Users, Phone,
  User, ArrowLeft, List,
} from 'lucide-react';
import api, { uploadUrl } from '../api/client';
import { useAuth } from '../contexts/AuthContext';

interface Pilgrimage {
  id: number;
  title: string;
  destination: string;
  description?: string;
  itinerary?: string;
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

export default function PilgrimageView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [trip, setTrip] = useState<Pilgrimage | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/pilgrimages/${id}`)
      .then((r) => setTrip(r.data.pilgrimage))
      .catch(() => navigate('/pilgrimages'))
      .finally(() => setLoading(false));
  }, [id, navigate]);

  const handleDelete = async () => {
    if (!trip || !window.confirm('Remove this pilgrimage post?')) return;
    await api.delete(`/pilgrimages/${trip.id}`);
    navigate('/pilgrimages');
  };

  const formatDateRange = (start?: string, end?: string) => {
    if (!start && !end) return null;
    const fmt = (d: string) =>
      new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
    if (start && end && start !== end) return `${fmt(start)} – ${fmt(end)}`;
    if (start) return fmt(start);
    return fmt(end!);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="w-8 h-8 border-4 border-saffron-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!trip) return null;

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <Link to="/pilgrimages" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-saffron-600 mb-6">
        <ArrowLeft size={15} /> All Pilgrimages
      </Link>

      {/* Photo */}
      {trip.photo_filename ? (
        <img
          src={uploadUrl(trip.photo_filename)}
          alt={trip.title}
          className="w-full max-h-80 object-cover rounded-2xl mb-6 shadow"
        />
      ) : (
        <div className="w-full h-48 bg-gradient-to-br from-saffron-100 to-amber-100 rounded-2xl flex items-center justify-center mb-6">
          <span className="text-7xl">🛕</span>
        </div>
      )}

      {/* Title & destination */}
      <h1 className="font-display font-bold text-3xl text-gray-900 mb-1">{trip.title}</h1>
      <p className="flex items-center gap-1.5 text-saffron-600 font-medium mb-4">
        <MapPin size={16} /> {trip.destination}
      </p>

      {/* Key info chips */}
      <div className="flex flex-wrap gap-3 mb-6">
        {(trip.start_date || trip.end_date) && (
          <div className="flex items-center gap-1.5 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl px-3 py-1.5 text-sm">
            <Calendar size={14} /> {formatDateRange(trip.start_date, trip.end_date)}
          </div>
        )}
        {trip.cost && (
          <div className="flex items-center gap-1.5 bg-green-50 border border-green-200 text-green-800 rounded-xl px-3 py-1.5 text-sm">
            <IndianRupee size={14} /> {trip.cost} per person
          </div>
        )}
        {trip.capacity && (
          <div className="flex items-center gap-1.5 bg-blue-50 border border-blue-200 text-blue-800 rounded-xl px-3 py-1.5 text-sm">
            <Users size={14} /> {trip.capacity} seats
          </div>
        )}
      </div>

      {/* Description */}
      {trip.description && (
        <div className="card p-5 mb-5">
          <h2 className="font-semibold text-gray-800 mb-2">About this Trip</h2>
          <p className="text-gray-600 leading-relaxed whitespace-pre-line">{trip.description}</p>
        </div>
      )}

      {/* Itinerary */}
      {trip.itinerary && (
        <div className="card p-5 mb-5">
          <h2 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
            <List size={16} className="text-saffron-500" /> Trip Itinerary
          </h2>
          <p className="text-gray-600 leading-relaxed whitespace-pre-line text-sm">{trip.itinerary}</p>
        </div>
      )}

      {/* Organizer contact */}
      {(trip.organizer_name || trip.organizer_mobile) && (
        <div className="card p-5 mb-5 bg-saffron-50 border border-saffron-100">
          <h2 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
            <Phone size={16} className="text-saffron-500" /> Contact Organizer
          </h2>
          {trip.organizer_name && (
            <p className="flex items-center gap-2 text-gray-700 font-medium mb-1">
              <User size={14} className="text-gray-400" /> {trip.organizer_name}
            </p>
          )}
          {trip.organizer_mobile && (
            <a
              href={`tel:${trip.organizer_mobile}`}
              className="flex items-center gap-2 text-saffron-700 font-semibold hover:underline text-lg"
            >
              <Phone size={16} /> {trip.organizer_mobile}
            </a>
          )}
          {trip.organizer_mobile && (
            <a
              href={`https://wa.me/${trip.organizer_mobile.replace(/\D/g, '')}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 mt-3 bg-green-600 hover:bg-green-700 text-white text-sm font-medium px-4 py-2 rounded-xl transition-colors"
            >
              WhatsApp Organizer
            </a>
          )}
        </div>
      )}

      {/* Posted by */}
      <div className="flex items-center justify-between text-sm text-gray-400 mt-6">
        <span>
          Posted by <span className="font-medium text-gray-600">{trip.poster_name || trip.poster_username}</span>
          {' · '}
          {new Date(trip.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
        </span>
        {user?.username === trip.poster_username && (
          <button onClick={handleDelete} className="text-red-400 hover:text-red-600 font-medium">
            Delete
          </button>
        )}
      </div>
    </div>
  );
}
