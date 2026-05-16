import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../../../amplify/data/resource';
import { StatusBadge, LoadingScreen, EmptyState, AppButton } from '../../components';
import { Colors, FontSize, FontWeight, Spacing, BorderRadius, Shadow } from '../../theme';
import { useLoading } from '../../context/LoadingContext';

const client = generateClient<Schema>();

interface Props {
  navigation: any;
}  

export function AdminAssignmentsScreen({ navigation }: Props) {
  const { withLoading } = useLoading();
  const [requests, setRequests] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [tab, setTab] = useState<'requests' | 'assignments'>('requests');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const [reqResult, assignResult] = await Promise.all([
        client.models.ProjectRequest.list(),
        client.models.ProjectAssignment.list(),
      ]);
      setRequests(
        (reqResult.data ?? []).sort((a, b) => new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime())
      );
      setAssignments(
        (assignResult.data ?? []).sort((a, b) => new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime())
      );
    } catch {}
    finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const onRefresh = () => { setRefreshing(true); load(); };

  const handleApproveRequest = async (req: any) => {
    await withLoading(async () => {
      // Create assignment
      await client.models.ProjectAssignment.create({
        projectId: req.projectId,
        freelancerId: req.freelancerId,
        assignedBy: 'ADMIN',
        status: 'PENDING',
        assignedAt: new Date().toISOString(),
      });
      // Update request
      await client.models.ProjectRequest.update({
        id: req.id,
        status: 'APPROVED',
        reviewedAt: new Date().toISOString(),
      });
      await load();
    }, 'Approbation...');
  };

  const handleRejectRequest = async (req: any) => {
    await withLoading(async () => {
      await client.models.ProjectRequest.update({
        id: req.id,
        status: 'REJECTED',
        reviewedAt: new Date().toISOString(),
      });
      await load();
    }, 'Rejet...');
  };

  const handleReviewAssignment = (assignment: any) => {
    navigation.navigate('AdminReviewAssignment', { assignment });
  };

  if (loading) return <LoadingScreen />;

  const data = tab === 'requests' ? requests : assignments;

  return (
    <View style={styles.container}>
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, tab === 'requests' && styles.tabActive]}
          onPress={() => setTab('requests')}
        >
          <Text style={[styles.tabText, tab === 'requests' && styles.tabTextActive]}>
            Demandes ({requests.filter((r) => r.status === 'PENDING').length} en attente)
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, tab === 'assignments' && styles.tabActive]}
          onPress={() => setTab('assignments')}
        >
          <Text style={[styles.tabText, tab === 'assignments' && styles.tabTextActive]}>
            Assignments ({assignments.length})
          </Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={data}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
        ListEmptyComponent={<EmptyState title="Aucun élément" icon="git-branch-outline" />}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.iconWrap}>
                <Ionicons name="person" size={18} color={Colors.primary} />
              </View>
              <View style={styles.cardInfo}>
                <Text style={styles.cardTitle}>
                  {tab === 'requests' ? item.freelancerName : `Freelancer #${item.freelancerId?.slice(-6)}`}
                </Text>
                <Text style={styles.cardDate}>
                  Projet #{item.projectId?.slice(-6)} •{' '}
                  {new Date(item.createdAt ?? '').toLocaleDateString('fr-FR')}
                </Text>
              </View>
              <StatusBadge status={item.status} size="sm" />
            </View>

            {tab === 'requests' && item.status === 'PENDING' ? (
              <View style={styles.actions}>
                <AppButton
                  title="Approuver"
                  onPress={() => handleApproveRequest(item)}
                  variant="primary"
                  size="sm"
                  style={styles.actionBtn}
                />
                <AppButton
                  title="Rejeter"
                  onPress={() => handleRejectRequest(item)}
                  variant="danger"
                  size="sm"
                  style={styles.actionBtn}
                />
              </View>
            ) : null}

            {tab === 'assignments' && (item.status === 'COMPLETED' || item.status === 'UNDER_VERIFICATION') ? (
              <AppButton
                title="Réviser et noter"
                onPress={() => handleReviewAssignment(item)}
                variant="secondary"
                size="sm"
                fullWidth
              />
            ) : null}
          </View>
        )}
        ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
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
    paddingHorizontal: 8,
  },
  tabActive: { borderBottomColor: Colors.primary },
  tabText: { fontSize: FontSize.xs, fontWeight: FontWeight.medium, color: Colors.textMuted, textAlign: 'center' },
  tabTextActive: { color: Colors.primary, fontWeight: FontWeight.bold },
  list: { padding: Spacing[4], paddingBottom: Spacing[10] },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    padding: Spacing[4],
    gap: Spacing[3],
    ...Shadow.sm,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing[3] },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardInfo: { flex: 1 },
  cardTitle: { fontSize: FontSize.base, fontWeight: FontWeight.semibold, color: Colors.text },
  cardDate: { fontSize: FontSize.xs, color: Colors.textMuted },
  actions: { flexDirection: 'row', gap: Spacing[3] },
  actionBtn: { flex: 1 },
});
