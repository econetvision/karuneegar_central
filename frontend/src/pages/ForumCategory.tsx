import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Plus, MessageSquare, Eye, Clock, ChevronLeft } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import api from '../api/client';
import { useAuth } from '../contexts/AuthContext';

interface Thread {
  id: number;
  title: string;
  body: string;
  author_username: string;
  author_name: string;
  created_at: string;
  views: number;
  reply_count: number;
}

interface Category {
  id: number;
  name: string;
  description: string;
}

export default function ForumCategory() {
  const { catId } = useParams<{ catId: string }>();
  const { user } = useAuth();
  const { t } = useTranslation();
  const [category, setCategory] = useState<Category | null>(null);
  const [threads, setThreads] = useState<Thread[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newBody, setNewBody] = useState('');
  const [posting, setPosting] = useState(false);

  useEffect(() => {
    api.get(`/forums/categories/${catId}/threads`)
      .then((r) => {
        setCategory(r.data.category);
        setThreads(r.data.threads);
      })
      .finally(() => setLoading(false));
  }, [catId]);

  const handlePost = async () => {
    if (!newTitle.trim() || !newBody.trim()) return;
    setPosting(true);
    try {
      const r = await api.post(`/forums/categories/${catId}/threads`, { title: newTitle, body: newBody });
      setThreads((prev) => [r.data.thread, ...prev]);
      setShowForm(false);
      setNewTitle('');
      setNewBody('');
    } finally {
      setPosting(false);
    }
  };

  const timeAgo = (iso: string) => {
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <Link to="/forums" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-saffron-600 mb-6">
        <ChevronLeft size={16} /> {t('forums.backToForums')}
      </Link>

      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="section-title">{category?.name || t('forums.title')}</h1>
          <p className="text-gray-500 mt-1">{category?.description}</p>
        </div>
        {user && (
          <button
            onClick={() => setShowForm(!showForm)}
            className="btn-primary flex items-center gap-2"
          >
            <Plus size={16} /> {t('forums.newThread')}
          </button>
        )}
      </div>

      {showForm && (
        <div className="card p-6 mb-6">
          <h3 className="font-semibold text-gray-800 mb-4">{t('forums.startDiscussion')}</h3>
          <div className="space-y-3">
            <input
              className="input"
              placeholder={t('forums.threadTitlePlaceholder')}
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
            />
            <textarea
              className="input min-h-[100px] resize-none"
              placeholder={t('forums.threadBodyPlaceholder')}
              value={newBody}
              onChange={(e) => setNewBody(e.target.value)}
            />
            <div className="flex gap-2">
              <button onClick={handlePost} disabled={posting || !newTitle || !newBody} className="btn-primary">
                {posting ? t('common.posting') : t('common.post')}
              </button>
              <button onClick={() => setShowForm(false)} className="btn-outline">{t('common.cancel')}</button>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-4 border-saffron-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : threads.length === 0 ? (
        <div className="card p-12 text-center">
          <MessageSquare size={40} className="text-gray-300 mx-auto mb-3" />
          <h3 className="font-semibold text-gray-600 mb-1">{t('forums.noThreads')}</h3>
          <p className="text-gray-400 text-sm">{t('forums.noThreadsDesc')}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {threads.map((thread) => (
            <Link key={thread.id} to={`/forums/thread/${thread.id}`} className="card flex gap-4 p-5 group">
              <div className="w-10 h-10 rounded-xl bg-saffron-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                <MessageSquare size={18} className="text-saffron-600" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-gray-900 group-hover:text-saffron-700 transition-colors leading-snug">
                  {thread.title}
                </h3>
                <p className="text-sm text-gray-500 mt-0.5 truncate">{thread.body.substring(0, 100)}</p>
                <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                  <span>{t('common.by')} <span className="font-medium text-gray-600">{thread.author_name || thread.author_username}</span></span>
                  <span className="flex items-center gap-1"><Clock size={11} /> {timeAgo(thread.created_at)}</span>
                  <span className="flex items-center gap-1"><Eye size={11} /> {thread.views}</span>
                  <span className="flex items-center gap-1"><MessageSquare size={11} /> {thread.reply_count}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
