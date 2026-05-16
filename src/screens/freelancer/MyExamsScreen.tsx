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
import { useAuth } from '../../context/AuthContext';
import { AppButton, StatusBadge, EmptyState, LoadingScreen } from '../../components';
import { Colors, FontSize, FontWeight, Spacing, BorderRadius, Shadow } from '../../theme';
import { useLoading } from '../../context/LoadingContext';

const client = generateClient<Schema>();

interface Props {
  navigation: any;
}

export function MyExamsScreen({ navigation }: Props) {
  const { user } = useAuth();
  const { withLoading } = useLoading();
  const [attempts, setAttempts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showRequest, setShowRequest] = useState(false);

  const load = useCallback(async () => {
    if (!user) return;
    try {
      const [attemptsResult, catsResult] = await Promise.all([
        client.models.ExamAttempt.list({
          filter: { userId: { eq: user.userId } },
        }),
        client.models.ExamCategory.list({
          filter: { isActive: { eq: true } },
        }),
      ]);
      const sorted = (attemptsResult.data ?? []).sort(
        (a, b) => new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime()
      );
      setAttempts(sorted);
      setCategories(catsResult.data ?? []);
    } catch {}
    finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  useEffect(() => { load(); }, [load]);

  const onRefresh = () => { setRefreshing(true); load(); };

  const handleRequestExam = async (categoryId: string, categoryName: string) => {
    await withLoading(async () => {
      await client.models.ExamAttempt.create({
        userId: user!.userId,
        examCategoryId: categoryId,
        status: 'REQUESTED',
        requestedAt: new Date().toISOString(),
        attemptNumber: 1,
      });
      await load();
      setShowRequest(false);
      Alert.alert('Demande envoyée', `Votre demande d'examen pour "${categoryName}" a été soumise.`);
    }, 'Envoi de la demande...');
  };

  if (loading) return <LoadingScreen />;

  return (
    <View style={styles.container}>
      {!showRequest ? (
        <>
          <View style={styles.headerRow}>
            <Text style={styles.headerTitle}>Mes examens</Text>
            <AppButton
              title="Demander un examen"
              onPress={() => setShowRequest(true)}
              size="sm"
              variant="primary"
              icon={<Ionicons name="add" size={16} color={Colors.white} />}
            />
          </View>

          <FlatList
            data={attempts}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.list}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
            ListEmptyComponent={
              <EmptyState
                title="Aucun examen"
                message="Vous n'avez pas encore demandé d'examen."
                icon="school-outline"
                actionLabel="Demander un examen"
                onAction={() => setShowRequest(true)}
              />
            }
            renderItem={({ item }) => (
              <View style={styles.card}>
                <View style={styles.cardHeader}>
                  <View style={styles.iconWrap}>
                    <Ionicons name="school-outline" size={20} color={Colors.secondary} />
                  </View>
                  <View style={styles.cardInfo}>
                    <Text style={styles.cardTitle}>Examen #{item.id?.slice(-6)}</Text>
                    <Text style={styles.cardDate}>
                      Demandé le {new Date(item.requestedAt ?? item.createdAt ?? '').toLocaleDateString('fr-FR')}
                    </Text>
                  </View>
                  <StatusBadge status={item.status} size="sm" />
                </View>
                {item.score != null ? (
                  <View style={styles.scoreRow}>
                    <Ionicons name="trophy-outline" size={16} color={item.score >= 70 ? Colors.success : Colors.danger} />
                    <Text style={[styles.score, { color: item.score >= 70 ? Colors.success : Colors.danger }]}>
                      Score: {item.score}%
                    </Text>
                  </View>
                ) : null}
                {item.scheduledAt ? (
                  <View style={styles.scheduledRow}>
                    <Ionicons name="calendar-outline" size={14} color={Colors.textMuted} />
                    <Text style={styles.scheduledText}>
                      Planifié le {new Date(item.scheduledAt).toLocaleDateString('fr-FR')}
                    </Text>
                  </View>
                ) : null}
                {item.adminNotes ? (
                  <Text style={styles.adminNotes}>{item.adminNotes}</Text>
                ) : null}
              </View>
            )}
            ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
          />
        </>
      ) : (
        <View style={styles.requestContainer}>
          <TouchableOpacity style={styles.backBtn} onPress={() => setShowRequest(false)}>
            <Ionicons name="arrow-back" size={22} color={Colors.text} />
            <Text style={styles.backText}>Retour</Text>
          </TouchableOpacity>
          <Text style={styles.requestTitle}>Choisir une catégorie d'examen</Text>
          <FlatList
            data={categories}
            keyExtractor={(cat) => cat.id}
            contentContainerStyle={styles.catList}
            renderItem={({ item: cat }) => (
              <TouchableOpacity
                style={styles.catCard}
                onPress={() => handleRequestExam(cat.id, cat.name)}
                activeOpacity={0.85}
              >
                <View style={styles.catIcon}>
                  <Ionicons name="school" size={24} color={Colors.secondary} />
                </View>
                <View style={styles.catInfo}>
                  <Text style={styles.catName}>{cat.name}</Text>
                  {cat.description ? (
                    <Text style={styles.catDesc} numberOfLines={2}>{cat.description}</Text>
                  ) : null}
                  <Text style={styles.catPass}>Score requis: {cat.passingScore}%</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
              </TouchableOpacity>
            )}
            ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing[4],
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerTitle: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
    color: Colors.text,
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
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.secondaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardInfo: { flex: 1 },
  cardTitle: {
    fontSize: FontSize.base,
    fontWeight: FontWeight.semibold,
    color: Colors.text,
  },
  cardDate: { fontSize: FontSize.xs, color: Colors.textMuted },
  scoreRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  score: { fontSize: FontSize.lg, fontWeight: FontWeight.bold },
  scheduledRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  scheduledText: { fontSize: FontSize.sm, color: Colors.textMuted },
  adminNotes: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    fontStyle: 'italic',
    backgroundColor: Colors.gray50,
    padding: 10,
    borderRadius: BorderRadius.md,
  },
  // Request
  requestContainer: { flex: 1, padding: Spacing[4], gap: Spacing[4] },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  backText: {
    fontSize: FontSize.base,
    fontWeight: FontWeight.medium,
    color: Colors.text,
  },
  requestTitle: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
    color: Colors.text,
  },
  catList: { gap: 0 },
  catCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[3],
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    padding: Spacing[4],
    ...Shadow.sm,
  },
  catIcon: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.xl,
    backgroundColor: Colors.secondaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  catInfo: { flex: 1, gap: 2 },
  catName: {
    fontSize: FontSize.base,
    fontWeight: FontWeight.bold,
    color: Colors.text,
  },
  catDesc: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
  catPass: {
    fontSize: FontSize.xs,
    color: Colors.secondary,
    fontWeight: FontWeight.semibold,
  },
});
