import { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, ActivityIndicator, Image, TouchableOpacity, Linking, Alert, FlatList, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api, { uploadUrl } from '../api/client';
import { useAuth } from '../contexts/AuthContext';
import { colors, spacing, radius } from '../theme';

const LANGS = [
  { code: 'en', label: 'EN' },
  { code: 'ta', label: 'தமிழ்' },
  { code: 'te', label: 'తెలుగు' },
  { code: 'kn', label: 'ಕನ್ನಡ' },
] as const;

type Lang = typeof LANGS[number]['code'];

const { width } = Dimensions.get('window');

export default function MatrimonyViewScreen({ route, navigation }: any) {
  const { profileId } = route.params;
  const { user } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [photoIdx, setPhotoIdx] = useState(0);
  const [activeLang, setActiveLang] = useState<Lang>('en');
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    api.get(`/matrimony/${profileId}`)
      .then((r) => setProfile(r.data.profile))
      .finally(() => setLoading(false));
  }, [profileId]);

  const handleDelete = async () => {
    Alert.alert('Delete Profile', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive', onPress: async () => {
          try { await api.delete(`/matrimony/${profileId}`); navigation.goBack(); }
          catch { Alert.alert('Error', 'Failed to delete.'); }
        }
      }
    ]);
  };

  const handleGenerateHoroscope = async () => {
    setGenerating(true);
    try {
      const r = await api.post(`/matrimony/${profileId}/generate-horoscope?lang=${activeLang}`);
      setProfile((prev: any) => ({ ...prev, [`horoscope_${activeLang}`]: r.data.horoscope }));
      Alert.alert('Done', `Horoscope generated in ${LANGS.find(l => l.code === activeLang)?.label}!`);
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.error || 'Failed to generate horoscope.');
    } finally {
      setGenerating(false);
    }
  };

  if (loading) return <ActivityIndicator style={{ flex: 1 }} color={colors.primary} />;
  if (!profile) return <View style={styles.center}><Text>Profile not found.</Text></View>;

  const allPhotos: string[] = profile.photos?.length
    ? profile.photos
    : profile.photo_filename ? [profile.photo_filename] : [];
  const isOwner = user && user.id === profile.user_id;

  const INFO: [string, string][] = [
    ['Age', profile.age ? `${profile.age} years` : null],
    ['Height', profile.height],
    ['Native Place', profile.native_place],
    ['Education', profile.education],
    ['Occupation', profile.occupation],
    ['Salary Range', profile.salary_range],
    ['Gothram', profile.gothram],
    ['Star', profile.star],
    ['Raasi', profile.raasi],
    ['Birth Time', profile.birth_time],
    ['Birth Place', profile.birth_place],
  ].filter(([, v]) => v) as [string, string][];

  const currentHoroscope = profile[`horoscope_${activeLang}`] as string | undefined;

  return (
    <ScrollView style={styles.container}>
      {/* Photo carousel */}
      {allPhotos.length > 0 ? (
        <View style={styles.carouselWrap}>
          <FlatList
            data={allPhotos}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            keyExtractor={(fn) => fn}
            onMomentumScrollEnd={(e) => {
              const idx = Math.round(e.nativeEvent.contentOffset.x / (width - spacing.md * 2));
              setPhotoIdx(idx);
            }}
            renderItem={({ item }) => (
              <Image
                source={{ uri: uploadUrl(item) }}
                style={styles.carouselPhoto}
                resizeMode="cover"
              />
            )}
          />
          {allPhotos.length > 1 && (
            <View style={styles.dots}>
              {allPhotos.map((_, i) => (
                <View key={i} style={[styles.dot, i === photoIdx && styles.dotActive]} />
              ))}
            </View>
          )}
        </View>
      ) : (
        <View style={styles.noPhotoBox}>
          <Ionicons name="person" size={60} color={colors.primaryLight} />
        </View>
      )}

      {/* Hero info */}
      <View style={styles.hero}>
        <Text style={styles.name}>{profile.full_name}</Text>
        <Text style={styles.gender}>{profile.gender === 'male' ? '♂ Male (Groom)' : '♀ Female (Bride)'}</Text>
        {isOwner && (
          <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete}>
            <Ionicons name="trash-outline" size={16} color="#ef4444" />
            <Text style={styles.deleteBtnText}>Delete Profile</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Details */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Profile Details</Text>
        {INFO.map(([label, value]) => (
          <View key={label} style={styles.row}>
            <Text style={styles.rowLabel}>{label}</Text>
            <Text style={styles.rowValue}>{value}</Text>
          </View>
        ))}
      </View>

      {/* About */}
      {profile.about && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>
          <Text style={styles.about}>{profile.about}</Text>
        </View>
      )}

      {/* Horoscope */}
      <View style={styles.section}>
        <View style={styles.horoscopeHeader}>
          <Text style={styles.sectionTitle}>Horoscope / Jathakam</Text>
          <Ionicons name="sparkles" size={14} color={colors.primary} />
        </View>

        {/* Language tabs */}
        <View style={styles.langTabs}>
          {LANGS.map(({ code, label }) => (
            <TouchableOpacity
              key={code}
              style={[styles.langTab, activeLang === code && styles.langTabActive]}
              onPress={() => setActiveLang(code)}
            >
              <Text style={[styles.langTabText, activeLang === code && styles.langTabTextActive]}>{label}</Text>
              {!!profile[`horoscope_${code}`] && (
                <View style={styles.langDot} />
              )}
            </TouchableOpacity>
          ))}
        </View>

        {currentHoroscope ? (
          <>
            <Text style={styles.horoscopeText}>{currentHoroscope}</Text>
            <TouchableOpacity
              style={[styles.generateBtn, generating && styles.generateBtnDisabled]}
              onPress={handleGenerateHoroscope}
              disabled={generating}
            >
              {generating
                ? <ActivityIndicator size="small" color={colors.primary} />
                : <Ionicons name="sparkles" size={14} color={colors.primary} />}
              <Text style={styles.generateBtnText}>{generating ? 'Generating…' : 'Regenerate with AI'}</Text>
            </TouchableOpacity>
          </>
        ) : (
          <View style={styles.noHoroscope}>
            <Ionicons name="sparkles-outline" size={32} color="#fcd34d" />
            <Text style={styles.noHoroscopeText}>
              No horoscope added in {LANGS.find(l => l.code === activeLang)?.label} yet.
            </Text>
            <TouchableOpacity
              style={[styles.generateBtn, generating && styles.generateBtnDisabled]}
              onPress={handleGenerateHoroscope}
              disabled={generating}
            >
              {generating
                ? <ActivityIndicator size="small" color={colors.primary} />
                : <Ionicons name="sparkles" size={14} color={colors.primary} />}
              <Text style={styles.generateBtnText}>
                {generating ? 'Generating…' : `Generate with AI`}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Contact */}
      {(profile.contact_email || profile.contact_phone) && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Contact</Text>
          {profile.contact_email && (
            <TouchableOpacity style={styles.contactRow} onPress={() => Linking.openURL(`mailto:${profile.contact_email}`)}>
              <Ionicons name="mail-outline" size={18} color={colors.primary} />
              <Text style={styles.contactText}>{profile.contact_email}</Text>
            </TouchableOpacity>
          )}
          {profile.contact_phone && (
            <TouchableOpacity
              style={styles.contactRow}
              onPress={() => Linking.openURL(`https://wa.me/${profile.contact_phone.replace(/\D/g, '')}`)}
            >
              <Ionicons name="logo-whatsapp" size={18} color="#25d366" />
              <Text style={[styles.contactText, { color: '#25d366' }]}>Contact on WhatsApp</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      <View style={{ height: 32 }} />
    </ScrollView>
  );
}

const PHOTO_W = width - spacing.md * 2;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  carouselWrap: { marginHorizontal: spacing.md, marginTop: spacing.md, borderRadius: radius.lg, overflow: 'hidden' },
  carouselPhoto: { width: PHOTO_W, height: PHOTO_W * 1.25 },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 6, paddingVertical: 8, backgroundColor: 'rgba(0,0,0,0.3)' },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.5)' },
  dotActive: { width: 14, backgroundColor: '#fff' },
  noPhotoBox: { height: 180, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff1f2', marginHorizontal: spacing.md, marginTop: spacing.md, borderRadius: radius.lg },
  hero: { alignItems: 'center', padding: spacing.lg, paddingTop: spacing.md },
  name: { fontSize: 22, fontWeight: '700', color: colors.text },
  gender: { fontSize: 14, color: colors.textMuted, marginTop: 4 },
  deleteBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 12, borderWidth: 1, borderColor: '#fecaca', borderRadius: radius.md, paddingVertical: 6, paddingHorizontal: 14 },
  deleteBtnText: { color: '#ef4444', fontWeight: '600', fontSize: 13 },
  section: { backgroundColor: colors.card, borderRadius: radius.lg, marginHorizontal: spacing.md, marginBottom: spacing.md, padding: spacing.md },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: colors.textMuted, marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: colors.border },
  rowLabel: { fontSize: 14, color: colors.textMuted },
  rowValue: { fontSize: 14, color: colors.text, fontWeight: '500', maxWidth: '60%', textAlign: 'right' },
  about: { fontSize: 14, color: colors.text, lineHeight: 22 },
  horoscopeHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10 },
  langTabs: { flexDirection: 'row', backgroundColor: '#f3f4f6', borderRadius: 10, padding: 3, marginBottom: 12 },
  langTab: { flex: 1, paddingVertical: 6, alignItems: 'center', borderRadius: 8, position: 'relative' },
  langTabActive: { backgroundColor: '#fff', elevation: 2 },
  langTabText: { fontSize: 11, fontWeight: '600', color: colors.textMuted },
  langTabTextActive: { color: colors.text },
  langDot: { position: 'absolute', top: 2, right: 4, width: 5, height: 5, borderRadius: 3, backgroundColor: colors.primary },
  horoscopeText: { fontSize: 13, color: colors.text, lineHeight: 21, backgroundColor: '#fffbeb', borderRadius: 10, padding: 12, marginBottom: 10 },
  noHoroscope: { alignItems: 'center', gap: 8, paddingVertical: 16 },
  noHoroscopeText: { fontSize: 13, color: colors.textMuted, textAlign: 'center' },
  generateBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1.5, borderColor: colors.primary, borderRadius: radius.md, paddingVertical: 8, paddingHorizontal: 14, alignSelf: 'center' },
  generateBtnDisabled: { opacity: 0.5 },
  generateBtnText: { color: colors.primary, fontWeight: '700', fontSize: 13 },
  contactRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.border },
  contactText: { fontSize: 14, color: colors.text, fontWeight: '500' },
});
