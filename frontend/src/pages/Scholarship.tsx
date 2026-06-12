import { useEffect, useState } from 'react';
import { GraduationCap, HandHeart, Plus, Mail, Calendar, BookOpen, Building2, X, ChevronRight } from 'lucide-react';
import api from '../api/client';
import { useAuth } from '../contexts/AuthContext';

interface ScholarshipItem {
  id: number;
  type: 'request' | 'provide';
  title: string;
  description?: string;
  amount?: string;
  field_of_study?: string;
  institution?: string;
  eligibility?: string;
  deadline?: string;
  contact_email?: string;
  poster_username: string;
  poster_name?: string;
  created_at: string;
}

type Tab = 'provide' | 'request';

const EMPTY_FORM = {
  title: '',
  description: '',
  amount: '',
  field_of_study: '',
  institution: '',
  eligibility: '',
  deadline: '',
  contact_email: '',
};

export default function Scholarship() {
  const { user } = useAuth();
  const [tab, setTab] = useState<Tab>('provide');
  const [items, setItems] = useState<ScholarshipItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formType, setFormType] = useState<Tab>('provide');
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const fetchItems = (type: Tab) => {
    setLoading(true);
    api.get('/scholarships', { params: { type } })
      .then((r) => setItems(r.data.scholarships))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchItems(tab); }, [tab]);

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const openForm = (type: Tab) => {
    setFormType(type);
    setForm({ ...EMPTY_FORM });
    setError('');
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      await api.post('/scholarships', { ...form, type: formType });
      setShowForm(false);
      if (tab === formType) fetchItems(tab);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to post. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Remove this post?')) return;
    await api.delete(`/scholarships/${id}`);
    setItems((prev) => prev.filter((s) => s.id !== id));
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="section-title flex items-center gap-2">
            <GraduationCap className="text-saffron-600" size={28} /> Scholarships
          </h1>
          <p className="text-gray-500 mt-1">
            Community members offering and seeking scholarship support.
          </p>
        </div>
        {user && (
          <div className="flex gap-2 flex-wrap">
            <button onClick={() => openForm('provide')}
              className="btn-primary flex items-center gap-2 text-sm">
              <Plus size={15} /> Offer Scholarship
            </button>
            <button onClick={() => openForm('request')}
              className="btn-outline flex items-center gap-2 text-sm">
              <HandHeart size={15} /> Request Scholarship
            </button>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-gray-100 rounded-xl mb-8 w-fit">
        <button
          onClick={() => setTab('provide')}
          className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${
            tab === 'provide' ? 'bg-white shadow text-saffron-700' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Scholarship Opportunities
        </button>
        <button
          onClick={() => setTab('request')}
          className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${
            tab === 'request' ? 'bg-white shadow text-saffron-700' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Scholarship Requests
        </button>
      </div>

      {/* List */}
      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-4 border-saffron-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : items.length === 0 ? (
        <div className="card p-16 text-center">
          <GraduationCap size={48} className="text-gray-200 mx-auto mb-4" />
          <h3 className="font-semibold text-gray-600 mb-2">
            {tab === 'provide' ? 'No scholarships offered yet' : 'No scholarship requests yet'}
          </h3>
          <p className="text-gray-400 text-sm mb-6">
            {tab === 'provide'
              ? 'Be the first to offer a scholarship to the community!'
              : 'No one has requested scholarship support yet.'}
          </p>
          {user && (
            <button onClick={() => openForm(tab)} className="btn-primary mx-auto">
              {tab === 'provide' ? 'Offer Scholarship' : 'Request Scholarship'}
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {items.map((s) => (
            <div key={s.id} className="card p-6 group">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className={`badge text-xs ${
                      s.type === 'provide'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-blue-100 text-blue-700'
                    }`}>
                      {s.type === 'provide' ? 'Opportunity' : 'Request'}
                    </span>
                    {s.amount && (
                      <span className="badge bg-saffron-100 text-saffron-700 text-xs">{s.amount}</span>
                    )}
                  </div>
                  <h3 className="font-semibold text-gray-900 text-lg leading-snug">{s.title}</h3>
                  <p className="text-sm text-gray-500 mt-0.5">
                    Posted by <span className="font-medium text-gray-700">{s.poster_name || s.poster_username}</span>
                    {' · '}
                    {new Date(s.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>

                  {s.description && (
                    <p className="mt-3 text-gray-600 text-sm leading-relaxed">{s.description}</p>
                  )}

                  <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1.5">
                    {s.field_of_study && (
                      <span className="flex items-center gap-1.5 text-xs text-gray-500">
                        <BookOpen size={12} /> {s.field_of_study}
                      </span>
                    )}
                    {s.institution && (
                      <span className="flex items-center gap-1.5 text-xs text-gray-500">
                        <Building2 size={12} /> {s.institution}
                      </span>
                    )}
                    {s.deadline && (
                      <span className="flex items-center gap-1.5 text-xs text-gray-500">
                        <Calendar size={12} /> Deadline: {s.deadline}
                      </span>
                    )}
                    {s.contact_email && (
                      <a href={`mailto:${s.contact_email}`}
                        className="flex items-center gap-1.5 text-xs text-blue-600 hover:underline">
                        <Mail size={12} /> {s.contact_email}
                      </a>
                    )}
                  </div>

                  {s.eligibility && (
                    <details className="mt-3">
                      <summary className="text-xs text-saffron-600 cursor-pointer flex items-center gap-1 select-none">
                        <ChevronRight size={12} /> Eligibility criteria
                      </summary>
                      <p className="mt-2 text-xs text-gray-600 leading-relaxed pl-4">{s.eligibility}</p>
                    </details>
                  )}
                </div>

                {user?.username === s.poster_username && (
                  <button
                    onClick={() => handleDelete(s.id)}
                    className="p-1.5 rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors flex-shrink-0"
                    title="Remove"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Post Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h2 className="font-display font-bold text-lg text-gray-900 flex items-center gap-2">
                {formType === 'provide' ? (
                  <><GraduationCap size={20} className="text-green-600" /> Offer a Scholarship</>
                ) : (
                  <><HandHeart size={20} className="text-blue-600" /> Request Scholarship Support</>
                )}
              </h2>
              <button onClick={() => setShowForm(false)} className="p-1 rounded-lg hover:bg-gray-100">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm">{error}</div>
              )}

              <div>
                <label className="label">Title *</label>
                <input
                  type="text"
                  className="input"
                  placeholder={formType === 'provide' ? 'e.g. Merit Scholarship for Engineering Students' : 'e.g. Seeking support for B.E. admission'}
                  value={form.title}
                  onChange={set('title')}
                  required
                />
              </div>

              <div>
                <label className="label">Description</label>
                <textarea
                  className="input min-h-[80px] resize-none"
                  placeholder={formType === 'provide'
                    ? 'Describe the scholarship, purpose, and how to apply…'
                    : 'Share your background, need, and how the scholarship will help you…'}
                  value={form.description}
                  onChange={set('description')}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">{formType === 'provide' ? 'Scholarship Amount' : 'Amount Needed'}</label>
                  <input type="text" className="input" placeholder="e.g. ₹50,000 / Full tuition"
                    value={form.amount} onChange={set('amount')} />
                </div>
                <div>
                  <label className="label">Field of Study</label>
                  <input type="text" className="input" placeholder="e.g. Engineering, Medicine"
                    value={form.field_of_study} onChange={set('field_of_study')} />
                </div>
              </div>

              <div>
                <label className="label">{formType === 'provide' ? 'Institution (if specific)' : 'Institution / College'}</label>
                <input type="text" className="input" placeholder="e.g. Anna University"
                  value={form.institution} onChange={set('institution')} />
              </div>

              {formType === 'provide' && (
                <>
                  <div>
                    <label className="label">Eligibility Criteria</label>
                    <textarea className="input min-h-[70px] resize-none"
                      placeholder="Who can apply? Marks, income limit, community criteria…"
                      value={form.eligibility} onChange={set('eligibility')} />
                  </div>
                  <div>
                    <label className="label">Application Deadline</label>
                    <input type="text" className="input" placeholder="e.g. 31 July 2026"
                      value={form.deadline} onChange={set('deadline')} />
                  </div>
                </>
              )}

              <div>
                <label className="label">Contact Email</label>
                <input type="email" className="input" placeholder="your@email.com"
                  value={form.contact_email} onChange={set('contact_email')} />
              </div>

              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={saving} className="btn-primary flex-1">
                  {saving ? 'Posting…' : formType === 'provide' ? 'Post Scholarship' : 'Post Request'}
                </button>
                <button type="button" onClick={() => setShowForm(false)} className="btn-outline">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
