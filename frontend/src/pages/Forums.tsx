import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { MessageSquare, Briefcase, Users, Home, BookOpen, ChevronRight } from 'lucide-react';
import api from '../api/client';

interface Category {
  id: number;
  name: string;
  description: string;
  icon: string;
  thread_count: number;
  reply_count: number;
}

const iconMap: Record<string, React.ReactNode> = {
  briefcase: <Briefcase size={22} />,
  'person-badge': <Users size={22} />,
  house: <Home size={22} />,
  book: <BookOpen size={22} />,
  'chat-dots': <MessageSquare size={22} />,
};

const colorMap = [
  'from-amber-50 to-orange-50 border-amber-200 text-amber-700',
  'from-blue-50 to-indigo-50 border-blue-200 text-blue-700',
  'from-emerald-50 to-teal-50 border-emerald-200 text-emerald-700',
  'from-violet-50 to-purple-50 border-violet-200 text-violet-700',
  'from-rose-50 to-pink-50 border-rose-200 text-rose-700',
];

export default function Forums() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/forums/categories')
      .then((r) => setCategories(r.data.categories))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <div className="mb-8">
        <h1 className="section-title flex items-center gap-2 mb-2">
          <MessageSquare className="text-saffron-600" size={28} /> Business Forums
        </h1>
        <p className="text-gray-500">Discuss, collaborate, and grow with the community.</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-4 border-saffron-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="space-y-4">
          {categories.map((cat, i) => (
            <Link
              key={cat.id}
              to={`/forums/${cat.id}`}
              className={`card flex items-center gap-5 p-5 group bg-gradient-to-r ${colorMap[i % colorMap.length]}`}
            >
              <div className={`w-12 h-12 rounded-xl bg-white/60 flex items-center justify-center flex-shrink-0`}>
                {iconMap[cat.icon] || <MessageSquare size={22} />}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-display font-semibold text-gray-900 group-hover:text-saffron-700 transition-colors">
                  {cat.name}
                </h3>
                <p className="text-sm text-gray-600 mt-0.5 truncate">{cat.description}</p>
                <div className="flex gap-4 mt-2 text-xs text-gray-500">
                  <span>{cat.thread_count} threads</span>
                  <span>{cat.reply_count} replies</span>
                </div>
              </div>
              <ChevronRight size={18} className="text-gray-400 flex-shrink-0" />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
