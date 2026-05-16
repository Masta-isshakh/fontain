import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  FlatList,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../../../amplify/data/resource';
import { useAuth } from '../../context/AuthContext';
import { LoadingScreen, StatusBadge } from '../../components';
import { Colors, FontSize, FontWeight, Spacing, BorderRadius, Shadow } from '../../theme';

const client = generateClient<Schema>();

interface Props {
  navigation: any;
}

const LEVELS = ['BRONZE', 'SILVER', 'GOLD', 'PLATINUM', 'ELITE'];
const LEVEL_THRESHOLDS = [0, 200, 500, 1000, 2000];
const LEVEL_COLORS: Record<string, string> = {
  BRONZE: Colors.bronze,
  SILVER: Colors.silver,
  GOLD: Colors.gold,
  PLATINUM: '#888',
  ELITE: Colors.elite,
};

export function LoyaltyScreen({ navigation }: Props) {
  const { user } = useAuth();
  const [performance, setPerformance] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!user) return;
    try {
      const [perfResult, txResult] = await Promise.all([
        client.models.PerformanceRecord.list({
          filter: { userId: { eq: user.userId } },
        }),
        client.models.LoyaltyTransaction.list({
          filter: { userId: { eq: user.userId } },
        }),
      ]);
      setPerformance(perfResult.data?.[0] ?? null);
      const sorted = (txResult.data ?? []).sort(
        (a, b) => new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime()
      );
      setTransactions(sorted);
    } catch {}
    finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  useEffect(() => { load(); }, [load]);

  const onRefresh = () => { setRefreshing(true); load(); };

  if (loading) return <LoadingScreen />;

  const currentLevel = performance?.loyaltyLevel ?? 'BRONZE';
  const currentPoints = performance?.loyaltyPoints ?? 0;
  const currentIdx = LEVELS.indexOf(currentLevel);
  const nextLevel = LEVELS[currentIdx + 1];
  const nextThreshold = LEVEL_THRESHOLDS[currentIdx + 1] ?? null;
  const currentThreshold = LEVEL_THRESHOLDS[currentIdx] ?? 0;
  const progressToNext = nextThreshold
    ? ((currentPoints - currentThreshold) / (nextThreshold - currentThreshold)) * 100
    : 100;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
    >
      {/* Level Card */}
      <View style={[styles.levelCard, { backgroundColor: LEVEL_COLORS[currentLevel] + 'DD' }]}>
        <View style={styles.levelIconWrap}>
          <Ionicons name="trophy" size={48} color={Colors.white} />
        </View>
        <Text style={styles.levelName}>{currentLevel}</Text>
        <Text style={styles.levelPoints}>{currentPoints.toLocaleString('fr-FR')} points</Text>
        {nextLevel ? (
          <View style={styles.progressSection}>
            <View style={styles.progressRow}>
              <Text style={styles.progressLabel}>Prochain niveau: {nextLevel}</Text>
              <Text style={styles.progressLabel}>{nextThreshold} pts</Text>
            </View>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${Math.min(progressToNext, 100)}%` }]} />
            </View>
            <Text style={styles.progressHint}>
              Encore {Math.max(0, (nextThreshold ?? 0) - currentPoints)} points pour atteindre {nextLevel}
            </Text>
          </View>
        ) : (
          <Text style={styles.eliteText}>🏆 Vous avez atteint le niveau maximum !</Text>
        )}
      </View>

      {/* Levels Overview */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Niveaux & Points</Text>
        <View style={styles.levelsGrid}>
          {LEVELS.map((level, idx) => (
            <View
              key={level}
              style={[
                styles.levelItem,
                currentLevel === level && styles.levelItemActive,
                { borderColor: LEVEL_COLORS[level] },
              ]}
            >
              <View style={[styles.levelDot, { backgroundColor: LEVEL_COLORS[level] }]} />
              <Text style={styles.levelItemName}>{level}</Text>
              <Text style={styles.levelItemPoints}>{LEVEL_THRESHOLDS[idx]}+</Text>
            </View>
          ))}
        </View>
      </View>

      {/* How to earn points */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Comment gagner des points</Text>
        {[
          { icon: 'school', label: 'Réussir un examen', points: '+50 pts', color: Colors.success },
          { icon: 'briefcase', label: 'Terminer un projet', points: '+20 pts', color: Colors.primary },
          { icon: 'trophy', label: 'Bonus sur la note', points: '+note%', color: Colors.accent },
        ].map((item) => (
          <View key={item.label} style={styles.earnItem}>
            <View style={[styles.earnIcon, { backgroundColor: item.color + '20' }]}>
              <Ionicons name={item.icon as any} size={20} color={item.color} />
            </View>
            <Text style={styles.earnLabel}>{item.label}</Text>
            <View style={[styles.earnBadge, { backgroundColor: item.color + '20' }]}>
              <Text style={[styles.earnPoints, { color: item.color }]}>{item.points}</Text>
            </View>
          </View>
        ))}
      </View>

      {/* Transaction History */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Historique ({transactions.length})</Text>
        {transactions.length === 0 ? (
          <Text style={styles.emptyText}>Aucune transaction pour le moment.</Text>
        ) : (
          transactions.map((tx) => (
            <View key={tx.id} style={styles.txItem}>
              <View style={[styles.txIcon, { backgroundColor: tx.points >= 0 ? Colors.successBg : Colors.dangerBg }]}>
                <Ionicons
                  name={tx.points >= 0 ? 'add-circle' : 'remove-circle'}
                  size={20}
                  color={tx.points >= 0 ? Colors.success : Colors.danger}
                />
              </View>
              <View style={styles.txInfo}>
                <Text style={styles.txReason}>{tx.reason}</Text>
                <Text style={styles.txDate}>
                  {new Date(tx.createdAt ?? '').toLocaleDateString('fr-FR')}
                </Text>
              </View>
              <Text style={[styles.txPoints, { color: tx.points >= 0 ? Colors.success : Colors.danger }]}>
                {tx.points >= 0 ? '+' : ''}{tx.points} pts
              </Text>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: Spacing[4], gap: Spacing[4], paddingBottom: Spacing[10] },
  levelCard: {
    borderRadius: BorderRadius['2xl'],
    padding: Spacing[6],
    alignItems: 'center',
    gap: Spacing[3],
    ...Shadow.lg,
  },
  levelIconWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  levelName: {
    fontSize: FontSize['3xl'],
    fontWeight: FontWeight.extrabold,
    color: Colors.white,
    letterSpacing: 2,
  },
  levelPoints: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
    color: 'rgba(255,255,255,0.9)',
  },
  progressSection: { width: '100%', gap: Spacing[2] },
  progressRow: { flexDirection: 'row', justifyContent: 'space-between' },
  progressLabel: { fontSize: FontSize.xs, color: 'rgba(255,255,255,0.8)' },
  progressBar: {
    height: 8,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.white,
    borderRadius: 4,
  },
  progressHint: { fontSize: FontSize.xs, color: 'rgba(255,255,255,0.7)', textAlign: 'center' },
  eliteText: {
    fontSize: FontSize.base,
    color: Colors.white,
    fontWeight: FontWeight.bold,
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
  levelsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  levelItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: BorderRadius.full,
    borderWidth: 1.5,
    backgroundColor: Colors.gray50,
  },
  levelItemActive: { backgroundColor: Colors.primaryMuted },
  levelDot: { width: 8, height: 8, borderRadius: 4 },
  levelItemName: { fontSize: FontSize.xs, fontWeight: FontWeight.semibold, color: Colors.text },
  levelItemPoints: { fontSize: FontSize.xs, color: Colors.textMuted },
  earnItem: { flexDirection: 'row', alignItems: 'center', gap: Spacing[3] },
  earnIcon: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  earnLabel: { flex: 1, fontSize: FontSize.base, color: Colors.text, fontWeight: FontWeight.medium },
  earnBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: BorderRadius.full,
  },
  earnPoints: { fontSize: FontSize.sm, fontWeight: FontWeight.bold },
  emptyText: { fontSize: FontSize.sm, color: Colors.textMuted, textAlign: 'center' },
  txItem: { flexDirection: 'row', alignItems: 'center', gap: Spacing[3], paddingVertical: 4 },
  txIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  txInfo: { flex: 1 },
  txReason: { fontSize: FontSize.sm, fontWeight: FontWeight.medium, color: Colors.text },
  txDate: { fontSize: FontSize.xs, color: Colors.textMuted },
  txPoints: { fontSize: FontSize.base, fontWeight: FontWeight.bold },
});
