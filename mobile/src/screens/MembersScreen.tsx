import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, FlatList, TextInput, TouchableOpacity, Image, StyleSheet,
  ActivityIndicator, Alert, Modal, ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api, { uploadUrl } from '../api/client';
import { useAuth } from '../contexts/AuthContext';
import { colors, spacing, radius } from '../theme';

interface Member {
  id: number;
  username: string;
  email?: string;
  member_id: string | null;
  is_admin?: boolean;
  created_at?: string;
  profile: { full_name?: string; location?: string; occupation?: string; photo_filename?: string; is_public?: boolean } | null;
}

const EMPTY_FORM = { username: '', email: '', password: '', full_name: '', member_id: '' };

export default function MembersScreen({ navigation }: any) {
  const { user } = useAuth();
  const isAdmin = !!user?.is_admin;

  // Public members
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  // Admin members
  const [adminMembers, setAdminMembers] = useState<Member[]>([]);
  const [adminLoading, setAdminLoading] = useState(false);
  const [adminSearch, setAdminSearch] = useState('');
  const [adminTotal, setAdminTotal] = useState(0);
  const [showAddModal, setShowAddModal] = useState(false);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [showAdminView, setShowAdminView] = useState(false);

  // --- Public members fetch ---
  const fetchMembers = useCallback(async (p = 1, q = '') => {
    try {
      const r = await api.get('/members', { params: { page: p, q } });
      const data: Member[] = r.data.members;
      if (p === 1) setMembers(data);
      else setMembers((prev) => [...prev, ...data]);
      setHasMore(r.data.page < r.data.pages);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  useEffect(() => { setLoading(true); setPage(1); fetchMembers(1, search); }, [search]);

  const loadMore = () => {
    if (!hasMore || loadingMore) return;
    const next = page + 1;
    setPage(next);
    setLoadingMore(true);
    fetchMembers(next, search);
  };

  // --- Admin members fetch ---
  const fetchAdminMembers = useCallback(async (q = '') => {
    if (!isAdmin) return;
    setAdminLoading(true);
    try {
      const r = await api.get('/admin/members', { params: q ? { q } : {} });
      setAdminMembers(r.data.members);
      setAdminTotal(r.data.total);
    } catch { /* silent */ }
    finally { setAdminLoading(false); }
  }, [isAdmin]);

  useEffect(() => {
    if (isAdmin && showAdminView) fetchAdminMembers('');
  }, [isAdmin, showAdminView]);

  // debounce admin search
  useEffect(() => {
    if (!showAdminView) return;
    const t = setTimeout(() => fetchAdminMembers(adminSearch), 400);
    return () => clearTimeout(t);
  }, [adminSearch, showAdminView]);

  const handleAdd = async () => {
    if (!form.username.trim() || !form.email.trim() || !form.password.trim()) {
      setFormError('Username, email and password are required.');
      return;
    }
    setSaving(true);
    setFormError('');
    try {
      await api.post('/admin/members', form);
      setShowAddModal(false);
      setForm({ ...EMPTY_FORM });
      fetchAdminMembers(adminSearch);
      Alert.alert('Done', 'Member account created successfully.');
    } catch (err: any) {
      setFormError(err.response?.data?.error || 'Failed to create member.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (uid: number, name: string) => {
    Alert.alert('Delete Member', `Delete account for "${name}"? This cannot be undone.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          try {
            await api.delete(`/admin/members/${uid}`);
            setAdminMembers((prev) => prev.filter((m) => m.id !== uid));
            setAdminTotal((n) => n - 1);
          } catch (err: any) {
            Alert.alert('Error', err.response?.data?.error || 'Failed to delete.');
          }
        },
      },
    ]);
  };

  // ── Public member row ──
  const renderItem = ({ item }: { item: Member }) => {
    const name = item.profile?.full_name || item.username;
    const photo = item.profile?.photo_filename ? uploadUrl(item.profile.photo_filename) : null;
    return (
      <TouchableOpacity style={styles.card} onPress={() => navigation.navigate('Profile', { username: item.username })}>
        <View style={styles.avatar}>
          {photo
            ? <Image source={{ uri: photo }} style={styles.avatarImg} />
            : <Text style={styles.avatarInitial}>{name[0]?.toUpperCase()}</Text>}
        </View>
        <View style={styles.info}>
          <Text style={styles.name}>{name}</Text>
          {item.member_id && <Text style={styles.memberId}>{item.member_id}</Text>}
          <Text style={styles.username}>@{item.username}</Text>
          {item.profile?.location && (
            <Text style={styles.meta}><Ionicons name="location-outline" size={11} /> {item.profile.location}</Text>
          )}
        </View>
        <Ionicons name="chevron-forward" size={18} color={colors.textLight} />
      </TouchableOpacity>
    );
  };

  // ── Admin member row ──
  const renderAdminItem = ({ item }: { item: Member }) => {
    const name = item.profile?.full_name || item.username;
    const photo = item.profile?.photo_filename ? uploadUrl(item.profile.photo_filename) : null;
    return (
      <View style={styles.adminCard}>
        <View style={styles.avatar}>
          {photo
            ? <Image source={{ uri: photo }} style={styles.avatarImg} />
            : <Text style={styles.avatarInitial}>{name[0]?.toUpperCase()}</Text>}
        </View>
        <View style={styles.adminInfo}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Text style={styles.name}>{name}</Text>
            {item.is_admin && (
              <View style={styles.adminBadge}><Text style={styles.adminBadgeText}>Admin</Text></View>
            )}
          </View>
          <Text style={styles.username}>@{item.username}</Text>
          {item.email && <Text style={styles.adminEmail}>{item.email}</Text>}
          {item.member_id && <Text style={styles.memberId}>{item.member_id}</Text>}
          <View style={styles.visRow}>
            <Ionicons
              name={item.profile?.is_public ? 'eye-outline' : 'eye-off-outline'}
              size={12} color={item.profile?.is_public ? '#16a34a' : colors.textMuted}
            />
            <Text style={[styles.visText, item.profile?.is_public && { color: '#16a34a' }]}>
              {item.profile?.is_public === true ? 'Public' : item.profile?.is_public === false ? 'Private' : 'No profile'}
            </Text>
          </View>
        </View>
        {item.id !== user?.id && (
          <TouchableOpacity onPress={() => handleDelete(item.id, name)} style={styles.deleteBtn}>
            <Ionicons name="trash-outline" size={18} color={colors.error} />
          </TouchableOpacity>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Admin toggle */}
      {isAdmin && (
        <View style={styles.adminToggleBar}>
          <TouchableOpacity
            style={[styles.adminToggleBtn, !showAdminView && styles.adminToggleBtnActive]}
            onPress={() => setShowAdminView(false)}
          >
            <Text style={[styles.adminToggleText, !showAdminView && styles.adminToggleTextActive]}>Community</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.adminToggleBtn, showAdminView && styles.adminToggleBtnActive]}
            onPress={() => setShowAdminView(true)}
          >
            <Ionicons name="shield-outline" size={14} color={showAdminView ? colors.primary : colors.textMuted} />
            <Text style={[styles.adminToggleText, showAdminView && styles.adminToggleTextActive]}>
              Admin {adminTotal > 0 ? `(${adminTotal})` : ''}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* ── Admin View ── */}
      {isAdmin && showAdminView ? (
        <View style={{ flex: 1 }}>
          <View style={styles.adminHeader}>
            <View style={styles.searchBox}>
              <Ionicons name="search-outline" size={16} color={colors.textMuted} style={{ marginRight: 6 }} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search by username, email, ID…"
                value={adminSearch}
                onChangeText={setAdminSearch}
              />
            </View>
            <TouchableOpacity
              style={styles.addBtn}
              onPress={() => { setShowAddModal(true); setFormError(''); setForm({ ...EMPTY_FORM }); }}
            >
              <Ionicons name="add" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
          {adminLoading ? (
            <ActivityIndicator style={{ marginTop: 40 }} color={colors.primary} />
          ) : (
            <FlatList
              data={adminMembers}
              keyExtractor={(i) => String(i.id)}
              renderItem={renderAdminItem}
              contentContainerStyle={{ padding: spacing.md, gap: 8 }}
              ListEmptyComponent={<Text style={styles.empty}>No members found.</Text>}
            />
          )}
        </View>
      ) : (
        /* ── Public View ── */
        <View style={{ flex: 1 }}>
          <View style={styles.searchBox}>
            <Ionicons name="search-outline" size={18} color={colors.textMuted} style={{ marginRight: 8 }} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search members…"
              value={search}
              onChangeText={setSearch}
              returnKeyType="search"
            />
          </View>
          {loading ? (
            <ActivityIndicator style={{ marginTop: 40 }} color={colors.primary} />
          ) : (
            <FlatList
              data={members}
              keyExtractor={(i) => String(i.id)}
              renderItem={renderItem}
              contentContainerStyle={{ padding: spacing.md }}
              onEndReached={loadMore}
              onEndReachedThreshold={0.3}
              ListFooterComponent={loadingMore ? <ActivityIndicator color={colors.primary} style={{ padding: 16 }} /> : null}
              ListEmptyComponent={<Text style={styles.empty}>No members found.</Text>}
            />
          )}
        </View>
      )}

      {/* ── Add Member Modal ── */}
      <Modal visible={showAddModal} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.modal}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Add Member</Text>
            <TouchableOpacity onPress={() => setShowAddModal(false)}>
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.modalBody} keyboardShouldPersistTaps="handled">
            {!!formError && (
              <View style={styles.errorBox}>
                <Ionicons name="alert-circle-outline" size={15} color={colors.error} />
                <Text style={styles.errorText}>{formError}</Text>
              </View>
            )}
            <Text style={styles.label}>Full Name</Text>
            <TextInput style={styles.input} placeholder="e.g. Arjun Karuneegar" value={form.full_name} onChangeText={(v) => setForm((f) => ({ ...f, full_name: v }))} />

            <Text style={styles.label}>Username *</Text>
            <TextInput style={styles.input} placeholder="lowercase letters/digits" autoCapitalize="none"
              value={form.username} onChangeText={(v) => setForm((f) => ({ ...f, username: v.toLowerCase() }))} />

            <Text style={styles.label}>Member ID</Text>
            <TextInput style={styles.input} placeholder="e.g. KN-0042" value={form.member_id} onChangeText={(v) => setForm((f) => ({ ...f, member_id: v }))} />

            <Text style={styles.label}>Email *</Text>
            <TextInput style={styles.input} placeholder="member@example.com" keyboardType="email-address"
              autoCapitalize="none" value={form.email} onChangeText={(v) => setForm((f) => ({ ...f, email: v }))} />

            <Text style={styles.label}>Password *</Text>
            <TextInput style={styles.input} placeholder="Temporary password" secureTextEntry
              value={form.password} onChangeText={(v) => setForm((f) => ({ ...f, password: v }))} />

            <TouchableOpacity style={[styles.submitBtn, saving && { opacity: 0.6 }]} onPress={handleAdd} disabled={saving}>
              {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitBtnText}>Create Account</Text>}
            </TouchableOpacity>
            <View style={{ height: 40 }} />
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container:            { flex: 1, backgroundColor: colors.background },
  adminToggleBar:       { flexDirection: 'row', margin: spacing.md, marginBottom: 0, backgroundColor: colors.card, borderRadius: radius.lg, padding: 4, borderWidth: 1, borderColor: colors.border },
  adminToggleBtn:       { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, paddingVertical: 8, borderRadius: radius.md },
  adminToggleBtnActive: { backgroundColor: '#fff7ed' },
  adminToggleText:      { fontSize: 13, fontWeight: '600', color: colors.textMuted },
  adminToggleTextActive: { color: colors.primary },
  adminHeader:          { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: spacing.md, paddingTop: spacing.md },
  addBtn:               { width: 42, height: 42, borderRadius: radius.md, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  searchBox:            { flex: 1, flexDirection: 'row', alignItems: 'center', margin: spacing.md, backgroundColor: colors.card, borderRadius: radius.md, paddingHorizontal: 12, borderWidth: 1, borderColor: colors.border },
  searchInput:          { flex: 1, paddingVertical: 10, fontSize: 15, color: colors.text },
  card:                 { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.card, borderRadius: radius.lg, padding: spacing.md, marginBottom: 10, shadowColor: '#000', shadowOpacity: 0.04, elevation: 1 },
  adminCard:            { flexDirection: 'row', alignItems: 'flex-start', backgroundColor: colors.card, borderRadius: radius.lg, padding: spacing.md, borderWidth: 1, borderColor: colors.border },
  avatar:               { width: 48, height: 48, borderRadius: 24, backgroundColor: colors.primaryLight, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  avatarImg:            { width: 48, height: 48, borderRadius: 24 },
  avatarInitial:        { fontSize: 20, fontWeight: '700', color: colors.primary },
  info:                 { flex: 1 },
  adminInfo:            { flex: 1, gap: 2 },
  name:                 { fontSize: 15, fontWeight: '600', color: colors.text },
  memberId:             { fontSize: 12, color: colors.primary, fontWeight: '600' },
  username:             { fontSize: 12, color: colors.textMuted },
  meta:                 { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  adminEmail:           { fontSize: 12, color: colors.textMuted },
  adminBadge:           { backgroundColor: '#fff7ed', borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 },
  adminBadgeText:       { fontSize: 10, fontWeight: '700', color: colors.primary },
  visRow:               { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  visText:              { fontSize: 11, color: colors.textMuted },
  deleteBtn:            { padding: 6 },
  empty:                { textAlign: 'center', color: colors.textMuted, marginTop: 40, fontSize: 15 },
  modal:                { flex: 1, backgroundColor: colors.background },
  modalHeader:          { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border },
  modalTitle:           { fontSize: 18, fontWeight: '700', color: colors.text },
  modalBody:            { padding: spacing.md },
  label:                { fontSize: 13, fontWeight: '600', color: colors.text, marginBottom: 4, marginTop: 12 },
  input:                { borderWidth: 1.5, borderColor: colors.border, borderRadius: radius.md, padding: 10, fontSize: 14, color: colors.text, backgroundColor: '#fafaf9' },
  errorBox:             { flexDirection: 'row', alignItems: 'flex-start', gap: 6, backgroundColor: '#fef2f2', borderRadius: radius.md, padding: 10, borderWidth: 1, borderColor: '#fecaca', marginBottom: 8 },
  errorText:            { flex: 1, fontSize: 13, color: colors.error },
  submitBtn:            { backgroundColor: colors.primary, borderRadius: radius.md, padding: 14, alignItems: 'center', marginTop: spacing.lg },
  submitBtnText:        { color: '#fff', fontWeight: '700', fontSize: 16 },
});
