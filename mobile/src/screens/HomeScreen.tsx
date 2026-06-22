import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import api from '../api/client';
import { colors, spacing, radius } from '../theme';

const SERVICES = [
  { icon: 'people', label: 'Members', tab: 'Members', color: '#fff7ed', iconColor: colors.primary },
  { icon: 'git-branch', label: 'Family Tree', tab: 'Services', screen: 'FamilyTree', color: '#f0fdf4', iconColor: '#16a34a' },
  { icon: 'chatbubbles', label: 'Forums', tab: 'Forums', color: '#eff6ff', iconColor: '#3b82f6' },
  { icon: 'heart', label: 'Matrimony', tab: 'Services', screen: 'Matrimony', color: '#fff1f2', iconColor: '#f43f5e' },
  { icon: 'school', label: 'Scholarships', tab: 'Services', screen: 'Scholarships', color: '#fefce8', iconColor: '#ca8a04' },
  { icon: 'briefcase', label: 'Businesses', tab: 'Services', screen: 'Businesses', color: '#f5f3ff', iconColor: '#7c3aed' },
];

export default function HomeScreen({ navigation }: any) {
  const { user } = useAuth();
  const [stats, setStats] = useState({ members: 0, families: 0, forum_threads: 0, matrimony_profiles: 0 });

  useEffect(() => {
    api.get('/stats').then((r) => setStats(r.data)).catch(() => {});
  }, []);

  return (
    <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
      {/* Hero */}
      <View style={styles.hero}>
        <Text style={styles.heroTagline}>🙏 Karuneegar Community</Text>
        <Text style={styles.heroTitle}>Karuneegar{'\n'}<Text style={styles.heroAccent}>Central</Text></Text>
        <Text style={styles.heroSubtitle}>Connecting the community — members, families, businesses & more.</Text>
        {user && (
          <View style={styles.welcomeChip}>
            <Text style={styles.welcomeText}>Welcome, {user.username}  {user.member_id && <Text style={styles.memberId}>({user.member_id})</Text>}</Text>
          </View>
        )}
      </View>

      {/* Stats */}
      <View style={styles.statsRow}>
        {[
          { label: 'Members', value: stats.members, icon: 'people-outline' },
          { label: 'Families', value: stats.families, icon: 'git-branch-outline' },
          { label: 'Threads', value: stats.forum_threads, icon: 'chatbubbles-outline' },
          { label: 'Matrimony', value: stats.matrimony_profiles, icon: 'heart-outline' },
        ].map((s) => (
          <View key={s.label} style={styles.statCard}>
            <Ionicons name={s.icon as any} size={20} color={colors.primary} />
            <Text style={styles.statValue}>{s.value}</Text>
            <Text style={styles.statLabel}>{s.label}</Text>
          </View>
        ))}
      </View>

      {/* Services grid */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Our Services</Text>
        <View style={styles.grid}>
          {SERVICES.map((s) => (
            <TouchableOpacity
              key={s.label}
              style={[styles.serviceCard, { backgroundColor: s.color }]}
              onPress={() => {
                const parent = navigation.getParent();
                if (s.screen) parent?.navigate(s.tab, { screen: s.screen });
                else parent?.navigate(s.tab);
              }}
            >
              <Ionicons name={s.icon as any} size={28} color={s.iconColor} />
              <Text style={styles.serviceLabel}>{s.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={{ height: 30 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: colors.background },
  hero: { backgroundColor: colors.primary, paddingHorizontal: spacing.lg, paddingTop: 50, paddingBottom: 30 },
  heroTagline: { color: 'rgba(255,255,255,0.8)', fontSize: 13, marginBottom: 8 },
  heroTitle: { fontSize: 36, fontWeight: '800', color: '#fff', lineHeight: 42, marginBottom: 10 },
  heroAccent: { color: '#fde68a' },
  heroSubtitle: { color: 'rgba(255,255,255,0.85)', fontSize: 14, lineHeight: 20, marginBottom: 14 },
  welcomeChip: { backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: radius.xl, paddingHorizontal: 14, paddingVertical: 6, alignSelf: 'flex-start' },
  welcomeText: { color: '#fff', fontSize: 13, fontWeight: '600' },
  memberId: { color: '#fde68a', fontWeight: '700' },
  statsRow: { flexDirection: 'row', padding: spacing.md, gap: 8 },
  statCard: { flex: 1, backgroundColor: colors.card, borderRadius: radius.md, padding: spacing.sm, alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.04, elevation: 1 },
  statValue: { fontSize: 18, fontWeight: '700', color: colors.text, marginTop: 4 },
  statLabel: { fontSize: 10, color: colors.textMuted, marginTop: 2 },
  section: { paddingHorizontal: spacing.md },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: colors.text, marginBottom: spacing.md },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  serviceCard: { width: '47%', borderRadius: radius.lg, padding: spacing.md, alignItems: 'center', justifyContent: 'center', minHeight: 90 },
  serviceLabel: { marginTop: 8, fontSize: 14, fontWeight: '600', color: colors.text },
});
