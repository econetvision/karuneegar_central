import { useState } from 'react';
import { View, Text, ScrollView, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, Image } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import api, { uploadUrl } from '../api/client';
import { colors, spacing, radius } from '../theme';

const LANGS = [
  { code: 'en', label: 'English' },
  { code: 'ta', label: 'தமிழ்' },
  { code: 'te', label: 'తెలుగు' },
  { code: 'kn', label: 'ಕನ್ನಡ' },
] as const;

type Lang = typeof LANGS[number]['code'];

const FIELDS: [string, string, string?][] = [
  ['Full Name *', 'full_name'],
  ['Age *', 'age', 'numeric'],
  ['Height (e.g. 5ft 6in)', 'height'],
  ['Native Place', 'native_place'],
  ['Gothram', 'gothram'],
  ['Education', 'education'],
  ['Occupation', 'occupation'],
  ['Salary Range', 'salary_range'],
  ['Birth Time (e.g. 10:30 AM)', 'birth_time'],
  ['Birth Place', 'birth_place'],
  ['About Me', 'about'],
  ['Contact Email', 'contact_email', 'email-address'],
  ['Contact Phone', 'contact_phone', 'phone-pad'],
];

const STARS = [
  'Ashwini','Bharani','Krittika','Rohini','Mrigashira','Ardra','Punarvasu','Pushya',
  'Ashlesha','Magha','Purva Phalguni','Uttara Phalguni','Hasta','Chitra','Swati',
  'Vishakha','Anuradha','Jyeshtha','Mula','Purva Ashadha','Uttara Ashadha',
  'Shravana','Dhanishta','Shatabhisha','Purva Bhadrapada','Uttara Bhadrapada','Revati',
];
const RAASIS = [
  'Mesha','Vrishabha','Mithuna','Karka','Simha','Kanya',
  'Tula','Vrischika','Dhanu','Makara','Kumbha','Meena',
];

export default function MatrimonyCreateScreen({ navigation }: any) {
  const [form, setForm] = useState<Record<string, string>>({ gender: 'male', seeking: 'female', star: '', raasi: '' });
  const [photos, setPhotos] = useState<string[]>([]);   // uploaded filenames
  const [horoscopes, setHoroscopes] = useState<Record<Lang, string>>({ en: '', ta: '', te: '', kn: '' });
  const [activeLang, setActiveLang] = useState<Lang>('en');
  const [showStarPicker, setShowStarPicker] = useState(false);
  const [showRaasiPicker, setShowRaasiPicker] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  const setF = (k: string) => (v: string) => setForm((f) => ({ ...f, [k]: v }));

  const pickPhotos = async () => {
    if (photos.length >= 5) {
      Alert.alert('Limit', 'Maximum 5 photos allowed.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'] as any,
      allowsMultipleSelection: true,
      quality: 0.8,
      selectionLimit: 5 - photos.length,
    });
    if (result.canceled || !result.assets.length) return;

    setUploading(true);
    try {
      const uploaded: string[] = [];
      for (const asset of result.assets) {
        const fd = new FormData();
        fd.append('file', { uri: asset.uri, name: asset.fileName || 'photo.jpg', type: asset.mimeType || 'image/jpeg' } as any);
        const r = await api.post('/upload', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
        uploaded.push(r.data.filename);
      }
      setPhotos((prev) => [...prev, ...uploaded].slice(0, 5));
    } catch {
      Alert.alert('Upload Failed', 'Could not upload one or more photos.');
    } finally {
      setUploading(false);
    }
  };

  const removePhoto = (idx: number) =>
    setPhotos((prev) => prev.filter((_, i) => i !== idx));

  const handleSubmit = async () => {
    if (!form.full_name?.trim() || !form.age) {
      Alert.alert('Error', 'Name and age are required.');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        ...form,
        age: parseInt(form.age) || null,
        photo_filename: photos[0] || '',
        photos,
        horoscope_en: horoscopes.en,
        horoscope_ta: horoscopes.ta,
        horoscope_te: horoscopes.te,
        horoscope_kn: horoscopes.kn,
      };
      await api.post('/matrimony', payload);
      Alert.alert('Success', 'Your profile has been created!', [{ text: 'OK', onPress: () => navigation.goBack() }]);
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.error || 'Failed to create profile.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
      <View style={styles.body}>

        {/* Gender */}
        <Text style={styles.sectionTitle}>Gender</Text>
        <View style={styles.toggleRow}>
          {['male', 'female'].map((g) => (
            <TouchableOpacity key={g} style={[styles.toggleBtn, form.gender === g && styles.toggleBtnActive]} onPress={() => setF('gender')(g)}>
              <Text style={[styles.toggleBtnText, form.gender === g && styles.toggleBtnTextActive]}>
                {g === 'male' ? '♂ Male (Groom)' : '♀ Female (Bride)'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Photos */}
        <Text style={[styles.sectionTitle, { marginTop: spacing.md }]}>Photos <Text style={styles.hint}>(up to 5)</Text></Text>
        <View style={styles.photoGrid}>
          {photos.map((fn, idx) => (
            <View key={fn} style={styles.photoThumb}>
              <Image source={{ uri: uploadUrl(fn) }} style={styles.photoImg} />
              {idx === 0 && <Text style={styles.coverBadge}>Cover</Text>}
              <TouchableOpacity style={styles.removePhoto} onPress={() => removePhoto(idx)}>
                <Ionicons name="close" size={12} color="#fff" />
              </TouchableOpacity>
            </View>
          ))}
          {photos.length < 5 && (
            <TouchableOpacity style={styles.addPhotoBtn} onPress={pickPhotos} disabled={uploading}>
              {uploading
                ? <ActivityIndicator size="small" color={colors.primary} />
                : <Ionicons name="camera-outline" size={24} color={colors.primary} />}
              <Text style={styles.addPhotoText}>{uploading ? 'Uploading…' : 'Add Photo'}</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Fields */}
        {FIELDS.map(([label, key, kbType]) => (
          <View key={key}>
            <Text style={styles.label}>{label}</Text>
            <TextInput
              style={[styles.input, key === 'about' && { minHeight: 80, textAlignVertical: 'top' }]}
              placeholder={label.replace(' *', '')}
              value={form[key] || ''}
              onChangeText={setF(key)}
              keyboardType={(kbType as any) || 'default'}
              multiline={key === 'about'}
              autoCapitalize={kbType === 'email-address' ? 'none' : 'sentences'}
            />
          </View>
        ))}

        {/* Star picker */}
        <Text style={styles.label}>Star (Natchathiram)</Text>
        <TouchableOpacity style={styles.input} onPress={() => setShowStarPicker(true)}>
          <Text style={form.star ? styles.pickerValue : styles.pickerPlaceholder}>
            {form.star || 'Select Star'}
          </Text>
        </TouchableOpacity>
        {showStarPicker && (
          <View style={styles.pickerList}>
            <ScrollView nestedScrollEnabled style={{ maxHeight: 180 }}>
              {STARS.map((s) => (
                <TouchableOpacity key={s} style={styles.pickerItem} onPress={() => { setF('star')(s); setShowStarPicker(false); }}>
                  <Text style={[styles.pickerItemText, form.star === s && styles.pickerItemActive]}>{s}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Raasi picker */}
        <Text style={styles.label}>Raasi</Text>
        <TouchableOpacity style={styles.input} onPress={() => setShowRaasiPicker(true)}>
          <Text style={form.raasi ? styles.pickerValue : styles.pickerPlaceholder}>
            {form.raasi || 'Select Raasi'}
          </Text>
        </TouchableOpacity>
        {showRaasiPicker && (
          <View style={styles.pickerList}>
            <ScrollView nestedScrollEnabled style={{ maxHeight: 180 }}>
              {RAASIS.map((r) => (
                <TouchableOpacity key={r} style={styles.pickerItem} onPress={() => { setF('raasi')(r); setShowRaasiPicker(false); }}>
                  <Text style={[styles.pickerItemText, form.raasi === r && styles.pickerItemActive]}>{r}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Horoscope */}
        <Text style={[styles.sectionTitle, { marginTop: spacing.md }]}>
          Horoscope / Jathakam <Text style={styles.hint}>(optional)</Text>
        </Text>
        <View style={styles.langTabs}>
          {LANGS.map(({ code, label }) => (
            <TouchableOpacity
              key={code}
              style={[styles.langTab, activeLang === code && styles.langTabActive]}
              onPress={() => setActiveLang(code)}
            >
              <Text style={[styles.langTabText, activeLang === code && styles.langTabTextActive]}>{label}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <TextInput
          style={[styles.input, { minHeight: 100, textAlignVertical: 'top' }]}
          placeholder={`Enter horoscope in ${LANGS.find(l => l.code === activeLang)?.label}…`}
          value={horoscopes[activeLang]}
          onChangeText={(v) => setHoroscopes((prev) => ({ ...prev, [activeLang]: v }))}
          multiline
        />
        <Text style={styles.aiHint}>
          💡 You can also generate AI horoscope in each language from the profile page after saving.
        </Text>

        <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit} disabled={saving || uploading}>
          {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitBtnText}>Create Profile</Text>}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  body: { padding: spacing.lg, paddingBottom: 40, gap: 8 },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: colors.text, marginBottom: 4 },
  hint: { fontSize: 12, fontWeight: '400', color: colors.textMuted },
  toggleRow: { flexDirection: 'row', gap: 10, marginBottom: 4 },
  toggleBtn: { flex: 1, borderWidth: 2, borderColor: colors.border, borderRadius: radius.md, padding: 12, alignItems: 'center' },
  toggleBtnActive: { borderColor: '#f43f5e', backgroundColor: '#fff1f2' },
  toggleBtnText: { fontSize: 13, fontWeight: '600', color: colors.textMuted },
  toggleBtnTextActive: { color: '#f43f5e' },
  photoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 4 },
  photoThumb: { width: 70, height: 95, borderRadius: 10, overflow: 'hidden', position: 'relative' },
  photoImg: { width: '100%', height: '100%' },
  coverBadge: { position: 'absolute', bottom: 2, left: 2, backgroundColor: colors.primary, color: '#fff', fontSize: 9, fontWeight: '700', paddingHorizontal: 4, paddingVertical: 1, borderRadius: 4 },
  removePhoto: { position: 'absolute', top: 3, right: 3, width: 18, height: 18, borderRadius: 9, backgroundColor: 'rgba(0,0,0,0.55)', alignItems: 'center', justifyContent: 'center' },
  addPhotoBtn: { width: 70, height: 95, borderRadius: 10, borderWidth: 2, borderStyle: 'dashed', borderColor: colors.primary, alignItems: 'center', justifyContent: 'center', gap: 4 },
  addPhotoText: { fontSize: 10, color: colors.primary, fontWeight: '600' },
  label: { fontSize: 13, fontWeight: '600', color: colors.text, marginBottom: 4, marginTop: 8 },
  input: { borderWidth: 1.5, borderColor: colors.border, borderRadius: radius.md, padding: 10, fontSize: 14, color: colors.text, backgroundColor: '#fafaf9' },
  pickerValue: { fontSize: 14, color: colors.text },
  pickerPlaceholder: { fontSize: 14, color: '#9ca3af' },
  pickerList: { borderWidth: 1.5, borderColor: colors.border, borderRadius: radius.md, backgroundColor: '#fff', overflow: 'hidden' },
  pickerItem: { paddingVertical: 10, paddingHorizontal: 14, borderBottomWidth: 1, borderBottomColor: colors.border },
  pickerItemText: { fontSize: 14, color: colors.text },
  pickerItemActive: { color: colors.primary, fontWeight: '700' },
  langTabs: { flexDirection: 'row', backgroundColor: '#f3f4f6', borderRadius: 12, padding: 4, marginBottom: 8 },
  langTab: { flex: 1, paddingVertical: 6, alignItems: 'center', borderRadius: 8 },
  langTabActive: { backgroundColor: '#fff', shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 },
  langTabText: { fontSize: 11, fontWeight: '600', color: colors.textMuted },
  langTabTextActive: { color: colors.text },
  aiHint: { fontSize: 12, color: colors.textMuted, lineHeight: 18, marginTop: 4 },
  submitBtn: { backgroundColor: '#f43f5e', borderRadius: radius.md, padding: 14, alignItems: 'center', marginTop: spacing.md },
  submitBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});
