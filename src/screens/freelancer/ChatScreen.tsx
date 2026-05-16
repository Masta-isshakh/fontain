import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../../../amplify/data/resource';
import { useAuth } from '../../context/AuthContext';
import { Colors, FontSize, FontWeight, Spacing, BorderRadius, Shadow } from '../../theme';

const client = generateClient<Schema>();

interface Props {
  navigation: any;
}

export function ChatScreen({ navigation }: Props) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<any[]>([]);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const flatRef = useRef<FlatList>(null);

  const loadMessages = useCallback(async () => {
    if (!user) return;
    try {
      const result = await client.models.ChatMessage.list({
        filter: {
          or: [
            { senderId: { eq: user.userId } },
            { receiverId: { eq: user.userId } },
          ],
        },
      });
      const sorted = (result.data ?? []).sort(
        (a, b) => new Date(a.createdAt ?? 0).getTime() - new Date(b.createdAt ?? 0).getTime()
      );
      setMessages(sorted);
    } catch {}
  }, [user]);

  useEffect(() => {
    loadMessages();
    // Poll every 15s for new messages
    const interval = setInterval(loadMessages, 15000);
    return () => clearInterval(interval);
  }, [loadMessages]);

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => flatRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [messages.length]);

  const sendMessage = async () => {
    if (!text.trim() || !user) return;
    const content = text.trim();
    setText('');
    setSending(true);
    try {
      // Send to admin (broadcast to admin channel)
      await client.models.ChatMessage.create({
        senderId: user.userId,
        senderName: user.fullName,
        senderRole: user.role,
        receiverId: 'ADMIN',
        content,
        isRead: false,
      });
      await loadMessages();
    } catch {
      Alert.alert('Erreur', 'Impossible d\'envoyer le message');
      setText(content);
    } finally {
      setSending(false);
    }
  };

  if (!user) {
    return (
      <View style={styles.center}>
        <Ionicons name="chatbubbles-outline" size={64} color={Colors.gray300} />
        <Text style={styles.emptyTitle}>Connexion requise</Text>
        <Text style={styles.emptyText}>Vous devez être connecté pour accéder à la messagerie.</Text>
      </View>
    );
  }

  const renderMessage = ({ item }: { item: any }) => {
    const isOwn = item.senderId === user.userId;
    return (
      <View style={[styles.msgRow, isOwn && styles.msgRowOwn]}>
        {!isOwn && (
          <View style={styles.msgAvatar}>
            <Ionicons name="person" size={16} color={Colors.primary} />
          </View>
        )}
        <View style={[styles.msgBubble, isOwn ? styles.msgBubbleOwn : styles.msgBubbleOther]}>
          {!isOwn && (
            <Text style={styles.msgSender}>{item.senderName}</Text>
          )}
          <Text style={[styles.msgContent, isOwn && styles.msgContentOwn]}>{item.content}</Text>
          <Text style={[styles.msgTime, isOwn && styles.msgTimeOwn]}>
            {new Date(item.createdAt ?? '').toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={90}
    >
      {/* Header */}
      <View style={styles.chatHeader}>
        <View style={styles.chatAvatar}>
          <Ionicons name="headset" size={20} color={Colors.white} />
        </View>
        <View style={styles.chatHeaderInfo}>
          <Text style={styles.chatName}>Support Fontain</Text>
          <Text style={styles.chatStatus}>Disponible</Text>
        </View>
      </View>

      <FlatList
        ref={flatRef}
        data={messages}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.messagesList}
        renderItem={renderMessage}
        ListEmptyComponent={
          <View style={styles.emptyChat}>
            <Ionicons name="chatbubbles-outline" size={48} color={Colors.gray300} />
            <Text style={styles.emptyTitle}>Démarrer une conversation</Text>
            <Text style={styles.emptyText}>
              Envoyez un message à l'équipe Fontain pour toute question ou assistance.
            </Text>
          </View>
        }
        onContentSizeChange={() => flatRef.current?.scrollToEnd({ animated: true })}
      />

      {/* Input */}
      <View style={styles.inputArea}>
        <TextInput
          style={styles.input}
          value={text}
          onChangeText={setText}
          placeholder="Votre message..."
          placeholderTextColor={Colors.textMuted}
          multiline
          maxLength={1000}
          returnKeyType="default"
        />
        <TouchableOpacity
          style={[styles.sendBtn, (!text.trim() || sending) && styles.sendBtnDisabled]}
          onPress={sendMessage}
          disabled={!text.trim() || sending}
        >
          {sending ? (
            <ActivityIndicator size="small" color={Colors.white} />
          ) : (
            <Ionicons name="send" size={18} color={Colors.white} />
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    gap: 16,
  },
  chatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: Spacing[4],
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    ...Shadow.sm,
  },
  chatAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chatHeaderInfo: { gap: 2 },
  chatName: { fontSize: FontSize.base, fontWeight: FontWeight.bold, color: Colors.text },
  chatStatus: { fontSize: FontSize.xs, color: Colors.success, fontWeight: FontWeight.medium },
  messagesList: { padding: Spacing[4], gap: Spacing[3], paddingBottom: Spacing[2] },
  msgRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, marginBottom: 8 },
  msgRowOwn: { flexDirection: 'row-reverse' },
  msgAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  msgBubble: {
    maxWidth: '75%',
    borderRadius: BorderRadius.xl,
    padding: 12,
    gap: 4,
  },
  msgBubbleOwn: {
    backgroundColor: Colors.primary,
    borderBottomRightRadius: 4,
  },
  msgBubbleOther: {
    backgroundColor: Colors.surface,
    borderBottomLeftRadius: 4,
    ...Shadow.sm,
  },
  msgSender: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold,
    color: Colors.primary,
    marginBottom: 2,
  },
  msgContent: { fontSize: FontSize.base, color: Colors.text, lineHeight: 22 },
  msgContentOwn: { color: Colors.white },
  msgTime: { fontSize: 10, color: Colors.textMuted, alignSelf: 'flex-end' },
  msgTimeOwn: { color: 'rgba(255,255,255,0.7)' },
  emptyChat: { alignItems: 'center', paddingTop: 60, gap: 16 },
  emptyTitle: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
    color: Colors.text,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: FontSize.base,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
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
