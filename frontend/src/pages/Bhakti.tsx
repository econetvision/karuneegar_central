import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ExternalLink, X, Play } from 'lucide-react';
import api from '../api/client';

interface Video {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  published_at: string;
}

export default function Bhakti() {
  const { t } = useTranslation();
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [configured, setConfigured] = useState(true);
  const [active, setActive] = useState<Video | null>(null);

  useEffect(() => {
    api.get('/bhakti')
      .then(r => {
        setVideos(r.data.videos || []);
        setConfigured(r.data.configured !== false);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const fmtDate = (d: string) => {
    try {
      return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
    } catch { return ''; }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-br from-violet-700 via-purple-700 to-indigo-800 text-white py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm rounded-full px-4 py-1.5 text-sm font-medium mb-4">
            <span className="text-yellow-300 text-base">★</span>
            {t('bhakti.source')}
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-3">{t('bhakti.title')}</h1>
          <p className="text-violet-200 text-lg">{t('bhakti.subtitle')}</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-10">
        {loading && (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-4 border-violet-600 border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {!loading && !configured && (
          <div className="text-center py-20">
            <p className="text-lg font-semibold text-gray-700">{t('bhakti.notConfigured')}</p>
            <p className="text-sm text-gray-500 mt-1">{t('bhakti.notConfiguredDesc')}</p>
          </div>
        )}

        {!loading && configured && videos.length === 0 && (
          <div className="text-center py-20">
            <p className="text-lg font-semibold text-gray-700">{t('bhakti.noVideos')}</p>
            <p className="text-sm text-gray-500 mt-1">{t('bhakti.noVideosDesc')}</p>
          </div>
        )}

        {!loading && videos.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {videos.map((v) => (
              <div
                key={v.id}
                className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-md transition-shadow cursor-pointer group"
                onClick={() => setActive(v)}
              >
                <div className="relative aspect-video bg-indigo-950">
                  {v.thumbnail && (
                    <img src={v.thumbnail} alt={v.title} className="w-full h-full object-cover" />
                  )}
                  <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="w-14 h-14 bg-white/90 rounded-full flex items-center justify-center shadow-lg">
                      <Play size={24} className="text-violet-700 ml-1" fill="currentColor" />
                    </div>
                  </div>
                </div>
                <div className="p-4">
                  <p className="text-xs text-violet-600 font-semibold mb-1.5">{fmtDate(v.published_at)}</p>
                  <h3 className="font-semibold text-gray-900 line-clamp-2 leading-snug mb-1.5">{v.title}</h3>
                  {v.description && (
                    <p className="text-sm text-gray-500 line-clamp-2 leading-relaxed">{v.description}</p>
                  )}
                  <span className="inline-block mt-3 text-sm font-semibold text-violet-600 hover:text-violet-800">
                    {t('bhakti.watchNow')} →
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Video modal */}
      {active && (
        <div
          className="fixed inset-0 bg-black/75 z-50 flex items-center justify-center p-4"
          onClick={() => setActive(null)}
        >
          <div
            className="bg-white rounded-2xl overflow-hidden w-full max-w-3xl shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="aspect-video">
              <iframe
                src={`https://www.youtube.com/embed/${active.id}?autoplay=1`}
                title={active.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="w-full h-full"
              />
            </div>
            <div className="p-4 flex items-start justify-between gap-4">
              <div className="min-w-0">
                <h3 className="font-semibold text-gray-900 truncate">{active.title}</h3>
                <p className="text-sm text-gray-500 mt-0.5">{fmtDate(active.published_at)}</p>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <a
                  href={`https://www.youtube.com/watch?v=${active.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-sm font-semibold text-violet-600 hover:text-violet-800"
                >
                  <ExternalLink size={14} />
                  {t('bhakti.watchOnYoutube')}
                </a>
                <button onClick={() => setActive(null)} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
                  <X size={18} className="text-gray-500" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
