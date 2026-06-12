import { useEffect, useState } from 'react';
import {
  GraduationCap, HandHeart, Plus, Mail, Calendar, BookOpen,
  Building2, X, ChevronRight, Upload, FileText, IdCard, ScrollText,
  User, Users, Banknote, BadgeCheck, ArrowRight,
} from 'lucide-react';
import api, { uploadUrl } from '../api/client';
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
  // request fields
  applicant_name?: string;
  parent_name?: string;
  parent_occupation?: string;
  parent_income?: string;
  id_proof_filename?: string;
  certificate_filename?: string;
  admission_letter_filename?: string;
  // provide fields
  trust_name?: string;
  member_id?: string;
}

type Tab = 'provide' | 'request';

const EMPTY_REQUEST = {
  applicant_name: '',
  parent_name: '',
  parent_occupation: '',
  parent_income: '',
  amount: '',
  field_of_study: '',
  institution: '',
  description: '',
  contact_email: '',
  id_proof_filename: '',
  certificate_filename: '',
  admission_letter_filename: '',
};

const EMPTY_PROVIDE = {
  donor_name: '',
  title: '',
  trust_name: '',
  member_id: '',
  amount: '',
  field_of_study: '',
  institution: '',
  eligibility: '',
  deadline: '',
  description: '',
  contact_email: '',
};

function DocUpload({
  label, icon, filename, onUploaded,
}: {
  label: string;
  icon: React.ReactNode;
  filename: string;
  onUploaded: (name: string) => void;
}) {
  const [uploading, setUploading] = useState(false);

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const fd = new FormData();
    fd.append('file', file);
    try {
      const r = await api.post('/upload', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      onUploaded(r.data.filename);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <label className="label flex items-center gap-1.5">{icon}{label}</label>
      <label className={`flex items-center gap-3 border-2 border-dashed rounded-xl px-4 py-3 cursor-pointer transition-colors
        ${filename ? 'border-green-300 bg-green-50' : 'border-gray-200 hover:border-saffron-300 bg-gray-50'}`}>
        {filename ? (
          <>
            <BadgeCheck size={18} className="text-green-600 flex-shrink-0" />
            <span className="text-sm text-green-700 truncate">{filename.split('/').pop()}</span>
          </>
        ) : (
          <>
            <Upload size={18} className="text-gray-400 flex-shrink-0" />
            <span className="text-sm text-gray-500">{uploading ? 'Uploading…' : 'Click to upload (PDF / JPG / PNG)'}</span>
          </>
        )}
        <input type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden" onChange={handleChange} disabled={uploading} />
      </label>
    </div>
  );
}

export default function Scholarship() {
  const { user } = useAuth();
  const [tab, setTab] = useState<Tab>('provide');
  const [items, setItems] = useState<ScholarshipItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState<Tab | null>(null);
  const [requestForm, setRequestForm] = useState({ ...EMPTY_REQUEST });
  const [provideForm, setProvideForm] = useState({ ...EMPTY_PROVIDE });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const fetchItems = (type: Tab) => {
    setLoading(true);
    api.get('/scholarships', { params: { type } })
      .then((r) => setItems(r.data.scholarships))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchItems(tab); }, [tab]);

  const setR = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setRequestForm((f) => ({ ...f, [k]: e.target.value }));

  const setP = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setProvideForm((f) => ({ ...f, [k]: e.target.value }));

  const openForm = (type: Tab) => {
    if (!user) return;
    setError('');
    if (type === 'request') setRequestForm({ ...EMPTY_REQUEST });
    else setProvideForm({ ...EMPTY_PROVIDE });
    setShowForm(type);
  };

  const handleSubmitRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!requestForm.applicant_name.trim()) { setError('Applicant name is required.'); return; }
    setSaving(true);
    setError('');
    try {
      await api.post('/scholarships', {
        type: 'request',
        title: requestForm.applicant_name.trim(),
        ...requestForm,
      });
      setShowForm(null);
      if (tab === 'request') fetchItems('request');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to submit. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleSubmitProvide = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!provideForm.donor_name.trim()) { setError('Your name is required.'); return; }
    if (!provideForm.title.trim()) { setError('Scholarship title is required.'); return; }
    setSaving(true);
    setError('');
    try {
      const { donor_name, ...rest } = provideForm;
      await api.post('/scholarships', { type: 'provide', applicant_name: donor_name, ...rest });
      setShowForm(null);
      if (tab === 'provide') fetchItems('provide');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to submit. Please try again.');
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
      <div className="mb-8">
        <h1 className="section-title flex items-center gap-2">
          <GraduationCap className="text-saffron-600" size={28} /> Scholarships
        </h1>
        <p className="text-gray-500 mt-1">Community scholarship support — seek help or offer opportunities.</p>
      </div>

      {/* Menu tiles */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-10">
        {/* Request tile */}
        <div className="card p-6 border-2 border-blue-100 hover:border-blue-300 transition-colors group">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-blue-100 flex items-center justify-center flex-shrink-0 group-hover:bg-blue-200 transition-colors">
              <HandHeart size={28} className="text-blue-600" />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="font-display font-bold text-lg text-gray-900">Request a Scholarship</h2>
              <p className="text-gray-500 text-sm mt-1 leading-relaxed">
                Are you a student seeking financial support? Submit your application with documents and we'll connect you with donors.
              </p>
              <button
                onClick={() => user ? openForm('request') : setTab('request')}
                className="mt-4 btn-primary text-sm flex items-center gap-2 w-fit"
              >
                {user ? <><Plus size={15} /> Apply Now</> : <>View Requests <ArrowRight size={14} /></>}
              </button>
            </div>
          </div>
        </div>

        {/* Raise / Offer tile */}
        <div className="card p-6 border-2 border-green-100 hover:border-green-300 transition-colors group">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-green-100 flex items-center justify-center flex-shrink-0 group-hover:bg-green-200 transition-colors">
              <GraduationCap size={28} className="text-green-600" />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="font-display font-bold text-lg text-gray-900">Raise a Scholarship</h2>
              <p className="text-gray-500 text-sm mt-1 leading-relaxed">
                Want to support a deserving student? List your scholarship offering and help the next generation succeed.
              </p>
              <button
                onClick={() => user ? openForm('provide') : setTab('provide')}
                className="mt-4 bg-green-600 hover:bg-green-700 text-white font-medium text-sm px-4 py-2 rounded-lg transition-colors flex items-center gap-2 w-fit"
              >
                {user ? <><Plus size={15} /> Offer Now</> : <>View Offerings <ArrowRight size={14} /></>}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-gray-100 rounded-xl mb-6 w-fit">
        <button
          onClick={() => setTab('provide')}
          className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${
            tab === 'provide' ? 'bg-white shadow text-green-700' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Scholarship Offerings
        </button>
        <button
          onClick={() => setTab('request')}
          className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${
            tab === 'request' ? 'bg-white shadow text-blue-700' : 'text-gray-500 hover:text-gray-700'
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
            {tab === 'provide' ? 'Be the first to offer a scholarship!' : 'No requests have been submitted yet.'}
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
                      s.type === 'provide' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                    }`}>
                      {s.type === 'provide' ? 'Opportunity' : 'Request'}
                    </span>
                    {s.amount && (
                      <span className="badge bg-saffron-100 text-saffron-700 text-xs flex items-center gap-1">
                        <Banknote size={11} /> {s.amount}
                      </span>
                    )}
                    {s.trust_name && (
                      <span className="badge bg-purple-100 text-purple-700 text-xs">{s.trust_name}</span>
                    )}
                  </div>

                  <h3 className="font-semibold text-gray-900 text-lg leading-snug">
                    {s.type === 'request' ? (s.applicant_name || s.title) : s.title}
                  </h3>
                  <p className="text-sm text-gray-500 mt-0.5">
                    {s.type === 'provide'
                      ? <>Offered by <span className="font-medium text-gray-700">{s.applicant_name || s.poster_name || s.poster_username}</span></>
                      : <>Requested by <span className="font-medium text-gray-700">{s.poster_name || s.poster_username}</span></>
                    }
                    {' · '}
                    {new Date(s.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>

                  {s.description && (
                    <p className="mt-3 text-gray-600 text-sm leading-relaxed">{s.description}</p>
                  )}

                  {/* Request-specific details */}
                  {s.type === 'request' && (s.parent_name || s.parent_occupation || s.parent_income) && (
                    <div className="mt-3 p-3 bg-blue-50 rounded-xl space-y-1">
                      <p className="text-xs font-semibold text-blue-700 mb-1.5 flex items-center gap-1">
                        <Users size={12} /> Parent / Guardian Details
                      </p>
                      {s.parent_name && (
                        <p className="text-xs text-gray-600"><span className="font-medium">Name:</span> {s.parent_name}</p>
                      )}
                      {s.parent_occupation && (
                        <p className="text-xs text-gray-600"><span className="font-medium">Occupation:</span> {s.parent_occupation}</p>
                      )}
                      {s.parent_income && (
                        <p className="text-xs text-gray-600"><span className="font-medium">Annual Income:</span> {s.parent_income}</p>
                      )}
                    </div>
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
                    {s.member_id && (
                      <span className="flex items-center gap-1.5 text-xs text-gray-500">
                        <IdCard size={12} /> Member ID: {s.member_id}
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

                  {/* Document links (visible to logged-in users) */}
                  {user && s.type === 'request' && (s.id_proof_filename || s.certificate_filename || s.admission_letter_filename) && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {s.id_proof_filename && (
                        <a href={uploadUrl(s.id_proof_filename)} target="_blank" rel="noreferrer"
                          className="flex items-center gap-1.5 text-xs text-saffron-700 bg-saffron-50 border border-saffron-200 rounded-lg px-2.5 py-1 hover:bg-saffron-100 transition-colors">
                          <IdCard size={12} /> ID Proof
                        </a>
                      )}
                      {s.certificate_filename && (
                        <a href={uploadUrl(s.certificate_filename)} target="_blank" rel="noreferrer"
                          className="flex items-center gap-1.5 text-xs text-saffron-700 bg-saffron-50 border border-saffron-200 rounded-lg px-2.5 py-1 hover:bg-saffron-100 transition-colors">
                          <ScrollText size={12} /> Certificate
                        </a>
                      )}
                      {s.admission_letter_filename && (
                        <a href={uploadUrl(s.admission_letter_filename)} target="_blank" rel="noreferrer"
                          className="flex items-center gap-1.5 text-xs text-saffron-700 bg-saffron-50 border border-saffron-200 rounded-lg px-2.5 py-1 hover:bg-saffron-100 transition-colors">
                          <FileText size={12} /> Admission Letter
                        </a>
                      )}
                    </div>
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

      {/* ── Request Scholarship Form Modal ─────────────────────────────────────── */}
      {showForm === 'request' && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-gray-100 sticky top-0 bg-white z-10">
              <h2 className="font-display font-bold text-lg text-gray-900 flex items-center gap-2">
                <HandHeart size={20} className="text-blue-600" /> Request Scholarship Support
              </h2>
              <button onClick={() => setShowForm(null)} className="p-1 rounded-lg hover:bg-gray-100">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmitRequest} className="p-5 space-y-6">
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm">{error}</div>
              )}

              {/* Applicant Details */}
              <section>
                <h3 className="font-semibold text-gray-700 text-sm mb-3 flex items-center gap-1.5">
                  <User size={15} className="text-blue-500" /> Applicant Details
                </h3>
                <div className="space-y-3">
                  <div>
                    <label className="label">Applicant Full Name *</label>
                    <input className="input" placeholder="Student's full name"
                      value={requestForm.applicant_name} onChange={setR('applicant_name')} required />
                  </div>
                  <div>
                    <label className="label">Field of Study</label>
                    <input className="input" placeholder="e.g. B.E. Computer Science, MBBS"
                      value={requestForm.field_of_study} onChange={setR('field_of_study')} />
                  </div>
                  <div>
                    <label className="label">College / Institution</label>
                    <input className="input" placeholder="e.g. Anna University, Chennai"
                      value={requestForm.institution} onChange={setR('institution')} />
                  </div>
                  <div>
                    <label className="label">Scholarship Amount Requested</label>
                    <input className="input" placeholder="e.g. ₹50,000 / Full tuition"
                      value={requestForm.amount} onChange={setR('amount')} />
                  </div>
                </div>
              </section>

              {/* Parent Details */}
              <section>
                <h3 className="font-semibold text-gray-700 text-sm mb-3 flex items-center gap-1.5">
                  <Users size={15} className="text-blue-500" /> Parent / Guardian Details
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="label">Parent / Guardian Name</label>
                    <input className="input" placeholder="Full name"
                      value={requestForm.parent_name} onChange={setR('parent_name')} />
                  </div>
                  <div>
                    <label className="label">Parent Occupation</label>
                    <input className="input" placeholder="e.g. Farmer, Government Employee"
                      value={requestForm.parent_occupation} onChange={setR('parent_occupation')} />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="label">Parent Annual Income</label>
                    <input className="input" placeholder="e.g. ₹1,80,000 per year"
                      value={requestForm.parent_income} onChange={setR('parent_income')} />
                  </div>
                </div>
              </section>

              {/* Description */}
              <section>
                <h3 className="font-semibold text-gray-700 text-sm mb-3 flex items-center gap-1.5">
                  <ScrollText size={15} className="text-blue-500" /> Why do you need this scholarship?
                </h3>
                <textarea
                  className="input min-h-[90px] resize-none"
                  placeholder="Describe your financial situation, academic achievements, and how this scholarship will help you…"
                  value={requestForm.description}
                  onChange={setR('description')}
                />
              </section>

              {/* Document Uploads */}
              <section>
                <h3 className="font-semibold text-gray-700 text-sm mb-3 flex items-center gap-1.5">
                  <FileText size={15} className="text-blue-500" /> Supporting Documents
                </h3>
                <div className="space-y-3">
                  <DocUpload
                    label="ID Proof (Aadhaar / Voter ID)"
                    icon={<IdCard size={14} className="text-gray-400" />}
                    filename={requestForm.id_proof_filename}
                    onUploaded={(name) => setRequestForm((f) => ({ ...f, id_proof_filename: name }))}
                  />
                  <DocUpload
                    label="Mark Certificate (10th / 12th / Degree)"
                    icon={<ScrollText size={14} className="text-gray-400" />}
                    filename={requestForm.certificate_filename}
                    onUploaded={(name) => setRequestForm((f) => ({ ...f, certificate_filename: name }))}
                  />
                  <DocUpload
                    label="College Admission Letter"
                    icon={<FileText size={14} className="text-gray-400" />}
                    filename={requestForm.admission_letter_filename}
                    onUploaded={(name) => setRequestForm((f) => ({ ...f, admission_letter_filename: name }))}
                  />
                </div>
              </section>

              {/* Contact */}
              <section>
                <label className="label flex items-center gap-1.5"><Mail size={14} className="text-gray-400" /> Contact Email</label>
                <input type="email" className="input" placeholder="your@email.com"
                  value={requestForm.contact_email} onChange={setR('contact_email')} />
              </section>

              <div className="flex gap-3 pt-1">
                <button type="submit" disabled={saving} className="btn-primary flex-1">
                  {saving ? 'Submitting…' : 'Submit Application'}
                </button>
                <button type="button" onClick={() => setShowForm(null)} className="btn-outline">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Raise / Offer Scholarship Form Modal ──────────────────────────────── */}
      {showForm === 'provide' && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-gray-100 sticky top-0 bg-white z-10">
              <h2 className="font-display font-bold text-lg text-gray-900 flex items-center gap-2">
                <GraduationCap size={20} className="text-green-600" /> Offer a Scholarship
              </h2>
              <button onClick={() => setShowForm(null)} className="p-1 rounded-lg hover:bg-gray-100">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmitProvide} className="p-5 space-y-6">
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm">{error}</div>
              )}

              {/* Donor/Offerer Details */}
              <section>
                <h3 className="font-semibold text-gray-700 text-sm mb-3 flex items-center gap-1.5">
                  <User size={15} className="text-green-600" /> Donor / Offerer Details
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="label">Your Name *</label>
                    <input className="input" placeholder="Full name of donor or contact person"
                      value={provideForm.donor_name} onChange={setP('donor_name')} required />
                  </div>
                  <div>
                    <label className="label flex items-center gap-1"><IdCard size={13} className="text-gray-400" /> Member ID</label>
                    <input className="input" placeholder="Karuneegar community member ID"
                      value={provideForm.member_id} onChange={setP('member_id')} />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="label flex items-center gap-1"><Building2 size={13} className="text-gray-400" /> Trust / Organization Name</label>
                    <input className="input" placeholder="e.g. Karuneegar Charitable Trust"
                      value={provideForm.trust_name} onChange={setP('trust_name')} />
                  </div>
                </div>
              </section>

              {/* Scholarship Details */}
              <section>
                <h3 className="font-semibold text-gray-700 text-sm mb-3 flex items-center gap-1.5">
                  <GraduationCap size={15} className="text-green-600" /> Scholarship Details
                </h3>
                <div className="space-y-3">
                  <div>
                    <label className="label">Scholarship Title / Name *</label>
                    <input className="input" placeholder="e.g. Merit Scholarship for Engineering Students"
                      value={provideForm.title} onChange={setP('title')} required />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="label flex items-center gap-1"><Banknote size={13} className="text-gray-400" /> Scholarship Amount</label>
                      <input className="input" placeholder="e.g. ₹50,000 / Full tuition"
                        value={provideForm.amount} onChange={setP('amount')} />
                    </div>
                    <div>
                      <label className="label flex items-center gap-1"><BookOpen size={13} className="text-gray-400" /> Field of Study</label>
                      <input className="input" placeholder="e.g. Engineering, Medicine, Any"
                        value={provideForm.field_of_study} onChange={setP('field_of_study')} />
                    </div>
                  </div>
                  <div>
                    <label className="label flex items-center gap-1"><Building2 size={13} className="text-gray-400" /> Institution (if specific)</label>
                    <input className="input" placeholder="Leave blank for any institution"
                      value={provideForm.institution} onChange={setP('institution')} />
                  </div>
                </div>
              </section>

              {/* Eligibility & Deadline */}
              <section>
                <h3 className="font-semibold text-gray-700 text-sm mb-3 flex items-center gap-1.5">
                  <ScrollText size={15} className="text-green-600" /> Eligibility & Deadline
                </h3>
                <div className="space-y-3">
                  <div>
                    <label className="label">Eligibility Criteria</label>
                    <textarea className="input min-h-[80px] resize-none"
                      placeholder="Who can apply? Marks, income limit, community criteria, year of study…"
                      value={provideForm.eligibility} onChange={setP('eligibility')} />
                  </div>
                  <div>
                    <label className="label flex items-center gap-1"><Calendar size={13} className="text-gray-400" /> Application Deadline</label>
                    <input className="input" placeholder="e.g. 31 July 2026"
                      value={provideForm.deadline} onChange={setP('deadline')} />
                  </div>
                </div>
              </section>

              {/* Description */}
              <section>
                <label className="label">Description</label>
                <textarea className="input min-h-[80px] resize-none"
                  placeholder="Additional details about the scholarship, purpose, how to apply…"
                  value={provideForm.description} onChange={setP('description')} />
              </section>

              {/* Contact */}
              <section>
                <label className="label flex items-center gap-1.5"><Mail size={14} className="text-gray-400" /> Contact Email</label>
                <input type="email" className="input" placeholder="scholarship@yourtrust.org"
                  value={provideForm.contact_email} onChange={setP('contact_email')} />
              </section>

              <div className="flex gap-3 pt-1">
                <button type="submit" disabled={saving} className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2.5 px-4 rounded-xl transition-colors flex-1">
                  {saving ? 'Posting…' : 'Post Scholarship'}
                </button>
                <button type="button" onClick={() => setShowForm(null)} className="btn-outline">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
