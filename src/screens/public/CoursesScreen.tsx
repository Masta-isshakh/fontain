import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../../../amplify/data/resource';
import { CourseCard, EmptyState, LoadingScreen } from '../../components';
import { Colors, FontSize, FontWeight, Spacing, BorderRadius } from '../../theme';

const client = generateClient<Schema>();

interface Props {
  navigation: any;
}

export function CoursesScreen({ navigation }: Props) {
  const [playlists, setPlaylists] = useState<any[]>([]);
  const [filtered, setFiltered] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const result = await client.models.Playlist.list({
        filter: { isPublished: { eq: true } },
      });
      const data = result.data ?? [];
      setPlaylists(data);
      setFiltered(data);
    } catch (err) {
      console.warn('Failed to load playlists:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleSearch = (text: string) => {
    setSearch(text);
    if (!text.trim()) {
      setFiltered(playlists);
      return;
    }
    const q = text.toLowerCase();
    setFiltered(playlists.filter((p) => p.title?.toLowerCase().includes(q) || p.description?.toLowerCase().includes(q)));
  };

  const onRefresh = () => {
    setRefreshing(true);
    load();
  };

  if (loading) return <LoadingScreen />;

  return (
    <View style={styles.container}>
      {/* Search bar */}
      <View style={styles.searchWrap}>
        <View style={styles.searchBar}>
          <Ionicons name="search-outline" size={18} color={Colors.textMuted} />
          <TextInput
            style={styles.searchInput}
            value={search}
            onChangeText={handleSearch}
            placeholder="Rechercher une formation..."
            placeholderTextColor={Colors.textMuted}
            returnKeyType="search"
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
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />
        }
        ListHeaderComponent={
          <Text style={styles.count}>
            {filtered.length} formation{filtered.length !== 1 ? 's' : ''}
          </Text>
        }
        ListEmptyComponent={
          <EmptyState
            title="Aucune formation"
            message={
              search
                ? 'Aucune formation ne correspond à votre recherche.'
                : 'Les formations seront bientôt disponibles.'
            }
            icon="play-circle-outline"
            actionLabel={search ? 'Effacer la recherche' : undefined}
            onAction={search ? () => handleSearch('') : undefined}
          />
        }
        renderItem={({ item }) => (
          <CourseCard
            title={item.title}
            description={item.description}
            thumbnail={item.thumbnail}
            visibility={item.visibility}
            onPress={() => navigation.navigate('PlaylistDetail', { playlistId: item.id, title: item.title })}
          />
        )}
        ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
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
  list: {
    padding: Spacing[4],
    gap: 0,
    paddingBottom: Spacing[10],
  },
  count: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
    fontWeight: FontWeight.medium,
    marginBottom: Spacing[3],
  },
});
