import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  FlatList,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getUrl } from 'aws-amplify/storage';
import { generateClient } from 'aws-amplify/data';
import { useVideoPlayer, VideoView } from 'expo-video';
import type { Schema } from '../../../amplify/data/resource';
import { useAuth } from '../../context/AuthContext';
import { Colors, FontSize, FontWeight, Spacing, BorderRadius, Shadow } from '../../theme';
import { LoadingScreen } from '../../components';

const client = generateClient<Schema>();

interface Props {
  route: any;
  navigation: any;
}

export function VideoPlayerScreen({ route, navigation }: Props) {
  const { videoId, videoStorageKey, title } = route.params;
  const { user } = useAuth();
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [loadingUrl, setLoadingUrl] = useState(true);
  const [comments, setComments] = useState<any[]>([]);
  const [commentText, setCommentText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const player = useVideoPlayer(videoUrl ?? '', (p) => {
    if (videoUrl) p.play();
  });

  useEffect(() => {
    const fetchUrl = async () => {
      try {
        const result = await getUrl({ path: videoStorageKey });
        setVideoUrl(result.url.toString());
      } catch (err) {
        Alert.alert('Erreur', 'Impossible de charger la vidéo');
      } finally {
        setLoadingUrl(false);
      }
    };
    fetchUrl();
    loadComments();
  }, [videoStorageKey]);

  const loadComments = async () => {
    try {
      const result = await client.models.VideoComment.list({
        filter: { videoId: { eq: videoId }, isDeleted: { eq: false } },
      });
      const sorted = (result.data ?? []).sort(
        (a, b) => new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime()
      );
      setComments(sorted);
    } catch {}
  };

  const submitComment = async () => {
    if (!commentText.trim() || !user) return;
    setSubmitting(true);
    try {
      await client.models.VideoComment.create({
        videoId,
        authorId: user.userId,
        authorName: user.fullName,
        content: commentText.trim(),
        isDeleted: false,
      });
      setCommentText('');
      await loadComments();
    } catch (err) {
      Alert.alert('Erreur', 'Impossible d\'envoyer le commentaire');
    } finally {
      setSubmitting(false);
    }
  };

  const openLogin = () => {
    let currentNav: any = navigation;
    while (currentNav) {
      const state = currentNav.getState?.();
      if (state?.routeNames?.includes?.('AuthModal')) {
        currentNav.navigate('AuthModal', { screen: 'Login' });
        return;
      }
      currentNav = currentNav.getParent?.();
    }
  };

  if (loadingUrl) return <LoadingScreen message="Chargement de la vidéo..." />;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Video */}
      <View style={styles.playerContainer}>
        {videoUrl ? (
          <VideoView
            player={player}
            style={styles.player}
            allowsPictureInPicture
          />
        ) : (
          <View style={styles.playerError}>
            <Ionicons name="alert-circle-outline" size={48} color={Colors.danger} />
            <Text style={styles.playerErrorText}>Vidéo indisponible</Text>
          </View>
        )}
      </View>

      {/* Video Info */}
      <View style={styles.infoSection}>
        <Text style={styles.videoTitle}>{title}</Text>
      </View>

      {/* Comments */}
      <View style={styles.commentsSection}>
        <Text style={styles.sectionTitle}>Commentaires ({comments.length})</Text>

        {user ? (
          <View style={styles.commentInput}>
            <TextInput
              style={styles.commentTextInput}
              value={commentText}
              onChangeText={setCommentText}
              placeholder="Écrire un commentaire..."
              placeholderTextColor={Colors.textMuted}
              multiline
              maxLength={500}
            />
            <TouchableOpacity
              style={[styles.sendBtn, !commentText.trim() && styles.sendBtnDisabled]}
              onPress={submitComment}
              disabled={!commentText.trim() || submitting}
            >
              {submitting ? (
                <ActivityIndicator size="small" color={Colors.white} />
              ) : (
                <Ionicons name="send" size={18} color={Colors.white} />
              )}
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            style={styles.loginPrompt}
            onPress={openLogin}
          >
            <Text style={styles.loginPromptText}>Connectez-vous pour commenter</Text>
          </TouchableOpacity>
        )}

        {comments.map((c) => (
          <View key={c.id} style={styles.commentItem}>
            <View style={styles.commentAvatar}>
              <Text style={styles.commentAvatarText}>
                {(c.authorName?.[0] ?? '?').toUpperCase()}
              </Text>
            </View>
            <View style={styles.commentBody}>
              <View style={styles.commentMeta}>
                <Text style={styles.commentAuthor}>{c.authorName}</Text>
                <Text style={styles.commentDate}>
                  {new Date(c.createdAt ?? '').toLocaleDateString('fr-FR')}
                </Text>
              </View>
              <Text style={styles.commentContent}>{c.content}</Text>
            </View>
          </View>
        ))}

        {comments.length === 0 ? (
          <Text style={styles.noComments}>Soyez le premier à commenter cette vidéo.</Text>
        ) : null}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.black },
  content: { paddingBottom: Spacing[10] },
  playerContainer: {
    width: '100%',
    aspectRatio: 16 / 9,
    backgroundColor: Colors.black,
  },
  player: { flex: 1 },
  playerError: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  playerErrorText: {
    fontSize: FontSize.base,
    color: Colors.danger,
  },
  infoSection: {
    padding: Spacing[4],
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  videoTitle: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
    color: Colors.text,
  },
  commentsSection: {
    backgroundColor: Colors.background,
    padding: Spacing[4],
    gap: Spacing[4],
    marginTop: Spacing[2],
  },
  sectionTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.text,
  },
  commentInput: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-end',
  },
  commentTextInput: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: BorderRadius.lg,
    padding: 12,
    fontSize: FontSize.base,
    color: Colors.text,
    minHeight: 48,
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
  loginPrompt: {
    backgroundColor: Colors.primaryMuted,
    padding: 14,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
  },
  loginPromptText: {
    fontSize: FontSize.base,
    color: Colors.primary,
    fontWeight: FontWeight.semibold,
  },
  commentItem: {
    flexDirection: 'row',
    gap: 12,
    backgroundColor: Colors.surface,
    padding: 14,
    borderRadius: BorderRadius.xl,
    ...Shadow.sm,
  },
  commentAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  commentAvatarText: {
    fontSize: FontSize.base,
    fontWeight: FontWeight.bold,
    color: Colors.primary,
  },
  commentBody: { flex: 1, gap: 4 },
  commentMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  commentAuthor: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    color: Colors.text,
  },
  commentDate: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
  },
  commentContent: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  noComments: {
    fontSize: FontSize.base,
    color: Colors.textMuted,
    textAlign: 'center',
    padding: Spacing[4],
  },
});
