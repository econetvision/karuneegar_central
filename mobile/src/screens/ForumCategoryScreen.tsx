import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, TextInput, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../api/client';
import { useAuth } from '../contexts/AuthContext';
import { colors, spacing, radius } from '../theme';

export default function ForumCategoryScreen({ navigation, route }: any) {
  const { catId, title } = route.params;
  const { user } = useAuth();
  const [threads, setThreads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNew, setShowNew] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newBody, setNewBody] = useState('');
  const [posting, setPosting] = useState(false);

  useEffect(() => {
    navigation.setOptions({ title });
    api.get(`/forums/categories/${catId}/threads`).then((r) => setThreads(r.data.threads)).finally(() => setLoading(false));
  }, [catId]);

  const postThread = async () => {
    if (!newTitle.trim()) { Alert.alert('Error', 'Thread title is required.'); return; }
    setPosting(true);
    try {
      const r = await api.post('/forums/threads', { category_id: catId, title: newTitle, body: newBody });
      setThreads((prev) => [r.data.thread, ...prev]);
      setShowNew(false); setNewTitle(''); setNewBody('');
    } catch { Alert.alert('Error', 'Failed to post thread.'); }
    finally { setPosting(false); }
  };

  if (loading) return <ActivityIndicator style={{ flex: 1 }} color={colors.primary} />;

  return (
    <View style={styles.container}>
      {user && !showNew && (
        <TouchableOpacity style={styles.newThreadBtn} onPress={() => setShowNew(true)}>
          <Ionicons name="add" size={18} color="#fff" />
          <Text style={styles.newThreadBtnText}>New Thread</Text>
        </TouchableOpacity>
      )}

      {showNew && (
        <View style={styles.newForm}>
          <TextInput style={styles.input} placeholder="Thread title" value={newTitle} onChangeText={setNewTitle} />
          <TextInput style={[styles.input, { minHeight: 80, textAlignVertical: 'top' }]} placeholder="Body (optional)" multiline value={newBody} onChangeText={setNewBody} />
          <View style={styles.formBtns}>
            <TouchableOpacity style={styles.postBtn} onPress={postThread} disabled={posting}>
              <Text style={styles.postBtnText}>{posting ? 'Posting…' : 'Post'}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowNew(false)}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      <FlatList
        data={threads}
        keyExtractor={(i) => String(i.id)}
        contentContainerStyle={{ padding: spacing.md }}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.card} onPress={() => navigation.navigate('ForumThread', { threadId: item.id, title: item.title })}>
            <Text style={styles.threadTitle} numberOfLines={2}>{item.title}</Text>
            <View style={styles.threadMeta}>
              <Text style={styles.metaText}>by {item.author_name || item.author_username}</Text>
              <Text style={styles.metaText}>{item.reply_count ?? 0} replies</Text>
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={<Text style={styles.empty}>No threads yet. Start one!</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  newThreadBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, margin: spacing.md, backgroundColor: colors.primary, borderRadius: radius.md, padding: 12, alignSelf: 'flex-end' },
  newThreadBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  newForm: { margin: spacing.md, backgroundColor: colors.card, borderRadius: radius.lg, padding: spacing.md, gap: 10 },
  input: { borderWidth: 1.5, borderColor: colors.border, borderRadius: radius.md, padding: 10, fontSize: 14, color: colors.text },
  formBtns: { flexDirection: 'row', gap: 10 },
  postBtn: { flex: 1, backgroundColor: colors.primary, borderRadius: radius.md, padding: 10, alignItems: 'center' },
  postBtnText: { color: '#fff', fontWeight: '700' },
  cancelBtn: { flex: 1, borderWidth: 1.5, borderColor: colors.border, borderRadius: radius.md, padding: 10, alignItems: 'center' },
  cancelBtnText: { color: colors.textMuted, fontWeight: '600' },
  card: { backgroundColor: colors.card, borderRadius: radius.lg, padding: spacing.md, marginBottom: 10 },
  threadTitle: { fontSize: 15, fontWeight: '600', color: colors.text, marginBottom: 6 },
  threadMeta: { flexDirection: 'row', justifyContent: 'space-between' },
  metaText: { fontSize: 12, color: colors.textMuted },
  empty: { textAlign: 'center', color: colors.textMuted, marginTop: 40, fontSize: 15 },
});
