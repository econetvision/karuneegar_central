import { useEffect, useState } from 'react';
import { Plus, Trash2, Edit2, GitBranch, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import api from '../api/client';
import { useAuth } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';

interface Member {
  id: number;
  name: string;
  relation: string;
  gender: string;
  birth_year: number | null;
  death_year: number | null;
  notes: string;
  parent_id: number | null;
}

const RELATIONS = ['Father', 'Mother', 'Son', 'Daughter', 'Spouse', 'Brother', 'Sister', 'Grandfather', 'Grandmother', 'Uncle', 'Aunt', 'Cousin', 'Other'];

function buildTree(members: Member[], parentId: number | null = null): Member[] {
  return members.filter((m) => m.parent_id === parentId);
}

function TreeNode({
  member,
  allMembers,
  onEdit,
  onDelete,
}: {
  member: Member;
  allMembers: Member[];
  onEdit: (m: Member) => void;
  onDelete: (id: number) => void;
}) {
  const children = buildTree(allMembers, member.id);
  const isDeceased = !!member.death_year;

  return (
    <div className="flex flex-col items-center">
      <div className={`group relative w-36 rounded-2xl border-2 p-3 text-center transition-all cursor-default
        ${isDeceased
          ? 'border-gray-300 bg-gray-50 text-gray-500'
          : member.gender === 'female'
            ? 'border-rose-300 bg-rose-50'
            : 'border-blue-300 bg-blue-50'
        }`}>
        <div className={`w-10 h-10 rounded-full mx-auto mb-1.5 flex items-center justify-center text-lg font-bold
          ${isDeceased ? 'bg-gray-200 text-gray-500' : member.gender === 'female' ? 'bg-rose-200 text-rose-700' : 'bg-blue-200 text-blue-700'}`}>
          {member.name[0].toUpperCase()}
        </div>
        <p className="font-semibold text-xs leading-snug">{member.name}</p>
        <p className="text-xs opacity-60 mt-0.5">{member.relation}</p>
        {member.birth_year && (
          <p className="text-xs opacity-50 mt-0.5">
            b. {member.birth_year}{member.death_year ? ` – d. ${member.death_year}` : ''}
          </p>
        )}
        <div className="absolute -top-2 -right-2 hidden group-hover:flex gap-1">
          <button
            onClick={() => onEdit(member)}
            className="w-6 h-6 bg-white border border-gray-200 rounded-full flex items-center justify-center shadow-sm hover:bg-saffron-50"
          >
            <Edit2 size={10} className="text-saffron-600" />
          </button>
          <button
            onClick={() => onDelete(member.id)}
            className="w-6 h-6 bg-white border border-gray-200 rounded-full flex items-center justify-center shadow-sm hover:bg-red-50"
          >
            <Trash2 size={10} className="text-red-500" />
          </button>
        </div>
      </div>

      {children.length > 0 && (
        <>
          <div className="w-px h-6 bg-gray-300" />
          <div className="relative flex gap-6">
            {children.length > 1 && (
              <div className="absolute top-0 left-[calc(50%-50%)] w-full h-px bg-gray-300" style={{ left: '2.25rem', right: '2.25rem', width: `calc(100% - 4.5rem)` }} />
            )}
            {children.map((child) => (
              <div key={child.id} className="flex flex-col items-center">
                <div className="w-px h-6 bg-gray-300" />
                <TreeNode member={child} allMembers={allMembers} onEdit={onEdit} onDelete={onDelete} />
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default function FamilyTree() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Member | null>(null);
  const [form, setForm] = useState({
    name: '', relation: 'Father', gender: 'male',
    birth_year: '', death_year: '', notes: '', parent_id: '',
  });

  useEffect(() => {
    if (!user) return;
    api.get('/family-tree')
      .then((r) => setMembers(r.data.members))
      .finally(() => setLoading(false));
  }, [user]);

  const openAdd = () => {
    setEditing(null);
    setForm({ name: '', relation: 'Father', gender: 'male', birth_year: '', death_year: '', notes: '', parent_id: '' });
    setShowModal(true);
  };

  const openEdit = (m: Member) => {
    setEditing(m);
    setForm({
      name: m.name, relation: m.relation, gender: m.gender,
      birth_year: m.birth_year?.toString() || '',
      death_year: m.death_year?.toString() || '',
      notes: m.notes || '',
      parent_id: m.parent_id?.toString() || '',
    });
    setShowModal(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm(t('familyTree.removeConfirm'))) return;
    await api.delete(`/family-tree/${id}`);
    setMembers((prev) => prev.filter((m) => m.id !== id));
  };

  const handleSave = async () => {
    const payload = {
      name: form.name,
      relation: form.relation,
      gender: form.gender,
      birth_year: form.birth_year ? parseInt(form.birth_year) : null,
      death_year: form.death_year ? parseInt(form.death_year) : null,
      notes: form.notes,
      parent_id: form.parent_id ? parseInt(form.parent_id) : null,
    };

    if (editing) {
      const r = await api.put(`/family-tree/${editing.id}`, payload);
      setMembers((prev) => prev.map((m) => (m.id === editing.id ? r.data.member : m)));
    } else {
      const r = await api.post('/family-tree', payload);
      setMembers((prev) => [...prev, r.data.member]);
    }
    setShowModal(false);
  };

  const roots = buildTree(members, null);

  if (!user) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <GitBranch size={48} className="text-saffron-300 mx-auto mb-4" />
        <h2 className="font-display font-bold text-2xl text-gray-800 mb-2">{t('familyTree.title')}</h2>
        <p className="text-gray-500 mb-6">{t('familyTree.loginPrompt')}</p>
        <Link to="/login" className="btn-primary">{t('familyTree.loginBtn')}</Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-10">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="section-title flex items-center gap-2">
            <GitBranch className="text-saffron-600" size={28} /> {t('familyTree.title')}
          </h1>
          <p className="text-gray-500 mt-1">{t('familyTree.membersCount', { count: members.length })}</p>
        </div>
        <button onClick={openAdd} className="btn-primary flex items-center gap-2">
          <Plus size={18} /> {t('familyTree.addMember')}
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-4 border-saffron-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : members.length === 0 ? (
        <div className="card p-16 text-center">
          <GitBranch size={48} className="text-gray-300 mx-auto mb-4" />
          <h3 className="font-semibold text-gray-700 mb-2">{t('familyTree.noMembers')}</h3>
          <p className="text-gray-400 mb-6">{t('familyTree.noMembersDesc')}</p>
          <button onClick={openAdd} className="btn-primary">{t('familyTree.addFirst')}</button>
        </div>
      ) : (
        <>
          {/* Legend */}
          <div className="flex gap-4 mb-6 text-xs">
            <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-blue-300" /> {t('familyTree.male')}</div>
            <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-rose-300" /> {t('familyTree.female')}</div>
            <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-gray-300" /> {t('familyTree.deceased')}</div>
          </div>

          {/* Tree */}
          <div className="card p-8 overflow-x-auto">
            <div className="flex gap-10 min-w-max">
              {roots.map((root) => (
                <TreeNode key={root.id} member={root} allMembers={members} onEdit={openEdit} onDelete={handleDelete} />
              ))}
            </div>
          </div>

          {/* Table */}
          <div className="card mt-6 overflow-hidden">
            <div className="p-4 border-b border-gray-100 font-semibold text-gray-700">{t('familyTree.all')}</div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    {[t('familyTree.name'), t('familyTree.relation'), t('familyTree.gender'), t('familyTree.birthYear'), t('familyTree.notes'), ''].map((h) => (
                      <th key={h} className="text-left px-4 py-2.5 text-gray-500 font-medium">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {members.map((m) => (
                    <tr key={m.id} className="border-t border-gray-50 hover:bg-gray-50">
                      <td className="px-4 py-2.5 font-medium">{m.name}</td>
                      <td className="px-4 py-2.5 text-gray-600">{m.relation}</td>
                      <td className="px-4 py-2.5 text-gray-600 capitalize">{m.gender}</td>
                      <td className="px-4 py-2.5 text-gray-600">{m.birth_year || '—'}</td>
                      <td className="px-4 py-2.5 text-gray-500 truncate max-w-[150px]">{m.notes || '—'}</td>
                      <td className="px-4 py-2.5">
                        <div className="flex gap-2">
                          <button onClick={() => openEdit(m)} className="p-1.5 hover:bg-saffron-50 rounded-lg text-saffron-600">
                            <Edit2 size={13} />
                          </button>
                          <button onClick={() => handleDelete(m.id)} className="p-1.5 hover:bg-red-50 rounded-lg text-red-500">
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-display font-semibold text-lg">{editing ? t('familyTree.editTitle') : t('familyTree.addTitle')}</h3>
              <button onClick={() => setShowModal(false)} className="p-1.5 hover:bg-gray-100 rounded-lg">
                <X size={18} />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="label">{t('familyTree.nameField')}</label>
                <input className="input" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} required />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">{t('familyTree.relation')}</label>
                  <select className="input" value={form.relation} onChange={(e) => setForm((f) => ({ ...f, relation: e.target.value }))}>
                    {RELATIONS.map((r) => <option key={r}>{r}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">{t('familyTree.gender')}</label>
                  <select className="input" value={form.gender} onChange={(e) => setForm((f) => ({ ...f, gender: e.target.value }))}>
                    <option value="male">{t('familyTree.male')}</option>
                    <option value="female">{t('familyTree.female')}</option>
                  </select>
                </div>
                <div>
                  <label className="label">{t('familyTree.birthYear')}</label>
                  <input type="number" className="input" placeholder={t('familyTree.birthYearPlaceholder')} value={form.birth_year} onChange={(e) => setForm((f) => ({ ...f, birth_year: e.target.value }))} />
                </div>
                <div>
                  <label className="label">{t('familyTree.deathYear')}</label>
                  <input type="number" className="input" placeholder={t('familyTree.leaveBlankIfAlive')} value={form.death_year} onChange={(e) => setForm((f) => ({ ...f, death_year: e.target.value }))} />
                </div>
              </div>
              <div>
                <label className="label">{t('familyTree.parentField')}</label>
                <select className="input" value={form.parent_id} onChange={(e) => setForm((f) => ({ ...f, parent_id: e.target.value }))}>
                  <option value="">{t('familyTree.noParent')}</option>
                  {members.filter((m) => m.id !== editing?.id).map((m) => (
                    <option key={m.id} value={m.id}>{m.name} ({m.relation})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">{t('familyTree.notes')}</label>
                <textarea className="input resize-none h-16" value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} />
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={handleSave} disabled={!form.name} className="btn-primary flex-1">
                {editing ? t('familyTree.update') : t('familyTree.add')}
              </button>
              <button onClick={() => setShowModal(false)} className="btn-outline">{t('common.cancel')}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
