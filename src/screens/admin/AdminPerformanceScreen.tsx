import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../../../amplify/data/resource';
import { LoadingScreen, EmptyState } from '../../components';
import { Colors, FontSize, FontWeight, Spacing, BorderRadius, Shadow } from '../../theme';

const client = generateClient<Schema>();

interface Props { navigation: any }

export function AdminPerformanceScreen({ navigation }: Props) {
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const result = await client.models.PerformanceRecord.list();
      setRecords(
        (result.data ?? []).sort((a, b) => new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime())
      );
    } catch {}
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { load(); }, [load]);
  const onRefresh = () => { setRefreshing(true); load(); };

  if (loading) return <LoadingScreen />;

  return (
    <FlatList
      data={records}
      keyExtractor={(item) => item.id}
      style={{ backgroundColor: Colors.background }}
      contentContainerStyle={styles.list}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
      ListHeaderComponent={
        <View style={styles.header}>
          <Text style={styles.title}>Performances</Text>
          <Text style={styles.subtitle}>{records.length} enregistrement{records.length !== 1 ? 's' : ''}</Text>
        </View>
      }
      ListEmptyComponent={<EmptyState title="Aucune performance" icon="bar-chart-outline" />}
      renderItem={({ item }) => (
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.iconWrap}>
              <Ionicons name="person" size={16} color={Colors.primary} />
            </View>
            <View style={styles.info}>
              <Text style={styles.userId}>Freelancer #{item.userId?.slice(-6)}</Text>
              <Text style={styles.date}>
                {new Date(item.createdAt ?? '').toLocaleDateString('fr-FR')}
              </Text>
            </View>
          </View>
          <View style={styles.statsGrid}>
            <View style={styles.stat}>
              <Text style={styles.statNumber}>{item.completedProjects ?? 0}</Text>
              <Text style={styles.statLabel}>Projets</Text>
            </View>
            <View style={styles.stat}>
              <Text style={styles.statNumber}>{item.passedExams ?? 0}</Text>
              <Text style={styles.statLabel}>Examens</Text>
            </View>
            <View style={styles.stat}>
              <Text style={[styles.statNumber, { color: Colors.success }]}>
                {item.averageGrade != null ? `${Math.round(item.averageGrade)}%` : '—'}
              </Text>
              <Text style={styles.statLabel}>Moy.</Text>
            </View>
            <View style={styles.stat}>
              <Text style={[styles.statNumber, { color: Colors.gold }]}>
                {item.loyaltyPoints ?? 0}
              </Text>
              <Text style={styles.statLabel}>Points</Text>
            </View>
          </View>

        </View>
      )}
      ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
    />
  );
}

const styles = StyleSheet.create({
  list: { padding: Spacing[4], paddingBottom: Spacing[10] },
  header: { marginBottom: Spacing[4] },
  title: { fontSize: FontSize['2xl'], fontWeight: FontWeight.bold, color: Colors.text },
  subtitle: { fontSize: FontSize.sm, color: Colors.textMuted },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    padding: Spacing[4],
    gap: Spacing[3],
    ...Shadow.sm,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing[3] },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: { flex: 1 },
  userId: { fontSize: FontSize.base, fontWeight: FontWeight.semibold, color: Colors.text },
  date: { fontSize: FontSize.xs, color: Colors.textMuted },
  statsGrid: {
    flexDirection: 'row',
    backgroundColor: Colors.gray50,
    borderRadius: BorderRadius.lg,
    padding: Spacing[3],
  },
  stat: { flex: 1, alignItems: 'center', gap: 2 },
  statNumber: { fontSize: FontSize.xl, fontWeight: FontWeight.extrabold, color: Colors.text },
  statLabel: { fontSize: 10, color: Colors.textMuted, fontWeight: FontWeight.medium },
  notes: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    fontStyle: 'italic',
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: Spacing[2],
  },
});
