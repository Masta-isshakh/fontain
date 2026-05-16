import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  TextInput,
  Modal,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../../../amplify/data/resource';
import { LoadingScreen, EmptyState, AppButton, AppInput, StatusBadge } from '../../components';
import { Colors, FontSize, FontWeight, Spacing, BorderRadius, Shadow } from '../../theme';
import { useLoading } from '../../context/LoadingContext';

const client = generateClient<Schema>();

interface Props { navigation: any }

export function AdminLoyaltyScreen({ navigation }: Props) {
  const { withLoading } = useLoading();
  const [users, setUsers] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modal, setModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [points, setPoints] = useState('');
  const [reason, setReason] = useState('');
  const [type, setType] = useState<'EARNED' | 'DEDUCTED'>('EARNED');
  const [tab, setTab] = useState<'users' | 'history'>('users');

  const load = useCallback(async () => {
    try {
      const [u, t] = await Promise.all([
        client.models.UserProfile.list(),
        client.models.LoyaltyTransaction.list(),
      ]);
      const txData = t.data ?? [];
      // Compute total points per user from transactions
      const pointsMap: Record<string, number> = {};
      txData.forEach((tx) => {
        const delta = tx.type === 'EARNED' || tx.type === 'MANUAL' ? (tx.points ?? 0) : -(tx.points ?? 0);
        pointsMap[tx.userId] = (pointsMap[tx.userId] ?? 0) + delta;
      });
      const usersWithPts = (u.data ?? []).map((user: any) => ({
        ...user,
        computedPoints: Math.max(0, pointsMap[user.authUserId] ?? 0),
      }));
      setUsers(usersWithPts.sort((a: any, b: any) => b.computedPoints - a.computedPoints));
      setTransactions(
        txData.sort((a, b) => new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime())
      );
    } catch {}
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { load(); }, [load]);
  const onRefresh = () => { setRefreshing(true); load(); };

  const handleAward = async () => {
    const pts = parseInt(points);
    if (isNaN(pts) || pts <= 0) {
      Alert.alert('Erreur', 'Saisissez un nombre de points valide');
      return;
    }
    await withLoading(async () => {
      await client.models.LoyaltyTransaction.create({
        userId: selectedUser.authUserId,
        points: pts,
        reason: reason || 'Attribution manuelle',
        type,
        createdBy: 'ADMIN',
      });
      setModal(false);
      setPoints('');
      setReason('');
      setSelectedUser(null);
      await load();
    }, 'Attribution...');
  };

  const getLoyaltyLevel = (pts: number) => {
    if (pts >= 2000) return 'ELITE';
    if (pts >= 1000) return 'PLATINUM';
    if (pts >= 500) return 'GOLD';
    if (pts >= 200) return 'SILVER';
    return 'BRONZE';
  };

  if (loading) return <LoadingScreen />;

  return (
    <View style={styles.container}>
      <View style={styles.tabs}>
        {(['users', 'history'] as const).map((t) => (
          <TouchableOpacity
            key={t}
            style={[styles.tab, tab === t && styles.tabActive]}
            onPress={() => setTab(t)}
          >
            <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>
              {t === 'users' ? 'Utilisateurs' : 'Historique'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {tab === 'users' ? (
        <FlatList
          data={users}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
          ListEmptyComponent={<EmptyState title="Aucun utilisateur" icon="trophy-outline" />}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{(item.fullName?.[0] ?? '?').toUpperCase()}</Text>
              </View>
              <View style={styles.info}>
                <Text style={styles.name}>{item.fullName}</Text>
                <View style={styles.row}>
                  <Text style={styles.pts}>{item.computedPoints ?? 0} pts</Text>
                  <StatusBadge status={getLoyaltyLevel(item.computedPoints ?? 0)} size="sm" />
                </View>
              </View>
              <TouchableOpacity
                style={styles.awardBtn}
                onPress={() => { setSelectedUser(item); setModal(true); }}
              >
                <Ionicons name="add-circle" size={28} color={Colors.primary} />
              </TouchableOpacity>
            </View>
          )}
          ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
        />
      ) : (
        <FlatList
          data={transactions}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
          ListEmptyComponent={<EmptyState title="Aucune transaction" icon="swap-horizontal-outline" />}
          renderItem={({ item }) => (
            <View style={styles.txCard}>
              <View style={[
                styles.txIcon,
                { backgroundColor: item.type === 'EARNED' ? Colors.success + '20' : Colors.danger + '20' }
              ]}>
                <Ionicons
                  name={item.type === 'EARNED' ? 'trending-up' : 'trending-down'}
                  size={16}
                  color={item.type === 'EARNED' ? Colors.success : Colors.danger}
                />
              </View>
              <View style={styles.txInfo}>
                <Text style={styles.txReason}>{item.reason}</Text>
                <Text style={styles.txDate}>
                  {new Date(item.createdAt ?? '').toLocaleDateString('fr-FR')}
                </Text>
              </View>
              <Text style={[
                styles.txPoints,
                { color: item.type === 'EARNED' ? Colors.success : Colors.danger }
              ]}>
                {item.type === 'EARNED' ? '+' : '-'}{item.points} pts
              </Text>
            </View>
          )}
          ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
        />
      )}

      <Modal visible={modal} transparent animationType="slide">
        <View style={styles.overlay}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>
                Modifier les points — {selectedUser?.fullName}
              </Text>
              <Text style={styles.currentPts}>
                Solde actuel : {selectedUser?.computedPoints ?? 0} pts
              </Text>
              <View style={styles.typeRow}>
                {(['EARNED', 'DEDUCTED'] as const).map((t) => (
                  <TouchableOpacity
                    key={t}
                    style={[styles.typeBtn, type === t && { backgroundColor: t === 'EARNED' ? Colors.success : Colors.danger }]}
                    onPress={() => setType(t)}
                  >
                    <Text style={[styles.typeBtnText, type === t && { color: Colors.white }]}>
                      {t === 'EARNED' ? '+ Attribuer' : '− Déduire'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              <AppInput label="Points" value={points} onChangeText={setPoints} keyboardType="numeric" placeholder="Ex: 50" />
              <AppInput label="Raison" value={reason} onChangeText={setReason} placeholder="Attribution manuelle..." />
              <AppButton title="Confirmer" onPress={handleAward} variant="primary" fullWidth />
              <AppButton title="Annuler" onPress={() => { setModal(false); setPoints(''); setReason(''); }} variant="ghost" size="sm" fullWidth />
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
  tabText: { fontSize: FontSize.sm, fontWeight: FontWeight.medium, color: Colors.textMuted },
  tabTextActive: { color: Colors.primary, fontWeight: FontWeight.bold },
  list: { padding: Spacing[4], paddingBottom: Spacing[10] },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[3],
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    padding: Spacing[4],
    ...Shadow.sm,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontSize: FontSize.xl, fontWeight: FontWeight.bold, color: Colors.white },
  info: { flex: 1, gap: 4 },
  name: { fontSize: FontSize.base, fontWeight: FontWeight.semibold, color: Colors.text },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  pts: { fontSize: FontSize.sm, fontWeight: FontWeight.bold, color: Colors.gold },
  awardBtn: { padding: 4 },
  txCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[3],
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    padding: Spacing[4],
    ...Shadow.sm,
  },
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
  overlay: {
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
  modalTitle: { fontSize: FontSize.xl, fontWeight: FontWeight.bold, color: Colors.text },
  currentPts: { fontSize: FontSize.base, color: Colors.textSecondary },
  typeRow: { flexDirection: 'row', gap: Spacing[3] },
  typeBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.gray100,
    alignItems: 'center',
  },
  typeBtnText: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, color: Colors.text },
});
