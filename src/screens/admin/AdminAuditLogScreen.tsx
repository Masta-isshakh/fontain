import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  TextInput,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../../../amplify/data/resource';
import { LoadingScreen, EmptyState } from '../../components';
import { Colors, FontSize, FontWeight, Spacing, BorderRadius, Shadow } from '../../theme';

const client = generateClient<Schema>();

interface Props { navigation: any }

const ACTION_COLORS: Record<string, string> = {
  CREATE: Colors.success,
  UPDATE: Colors.warning,
  DELETE: Colors.danger,
  LOGIN: Colors.primary,
  LOGOUT: Colors.gray500,
};

export function AdminAuditLogScreen({ navigation }: Props) {
  const [logs, setLogs] = useState<any[]>([]);
  const [filtered, setFiltered] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const result = await client.models.AuditLog.list();
      const data = (result.data ?? []).sort(
        (a, b) => new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime()
      );
      setLogs(data);
      setFiltered(data);
    } catch {}
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { load(); }, [load]);
  const onRefresh = () => { setRefreshing(true); load(); };

  const handleSearch = (text: string) => {
    setSearch(text);
    if (!text.trim()) { setFiltered(logs); return; }
    const q = text.toLowerCase();
    setFiltered(logs.filter((l) =>
      l.action?.toLowerCase().includes(q) ||
      l.entityType?.toLowerCase().includes(q) ||
      l.actorUserId?.toLowerCase().includes(q)
    ));
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
            placeholder="Filtrer les entrées..."
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
          <Text style={styles.count}>{filtered.length} entrée{filtered.length !== 1 ? 's' : ''}</Text>
        }
        ListEmptyComponent={<EmptyState title="Aucune entrée" icon="list-outline" />}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={[styles.dot, { backgroundColor: ACTION_COLORS[item.action] ?? Colors.gray400 }]} />
            <View style={styles.info}>
              <View style={styles.row}>
                <Text style={[styles.action, { color: ACTION_COLORS[item.action] ?? Colors.gray600 }]}>
                  {item.action}
                </Text>
                <Text style={styles.resource}>{item.entityType}</Text>
              </View>
              <Text style={styles.userId}>User #{item.actorUserId?.slice(-6)}</Text>
              <Text style={styles.date}>
                {new Date(item.createdAt ?? '').toLocaleString('fr-FR')}
              </Text>
              {item.details ? (
                <Text style={styles.details} numberOfLines={2}>{item.details}</Text>
              ) : null}
            </View>
          </View>
        )}
        ItemSeparatorComponent={() => <View style={{ height: 6 }} />}
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
  searchInput: { flex: 1, fontSize: FontSize.base, color: Colors.text, padding: 0 },
  list: { padding: Spacing[4], paddingBottom: Spacing[10] },
  count: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
    fontWeight: FontWeight.medium,
    marginBottom: Spacing[3],
  },
  card: {
    flexDirection: 'row',
    gap: Spacing[3],
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing[3],
    alignItems: 'flex-start',
    ...Shadow.sm,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginTop: 5,
    flexShrink: 0,
  },
  info: { flex: 1, gap: 2 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  action: { fontSize: FontSize.sm, fontWeight: FontWeight.bold },
  resource: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    backgroundColor: Colors.gray100,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  userId: { fontSize: FontSize.xs, color: Colors.textMuted },
  date: { fontSize: FontSize.xs, color: Colors.textMuted },
  details: { fontSize: FontSize.xs, color: Colors.textSecondary, fontStyle: 'italic' },
});
