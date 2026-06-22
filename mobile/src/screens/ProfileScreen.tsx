import React, { useEffect, useState } from 'react';
import { View, Text, Image, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api, { uploadUrl } from '../api/client';
import { useAuth } from '../contexts/AuthContext';
import { colors, spacing, radius } from '../theme';

export default function ProfileScreen({ navigation, route }: any) {
  const { user: authUser, logout } = useAuth();
  const username = route?.params?.username;
  const isOwn = !username || username === authUser?.username;

  const [profile, setProfile] = useState<any>(null);
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const req = isOwn ? api.get('/profile') : api.get(`/users/${username}`);
    req.then((r) => { setProfile(r.data.profile); setUserData(r.data.user); }).finally(() => setLoading(false));
  }, [username, isOwn]);

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: logout },
    ]);
  };

  if (loading) return <ActivityIndicator style={{ flex: 1 }} color={colors.primary} />;

  if (!isOwn && profile?.is_public === false) {
    return (
      <View style={styles.privateBox}>
        <Ionicons name="lock-closed" size={48} color={colors.textLight} />
        <Text style={styles.privateTitle}>Private Profile</Text>
        <Text style={styles.privateMsg}>This member has a private profile.</Text>
      </View>
    );
  }

  const displayName = profile?.full_name || userData?.username || 'Member';
  const photoUrl = profile?.photo_filename ? uploadUrl(profile.photo_filename) : null;

  return (
    <ScrollView style={styles.scroll}>
      {/* Cover */}
      <View style={styles.cover} />
      <View style={styles.avatarWrap}>
        {photoUrl
          ? <Image source={{ uri: photoUrl }} style={styles.avatar} />
          : <View style={[styles.avatar, styles.avatarPlaceholder]}><Text style={styles.avatarInitial}>{displayName[0]?.toUpperCase()}</Text></View>}
      </View>

      {isOwn && (
        <TouchableOpacity style={styles.editBtn} onPress={() => navigation.navigate('EditProfile')}>
          <Ionicons name="pencil-outline" size={14} color={colors.primary} />
          <Text style={styles.editBtnText}>Edit</Text>
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

      {/* Info chips */}
      <View style={styles.chips}>
        {profile?.location && <Chip icon="location-outline" text={profile.location} />}
        {profile?.occupation && <Chip icon="briefcase-outline" text={profile.occupation} />}
        {profile?.dob && <Chip icon="calendar-outline" text={profile.dob} />}
        {profile?.native_place && <Chip icon="home-outline" text={profile.native_place} />}
      </View>

      {/* Community details */}
      {(profile?.native_place || profile?.gothram) && (
        <Section title="Community Details">
          {profile.native_place && <InfoRow label="Native Place" value={profile.native_place} />}
          {profile.gothram && <InfoRow label="Gothram" value={profile.gothram} />}
        </Section>
      )}

      {/* Links */}
      {(profile?.linkedin || profile?.website) && (
        <Section title="Links">
          {profile.linkedin && <InfoRow label="LinkedIn" value={profile.linkedin} />}
          {profile.website && <InfoRow label="Website" value={profile.website} />}
        </Section>
      )}

      {isOwn && (
        <View style={styles.actionsSection}>
          <TouchableOpacity style={styles.actionBtn} onPress={() => navigation.navigate('FamilyTree')}>
            <Ionicons name="git-branch-outline" size={18} color={colors.primary} />
            <Text style={styles.actionBtnText}>My Family Tree</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionBtn, styles.logoutBtn]} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={18} color={colors.error} />
            <Text style={[styles.actionBtnText, { color: colors.error }]}>Sign Out</Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={{ height: 40 }} />
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
  privateBox: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl },
  privateTitle: { fontSize: 20, fontWeight: '700', color: colors.text, marginTop: 12 },
  privateMsg: { fontSize: 14, color: colors.textMuted, marginTop: 6, textAlign: 'center' },
});
