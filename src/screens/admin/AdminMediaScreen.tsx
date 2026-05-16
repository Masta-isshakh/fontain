import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  Alert,
  Modal,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../../../amplify/data/resource';
import { LoadingScreen, EmptyState, AppButton, AppInput } from '../../components';
import { Colors, FontSize, FontWeight, Spacing, BorderRadius, Shadow } from '../../theme';
import { useLoading } from '../../context/LoadingContext';

const client = generateClient<Schema>();

interface Props { navigation: any }

const FOLDER_TYPES = ['HOME_IMAGE', 'HOME_VIDEO', 'COURSE_THUMBNAIL'] as const;
type FolderType = typeof FOLDER_TYPES[number];
type MediaType = 'IMAGE' | 'VIDEO';

export function AdminMediaScreen({ navigation }: Props) {
  const { withLoading } = useLoading();
  const [assets, setAssets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modal, setModal] = useState(false);
  const [assetTitle, setAssetTitle] = useState('');
  const [storageKey, setStorageKey] = useState('');
  const [selectedMediaType, setSelectedMediaType] = useState<MediaType>('IMAGE');
  const [folderType, setFolderType] = useState<FolderType>('HOME_IMAGE');

  const load = useCallback(async () => {
    try {
      const result = await client.models.MediaAsset.list({
        filter: {
          or: [
            { folderType: { eq: 'HOME_IMAGE' } },
            { folderType: { eq: 'HOME_VIDEO' } },
            { folderType: { eq: 'COURSE_THUMBNAIL' } },
          ],
        },
      });
      setAssets(
        (result.data ?? []).sort((a, b) => new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime())
      );
    } catch {}
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { load(); }, [load]);
  const onRefresh = () => { setRefreshing(true); load(); };

  const handleSave = async () => {
    if (!assetTitle.trim() || !storageKey.trim()) {
      Alert.alert('Erreur', 'Le titre et la clé de stockage sont requis');
      return;
    }
    await withLoading(async () => {
      await client.models.MediaAsset.create({
        title: assetTitle.trim(),
        storageKey: storageKey.trim(),
        mediaType: selectedMediaType,
        folderType,
      });
      setModal(false);
      setAssetTitle('');
      setStorageKey('');
      await load();
    }, 'Enregistrement...');
  };

  const handleToggle = async (item: any) => {
    await withLoading(async () => {
      await client.models.MediaAsset.update({ id: item.id, visibility: item.visibility === 'PUBLIC' ? 'PRIVATE' : 'PUBLIC' });
      await load();
    }, 'Mise à jour...');
  };

  const handleDelete = (item: any) => {
    Alert.alert('Supprimer le média', `Supprimer "${item.title}"?`, [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Supprimer',
        style: 'destructive',
        onPress: async () => {
          await withLoading(async () => {
            await client.models.MediaAsset.delete({ id: item.id });
            await load();
          }, 'Suppression...');
        },
      },
    ]);
  };

  if (loading) return <LoadingScreen />;

  return (
    <View style={styles.container}>
      <FlatList
        data={assets}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
        ListHeaderComponent={
          <AppButton
            title="Ajouter un média"
            onPress={() => setModal(true)}
            variant="primary"
            icon="add"
            fullWidth
            style={{ marginBottom: Spacing[4] }}
          />
        }
        ListEmptyComponent={<EmptyState title="Aucun média" icon="images-outline" />}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={[styles.mediaIcon, { backgroundColor: item.mediaType === 'VIDEO' ? Colors.secondary + '20' : Colors.primary + '20' }]}>
              <Ionicons
                name={item.mediaType === 'VIDEO' ? 'videocam' : 'image'}
                size={20}
                color={item.mediaType === 'VIDEO' ? Colors.secondary : Colors.primary}
              />
            </View>
            <View style={styles.info}>
              <Text style={styles.name}>{item.title}</Text>
              <Text style={styles.folder}>{item.folderType} • {item.mediaType}</Text>
              <Text style={styles.s3key} numberOfLines={1}>{item.storageKey}</Text>
            </View>
            <View style={styles.actions}>
              <TouchableOpacity onPress={() => handleToggle(item)}>
                <Ionicons
                  name={item.visibility === 'PUBLIC' ? 'eye' : 'eye-off'}
                  size={20}
                  color={item.visibility === 'PUBLIC' ? Colors.success : Colors.textMuted}
                />
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
              <Text style={styles.modalTitle}>Ajouter un média</Text>
              <AppInput label="Titre" value={assetTitle} onChangeText={setAssetTitle} placeholder="Banner accueil 1" />
              <AppInput label="Clé de stockage" value={storageKey} onChangeText={setStorageKey} placeholder="home-images/banner1.jpg" />
              <View>
                <Text style={styles.label}>Type</Text>
                <View style={styles.chipRow}>
                  {(['IMAGE', 'VIDEO'] as MediaType[]).map((t) => (
                    <TouchableOpacity
                      key={t}
                      style={[styles.chip, selectedMediaType === t && styles.chipActive]}
                      onPress={() => setSelectedMediaType(t)}
                    >
                      <Ionicons
                        name={t === 'IMAGE' ? 'image-outline' : 'videocam-outline'}
                        size={14}
                        color={selectedMediaType === t ? Colors.white : Colors.gray600}
                      />
                      <Text style={[styles.chipText, selectedMediaType === t && styles.chipTextActive]}>{t}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
              <View>
                <Text style={styles.label}>Dossier</Text>
                <View style={styles.chipRow}>
                  {FOLDER_TYPES.map((f) => (
                    <TouchableOpacity
                      key={f}
                      style={[styles.chip, folderType === f && styles.chipActive]}
                      onPress={() => setFolderType(f)}
                    >
                      <Text style={[styles.chipText, folderType === f && styles.chipTextActive]}>{f}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
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
  mediaIcon: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  info: { flex: 1, gap: 2 },
  name: { fontSize: FontSize.base, fontWeight: FontWeight.semibold, color: Colors.text },
  folder: { fontSize: FontSize.xs, color: Colors.textSecondary, fontWeight: FontWeight.medium },
  s3key: { fontSize: FontSize.xs, color: Colors.textMuted, fontFamily: 'monospace' },
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
  label: { fontSize: FontSize.sm, fontWeight: FontWeight.medium, color: Colors.textSecondary, marginBottom: 8 },
  chipRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.gray100,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  chipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  chipText: { fontSize: FontSize.xs, fontWeight: FontWeight.semibold, color: Colors.gray600 },
  chipTextActive: { color: Colors.white },
});
