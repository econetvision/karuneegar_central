import React, { useEffect, useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, Image, StyleSheet,
  Alert, ActivityIndicator, Modal, TextInput, ScrollView, Switch,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import api, { uploadUrl } from '../api/client';
import { useAuth } from '../contexts/AuthContext';
import { colors, spacing, radius } from '../theme';

interface EventItem {
  id: number;
  title: string;
  description?: string;
  event_date?: string;
  contact_no?: string;
  organizer_name?: string;
  donate_url?: string;
  register_url?: string;
  media_filename?: string;
  media_type?: string;
  show_on_home?: boolean;
  poster_username: string;
  poster_name?: string;
  created_at: string;
}

const EMPTY = {
  title: '', description: '', event_date: '',
  contact_no: '', organizer_name: '', donate_url: '', register_url: '',
  media_filename: '', media_type: 'photo', show_on_home: false,
};

export default function EventsScreen({ navigation }: any) {
  const { user } = useAuth();
  const [items, setItems] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ ...EMPTY });
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [subscribed, setSubscribed] = useState(false);
  const [subLoading, setSubLoading] = useState(false);

  const fetchItems = () => {
    setLoading(true);
    api.get('/events')
      .then((r) => setItems(r.data.events))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchItems();
    if (user) {
      api.get('/events/subscription').then((r) => setSubscribed(r.data.subscribed)).catch(() => {});
    }
  }, []);

  const toggleSubscription = async () => {
    setSubLoading(true);
    try {
      if (subscribed) {
        await api.delete('/events/subscribe');
        setSubscribed(false);
        Alert.alert('Unsubscribed', 'You will no longer receive event notifications.');
      } else {
        await api.post('/events/subscribe');
        setSubscribed(true);
        Alert.alert('Subscribed!', 'You will be notified when new events are posted.');
      }
    } catch {
      Alert.alert('Error', 'Could not update subscription. Please try again.');
    } finally {
      setSubLoading(false);
    }
  };

  const setF = (k: string) => (v: string) => setForm((f) => ({ ...f, [k]: v }));

  const pickMedia = async (type: 'photo' | 'video') => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: type === 'video' ? ['videos'] as any : ['images'] as any,
      quality: 0.8,
    });
    if (result.canceled || !result.assets.length) return;
    const asset = result.assets[0];
    setUploading(true);
    try {
      const fd = new FormData();
      const mimeType = type === 'video'
        ? (asset.mimeType || 'video/mp4')
        : (asset.mimeType || 'image/jpeg');
      const ext = type === 'video' ? 'mp4' : 'jpg';
      fd.append('file', { uri: asset.uri, name: asset.fileName || `media.${ext}`, type: mimeType } as any);
      const r = await api.post('/upload', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setForm((f) => ({ ...f, media_filename: r.data.filename, media_type: r.data.media_type || type }));
    } catch {
      Alert.alert('Upload Failed', 'Could not upload media. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async () => {
    if (!form.title.trim()) { Alert.alert('Error', 'Event name is required.'); return; }
    setSaving(true);
    try {
      await api.post('/events', form);
      setShowForm(false);
      setForm({ ...EMPTY });
      fetchItems();
      Alert.alert('Posted!', 'Your event has been published.');
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.error || 'Failed to post event.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (id: number) => {
    Alert.alert('Delete Event', 'Remove this event?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          await api.delete(`/events/${id}`);
          fetchItems();
        },
      },
    ]);
  };

  const fmtDate = (d?: string) => {
    if (!d) return null;
    try { return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }); } catch { return d; }
  };

  const renderItem = ({ item }: { item: EventItem }) => {
    const isOwn = user?.username === item.poster_username;
    const mediaUrl = item.media_filename ? uploadUrl(item.media_filename) : null;
    return (
      <TouchableOpacity style={styles.card} onPress={() => navigation.navigate('EventView', { id: item.id })}>
        {mediaUrl ? (
          <View style={styles.mediaBox}>
            <Image source={{ uri: mediaUrl }} style={styles.cardMedia} resizeMode="cover" />
            {item.media_type === 'video' && (
              <View style={styles.playOverlay}>
                <Ionicons name="play-circle" size={40} color="rgba(255,255,255,0.9)" />
              </View>
            )}
          </View>
        ) : (
          <View style={styles.mediaPlaceholder}>
            <Ionicons name="calendar-outline" size={40} color="#d97706" />
          </View>
        )}
        <View style={styles.cardBody}>
          <Text style={styles.cardTitle} numberOfLines={2}>{item.title}</Text>
          {item.event_date && (
            <View style={styles.metaRow}>
              <Ionicons name="calendar-outline" size={13} color={colors.primary} />
              <Text style={styles.metaText}>{fmtDate(item.event_date)}</Text>
            </View>
          )}
          {item.organizer_name && (
            <View style={styles.metaRow}>
              <Ionicons name="person-outline" size={13} color={colors.primary} />
              <Text style={styles.metaText}>{item.organizer_name}</Text>
            </View>
          )}
          {item.contact_no && (
            <View style={styles.metaRow}>
              <Ionicons name="call-outline" size={13} color={colors.primary} />
              <Text style={styles.metaText}>{item.contact_no}</Text>
            </View>
          )}
          <View style={styles.pillRow}>
            {item.donate_url ? <View style={styles.pill}><Text style={styles.pillText}>Donate</Text></View> : null}
            {item.register_url ? <View style={[styles.pill, styles.pillGreen]}><Text style={[styles.pillText, { color: '#16a34a' }]}>Register</Text></View> : null}
            {item.show_on_home ? <View style={[styles.pill, styles.pillAmber]}><Text style={[styles.pillText, { color: '#b45309' }]}>Featured</Text></View> : null}
          </View>
          {isOwn && (
            <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDelete(item.id)}>
              <Ionicons name="trash-outline" size={14} color={colors.error} />
              <Text style={styles.deleteBtnText}>Delete</Text>
            </TouchableOpacity>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.heading}>🎉 Events</Text>
          <Text style={styles.subheading}>Community events & gatherings</Text>
        </View>
        {user && (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <TouchableOpacity
              style={[styles.bellBtn, subscribed && styles.bellBtnActive]}
              onPress={toggleSubscription}
              disabled={subLoading}
            >
              <Ionicons
                name={subscribed ? 'notifications' : 'notifications-outline'}
                size={18}
                color={subscribed ? colors.primary : colors.textMuted}
              />
            </TouchableOpacity>
            <TouchableOpacity style={styles.addBtn} onPress={() => setShowForm(true)}>
              <Ionicons name="add" size={20} color="#fff" />
              <Text style={styles.addBtnText}>Post Event</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {loading ? (
        <ActivityIndicator style={{ flex: 1 }} color={colors.primary} />
      ) : items.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyEmoji}>🎉</Text>
          <Text style={styles.emptyTitle}>No events yet</Text>
          <Text style={styles.emptyDesc}>Be the first to post a community event!</Text>
          {user && (
            <TouchableOpacity style={styles.addBtn} onPress={() => setShowForm(true)}>
              <Text style={styles.addBtnText}>Post an Event</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(i) => String(i.id)}
          renderItem={renderItem}
          contentContainerStyle={{ padding: spacing.md, gap: 12 }}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Create Modal */}
      <Modal visible={showForm} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.modal}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Post an Event</Text>
            <TouchableOpacity onPress={() => setShowForm(false)}>
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.modalBody} keyboardShouldPersistTaps="handled">

            {/* Media picker */}
            <View style={styles.mediaBtnRow}>
              <TouchableOpacity style={styles.mediaPickBtn} onPress={() => pickMedia('photo')} disabled={uploading}>
                <Ionicons name="image-outline" size={20} color={colors.primary} />
                <Text style={styles.mediaPickText}>Photo</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.mediaPickBtn} onPress={() => pickMedia('video')} disabled={uploading}>
                <Ionicons name="videocam-outline" size={20} color="#7c3aed" />
                <Text style={[styles.mediaPickText, { color: '#7c3aed' }]}>Video</Text>
              </TouchableOpacity>
            </View>

            {form.media_filename ? (
              <View style={styles.previewBox}>
                {form.media_type === 'video' ? (
                  <View style={styles.videoPreview}>
                    <Ionicons name="play-circle" size={48} color={colors.primary} />
                    <Text style={styles.videoPreviewText}>Video selected</Text>
                  </View>
                ) : (
                  <Image source={{ uri: uploadUrl(form.media_filename) }} style={styles.previewImg} />
                )}
                <TouchableOpacity style={styles.clearMedia} onPress={() => setForm((f) => ({ ...f, media_filename: '', media_type: 'photo' }))}>
                  <Ionicons name="close-circle" size={22} color={colors.error} />
                </TouchableOpacity>
              </View>
            ) : uploading ? (
              <View style={styles.previewBox}>
                <ActivityIndicator color={colors.primary} />
                <Text style={{ color: colors.textMuted, marginTop: 8 }}>Uploading…</Text>
              </View>
            ) : null}

            <Text style={styles.label}>Event Name *</Text>
            <TextInput style={styles.input} placeholder="e.g. Annual Temple Festival 2026" value={form.title} onChangeText={setF('title')} />

            <Text style={styles.label}>Event Date</Text>
            <TextInput style={styles.input} placeholder="YYYY-MM-DD" value={form.event_date} onChangeText={setF('event_date')} />

            <Text style={styles.label}>Contact Number</Text>
            <TextInput style={styles.input} placeholder="+919876543210" keyboardType="phone-pad" value={form.contact_no} onChangeText={setF('contact_no')} />

            <Text style={styles.label}>Organizer Name</Text>
            <TextInput style={styles.input} placeholder="e.g. Sri Karuneegar Seva Trust" value={form.organizer_name} onChangeText={setF('organizer_name')} />

            <Text style={styles.label}>Description</Text>
            <TextInput
              style={[styles.input, { minHeight: 80, textAlignVertical: 'top' }]}
              placeholder="Event details, venue, programme…"
              multiline
              value={form.description}
              onChangeText={setF('description')}
            />

            <Text style={styles.label}>Donation Link (optional)</Text>
            <TextInput style={styles.input} placeholder="https://…" keyboardType="url" autoCapitalize="none" value={form.donate_url} onChangeText={setF('donate_url')} />

            <Text style={styles.label}>Registration Link (optional)</Text>
            <TextInput style={styles.input} placeholder="https://…" keyboardType="url" autoCapitalize="none" value={form.register_url} onChangeText={setF('register_url')} />

            <View style={styles.switchRow}>
              <View>
                <Text style={styles.switchLabel}>Show on Home Page</Text>
                <Text style={styles.switchDesc}>Feature this event in the home carousel</Text>
              </View>
              <Switch
                value={form.show_on_home}
                onValueChange={(v) => setForm((f) => ({ ...f, show_on_home: v }))}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor="#fff"
              />
            </View>

            <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit} disabled={saving || uploading}>
              {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitBtnText}>Publish Event</Text>}
            </TouchableOpacity>
            <View style={{ height: 40 }} />
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container:      { flex: 1, backgroundColor: colors.background },
  header:         { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: spacing.md, paddingBottom: 8 },
  heading:        { fontSize: 20, fontWeight: '700', color: colors.text },
  subheading:     { fontSize: 13, color: colors.textMuted, marginTop: 2 },
  addBtn:         { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: colors.primary, borderRadius: radius.md, paddingVertical: 8, paddingHorizontal: 14 },
  addBtnText:     { color: '#fff', fontWeight: '700', fontSize: 14 },
  empty:          { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl },
  emptyEmoji:     { fontSize: 56, marginBottom: spacing.md },
  emptyTitle:     { fontSize: 18, fontWeight: '700', color: colors.text, marginBottom: 8 },
  emptyDesc:      { fontSize: 14, color: colors.textMuted, textAlign: 'center', marginBottom: spacing.lg },
  card:           { backgroundColor: colors.card, borderRadius: radius.lg, overflow: 'hidden', elevation: 1, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4 },
  mediaBox:       { position: 'relative' },
  cardMedia:      { width: '100%', height: 160 },
  playOverlay:    { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.25)' },
  mediaPlaceholder: { width: '100%', height: 100, backgroundColor: '#fffbeb', alignItems: 'center', justifyContent: 'center' },
  cardBody:       { padding: spacing.md },
  cardTitle:      { fontSize: 16, fontWeight: '700', color: colors.text, marginBottom: 8 },
  metaRow:        { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 4 },
  metaText:       { fontSize: 13, color: colors.textMuted },
  pillRow:        { flexDirection: 'row', gap: 6, marginTop: 6, flexWrap: 'wrap' },
  pill:           { backgroundColor: '#eff6ff', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 3 },
  pillText:       { fontSize: 11, fontWeight: '600', color: '#3b82f6' },
  pillGreen:      { backgroundColor: '#f0fdf4' },
  pillAmber:      { backgroundColor: '#fffbeb' },
  deleteBtn:      { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 8, alignSelf: 'flex-start' },
  deleteBtnText:  { fontSize: 12, color: colors.error },
  modal:          { flex: 1, backgroundColor: colors.background },
  modalHeader:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border },
  modalTitle:     { fontSize: 18, fontWeight: '700', color: colors.text },
  modalBody:      { padding: spacing.md },
  mediaBtnRow:    { flexDirection: 'row', gap: 12, marginBottom: spacing.md },
  mediaPickBtn:   { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, borderWidth: 1.5, borderColor: colors.border, borderRadius: radius.md, padding: 12 },
  mediaPickText:  { fontSize: 14, fontWeight: '600', color: colors.primary },
  previewBox:     { height: 140, borderRadius: radius.md, overflow: 'hidden', backgroundColor: '#f3f4f6', alignItems: 'center', justifyContent: 'center', marginBottom: spacing.md, position: 'relative' },
  previewImg:     { width: '100%', height: '100%' },
  videoPreview:   { alignItems: 'center', gap: 8 },
  videoPreviewText: { fontSize: 13, color: colors.textMuted },
  clearMedia:     { position: 'absolute', top: 6, right: 6 },
  label:          { fontSize: 13, fontWeight: '600', color: colors.text, marginBottom: 4, marginTop: 10 },
  input:          { borderWidth: 1.5, borderColor: colors.border, borderRadius: radius.md, padding: 10, fontSize: 14, color: colors.text, backgroundColor: '#fafaf9' },
  switchRow:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: spacing.md, backgroundColor: colors.card, borderRadius: radius.md, padding: spacing.md },
  switchLabel:    { fontSize: 14, fontWeight: '600', color: colors.text },
  switchDesc:     { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  submitBtn:      { backgroundColor: colors.primary, borderRadius: radius.md, padding: 14, alignItems: 'center', marginTop: spacing.lg },
  submitBtnText:  { color: '#fff', fontWeight: '700', fontSize: 16 },
  bellBtn:        { width: 38, height: 38, borderRadius: 19, borderWidth: 1.5, borderColor: colors.border, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.card },
  bellBtnActive:  { borderColor: colors.primary, backgroundColor: '#fff7ed' },
});
