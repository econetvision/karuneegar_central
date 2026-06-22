import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, Image, TouchableOpacity,
  StyleSheet, ActivityIndicator, Alert, Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api, { uploadUrl } from '../api/client';
import { useAuth } from '../contexts/AuthContext';
import { colors, spacing, radius } from '../theme';

interface Pilgrimage {
  id: number;
  title: string;
  destination: string;
  description?: string;
  itinerary?: string;
  start_date?: string;
  end_date?: string;
  cost?: string;
  capacity?: number;
  organizer_name?: string;
  organizer_mobile?: string;
  photo_filename?: string;
  poster_username: string;
  poster_name?: string;
  created_at: string;
}

export default function PilgrimageViewScreen({ route, navigation }: any) {
  const { id } = route.params;
  const { user } = useAuth();
  const [trip, setTrip] = useState<Pilgrimage | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/pilgrimages/${id}`)
      .then((r) => setTrip(r.data.pilgrimage))
      .catch(() => navigation.goBack())
      .finally(() => setLoading(false));
  }, [id]);

  const handleDelete = () => {
    Alert.alert('Remove Trip', 'Remove this pilgrimage post?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove', style: 'destructive', onPress: async () => {
          await api.delete(`/pilgrimages/${id}`);
          navigation.goBack();
        },
      },
    ]);
  };

  const formatDateRange = (start?: string, end?: string) => {
    if (!start && !end) return null;
    const fmt = (d: string) =>
      new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
    if (start && end && start !== end) return `${fmt(start)} – ${fmt(end)}`;
    return start ? fmt(start) : fmt(end!);
  };

  if (loading) return <ActivityIndicator style={{ flex: 1 }} color={colors.primary} />;
  if (!trip) return null;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Photo */}
      {trip.photo_filename ? (
        <Image source={{ uri: uploadUrl(trip.photo_filename) }} style={styles.photo} />
      ) : (
        <View style={styles.photoPlaceholder}>
          <Text style={styles.photoEmoji}>🛕</Text>
        </View>
      )}

      <View style={styles.body}>
        {/* Title & destination */}
        <Text style={styles.title}>{trip.title}</Text>
        <View style={styles.destRow}>
          <Ionicons name="location" size={16} color={colors.primary} />
          <Text style={styles.destination}>{trip.destination}</Text>
        </View>

        {/* Info chips */}
        <View style={styles.chips}>
          {(trip.start_date || trip.end_date) && (
            <View style={[styles.chip, { backgroundColor: '#fffbeb', borderColor: '#fcd34d' }]}>
              <Ionicons name="calendar-outline" size={13} color="#92400e" />
              <Text style={[styles.chipText, { color: '#92400e' }]}>{formatDateRange(trip.start_date, trip.end_date)}</Text>
            </View>
          )}
          {trip.cost && (
            <View style={[styles.chip, { backgroundColor: '#f0fdf4', borderColor: '#86efac' }]}>
              <Ionicons name="cash-outline" size={13} color="#14532d" />
              <Text style={[styles.chipText, { color: '#14532d' }]}>{trip.cost} per person</Text>
            </View>
          )}
          {trip.capacity && (
            <View style={[styles.chip, { backgroundColor: '#eff6ff', borderColor: '#93c5fd' }]}>
              <Ionicons name="people-outline" size={13} color="#1e3a5f" />
              <Text style={[styles.chipText, { color: '#1e3a5f' }]}>{trip.capacity} seats</Text>
            </View>
          )}
        </View>

        {/* Description */}
        {trip.description ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>About this Trip</Text>
            <Text style={styles.sectionBody}>{trip.description}</Text>
          </View>
        ) : null}

        {/* Itinerary */}
        {trip.itinerary ? (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="list-outline" size={16} color={colors.primary} />
              <Text style={styles.sectionTitle}>Trip Itinerary</Text>
            </View>
            <Text style={[styles.sectionBody, { fontFamily: 'System' }]}>{trip.itinerary}</Text>
          </View>
        ) : null}

        {/* Organizer contact */}
        {(trip.organizer_name || trip.organizer_mobile) && (
          <View style={[styles.section, styles.contactCard]}>
            <Text style={styles.sectionTitle}>Contact Organizer</Text>
            {trip.organizer_name && (
              <View style={styles.contactRow}>
                <Ionicons name="person-outline" size={15} color={colors.textMuted} />
                <Text style={styles.contactName}>{trip.organizer_name}</Text>
              </View>
            )}
            {trip.organizer_mobile && (
              <>
                <TouchableOpacity style={styles.contactRow} onPress={() => Linking.openURL(`tel:${trip.organizer_mobile}`)}>
                  <Ionicons name="call-outline" size={15} color={colors.primary} />
                  <Text style={styles.contactMobile}>{trip.organizer_mobile}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.waBtn}
                  onPress={() => Linking.openURL(`https://wa.me/${trip.organizer_mobile!.replace(/\D/g, '')}`)}
                >
                  <Ionicons name="logo-whatsapp" size={18} color="#fff" />
                  <Text style={styles.waBtnText}>WhatsApp Organizer</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Posted by{' '}
            <Text style={{ fontWeight: '600', color: colors.text }}>{trip.poster_name || trip.poster_username}</Text>
            {'  ·  '}
            {new Date(trip.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
          </Text>
          {user?.username === trip.poster_username && (
            <TouchableOpacity onPress={handleDelete}>
              <Text style={styles.deleteLink}>Delete</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container:        { flex: 1, backgroundColor: colors.background },
  content:          { paddingBottom: 40 },
  photo:            { width: '100%', height: 220 },
  photoPlaceholder: { width: '100%', height: 180, backgroundColor: '#fff7ed', alignItems: 'center', justifyContent: 'center' },
  photoEmoji:       { fontSize: 64 },
  body:             { padding: spacing.md },
  title:            { fontSize: 22, fontWeight: '700', color: colors.text, marginBottom: 6 },
  destRow:          { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 12 },
  destination:      { fontSize: 15, color: colors.primary, fontWeight: '600' },
  chips:            { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  chip:             { flexDirection: 'row', alignItems: 'center', gap: 5, borderWidth: 1, borderRadius: radius.md, paddingVertical: 5, paddingHorizontal: 10 },
  chipText:         { fontSize: 12, fontWeight: '600' },
  section:          { backgroundColor: colors.card, borderRadius: radius.lg, padding: spacing.md, marginBottom: 12 },
  sectionHeader:    { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  sectionTitle:     { fontSize: 15, fontWeight: '700', color: colors.text, marginBottom: 8 },
  sectionBody:      { fontSize: 14, color: colors.textMuted, lineHeight: 22 },
  contactCard:      { backgroundColor: '#fff7ed', borderWidth: 1, borderColor: '#fed7aa' },
  contactRow:       { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  contactName:      { fontSize: 15, fontWeight: '600', color: colors.text },
  contactMobile:    { fontSize: 16, fontWeight: '700', color: colors.primary },
  waBtn:            { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#16a34a', borderRadius: radius.md, paddingVertical: 10, paddingHorizontal: 16, marginTop: 4, alignSelf: 'flex-start' },
  waBtnText:        { color: '#fff', fontWeight: '700', fontSize: 14 },
  footer:           { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 16 },
  footerText:       { fontSize: 12, color: colors.textMuted, flex: 1 },
  deleteLink:       { color: '#ef4444', fontSize: 13, fontWeight: '600' },
});
