import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../../../amplify/data/resource';
import { useAuth } from '../../context/AuthContext';
import { AppButton, LoadingScreen, StatusBadge, EmptyState } from '../../components';
import { Colors, FontSize, FontWeight, Spacing, BorderRadius, Shadow } from '../../theme';
import { useLoading } from '../../context/LoadingContext';

const client = generateClient<Schema>();

interface Props {
  route: any;
  navigation: any;
}

export function ProjectDetailScreen({ route, navigation }: Props) {
  const { projectId, name } = route.params;
  const { user, isFreelancer, isAdmin } = useAuth();
  const { withLoading } = useLoading();
  const [project, setProject] = useState<any>(null);
  const [assignment, setAssignment] = useState<any>(null);
  const [request, setRequest] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const [projResult] = await Promise.all([
        client.models.Project.get({ id: projectId }),
      ]);
      setProject(projResult.data);

      if (user) {
        const [assignResult, reqResult] = await Promise.all([
          client.models.ProjectAssignment.list({
            filter: { projectId: { eq: projectId }, freelancerId: { eq: user.userId } },
          }),
          client.models.ProjectRequest.list({
            filter: { projectId: { eq: projectId }, freelancerId: { eq: user.userId } },
          }),
        ]);
        setAssignment(assignResult.data?.[0] ?? null);
        setRequest(reqResult.data?.[0] ?? null);
      }
    } catch (err) {
      console.warn('Failed to load project:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [projectId, user]);

  useEffect(() => { load(); }, [load]);

  const onRefresh = () => { setRefreshing(true); load(); };

  const openLogin = () => {
    let currentNav: any = navigation;
    while (currentNav) {
      const state = currentNav.getState?.();
      if (state?.routeNames?.includes?.('AuthModal')) {
        currentNav.navigate('AuthModal', { screen: 'Login' });
        return;
      }
      currentNav = currentNav.getParent?.();
    }
  };

  const handleRequestProject = async () => {
    if (!user) {
      openLogin();
      return;
    }
    if (!isFreelancer) {
      Alert.alert('Accès refusé', 'Seuls les freelancers peuvent demander un projet.');
      return;
    }
    await withLoading(async () => {
      await client.models.ProjectRequest.create({
        projectId,
        freelancerId: user.userId,
        freelancerName: user.fullName,
        status: 'PENDING',
        requestedAt: new Date().toISOString(),
        message: '',
      });
      await load();
      Alert.alert('Demande envoyée', 'Votre demande a été envoyée à l\'administrateur.');
    }, 'Envoi de la demande...');
  };

  const handleSubmit = async () => {
    if (!assignment) return;
    await withLoading(async () => {
      await client.models.ProjectAssignment.update({
        id: assignment.id,
        status: 'COMPLETED',
        completedAt: new Date().toISOString(),
      });
      await load();
    }, 'Soumission...');
  };

  if (loading) return <LoadingScreen />;
  if (!project) return <EmptyState title="Projet introuvable" icon="alert-circle-outline" />;

  const DIFFICULTY_LABELS: Record<string, string> = {
    BEGINNER: 'Débutant',
    INTERMEDIATE: 'Intermédiaire',
    ADVANCED: 'Avancé',
    EXPERT: 'Expert',
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
    >
      {/* Header */}
      <View style={styles.heroCard}>
        <View style={styles.heroIcon}>
          <Ionicons name="briefcase" size={32} color={Colors.white} />
        </View>
        <View style={styles.heroText}>
          <Text style={styles.heroName}>{project.name}</Text>
          <View style={styles.heroMeta}>
            {project.difficulty ? (
              <View style={styles.diffTag}>
                <Text style={styles.diffText}>{DIFFICULTY_LABELS[project.difficulty] ?? project.difficulty}</Text>
              </View>
            ) : null}
            <StatusBadge status={project.status} size="sm" />
          </View>
        </View>
        <View style={styles.priceBox}>
          <Text style={styles.priceLabel}>Rémunération</Text>
          <Text style={styles.price}>{project.price?.toLocaleString('fr-FR')} €</Text>
        </View>
      </View>

      {/* Description */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Description</Text>
        <Text style={styles.description}>{project.publicDescription}</Text>
      </View>

      {/* Private Instructions (for assigned freelancers) */}
      {assignment && project.privateInstructions ? (
        <View style={[styles.section, styles.privateSection]}>
          <View style={styles.sectionTitleRow}>
            <Ionicons name="document-text" size={18} color={Colors.primary} />
            <Text style={styles.sectionTitle}>Instructions privées</Text>
          </View>
          <Text style={styles.description}>{project.privateInstructions}</Text>
        </View>
      ) : null}

      {/* Tags */}
      {project.tags?.length > 0 ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Compétences requises</Text>
          <View style={styles.tags}>
            {project.tags.map((tag: string) => (
              <View key={tag} style={styles.tag}>
                <Text style={styles.tagText}>{tag}</Text>
              </View>
            ))}
          </View>
        </View>
      ) : null}

      {/* Deadline */}
      {project.deadline ? (
        <View style={styles.infoRow}>
          <Ionicons name="calendar-outline" size={18} color={Colors.textMuted} />
          <Text style={styles.infoText}>
            Date limite: {new Date(project.deadline).toLocaleDateString('fr-FR', {
              day: 'numeric', month: 'long', year: 'numeric',
            })}
          </Text>
        </View>
      ) : null}

      {/* Assignment Status */}
      {assignment ? (
        <View style={styles.assignmentCard}>
          <Text style={styles.assignmentTitle}>Votre mission</Text>
          <StatusBadge status={assignment.status} />
          {assignment.adminFeedback ? (
            <View style={styles.feedbackBox}>
              <Text style={styles.feedbackLabel}>Feedback admin :</Text>
              <Text style={styles.feedbackText}>{assignment.adminFeedback}</Text>
            </View>
          ) : null}
          {assignment.gradePercentage != null ? (
            <View style={styles.gradeRow}>
              <Ionicons name="trophy" size={18} color={Colors.accent} />
              <Text style={styles.gradeText}>Note: {assignment.gradePercentage}%</Text>
            </View>
          ) : null}
          {assignment.status === 'IN_PROGRESS' ? (
            <AppButton
              title="Soumettre le projet"
              onPress={handleSubmit}
              variant="primary"
              fullWidth
            />
          ) : null}
        </View>
      ) : request ? (
        <View style={styles.requestCard}>
          <Ionicons name="time-outline" size={24} color={Colors.warning} />
          <Text style={styles.requestText}>
            Votre demande est en cours de traitement (statut: {request.status})
          </Text>
          <StatusBadge status={request.status} />
        </View>
      ) : isFreelancer ? (
        <AppButton
          title="Demander ce projet"
          onPress={handleRequestProject}
          variant="primary"
          fullWidth
          size="lg"
          icon={<Ionicons name="paper-plane-outline" size={18} color={Colors.white} />}
        />
      ) : !user ? (
        <AppButton
          title="Se connecter pour postuler"
          onPress={openLogin}
          variant="outline"
          fullWidth
          size="lg"
        />
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: Spacing[4], gap: Spacing[4], paddingBottom: Spacing[10] },
  heroCard: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius['2xl'],
    padding: Spacing[5],
    gap: Spacing[3],
    ...Shadow.lg,
  },
  heroIcon: {
    width: 56,
    height: 56,
    borderRadius: BorderRadius.xl,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroText: { gap: 8 },
  heroName: {
    fontSize: FontSize['2xl'],
    fontWeight: FontWeight.bold,
    color: Colors.white,
  },
  heroMeta: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  diffTag: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  diffText: {
    fontSize: FontSize.xs,
    color: Colors.white,
    fontWeight: FontWeight.semibold,
  },
  priceBox: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: BorderRadius.xl,
    padding: 14,
    alignItems: 'center',
  },
  priceLabel: {
    fontSize: FontSize.xs,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: FontWeight.medium,
  },
  price: {
    fontSize: FontSize['3xl'],
    fontWeight: FontWeight.extrabold,
    color: Colors.white,
  },
  section: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    padding: Spacing[4],
    gap: Spacing[3],
    ...Shadow.sm,
  },
  privateSection: {
    borderWidth: 1.5,
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryMuted,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.text,
  },
  description: {
    fontSize: FontSize.base,
    color: Colors.textSecondary,
    lineHeight: 26,
  },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tag: {
    backgroundColor: Colors.gray100,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
  },
  tagText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    fontWeight: FontWeight.medium,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 4,
  },
  infoText: {
    fontSize: FontSize.base,
    color: Colors.textSecondary,
  },
  assignmentCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    padding: Spacing[4],
    gap: Spacing[3],
    borderWidth: 1.5,
    borderColor: Colors.border,
    ...Shadow.sm,
  },
  assignmentTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.text,
  },
  feedbackBox: {
    backgroundColor: Colors.gray50,
    borderRadius: BorderRadius.lg,
    padding: 12,
    gap: 4,
  },
  feedbackLabel: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    color: Colors.textSecondary,
  },
  feedbackText: {
    fontSize: FontSize.base,
    color: Colors.text,
  },
  gradeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  gradeText: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
    color: Colors.accent,
  },
  requestCard: {
    backgroundColor: Colors.warningBg,
    borderRadius: BorderRadius.xl,
    padding: Spacing[4],
    alignItems: 'center',
    gap: Spacing[3],
    borderWidth: 1,
    borderColor: Colors.warning,
  },
  requestText: {
    fontSize: FontSize.base,
    color: Colors.text,
    textAlign: 'center',
    lineHeight: 22,
  },
});
