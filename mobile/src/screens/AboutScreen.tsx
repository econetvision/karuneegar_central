import React from 'react';
import { View, Text, ScrollView, StyleSheet, Linking, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radius } from '../theme';

export default function AboutScreen() {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.hero}>
        <View style={styles.logoBox}>
          <Ionicons name="people" size={48} color={colors.primary} />
        </View>
        <Text style={styles.appName}>Karuneegar Central</Text>
        <Text style={styles.tagline}>Connecting our community, preserving our heritage</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Our Mission</Text>
        <Text style={styles.body}>
          Karuneegar Central is a digital home for the Karuneegar community — bringing members together across generations and geographies to share resources, celebrate culture, and support one another.
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>What We Offer</Text>
        {[
          ['people-outline', 'Member Directory', 'Discover and connect with community members worldwide'],
          ['chatbubbles-outline', 'Community Forums', 'Discuss topics, share news, and ask questions'],
          ['school-outline', 'Scholarships', 'Request or offer educational support'],
          ['heart-outline', 'Matrimony', 'Find a life partner within the community'],
          ['briefcase-outline', 'Business Directory', 'Support fellow community entrepreneurs'],
          ['git-branch-outline', 'Family Tree', 'Trace and document your family lineage'],
        ].map(([icon, title, desc]) => (
          <View key={title} style={styles.featureRow}>
            <View style={styles.featureIcon}>
              <Ionicons name={icon as any} size={20} color={colors.primary} />
            </View>
            <View style={styles.featureInfo}>
              <Text style={styles.featureTitle}>{title}</Text>
              <Text style={styles.featureDesc}>{desc}</Text>
            </View>
          </View>
        ))}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Contact Us</Text>
        <TouchableOpacity style={styles.linkRow} onPress={() => Linking.openURL('mailto:info@karuneegar-central.org')}>
          <Ionicons name="mail-outline" size={18} color={colors.primary} />
          <Text style={styles.linkText}>info@karuneegar-central.org</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.linkRow} onPress={() => Linking.openURL('https://karuneegar-central.org')}>
          <Ionicons name="globe-outline" size={18} color={colors.primary} />
          <Text style={styles.linkText}>karuneegar-central.org</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.version}>Version 1.0.0</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.md },
  hero: { alignItems: 'center', padding: spacing.xl, marginBottom: spacing.md },
  logoBox: { width: 88, height: 88, borderRadius: radius.xl, backgroundColor: colors.primaryLight, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  appName: { fontSize: 24, fontWeight: '700', color: colors.text },
  tagline: { fontSize: 14, color: colors.textMuted, textAlign: 'center', marginTop: 6, lineHeight: 20 },
  section: { backgroundColor: colors.card, borderRadius: radius.lg, padding: spacing.md, marginBottom: spacing.md },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: colors.text, marginBottom: 10 },
  body: { fontSize: 14, color: colors.textMuted, lineHeight: 22 },
  featureRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 12 },
  featureIcon: { width: 36, height: 36, borderRadius: radius.md, backgroundColor: '#fff7ed', alignItems: 'center', justifyContent: 'center' },
  featureInfo: { flex: 1 },
  featureTitle: { fontSize: 14, fontWeight: '600', color: colors.text },
  featureDesc: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  linkRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8 },
  linkText: { fontSize: 14, color: colors.primary, textDecorationLine: 'underline' },
  version: { textAlign: 'center', color: colors.textLight, fontSize: 12, marginVertical: spacing.md },
});
