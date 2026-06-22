import { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, ActivityIndicator, Image, TouchableOpacity, Linking, Alert, TextInput } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import api, { uploadUrl } from '../api/client';
import { useAuth } from '../contexts/AuthContext';
import { colors, spacing, radius } from '../theme';

export default function BusinessProfileViewScreen({ route }: any) {
  const { id } = route.params;
  const { user } = useAuth();
  const [biz, setBiz] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Ads
  const [ads, setAds] = useState<any[]>([]);
  const [showAdForm, setShowAdForm] = useState(false);
  const [adTitle, setAdTitle] = useState('');
  const [adCaption, setAdCaption] = useState('');
  const [adPhotoFilename, setAdPhotoFilename] = useState('');
  const [adPhotoUri, setAdPhotoUri] = useState('');
  const [uploadingAd, setUploadingAd] = useState(false);
  const [savingAd, setSavingAd] = useState(false);
  const [adError, setAdError] = useState('');

  useEffect(() => {
    api.get(`/business/${id}`).then((r) => setBiz(r.data.business)).finally(() => setLoading(false));
    api.get(`/business/${id}/ads`).then((r) => setAds(r.data.ads)).catch(() => {});
  }, [id]);

  const isOwner = user && biz && user.id === biz.user_id;

  const pickAdPhoto = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'] as any,
      quality: 0.85,
      allowsMultipleSelection: false,
    });
    if (result.canceled || !result.assets.length) return;
    const asset = result.assets[0];
    setUploadingAd(true);
    setAdError('');
    try {
      const fd = new FormData();
      fd.append('file', { uri: asset.uri, name: asset.fileName || 'ad.jpg', type: asset.mimeType || 'image/jpeg' } as any);
      const r = await api.post('/upload', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setAdPhotoFilename(r.data.filename);
      setAdPhotoUri(uploadUrl(r.data.filename));
    } catch {
      setAdError('Photo upload failed.');
    } finally {
      setUploadingAd(false);
    }
  };

  const handleSaveAd = async () => {
    if (!adPhotoFilename) { setAdError('Please upload a photo.'); return; }
    setSavingAd(true);
    setAdError('');
    try {
      const r = await api.post(`/business/${id}/ads`, {
        photo_filename: adPhotoFilename,
        title: adTitle.trim() || undefined,
        caption: adCaption.trim() || undefined,
      });
      setAds((prev) => [r.data.ad, ...prev]);
      setShowAdForm(false);
      setAdTitle(''); setAdCaption('');
      setAdPhotoFilename(''); setAdPhotoUri('');
    } catch {
      setAdError('Failed to publish advertisement.');
    } finally {
      setSavingAd(false);
    }
  };

  const handleDeleteAd = (adId: number) => {
    Alert.alert('Delete Ad', 'Remove this advertisement?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive', onPress: async () => {
          try {
            await api.delete(`/business/${id}/ads/${adId}`);
            setAds((prev) => prev.filter((a) => a.id !== adId));
          } catch {
            Alert.alert('Error', 'Failed to delete.');
          }
        },
      },
    ]);
  };

  if (loading) return <ActivityIndicator style={{ flex: 1 }} color={colors.primary} />;
  if (!biz) return <View style={styles.center}><Text>Business not found.</Text></View>;

  const logo = biz.logo_filename ? uploadUrl(biz.logo_filename) : null;

  return (
    <ScrollView style={styles.container}>
      {/* Hero */}
      <View style={styles.hero}>
        <View style={styles.logoBox}>
          {logo
            ? <Image source={{ uri: logo }} style={styles.logo} resizeMode="contain" />
            : <Ionicons name="briefcase" size={48} color={colors.primary} />}
        </View>
        <Text style={styles.name}>{biz.company_name}</Text>
        {biz.tagline && <Text style={styles.tagline}>{biz.tagline}</Text>}
        {biz.category && (
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryBadgeText}>{biz.category}</Text>
          </View>
        )}
      </View>

      {/* About */}
      {biz.description && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>
          <Text style={styles.description}>{biz.description}</Text>
        </View>
      )}

      {/* Contact */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Contact & Location</Text>
        {[
          ['location-outline', biz.address],
          ['location-outline', biz.city && biz.state ? `${biz.city}, ${biz.state}` : (biz.city || biz.state)],
          ['call-outline', biz.phone],
          ['mail-outline', biz.email],
          ['globe-outline', biz.website],
        ].filter(([, v]) => v).map(([icon, value], i) => (
          <TouchableOpacity
            key={i}
            style={styles.contactRow}
            onPress={() => {
              if (icon === 'call-outline') Linking.openURL(`tel:${value}`);
              else if (icon === 'mail-outline') Linking.openURL(`mailto:${value}`);
              else if (icon === 'globe-outline') Linking.openURL((value as string).startsWith('http') ? value as string : `https://${value}`);
            }}
          >
            <Ionicons name={icon as any} size={16} color={colors.primary} />
            <Text style={styles.contactText}>{value as string}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Advertisements */}
      <View style={[styles.section, { paddingBottom: spacing.md }]}>
        <View style={styles.adsHeader}>
          <View style={styles.adsTitleRow}>
            <Ionicons name="megaphone-outline" size={16} color={colors.primary} />
            <Text style={styles.sectionTitle}>Advertisements</Text>
          </View>
          {isOwner && (
            <TouchableOpacity
              style={styles.addAdBtn}
              onPress={() => { setShowAdForm((v) => !v); setAdError(''); }}
            >
              <Ionicons name={showAdForm ? 'close' : 'add'} size={16} color={colors.primary} />
              <Text style={styles.addAdBtnText}>{showAdForm ? 'Cancel' : 'Add Ad'}</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Add-ad form */}
        {isOwner && showAdForm && (
          <View style={styles.adForm}>
            {/* Photo picker */}
            {adPhotoUri ? (
              <View style={styles.adPreviewWrap}>
                <Image source={{ uri: adPhotoUri }} style={styles.adPreview} resizeMode="cover" />
                <TouchableOpacity
                  style={styles.adPreviewRemove}
                  onPress={() => { setAdPhotoFilename(''); setAdPhotoUri(''); }}
                >
                  <Ionicons name="close" size={14} color="#fff" />
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity style={styles.adPhotoPicker} onPress={pickAdPhoto} disabled={uploadingAd}>
                {uploadingAd
                  ? <ActivityIndicator color={colors.primary} />
                  : <Ionicons name="camera-outline" size={28} color={colors.primary} />}
                <Text style={styles.adPhotoPickerText}>
                  {uploadingAd ? 'Uploading…' : 'Tap to upload ad image'}
                </Text>
              </TouchableOpacity>
            )}

            <Text style={styles.label}>Title (optional)</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Grand Sale — 50% Off!"
              value={adTitle}
              onChangeText={setAdTitle}
            />

            <Text style={styles.label}>Caption (optional)</Text>
            <TextInput
              style={[styles.input, { minHeight: 70, textAlignVertical: 'top' }]}
              placeholder="Short description or offer details…"
              value={adCaption}
              onChangeText={setAdCaption}
              multiline
            />

            {!!adError && <Text style={styles.adError}>{adError}</Text>}

            <TouchableOpacity
              style={[styles.publishBtn, (savingAd || uploadingAd) && styles.publishBtnDisabled]}
              onPress={handleSaveAd}
              disabled={savingAd || uploadingAd}
            >
              {savingAd
                ? <ActivityIndicator color="#fff" size="small" />
                : <Ionicons name="megaphone-outline" size={16} color="#fff" />}
              <Text style={styles.publishBtnText}>{savingAd ? 'Publishing…' : 'Publish Advertisement'}</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Ad cards */}
        {ads.length === 0 && !isOwner && (
          <Text style={styles.noAds}>No advertisements posted yet.</Text>
        )}
        {ads.map((ad) => (
          <View key={ad.id} style={styles.adCard}>
            <Image source={{ uri: uploadUrl(ad.photo_filename) }} style={styles.adImage} resizeMode="cover" />
            {(ad.title || ad.caption) && (
              <View style={styles.adBody}>
                {ad.title && <Text style={styles.adTitle}>{ad.title}</Text>}
                {ad.caption && <Text style={styles.adCaption}>{ad.caption}</Text>}
              </View>
            )}
            {isOwner && (
              <TouchableOpacity style={styles.adDeleteBtn} onPress={() => handleDeleteAd(ad.id)}>
                <Ionicons name="trash-outline" size={14} color="#ef4444" />
                <Text style={styles.adDeleteBtnText}>Remove</Text>
              </TouchableOpacity>
            )}
          </View>
        ))}
      </View>

      <View style={{ height: 32 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  hero: { alignItems: 'center', padding: spacing.xl, backgroundColor: colors.card, borderBottomLeftRadius: 24, borderBottomRightRadius: 24, marginBottom: spacing.md },
  logoBox: { width: 88, height: 88, borderRadius: radius.lg, backgroundColor: '#fff7ed', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', marginBottom: 12 },
  logo: { width: 88, height: 88 },
  name: { fontSize: 22, fontWeight: '700', color: colors.text },
  tagline: { fontSize: 14, color: colors.textMuted, marginTop: 4, textAlign: 'center' },
  categoryBadge: { backgroundColor: '#fff7ed', borderRadius: 99, paddingHorizontal: 12, paddingVertical: 4, marginTop: 8 },
  categoryBadgeText: { fontSize: 12, color: colors.primary, fontWeight: '700' },
  section: { backgroundColor: colors.card, borderRadius: radius.lg, marginHorizontal: spacing.md, marginBottom: spacing.md, padding: spacing.md },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5 },
  description: { fontSize: 14, color: colors.text, lineHeight: 22 },
  contactRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: colors.border },
  contactText: { fontSize: 14, color: colors.text },
  // Ads
  adsHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.md },
  adsTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  addAdBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, borderWidth: 1.5, borderColor: colors.primary, borderRadius: radius.md, paddingVertical: 5, paddingHorizontal: 10 },
  addAdBtnText: { fontSize: 13, fontWeight: '700', color: colors.primary },
  adForm: { borderWidth: 1.5, borderColor: colors.border, borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.md, gap: 8 },
  adPhotoPicker: { borderWidth: 2, borderStyle: 'dashed', borderColor: colors.primary, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center', paddingVertical: 24, gap: 8 },
  adPhotoPickerText: { fontSize: 13, color: colors.primary, fontWeight: '600' },
  adPreviewWrap: { position: 'relative', borderRadius: radius.md, overflow: 'hidden' },
  adPreview: { width: '100%', height: 160, borderRadius: radius.md },
  adPreviewRemove: { position: 'absolute', top: 6, right: 6, width: 24, height: 24, borderRadius: 12, backgroundColor: 'rgba(0,0,0,0.55)', alignItems: 'center', justifyContent: 'center' },
  label: { fontSize: 13, fontWeight: '600', color: colors.text, marginTop: 4 },
  input: { borderWidth: 1.5, borderColor: colors.border, borderRadius: radius.md, padding: 10, fontSize: 14, color: colors.text, backgroundColor: '#fafaf9' },
  adError: { fontSize: 12, color: '#ef4444' },
  publishBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: colors.primary, borderRadius: radius.md, padding: 12, marginTop: 4 },
  publishBtnDisabled: { opacity: 0.5 },
  publishBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  noAds: { fontSize: 13, color: colors.textMuted, textAlign: 'center', paddingVertical: 16 },
  adCard: { borderRadius: radius.md, overflow: 'hidden', borderWidth: 1, borderColor: colors.border, marginBottom: spacing.md },
  adImage: { width: '100%', height: 180 },
  adBody: { padding: 12 },
  adTitle: { fontSize: 14, fontWeight: '700', color: colors.text },
  adCaption: { fontSize: 13, color: colors.textMuted, marginTop: 4, lineHeight: 19 },
  adDeleteBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 12, paddingVertical: 8, borderTopWidth: 1, borderTopColor: '#fee2e2' },
  adDeleteBtnText: { fontSize: 12, color: '#ef4444', fontWeight: '600' },
});
