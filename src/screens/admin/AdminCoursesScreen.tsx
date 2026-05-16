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
  Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../../../amplify/data/resource';
import { LoadingScreen, EmptyState, AppButton, AppInput } from '../../components';
import { Colors, FontSize, FontWeight, Spacing, BorderRadius, Shadow } from '../../theme';
import { useLoading } from '../../context/LoadingContext';

const client = generateClient<Schema>();

interface Props { navigation: any }

export function AdminCoursesScreen({ navigation }: Props) {
  const { withLoading } = useLoading();
  const [playlists, setPlaylists] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isPublished, setIsPublished] = useState(false);
  const [freelancerOnly, setFreelancerOnly] = useState(false);

  const load = useCallback(async () => {
    try {
      const result = await client.models.Playlist.list();
      setPlaylists(
        (result.data ?? []).sort((a, b) => new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime())
      );
    } catch {}
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { load(); }, [load]);
  const onRefresh = () => { setRefreshing(true); load(); };

  const openCreate = () => {
    setEditing(null);
    setTitle('');
    setDescription('');
    setIsPublished(false);
    setFreelancerOnly(false);
    setModal(true);
  };

  const openEdit = (item: any) => {
    setEditing(item);
    setTitle(item.title ?? '');
    setDescription(item.description ?? '');
    setIsPublished(item.isPublished ?? false);
    setFreelancerOnly(item.visibility === 'FREELANCER_ONLY');
    setModal(true);
  };

  const handleSave = async () => {
    if (!title.trim()) { Alert.alert('Erreur', 'Le titre est requis'); return; }
    await withLoading(async () => {
      if (editing) {
        await client.models.Playlist.update({
          id: editing.id,
          title: title.trim(),
          description: description.trim() || undefined,
          isPublished,
          visibility: freelancerOnly ? 'FREELANCER_ONLY' : 'PUBLIC',
        });
      } else {
        await client.models.Playlist.create({
          title: title.trim(),
          description: description.trim() || undefined,
          isPublished,
          visibility: freelancerOnly ? 'FREELANCER_ONLY' : 'PUBLIC',
        });
      }
      setModal(false);
      await load();
    }, 'Enregistrement...');
  };

  const handleDelete = (item: any) => {
    Alert.alert(
      'Supprimer la playlist',
      `Supprimer "${item.title}"? Cette action est irréversible.`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            await withLoading(async () => {
              await client.models.Playlist.delete({ id: item.id });
              await load();
            }, 'Suppression...');
          },
        },
      ]
    );
  };

  if (loading) return <LoadingScreen />;

  return (
    <View style={styles.container}>
      <FlatList
        data={playlists}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
        ListHeaderComponent={
          <AppButton
            title="Nouvelle playlist"
            onPress={openCreate}
            variant="primary"
            icon="add"
            fullWidth
            style={{ marginBottom: Spacing[4] }}
          />
        }
        ListEmptyComponent={<EmptyState title="Aucune playlist" icon="play-circle-outline" />}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.cardIcon}>
              <Ionicons name="play-circle" size={24} color={Colors.secondary} />
            </View>
            <View style={styles.cardInfo}>
              <Text style={styles.cardTitle}>{item.title}</Text>
              <View style={styles.badges}>
                <View style={[styles.badge, { backgroundColor: item.isPublished ? Colors.success + '20' : Colors.gray100 }]}>
                  <Text style={[styles.badgeText, { color: item.isPublished ? Colors.success : Colors.gray500 }]}>
                    {item.isPublished ? 'Publié' : 'Brouillon'}
                  </Text>
                </View>
                {item.visibility === 'FREELANCER_ONLY' ? (
                  <View style={[styles.badge, { backgroundColor: Colors.primary + '20' }]}>
                    <Text style={[styles.badgeText, { color: Colors.primary }]}>Freelancer</Text>
                  </View>
                ) : null}
                <Text style={styles.videoCount}>{item.videoCount ?? 0} vidéos</Text>
              </View>
            </View>
            <View style={styles.actions}>
              <TouchableOpacity onPress={() => openEdit(item)}>
                <Ionicons name="pencil-outline" size={20} color={Colors.primary} />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => handleDelete(item)}>
                <Ionicons name="trash-outline" size={20} color={Colors.danger} />
              </TouchableOpacity>
            </View>
          </View>
        )}
        ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
      />

      <Modal visible={modal} transparent animationType="slide">
        <View style={styles.overlay}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>{editing ? 'Modifier la playlist' : 'Nouvelle playlist'}</Text>
              <AppInput label="Titre" value={title} onChangeText={setTitle} placeholder="Titre de la playlist" />
              <AppInput label="Description (optionnel)" value={description} onChangeText={setDescription} placeholder="..." multiline />
              <View style={styles.switchRow}>
                <Text style={styles.switchLabel}>Publié</Text>
                <Switch value={isPublished} onValueChange={setIsPublished} trackColor={{ true: Colors.primary }} />
              </View>
              <View style={styles.switchRow}>
                <Text style={styles.switchLabel}>Réservé aux freelancers</Text>
                <Switch value={freelancerOnly} onValueChange={setFreelancerOnly} trackColor={{ true: Colors.secondary }} />
              </View>
              <AppButton title="Enregistrer" onPress={handleSave} variant="primary" fullWidth />
              <AppButton title="Annuler" onPress={() => setModal(false)} variant="ghost" size="sm" fullWidth />
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
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
  cardIcon: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.secondaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardInfo: { flex: 1, gap: 4 },
  cardTitle: { fontSize: FontSize.base, fontWeight: FontWeight.semibold, color: Colors.text },
  badges: { flexDirection: 'row', gap: 6, alignItems: 'center', flexWrap: 'wrap' },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: BorderRadius.full },
  badgeText: { fontSize: 10, fontWeight: FontWeight.semibold },
  videoCount: { fontSize: FontSize.xs, color: Colors.textMuted },
  actions: { flexDirection: 'row', gap: Spacing[3], alignItems: 'center' },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: Spacing[6],
    gap: Spacing[4],
    paddingBottom: Spacing[10],
  },
  modalTitle: { fontSize: FontSize.xl, fontWeight: FontWeight.bold, color: Colors.text, textAlign: 'center' },
  switchRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  switchLabel: { fontSize: FontSize.base, color: Colors.text },
});
