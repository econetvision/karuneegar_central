import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ChevronLeft, Send, User, Clock } from 'lucide-react';
import api from '../api/client';
import { useAuth } from '../contexts/AuthContext';

interface Reply {
  id: number;
  body: string;
  author_username: string;
  author_name: string;
  created_at: string;
}

interface Thread {
  id: number;
  title: string;
  body: string;
  author_username: string;
  author_name: string;
  created_at: string;
  views: number;
  reply_count: number;
  replies: Reply[];
  category_id: number;
}

export default function ForumThread() {
  const { threadId } = useParams<{ threadId: string }>();
  const { user } = useAuth();
  const [thread, setThread] = useState<Thread | null>(null);
  const [loading, setLoading] = useState(true);
  const [replyBody, setReplyBody] = useState('');
  const [posting, setPosting] = useState(false);

  useEffect(() => {
    api.get(`/forums/threads/${threadId}`)
      .then((r) => setThread(r.data.thread))
      .finally(() => setLoading(false));
  }, [threadId]);

  const handleReply = async () => {
    if (!replyBody.trim()) return;
    setPosting(true);
    try {
      const r = await api.post(`/forums/threads/${threadId}/replies`, { body: replyBody });
      setThread((prev) => prev ? { ...prev, replies: [...prev.replies, r.data.reply] } : prev);
      setReplyBody('');
    } finally {
      setPosting(false);
    }
  };

  const timeAgo = (iso: string) => {
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <div className="w-8 h-8 border-4 border-saffron-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!thread) return <div className="text-center py-20 text-gray-500">Thread not found.</div>;

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <Link to={`/forums/${thread.category_id}`} className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-saffron-600 mb-6">
        <ChevronLeft size={16} /> Back to Forum
      </Link>

      {/* OP */}
      <div className="card p-6 mb-6">
        <h1 className="font-display font-bold text-xl text-gray-900 mb-4">{thread.title}</h1>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-9 h-9 rounded-full bg-saffron-100 flex items-center justify-center">
            <User size={16} className="text-saffron-600" />
          </div>
          <div>
            <p className="font-medium text-sm text-gray-800">{thread.author_name || thread.author_username}</p>
            <p className="text-xs text-gray-400 flex items-center gap-1"><Clock size={10} /> {timeAgo(thread.created_at)}</p>
          </div>
        </div>
        <div className="text-gray-700 leading-relaxed whitespace-pre-wrap">{thread.body}</div>
      </div>

      {/* Replies */}
      {thread.replies.length > 0 && (
        <div className="space-y-4 mb-6">
          <h3 className="font-semibold text-gray-700 text-sm">{thread.replies.length} Replies</h3>
          {thread.replies.map((r) => (
            <div key={r.id} className="card p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                  <User size={14} className="text-blue-600" />
                </div>
                <div>
                  <p className="font-medium text-sm text-gray-800">{r.author_name || r.author_username}</p>
                  <p className="text-xs text-gray-400">{timeAgo(r.created_at)}</p>
                </div>
              </div>
              <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-wrap">{r.body}</p>
            </div>
          ))}
        </div>
      )}

      {/* Reply box */}
      {user ? (
        <div className="card p-5">
          <h3 className="font-semibold text-gray-700 mb-3 text-sm">Add Your Reply</h3>
          <textarea
            className="input min-h-[90px] resize-none text-sm"
            placeholder="Write your reply…"
            value={replyBody}
            onChange={(e) => setReplyBody(e.target.value)}
          />
          <button
            onClick={handleReply}
            disabled={posting || !replyBody.trim()}
            className="btn-primary mt-3 flex items-center gap-2"
          >
            <Send size={15} /> {posting ? 'Posting…' : 'Post Reply'}
          </button>
        </div>
      ) : (
        <div className="card p-5 text-center text-sm text-gray-500">
          <Link to="/login" className="text-saffron-600 font-medium hover:underline">Login</Link> to post a reply.
        </div>
      )}
    </div>
  );
}
