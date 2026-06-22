import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { colors, spacing, radius } from '../theme';

export default function LoginScreen({ navigation }: any) {
  const { login } = useAuth();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!identifier || !password) { Alert.alert('Error', 'Please fill in all fields.'); return; }
    setLoading(true);
    try {
      await login(identifier, password);
    } catch (err: any) {
      Alert.alert('Login Failed', err.response?.data?.error || 'Invalid credentials. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      {/* Logo */}
      <View style={styles.logoBox}>
        <View style={styles.logoIcon}><Text style={styles.logoLetter}>K</Text></View>
        <Text style={styles.title}>Welcome Back</Text>
        <Text style={styles.subtitle}>Sign in to Karuneegar Central</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Email or Username</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter email or username"
          autoCapitalize="none"
          keyboardType="email-address"
          value={identifier}
          onChangeText={setIdentifier}
        />
        <View style={styles.passwordHeader}>
          <Text style={styles.label}>Password</Text>
          <TouchableOpacity onPress={() => navigation.navigate('ForgotPassword')}>
            <Text style={styles.forgotLink}>Forgot password?</Text>
          </TouchableOpacity>
        </View>
        <TextInput
          style={styles.input}
          placeholder="Enter password"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />
        <TouchableOpacity style={styles.primaryBtn} onPress={handleLogin} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryBtnText}>Sign In</Text>}
        </TouchableOpacity>
      </View>

      {/* Join Now CTA */}
      <View style={styles.joinCard}>
        <Text style={styles.joinTitle}>New to Karuneegar Central?</Text>
        <TouchableOpacity style={styles.joinBtn} onPress={() => navigation.navigate('Register')}>
          <Text style={styles.joinBtnText}>Join Now →</Text>
        </TouchableOpacity>
        <Text style={styles.joinHint}>Free · Takes less than 2 minutes</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: '#fff7ed' },
  container: { padding: spacing.lg, paddingTop: 60 },
  logoBox: { alignItems: 'center', marginBottom: spacing.xl },
  logoIcon: { width: 60, height: 60, borderRadius: radius.md, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.md },
  logoLetter: { color: '#fff', fontSize: 28, fontWeight: '700' },
  title: { fontSize: 24, fontWeight: '700', color: colors.text, marginBottom: 4 },
  subtitle: { fontSize: 15, color: colors.textMuted },
  card: { backgroundColor: colors.card, borderRadius: radius.lg, padding: spacing.lg, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, elevation: 2, marginBottom: spacing.md },
  label: { fontSize: 13, fontWeight: '600', color: colors.text, marginBottom: 6, marginTop: spacing.sm },
  input: { borderWidth: 1.5, borderColor: colors.border, borderRadius: radius.md, padding: 12, fontSize: 15, color: colors.text, backgroundColor: '#fafaf9' },
  passwordHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6, marginTop: spacing.sm },
  forgotLink: { fontSize: 12, color: colors.primary, fontWeight: '600' },
  primaryBtn: { backgroundColor: colors.primary, borderRadius: radius.md, padding: 14, alignItems: 'center', marginTop: spacing.lg },
  primaryBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  joinCard: { backgroundColor: colors.card, borderRadius: radius.lg, padding: spacing.lg, borderWidth: 2, borderColor: '#fed7aa', alignItems: 'center' },
  joinTitle: { fontSize: 14, fontWeight: '600', color: colors.text, marginBottom: spacing.md },
  joinBtn: { backgroundColor: colors.primary, borderRadius: radius.md, paddingVertical: 12, paddingHorizontal: 32, width: '100%', alignItems: 'center' },
  joinBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  joinHint: { fontSize: 12, color: colors.textMuted, marginTop: 8 },
});
