import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  SectionList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../../../amplify/data/resource';
import { LoadingScreen, EmptyState } from '../../components';
import { useAuth } from '../../context/AuthContext';
import { Colors, FontSize, FontWeight, Spacing, BorderRadius, Shadow } from '../../theme';

const client = generateClient<Schema>();

interface Props { navigation: any }

export function AdminChatScreen({ navigation }: Props) {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<any[]>([]);
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const flatRef = useRef<FlatList>(null);

  const loadConversations = useCallback(async () => {
    try {
      const result = await client.models.ChatMessage.list();
      const msgs = result.data ?? [];
      // Group by freelancer
      const map = new Map<string, any>();
      msgs.forEach((m) => {
        const freelancerId = m.senderId === 'ADMIN' ? m.receiverId : m.senderId;
        const existing = map.get(freelancerId);
        if (!existing || new Date(m.createdAt ?? 0) > new Date(existing.lastAt ?? 0)) {
          map.set(freelancerId, {
            userId: freelancerId,
            name: m.senderRole !== 'ADMIN' ? m.senderName : existing?.name ?? freelancerId,
            lastMessage: m.content,
            lastAt: m.createdAt,
            unread: msgs.filter(
              (x) => x.senderId === freelancerId && !x.isRead
            ).length,
          });
        }
      });
      setConversations(Array.from(map.values()).sort(
        (a, b) => new Date(b.lastAt ?? 0).getTime() - new Date(a.lastAt ?? 0).getTime()
      ));
    } catch {}
    finally { setLoading(false); }
  }, []);

  const loadMessages = useCallback(async (userId: string) => {
    try {
      const result = await client.models.ChatMessage.list({
        filter: {
          or: [
            { senderId: { eq: userId } },
            { receiverId: { eq: userId } },
          ],
        },
      });
      const sorted = (result.data ?? []).sort(
        (a, b) => new Date(a.createdAt ?? 0).getTime() - new Date(b.createdAt ?? 0).getTime()
      );
      setMessages(sorted);
    } catch {}
  }, []);

  useEffect(() => { loadConversations(); }, [loadConversations]);

  useEffect(() => {
    if (!selectedUser) return;
    loadMessages(selectedUser);
    const iv = setInterval(() => loadMessages(selectedUser), 10000);
    return () => clearInterval(iv);
  }, [selectedUser, loadMessages]);

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => flatRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [messages.length]);

  const sendReply = async () => {
    if (!text.trim() || !user || !selectedUser) return;
    const content = text.trim();
    setText('');
    setSending(true);
    try {
      await client.models.ChatMessage.create({
        senderId: 'ADMIN',
        senderName: 'Support Fontain',
        senderRole: 'ADMIN',
        receiverId: selectedUser,
        content,
        isRead: false,
      });
      await loadMessages(selectedUser);
    } catch {
      setText(content);
    } finally {
      setSending(false);
    }
  };

  if (loading) return <LoadingScreen />;

  if (!selectedUser) {
    return (
      <FlatList
        data={conversations}
        keyExtractor={(item) => item.userId}
        contentContainerStyle={styles.list}
        ListHeaderComponent={<Text style={styles.listTitle}>Conversations ({conversations.length})</Text>}
        ListEmptyComponent={<EmptyState title="Aucune conversation" icon="chatbubbles-outline" />}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.convCard}
            onPress={() => setSelectedUser(item.userId)}
          >
            <View style={styles.convAvatar}>
              <Text style={styles.convAvatarText}>{(item.name?.[0] ?? '?').toUpperCase()}</Text>
            </View>
            <View style={styles.convInfo}>
              <Text style={styles.convName}>{item.name}</Text>
              <Text style={styles.convLast} numberOfLines={1}>{item.lastMessage}</Text>
            </View>
            <View style={styles.convRight}>
              <Text style={styles.convTime}>
                {new Date(item.lastAt ?? '').toLocaleDateString('fr-FR')}
              </Text>
              {item.unread > 0 ? (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{item.unread}</Text>
                </View>
              ) : null}
            </View>
          </TouchableOpacity>
        )}
        ItemSeparatorComponent={() => <View style={{ height: 1, backgroundColor: Colors.border, marginLeft: 72 }} />}
      />
    );
  }

  const conv = conversations.find((c) => c.userId === selectedUser);

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={90}
    >
      <View style={styles.chatHeader}>
        <TouchableOpacity onPress={() => setSelectedUser(null)}>
          <Ionicons name="arrow-back" size={22} color={Colors.primary} />
        </TouchableOpacity>
        <View style={styles.chatAvatar}>
          <Text style={styles.chatAvatarText}>{(conv?.name?.[0] ?? '?').toUpperCase()}</Text>
        </View>
        <Text style={styles.chatName}>{conv?.name ?? selectedUser}</Text>
      </View>

      <FlatList
        ref={flatRef}
        data={messages}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.messagesList}
        renderItem={({ item }) => {
          const isAdmin = item.senderId === 'ADMIN';
          return (
            <View style={[styles.msgRow, isAdmin && styles.msgRowOwn]}>
              <View style={[styles.msgBubble, isAdmin ? styles.bubbleAdmin : styles.bubbleUser]}>
                <Text style={[styles.msgContent, isAdmin && styles.msgContentOwn]}>
                  {item.content}
                </Text>
                <Text style={[styles.msgTime, isAdmin && styles.msgTimeOwn]}>
                  {new Date(item.createdAt ?? '').toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                </Text>
              </View>
            </View>
          );
        }}
        onContentSizeChange={() => flatRef.current?.scrollToEnd({ animated: true })}
      />

      <View style={styles.inputArea}>
        <TextInput
          style={styles.input}
          value={text}
          onChangeText={setText}
          placeholder="Répondre..."
          placeholderTextColor={Colors.textMuted}
          multiline
          maxLength={1000}
        />
        <TouchableOpacity
          style={[styles.sendBtn, (!text.trim() || sending) && styles.sendBtnDisabled]}
          onPress={sendReply}
          disabled={!text.trim() || sending}
        >
          {sending ? <ActivityIndicator size="small" color={Colors.white} /> : <Ionicons name="send" size={18} color={Colors.white} />}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  list: { padding: Spacing[4] },
  listTitle: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
    color: Colors.text,
    marginBottom: Spacing[4],
  },
  convCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[3],
    paddingVertical: Spacing[4],
    paddingHorizontal: Spacing[2],
    backgroundColor: Colors.surface,
  },
  convAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  convAvatarText: { fontSize: FontSize.xl, fontWeight: FontWeight.bold, color: Colors.white },
  convInfo: { flex: 1, gap: 3 },
  convName: { fontSize: FontSize.base, fontWeight: FontWeight.semibold, color: Colors.text },
  convLast: { fontSize: FontSize.sm, color: Colors.textMuted },
  convRight: { alignItems: 'flex-end', gap: 4 },
  convTime: { fontSize: FontSize.xs, color: Colors.textMuted },
  badge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: { fontSize: 10, fontWeight: FontWeight.bold, color: Colors.white },
  chatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: Spacing[4],
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  chatAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chatAvatarText: { fontSize: FontSize.base, fontWeight: FontWeight.bold, color: Colors.white },
  chatName: { flex: 1, fontSize: FontSize.base, fontWeight: FontWeight.semibold, color: Colors.text },
  messagesList: { padding: Spacing[4], paddingBottom: Spacing[2] },
  msgRow: { flexDirection: 'row', marginBottom: 8 },
  msgRowOwn: { flexDirection: 'row-reverse' },
  msgBubble: {
    maxWidth: '75%',
    borderRadius: BorderRadius.xl,
    padding: 12,
    gap: 4,
  },
  bubbleAdmin: { backgroundColor: Colors.primary, borderBottomRightRadius: 4 },
  bubbleUser: { backgroundColor: Colors.surface, borderBottomLeftRadius: 4, ...Shadow.sm },
  msgContent: { fontSize: FontSize.base, color: Colors.text },
  msgContentOwn: { color: Colors.white },
  msgTime: { fontSize: 10, color: Colors.textMuted, alignSelf: 'flex-end' },
  msgTimeOwn: { color: 'rgba(255,255,255,0.7)' },
  inputArea: {
    flexDirection: 'row',
    gap: 12,
    padding: Spacing[3],
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    alignItems: 'flex-end',
  },
  input: {
    flex: 1,
    backgroundColor: Colors.gray50,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: BorderRadius.xl,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: FontSize.base,
    color: Colors.text,
    maxHeight: 120,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: { opacity: 0.5 },
});
