import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radius } from '../theme';

const SERVICES = [
  { label: 'Pilgrimages', icon: 'navigate-outline', screen: 'Pilgrimages', color: '#d97706', bg: '#fffbeb', desc: 'Bhakti trips & group tours' },
  { label: 'Scholarships', icon: 'school-outline', screen: 'Scholarships', color: '#3b82f6', bg: '#eff6ff', desc: 'Request or offer scholarships' },
  { label: 'Matrimony', icon: 'heart-outline', screen: 'Matrimony', color: '#f43f5e', bg: '#fff1f2', desc: 'Browse matrimony profiles' },
  { label: 'Businesses', icon: 'briefcase-outline', screen: 'Businesses', color: '#f97316', bg: '#fff7ed', desc: 'Discover member businesses' },
  { label: 'Family Tree', icon: 'git-branch-outline', screen: 'FamilyTree', color: '#8b5cf6', bg: '#f5f3ff', desc: 'Build your family tree' },
  { label: 'Forums', icon: 'chatbubbles-outline', screen: 'Forums', color: '#16a34a', bg: '#f0fdf4', desc: 'Discuss community topics' },
  { label: 'Members', icon: 'people-outline', screen: 'Members', color: '#0ea5e9', bg: '#f0f9ff', desc: 'Browse all members' },
];

export default function ServicesScreen({ navigation }: any) {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.heading}>Community Services</Text>
      <Text style={styles.subheading}>Everything the Karuneegar community has to offer</Text>
      <View style={styles.grid}>
        {SERVICES.map((svc) => (
          <TouchableOpacity key={svc.screen} style={styles.card} onPress={() => navigation.navigate(svc.screen)}>
            <View style={[styles.iconBox, { backgroundColor: svc.bg }]}>
              <Ionicons name={svc.icon as any} size={28} color={svc.color} />
            </View>
            <Text style={styles.cardLabel}>{svc.label}</Text>
            <Text style={styles.cardDesc}>{svc.desc}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.md },
  heading: { fontSize: 22, fontWeight: '700', color: colors.text, marginBottom: 4 },
  subheading: { fontSize: 14, color: colors.textMuted, marginBottom: spacing.lg },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  card: { width: '47%', backgroundColor: colors.card, borderRadius: radius.lg, padding: spacing.md, alignItems: 'flex-start' },
  iconBox: { width: 52, height: 52, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  cardLabel: { fontSize: 15, fontWeight: '700', color: colors.text, marginBottom: 4 },
  cardDesc: { fontSize: 12, color: colors.textMuted, lineHeight: 16 },
});
