import { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TextInput, TouchableOpacity,
  StyleSheet, Alert, ActivityIndicator, Image,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import api, { uploadUrl } from '../api/client';
import { colors, spacing, radius } from '../theme';

const CATEGORIES = [
  'Agriculture & Farming', 'Automotive', 'Construction & Real Estate',
  'Education & Training', 'Finance & Insurance', 'Food & Hospitality',
  'Healthcare & Medical', 'IT & Technology', 'Manufacturing',
  'Retail & Trading', 'Services', 'Textiles & Garments',
  'Transport & Logistics', 'Other',
];
const EMPLOYEE_RANGES = ['1–5', '6–10', '11–50', '51–200', '200+'];

const FIELDS: { label: string; key: string; placeholder?: string; kb?: any; multiline?: boolean }[] = [
  { label: 'Company Name *', key: 'company_name', placeholder: 'Your business name' },
  { label: 'Tagline', key: 'tagline', placeholder: 'Short description of your business' },
  { label: 'Description', key: 'description', placeholder: 'Tell us about your business…', multiline: true },
  { label: 'Address', key: 'address', placeholder: 'Street address', multiline: true },
  { label: 'City', key: 'city', placeholder: 'City' },
  { label: 'State', key: 'state', placeholder: 'State' },
  { label: 'Pincode', key: 'pincode', placeholder: '600001', kb: 'number-pad' },
  { label: 'Phone', key: 'phone', placeholder: '+91 9876543210', kb: 'phone-pad' },
  { label: 'Email', key: 'email', placeholder: 'business@example.com', kb: 'email-address' },
  { label: 'Website', key: 'website', placeholder: 'https://yourbusiness.com', kb: 'url' },
  { label: 'Established Year', key: 'established_year', placeholder: '2010', kb: 'number-pad' },
];

export default function CreateBusinessScreen({ navigation }: any) {
  const [existingId, setExistingId] = useState<number | null>(null);
  const [form, setForm] = useState<Record<string, string>>({
    company_name: '', tagline: '', category: '', description: '',
    address: '', city: '', state: '', pincode: '',
    phone: '', email: '', website: '', established_year: '', employees: '',
  });
  const [logoFilename, setLogoFilename] = useState('');
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [showCategories, setShowCategories] = useState(false);
  const [showEmployees, setShowEmployees] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loadingExisting, setLoadingExisting] = useState(true);

  useEffect(() => {
    api.get('/business/mine').then((r) => {
      const b = r.data.business;
      if (!b) return;
      setExistingId(b.id);
      setForm({
        company_name: b.company_name || '',
        tagline: b.tagline || '',
        category: b.category || '',
        description: b.description || '',
        address: b.address || '',
        city: b.city || '',
        state: b.state || '',
        pincode: b.pincode || '',
        phone: b.phone || '',
        email: b.email || '',
        website: b.website || '',
        established_year: b.established_year?.toString() || '',
        employees: b.employees || '',
      });
      setLogoFilename(b.logo_filename || '');
    }).catch(() => {}).finally(() => setLoadingExisting(false));
  }, []);

  const setF = (k: string) => (v: string) => setForm((f) => ({ ...f, [k]: v }));

  const pickLogo = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'] as any,
      quality: 0.85,
      allowsMultipleSelection: false,
    });
    if (result.canceled || !result.assets.length) return;
    const asset = result.assets[0];
    setUploadingLogo(true);
    try {
      const fd = new FormData();
      fd.append('file', { uri: asset.uri, name: asset.fileName || 'logo.jpg', type: asset.mimeType || 'image/jpeg' } as any);
      const r = await api.post('/upload', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setLogoFilename(r.data.filename);
    } catch {
      Alert.alert('Upload Failed', 'Could not upload logo.');
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleSave = async () => {
    if (!form.company_name.trim()) {
      Alert.alert('Required', 'Company name is required.');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        ...form,
        logo_filename: logoFilename || undefined,
        established_year: form.established_year ? parseInt(form.established_year) : undefined,
      };
      if (existingId) {
        await api.put(`/business/${existingId}`, payload);
      } else {
        const r = await api.post('/business', payload);
        setExistingId(r.data.business.id);
      }
      Alert.alert('Saved', existingId ? 'Business profile updated!' : 'Business profile created!', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.error || 'Failed to save. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loadingExisting) {
    return <ActivityIndicator style={{ flex: 1 }} color={colors.primary} />;
  }

  const logoUrl = logoFilename ? uploadUrl(logoFilename) : null;

  return (
    <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
      <View style={styles.body}>
        {existingId && (
          <View style={styles.infoBanner}>
            <Ionicons name="information-circle-outline" size={16} color={colors.primary} />
            <Text style={styles.infoBannerText}>You already have a business profile — editing it now.</Text>
          </View>
        )}

        {/* Logo */}
        <Text style={styles.sectionTitle}>Business Logo</Text>
        <View style={styles.logoRow}>
          <TouchableOpacity style={styles.logoBox} onPress={pickLogo} disabled={uploadingLogo}>
            {uploadingLogo ? (
              <ActivityIndicator color={colors.primary} />
            ) : logoUrl ? (
              <Image source={{ uri: logoUrl }} style={styles.logoImg} resizeMode="contain" />
            ) : (
              <Ionicons name="business-outline" size={32} color={colors.primary} />
            )}
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={styles.logoHint}>Tap to {logoUrl ? 'change' : 'upload'} logo</Text>
            <Text style={styles.logoSubHint}>Square PNG or JPG recommended</Text>
          </View>
        </View>

        {/* Fields */}
        {FIELDS.map(({ label, key, placeholder, kb, multiline }) => (
          <View key={key}>
            <Text style={styles.label}>{label}</Text>
            <TextInput
              style={[styles.input, multiline && { minHeight: 80, textAlignVertical: 'top' }]}
              placeholder={placeholder}
              value={form[key]}
              onChangeText={setF(key)}
              keyboardType={kb || 'default'}
              multiline={!!multiline}
              autoCapitalize={kb === 'email-address' || kb === 'url' ? 'none' : 'sentences'}
            />
          </View>
        ))}

        {/* Category picker */}
        <Text style={styles.label}>Category</Text>
        <TouchableOpacity style={styles.input} onPress={() => setShowCategories((v) => !v)}>
          <Text style={form.category ? styles.pickerVal : styles.pickerPlaceholder}>
            {form.category || 'Select a category'}
          </Text>
        </TouchableOpacity>
        {showCategories && (
          <View style={styles.pickerList}>
            <ScrollView nestedScrollEnabled style={{ maxHeight: 200 }}>
              {CATEGORIES.map((c) => (
                <TouchableOpacity key={c} style={styles.pickerItem} onPress={() => { setF('category')(c); setShowCategories(false); }}>
                  <Text style={[styles.pickerItemText, form.category === c && styles.pickerItemActive]}>{c}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Employees picker */}
        <Text style={styles.label}>Number of Employees</Text>
        <TouchableOpacity style={styles.input} onPress={() => setShowEmployees((v) => !v)}>
          <Text style={form.employees ? styles.pickerVal : styles.pickerPlaceholder}>
            {form.employees || 'Select range'}
          </Text>
        </TouchableOpacity>
        {showEmployees && (
          <View style={styles.pickerList}>
            {EMPLOYEE_RANGES.map((e) => (
              <TouchableOpacity key={e} style={styles.pickerItem} onPress={() => { setF('employees')(e); setShowEmployees(false); }}>
                <Text style={[styles.pickerItemText, form.employees === e && styles.pickerItemActive]}>{e}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        <TouchableOpacity
          style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
          onPress={handleSave}
          disabled={saving}
        >
          {saving
            ? <ActivityIndicator color="#fff" size="small" />
            : <Ionicons name="checkmark-circle-outline" size={18} color="#fff" />}
          <Text style={styles.saveBtnText}>
            {saving ? 'Saving…' : existingId ? 'Update Business' : 'Create Business'}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  body: { padding: spacing.lg, paddingBottom: 48, gap: 8 },
  infoBanner: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#fff7ed', borderRadius: radius.md, padding: 12, borderWidth: 1, borderColor: '#fed7aa', marginBottom: 4 },
  infoBannerText: { flex: 1, fontSize: 13, color: colors.primary, fontWeight: '500' },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: colors.text, marginBottom: 8 },
  logoRow: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 8 },
  logoBox: { width: 72, height: 72, borderRadius: radius.md, backgroundColor: '#fff7ed', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: colors.primaryLight, overflow: 'hidden' },
  logoImg: { width: 72, height: 72 },
  logoHint: { fontSize: 14, fontWeight: '600', color: colors.primary },
  logoSubHint: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  label: { fontSize: 13, fontWeight: '600', color: colors.text, marginBottom: 4, marginTop: 10 },
  input: { borderWidth: 1.5, borderColor: colors.border, borderRadius: radius.md, padding: 11, fontSize: 14, color: colors.text, backgroundColor: '#fafaf9' },
  pickerVal: { fontSize: 14, color: colors.text },
  pickerPlaceholder: { fontSize: 14, color: '#9ca3af' },
  pickerList: { borderWidth: 1.5, borderColor: colors.border, borderRadius: radius.md, backgroundColor: '#fff', overflow: 'hidden', marginTop: 2 },
  pickerItem: { paddingVertical: 11, paddingHorizontal: 14, borderBottomWidth: 1, borderBottomColor: colors.border },
  pickerItemText: { fontSize: 14, color: colors.text },
  pickerItemActive: { color: colors.primary, fontWeight: '700' },
  saveBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: colors.primary, borderRadius: radius.md, padding: 14, marginTop: spacing.md },
  saveBtnDisabled: { opacity: 0.55 },
  saveBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});
