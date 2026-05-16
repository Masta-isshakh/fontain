import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../../../amplify/data/resource';
import { useAuth } from '../../context/AuthContext';
import { AppButton, StatusBadge, LoadingScreen } from '../../components';
import { Colors, FontSize, FontWeight, Spacing, BorderRadius, Shadow } from '../../theme';

const client = generateClient<Schema>();

interface Props {
  navigation: any;
}

const LEVEL_COLORS: Record<string, string> = {
  BRONZE: Colors.bronze,
  SILVER: Colors.silver,
  GOLD: Colors.gold,
  PLATINUM: '#888',
  ELITE: Colors.elite,
};

const LEVEL_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  BRONZE: 'medal-outline',
  SILVER: 'medal-outline',
  GOLD: 'trophy',
  PLATINUM: 'star',
  ELITE: 'diamond',
};

export function ProfileScreen({ navigation }: Props) {
  const { user, logout, isAdmin, isFreelancer } = useAuth();
  const [performance, setPerformance] = useState<any>(null);
  const [recentAssignments, setRecentAssignments] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [perfResult, assignResult] = await Promise.all([
        client.models.PerformanceRecord.list({
          filter: { userId: { eq: user.userId } },
        }),
        client.models.ProjectAssignment.list({
          filter: { freelancerId: { eq: user.userId } },
        }),
      ]);
      setPerformance(perfResult.data?.[0] ?? null);
      const sorted = (assignResult.data ?? []).sort(
        (a, b) => new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime()
      );
      setRecentAssignments(sorted.slice(0, 5));
    } catch (err) {
      console.warn('Profile load error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  useEffect(() => { load(); }, [load]);

  const onRefresh = () => { setRefreshing(true); load(); };

  const handleLogout = () => {
    Alert.alert('Déconnexion', 'Êtes-vous sûr de vouloir vous déconnecter?', [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Déconnexion', style: 'destructive', onPress: logout },
    ]);
  };

  if (!user) {
    return (
      <View style={styles.guestContainer}>
        <View style={styles.guestIcon}>
          <Ionicons name="person-circle-outline" size={80} color={Colors.gray300} />
        </View>
        <Text style={styles.guestTitle}>Bienvenue sur Fontain</Text>
        <Text style={styles.guestSubtitle}>
          Connectez-vous pour accéder à votre espace freelance et suivre vos projets.
        </Text>
        <View style={styles.guestActions}>
          <AppButton
            title="Se connecter"
            onPress={() => navigation.navigate('Auth', { screen: 'Login' })}
            fullWidth
            size="lg"
          />
          <AppButton
            title="Créer un compte"
            onPress={() => navigation.navigate('Auth', { screen: 'Register' })}
            variant="outline"
            fullWidth
            size="lg"
          />
        </View>
      </View>
    );
  }

  if (isAdmin) {
    return (
      <View style={styles.adminRedirect}>
        <Ionicons name="settings" size={64} color={Colors.primary} />
        <Text style={styles.adminTitle}>Espace Administrateur</Text>
        <Text style={styles.adminSubtitle}>
          Accédez au tableau de bord pour gérer la plateforme.
        </Text>
        <AppButton
          title="Ouvrir le tableau de bord"
          onPress={() => navigation.navigate('Admin')}
          size="lg"
          fullWidth
        />
        <AppButton
          title="Se déconnecter"
          onPress={handleLogout}
          variant="outline"
          size="lg"
          fullWidth
        />
      </View>
    );
  }

  if (loading) return <LoadingScreen />;

  const level = performance?.loyaltyLevel ?? 'BRONZE';
  const points = performance?.loyaltyPoints ?? 0;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
    >
      {/* Profile Header */}
      <View style={styles.profileCard}>
        <View style={styles.avatarContainer}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{(user.fullName[0] ?? '?').toUpperCase()}</Text>
          </View>
          <View style={[styles.levelBadge, { backgroundColor: LEVEL_COLORS[level] }]}>
            <Ionicons name={LEVEL_ICONS[level]} size={12} color={Colors.white} />
          </View>
        </View>
        <View style={styles.profileInfo}>
          <Text style={styles.profileName}>{user.fullName}</Text>
          <Text style={styles.profileEmail}>{user.email}</Text>
          <View style={styles.profileLevel}>
            <Text style={[styles.levelText, { color: LEVEL_COLORS[level] }]}>
              {level} • {points} pts
            </Text>
          </View>
        </View>
      </View>

      {/* Stats Row */}
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{performance?.completedProjects ?? 0}</Text>
          <Text style={styles.statLabel}>Projets terminés</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{performance?.passedExams ?? 0}</Text>
          <Text style={styles.statLabel}>Examens réussis</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{Math.round(performance?.averageGrade ?? 0)}%</Text>
          <Text style={styles.statLabel}>Moyenne</Text>
        </View>
      </View>

      {/* Menu */}
      <View style={styles.menuCard}>
        {[
          { icon: 'briefcase-outline' as const, label: 'Mes projets', screen: 'MyProjects' },
          { icon: 'school-outline' as const, label: 'Mes examens', screen: 'MyExams' },
          { icon: 'trophy-outline' as const, label: 'Programme de fidélité', screen: 'Loyalty' },
          { icon: 'chatbubbles-outline' as const, label: 'Messagerie', screen: 'Chat' },
          { icon: 'bar-chart-outline' as const, label: 'Mes performances', screen: 'Performance' },
        ].map((item, idx, arr) => (
          <TouchableOpacity
            key={item.screen}
            style={[styles.menuItem, idx < arr.length - 1 && styles.menuItemBorder]}
            onPress={() => navigation.navigate(item.screen)}
            activeOpacity={0.7}
          >
            <View style={styles.menuIcon}>
              <Ionicons name={item.icon} size={20} color={Colors.primary} />
            </View>
            <Text style={styles.menuLabel}>{item.label}</Text>
            <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
          </TouchableOpacity>
        ))}
      </View>

      {/* Recent Activity */}
      {recentAssignments.length > 0 ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Activité récente</Text>
          {recentAssignments.map((a) => (
            <TouchableOpacity
              key={a.id}
              style={styles.activityItem}
              onPress={() => navigation.navigate('ProjectDetail', { projectId: a.projectId, name: 'Projet' })}
            >
              <Ionicons name="briefcase-outline" size={16} color={Colors.primary} />
              <View style={styles.activityInfo}>
                <Text style={styles.activityTitle}>Projet assigné</Text>
                <Text style={styles.activityDate}>
                  {new Date(a.createdAt ?? '').toLocaleDateString('fr-FR')}
                </Text>
              </View>
              <StatusBadge status={a.status} size="sm" />
            </TouchableOpacity>
          ))}
        </View>
      ) : null}

      {/* Logout */}
      <AppButton
        title="Se déconnecter"
        onPress={handleLogout}
        variant="outline"
        fullWidth
        size="lg"
        icon={<Ionicons name="log-out-outline" size={18} color={Colors.primary} />}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: Spacing[4], gap: Spacing[4], paddingBottom: Spacing[10] },

  // Guest
  guestContainer: {
    flex: 1,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing[6],
    gap: Spacing[4],
  },
  guestIcon: {},
  guestTitle: {
    fontSize: FontSize['2xl'],
    fontWeight: FontWeight.bold,
    color: Colors.text,
    textAlign: 'center',
  },
  guestSubtitle: {
    fontSize: FontSize.base,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  guestActions: { width: '100%', gap: Spacing[3] },

  // Admin
  adminRedirect: {
    flex: 1,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing[6],
    gap: Spacing[4],
  },
  adminTitle: {
    fontSize: FontSize['2xl'],
    fontWeight: FontWeight.bold,
    color: Colors.text,
    textAlign: 'center',
  },
  adminSubtitle: {
    fontSize: FontSize.base,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },

  profileCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius['2xl'],
    padding: Spacing[5],
    flexDirection: 'row',
    gap: Spacing[4],
    alignItems: 'center',
    ...Shadow.md,
  },
  avatarContainer: { position: 'relative' },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: FontSize['2xl'],
    fontWeight: FontWeight.bold,
    color: Colors.white,
  },
  levelBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.white,
  },
  profileInfo: { flex: 1, gap: 4 },
  profileName: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
    color: Colors.text,
  },
  profileEmail: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
  },
  profileLevel: {},
  levelText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
  },
  statsRow: {
    flexDirection: 'row',
    gap: Spacing[3],
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    padding: Spacing[4],
    alignItems: 'center',
    gap: 4,
    ...Shadow.sm,
  },
  statNumber: {
    fontSize: FontSize['2xl'],
    fontWeight: FontWeight.extrabold,
    color: Colors.primary,
  },
  statLabel: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    textAlign: 'center',
    fontWeight: FontWeight.medium,
  },
  menuCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
    ...Shadow.sm,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[3],
    padding: Spacing[4],
  },
  menuItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  menuIcon: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuLabel: {
    flex: 1,
    fontSize: FontSize.base,
    fontWeight: FontWeight.medium,
    color: Colors.text,
  },
  section: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    padding: Spacing[4],
    gap: Spacing[3],
    ...Shadow.sm,
  },
  sectionTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.text,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[3],
    paddingVertical: Spacing[2],
  },
  activityInfo: { flex: 1 },
  activityTitle: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
    color: Colors.text,
  },
  activityDate: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
  },
});
