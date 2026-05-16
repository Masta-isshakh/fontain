import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../../../amplify/data/resource';
import { useAuth } from '../../context/AuthContext';
import { LoadingScreen, EmptyState } from '../../components';
import { Colors, FontSize, FontWeight, Spacing, BorderRadius, Shadow } from '../../theme';

const client = generateClient<Schema>();

interface Props { navigation: any }

export function PerformanceScreen({ navigation }: Props) {
  const { user } = useAuth();
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!user) return;
    try {
      const result = await client.models.PerformanceRecord.list({
        filter: { userId: { eq: user.userId } },
      });
      setRecords(
        (result.data ?? []).sort((a, b) => new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime())
      );
    } catch {}
    finally { setLoading(false); setRefreshing(false); }
  }, [user]);

  useEffect(() => { load(); }, [load]);
  const onRefresh = () => { setRefreshing(true); load(); };

  if (loading) return <LoadingScreen />;

  const latest = records[0];
  const totalProjects = records.reduce((sum, r) => sum + (r.completedProjects ?? 0), 0);
  const totalExams = records.reduce((sum, r) => sum + (r.passedExams ?? 0), 0);
  const avgGrade = records.length > 0
    ? records.reduce((sum, r) => sum + (r.averageGrade ?? 0), 0) / records.length
    : null;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
    >
      <Text style={styles.title}>Mes performances</Text>

      {/* Summary cards */}
      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <Ionicons name="briefcase-outline" size={28} color={Colors.accent} />
          <Text style={styles.statNumber}>{totalProjects}</Text>
          <Text style={styles.statLabel}>Projets complétés</Text>
        </View>
        <View style={styles.statCard}>
          <Ionicons name="school-outline" size={28} color={Colors.secondary} />
          <Text style={styles.statNumber}>{totalExams}</Text>
          <Text style={styles.statLabel}>Examens réussis</Text>
        </View>
        <View style={styles.statCard}>
          <Ionicons name="star-outline" size={28} color={Colors.success} />
          <Text style={[styles.statNumber, { color: Colors.success }]}>
            {avgGrade != null ? `${Math.round(avgGrade)}%` : '—'}
          </Text>
          <Text style={styles.statLabel}>Note moyenne</Text>
        </View>
        <View style={styles.statCard}>
          <Ionicons name="trophy-outline" size={28} color={Colors.gold} />
          <Text style={[styles.statNumber, { color: Colors.gold }]}>
            {latest?.loyaltyPoints ?? 0}
          </Text>
          <Text style={styles.statLabel}>Points fidélité</Text>
        </View>
      </View>

      {/* History */}
      <Text style={styles.sectionTitle}>Historique par période</Text>
      {records.length === 0 ? (
        <EmptyState
          title="Aucune donnée de performance"
          message="Vos performances apparaîtront ici après avoir complété des projets ou réussi des examens."
          icon="bar-chart-outline"
        />
      ) : (
        records.map((record) => (
          <View key={record.id} style={styles.recordCard}>
            <View style={styles.recordHeader}>
              <View style={styles.periodBadge}>
                <Ionicons name="calendar-outline" size={14} color={Colors.primary} />
                <Text style={styles.periodText}>{new Date(record.createdAt ?? '').toLocaleDateString('fr-FR')}</Text>
              </View>
              <Text style={styles.recordDate}>
                {new Date(record.createdAt ?? '').toLocaleDateString('fr-FR')}
              </Text>
            </View>
            <View style={styles.recordStats}>
              <View style={styles.recordStat}>
                <Text style={styles.recordStatNum}>{record.completedProjects ?? 0}</Text>
                <Text style={styles.recordStatLabel}>Projets</Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.recordStat}>
                <Text style={styles.recordStatNum}>{record.passedExams ?? 0}</Text>
                <Text style={styles.recordStatLabel}>Examens</Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.recordStat}>
                <Text style={[styles.recordStatNum, { color: Colors.success }]}>
                  {record.averageGrade != null ? `${Math.round(record.averageGrade)}%` : '—'}
                </Text>
                <Text style={styles.recordStatLabel}>Moyenne</Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.recordStat}>
                <Text style={[styles.recordStatNum, { color: Colors.gold }]}>
                  {record.loyaltyPoints ?? 0}
                </Text>
                <Text style={styles.recordStatLabel}>Points</Text>
              </View>
            </View>

          </View>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: Spacing[4], gap: Spacing[5], paddingBottom: Spacing[10] },
  title: { fontSize: FontSize['2xl'], fontWeight: FontWeight.extrabold, color: Colors.text },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing[3] },
  statCard: {
    width: '47%',
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
    textAlign: 'center',
  },
  sectionTitle: { fontSize: FontSize.xl, fontWeight: FontWeight.bold, color: Colors.text },
  recordCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    padding: Spacing[4],
    gap: Spacing[3],
    ...Shadow.sm,
  },
  recordHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  periodBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.primaryMuted,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  periodText: { fontSize: FontSize.xs, fontWeight: FontWeight.semibold, color: Colors.primary },
  recordDate: { fontSize: FontSize.xs, color: Colors.textMuted },
  recordStats: {
    flexDirection: 'row',
    backgroundColor: Colors.gray50,
    borderRadius: BorderRadius.lg,
    padding: Spacing[3],
    alignItems: 'center',
  },
  recordStat: { flex: 1, alignItems: 'center', gap: 2 },
  recordStatNum: { fontSize: FontSize.xl, fontWeight: FontWeight.extrabold, color: Colors.text },
  recordStatLabel: { fontSize: 10, color: Colors.textMuted, fontWeight: FontWeight.medium },
  divider: { width: 1, height: 32, backgroundColor: Colors.border },
  noteBox: {
    flexDirection: 'row',
    gap: 8,
    backgroundColor: Colors.primaryMuted,
    borderRadius: BorderRadius.lg,
    padding: Spacing[3],
    alignItems: 'flex-start',
  },
  noteText: { flex: 1, fontSize: FontSize.sm, color: Colors.primary, lineHeight: 20 },
});
