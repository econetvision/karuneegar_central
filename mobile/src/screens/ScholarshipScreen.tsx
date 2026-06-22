import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, Modal, TextInput, Alert, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../api/client';
import { useAuth } from '../contexts/AuthContext';
import { colors, spacing, radius } from '../theme';

export default function ScholarshipScreen() {
  const { user } = useAuth();
  const [tab, setTab] = useState<'provide' | 'request'>('provide');
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<'request' | 'provide' | null>(null);
  const [form, setForm] = useState<any>({});
  const [saving, setSaving] = useState(false);

  const setF = (k: string) => (v: string) => setForm((f: any) => ({ ...f, [k]: v }));

  const fetchItems = (type: 'provide' | 'request') => {
    setLoading(true);
    api.get('/scholarships', { params: { type } }).then((r) => setItems(r.data.scholarships)).finally(() => setLoading(false));
  };

  useEffect(() => { fetchItems(tab); }, [tab]);

  const openModal = (type: 'request' | 'provide') => {
    setForm({});
    setModal(type);
  };

  const handleSubmit = async () => {
    if (modal === 'request' && !form.applicant_name) { Alert.alert('Error', 'Applicant name is required.'); return; }
    if (modal === 'provide' && (!form.donor_name || !form.title)) { Alert.alert('Error', 'Name and scholarship title are required.'); return; }
    setSaving(true);
    try {
      const payload = modal === 'request'
        ? { type: 'request', title: form.applicant_name, ...form }
        : { type: 'provide', applicant_name: form.donor_name, ...form };
      await api.post('/scholarships', payload);
      setModal(null);
      if (tab === modal) fetchItems(tab);
    } catch { Alert.alert('Error', 'Failed to post.'); }
    finally { setSaving(false); }
  };

  return (
    <View style={styles.container}>
      {/* Menu tiles */}
      <View style={styles.menuRow}>
        <TouchableOpacity style={[styles.menuTile, styles.requestTile]} onPress={() => user ? openModal('request') : Alert.alert('Login Required', 'Please sign in to apply.')}>
          <Ionicons name="hand-right-outline" size={28} color="#3b82f6" />
          <Text style={styles.menuTileTitle}>Request a Scholarship</Text>
          <Text style={styles.menuTileDesc}>Apply for financial support</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.menuTile, styles.raiseTile]} onPress={() => user ? openModal('provide') : Alert.alert('Login Required', 'Please sign in to offer a scholarship.')}>
          <Ionicons name="school-outline" size={28} color="#16a34a" />
          <Text style={styles.menuTileTitle}>Raise a Scholarship</Text>
          <Text style={styles.menuTileDesc}>Offer support to students</Text>
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        {(['provide', 'request'] as const).map((t) => (
          <TouchableOpacity key={t} style={[styles.tab, tab === t && styles.tabActive]} onPress={() => setTab(t)}>
            <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>{t === 'provide' ? 'Offerings' : 'Requests'}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? <ActivityIndicator style={{ marginTop: 40 }} color={colors.primary} /> : (
        <FlatList
          data={items}
          keyExtractor={(i) => String(i.id)}
          contentContainerStyle={{ padding: spacing.md }}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={[styles.badge, item.type === 'provide' ? styles.badgeGreen : styles.badgeBlue]}>
                  <Text style={styles.badgeText}>{item.type === 'provide' ? 'Opportunity' : 'Request'}</Text>
                </View>
                {item.amount && <Text style={styles.amount}>₹{item.amount}</Text>}
              </View>
              <Text style={styles.cardTitle}>{item.type === 'request' ? (item.applicant_name || item.title) : item.title}</Text>
              {item.trust_name && <Text style={styles.trustName}>{item.trust_name}</Text>}
              {item.description && <Text style={styles.desc} numberOfLines={2}>{item.description}</Text>}
              <View style={styles.cardFooter}>
                {item.field_of_study && <Text style={styles.meta}><Ionicons name="book-outline" size={11} /> {item.field_of_study}</Text>}
                {item.contact_email && <Text style={styles.meta}><Ionicons name="mail-outline" size={11} /> {item.contact_email}</Text>}
              </View>
            </View>
          )}
          ListEmptyComponent={<Text style={styles.empty}>No {tab === 'provide' ? 'offerings' : 'requests'} yet.</Text>}
        />
      )}

      {/* Modal */}
      <Modal visible={!!modal} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setModal(null)}>
        <ScrollView style={styles.modalScroll} keyboardShouldPersistTaps="handled">
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{modal === 'request' ? 'Request Scholarship' : 'Offer a Scholarship'}</Text>
            <TouchableOpacity onPress={() => setModal(null)}><Ionicons name="close" size={24} color={colors.text} /></TouchableOpacity>
          </View>
          <View style={styles.modalBody}>
            {modal === 'request' ? (
              <>
                {[['Applicant Full Name *', 'applicant_name'], ['Field of Study', 'field_of_study'], ['College / Institution', 'institution'], ['Amount Needed', 'amount'], ['Parent/Guardian Name', 'parent_name'], ['Parent Occupation', 'parent_occupation'], ['Parent Annual Income', 'parent_income'], ['Contact Email', 'contact_email']].map(([label, key]) => (
                  <View key={key}>
                    <Text style={styles.fieldLabel}>{label}</Text>
                    <TextInput style={styles.fieldInput} placeholder={label} value={form[key] || ''} onChangeText={setF(key)} keyboardType={key === 'contact_email' ? 'email-address' : 'default'} autoCapitalize={key === 'contact_email' ? 'none' : 'sentences'} />
                  </View>
                ))}
                <Text style={styles.fieldLabel}>Why do you need this?</Text>
                <TextInput style={[styles.fieldInput, { minHeight: 80, textAlignVertical: 'top' }]} placeholder="Describe your need…" multiline value={form.description || ''} onChangeText={setF('description')} />
              </>
            ) : (
              <>
                {[['Your Name *', 'donor_name'], ['Member ID', 'member_id'], ['Trust / Organization', 'trust_name'], ['Scholarship Title *', 'title'], ['Amount', 'amount'], ['Field of Study', 'field_of_study'], ['Institution', 'institution'], ['Application Deadline', 'deadline'], ['Contact Email', 'contact_email']].map(([label, key]) => (
                  <View key={key}>
                    <Text style={styles.fieldLabel}>{label}</Text>
                    <TextInput style={styles.fieldInput} placeholder={label} value={form[key] || ''} onChangeText={setF(key)} keyboardType={key === 'contact_email' ? 'email-address' : 'default'} autoCapitalize={key === 'contact_email' ? 'none' : 'sentences'} />
                  </View>
                ))}
                <Text style={styles.fieldLabel}>Eligibility Criteria</Text>
                <TextInput style={[styles.fieldInput, { minHeight: 80, textAlignVertical: 'top' }]} placeholder="Who can apply?" multiline value={form.eligibility || ''} onChangeText={setF('eligibility')} />
              </>
            )}
            <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit} disabled={saving}>
              <Text style={styles.submitBtnText}>{saving ? 'Submitting…' : 'Submit'}</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  menuRow: { flexDirection: 'row', padding: spacing.md, gap: 10 },
  menuTile: { flex: 1, borderRadius: radius.lg, padding: spacing.md, alignItems: 'center', borderWidth: 2 },
  requestTile: { backgroundColor: '#eff6ff', borderColor: '#bfdbfe' },
  raiseTile: { backgroundColor: '#f0fdf4', borderColor: '#bbf7d0' },
  menuTileTitle: { fontSize: 13, fontWeight: '700', color: colors.text, marginTop: 8, textAlign: 'center' },
  menuTileDesc: { fontSize: 11, color: colors.textMuted, marginTop: 2, textAlign: 'center' },
  tabs: { flexDirection: 'row', marginHorizontal: spacing.md, backgroundColor: '#f3f4f6', borderRadius: radius.md, padding: 4 },
  tab: { flex: 1, paddingVertical: 8, borderRadius: radius.sm, alignItems: 'center' },
  tabActive: { backgroundColor: colors.card, shadowColor: '#000', shadowOpacity: 0.08, elevation: 1 },
  tabText: { fontSize: 13, color: colors.textMuted, fontWeight: '600' },
  tabTextActive: { color: colors.text },
  card: { backgroundColor: colors.card, borderRadius: radius.lg, padding: spacing.md, marginBottom: 10 },
  cardHeader: { flexDirection: 'row', gap: 8, marginBottom: 6 },
  badge: { borderRadius: 99, paddingHorizontal: 8, paddingVertical: 3 },
  badgeGreen: { backgroundColor: '#dcfce7' },
  badgeBlue: { backgroundColor: '#dbeafe' },
  badgeText: { fontSize: 11, fontWeight: '700', color: colors.text },
  amount: { fontSize: 12, fontWeight: '600', color: colors.primary },
  cardTitle: { fontSize: 15, fontWeight: '600', color: colors.text },
  trustName: { fontSize: 12, color: '#7c3aed', marginTop: 2 },
  desc: { fontSize: 13, color: colors.textMuted, marginTop: 4, lineHeight: 18 },
  cardFooter: { flexDirection: 'row', gap: 12, marginTop: 6 },
  meta: { fontSize: 12, color: colors.textMuted },
  empty: { textAlign: 'center', color: colors.textMuted, marginTop: 40, fontSize: 15 },
  modalScroll: { flex: 1, backgroundColor: colors.card },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: spacing.lg, borderBottomWidth: 1, borderBottomColor: colors.border },
  modalTitle: { fontSize: 18, fontWeight: '700', color: colors.text },
  modalBody: { padding: spacing.lg, gap: 8 },
  fieldLabel: { fontSize: 13, fontWeight: '600', color: colors.text, marginBottom: 4, marginTop: 8 },
  fieldInput: { borderWidth: 1.5, borderColor: colors.border, borderRadius: radius.md, padding: 10, fontSize: 14, color: colors.text },
  submitBtn: { backgroundColor: colors.primary, borderRadius: radius.md, padding: 14, alignItems: 'center', marginTop: spacing.md },
  submitBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});
