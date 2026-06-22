import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, ActivityIndicator, Alert,
} from 'react-native';
import api from '../api/client';
import { colors, spacing, radius } from '../theme';

type Step = 'mobile' | 'otp' | 'password';

export default function ForgotPasswordScreen({ navigation }: any) {
  const [step, setStep] = useState<Step>('mobile');

  const [mobile, setMobile] = useState('');
  const [email, setEmail]   = useState('');
  const [via, setVia]       = useState<'sms' | 'email'>('sms');

  const [otp, setOtp]               = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPass, setConfirmPass] = useState('');

  const [loading, setLoading] = useState(false);
  const [info, setInfo]       = useState('');

  const isIndian = mobile.startsWith('+91');

  const sendOtp = async () => {
    if (!mobile) { Alert.alert('Error', 'Enter your registered mobile number.'); return; }
    setLoading(true);
    try {
      const body: Record<string, string> = { mobile };
      if (!isIndian && email) body.email = email;
      const res = await api.post('/auth/forgot-password', body);
      setVia(res.data.via);
      setInfo(res.data.message);
      setStep('otp');
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.error || 'Failed to send OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async () => {
    if (newPassword !== confirmPass) { Alert.alert('Error', 'Passwords do not match.'); return; }
    if (newPassword.length < 6)      { Alert.alert('Error', 'Password must be at least 6 characters.'); return; }
    setLoading(true);
    try {
      await api.post('/auth/reset-password', { mobile, otp_code: otp, new_password: newPassword });
      Alert.alert('Success', 'Password reset successfully!', [
        { text: 'Sign In', onPress: () => navigation.navigate('Login') },
      ]);
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.error || 'Failed to reset password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      {/* Logo */}
      <View style={styles.logoBox}>
        <View style={styles.logoIcon}><Text style={styles.logoLetter}>K</Text></View>
        <Text style={styles.title}>Reset Password</Text>
        <Text style={styles.subtitle}>
          {step === 'mobile'   && 'Enter your registered mobile number'}
          {step === 'otp'      && `Enter the OTP sent to your ${via === 'sms' ? 'mobile' : 'email'}`}
          {step === 'password' && 'Choose a new password'}
        </Text>
      </View>

      <View style={styles.card}>
        {/* Step 1 — mobile */}
        {step === 'mobile' && (
          <>
            {info ? <Text style={styles.info}>{info}</Text> : null}
            <Text style={styles.label}>Mobile Number</Text>
            <TextInput
              style={styles.input}
              placeholder="+919876543210"
              keyboardType="phone-pad"
              autoCapitalize="none"
              value={mobile}
              onChangeText={setMobile}
            />
            <Text style={styles.hint}>Include country code, e.g. +919876543210</Text>

            {mobile.length > 3 && !isIndian && (
              <>
                <Text style={[styles.label, { marginTop: spacing.md }]}>Email (for OTP delivery)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="your@email.com"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  value={email}
                  onChangeText={setEmail}
                />
              </>
            )}

            <TouchableOpacity style={styles.primaryBtn} onPress={sendOtp} disabled={loading}>
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryBtnText}>Send OTP</Text>}
            </TouchableOpacity>
          </>
        )}

        {/* Step 2 — OTP */}
        {step === 'otp' && (
          <>
            {info ? <Text style={styles.info}>{info}</Text> : null}
            <Text style={styles.label}>OTP Code</Text>
            <TextInput
              style={[styles.input, styles.otpInput]}
              placeholder="------"
              keyboardType="number-pad"
              maxLength={6}
              value={otp}
              onChangeText={(v) => setOtp(v.replace(/\D/g, ''))}
            />
            <TouchableOpacity
              style={[styles.primaryBtn, otp.length < 4 && styles.disabledBtn]}
              onPress={() => setStep('password')}
              disabled={otp.length < 4}
            >
              <Text style={styles.primaryBtnText}>Verify OTP</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.linkBtn} onPress={() => { setStep('mobile'); setOtp(''); }}>
              <Text style={styles.linkBtnText}>← Change mobile number</Text>
            </TouchableOpacity>
          </>
        )}

        {/* Step 3 — new password */}
        {step === 'password' && (
          <>
            <Text style={styles.label}>New Password</Text>
            <TextInput
              style={styles.input}
              placeholder="At least 6 characters"
              secureTextEntry
              value={newPassword}
              onChangeText={setNewPassword}
            />
            <Text style={[styles.label, { marginTop: spacing.md }]}>Confirm Password</Text>
            <TextInput
              style={styles.input}
              placeholder="Repeat new password"
              secureTextEntry
              value={confirmPass}
              onChangeText={setConfirmPass}
            />
            <TouchableOpacity style={styles.primaryBtn} onPress={resetPassword} disabled={loading}>
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryBtnText}>Reset Password</Text>}
            </TouchableOpacity>
          </>
        )}
      </View>

      <TouchableOpacity style={styles.backLink} onPress={() => navigation.navigate('Login')}>
        <Text style={styles.backLinkText}>Remember your password? Sign in</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll:         { flex: 1, backgroundColor: '#fff7ed' },
  container:      { padding: spacing.lg, paddingTop: 60 },
  logoBox:        { alignItems: 'center', marginBottom: spacing.xl },
  logoIcon:       { width: 60, height: 60, borderRadius: radius.md, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.md },
  logoLetter:     { color: '#fff', fontSize: 28, fontWeight: '700' },
  title:          { fontSize: 24, fontWeight: '700', color: colors.text, marginBottom: 4 },
  subtitle:       { fontSize: 15, color: colors.textMuted, textAlign: 'center' },
  card:           { backgroundColor: colors.card, borderRadius: radius.lg, padding: spacing.lg, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
  label:          { fontSize: 13, fontWeight: '600', color: colors.text, marginBottom: 6, marginTop: spacing.sm },
  input:          { borderWidth: 1.5, borderColor: colors.border, borderRadius: radius.md, padding: 12, fontSize: 15, color: colors.text, backgroundColor: '#fafaf9' },
  otpInput:       { textAlign: 'center', fontSize: 22, letterSpacing: 8 },
  hint:           { fontSize: 12, color: colors.textMuted, marginTop: 4 },
  info:           { backgroundColor: '#f0fdf4', borderColor: '#bbf7d0', borderWidth: 1, borderRadius: radius.sm, padding: 10, marginBottom: spacing.sm, color: '#166534', fontSize: 13 },
  primaryBtn:     { backgroundColor: colors.primary, borderRadius: radius.md, padding: 14, alignItems: 'center', marginTop: spacing.lg },
  primaryBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  disabledBtn:    { opacity: 0.5 },
  linkBtn:        { alignItems: 'center', marginTop: spacing.md },
  linkBtnText:    { color: colors.primary, fontSize: 14 },
  backLink:       { alignItems: 'center', marginTop: spacing.lg },
  backLinkText:   { color: colors.textMuted, fontSize: 14 },
});
