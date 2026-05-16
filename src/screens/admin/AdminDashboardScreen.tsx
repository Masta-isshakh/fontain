import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../../../amplify/data/resource';
import { Colors, FontSize, FontWeight, Spacing, BorderRadius, Shadow } from '../../theme';
import { LoadingScreen } from '../../components';

const client = generateClient<Schema>();

interface Props {
  navigation: any;
}

const ADMIN_MENU = [
  { id: 'users', icon: 'people', label: 'Utilisateurs', color: Colors.primary, screen: 'AdminUsers' },
  { id: 'courses', icon: 'play-circle', label: 'Formations', color: Colors.secondary, screen: 'AdminCourses' },
  { id: 'projects', icon: 'briefcase', label: 'Projets', color: Colors.accent, screen: 'AdminProjects' },
  { id: 'assignments', icon: 'git-branch', label: 'Assignments', color: Colors.success, screen: 'AdminAssignments' },
  { id: 'exams', icon: 'school', label: 'Examens', color: '#E11D48', screen: 'AdminExams' },
  { id: 'media', icon: 'images', label: 'Médias', color: '#7C3AED', screen: 'AdminMedia' },
  { id: 'loyalty', icon: 'trophy', label: 'Fidélité', color: Colors.gold, screen: 'AdminLoyalty' },
  { id: 'chat', icon: 'chatbubbles', label: 'Messagerie', color: '#0891B2', screen: 'AdminChat' },
  { id: 'performance', icon: 'bar-chart', label: 'Performances', color: Colors.success, screen: 'AdminPerformance' },
  { id: 'audit', icon: 'list', label: 'Audit Log', color: Colors.gray600, screen: 'AdminAuditLog' },
] as const;

export function AdminDashboardScreen({ navigation }: Props) {
  const [stats, setStats] = useState({
    users: 0,
    projects: 0,
    pendingRequests: 0,
    pendingExams: 0,
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const [users, projects, requests, exams] = await Promise.all([
        client.models.UserProfile.list(),
        client.models.Project.list({ filter: { status: { eq: 'PUBLISHED' } } }),
        client.models.ProjectRequest.list({ filter: { status: { eq: 'PENDING' } } }),
        client.models.ExamAttempt.list({ filter: { status: { eq: 'REQUESTED' } } }),
      ]);
      setStats({
        users: users.data?.length ?? 0,
        projects: projects.data?.length ?? 0,
        pendingRequests: requests.data?.length ?? 0,
        pendingExams: exams.data?.length ?? 0,
      });
    } catch (err) {
      console.warn('Admin dashboard load error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const onRefresh = () => { setRefreshing(true); load(); };

  if (loading) return <LoadingScreen />;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Tableau de bord</Text>
        <Text style={styles.subtitle}>Administration Fontain</Text>
      </View>

      {/* Alert Stats */}
      {(stats.pendingRequests > 0 || stats.pendingExams > 0) ? (
        <View style={styles.alertsSection}>
          <Text style={styles.sectionTitle}>Éléments en attente</Text>
          <View style={styles.alertsRow}>
            {stats.pendingRequests > 0 ? (
              <TouchableOpacity
                style={[styles.alertCard, { borderColor: Colors.warning }]}
                onPress={() => navigation.navigate('AdminAssignments')}
              >
                <Ionicons name="time" size={24} color={Colors.warning} />
                <Text style={styles.alertNumber}>{stats.pendingRequests}</Text>
                <Text style={styles.alertLabel}>Demandes projet</Text>
              </TouchableOpacity>
            ) : null}
            {stats.pendingExams > 0 ? (
              <TouchableOpacity
                style={[styles.alertCard, { borderColor: Colors.danger }]}
                onPress={() => navigation.navigate('AdminExams')}
              >
                <Ionicons name="school" size={24} color={Colors.danger} />
                <Text style={styles.alertNumber}>{stats.pendingExams}</Text>
                <Text style={styles.alertLabel}>Demandes examen</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        </View>
      ) : null}

      {/* Overview stats */}
      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <Ionicons name="people" size={28} color={Colors.primary} />
          <Text style={styles.statNumber}>{stats.users}</Text>
          <Text style={styles.statLabel}>Utilisateurs</Text>
        </View>
        <View style={styles.statCard}>
          <Ionicons name="briefcase" size={28} color={Colors.accent} />
          <Text style={styles.statNumber}>{stats.projects}</Text>
          <Text style={styles.statLabel}>Projets publiés</Text>
        </View>
      </View>

      {/* Navigation Menu */}
      <Text style={styles.sectionTitle}>Gestion</Text>
      <View style={styles.menuGrid}>
        {ADMIN_MENU.map((item) => (
          <TouchableOpacity
            key={item.id}
            style={styles.menuCard}
            onPress={() => navigation.navigate(item.screen)}
            activeOpacity={0.85}
          >
            <View style={[styles.menuIcon, { backgroundColor: item.color + '20' }]}>
              <Ionicons name={item.icon as any} size={24} color={item.color} />
            </View>
            <Text style={styles.menuLabel}>{item.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: Spacing[4], gap: Spacing[5], paddingBottom: Spacing[10] },
  header: { gap: 4 },
  title: {
    fontSize: FontSize['3xl'],
    fontWeight: FontWeight.extrabold,
    color: Colors.text,
  },
  subtitle: {
    fontSize: FontSize.base,
    color: Colors.textSecondary,
  },
  alertsSection: { gap: Spacing[3] },
  sectionTitle: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
    color: Colors.text,
  },
  alertsRow: { flexDirection: 'row', gap: Spacing[3] },
  alertCard: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    padding: Spacing[4],
    alignItems: 'center',
    gap: 6,
    borderWidth: 2,
    ...Shadow.sm,
  },
  alertNumber: {
    fontSize: FontSize['3xl'],
    fontWeight: FontWeight.extrabold,
    color: Colors.text,
  },
  alertLabel: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    textAlign: 'center',
    fontWeight: FontWeight.medium,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: Spacing[3],
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    padding: Spacing[4],
    alignItems: 'center',
    gap: 8,
    ...Shadow.sm,
  },
  statNumber: {
    fontSize: FontSize['2xl'],
    fontWeight: FontWeight.extrabold,
    color: Colors.text,
  },
  statLabel: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    fontWeight: FontWeight.medium,
  },
  menuGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing[3],
  },
  menuCard: {
    width: '47%',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    padding: Spacing[4],
    gap: Spacing[3],
    alignItems: 'center',
    ...Shadow.sm,
  },
  menuIcon: {
    width: 52,
    height: 52,
    borderRadius: BorderRadius.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuLabel: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    color: Colors.text,
    textAlign: 'center',
  },
});
