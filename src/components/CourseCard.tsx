import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, FontSize, FontWeight, BorderRadius, Shadow } from '../theme';

interface CourseCardProps {
  title: string;
  description?: string;
  thumbnail?: string;
  videoCount?: number;
  visibility?: 'PUBLIC' | 'FREELANCER_ONLY';
  onPress?: () => void;
}

export function CourseCard({
  title,
  description,
  thumbnail,
  videoCount,
  visibility,
  onPress,
}: CourseCardProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      style={styles.card}
    >
      <View style={styles.thumbnailContainer}>
        {thumbnail ? (
          <Image source={{ uri: thumbnail }} style={styles.thumbnail} />
        ) : (
          <View style={styles.thumbnailPlaceholder}>
            <Ionicons name="play-circle" size={48} color={Colors.primary} />
          </View>
        )}
        {visibility === 'FREELANCER_ONLY' && (
          <View style={styles.badge}>
            <Ionicons name="lock-closed" size={10} color={Colors.white} />
            <Text style={styles.badgeText}>Privé</Text>
          </View>
        )}
        <View style={styles.playOverlay}>
          <Ionicons name="play-circle" size={40} color={Colors.white} />
        </View>
      </View>
      <View style={styles.content}>
        <Text style={styles.title} numberOfLines={2}>{title}</Text>
        {description ? (
          <Text style={styles.description} numberOfLines={2}>{description}</Text>
        ) : null}
        {videoCount !== undefined ? (
          <View style={styles.meta}>
            <Ionicons name="videocam-outline" size={14} color={Colors.textMuted} />
            <Text style={styles.metaText}>{videoCount} vidéo{videoCount !== 1 ? 's' : ''}</Text>
          </View>
        ) : null}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
    ...Shadow.md,
  },
  thumbnailContainer: {
    height: 180,
    position: 'relative',
    backgroundColor: Colors.gray100,
  },
  thumbnail: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  thumbnailPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primaryMuted,
  },
  playOverlay: {
    position: 'absolute',
    bottom: 12,
    right: 12,
  },
  badge: {
    position: 'absolute',
    top: 10,
    left: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.secondary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  badgeText: {
    fontSize: 11,
    color: Colors.white,
    fontWeight: FontWeight.semibold,
  },
  content: { padding: 14, gap: 6 },
  title: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    color: Colors.text,
  },
  description: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  metaText: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
  },
});
