import { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, Image, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api, { uploadUrl } from '../api/client';
import { colors, spacing, radius } from '../theme';

export default function BusinessesScreen({ navigation }: any) {
  const [businesses, setBusinesses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    setLoading(true);
    api.get('/businesses', { params: { q: search } })
      .then((r) => setBusinesses(r.data.businesses))
      .finally(() => setLoading(false));
  }, [search]);

  return (
    <View style={styles.container}>
      {/* Action menu */}
      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.actionCard}
          onPress={() => navigation.navigate('CreateBusiness')}
          activeOpacity={0.75}
        >
          <View style={[styles.actionIcon, { backgroundColor: '#fff7ed' }]}>
            <Ionicons name="business-outline" size={22} color={colors.primary} />
          </View>
          <View style={styles.actionText}>
            <Text style={styles.actionTitle}>Create Business</Text>
            <Text style={styles.actionSub}>Register your business profile</Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color={colors.textLight} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionCard}
          onPress={() => navigation.navigate('CreateBusinessAd')}
          activeOpacity={0.75}
        >
          <View style={[styles.actionIcon, { backgroundColor: '#fef3c7' }]}>
            <Ionicons name="megaphone-outline" size={22} color={colors.amber} />
          </View>
          <View style={styles.actionText}>
            <Text style={styles.actionTitle}>Create Ads</Text>
            <Text style={styles.actionSub}>Post an advertisement for your business</Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color={colors.textLight} />
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View style={styles.searchBox}>
        <Ionicons name="search-outline" size={18} color={colors.textMuted} style={{ marginRight: 8 }} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search businesses…"
          value={search}
          onChangeText={setSearch}
          returnKeyType="search"
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch('')}>
            <Ionicons name="close-circle" size={18} color={colors.textLight} />
          </TouchableOpacity>
        )}
      </View>

      <Text style={styles.listHeader}>Community Businesses</Text>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 40 }} color={colors.primary} />
      ) : (
        <FlatList
          data={businesses}
          keyExtractor={(i) => String(i.id)}
          contentContainerStyle={{ paddingHorizontal: spacing.md, paddingBottom: spacing.xl }}
          renderItem={({ item }) => {
            const logo = item.logo_filename ? uploadUrl(item.logo_filename) : null;
            return (
              <TouchableOpacity
                style={styles.card}
                onPress={() => navigation.navigate('BusinessProfile', { id: item.id })}
                activeOpacity={0.75}
              >
                <View style={styles.logoBox}>
                  {logo
                    ? <Image source={{ uri: logo }} style={styles.logo} resizeMode="contain" />
                    : <Ionicons name="briefcase" size={24} color={colors.primary} />}
                </View>
                <View style={styles.info}>
                  <Text style={styles.name}>{item.company_name}</Text>
                  {item.tagline && <Text style={styles.tagline} numberOfLines={1}>{item.tagline}</Text>}
                  <View style={styles.tags}>
                    {item.category && (
                      <View style={styles.tag}>
                        <Text style={styles.tagText}>{item.category}</Text>
                      </View>
                    )}
                    {item.city && (
                      <Text style={styles.city}>
                        <Ionicons name="location-outline" size={11} /> {item.city}
                      </Text>
                    )}
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={18} color={colors.textLight} />
              </TouchableOpacity>
            );
          }}
          ListEmptyComponent={
            <View style={styles.emptyBox}>
              <Ionicons name="briefcase-outline" size={48} color={colors.primaryLight} />
              <Text style={styles.emptyText}>
                {search ? 'No businesses match your search.' : 'No businesses listed yet.'}
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  actions: { flexDirection: 'row', gap: spacing.sm, padding: spacing.md, paddingBottom: 0 },
  actionCard: {
    flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: colors.card, borderRadius: radius.lg, padding: 12,
    borderWidth: 1, borderColor: colors.border,
  },
  actionIcon: { width: 40, height: 40, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  actionText: { flex: 1 },
  actionTitle: { fontSize: 13, fontWeight: '700', color: colors.text },
  actionSub: { fontSize: 11, color: colors.textMuted, marginTop: 1 },
  searchBox: {
    flexDirection: 'row', alignItems: 'center',
    margin: spacing.md, marginBottom: spacing.sm,
    backgroundColor: colors.card, borderRadius: radius.md,
    paddingHorizontal: 12, borderWidth: 1, borderColor: colors.border,
  },
  searchInput: { flex: 1, paddingVertical: 10, fontSize: 15, color: colors.text },
  listHeader: { fontSize: 12, fontWeight: '700', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5, paddingHorizontal: spacing.md, marginBottom: spacing.sm },
  card: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.card, borderRadius: radius.lg,
    padding: spacing.md, marginBottom: 10,
  },
  logoBox: { width: 52, height: 52, borderRadius: radius.md, backgroundColor: '#fff7ed', alignItems: 'center', justifyContent: 'center', marginRight: 12, overflow: 'hidden' },
  logo: { width: 52, height: 52 },
  info: { flex: 1 },
  name: { fontSize: 15, fontWeight: '600', color: colors.text },
  tagline: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  tags: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
  tag: { backgroundColor: '#fff7ed', borderRadius: 99, paddingHorizontal: 8, paddingVertical: 2 },
  tagText: { fontSize: 11, color: colors.primary, fontWeight: '600' },
  city: { fontSize: 11, color: colors.textMuted },
  emptyBox: { alignItems: 'center', gap: 12, marginTop: 48 },
  emptyText: { fontSize: 14, color: colors.textMuted, textAlign: 'center' },
});
