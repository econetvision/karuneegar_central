import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, Image, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api, { uploadUrl } from '../api/client';
import { colors, spacing, radius } from '../theme';

export default function BusinessesScreen({ navigation }: any) {
  const [businesses, setBusinesses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    api.get('/businesses', { params: { q: search } }).then((r) => setBusinesses(r.data.businesses)).finally(() => setLoading(false));
  }, [search]);

  return (
    <View style={styles.container}>
      <View style={styles.searchBox}>
        <Ionicons name="search-outline" size={18} color={colors.textMuted} style={{ marginRight: 8 }} />
        <TextInput style={styles.searchInput} placeholder="Search businesses…" value={search} onChangeText={setSearch} />
      </View>
      {loading ? <ActivityIndicator style={{ marginTop: 40 }} color={colors.primary} /> : (
        <FlatList
          data={businesses}
          keyExtractor={(i) => String(i.id)}
          contentContainerStyle={{ padding: spacing.md }}
          renderItem={({ item }) => {
            const logo = item.logo_filename ? uploadUrl(item.logo_filename) : null;
            return (
              <TouchableOpacity style={styles.card} onPress={() => navigation.navigate('BusinessProfile', { id: item.id })}>
                <View style={styles.logoBox}>
                  {logo ? <Image source={{ uri: logo }} style={styles.logo} resizeMode="contain" /> : <Ionicons name="briefcase" size={24} color={colors.primary} />}
                </View>
                <View style={styles.info}>
                  <Text style={styles.name}>{item.company_name}</Text>
                  {item.tagline && <Text style={styles.tagline} numberOfLines={1}>{item.tagline}</Text>}
                  <View style={styles.tags}>
                    {item.category && <View style={styles.tag}><Text style={styles.tagText}>{item.category}</Text></View>}
                    {item.city && <Text style={styles.city}><Ionicons name="location-outline" size={11} /> {item.city}</Text>}
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={18} color={colors.textLight} />
              </TouchableOpacity>
            );
          }}
          ListEmptyComponent={<Text style={styles.empty}>No businesses found.</Text>}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  searchBox: { flexDirection: 'row', alignItems: 'center', margin: spacing.md, backgroundColor: colors.card, borderRadius: radius.md, paddingHorizontal: 12, borderWidth: 1, borderColor: colors.border },
  searchInput: { flex: 1, paddingVertical: 10, fontSize: 15, color: colors.text },
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.card, borderRadius: radius.lg, padding: spacing.md, marginBottom: 10 },
  logoBox: { width: 52, height: 52, borderRadius: radius.md, backgroundColor: '#fff7ed', alignItems: 'center', justifyContent: 'center', marginRight: 12, overflow: 'hidden' },
  logo: { width: 52, height: 52 },
  info: { flex: 1 },
  name: { fontSize: 15, fontWeight: '600', color: colors.text },
  tagline: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  tags: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
  tag: { backgroundColor: '#fff7ed', borderRadius: 99, paddingHorizontal: 8, paddingVertical: 2 },
  tagText: { fontSize: 11, color: colors.primary, fontWeight: '600' },
  city: { fontSize: 11, color: colors.textMuted },
  empty: { textAlign: 'center', color: colors.textMuted, marginTop: 40, fontSize: 15 },
});
