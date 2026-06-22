import { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TextInput, TouchableOpacity,
  StyleSheet, Alert, ActivityIndicator, Image,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import api, { uploadUrl } from '../api/client';
import { colors, spacing, radius } from '../theme';

export default function CreateBusinessAdScreen({ navigation }: any) {
  const [business, setBusiness] = useState<any>(null);
  const [loadingBiz, setLoadingBiz] = useState(true);
  const [title, setTitle] = useState('');
  const [caption, setCaption] = useState('');
  const [photoFilename, setPhotoFilename] = useState('');
  const [photoUri, setPhotoUri] = useState('');
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/business/mine')
      .then((r) => setBusiness(r.data.business))
      .catch(() => {})
      .finally(() => setLoadingBiz(false));
  }, []);

  const pickPhoto = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'] as any,
      quality: 0.85,
      allowsMultipleSelection: false,
    });
    if (result.canceled || !result.assets.length) return;
    const asset = result.assets[0];
    setUploading(true);
    setError('');
    try {
      const fd = new FormData();
      fd.append('file', { uri: asset.uri, name: asset.fileName || 'ad.jpg', type: asset.mimeType || 'image/jpeg' } as any);
      const r = await api.post('/upload', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setPhotoFilename(r.data.filename);
      setPhotoUri(uploadUrl(r.data.filename));
    } catch {
      setError('Photo upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handlePublish = async () => {
    if (!photoFilename) { setError('Please upload an ad photo.'); return; }
    setSaving(true);
    setError('');
    try {
      await api.post(`/business/${business.id}/ads`, {
        photo_filename: photoFilename,
        title: title.trim() || undefined,
        caption: caption.trim() || undefined,
      });
      Alert.alert('Published!', 'Your advertisement is now visible to community members.', [
        { text: 'View Business', onPress: () => navigation.navigate('BusinessProfile', { id: business.id }) },
        { text: 'Add Another', onPress: () => { setPhotoFilename(''); setPhotoUri(''); setTitle(''); setCaption(''); } },
      ]);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to publish. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loadingBiz) {
    return <ActivityIndicator style={{ flex: 1 }} color={colors.primary} />;
  }

  if (!business) {
    return (
      <View style={styles.noBizContainer}>
        <Ionicons name="business-outline" size={64} color={colors.primaryLight} />
        <Text style={styles.noBizTitle}>No Business Profile</Text>
        <Text style={styles.noBizText}>
          You need to create a business profile before you can post advertisements.
        </Text>
        <TouchableOpacity
          style={styles.createBizBtn}
          onPress={() => navigation.navigate('CreateBusiness')}
        >
          <Ionicons name="add-circle-outline" size={18} color="#fff" />
          <Text style={styles.createBizBtnText}>Create Business Profile</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
      <View style={styles.body}>
        {/* Business context banner */}
        <View style={styles.bizBanner}>
          <Ionicons name="briefcase-outline" size={16} color={colors.primary} />
          <Text style={styles.bizBannerText} numberOfLines={1}>
            Posting ad for: <Text style={{ fontWeight: '700' }}>{business.company_name}</Text>
          </Text>
        </View>

        {/* Photo */}
        <Text style={styles.sectionTitle}>Advertisement Photo *</Text>
        <Text style={styles.hint}>Landscape images work best (e.g. banners, offers, products)</Text>

        {photoUri ? (
          <View style={styles.previewWrap}>
            <Image source={{ uri: photoUri }} style={styles.preview} resizeMode="cover" />
            <TouchableOpacity
              style={styles.previewRemove}
              onPress={() => { setPhotoFilename(''); setPhotoUri(''); }}
            >
              <Ionicons name="close" size={16} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.previewChange} onPress={pickPhoto} disabled={uploading}>
              <Ionicons name="camera-outline" size={14} color="#fff" />
              <Text style={styles.previewChangeText}>Change</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity style={styles.photoPicker} onPress={pickPhoto} disabled={uploading}>
            {uploading
              ? <ActivityIndicator color={colors.primary} size="large" />
              : <Ionicons name="image-outline" size={48} color={colors.primaryLight} />}
            <Text style={styles.photoPickerTitle}>
              {uploading ? 'Uploading…' : 'Tap to select photo'}
            </Text>
            <Text style={styles.photoPickerSub}>JPG, PNG or WebP</Text>
          </TouchableOpacity>
        )}

        {/* Title */}
        <Text style={styles.label}>Title <Text style={styles.optional}>(optional)</Text></Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. Grand Diwali Sale — Flat 30% Off!"
          value={title}
          onChangeText={setTitle}
          maxLength={200}
        />

        {/* Caption */}
        <Text style={styles.label}>Caption <Text style={styles.optional}>(optional)</Text></Text>
        <TextInput
          style={[styles.input, { minHeight: 90, textAlignVertical: 'top' }]}
          placeholder="Describe your offer, product, or service…"
          value={caption}
          onChangeText={setCaption}
          multiline
        />

        {!!error && (
          <View style={styles.errorBox}>
            <Ionicons name="alert-circle-outline" size={14} color={colors.error} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        <TouchableOpacity
          style={[styles.publishBtn, (saving || uploading) && styles.publishBtnDisabled]}
          onPress={handlePublish}
          disabled={saving || uploading}
        >
          {saving
            ? <ActivityIndicator color="#fff" size="small" />
            : <Ionicons name="megaphone-outline" size={18} color="#fff" />}
          <Text style={styles.publishBtnText}>{saving ? 'Publishing…' : 'Publish Advertisement'}</Text>
        </TouchableOpacity>

        <Text style={styles.footerNote}>
          Your ad will be immediately visible to all logged-in community members on your business profile page.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  body: { padding: spacing.lg, paddingBottom: 48, gap: 10 },
  noBizContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl, gap: 16 },
  noBizTitle: { fontSize: 20, fontWeight: '700', color: colors.text },
  noBizText: { fontSize: 14, color: colors.textMuted, textAlign: 'center', lineHeight: 22 },
  createBizBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: colors.primary, borderRadius: radius.md, paddingVertical: 12, paddingHorizontal: 24, marginTop: 8 },
  createBizBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  bizBanner: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#fff7ed', borderRadius: radius.md, padding: 12, borderWidth: 1, borderColor: colors.primaryLight },
  bizBannerText: { flex: 1, fontSize: 13, color: colors.text },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: colors.text },
  hint: { fontSize: 12, color: colors.textMuted, marginTop: -6 },
  photoPicker: { borderWidth: 2, borderStyle: 'dashed', borderColor: colors.primaryLight, borderRadius: radius.lg, alignItems: 'center', justifyContent: 'center', paddingVertical: 40, gap: 10 },
  photoPickerTitle: { fontSize: 15, fontWeight: '600', color: colors.primary },
  photoPickerSub: { fontSize: 12, color: colors.textMuted },
  previewWrap: { borderRadius: radius.lg, overflow: 'hidden', position: 'relative' },
  preview: { width: '100%', height: 200, borderRadius: radius.lg },
  previewRemove: { position: 'absolute', top: 8, right: 8, width: 28, height: 28, borderRadius: 14, backgroundColor: 'rgba(0,0,0,0.55)', alignItems: 'center', justifyContent: 'center' },
  previewChange: { position: 'absolute', bottom: 8, right: 8, flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(0,0,0,0.55)', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5 },
  previewChangeText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  label: { fontSize: 13, fontWeight: '600', color: colors.text, marginTop: 4 },
  optional: { fontWeight: '400', color: colors.textMuted },
  input: { borderWidth: 1.5, borderColor: colors.border, borderRadius: radius.md, padding: 11, fontSize: 14, color: colors.text, backgroundColor: '#fafaf9' },
  errorBox: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: colors.errorBg, borderRadius: radius.md, padding: 10, borderWidth: 1, borderColor: colors.errorBorder },
  errorText: { flex: 1, fontSize: 13, color: colors.error },
  publishBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: colors.primary, borderRadius: radius.md, padding: 14, marginTop: 6 },
  publishBtnDisabled: { opacity: 0.55 },
  publishBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  footerNote: { fontSize: 12, color: colors.textMuted, textAlign: 'center', lineHeight: 18 },
});
