import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, Switch } from 'react-native';
import api from '../api/client';
import { useAuth } from '../contexts/AuthContext';
import { colors, spacing, radius } from '../theme';

type MobileStep = 'enter' | 'otp';

export default function EditProfileScreen({ navigation }: any) {
  const { refreshUser } = useAuth();
  const [form, setForm] = useState<any>({});
  const [mobilePublic, setMobilePublic] = useState(false);
  const [currentMobile, setCurrentMobile] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Mobile change
  const [showMobileChange, setShowMobileChange] = useState(false);
  const [mobileStep, setMobileStep] = useState<MobileStep>('enter');
  const [newMobile, setNewMobile] = useState('');
  const [mobileEmail, setMobileEmail] = useState('');
  const [mobileOtp, setMobileOtp] = useState('');
  const [mobileLoading, setMobileLoading] = useState(false);

  const setF = (k: string) => (v: string) => setForm((f: any) => ({ ...f, [k]: v }));

  useEffect(() => {
    api.get('/profile').then((r) => {
      const p = r.data.profile || {};
      const u = r.data.user || {};
      setCurrentMobile(u.mobile || '');
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

  const isNewMobileIndian = newMobile.startsWith('+91');

  const sendMobileOtp = async () => {
    if (!newMobile) { Alert.alert('Error', 'Enter your new mobile number.'); return; }
    setMobileLoading(true);
    try {
      const body: Record<string, string> = { new_mobile: newMobile };
      if (!isNewMobileIndian && mobileEmail) body.email = mobileEmail;
      const res = await api.post('/profile/request-mobile-change', body);
      Alert.alert('OTP Sent', res.data.message);
      setMobileStep('otp');
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.error || 'Failed to send OTP.');
    } finally {
      setMobileLoading(false);
    }
  };

  const confirmMobileChange = async () => {
    if (!mobileOtp) { Alert.alert('Error', 'Enter the OTP.'); return; }
    setMobileLoading(true);
    try {
      const res = await api.post('/profile/confirm-mobile-change', { new_mobile: newMobile, otp_code: mobileOtp });
      setCurrentMobile(res.data.user.mobile);
      await refreshUser();
      setShowMobileChange(false);
      setMobileStep('enter');
      setNewMobile(''); setMobileOtp('');
      Alert.alert('Success', 'Mobile number updated successfully.');
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.error || 'Failed to update mobile number.');
    } finally {
      setMobileLoading(false);
    }
  };

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

        {/* Change Mobile Number */}
        <View style={styles.mobileCard}>
          <View style={styles.mobileCardHeader}>
            <View>
              <Text style={styles.mobileCardTitle}>Mobile Number</Text>
              <Text style={styles.mobileCardCurrent}>{currentMobile || '—'}</Text>
            </View>
            {!showMobileChange && (
              <TouchableOpacity onPress={() => setShowMobileChange(true)}>
                <Text style={styles.changeLink}>Change</Text>
              </TouchableOpacity>
            )}
          </View>

          {showMobileChange && (
            <>
              {mobileStep === 'enter' && (
                <>
                  <Text style={styles.label}>New Mobile Number</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="+919876543210"
                    keyboardType="phone-pad"
                    autoCapitalize="none"
                    value={newMobile}
                    onChangeText={setNewMobile}
                  />
                  <Text style={styles.hint}>Include country code, e.g. +919876543210</Text>
                  {newMobile.length > 3 && !isNewMobileIndian && (
                    <>
                      <Text style={styles.label}>Email (for OTP delivery)</Text>
                      <TextInput
                        style={styles.input}
                        placeholder="your@email.com"
                        keyboardType="email-address"
                        autoCapitalize="none"
                        value={mobileEmail}
                        onChangeText={setMobileEmail}
                      />
                    </>
                  )}
                  <View style={styles.mobileActions}>
                    <TouchableOpacity style={styles.primaryBtn} onPress={sendMobileOtp} disabled={mobileLoading}>
                      {mobileLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryBtnText}>Send OTP</Text>}
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.cancelBtn} onPress={() => { setShowMobileChange(false); setNewMobile(''); }}>
                      <Text style={styles.cancelBtnText}>Cancel</Text>
                    </TouchableOpacity>
                  </View>
                </>
              )}

              {mobileStep === 'otp' && (
                <>
                  <Text style={styles.label}>Enter OTP</Text>
                  <TextInput
                    style={[styles.input, styles.otpInput]}
                    placeholder="------"
                    keyboardType="number-pad"
                    maxLength={6}
                    value={mobileOtp}
                    onChangeText={(v) => setMobileOtp(v.replace(/\D/g, ''))}
                  />
                  <View style={styles.mobileActions}>
                    <TouchableOpacity style={styles.primaryBtn} onPress={confirmMobileChange} disabled={mobileLoading || mobileOtp.length < 4}>
                      {mobileLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryBtnText}>Confirm</Text>}
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.cancelBtn} onPress={() => { setMobileStep('enter'); setMobileOtp(''); }}>
                      <Text style={styles.cancelBtnText}>← Back</Text>
                    </TouchableOpacity>
                  </View>
                </>
              )}
            </>
          )}
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
