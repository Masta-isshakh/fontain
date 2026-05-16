import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  Alert,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../../../amplify/data/resource';
import { LoadingScreen, EmptyState, AppButton, AppInput, StatusBadge } from '../../components';
import { Colors, FontSize, FontWeight, Spacing, BorderRadius, Shadow } from '../../theme';
import { useLoading } from '../../context/LoadingContext';

const client = generateClient<Schema>();

interface Props { navigation: any }

export function AdminProjectsScreen({ navigation }: Props) {
  const { withLoading } = useLoading();
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [deadline, setDeadline] = useState('');
  const [difficulty, setDifficulty] = useState('MEDIUM');

  const DIFFICULTIES = ['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT'];

  const load = useCallback(async () => {
    try {
      const result = await client.models.Project.list();
      setProjects(
        (result.data ?? []).sort((a, b) => new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime())
      );
    } catch {}
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { load(); }, [load]);
  const onRefresh = () => { setRefreshing(true); load(); };

  const openCreate = () => {
    setEditing(null);
    setTitle(''); setDescription(''); setPrice(''); setDeadline(''); setDifficulty('INTERMEDIATE');
    setModal(true);
  };

  const openEdit = (item: any) => {
    setEditing(item);
    setTitle(item.name ?? '');
    setDescription(item.publicDescription ?? '');
    setPrice(item.price != null ? String(item.price) : '');
    setDeadline(item.deadline ?? '');
    setDifficulty(item.difficulty ?? 'INTERMEDIATE');
    setModal(true);
  };

  const handleSave = async () => {
    if (!title.trim()) { Alert.alert('Erreur', 'Le nom est requis'); return; }
    await withLoading(async () => {
      const data: any = {
        name: title.trim(),
        publicDescription: description.trim() || undefined,
        price: price ? parseFloat(price) : undefined,
        deadline: deadline.trim() || undefined,
        difficulty,
      };
      if (editing) {
        await client.models.Project.update({ id: editing.id, ...data });
      } else {
        await client.models.Project.create({ ...data, status: 'DRAFT' });
      }
      setModal(false);
      await load();
    }, 'Enregistrement...');
  };

  const handleTogglePublish = async (item: any) => {
    const newStatus = item.status === 'PUBLISHED' ? 'DRAFT' : 'PUBLISHED';
    await withLoading(async () => {
      await client.models.Project.update({ id: item.id, status: newStatus });
      await load();
    }, 'Mise à jour...');
  };

  const handleDelete = (item: any) => {
    Alert.alert(
      'Supprimer le projet',
      `Supprimer "${item.name}"?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            await withLoading(async () => {
              await client.models.Project.delete({ id: item.id });
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
        data={projects}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
        ListHeaderComponent={
          <AppButton
            title="Nouveau projet"
            onPress={openCreate}
            variant="primary"
            icon="add"
            fullWidth
            style={{ marginBottom: Spacing[4] }}
          />
        }
        ListEmptyComponent={<EmptyState title="Aucun projet" icon="briefcase-outline" />}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.cardTop}>
              <View style={styles.cardInfo}>
                <Text style={styles.cardTitle}>{item.name}</Text>
                <View style={styles.row}>
                  <StatusBadge status={item.status} size="sm" />
                  <Text style={styles.price}>
                    {item.price != null ? `${item.price.toLocaleString('fr-FR')} €` : '—'}
                  </Text>
                  <Text style={styles.diff}>{item.difficulty}</Text>
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
            <TouchableOpacity
              style={[
                styles.publishBtn,
                { backgroundColor: item.status === 'PUBLISHED' ? Colors.warning + '20' : Colors.success + '20' }
              ]}
              onPress={() => handleTogglePublish(item)}
            >
              <Ionicons
                name={item.status === 'PUBLISHED' ? 'eye-off-outline' : 'eye-outline'}
                size={14}
                color={item.status === 'PUBLISHED' ? Colors.warning : Colors.success}
              />
              <Text style={[
                styles.publishBtnText,
                { color: item.status === 'PUBLISHED' ? Colors.warning : Colors.success }
              ]}>
                {item.status === 'PUBLISHED' ? 'Dépublier' : 'Publier'}
              </Text>
            </TouchableOpacity>
          </View>
        )}
        ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
      />

      <Modal visible={modal} transparent animationType="slide">
        <View style={styles.overlay}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>{editing ? 'Modifier le projet' : 'Nouveau projet'}</Text>
              <AppInput label="Titre" value={title} onChangeText={setTitle} placeholder="Titre du projet" />
              <AppInput label="Description" value={description} onChangeText={setDescription} placeholder="..." multiline />
              <AppInput label="Prix (EUR)" value={price} onChangeText={setPrice} keyboardType="numeric" placeholder="Ex: 500" />
              <AppInput label="Deadline (ISO date)" value={deadline} onChangeText={setDeadline} placeholder="2024-12-31" />
              <View>
                <Text style={styles.diffLabel}>Difficulté</Text>
                <View style={styles.diffRow}>
                  {DIFFICULTIES.map((d) => (
                    <TouchableOpacity
                      key={d}
                      style={[styles.diffBtn, difficulty === d && styles.diffBtnActive]}
                      onPress={() => setDifficulty(d)}
                    >
                      <Text style={[styles.diffBtnText, difficulty === d && styles.diffBtnTextActive]}>{d}</Text>
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
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    padding: Spacing[4],
    gap: Spacing[3],
    ...Shadow.sm,
  },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing[3] },
  cardInfo: { flex: 1, gap: 6 },
  cardTitle: { fontSize: FontSize.base, fontWeight: FontWeight.semibold, color: Colors.text },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  price: { fontSize: FontSize.sm, fontWeight: FontWeight.bold, color: Colors.accent },
  diff: { fontSize: FontSize.xs, color: Colors.textMuted, fontWeight: FontWeight.medium },
  actions: { flexDirection: 'row', gap: Spacing[3] },
  publishBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    padding: 8,
    borderRadius: BorderRadius.lg,
    alignSelf: 'flex-start',
  },
  publishBtnText: { fontSize: FontSize.xs, fontWeight: FontWeight.semibold },
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
  diffLabel: { fontSize: FontSize.sm, fontWeight: FontWeight.medium, color: Colors.text, marginBottom: 8 },
  diffRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  diffBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.gray100,
  },
  diffBtnActive: { backgroundColor: Colors.primary },
  diffBtnText: { fontSize: FontSize.xs, fontWeight: FontWeight.semibold, color: Colors.gray600 },
  diffBtnTextActive: { color: Colors.white },
});
