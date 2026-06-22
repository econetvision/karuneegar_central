import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, ActivityIndicator, TouchableOpacity, Alert, TextInput, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../api/client';
import { useAuth } from '../contexts/AuthContext';
import { colors, spacing, radius } from '../theme';

interface Member { id: number; name: string; relation: string; birth_year?: string; notes?: string; children?: Member[]; }

function FamilyNode({ member, depth = 0 }: { member: Member; depth?: number }) {
  const [expanded, setExpanded] = useState(depth < 2);
  const hasChildren = member.children && member.children.length > 0;

  return (
    <View style={[styles.nodeWrapper, { marginLeft: depth * 20 }]}>
      <TouchableOpacity style={styles.node} onPress={() => hasChildren && setExpanded(!expanded)}>
        <View style={styles.nodeIcon}>
          <Ionicons name="person" size={14} color={colors.primary} />
        </View>
        <View style={styles.nodeInfo}>
          <Text style={styles.nodeName}>{member.name}</Text>
          <Text style={styles.nodeRelation}>{member.relation}{member.birth_year ? ` · b. ${member.birth_year}` : ''}</Text>
        </View>
        {hasChildren && <Ionicons name={expanded ? 'chevron-up' : 'chevron-down'} size={14} color={colors.textLight} />}
      </TouchableOpacity>
      {expanded && hasChildren && member.children!.map((child) => (
        <FamilyNode key={child.id} member={child} depth={depth + 1} />
      ))}
    </View>
  );
}

export default function FamilyTreeScreen() {
  const { user } = useAuth();
  const [tree, setTree] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ name: '', relation: '', birth_year: '', parent_id: '', notes: '' });
  const [saving, setSaving] = useState(false);

  const setF = (k: string) => (v: string) => setForm((f) => ({ ...f, [k]: v }));

  useEffect(() => {
    api.get('/family-tree').then((r) => setTree(r.data.members || [])).finally(() => setLoading(false));
  }, []);

  const handleAdd = async () => {
    if (!form.name.trim() || !form.relation.trim()) {
      Alert.alert('Error', 'Name and relation are required.');
      return;
    }
    setSaving(true);
    try {
      const r = await api.post('/family-tree', form);
      setTree((prev) => [...prev, r.data.member]);
      setModal(false);
      setForm({ name: '', relation: '', birth_year: '', parent_id: '', notes: '' });
    } catch {
      Alert.alert('Error', 'Failed to add member.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <ActivityIndicator style={{ flex: 1 }} color={colors.primary} />;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Family Tree</Text>
        {user && (
          <TouchableOpacity style={styles.addBtn} onPress={() => setModal(true)}>
            <Ionicons name="add" size={18} color="#fff" />
            <Text style={styles.addBtnText}>Add Member</Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView contentContainerStyle={styles.treeContainer}>
        {tree.length === 0
          ? <Text style={styles.empty}>No family members added yet.{'\n'}Tap "Add Member" to start building your tree.</Text>
          : tree.map((m) => <FamilyNode key={m.id} member={m} />)}
      </ScrollView>

      <Modal visible={modal} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setModal(false)}>
        <ScrollView style={styles.modalScroll} keyboardShouldPersistTaps="handled">
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Add Family Member</Text>
            <TouchableOpacity onPress={() => setModal(false)}><Ionicons name="close" size={24} color={colors.text} /></TouchableOpacity>
          </View>
          <View style={styles.modalBody}>
            {([['Name *', 'name'], ['Relation *', 'relation'], ['Birth Year', 'birth_year', 'numeric'], ['Parent ID (optional)', 'parent_id', 'numeric'], ['Notes', 'notes']] as [string, string, string?][]).map(([label, key, kbType]) => (
              <View key={key}>
                <Text style={styles.fieldLabel}>{label}</Text>
                <TextInput style={styles.fieldInput} placeholder={label.replace(' *', '')} value={(form as any)[key] || ''} onChangeText={setF(key)} keyboardType={(kbType as any) || 'default'} />
              </View>
            ))}
            <TouchableOpacity style={styles.submitBtn} onPress={handleAdd} disabled={saving}>
              <Text style={styles.submitBtnText}>{saving ? 'Adding…' : 'Add Member'}</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: spacing.md },
  headerTitle: { fontSize: 18, fontWeight: '700', color: colors.text },
  addBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: colors.primary, borderRadius: radius.md, paddingVertical: 8, paddingHorizontal: 14 },
  addBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  treeContainer: { padding: spacing.md },
  nodeWrapper: { marginBottom: 6 },
  node: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.card, borderRadius: radius.md, padding: 10, gap: 10 },
  nodeIcon: { width: 30, height: 30, borderRadius: 15, backgroundColor: '#fff7ed', alignItems: 'center', justifyContent: 'center' },
  nodeInfo: { flex: 1 },
  nodeName: { fontSize: 14, fontWeight: '600', color: colors.text },
  nodeRelation: { fontSize: 12, color: colors.textMuted },
  empty: { textAlign: 'center', color: colors.textMuted, marginTop: 60, fontSize: 15, lineHeight: 24 },
  modalScroll: { flex: 1, backgroundColor: colors.card },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: spacing.lg, borderBottomWidth: 1, borderBottomColor: colors.border },
  modalTitle: { fontSize: 18, fontWeight: '700', color: colors.text },
  modalBody: { padding: spacing.lg, gap: 8 },
  fieldLabel: { fontSize: 13, fontWeight: '600', color: colors.text, marginBottom: 4, marginTop: 8 },
  fieldInput: { borderWidth: 1.5, borderColor: colors.border, borderRadius: radius.md, padding: 10, fontSize: 14, color: colors.text },
  submitBtn: { backgroundColor: colors.primary, borderRadius: radius.md, padding: 14, alignItems: 'center', marginTop: spacing.md },
  submitBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});
