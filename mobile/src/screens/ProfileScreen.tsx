import React, { useEffect, useState } from 'react';
import { View, Text, Image, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator, Alert, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useTranslation } from 'react-i18next';
import api, { uploadUrl } from '../api/client';
import { useAuth } from '../contexts/AuthContext';
import { colors, spacing, radius } from '../theme';
import i18n, { LANGUAGES, saveLanguage } from '../i18n';

export default function ProfileScreen({ navigation, route }: any) {
  const { t } = useTranslation();
  const { user: authUser, logout } = useAuth();
  const username = route?.params?.username;
  const isOwn = !username || username === authUser?.username;

  const [profile, setProfile] = useState<any>(null);
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [langModal, setLangModal] = useState(false);
  const [currentLang, setCurrentLang] = useState(i18n.language);
  const [localPhotoUri, setLocalPhotoUri] = useState<string | null>(null);
  const [photoUploading, setPhotoUploading] = useState(false);

  useEffect(() => {
    const req = isOwn ? api.get('/profile') : api.get(`/users/${username}`);
    req.then((r) => { setProfile(r.data.profile); setUserData(r.data.user); }).finally(() => setLoading(false));
  }, [username, isOwn]);

  const handleLogout = () => {
    Alert.alert(t('profile.signOut'), t('profile.signOutConfirm'), [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('profile.signOut'), style: 'destructive', onPress: logout },
    ]);
  };

  const handlePhotoEdit = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Please allow access to your photo library to change your profile picture.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'] as ImagePicker.MediaTypeOptions[],
      quality: 0.8,
      allowsEditing: true,
      aspect: [1, 1],
    });
    if (result.canceled) return;
    const asset = result.assets[0];
    setPhotoUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', { uri: asset.uri, name: asset.fileName || 'photo.jpg', type: asset.mimeType || 'image/jpeg' } as any);
      const r = await api.post('/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      await api.put('/profile', { photo_filename: r.data.filename });
      setLocalPhotoUri(asset.uri);
    } catch {
      Alert.alert('Error', 'Failed to update profile photo.');
    } finally {
      setPhotoUploading(false);
    }
  };

  const handleLanguageChange = async (code: string) => {
    await i18n.changeLanguage(code);
    await saveLanguage(code);
    setCurrentLang(code);
    setLangModal(false);
  };

  if (loading) return <ActivityIndicator style={{ flex: 1 }} color={colors.primary} />;

  if (!isOwn && profile?.is_public === false) {
    return (
      <View style={styles.privateBox}>
        <Ionicons name="lock-closed" size={48} color={colors.textLight} />
        <Text style={styles.privateTitle}>{t('profile.privateProfile')}</Text>
        <Text style={styles.privateMsg}>{t('profile.privateProfileMsg')}</Text>
      </View>
    );
  }

  const displayName = profile?.full_name || userData?.username || 'Member';
  const photoUrl = profile?.photo_filename ? uploadUrl(profile.photo_filename) : null;
  const activeLang = LANGUAGES.find(l => l.code === currentLang);

  return (
    <ScrollView style={styles.scroll}>
      <View style={styles.cover} />
      <View style={styles.avatarWrap}>
        <View>
          {(localPhotoUri || photoUrl)
            ? <Image source={{ uri: localPhotoUri ?? photoUrl! }} style={styles.avatar} />
            : <View style={[styles.avatar, styles.avatarPlaceholder]}><Text style={styles.avatarInitial}>{displayName[0]?.toUpperCase()}</Text></View>}
          {isOwn && !localPhotoUri && !photoUrl && (
            <TouchableOpacity style={styles.photoEditBtn} onPress={handlePhotoEdit} disabled={photoUploading}>
              {photoUploading
                ? <ActivityIndicator size="small" color="#fff" />
                : <Ionicons name="camera" size={14} color="#fff" />}
            </TouchableOpacity>
          )}
        </View>
      </View>

      {isOwn && (
        <TouchableOpacity style={styles.editBtn} onPress={() => navigation.navigate('EditProfile')}>
          <Ionicons name="pencil-outline" size={14} color={colors.primary} />
          <Text style={styles.editBtnText}>{t('profile.edit')}</Text>
        </TouchableOpacity>
      )}

      <View style={styles.nameSection}>
        <Text style={styles.name}>
          {displayName}
          {userData?.member_id && <Text style={styles.memberId}> ({userData.member_id})</Text>}
        </Text>
        <Text style={styles.username}>@{userData?.username}</Text>
      </View>

      {profile?.bio && <Text style={styles.bio}>{profile.bio}</Text>}

      <View style={styles.chips}>
        {profile?.location && <Chip icon="location-outline" text={profile.location} />}
        {profile?.occupation && <Chip icon="briefcase-outline" text={profile.occupation} />}
        {profile?.dob && <Chip icon="calendar-outline" text={profile.dob} />}
        {profile?.native_place && <Chip icon="home-outline" text={profile.native_place} />}
      </View>

      {(profile?.native_place || profile?.gothram) && (
        <Section title={t('profile.communityDetails')}>
          {profile.native_place && <InfoRow label={t('profile.nativePlaceLabel')} value={profile.native_place} />}
          {profile.gothram && <InfoRow label={t('profile.gothramLabel')} value={profile.gothram} />}
        </Section>
      )}

      {(profile?.linkedin || profile?.website) && (
        <Section title={t('profile.linksTitle')}>
          {profile.linkedin && <InfoRow label={t('profile.linkedIn')} value={profile.linkedin} />}
          {profile.website && <InfoRow label={t('profile.website')} value={profile.website} />}
        </Section>
      )}

      {isOwn && (
        <View style={styles.actionsSection}>
          <TouchableOpacity style={styles.actionBtn} onPress={() => navigation.navigate('FamilyTree')}>
            <Ionicons name="git-branch-outline" size={18} color={colors.primary} />
            <Text style={styles.actionBtnText}>{t('profile.myFamilyTree')}</Text>
          </TouchableOpacity>

          {/* Language switcher */}
          <TouchableOpacity style={styles.actionBtn} onPress={() => setLangModal(true)}>
            <Ionicons name="language-outline" size={18} color={colors.primary} />
            <Text style={styles.actionBtnText}>{t('settings.language')}</Text>
            <View style={{ flex: 1 }} />
            <Text style={styles.langValue}>{activeLang?.nativeLabel || currentLang.toUpperCase()}</Text>
            <Ionicons name="chevron-forward" size={16} color={colors.textLight} />
          </TouchableOpacity>

          <TouchableOpacity style={[styles.actionBtn, styles.logoutBtn]} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={18} color={colors.error} />
            <Text style={[styles.actionBtnText, { color: colors.error }]}>{t('profile.signOut')}</Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={{ height: 40 }} />

      {/* Language picker modal */}
      <Modal visible={langModal} transparent animationType="slide" onRequestClose={() => setLangModal(false)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setLangModal(false)}>
          <View style={styles.modalSheet}>
            <Text style={styles.modalTitle}>{t('settings.selectLanguage')}</Text>
            {LANGUAGES.map((lang) => (
              <TouchableOpacity
                key={lang.code}
                style={[styles.langOption, lang.code === currentLang && styles.langOptionActive]}
                onPress={() => handleLanguageChange(lang.code)}
              >
                <Text style={[styles.langOptionText, lang.code === currentLang && styles.langOptionTextActive]}>
                  {lang.nativeLabel}
                </Text>
                {lang.code === currentLang && (
                  <Ionicons name="checkmark" size={20} color={colors.primary} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
    </ScrollView>
  );
}

function Chip({ icon, text }: { icon: any; text: string }) {
  return (
    <View style={chipStyles.chip}>
      <Ionicons name={icon} size={13} color={colors.textMuted} />
      <Text style={chipStyles.text}>{text}</Text>
    </View>
  );
}
const chipStyles = StyleSheet.create({
  chip: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: colors.borderLight, borderRadius: radius.sm, paddingHorizontal: 10, paddingVertical: 4 },
  text: { fontSize: 12, color: colors.textMuted },
});

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={secStyles.section}>
      <Text style={secStyles.title}>{title}</Text>
      {children}
    </View>
  );
}
const secStyles = StyleSheet.create({
  section: { marginHorizontal: spacing.md, marginBottom: spacing.md, backgroundColor: colors.card, borderRadius: radius.lg, padding: spacing.md },
  title: { fontSize: 15, fontWeight: '700', color: colors.text, marginBottom: 8 },
});

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ flexDirection: 'row', marginBottom: 4 }}>
      <Text style={{ width: 110, fontSize: 13, color: colors.textMuted }}>{label}</Text>
      <Text style={{ flex: 1, fontSize: 13, color: colors.text }}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: colors.background },
  cover: { height: 120, backgroundColor: colors.primary },
  avatarWrap: { marginTop: -40, marginLeft: spacing.lg },
  avatar: { width: 80, height: 80, borderRadius: 16, borderWidth: 3, borderColor: '#fff' },
  photoEditBtn: { position: 'absolute', bottom: -4, right: -4, width: 26, height: 26, borderRadius: 13, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#fff' },
  avatarPlaceholder: { backgroundColor: colors.primaryLight, alignItems: 'center', justifyContent: 'center' },
  avatarInitial: { fontSize: 30, fontWeight: '700', color: colors.primary },
  editBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, position: 'absolute', top: 130, right: spacing.lg, borderWidth: 1.5, borderColor: colors.primary, borderRadius: radius.md, paddingHorizontal: 12, paddingVertical: 6 },
  editBtnText: { fontSize: 13, color: colors.primary, fontWeight: '600' },
  nameSection: { marginHorizontal: spacing.lg, marginTop: 12, marginBottom: 8 },
  name: { fontSize: 22, fontWeight: '700', color: colors.text },
  memberId: { fontSize: 16, color: colors.primary, fontWeight: '600' },
  username: { fontSize: 13, color: colors.textMuted, marginTop: 2 },
  bio: { marginHorizontal: spacing.lg, fontSize: 14, color: colors.textMuted, lineHeight: 20, marginBottom: 12 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginHorizontal: spacing.lg, marginBottom: spacing.md },
  actionsSection: { margin: spacing.md, gap: 10 },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: colors.card, borderRadius: radius.lg, padding: spacing.md },
  actionBtnText: { fontSize: 15, fontWeight: '600', color: colors.text },
  logoutBtn: { borderWidth: 1, borderColor: colors.errorBorder },
  langValue: { fontSize: 14, color: colors.textMuted, marginRight: 4 },
  privateBox: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl },
  privateTitle: { fontSize: 20, fontWeight: '700', color: colors.text, marginTop: 12 },
  privateMsg: { fontSize: 14, color: colors.textMuted, marginTop: 6, textAlign: 'center' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modalSheet: { backgroundColor: colors.card, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: spacing.lg, paddingBottom: 40 },
  modalTitle: { fontSize: 18, fontWeight: '700', color: colors.text, marginBottom: spacing.md, textAlign: 'center' },
  langOption: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 14, paddingHorizontal: spacing.md, borderRadius: radius.md, marginBottom: 4 },
  langOptionActive: { backgroundColor: colors.primaryLight },
  langOptionText: { fontSize: 16, color: colors.text, fontWeight: '500' },
  langOptionTextActive: { color: colors.primary, fontWeight: '700' },
});
