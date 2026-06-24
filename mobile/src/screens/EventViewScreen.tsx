import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, Image, TouchableOpacity, StyleSheet,
  ActivityIndicator, Alert, Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api, { uploadUrl } from '../api/client';
import { useAuth } from '../contexts/AuthContext';
import { colors, spacing, radius } from '../theme';

export default function EventViewScreen({ navigation, route }: any) {
  const { id } = route.params;
  const { user } = useAuth();
  const [event, setEvent] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/events/${id}`)
      .then((r) => setEvent(r.data.event))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <ActivityIndicator style={{ flex: 1 }} color={colors.primary} />;
  if (!event) return (
    <View style={styles.notFound}>
      <Text style={styles.notFoundText}>Event not found.</Text>
    </View>
  );

  const isOwn = user?.username === event.poster_username;
  const mediaUrl = event.media_filename ? uploadUrl(event.media_filename) : null;
  const isVideo = event.media_type === 'video';

  const fmtDate = (d?: string) => {
    if (!d) return null;
    try { return new Date(d).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }); } catch { return d; }
  };

  const handleDelete = () => {
    Alert.alert('Delete Event', 'Remove this event permanently?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          await api.delete(`/events/${id}`);
          navigation.goBack();
        },
      },
    ]);
  };

  return (
    <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
      {/* Media */}
      {mediaUrl ? (
        isVideo ? (
          <TouchableOpacity style={styles.videoThumb} onPress={() => Linking.openURL(mediaUrl)}>
            <Ionicons name="play-circle" size={64} color="rgba(255,255,255,0.9)" />
            <Text style={styles.videoHint}>Tap to play video</Text>
          </TouchableOpacity>
        ) : (
          <Image source={{ uri: mediaUrl }} style={styles.coverImg} resizeMode="cover" />
        )
      ) : (
        <View style={styles.coverPlaceholder}>
          <Ionicons name="calendar" size={56} color="#d97706" />
        </View>
      )}

      <View style={styles.body}>
        <Text style={styles.title}>{event.title}</Text>

        {event.event_date && (
          <View style={styles.chip}>
            <Ionicons name="calendar-outline" size={15} color={colors.primary} />
            <Text style={styles.chipText}>{fmtDate(event.event_date)}</Text>
          </View>
        )}

        {event.organizer_name ? (
          <View style={styles.chip}>
            <Ionicons name="person-outline" size={15} color="#3b82f6" />
            <Text style={[styles.chipText, { color: '#3b82f6' }]}>{event.organizer_name}</Text>
          </View>
        ) : null}

        {event.poster_name && (
          <Text style={styles.poster}>Posted by {event.poster_name} (@{event.poster_username})</Text>
        )}

        {event.description ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>About the Event</Text>
            <Text style={styles.desc}>{event.description}</Text>
          </View>
        ) : null}

        {/* Action Buttons */}
        <View style={styles.actions}>
          {event.contact_no ? (
            <TouchableOpacity style={styles.actionBtn} onPress={() => Linking.openURL(`tel:${event.contact_no}`)}>
              <Ionicons name="call" size={18} color="#fff" />
              <Text style={styles.actionBtnText}>Call Organiser</Text>
            </TouchableOpacity>
          ) : null}

          {event.contact_no ? (
            <TouchableOpacity style={[styles.actionBtn, styles.waBtn]} onPress={() => Linking.openURL(`https://wa.me/${event.contact_no.replace(/\D/g, '')}`)}>
              <Ionicons name="logo-whatsapp" size={18} color="#fff" />
              <Text style={styles.actionBtnText}>WhatsApp</Text>
            </TouchableOpacity>
          ) : null}
        </View>

        <View style={styles.actions}>
          {event.donate_url ? (
            <TouchableOpacity style={[styles.actionBtn, styles.donateBtn]} onPress={() => Linking.openURL(event.donate_url)}>
              <Ionicons name="heart" size={18} color="#fff" />
              <Text style={styles.actionBtnText}>Donate</Text>
            </TouchableOpacity>
          ) : null}

          {event.register_url ? (
            <TouchableOpacity style={[styles.actionBtn, styles.registerBtn]} onPress={() => Linking.openURL(event.register_url)}>
              <Ionicons name="checkmark-circle" size={18} color="#fff" />
              <Text style={styles.actionBtnText}>Register</Text>
            </TouchableOpacity>
          ) : null}
        </View>

        {isOwn && (
          <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete}>
            <Ionicons name="trash-outline" size={16} color={colors.error} />
            <Text style={styles.deleteBtnText}>Delete Event</Text>
          </TouchableOpacity>
        )}
      </View>
      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll:           { flex: 1, backgroundColor: colors.background },
  coverImg:         { width: '100%', height: 240 },
  videoThumb:       { width: '100%', height: 220, backgroundColor: '#1a1a2e', alignItems: 'center', justifyContent: 'center', gap: 8 },
  videoHint:        { color: 'rgba(255,255,255,0.7)', fontSize: 13 },
  coverPlaceholder: { width: '100%', height: 160, backgroundColor: '#fffbeb', alignItems: 'center', justifyContent: 'center' },
  body:             { padding: spacing.lg },
  title:            { fontSize: 24, fontWeight: '800', color: colors.text, marginBottom: 12 },
  chip:             { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#eff6ff', borderRadius: radius.md, paddingHorizontal: 12, paddingVertical: 6, alignSelf: 'flex-start', marginBottom: 8 },
  chipText:         { fontSize: 13, color: colors.primary, fontWeight: '600' },
  poster:           { fontSize: 13, color: colors.textMuted, marginBottom: 16 },
  section:          { backgroundColor: colors.card, borderRadius: radius.lg, padding: spacing.md, marginBottom: spacing.md },
  sectionTitle:     { fontSize: 15, fontWeight: '700', color: colors.text, marginBottom: 8 },
  desc:             { fontSize: 14, color: colors.text, lineHeight: 22 },
  actions:          { flexDirection: 'row', gap: 10, marginBottom: 10 },
  actionBtn:        { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: colors.primary, borderRadius: radius.md, paddingVertical: 12 },
  actionBtnText:    { color: '#fff', fontWeight: '700', fontSize: 14 },
  waBtn:            { backgroundColor: '#16a34a' },
  donateBtn:        { backgroundColor: '#f43f5e' },
  registerBtn:      { backgroundColor: '#7c3aed' },
  deleteBtn:        { flexDirection: 'row', alignItems: 'center', gap: 6, justifyContent: 'center', marginTop: spacing.lg, padding: spacing.md, borderWidth: 1.5, borderColor: colors.errorBorder, borderRadius: radius.md },
  deleteBtnText:    { color: colors.error, fontWeight: '600', fontSize: 14 },
  notFound:         { flex: 1, alignItems: 'center', justifyContent: 'center' },
  notFoundText:     { color: colors.textMuted, fontSize: 16 },
});
