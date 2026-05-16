import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../../../amplify/data/resource';
import { StatusBadge, LoadingScreen, EmptyState } from '../../components';
import { Colors, FontSize, FontWeight, Spacing, BorderRadius, Shadow } from '../../theme';

const client = generateClient<Schema>();

interface Props {
  navigation: any;
}

export function AdminUsersScreen({ navigation }: Props) {
  const [users, setUsers] = useState<any[]>([]);
  const [filtered, setFiltered] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const result = await client.models.UserProfile.list();
      const data = (result.data ?? []).sort(
        (a, b) => new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime()
      );
      setUsers(data);
      setFiltered(data);
    } catch (err) {
      console.warn('AdminUsers load error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleSearch = (text: string) => {
    setSearch(text);
    if (!text.trim()) { setFiltered(users); return; }
    const q = text.toLowerCase();
    setFiltered(users.filter((u) =>
      u.fullName?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q)
    ));
  };

  const onRefresh = () => { setRefreshing(true); load(); };

  const handleToggleStatus = async (u: any) => {
    const newStatus = u.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
    Alert.alert(
      newStatus === 'SUSPENDED' ? 'Suspendre l\'utilisateur' : 'Réactiver l\'utilisateur',
      `Êtes-vous sûr de vouloir ${newStatus === 'SUSPENDED' ? 'suspendre' : 'réactiver'} ${u.fullName}?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Confirmer',
          style: newStatus === 'SUSPENDED' ? 'destructive' : 'default',
          onPress: async () => {
            try {
              await client.models.UserProfile.update({ id: u.id, status: newStatus });
              await load();
            } catch {
              Alert.alert('Erreur', 'Impossible de modifier le statut');
            }
          },
        },
      ]
    );
  };

  if (loading) return <LoadingScreen />;

  return (
    <View style={styles.container}>
      <View style={styles.searchWrap}>
        <View style={styles.searchBar}>
          <Ionicons name="search-outline" size={18} color={Colors.textMuted} />
          <TextInput
            style={styles.searchInput}
            value={search}
            onChangeText={handleSearch}
            placeholder="Rechercher un utilisateur..."
            placeholderTextColor={Colors.textMuted}
          />
          {search ? (
            <TouchableOpacity onPress={() => handleSearch('')}>
              <Ionicons name="close-circle" size={18} color={Colors.textMuted} />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
        ListHeaderComponent={
          <Text style={styles.count}>{filtered.length} utilisateur{filtered.length !== 1 ? 's' : ''}</Text>
        }
        ListEmptyComponent={
          <EmptyState title="Aucun utilisateur" icon="people-outline" />
        }
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{(item.fullName?.[0] ?? '?').toUpperCase()}</Text>
            </View>
            <View style={styles.info}>
              <Text style={styles.name}>{item.fullName}</Text>
              <Text style={styles.email}>{item.email}</Text>
              <View style={styles.badges}>
                <StatusBadge status={item.status ?? 'ACTIVE'} size="sm" />
                <View style={styles.roleBadge}>
                  <Text style={styles.roleText}>{item.role ?? 'PUBLIC'}</Text>
                </View>
              </View>
            </View>
            <TouchableOpacity
              style={styles.actionBtn}
              onPress={() => handleToggleStatus(item)}
            >
              <Ionicons
                name={item.status === 'SUSPENDED' ? 'checkmark-circle-outline' : 'ban-outline'}
                size={22}
                color={item.status === 'SUSPENDED' ? Colors.success : Colors.danger}
              />
            </TouchableOpacity>
          </View>
        )}
        ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  searchWrap: {
    padding: Spacing[4],
    paddingBottom: 0,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.gray50,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 8,
    marginBottom: Spacing[3],
  },
  searchInput: {
    flex: 1,
    fontSize: FontSize.base,
    color: Colors.text,
    padding: 0,
  },
  list: { padding: Spacing[4], paddingBottom: Spacing[10] },
  count: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
    fontWeight: FontWeight.medium,
    marginBottom: Spacing[3],
  },
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
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  avatarText: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
    color: Colors.white,
  },
  info: { flex: 1, gap: 4 },
  name: { fontSize: FontSize.base, fontWeight: FontWeight.semibold, color: Colors.text },
  email: { fontSize: FontSize.xs, color: Colors.textMuted },
  badges: { flexDirection: 'row', gap: 6, alignItems: 'center', marginTop: 2 },
  roleBadge: {
    backgroundColor: Colors.gray100,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
  },
  roleText: { fontSize: 10, color: Colors.gray600, fontWeight: FontWeight.semibold },
  actionBtn: { padding: 4 },
});
