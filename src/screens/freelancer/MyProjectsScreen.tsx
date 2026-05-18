import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../../../amplify/data/resource';
import { useAuth } from '../../context/AuthContext';
import { StatusBadge, EmptyState, LoadingScreen } from '../../components';
import { Colors, FontSize, FontWeight, Spacing, BorderRadius, Shadow } from '../../theme';

const client = generateClient<Schema>();

interface Props {
  navigation: any;
}

export function MyProjectsScreen({ navigation }: Props) {
  const { user } = useAuth();
  const [assignments, setAssignments] = useState<any[]>([]);
  const [requests, setRequests] = useState<any[]>([]);
  const [tab, setTab] = useState<'assignments' | 'requests'>('assignments');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!user) return;
    try {
      const [assignResult, reqResult] = await Promise.all([
        client.models.ProjectAssignment.list({
          filter: { freelancerId: { eq: user.userId } },
        }),
        client.models.ProjectRequest.list({
          filter: { freelancerId: { eq: user.userId } },
        }),
      ]);
      const sorted = (assignResult.data ?? []).sort(
        (a, b) => new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime()
      );
      setAssignments(sorted);
      setRequests((reqResult.data ?? []).sort(
        (a, b) => new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime()
      ));
    } catch (err) {
      console.warn('MyProjects load error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  useEffect(() => { load(); }, [load]);

  const onRefresh = () => { setRefreshing(true); load(); };

  if (loading) return <LoadingScreen />;

  const data = tab === 'assignments' ? assignments : requests;

  return (
    <View style={styles.container}>
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, tab === 'assignments' && styles.tabActive]}
          onPress={() => setTab('assignments')}
        >
          <Text style={[styles.tabText, tab === 'assignments' && styles.tabTextActive]}>
            Assignments ({assignments.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, tab === 'requests' && styles.tabActive]}
          onPress={() => setTab('requests')}
        >
          <Text style={[styles.tabText, tab === 'requests' && styles.tabTextActive]}>
            Demandes ({requests.length})
          </Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={data}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
        ListEmptyComponent={
          <EmptyState
            title={tab === 'assignments' ? 'Aucun projet assigné' : 'Aucune demande'}
            message={
              tab === 'assignments'
                ? 'Vous n\'avez aucun projet assigné pour le moment.'
                : 'Vous n\'avez soumis aucune demande de projet.'
            }
            icon="briefcase-outline"
            actionLabel="Voir les projets"
            onAction={() => navigation.navigate('ProjectsTab')}
          />
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            onPress={() => navigation.navigate('ProjectDetail', { projectId: item.projectId, name: 'Projet' })}
            activeOpacity={0.85}
          >
            <View style={styles.cardHeader}>
              <View style={styles.cardIconWrap}>
                <Ionicons name="briefcase" size={20} color={Colors.primary} />
              </View>
              <View style={styles.cardInfo}>
                <Text style={styles.cardTitle}>Projet #{item.projectId?.slice(-6)}</Text>
                <Text style={styles.cardDate}>
                  {new Date(item.createdAt ?? '').toLocaleDateString('fr-FR')}
                </Text>
              </View>
              <StatusBadge status={item.status} size="sm" />
            </View>
            {tab === 'assignments' && item.gradePercentage != null ? (
              <View style={styles.gradeRow}>
                <Ionicons name="trophy-outline" size={14} color={Colors.accent} />
                <Text style={styles.gradeText}>Note: {item.gradePercentage}%</Text>
              </View>
            ) : null}
            {tab === 'assignments' && item.adminFeedback ? (
              <Text style={styles.feedback} numberOfLines={2}>{item.adminFeedback}</Text>
            ) : null}
            <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} style={styles.chevron} />
          </TouchableOpacity>
        )}
        ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  tabs: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  tab: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: { borderBottomColor: Colors.primary },
  tabText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
    color: Colors.textMuted,
  },
  tabTextActive: {
    color: Colors.primary,
    fontWeight: FontWeight.bold,
  },
  list: { padding: Spacing[4], paddingBottom: Spacing[10] },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    padding: Spacing[4],
    gap: Spacing[2],
    ...Shadow.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[3],
  },
  cardIconWrap: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardInfo: { flex: 1 },
  cardTitle: {
    fontSize: FontSize.base,
    fontWeight: FontWeight.semibold,
    color: Colors.text,
  },
  cardDate: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
  },
  gradeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  gradeText: {
    fontSize: FontSize.sm,
    color: Colors.accent,
    fontWeight: FontWeight.semibold,
  },
  feedback: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    fontStyle: 'italic',
  },
  chevron: { alignSelf: 'flex-end' },
});
