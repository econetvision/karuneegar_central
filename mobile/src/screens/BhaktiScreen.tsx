import { useEffect, useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  ActivityIndicator, Image, Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import api from '../api/client';
import { colors, spacing, radius } from '../theme';

interface Video {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  published_at: string;
}

export default function BhaktiScreen() {
  const { t } = useTranslation();
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [configured, setConfigured] = useState(true);

  useEffect(() => {
    api.get('/bhakti')
      .then(r => {
        setVideos(r.data.videos || []);
        setConfigured(r.data.configured !== false);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const fmtDate = (d: string) => {
    try {
      return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
    } catch { return ''; }
  };

  const openVideo = (videoId: string) => {
    Linking.openURL(`https://www.youtube.com/watch?v=${videoId}`);
  };

  if (loading) {
    return <ActivityIndicator style={{ flex: 1 }} color={colors.primary} />;
  }

  if (!configured || videos.length === 0) {
    return (
      <View style={styles.empty}>
        <Ionicons name="musical-notes-outline" size={52} color={colors.border} />
        <Text style={styles.emptyTitle}>{t('bhakti.noVideos')}</Text>
        <Text style={styles.emptyDesc}>{t('bhakti.noVideosDesc')}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{t('bhakti.title')}</Text>
        <Text style={styles.headerSubtitle}>{t('bhakti.subtitle')}</Text>
      </View>
      <FlatList
        data={videos}
        keyExtractor={v => v.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.card} onPress={() => openVideo(item.id)} activeOpacity={0.85}>
            <View style={styles.thumbWrap}>
              {item.thumbnail ? (
                <Image source={{ uri: item.thumbnail }} style={styles.thumb} resizeMode="cover" />
              ) : (
                <View style={styles.thumbPlaceholder}>
                  <Ionicons name="musical-notes-outline" size={36} color="#c4b5fd" />
                </View>
              )}
              <View style={styles.playOverlay}>
                <Ionicons name="play-circle" size={48} color="rgba(255,255,255,0.92)" />
              </View>
            </View>
            <View style={styles.info}>
              <Text style={styles.date}>{fmtDate(item.published_at)}</Text>
              <Text style={styles.title} numberOfLines={2}>{item.title}</Text>
              {item.description ? (
                <Text style={styles.desc} numberOfLines={2}>{item.description}</Text>
              ) : null}
              <Text style={styles.watchLink}>{t('bhakti.watchOnYoutube')} →</Text>
            </View>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container:       { flex: 1, backgroundColor: colors.background },
  header:          { backgroundColor: '#6d28d9', padding: spacing.lg, paddingBottom: 20 },
  headerTitle:     { fontSize: 26, fontWeight: '700', color: '#fff', marginBottom: 4 },
  headerSubtitle:  { fontSize: 14, color: '#ddd6fe' },
  list:            { padding: spacing.md, gap: 14 },
  card:            { backgroundColor: colors.card, borderRadius: radius.lg, overflow: 'hidden', borderWidth: 1, borderColor: colors.border },
  thumbWrap:       { width: '100%', aspectRatio: 16 / 9, backgroundColor: '#1e1b4b', justifyContent: 'center', alignItems: 'center' },
  thumb:           { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  thumbPlaceholder: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  playOverlay:     { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.25)' },
  info:            { padding: spacing.md },
  date:            { fontSize: 11, color: '#7c3aed', fontWeight: '600', marginBottom: 4 },
  title:           { fontSize: 15, fontWeight: '700', color: colors.text, lineHeight: 20, marginBottom: 4 },
  desc:            { fontSize: 13, color: colors.textMuted, lineHeight: 18, marginBottom: 6 },
  watchLink:       { fontSize: 13, fontWeight: '600', color: '#7c3aed' },
  empty:           { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl, gap: 12 },
  emptyTitle:      { fontSize: 17, fontWeight: '700', color: colors.text },
  emptyDesc:       { fontSize: 13, color: colors.textMuted, textAlign: 'center', lineHeight: 20 },
});
