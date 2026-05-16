import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  Dimensions,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { generateClient } from 'aws-amplify/data';
import { getUrl } from 'aws-amplify/storage';
import type { Schema } from '../../../amplify/data/resource';
import { useAuth } from '../../context/AuthContext';
import { LoadingScreen, EmptyState } from '../../components';
import { Colors, FontSize, FontWeight, Spacing, BorderRadius, Shadow } from '../../theme';

const client = generateClient<Schema>();
const { width } = Dimensions.get('window');

interface Props {
  navigation: any;
}

interface MediaItem {
  id: string;
  title: string;
  url: string;
  mediaType: 'IMAGE' | 'VIDEO';
}

export function HomeScreen({ navigation }: Props) {
  const { user } = useAuth();
  const [heroItems, setHeroItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currentHero, setCurrentHero] = useState(0);

  const loadMedia = useCallback(async () => {
    try {
      const result = await client.models.MediaAsset.list({
        filter: {
          or: [
            { folderType: { eq: 'HOME_IMAGE' } },
            { folderType: { eq: 'HOME_VIDEO' } },
          ],
        },
      });

      const items = await Promise.all(
        (result.data ?? []).map(async (asset) => {
          let url = asset.url ?? '';
          if (!url && asset.storageKey) {
            try {
              const s3Url = await getUrl({ path: asset.storageKey });
              url = s3Url.url.toString();
            } catch {
              url = '';
            }
          }
          return {
            id: asset.id,
            title: asset.title,
            url,
            mediaType: asset.mediaType as 'IMAGE' | 'VIDEO',
          };
        })
      );
      // Shuffle to show random items
      const shuffled = items.sort(() => Math.random() - 0.5);
      setHeroItems(shuffled.slice(0, 10));
    } catch (err) {
      console.warn('Failed to load home media:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadMedia();
  }, [loadMedia]);

  const onRefresh = () => {
    setRefreshing(true);
    loadMedia();
  };

  if (loading) return <LoadingScreen message="Chargement..." />;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
    >
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>
            Bonjour {user ? (user.fullName.split(' ')[0] || 'vous') : 'visiteur'} 👋
          </Text>
          <Text style={styles.subGreeting}>Découvrez nos formations et projets</Text>
        </View>
        {user ? (
          <TouchableOpacity
            style={styles.notifBtn}
            onPress={() => navigation.navigate('Notifications')}
          >
            <Ionicons name="notifications-outline" size={24} color={Colors.text} />
          </TouchableOpacity>
        ) : null}
      </View>

      {/* Hero Carousel */}
      {heroItems.length > 0 ? (
        <View style={styles.heroSection}>
          <FlatList
            data={heroItems}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            keyExtractor={(i) => i.id}
            onMomentumScrollEnd={(e) => {
              const idx = Math.round(e.nativeEvent.contentOffset.x / (width - 40));
              setCurrentHero(idx);
            }}
            renderItem={({ item }) => (
              <View style={styles.heroCard}>
                {item.url ? (
                  <Image
                    source={{ uri: item.url }}
                    style={styles.heroImage}
                    resizeMode="cover"
                  />
                ) : (
                  <View style={styles.heroPlaceholder}>
                    <Ionicons name="image-outline" size={64} color={Colors.gray300} />
                  </View>
                )}
                <View style={styles.heroOverlay}>
                  <Text style={styles.heroTitle}>{item.title}</Text>
                  {item.mediaType === 'VIDEO' ? (
                    <View style={styles.playBadge}>
                      <Ionicons name="play" size={14} color={Colors.white} />
                      <Text style={styles.playText}>Vidéo</Text>
                    </View>
                  ) : null}
                </View>
              </View>
            )}
          />
          {/* Dots */}
          <View style={styles.dots}>
            {heroItems.map((_, idx) => (
              <View
                key={idx}
                style={[styles.dot, idx === currentHero && styles.dotActive]}
              />
            ))}
          </View>
        </View>
      ) : (
        <View style={styles.noMedia}>
          <Ionicons name="water" size={64} color={Colors.primary} />
          <Text style={styles.noMediaText}>Bienvenue sur Fontain</Text>
          <Text style={styles.noMediaSubtext}>
            Votre plateforme de formation et de projets freelance
          </Text>
        </View>
      )}

      {/* Quick Actions */}
      <Text style={styles.sectionTitle}>Explorer</Text>
      <View style={styles.quickActions}>
        <TouchableOpacity
          style={styles.quickCard}
          onPress={() => navigation.navigate('Courses')}
          activeOpacity={0.85}
        >
          <View style={[styles.quickIcon, { backgroundColor: Colors.primaryMuted }]}>
            <Ionicons name="play-circle" size={28} color={Colors.primary} />
          </View>
          <Text style={styles.quickTitle}>Formations</Text>
          <Text style={styles.quickSub}>Vidéos & Playlists</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.quickCard}
          onPress={() => navigation.navigate('Projects')}
          activeOpacity={0.85}
        >
          <View style={[styles.quickIcon, { backgroundColor: Colors.secondaryMuted }]}>
            <Ionicons name="briefcase" size={28} color={Colors.secondary} />
          </View>
          <Text style={styles.quickTitle}>Projets</Text>
          <Text style={styles.quickSub}>Missions disponibles</Text>
        </TouchableOpacity>

        {user ? (
          <TouchableOpacity
            style={styles.quickCard}
            onPress={() => navigation.navigate('Profile')}
            activeOpacity={0.85}
          >
            <View style={[styles.quickIcon, { backgroundColor: Colors.successBg }]}>
              <Ionicons name="person" size={28} color={Colors.success} />
            </View>
            <Text style={styles.quickTitle}>Mon Profil</Text>
            <Text style={styles.quickSub}>Tableau de bord</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.quickCard}
            onPress={() => navigation.navigate('Auth', { screen: 'Login' })}
            activeOpacity={0.85}
          >
            <View style={[styles.quickIcon, { backgroundColor: Colors.warningBg }]}>
              <Ionicons name="log-in" size={28} color={Colors.warning} />
            </View>
            <Text style={styles.quickTitle}>Connexion</Text>
            <Text style={styles.quickSub}>Accéder à mon compte</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Stats Banner */}
      <View style={styles.statsBanner}>
        <View style={styles.statItem}>
          <Ionicons name="people" size={24} color={Colors.white} />
          <Text style={styles.statNumber}>500+</Text>
          <Text style={styles.statLabel}>Freelancers</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Ionicons name="play-circle" size={24} color={Colors.white} />
          <Text style={styles.statNumber}>200+</Text>
          <Text style={styles.statLabel}>Vidéos</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Ionicons name="briefcase" size={24} color={Colors.white} />
          <Text style={styles.statNumber}>150+</Text>
          <Text style={styles.statLabel}>Projets</Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: Spacing[5], gap: Spacing[5], paddingBottom: Spacing[10] },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  greeting: {
    fontSize: FontSize['2xl'],
    fontWeight: FontWeight.bold,
    color: Colors.text,
  },
  subGreeting: {
    fontSize: FontSize.base,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  notifBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadow.sm,
  },
  heroSection: { gap: Spacing[3] },
  heroCard: {
    width: width - 40,
    height: 200,
    borderRadius: BorderRadius['2xl'],
    overflow: 'hidden',
    backgroundColor: Colors.gray100,
  },
  heroImage: { width: '100%', height: '100%' },
  heroPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.gray100,
  },
  heroOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    backgroundColor: 'rgba(0,0,0,0.4)',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  heroTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.white,
    flex: 1,
    marginRight: 8,
  },
  playBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.primary,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: BorderRadius.full,
  },
  playText: {
    fontSize: FontSize.xs,
    color: Colors.white,
    fontWeight: FontWeight.semibold,
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.gray300,
  },
  dotActive: {
    width: 20,
    backgroundColor: Colors.primary,
  },
  noMedia: {
    alignItems: 'center',
    padding: Spacing[8],
    gap: Spacing[3],
    backgroundColor: Colors.primaryMuted,
    borderRadius: BorderRadius['2xl'],
  },
  noMediaText: {
    fontSize: FontSize['2xl'],
    fontWeight: FontWeight.bold,
    color: Colors.primary,
    textAlign: 'center',
  },
  noMediaSubtext: {
    fontSize: FontSize.base,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  sectionTitle: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
    color: Colors.text,
  },
  quickActions: {
    flexDirection: 'row',
    gap: Spacing[3],
  },
  quickCard: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    padding: Spacing[4],
    gap: Spacing[2],
    alignItems: 'center',
    ...Shadow.md,
  },
  quickIcon: {
    width: 56,
    height: 56,
    borderRadius: BorderRadius.xl,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  quickTitle: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
    color: Colors.text,
    textAlign: 'center',
  },
  quickSub: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    textAlign: 'center',
  },
  statsBanner: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius['2xl'],
    padding: Spacing[5],
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  statItem: { alignItems: 'center', gap: 4, flex: 1 },
  statNumber: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.extrabold,
    color: Colors.white,
  },
  statLabel: {
    fontSize: FontSize.xs,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: FontWeight.medium,
  },
  statDivider: {
    width: 1,
    height: 48,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
});
