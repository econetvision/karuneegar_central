import { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import api from '../api/client';
import { colors, spacing, radius } from '../theme';

export default function RegisterScreen({ navigation }: any) {
  const { register } = useAuth();
  const [form, setForm] = useState({ full_name: '', username: '', email: '', password: '', confirm: '', mobile: '' });
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [sendingOtp, setSendingOtp] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [loading, setLoading] = useState(false);
  const set = (k: string) => (v: string) => setForm((f) => ({ ...f, [k]: v }));

  useEffect(() => {
    if (countdown <= 0) return;
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  const handleSendOtp = async () => {
    const mobile = form.mobile.trim();
    if (!mobile.startsWith('+') || mobile.length < 10) {
      Alert.alert('Invalid Mobile', 'Enter with country code, e.g. +919876543210');
      return;
    }
    setSendingOtp(true);
    try {
      await api.post('/auth/send-otp', { mobile });
      setOtpSent(true);
      setCountdown(60);
    } catch (err: any) {
      const status = err.response?.status;
      const msg = err.response?.data?.error || 'Failed to send OTP.';
      if (status === 409) {
        Alert.alert('Already Registered', msg + '\n\nPlease sign in instead.', [
          { text: 'Go to Login', onPress: () => navigation.navigate('Login') },
          { text: 'Cancel', style: 'cancel' },
        ]);
      } else {
        Alert.alert('Error', msg);
      }
    } finally {
      setSendingOtp(false);
    }
  };

  const handleRegister = async () => {
    if (!form.full_name || !form.username || !form.email || !form.password) {
      Alert.alert('Error', 'Please fill in all fields.'); return;
    }
    if (form.password !== form.confirm) { Alert.alert('Error', 'Passwords do not match.'); return; }
    if (!otpSent || otpCode.length < 4) { Alert.alert('Error', 'Please verify your mobile number first.'); return; }
    setLoading(true);
    try {
      await register(form.username.toLowerCase(), form.email, form.password, form.full_name, form.mobile, otpCode, false);
    } catch (err: any) {
      Alert.alert('Registration Failed', err.response?.data?.error || 'Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <View style={styles.logoBox}>
        <View style={styles.logoIcon}><Text style={styles.logoLetter}>K</Text></View>
        <Text style={styles.title}>Join the Community</Text>
        <Text style={styles.subtitle}>Create your Karuneegar Central profile</Text>
      </View>

      <View style={styles.card}>
        {[
          { label: 'Full Name', key: 'full_name', placeholder: 'Your full name' },
          { label: 'Username', key: 'username', placeholder: 'e.g. sathya_k', autoCapitalize: 'none' },
          { label: 'Email', key: 'email', placeholder: 'your@email.com', keyboardType: 'email-address', autoCapitalize: 'none' },
          { label: 'Password', key: 'password', placeholder: 'Min 6 characters', secure: true },
          { label: 'Confirm Password', key: 'confirm', placeholder: 'Repeat password', secure: true },
        ].map((f) => (
          <View key={f.key}>
            <Text style={styles.label}>{f.label}</Text>
            <TextInput
              style={styles.input}
              placeholder={f.placeholder}
              secureTextEntry={!!f.secure}
              keyboardType={(f as any).keyboardType || 'default'}
              autoCapitalize={(f as any).autoCapitalize || 'sentences'}
              value={(form as any)[f.key]}
              onChangeText={set(f.key)}
            />
          </View>
        ))}

        {/* Mobile + OTP */}
        <Text style={styles.label}>Mobile Number</Text>
        <View style={styles.row}>
          <TextInput
            style={[styles.input, { flex: 1, marginRight: 8 }]}
            placeholder="+919876543210"
            keyboardType="phone-pad"
            value={form.mobile}
            onChangeText={set('mobile')}
          />
          <TouchableOpacity
            style={[styles.otpBtn, (sendingOtp || countdown > 0) && styles.otpBtnDisabled]}
            onPress={handleSendOtp}
            disabled={sendingOtp || countdown > 0}
          >
            {sendingOtp
              ? <ActivityIndicator color={colors.primary} size="small" />
              : <Text style={styles.otpBtnText}>{countdown > 0 ? `${countdown}s` : otpSent ? 'Resend' : 'Send OTP'}</Text>}
          </TouchableOpacity>
        </View>

        {otpSent && (
          <>
            <Text style={styles.label}>OTP Code</Text>
            <TextInput
              style={styles.input}
              placeholder="6-digit code"
              keyboardType="number-pad"
              maxLength={6}
              value={otpCode}
              onChangeText={setOtpCode}
            />
          </>
        )}

        <TouchableOpacity style={styles.primaryBtn} onPress={handleRegister} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryBtnText}>Create Account</Text>}
        </TouchableOpacity>
      </View>

      {/* Sign In CTA */}
      <View style={styles.signinCard}>
        <Text style={styles.signinTitle}>Already a member?</Text>
        <TouchableOpacity style={styles.signinBtn} onPress={() => navigation.navigate('Login')}>
          <Text style={styles.signinBtnText}>Sign In</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: '#fff7ed' },
  container: { padding: spacing.lg, paddingTop: 60, paddingBottom: 40 },
  logoBox: { alignItems: 'center', marginBottom: spacing.xl },
  logoIcon: { width: 60, height: 60, borderRadius: radius.md, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.md },
  logoLetter: { color: '#fff', fontSize: 28, fontWeight: '700' },
  title: { fontSize: 24, fontWeight: '700', color: colors.text, marginBottom: 4 },
  subtitle: { fontSize: 15, color: colors.textMuted },
  card: { backgroundColor: colors.card, borderRadius: radius.lg, padding: spacing.lg, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, elevation: 2, marginBottom: spacing.md },
  label: { fontSize: 13, fontWeight: '600', color: colors.text, marginBottom: 6, marginTop: spacing.sm },
  input: { borderWidth: 1.5, borderColor: colors.border, borderRadius: radius.md, padding: 12, fontSize: 15, color: colors.text, backgroundColor: '#fafaf9' },
  row: { flexDirection: 'row', alignItems: 'center' },
  otpBtn: { borderWidth: 2, borderColor: colors.primary, borderRadius: radius.md, paddingHorizontal: 14, paddingVertical: 12, alignItems: 'center', justifyContent: 'center', minWidth: 90 },
  otpBtnDisabled: { borderColor: colors.border },
  otpBtnText: { color: colors.primary, fontWeight: '700', fontSize: 13 },
  primaryBtn: { backgroundColor: colors.primary, borderRadius: radius.md, padding: 14, alignItems: 'center', marginTop: spacing.lg },
  primaryBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  signinCard: { backgroundColor: colors.card, borderRadius: radius.lg, padding: spacing.lg, borderWidth: 2, borderColor: colors.border, alignItems: 'center' },
  signinTitle: { fontSize: 14, fontWeight: '600', color: colors.text, marginBottom: spacing.md },
  signinBtn: { borderWidth: 2, borderColor: colors.primary, borderRadius: radius.md, paddingVertical: 12, paddingHorizontal: 32, width: '100%', alignItems: 'center' },
  signinBtnText: { color: colors.primary, fontWeight: '700', fontSize: 15 },
});
