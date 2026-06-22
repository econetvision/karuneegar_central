import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, TextInput, TouchableOpacity, ActivityIndicator, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import api from '../api/client';
import { useAuth } from '../contexts/AuthContext';
import { colors, spacing, radius } from '../theme';

export default function ForumThreadScreen({ navigation, route }: any) {
  const { threadId, title } = route.params;
  const { user } = useAuth();
  const [thread, setThread] = useState<any>(null);
  const [replies, setReplies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [reply, setReply] = useState('');
  const [posting, setPosting] = useState(false);

  useEffect(() => {
    navigation.setOptions({ title });
    api.get(`/forums/threads/${threadId}`).then((r) => {
      setThread(r.data.thread);
      setReplies(r.data.replies);
    }).finally(() => setLoading(false));
  }, [threadId]);

  const postReply = async () => {
    if (!reply.trim()) return;
    setPosting(true);
    try {
      const r = await api.post('/forums/replies', { thread_id: threadId, body: reply });
      setReplies((prev) => [...prev, r.data.reply]);
      setReply('');
    } catch { Alert.alert('Error', 'Failed to post reply.'); }
    finally { setPosting(false); }
  };

  if (loading) return <ActivityIndicator style={{ flex: 1 }} color={colors.primary} />;

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={90}>
      <FlatList
        data={replies}
        keyExtractor={(i) => String(i.id)}
        contentContainerStyle={{ padding: spacing.md }}
        ListHeaderComponent={thread ? (
          <View style={styles.threadCard}>
            <Text style={styles.threadTitle}>{thread.title}</Text>
            <Text style={styles.threadAuthor}>by {thread.author_name || thread.author_username}</Text>
            {thread.body ? <Text style={styles.threadBody}>{thread.body}</Text> : null}
          </View>
        ) : null}
        renderItem={({ item }) => (
          <View style={styles.replyCard}>
            <View style={styles.replyHeader}>
              <View style={styles.replyAvatar}><Text style={styles.replyAvatarText}>{(item.author_name || item.author_username)?.[0]?.toUpperCase()}</Text></View>
              <View>
                <Text style={styles.replyAuthor}>{item.author_name || item.author_username}</Text>
                <Text style={styles.replyDate}>{new Date(item.created_at).toLocaleDateString('en-IN')}</Text>
              </View>
            </View>
            <Text style={styles.replyBody}>{item.body}</Text>
          </View>
        )}
        ListEmptyComponent={<Text style={styles.noReplies}>No replies yet. Be the first!</Text>}
      />
      {user && (
        <View style={styles.replyBox}>
          <TextInput
            style={styles.replyInput}
            placeholder="Write a reply…"
            value={reply}
            onChangeText={setReply}
            multiline
          />
          <TouchableOpacity style={styles.sendBtn} onPress={postReply} disabled={posting || !reply.trim()}>
            {posting ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.sendBtnText}>Post</Text>}
          </TouchableOpacity>
        </View>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  threadCard: { backgroundColor: colors.card, borderRadius: radius.lg, padding: spacing.md, marginBottom: spacing.md },
  threadTitle: { fontSize: 18, fontWeight: '700', color: colors.text, marginBottom: 4 },
  threadAuthor: { fontSize: 12, color: colors.textMuted, marginBottom: 8 },
  threadBody: { fontSize: 14, color: colors.text, lineHeight: 20 },
  replyCard: { backgroundColor: colors.card, borderRadius: radius.md, padding: spacing.md, marginBottom: 8 },
  replyHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  replyAvatar: { width: 32, height: 32, borderRadius: 16, backgroundColor: colors.primaryLight, alignItems: 'center', justifyContent: 'center' },
  replyAvatarText: { color: colors.primary, fontWeight: '700' },
  replyAuthor: { fontSize: 13, fontWeight: '600', color: colors.text },
  replyDate: { fontSize: 11, color: colors.textMuted },
  replyBody: { fontSize: 14, color: colors.text, lineHeight: 20 },
  noReplies: { textAlign: 'center', color: colors.textMuted, marginTop: 20, fontSize: 14 },
  replyBox: { flexDirection: 'row', padding: spacing.md, backgroundColor: colors.card, borderTopWidth: 1, borderTopColor: colors.border, gap: 8 },
  replyInput: { flex: 1, borderWidth: 1.5, borderColor: colors.border, borderRadius: radius.md, paddingHorizontal: 12, paddingVertical: 8, fontSize: 14, maxHeight: 80 },
  sendBtn: { backgroundColor: colors.primary, borderRadius: radius.md, paddingHorizontal: 16, alignItems: 'center', justifyContent: 'center' },
  sendBtnText: { color: '#fff', fontWeight: '700' },
});
