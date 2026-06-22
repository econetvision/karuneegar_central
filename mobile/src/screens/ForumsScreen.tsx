import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../api/client';
import { colors, spacing, radius } from '../theme';

const ICON_MAP: Record<string, any> = {
  briefcase: 'briefcase-outline', 'person-badge': 'person-outline', house: 'home-outline',
  book: 'book-outline', 'chat-dots': 'chatbubbles-outline',
};

export default function ForumsScreen({ navigation }: any) {
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/forums/categories').then((r) => setCategories(r.data.categories)).finally(() => setLoading(false));
  }, []);

  if (loading) return <ActivityIndicator style={{ flex: 1 }} color={colors.primary} />;

  return (
    <FlatList
      style={styles.list}
      data={categories}
      keyExtractor={(i) => String(i.id)}
      contentContainerStyle={{ padding: spacing.md }}
      ListHeaderComponent={
        <View style={{ marginBottom: spacing.md }}>
          <Text style={styles.title}>Community Forums</Text>
          <Text style={styles.subtitle}>Discussions across {categories.length} topics</Text>
        </View>
      }
      renderItem={({ item }) => (
        <TouchableOpacity style={styles.card} onPress={() => navigation.navigate('ForumCategory', { catId: item.id, title: item.name })}>
          <View style={styles.iconBox}>
            <Ionicons name={ICON_MAP[item.icon] || 'folder-outline'} size={22} color={colors.primary} />
          </View>
          <View style={styles.info}>
            <Text style={styles.name}>{item.name}</Text>
            <Text style={styles.desc} numberOfLines={1}>{item.description}</Text>
            <Text style={styles.count}>{item.thread_count ?? 0} threads</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.textLight} />
        </TouchableOpacity>
      )}
    />
  );
}

const styles = StyleSheet.create({
  list: { flex: 1, backgroundColor: colors.background },
  title: { fontSize: 22, fontWeight: '700', color: colors.text },
  subtitle: { fontSize: 14, color: colors.textMuted, marginTop: 2 },
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.card, borderRadius: radius.lg, padding: spacing.md, marginBottom: 10, shadowColor: '#000', shadowOpacity: 0.04, elevation: 1 },
  iconBox: { width: 44, height: 44, borderRadius: radius.md, backgroundColor: '#fff7ed', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  info: { flex: 1 },
  name: { fontSize: 15, fontWeight: '600', color: colors.text },
  desc: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  count: { fontSize: 11, color: colors.primary, marginTop: 2, fontWeight: '600' },
});
