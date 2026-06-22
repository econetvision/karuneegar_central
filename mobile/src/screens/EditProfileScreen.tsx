import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, Switch } from 'react-native';
import api from '../api/client';
import { useAuth } from '../contexts/AuthContext';
import { colors, spacing, radius } from '../theme';

export default function EditProfileScreen({ navigation }: any) {
  const { refreshUser } = useAuth();
  const [form, setForm] = useState<any>({});
  const [mobilePublic, setMobilePublic] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const setF = (k: string) => (v: string) => setForm((f: any) => ({ ...f, [k]: v }));

  useEffect(() => {
    api.get('/profile').then((r) => {
      const p = r.data.profile || {};
      const u = r.data.user || {};
      setForm({
        full_name: p.full_name || '',
        bio: p.bio || '',
        location: p.location || '',
        occupation: p.occupation || '',
        dob: p.dob || '',
        native_place: p.native_place || '',
        gothram: p.gothram || '',
        linkedin: p.linkedin || '',
        website: p.website || '',
      });
      setMobilePublic(!!u.mobile_public);
    }).finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.put('/profile', { ...form, mobile_public: mobilePublic });
      await refreshUser();
      Alert.alert('Saved', 'Profile updated successfully.', [{ text: 'OK', onPress: () => navigation.goBack() }]);
    } catch {
      Alert.alert('Error', 'Failed to save profile.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <ActivityIndicator style={{ flex: 1 }} color={colors.primary} />;

  const FIELDS: [string, string, boolean?][] = [
    ['Full Name', 'full_name'],
    ['Location / City', 'location'],
    ['Occupation', 'occupation'],
    ['Date of Birth (YYYY-MM-DD)', 'dob'],
    ['Native Place', 'native_place'],
    ['Gothram', 'gothram'],
    ['LinkedIn URL', 'linkedin'],
    ['Website URL', 'website'],
  ];

  return (
    <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
      <View style={styles.body}>
        {FIELDS.map(([label, key]) => (
          <View key={key}>
            <Text style={styles.label}>{label}</Text>
            <TextInput style={styles.input} placeholder={label} value={form[key] || ''} onChangeText={setF(key)} autoCapitalize={key.includes('URL') ? 'none' : 'sentences'} />
          </View>
        ))}

        <Text style={styles.label}>Bio</Text>
        <TextInput style={[styles.input, { minHeight: 80, textAlignVertical: 'top' }]} placeholder="Write a short bio…" multiline value={form.bio || ''} onChangeText={setF('bio')} />

        <View style={styles.switchRow}>
          <View style={styles.switchInfo}>
            <Text style={styles.switchLabel}>Show mobile number publicly</Text>
            <Text style={styles.switchDesc}>Other members can see your contact number</Text>
          </View>
          <Switch value={mobilePublic} onValueChange={setMobilePublic} trackColor={{ false: colors.border, true: colors.primaryLight }} thumbColor={mobilePublic ? colors.primary : '#fff'} />
        </View>

        <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={saving}>
          {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>Save Changes</Text>}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  body: { padding: spacing.lg, gap: 8 },
  label: { fontSize: 13, fontWeight: '600', color: colors.text, marginBottom: 4, marginTop: 8 },
  input: { borderWidth: 1.5, borderColor: colors.border, borderRadius: radius.md, padding: 10, fontSize: 14, color: colors.text },
  switchRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.card, borderRadius: radius.md, padding: spacing.md, marginTop: 8, gap: 12 },
  switchInfo: { flex: 1 },
  switchLabel: { fontSize: 14, fontWeight: '600', color: colors.text },
  switchDesc: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  saveBtn: { backgroundColor: colors.primary, borderRadius: radius.md, padding: 14, alignItems: 'center', marginTop: spacing.md },
  saveBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});
