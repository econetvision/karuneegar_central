import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, TextInput, TouchableOpacity, Image, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api, { uploadUrl } from '../api/client';
import { colors, spacing, radius } from '../theme';

interface Member {
  id: number;
  username: string;
  member_id: string | null;
  profile: { full_name?: string; location?: string; occupation?: string; photo_filename?: string } | null;
}

export default function MembersScreen({ navigation }: any) {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const fetchMembers = useCallback(async (p = 1, q = '') => {
    try {
      const r = await api.get('/members', { params: { page: p, q } });
      const data: Member[] = r.data.members;
      if (p === 1) setMembers(data);
      else setMembers((prev) => [...prev, ...data]);
      setHasMore(r.data.page < r.data.pages);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  useEffect(() => { setLoading(true); setPage(1); fetchMembers(1, search); }, [search]);

  const loadMore = () => {
    if (!hasMore || loadingMore) return;
    const next = page + 1;
    setPage(next);
    setLoadingMore(true);
    fetchMembers(next, search);
  };

  const renderItem = ({ item }: { item: Member }) => {
    const name = item.profile?.full_name || item.username;
    const photo = item.profile?.photo_filename ? uploadUrl(item.profile.photo_filename) : null;
    return (
      <TouchableOpacity style={styles.card} onPress={() => navigation.navigate('UserProfile', { username: item.username })}>
        <View style={styles.avatar}>
          {photo
            ? <Image source={{ uri: photo }} style={styles.avatarImg} />
            : <Text style={styles.avatarInitial}>{name[0]?.toUpperCase()}</Text>}
        </View>
        <View style={styles.info}>
          <Text style={styles.name}>{name}</Text>
          {item.member_id && <Text style={styles.memberId}>{item.member_id}</Text>}
          <Text style={styles.username}>@{item.username}</Text>
          {item.profile?.location && (
            <Text style={styles.meta}><Ionicons name="location-outline" size={11} /> {item.profile.location}</Text>
          )}
        </View>
        <Ionicons name="chevron-forward" size={18} color={colors.textLight} />
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.searchBox}>
        <Ionicons name="search-outline" size={18} color={colors.textMuted} style={{ marginRight: 8 }} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search members…"
          value={search}
          onChangeText={setSearch}
          returnKeyType="search"
        />
      </View>
      {loading ? (
        <ActivityIndicator style={{ marginTop: 40 }} color={colors.primary} />
      ) : (
        <FlatList
          data={members}
          keyExtractor={(i) => String(i.id)}
          renderItem={renderItem}
          contentContainerStyle={{ padding: spacing.md }}
          onEndReached={loadMore}
          onEndReachedThreshold={0.3}
          ListFooterComponent={loadingMore ? <ActivityIndicator color={colors.primary} style={{ padding: 16 }} /> : null}
          ListEmptyComponent={<Text style={styles.empty}>No members found.</Text>}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  searchBox: { flexDirection: 'row', alignItems: 'center', margin: spacing.md, backgroundColor: colors.card, borderRadius: radius.md, paddingHorizontal: 12, borderWidth: 1, borderColor: colors.border },
  searchInput: { flex: 1, paddingVertical: 10, fontSize: 15, color: colors.text },
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.card, borderRadius: radius.lg, padding: spacing.md, marginBottom: 10, shadowColor: '#000', shadowOpacity: 0.04, elevation: 1 },
  avatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: colors.primaryLight, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  avatarImg: { width: 48, height: 48, borderRadius: 24 },
  avatarInitial: { fontSize: 20, fontWeight: '700', color: colors.primary },
  info: { flex: 1 },
  name: { fontSize: 15, fontWeight: '600', color: colors.text },
  memberId: { fontSize: 12, color: colors.primary, fontWeight: '600' },
  username: { fontSize: 12, color: colors.textMuted },
  meta: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  empty: { textAlign: 'center', color: colors.textMuted, marginTop: 40, fontSize: 15 },
});
