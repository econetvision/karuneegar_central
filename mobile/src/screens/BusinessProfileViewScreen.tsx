import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, ActivityIndicator, Image, TouchableOpacity, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api, { uploadUrl } from '../api/client';
import { colors, spacing, radius } from '../theme';

export default function BusinessProfileViewScreen({ route }: any) {
  const { id } = route.params;
  const [biz, setBiz] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/businesses/${id}`).then((r) => setBiz(r.data.business)).finally(() => setLoading(false));
  }, [id]);

  if (loading) return <ActivityIndicator style={{ flex: 1 }} color={colors.primary} />;
  if (!biz) return <View style={styles.center}><Text>Business not found.</Text></View>;

  const logo = biz.logo_filename ? uploadUrl(biz.logo_filename) : null;

  return (
    <ScrollView style={styles.container}>
      <View style={styles.hero}>
        <View style={styles.logoBox}>
          {logo ? <Image source={{ uri: logo }} style={styles.logo} resizeMode="contain" /> : <Ionicons name="briefcase" size={48} color={colors.primary} />}
        </View>
        <Text style={styles.name}>{biz.company_name}</Text>
        {biz.tagline && <Text style={styles.tagline}>{biz.tagline}</Text>}
        {biz.category && (
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryBadgeText}>{biz.category}</Text>
          </View>
        )}
      </View>

      {biz.description && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>
          <Text style={styles.description}>{biz.description}</Text>
        </View>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Contact & Location</Text>
        {[
          ['location-outline', biz.address],
          ['location-outline', biz.city && biz.state ? `${biz.city}, ${biz.state}` : (biz.city || biz.state)],
          ['call-outline', biz.phone],
          ['mail-outline', biz.email],
          ['globe-outline', biz.website],
        ].filter(([, v]) => v).map(([icon, value], i) => (
          <TouchableOpacity
            key={i}
            style={styles.contactRow}
            onPress={() => {
              if (icon === 'call-outline') Linking.openURL(`tel:${value}`);
              else if (icon === 'mail-outline') Linking.openURL(`mailto:${value}`);
              else if (icon === 'globe-outline') Linking.openURL(value!.startsWith('http') ? value! : `https://${value}`);
            }}
          >
            <Ionicons name={icon as any} size={16} color={colors.primary} />
            <Text style={styles.contactText}>{value}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {biz.working_hours && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Working Hours</Text>
          <Text style={styles.description}>{biz.working_hours}</Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  hero: { alignItems: 'center', padding: spacing.xl, backgroundColor: colors.card, borderBottomLeftRadius: 24, borderBottomRightRadius: 24, marginBottom: spacing.md },
  logoBox: { width: 88, height: 88, borderRadius: radius.lg, backgroundColor: '#fff7ed', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', marginBottom: 12 },
  logo: { width: 88, height: 88 },
  name: { fontSize: 22, fontWeight: '700', color: colors.text },
  tagline: { fontSize: 14, color: colors.textMuted, marginTop: 4, textAlign: 'center' },
  categoryBadge: { backgroundColor: '#fff7ed', borderRadius: 99, paddingHorizontal: 12, paddingVertical: 4, marginTop: 8 },
  categoryBadgeText: { fontSize: 12, color: colors.primary, fontWeight: '700' },
  section: { backgroundColor: colors.card, borderRadius: radius.lg, marginHorizontal: spacing.md, marginBottom: spacing.md, padding: spacing.md },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: colors.textMuted, marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 },
  description: { fontSize: 14, color: colors.text, lineHeight: 22 },
  contactRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: colors.border },
  contactText: { fontSize: 14, color: colors.text },
});
