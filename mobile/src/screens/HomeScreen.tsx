import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  ActivityIndicator, FlatList, Image, Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import api, { uploadUrl } from '../api/client';
import { colors, spacing, radius } from '../theme';

const { width: SCREEN_W } = Dimensions.get('window');
const CARD_W = SCREEN_W * 0.72;

const SERVICES = [
  { icon: 'calendar', label: 'Events', tab: 'Services', screen: 'Events', color: '#f0f9ff', iconColor: '#0ea5e9' },
  { icon: 'people', label: 'Members', tab: 'Members', color: '#fff7ed', iconColor: colors.primary },
  { icon: 'git-branch', label: 'Family Tree', tab: 'Services', screen: 'FamilyTree', color: '#f0fdf4', iconColor: '#16a34a' },
  { icon: 'chatbubbles', label: 'Forums', tab: 'Forums', color: '#eff6ff', iconColor: '#3b82f6' },
  { icon: 'heart', label: 'Matrimony', tab: 'Services', screen: 'Matrimony', color: '#fff1f2', iconColor: '#f43f5e' },
  { icon: 'school', label: 'Scholarships', tab: 'Services', screen: 'Scholarships', color: '#fefce8', iconColor: '#ca8a04' },
  { icon: 'briefcase', label: 'Businesses', tab: 'Services', screen: 'Businesses', color: '#f5f3ff', iconColor: '#7c3aed' },
  { icon: 'navigate', label: 'Pilgrimages', tab: 'Services', screen: 'Pilgrimages', color: '#fffbeb', iconColor: '#d97706' },
];

export default function HomeScreen({ navigation }: any) {
  const { user } = useAuth();
  const [stats, setStats] = useState({ members: 0, families: 0, forum_threads: 0, matrimony_profiles: 0 });
  const [events, setEvents] = useState<any[]>([]);
  const [eventsLoading, setEventsLoading] = useState(true);
  const carouselRef = useRef<FlatList>(null);
  const [activeIdx, setActiveIdx] = useState(0);
  const [ads, setAds] = useState<any[]>([]);
  const adsRef = useRef<FlatList>(null);
  const [adsIdx, setAdsIdx] = useState(0);

  useEffect(() => {
    api.get('/stats').then((r) => setStats(r.data)).catch(() => {});
    api.get('/events/home')
      .then((r) => setEvents(r.data.events || []))
      .catch(() => setEvents([]))
      .finally(() => setEventsLoading(false));
    api.get('/ads/home').then((r) => setAds(r.data.ads || [])).catch(() => {});
  }, []);

  // Auto-scroll events carousel every 4 seconds
  useEffect(() => {
    if (events.length < 2) return;
    const timer = setInterval(() => {
      setActiveIdx((prev) => {
        const next = (prev + 1) % events.length;
        carouselRef.current?.scrollToIndex({ index: next, animated: true });
        return next;
      });
    }, 4000);
    return () => clearInterval(timer);
  }, [events.length]);

  // Auto-scroll ads carousel every 4.5 seconds
  useEffect(() => {
    if (ads.length < 2) return;
    const timer = setInterval(() => {
      setAdsIdx((prev) => {
        const next = (prev + 1) % ads.length;
        adsRef.current?.scrollToIndex({ index: next, animated: true });
        return next;
      });
    }, 4500);
    return () => clearInterval(timer);
  }, [ads.length]);

  const fmtDate = (d?: string) => {
    if (!d) return null;
    try { return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }); } catch { return d; }
  };

  const goToService = (s: typeof SERVICES[0]) => {
    const parent = navigation.getParent();
    if (s.screen) parent?.navigate(s.tab, { screen: s.screen });
    else parent?.navigate(s.tab);
  };

  const goToEvent = (id: number) => {
    navigation.getParent()?.navigate('Services', { screen: 'EventView', params: { id } });
  };

  const renderAdCard = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={styles.adCard}
      onPress={() => navigation.getParent()?.navigate('Services', { screen: 'BusinessProfile', params: { id: item.business_id } })}
      activeOpacity={0.9}
    >
      <Image source={{ uri: uploadUrl(item.photo_filename) }} style={styles.adCardImg} resizeMode="cover" />
      {(item.title || item.business_name) && (
        <View style={styles.adCardOverlay}>
          {item.business_name && (
            <Text style={styles.adCardBiz} numberOfLines={1}>{item.business_name}</Text>
          )}
          {item.title && (
            <Text style={styles.adCardTitle} numberOfLines={2}>{item.title}</Text>
          )}
        </View>
      )}
    </TouchableOpacity>
  );

  const renderEventCard = ({ item }: { item: any }) => {
    const mediaUrl = item.media_filename ? uploadUrl(item.media_filename) : null;
    return (
      <TouchableOpacity style={styles.eventCard} onPress={() => goToEvent(item.id)} activeOpacity={0.9}>
        {mediaUrl ? (
          <Image source={{ uri: mediaUrl }} style={styles.eventCardImg} resizeMode="cover" />
        ) : (
          <View style={styles.eventCardPlaceholder}>
            <Ionicons name="calendar" size={40} color="#d97706" />
          </View>
        )}
        {item.media_type === 'video' && (
          <View style={styles.playBadge}>
            <Ionicons name="play-circle" size={28} color="rgba(255,255,255,0.9)" />
          </View>
        )}
        <View style={styles.eventCardOverlay}>
          <Text style={styles.eventCardTitle} numberOfLines={2}>{item.title}</Text>
          {item.event_date && (
            <View style={styles.eventCardDate}>
              <Ionicons name="calendar-outline" size={12} color="rgba(255,255,255,0.85)" />
              <Text style={styles.eventCardDateText}>{fmtDate(item.event_date)}</Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
      {/* Hero */}
      <View style={styles.hero}>
        <Text style={styles.heroTagline}>🙏 Karuneegar Community</Text>
        <Text style={styles.heroTitle}>Karuneegar{'\n'}<Text style={styles.heroAccent}>Central</Text></Text>
        <Text style={styles.heroSubtitle}>Connecting the community — members, families, businesses & more.</Text>
        {user && (
          <View style={styles.welcomeChip}>
            <Text style={styles.welcomeText}>Welcome, {user.username}  {user.member_id && <Text style={styles.memberId}>({user.member_id})</Text>}</Text>
          </View>
        )}
      </View>

      {/* Events Carousel */}
      {(eventsLoading || events.length > 0) && (
        <View style={styles.carouselSection}>
          <View style={styles.carouselHeader}>
            <Text style={styles.sectionTitle}>Upcoming Events</Text>
            <TouchableOpacity onPress={() => navigation.getParent()?.navigate('Services', { screen: 'Events' })}>
              <Text style={styles.seeAll}>See all</Text>
            </TouchableOpacity>
          </View>
          {eventsLoading ? (
            <ActivityIndicator color={colors.primary} style={{ marginVertical: 20 }} />
          ) : (
            <>
              <FlatList
                ref={carouselRef}
                data={events}
                keyExtractor={(i) => String(i.id)}
                renderItem={renderEventCard}
                horizontal
                showsHorizontalScrollIndicator={false}
                snapToInterval={CARD_W + 12}
                decelerationRate="fast"
                contentContainerStyle={{ paddingHorizontal: spacing.md, gap: 12 }}
                onScrollToIndexFailed={() => {}}
                onMomentumScrollEnd={(e) => {
                  const idx = Math.round(e.nativeEvent.contentOffset.x / (CARD_W + 12));
                  setActiveIdx(idx);
                }}
              />
              {events.length > 1 && (
                <View style={styles.dots}>
                  {events.map((_, i) => (
                    <View key={i} style={[styles.dot, i === activeIdx && styles.dotActive]} />
                  ))}
                </View>
              )}
            </>
          )}
        </View>
      )}

      {/* Ads Carousel */}
      {ads.length > 0 && (
        <View style={styles.carouselSection}>
          <View style={styles.carouselHeader}>
            <Text style={styles.sectionTitle}>Advertisements</Text>
          </View>
          <FlatList
            ref={adsRef}
            data={ads}
            keyExtractor={(i) => `ad-${i.id}`}
            renderItem={renderAdCard}
            horizontal
            showsHorizontalScrollIndicator={false}
            snapToInterval={CARD_W + 12}
            decelerationRate="fast"
            contentContainerStyle={{ paddingHorizontal: spacing.md, gap: 12 }}
            onScrollToIndexFailed={() => {}}
            onMomentumScrollEnd={(e) => {
              const idx = Math.round(e.nativeEvent.contentOffset.x / (CARD_W + 12));
              setAdsIdx(idx);
            }}
          />
          {ads.length > 1 && (
            <View style={styles.dots}>
              {ads.map((_, i) => (
                <View key={i} style={[styles.dot, i === adsIdx && styles.dotActive]} />
              ))}
            </View>
          )}
        </View>
      )}

      {/* Stats */}
      <View style={styles.statsRow}>
        {[
          { label: 'Members', value: stats.members, icon: 'people-outline' },
          { label: 'Families', value: stats.families, icon: 'git-branch-outline' },
          { label: 'Threads', value: stats.forum_threads, icon: 'chatbubbles-outline' },
          { label: 'Matrimony', value: stats.matrimony_profiles, icon: 'heart-outline' },
        ].map((s) => (
          <View key={s.label} style={styles.statCard}>
            <Ionicons name={s.icon as any} size={20} color={colors.primary} />
            <Text style={styles.statValue}>{s.value}</Text>
            <Text style={styles.statLabel}>{s.label}</Text>
          </View>
        ))}
      </View>

      {/* Services grid */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Our Services</Text>
        <View style={styles.grid}>
          {SERVICES.map((s) => (
            <TouchableOpacity
              key={s.label}
              style={[styles.serviceCard, { backgroundColor: s.color }]}
              onPress={() => goToService(s)}
            >
              <Ionicons name={s.icon as any} size={28} color={s.iconColor} />
              <Text style={styles.serviceLabel}>{s.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={{ height: 30 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll:             { flex: 1, backgroundColor: colors.background },
  hero:               { backgroundColor: colors.primary, paddingHorizontal: spacing.lg, paddingTop: 50, paddingBottom: 30 },
  heroTagline:        { color: 'rgba(255,255,255,0.8)', fontSize: 13, marginBottom: 8 },
  heroTitle:          { fontSize: 36, fontWeight: '800', color: '#fff', lineHeight: 42, marginBottom: 10 },
  heroAccent:         { color: '#fde68a' },
  heroSubtitle:       { color: 'rgba(255,255,255,0.85)', fontSize: 14, lineHeight: 20, marginBottom: 14 },
  welcomeChip:        { backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: radius.xl, paddingHorizontal: 14, paddingVertical: 6, alignSelf: 'flex-start' },
  welcomeText:        { color: '#fff', fontSize: 13, fontWeight: '600' },
  memberId:           { color: '#fde68a', fontWeight: '700' },
  carouselSection:    { paddingTop: spacing.lg },
  carouselHeader:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.md, marginBottom: spacing.sm },
  seeAll:             { fontSize: 13, color: colors.primary, fontWeight: '600' },
  eventCard:          { width: CARD_W, height: 180, borderRadius: radius.lg, overflow: 'hidden', backgroundColor: '#fffbeb' },
  eventCardImg:       { width: '100%', height: '100%' },
  eventCardPlaceholder: { width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center' },
  playBadge:          { position: 'absolute', top: 8, right: 8 },
  eventCardOverlay:   { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 12, backgroundColor: 'rgba(0,0,0,0.45)' },
  eventCardTitle:     { fontSize: 15, fontWeight: '700', color: '#fff', marginBottom: 4 },
  eventCardDate:      { flexDirection: 'row', alignItems: 'center', gap: 4 },
  eventCardDateText:  { fontSize: 11, color: 'rgba(255,255,255,0.85)' },
  dots:               { flexDirection: 'row', justifyContent: 'center', gap: 5, marginTop: 10 },
  dot:                { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.border },
  dotActive:          { width: 18, backgroundColor: colors.primary },
  statsRow:           { flexDirection: 'row', padding: spacing.md, gap: 8 },
  statCard:           { flex: 1, backgroundColor: colors.card, borderRadius: radius.md, padding: spacing.sm, alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.04, elevation: 1 },
  statValue:          { fontSize: 18, fontWeight: '700', color: colors.text, marginTop: 4 },
  statLabel:          { fontSize: 10, color: colors.textMuted, marginTop: 2 },
  section:            { paddingHorizontal: spacing.md },
  sectionTitle:       { fontSize: 18, fontWeight: '700', color: colors.text, marginBottom: spacing.md },
  grid:               { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  serviceCard:        { width: '47%', borderRadius: radius.lg, padding: spacing.md, alignItems: 'center', justifyContent: 'center', minHeight: 90 },
  serviceLabel:       { marginTop: 8, fontSize: 14, fontWeight: '600', color: colors.text },
  adCard:             { width: CARD_W, height: 180, borderRadius: radius.lg, overflow: 'hidden', backgroundColor: '#1e293b' },
  adCardImg:          { width: '100%', height: '100%' },
  adCardOverlay:      { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 12, backgroundColor: 'rgba(0,0,0,0.5)' },
  adCardBiz:          { fontSize: 10, fontWeight: '700', color: colors.primary, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 2 },
  adCardTitle:        { fontSize: 14, fontWeight: '700', color: '#fff' },
});
