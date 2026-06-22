import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api, { uploadUrl } from '../api/client';
import { useAuth } from '../contexts/AuthContext';
import { colors, spacing, radius } from '../theme';

export default function MatrimonyScreen({ navigation }: any) {
  const { user } = useAuth();
  const [profiles, setProfiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/matrimony').then((r) => setProfiles(r.data.profiles)).finally(() => setLoading(false));
  }, []);

  if (loading) return <ActivityIndicator style={{ flex: 1 }} color={colors.primary} />;

  return (
    <View style={styles.container}>
      {user && (
        <TouchableOpacity style={styles.createBtn} onPress={() => navigation.navigate('MatrimonyCreate')}>
          <Ionicons name="add" size={18} color="#fff" />
          <Text style={styles.createBtnText}>Create Profile</Text>
        </TouchableOpacity>
      )}
      <FlatList
        data={profiles}
        keyExtractor={(i) => String(i.id)}
        contentContainerStyle={{ padding: spacing.md }}
        renderItem={({ item }) => {
          const photo = item.photo_filename ? uploadUrl(item.photo_filename) : null;
          return (
            <TouchableOpacity style={styles.card} onPress={() => navigation.navigate('MatrimonyView', { profileId: item.id })}>
              <View style={styles.photoBox}>
                {photo
                  ? <Image source={{ uri: photo }} style={styles.photo} />
                  : <Ionicons name="person" size={32} color={colors.primaryLight} />}
              </View>
              <View style={styles.info}>
                <Text style={styles.name}>{item.full_name}</Text>
                <Text style={styles.meta}>{item.gender === 'male' ? '♂' : '♀'} · {item.age} yrs · {item.location || '—'}</Text>
                {item.occupation && <Text style={styles.meta}>{item.occupation}</Text>}
                {item.gothram && <Text style={styles.meta}>Gothram: {item.gothram}</Text>}
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.textLight} />
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={<Text style={styles.empty}>No matrimony profiles yet.</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  createBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, margin: spacing.md, backgroundColor: '#f43f5e', borderRadius: radius.md, padding: 12, alignSelf: 'flex-end' },
  createBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.card, borderRadius: radius.lg, padding: spacing.md, marginBottom: 10 },
  photoBox: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#fff1f2', alignItems: 'center', justifyContent: 'center', marginRight: 12, overflow: 'hidden' },
  photo: { width: 56, height: 56, borderRadius: 28 },
  info: { flex: 1 },
  name: { fontSize: 15, fontWeight: '600', color: colors.text },
  meta: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  empty: { textAlign: 'center', color: colors.textMuted, marginTop: 40, fontSize: 15 },
});
