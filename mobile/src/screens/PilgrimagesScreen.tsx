import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, FlatList, TouchableOpacity,
  Image, StyleSheet, Alert, ActivityIndicator, Modal,
  TextInput, Platform,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import api, { uploadUrl } from '../api/client';
import { useAuth } from '../contexts/AuthContext';
import { colors, spacing, radius } from '../theme';

interface PilgrimageItem {
  id: number;
  title: string;
  destination: string;
  description?: string;
  start_date?: string;
  end_date?: string;
  cost?: string;
  capacity?: number;
  organizer_name?: string;
  organizer_mobile?: string;
  photo_filename?: string;
  poster_username: string;
  poster_name?: string;
  created_at: string;
}

const EMPTY = {
  title: '', destination: '', description: '', itinerary: '',
  start_date: '', end_date: '', cost: '', capacity: '',
  organizer_name: '', organizer_mobile: '', photo_filename: '',
};

export default function PilgrimagesScreen({ navigation }: any) {
  const { user } = useAuth();
  const [items, setItems] = useState<PilgrimageItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ ...EMPTY });
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const fetchItems = () => {
    setLoading(true);
    api.get('/pilgrimages')
      .then((r) => setItems(r.data.pilgrimages))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchItems(); }, []);

  const setF = (k: string) => (v: string) => setForm((f) => ({ ...f, [k]: v }));

  const pickPhoto = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'] as any,
      quality: 0.8,
    });
    if (result.canceled || !result.assets.length) return;
    const asset = result.assets[0];
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', { uri: asset.uri, name: asset.fileName || 'photo.jpg', type: asset.mimeType || 'image/jpeg' } as any);
      const r = await api.post('/upload', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setForm((f) => ({ ...f, photo_filename: r.data.filename }));
    } catch {
      Alert.alert('Upload Failed', 'Could not upload photo. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async () => {
    if (!form.title.trim()) { Alert.alert('Error', 'Trip title is required.'); return; }
    if (!form.destination.trim()) { Alert.alert('Error', 'Destination is required.'); return; }
    setSaving(true);
    try {
      await api.post('/pilgrimages', {
        ...form,
        capacity: form.capacity ? parseInt(form.capacity) : null,
      });
      setShowForm(false);
      setForm({ ...EMPTY });
      fetchItems();
      Alert.alert('Posted!', 'Your pilgrimage trip has been posted.');
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.error || 'Failed to post trip.');
    } finally {
      setSaving(false);
    }
  };

  const formatDateRange = (start?: string, end?: string) => {
    if (!start && !end) return null;
    const fmt = (d: string) => new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
    if (start && end && start !== end) return `${fmt(start)} – ${fmt(end)}`;
    return start ? fmt(start) : fmt(end!);
  };

  const renderItem = ({ item }: { item: PilgrimageItem }) => (
    <TouchableOpacity style={styles.card} onPress={() => navigation.navigate('PilgrimageView', { id: item.id })}>
      {item.photo_filename ? (
        <Image source={{ uri: uploadUrl(item.photo_filename) }} style={styles.photo} />
      ) : (
        <View style={styles.photoPlaceholder}>
          <Text style={styles.photoEmoji}>🛕</Text>
        </View>
      )}
      <View style={styles.cardBody}>
        <Text style={styles.cardTitle} numberOfLines={2}>{item.title}</Text>
        <View style={styles.metaRow}>
          <Ionicons name="location-outline" size={13} color={colors.primary} />
          <Text style={styles.metaText}>{item.destination}</Text>
        </View>
        {(item.start_date || item.end_date) && (
          <View style={styles.metaRow}>
            <Ionicons name="calendar-outline" size={13} color={colors.primary} />
            <Text style={styles.metaText}>{formatDateRange(item.start_date, item.end_date)}</Text>
          </View>
        )}
        {item.cost && (
          <View style={styles.metaRow}>
            <Ionicons name="cash-outline" size={13} color={colors.primary} />
            <Text style={styles.metaText}>{item.cost} per person</Text>
          </View>
        )}
        {item.organizer_name && (
          <Text style={styles.organizer}>{item.organizer_name}</Text>
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.heading}>🛕 Pilgrimages</Text>
          <Text style={styles.subheading}>Community bhakti trips</Text>
        </View>
        {user && (
          <TouchableOpacity style={styles.addBtn} onPress={() => setShowForm(true)}>
            <Ionicons name="add" size={20} color="#fff" />
            <Text style={styles.addBtnText}>Post Trip</Text>
          </TouchableOpacity>
        )}
      </View>

      {loading ? (
        <ActivityIndicator style={{ flex: 1 }} color={colors.primary} />
      ) : items.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyEmoji}>🛕</Text>
          <Text style={styles.emptyTitle}>No trips posted yet</Text>
          <Text style={styles.emptyDesc}>Be the first to organise a community pilgrimage!</Text>
          {user && (
            <TouchableOpacity style={styles.addBtn} onPress={() => setShowForm(true)}>
              <Text style={styles.addBtnText}>Post a Trip</Text>
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
            <Text style={styles.modalTitle}>Post a Pilgrimage Trip</Text>
            <TouchableOpacity onPress={() => setShowForm(false)}>
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.modalBody} keyboardShouldPersistTaps="handled">
            {/* Photo */}
            <TouchableOpacity style={styles.photoUpload} onPress={pickPhoto} disabled={uploading}>
              {form.photo_filename ? (
                <Image source={{ uri: uploadUrl(form.photo_filename) }} style={styles.uploadedPhoto} />
              ) : (
                <>
                  <Ionicons name="image-outline" size={32} color={colors.textMuted} />
                  <Text style={styles.photoUploadText}>{uploading ? 'Uploading…' : 'Upload Trip Photo / Poster'}</Text>
                </>
              )}
            </TouchableOpacity>

            <Text style={styles.label}>Trip Title *</Text>
            <TextInput style={styles.input} placeholder="e.g. Tirupati Darshan 2026" value={form.title} onChangeText={setF('title')} />

            <Text style={styles.label}>Destination *</Text>
            <TextInput style={styles.input} placeholder="e.g. Tirupati, Rameswaram, Varanasi" value={form.destination} onChangeText={setF('destination')} />

            <View style={styles.row}>
              <View style={styles.half}>
                <Text style={styles.label}>Start Date</Text>
                <TextInput style={styles.input} placeholder="YYYY-MM-DD" value={form.start_date} onChangeText={setF('start_date')} />
              </View>
              <View style={styles.half}>
                <Text style={styles.label}>End Date</Text>
                <TextInput style={styles.input} placeholder="YYYY-MM-DD" value={form.end_date} onChangeText={setF('end_date')} />
              </View>
            </View>

            <View style={styles.row}>
              <View style={styles.half}>
                <Text style={styles.label}>Cost per Person</Text>
                <TextInput style={styles.input} placeholder="e.g. ₹5,000" value={form.cost} onChangeText={setF('cost')} />
              </View>
              <View style={styles.half}>
                <Text style={styles.label}>Total Seats</Text>
                <TextInput style={styles.input} placeholder="e.g. 40" keyboardType="number-pad" value={form.capacity} onChangeText={setF('capacity')} />
              </View>
            </View>

            <Text style={styles.label}>Description</Text>
            <TextInput
              style={[styles.input, { minHeight: 80, textAlignVertical: 'top' }]}
              placeholder="Brief overview of the trip…"
              multiline
              value={form.description}
              onChangeText={setF('description')}
            />

            <Text style={styles.label}>Day-wise Itinerary</Text>
            <TextInput
              style={[styles.input, { minHeight: 100, textAlignVertical: 'top' }]}
              placeholder={'Day 1: Depart — arrive destination\nDay 2: Temple visits\nDay 3: Return'}
              multiline
              value={form.itinerary}
              onChangeText={setF('itinerary')}
            />

            <Text style={styles.label}>Organizer Name</Text>
            <TextInput style={styles.input} placeholder="Contact person's name" value={form.organizer_name} onChangeText={setF('organizer_name')} />

            <Text style={styles.label}>Organizer Mobile</Text>
            <TextInput style={styles.input} placeholder="+919876543210" keyboardType="phone-pad" value={form.organizer_mobile} onChangeText={setF('organizer_mobile')} />

            <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit} disabled={saving || uploading}>
              {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitBtnText}>Post Trip</Text>}
            </TouchableOpacity>
            <View style={{ height: 40 }} />
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container:       { flex: 1, backgroundColor: colors.background },
  header:          { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: spacing.md, paddingBottom: 8 },
  heading:         { fontSize: 20, fontWeight: '700', color: colors.text },
  subheading:      { fontSize: 13, color: colors.textMuted, marginTop: 2 },
  addBtn:          { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: colors.primary, borderRadius: radius.md, paddingVertical: 8, paddingHorizontal: 14 },
  addBtnText:      { color: '#fff', fontWeight: '700', fontSize: 14 },
  empty:           { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl },
  emptyEmoji:      { fontSize: 56, marginBottom: spacing.md },
  emptyTitle:      { fontSize: 18, fontWeight: '700', color: colors.text, marginBottom: 8 },
  emptyDesc:       { fontSize: 14, color: colors.textMuted, textAlign: 'center', marginBottom: spacing.lg },
  card:            { backgroundColor: colors.card, borderRadius: radius.lg, overflow: 'hidden', elevation: 1, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4 },
  photo:           { width: '100%', height: 160 },
  photoPlaceholder:{ width: '100%', height: 160, backgroundColor: '#fff7ed', alignItems: 'center', justifyContent: 'center' },
  photoEmoji:      { fontSize: 48 },
  cardBody:        { padding: spacing.md },
  cardTitle:       { fontSize: 16, fontWeight: '700', color: colors.text, marginBottom: 8 },
  metaRow:         { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 4 },
  metaText:        { fontSize: 13, color: colors.textMuted, flex: 1 },
  organizer:       { fontSize: 12, color: colors.primary, fontWeight: '600', marginTop: 6 },
  modal:           { flex: 1, backgroundColor: colors.background },
  modalHeader:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border },
  modalTitle:      { fontSize: 18, fontWeight: '700', color: colors.text },
  modalBody:       { padding: spacing.md },
  photoUpload:     { height: 140, borderRadius: radius.md, borderWidth: 2, borderColor: colors.border, borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center', backgroundColor: '#fafaf9', marginBottom: spacing.md },
  uploadedPhoto:   { width: '100%', height: '100%', borderRadius: radius.md },
  photoUploadText: { color: colors.textMuted, fontSize: 14, marginTop: 8 },
  label:           { fontSize: 13, fontWeight: '600', color: colors.text, marginBottom: 4, marginTop: 10 },
  input:           { borderWidth: 1.5, borderColor: colors.border, borderRadius: radius.md, padding: 10, fontSize: 14, color: colors.text, backgroundColor: '#fafaf9' },
  row:             { flexDirection: 'row', gap: 10 },
  half:            { flex: 1 },
  submitBtn:       { backgroundColor: colors.primary, borderRadius: radius.md, padding: 14, alignItems: 'center', marginTop: spacing.lg },
  submitBtnText:   { color: '#fff', fontWeight: '700', fontSize: 16 },
});
