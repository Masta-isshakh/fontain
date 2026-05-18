import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { generateClient } from 'aws-amplify/data';
import { getUrl } from 'aws-amplify/storage';
import type { Schema } from '../../../amplify/data/resource';
import { useAuth } from '../../context/AuthContext';
import { LoadingScreen, EmptyState, StatusBadge } from '../../components';
import { Colors, FontSize, FontWeight, Spacing, BorderRadius, Shadow } from '../../theme';

const client = generateClient<Schema>();

interface Props {
  route: any;
  navigation: any;
}

export function PlaylistDetailScreen({ route, navigation }: Props) {
  const { playlistId, title } = route.params;
  const { user } = useAuth();
  const [videos, setVideos] = useState<any[]>([]);
  const [playlist, setPlaylist] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [progress, setProgress] = useState<Record<string, number>>({});

  const load = useCallback(async () => {
    try {
      const [playlistResult, videosResult] = await Promise.all([
        client.models.Playlist.get({ id: playlistId }),
        client.models.CourseVideo.list({
          filter: { playlistId: { eq: playlistId }, isPublished: { eq: true } },
        }),
      ]);
      setPlaylist(playlistResult.data);

      const vids = (videosResult.data ?? []).sort((a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0));

      // Load video URLs
      const withUrls = await Promise.all(
        vids.map(async (v) => {
          let thumbUrl = '';
          if (v.thumbnailStorageKey) {
            try {
              const s3 = await getUrl({ path: v.thumbnailStorageKey });
              thumbUrl = s3.url.toString();
            } catch { thumbUrl = ''; }
          }
          return { ...v, thumbUrl };
        })
      );
      setVideos(withUrls);

      // Load user progress
      if (user) {
        const progressResult = await client.models.CourseProgress.list({
          filter: { userId: { eq: user.userId }, playlistId: { eq: playlistId } },
        });
        const progressMap: Record<string, number> = {};
        for (const p of progressResult.data ?? []) {
          progressMap[p.videoId] = p.progressPercentage ?? 0;
        }
        setProgress(progressMap);
      }
    } catch (err) {
      console.warn('Failed to load playlist:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [playlistId, user]);

  useEffect(() => { load(); }, [load]);

  const onRefresh = () => { setRefreshing(true); load(); };

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

  const canWatch = (video: any) => {
    if (video.visibility === 'PUBLIC') return true;
    return user?.role === 'FREELANCER' || user?.role === 'ADMIN';
  };

  if (loading) return <LoadingScreen />;

  return (
    <View style={styles.container}>
      <FlatList
        data={videos}
        keyExtractor={(v) => v.id}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
        ListHeaderComponent={
          <View style={styles.header}>
            {playlist?.thumbnail ? (
              <Image source={{ uri: playlist.thumbnail }} style={styles.heroThumb} />
            ) : (
              <View style={styles.heroPlaceholder}>
                <Ionicons name="play-circle" size={64} color={Colors.primary} />
              </View>
            )}
            <View style={styles.headerInfo}>
              <Text style={styles.playlistTitle}>{playlist?.title ?? title}</Text>
              {playlist?.description ? (
                <Text style={styles.playlistDesc}>{playlist.description}</Text>
              ) : null}
              <View style={styles.meta}>
                <Ionicons name="videocam-outline" size={14} color={Colors.textMuted} />
                <Text style={styles.metaText}>{videos.length} vidéo{videos.length !== 1 ? 's' : ''}</Text>
                {playlist?.visibility === 'FREELANCER_ONLY' && (
                  <StatusBadge status="IN_PROGRESS" size="sm" />
                )}
              </View>
            </View>
            <Text style={styles.sectionTitle}>Contenu de la formation</Text>
          </View>
        }
        ListEmptyComponent={
          <EmptyState
            title="Aucune vidéo"
            message="Cette formation ne contient pas encore de vidéos."
            icon="videocam-outline"
          />
        }
        renderItem={({ item, index }) => {
          const watchable = canWatch(item);
          const prog = progress[item.id] ?? 0;
          return (
            <TouchableOpacity
              style={[styles.videoItem, !watchable && styles.videoItemLocked]}
              onPress={() => {
                if (!watchable) {
                  openLogin();
                  return;
                }
                navigation.navigate('VideoPlayer', { videoId: item.id, videoStorageKey: item.videoStorageKey, title: item.title });
              }}
              activeOpacity={0.8}
            >
              <View style={styles.videoIndex}>
                {prog >= 100 ? (
                  <Ionicons name="checkmark-circle" size={24} color={Colors.success} />
                ) : (
                  <Text style={styles.videoIndexText}>{index + 1}</Text>
                )}
              </View>
              <View style={styles.videoThumb}>
                {item.thumbUrl ? (
                  <Image source={{ uri: item.thumbUrl }} style={styles.thumbImg} />
                ) : (
                  <View style={styles.thumbPlaceholder}>
                    <Ionicons name="play" size={20} color={Colors.primary} />
                  </View>
                )}
                {!watchable && (
                  <View style={styles.lockOverlay}>
                    <Ionicons name="lock-closed" size={16} color={Colors.white} />
                  </View>
                )}
              </View>
              <View style={styles.videoInfo}>
                <Text style={styles.videoTitle} numberOfLines={2}>{item.title}</Text>
                {item.duration ? (
                  <Text style={styles.videoDuration}>
                    {Math.floor(item.duration / 60)}min {item.duration % 60}s
                  </Text>
                ) : null}
                {prog > 0 && prog < 100 ? (
                  <View style={styles.progressBar}>
                    <View style={[styles.progressFill, { width: `${prog}%` }]} />
                  </View>
                ) : null}
              </View>
              <Ionicons
                name={watchable ? 'chevron-forward' : 'lock-closed-outline'}
                size={18}
                color={Colors.textMuted}
              />
            </TouchableOpacity>
          );
        }}
        ItemSeparatorComponent={() => <View style={{ height: 1, backgroundColor: Colors.border }} />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  list: { paddingBottom: Spacing[10] },
  header: { gap: Spacing[4] },
  heroThumb: {
    width: '100%',
    height: 200,
    resizeMode: 'cover',
    backgroundColor: Colors.gray100,
  },
  heroPlaceholder: {
    height: 200,
    backgroundColor: Colors.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerInfo: { padding: Spacing[4], gap: Spacing[2] },
  playlistTitle: {
    fontSize: FontSize['2xl'],
    fontWeight: FontWeight.bold,
    color: Colors.text,
  },
  playlistDesc: {
    fontSize: FontSize.base,
    color: Colors.textSecondary,
    lineHeight: 24,
  },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
  metaText: { fontSize: FontSize.sm, color: Colors.textMuted },
  sectionTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.text,
    paddingHorizontal: Spacing[4],
    paddingBottom: Spacing[2],
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  videoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing[4],
    gap: Spacing[3],
    backgroundColor: Colors.surface,
  },
  videoItemLocked: { opacity: 0.7 },
  videoIndex: {
    width: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  videoIndexText: {
    fontSize: FontSize.base,
    fontWeight: FontWeight.semibold,
    color: Colors.textMuted,
  },
  videoThumb: {
    width: 80,
    height: 56,
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
    position: 'relative',
  },
  thumbImg: { width: '100%', height: '100%', resizeMode: 'cover' },
  thumbPlaceholder: {
    flex: 1,
    backgroundColor: Colors.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lockOverlay: {
    position: 'absolute',
    inset: 0,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  videoInfo: { flex: 1, gap: 4 },
  videoTitle: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    color: Colors.text,
  },
  videoDuration: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
  },
  progressBar: {
    height: 3,
    backgroundColor: Colors.gray200,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 2,
  },
});
