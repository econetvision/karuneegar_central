import { useEffect, useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  ActivityIndicator, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../api/client';
import { colors, spacing, radius } from '../theme';

interface NotificationItem {
  id: number;
  title: string;
  body?: string;
  event_id?: number;
  read: boolean;
  created_at: string;
}

export default function NotificationsScreen({ navigation }: any) {
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [subscribed, setSubscribed] = useState(false);
  const [subLoading, setSubLoading] = useState(false);

  useEffect(() => {
    Promise.all([
      api.get('/notifications').then((r) => setItems(r.data.notifications || [])),
      api.get('/events/subscription').then((r) => setSubscribed(r.data.subscribed)),
    ])
      .catch(() => {})
      .finally(() => setLoading(false));

    const t = setTimeout(() => {
      api.put('/notifications/read-all').catch(() => {});
    }, 1500);
    return () => clearTimeout(t);
  }, []);

  const toggleSub = async () => {
    setSubLoading(true);
    try {
      if (subscribed) {
        await api.delete('/events/subscribe');
        setSubscribed(false);
        Alert.alert('Unsubscribed', 'You will no longer receive event notifications.');
      } else {
        await api.post('/events/subscribe');
        setSubscribed(true);
        Alert.alert('Subscribed!', 'You\'ll be notified when new events are posted.');
      }
    } catch {
      Alert.alert('Error', 'Could not update subscription.');
    } finally {
      setSubLoading(false);
    }
  };

  const fmtDate = (d: string) => {
    try {
      return new Date(d).toLocaleDateString('en-IN', {
        day: 'numeric', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
      });
    } catch { return d; }
  };

  const renderItem = ({ item }: { item: NotificationItem }) => (
    <TouchableOpacity
      style={[styles.card, !item.read && styles.cardUnread]}
      onPress={() => {
        if (item.event_id) navigation.navigate('EventView', { id: item.event_id });
      }}
      activeOpacity={item.event_id ? 0.7 : 1}
    >
      <View style={[styles.dot, item.read ? styles.dotRead : styles.dotUnread]} />
      <View style={{ flex: 1 }}>
        <Text style={styles.title}>{item.title}</Text>
        {item.body ? <Text style={styles.body} numberOfLines={2}>{item.body}</Text> : null}
        <Text style={styles.time}>{fmtDate(item.created_at)}</Text>
      </View>
      {item.event_id ? (
        <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
      ) : null}
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Subscribe banner */}
      <TouchableOpacity
        style={[styles.subBanner, subscribed && styles.subBannerActive]}
        onPress={toggleSub}
        disabled={subLoading}
      >
        <Ionicons
          name={subscribed ? 'notifications' : 'notifications-outline'}
          size={18}
          color={subscribed ? colors.primary : colors.textMuted}
        />
        <View style={{ flex: 1 }}>
          <Text style={[styles.subTitle, subscribed && { color: colors.primary }]}>
            {subscribed ? 'Subscribed to new events' : 'Subscribe to event notifications'}
          </Text>
          <Text style={styles.subHint}>
            {subscribed
              ? 'Tap to unsubscribe'
              : 'Get notified whenever a new event is posted'}
          </Text>
        </View>
        {subLoading
          ? <ActivityIndicator size="small" color={colors.primary} />
          : <Ionicons name={subscribed ? 'checkmark-circle' : 'add-circle-outline'} size={20} color={subscribed ? colors.primary : colors.textMuted} />}
      </TouchableOpacity>

      {loading ? (
        <ActivityIndicator style={{ flex: 1 }} color={colors.primary} />
      ) : items.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="notifications-off-outline" size={52} color={colors.border} />
          <Text style={styles.emptyTitle}>No notifications yet</Text>
          <Text style={styles.emptyDesc}>
            {subscribed
              ? "You'll be notified when new events are posted."
              : 'Subscribe above to start receiving event notifications.'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(i) => String(i.id)}
          renderItem={renderItem}
          contentContainerStyle={{ padding: spacing.md, gap: 8 }}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container:      { flex: 1, backgroundColor: colors.background },
  subBanner:      { flexDirection: 'row', alignItems: 'center', gap: 12, margin: spacing.md, padding: spacing.md, backgroundColor: colors.card, borderRadius: radius.lg, borderWidth: 1.5, borderColor: colors.border },
  subBannerActive: { borderColor: colors.primary, backgroundColor: '#fff7ed' },
  subTitle:       { fontSize: 14, fontWeight: '700', color: colors.text },
  subHint:        { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  card:           { flexDirection: 'row', alignItems: 'flex-start', gap: 10, backgroundColor: colors.card, borderRadius: radius.md, padding: spacing.md, borderWidth: 1, borderColor: colors.border },
  cardUnread:     { borderColor: colors.primary, backgroundColor: '#fffbeb' },
  dot:            { width: 8, height: 8, borderRadius: 4, marginTop: 5, flexShrink: 0 },
  dotUnread:      { backgroundColor: colors.primary },
  dotRead:        { backgroundColor: colors.border },
  title:          { fontSize: 14, fontWeight: '700', color: colors.text },
  body:           { fontSize: 13, color: colors.textMuted, marginTop: 2, lineHeight: 18 },
  time:           { fontSize: 11, color: colors.textMuted, marginTop: 6 },
  empty:          { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl, gap: 12 },
  emptyTitle:     { fontSize: 17, fontWeight: '700', color: colors.text },
  emptyDesc:      { fontSize: 13, color: colors.textMuted, textAlign: 'center', lineHeight: 20 },
});
