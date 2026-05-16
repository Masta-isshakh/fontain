import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  Alert,
  TextInput,
  Modal,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../../../amplify/data/resource';
import { StatusBadge, LoadingScreen, EmptyState, AppButton, AppInput } from '../../components';
import { Colors, FontSize, FontWeight, Spacing, BorderRadius, Shadow } from '../../theme';
import { useLoading } from '../../context/LoadingContext';

const client = generateClient<Schema>();

interface Props {
  navigation: any;
}

const EXAM_STATUSES = ['REQUESTED', 'SCHEDULED', 'COMPLETED', 'UNDER_REVIEW', 'PASSED', 'FAILED', 'CANCELLED'];

export function AdminExamsScreen({ navigation }: Props) {
  const { withLoading } = useLoading();
  const [attempts, setAttempts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'REQUESTED' | 'SCHEDULED' | 'UNDER_REVIEW'>('REQUESTED');
  const [gradeModal, setGradeModal] = useState<any>(null);
  const [grade, setGrade] = useState('');
  const [adminNotes, setAdminNotes] = useState('');
  const [scheduledDate, setScheduledDate] = useState('');

  const load = useCallback(async () => {
    try {
      const result = await client.models.ExamAttempt.list();
      setAttempts(
        (result.data ?? []).sort((a, b) => new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime())
      );
    } catch {}
    finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);
  const onRefresh = () => { setRefreshing(true); load(); };

  const handleSchedule = async (item: any) => {
    await withLoading(async () => {
      await client.models.ExamAttempt.update({
        id: item.id,
        status: 'SCHEDULED',
        scheduledAt: scheduledDate || new Date().toISOString(),
        adminNotes,
      });
      setGradeModal(null);
      setScheduledDate('');
      setAdminNotes('');
      await load();
    }, 'Planification...');
  };

  const handleGrade = async (item: any, passed: boolean) => {
    const gradeNum = parseFloat(grade);
    if (isNaN(gradeNum) || gradeNum < 0 || gradeNum > 100) {
      Alert.alert('Erreur', 'Saisissez une note entre 0 et 100');
      return;
    }
    await withLoading(async () => {
      const newStatus = passed ? 'PASSED' : 'FAILED';
      await client.models.ExamAttempt.update({
        id: item.id,
        status: newStatus,
        score: gradeNum,
        reviewedAt: new Date().toISOString(),
        adminNotes,
      });
      // Award loyalty points if passed
      if (passed) {
        try {
          await client.models.LoyaltyTransaction.create({
            userId: item.userId,
            points: 50,
            reason: 'Examen réussi',
            type: 'EARNED',
          });
        } catch {}
      }
      setGradeModal(null);
      setGrade('');
      setAdminNotes('');
      await load();
    }, 'Évaluation...');
  };

  if (loading) return <LoadingScreen />;

  const TABS: { key: 'REQUESTED' | 'SCHEDULED' | 'UNDER_REVIEW'; label: string }[] = [
    { key: 'REQUESTED', label: 'Demandés' },
    { key: 'SCHEDULED', label: 'Planifiés' },
    { key: 'UNDER_REVIEW', label: 'À évaluer' },
  ];

  const filtered = attempts.filter((a) => a.status === activeTab);

  return (
    <View style={styles.container}>
      <View style={styles.tabs}>
        {TABS.map((t) => {
          const count = attempts.filter((a) => a.status === t.key).length;
          return (
            <TouchableOpacity
              key={t.key}
              style={[styles.tab, activeTab === t.key && styles.tabActive]}
              onPress={() => setActiveTab(t.key)}
            >
              <Text style={[styles.tabText, activeTab === t.key && styles.tabTextActive]}>
                {t.label} {count > 0 ? `(${count})` : ''}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
        ListEmptyComponent={<EmptyState title="Aucun examen" icon="school-outline" />}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.iconWrap}>
                <Ionicons name="school-outline" size={18} color={Colors.secondary} />
              </View>
              <View style={styles.cardInfo}>
                <Text style={styles.cardTitle}>Examen #{item.id.slice(-6)}</Text>
                <Text style={styles.cardSub}>Freelancer #{item.freelancerId?.slice(-6)}</Text>
                <Text style={styles.cardDate}>
                  {new Date(item.createdAt ?? '').toLocaleDateString('fr-FR')}
                </Text>
              </View>
              <StatusBadge status={item.status} size="sm" />
            </View>
            {item.status === 'REQUESTED' ? (
              <AppButton
                title="Planifier"
                onPress={() => setGradeModal({ item, mode: 'schedule' })}
                variant="primary"
                size="sm"
                fullWidth
              />
            ) : item.status === 'UNDER_REVIEW' ? (
              <AppButton
                title="Évaluer"
                onPress={() => setGradeModal({ item, mode: 'grade' })}
                variant="secondary"
                size="sm"
                fullWidth
              />
            ) : null}
          </View>
        )}
        ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
      />

      {/* Grade / Schedule Modal */}
      <Modal visible={!!gradeModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>
                {gradeModal?.mode === 'grade' ? 'Évaluer l\'examen' : 'Planifier l\'examen'}
              </Text>
              {gradeModal?.mode === 'grade' ? (
                <>
                  <AppInput
                    label="Note (0-100)"
                    value={grade}
                    onChangeText={setGrade}
                    keyboardType="numeric"
                    placeholder="Ex: 75"
                  />
                  <AppInput
                    label="Notes admin (optionnel)"
                    value={adminNotes}
                    onChangeText={setAdminNotes}
                    placeholder="Commentaires pour le freelancer..."
                    multiline
                  />
                  <View style={styles.modalActions}>
                    <AppButton
                      title="Reçu"
                      onPress={() => handleGrade(gradeModal.item, true)}
                      variant="primary"
                      size="sm"
                      style={{ flex: 1 }}
                    />
                    <AppButton
                      title="Échoué"
                      onPress={() => handleGrade(gradeModal.item, false)}
                      variant="danger"
                      size="sm"
                      style={{ flex: 1 }}
                    />
                  </View>
                </>
              ) : (
                <>
                  <AppInput
                    label="Date (ISO, optionnel)"
                    value={scheduledDate}
                    onChangeText={setScheduledDate}
                    placeholder="2024-12-31T10:00:00Z"
                  />
                  <AppInput
                    label="Message au freelancer (optionnel)"
                    value={adminNotes}
                    onChangeText={setAdminNotes}
                    placeholder="Instructions..."
                    multiline
                  />
                  <AppButton
                    title="Confirmer la planification"
                    onPress={() => handleSchedule(gradeModal.item)}
                    variant="primary"
                    fullWidth
                  />
                </>
              )}
              <AppButton
                title="Annuler"
                onPress={() => { setGradeModal(null); setGrade(''); setAdminNotes(''); setScheduledDate(''); }}
                variant="ghost"
                size="sm"
                fullWidth
              />
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>
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
  tabText: { fontSize: FontSize.xs, fontWeight: FontWeight.medium, color: Colors.textMuted },
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
    backgroundColor: Colors.secondaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardInfo: { flex: 1, gap: 2 },
  cardTitle: { fontSize: FontSize.base, fontWeight: FontWeight.semibold, color: Colors.text },
  cardSub: { fontSize: FontSize.xs, color: Colors.textSecondary },
  cardDate: { fontSize: FontSize.xs, color: Colors.textMuted },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: Spacing[6],
    gap: Spacing[4],
    paddingBottom: Spacing[10],
  },
  modalTitle: {
    fontSize: FontSize['2xl'],
    fontWeight: FontWeight.bold,
    color: Colors.text,
    textAlign: 'center',
  },
  modalActions: { flexDirection: 'row', gap: Spacing[3] },
});
