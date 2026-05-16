import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { StatusBadge } from './StatusBadge';
import { Colors, FontSize, FontWeight, BorderRadius, Shadow } from '../theme';

interface ProjectCardProps {
  name: string;
  category?: string;
  price: number;
  publicDescription: string;
  difficulty?: string;
  status?: string;
  deadline?: string;
  onPress?: () => void;
  showStatus?: boolean;
  tags?: string[];
}

const DIFFICULTY_COLORS: Record<string, string> = {
  BEGINNER: Colors.success,
  INTERMEDIATE: Colors.accent,
  ADVANCED: Colors.secondary,
  EXPERT: Colors.danger,
};

const DIFFICULTY_LABELS: Record<string, string> = {
  BEGINNER: 'Débutant',
  INTERMEDIATE: 'Intermédiaire',
  ADVANCED: 'Avancé',
  EXPERT: 'Expert',
};

export function ProjectCard({
  name,
  category,
  price,
  publicDescription,
  difficulty,
  status,
  deadline,
  onPress,
  showStatus = false,
  tags,
}: ProjectCardProps) {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.85} style={styles.card}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          {category ? (
            <Text style={styles.category}>{category}</Text>
          ) : null}
          <Text style={styles.name} numberOfLines={2}>{name}</Text>
        </View>
        <View style={styles.priceContainer}>
          <Text style={styles.price}>{price.toLocaleString('fr-FR')} €</Text>
        </View>
      </View>

      <Text style={styles.description} numberOfLines={3}>{publicDescription}</Text>

      <View style={styles.footer}>
        <View style={styles.tags}>
          {difficulty ? (
            <View style={[styles.difficultyTag, { backgroundColor: (DIFFICULTY_COLORS[difficulty] || Colors.gray300) + '20' }]}>
              <Text style={[styles.difficultyText, { color: DIFFICULTY_COLORS[difficulty] || Colors.gray600 }]}>
                {DIFFICULTY_LABELS[difficulty] || difficulty}
              </Text>
            </View>
          ) : null}
          {tags?.slice(0, 2).map((tag) => (
            <View key={tag} style={styles.tag}>
              <Text style={styles.tagText}>{tag}</Text>
            </View>
          ))}
        </View>
        <View style={styles.footerRight}>
          {showStatus && status ? (
            <StatusBadge status={status} size="sm" />
          ) : null}
          {deadline ? (
            <View style={styles.deadline}>
              <Ionicons name="calendar-outline" size={12} color={Colors.textMuted} />
              <Text style={styles.deadlineText}>{deadline}</Text>
            </View>
          ) : null}
          <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    padding: 16,
    gap: 12,
    ...Shadow.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
  },
  headerLeft: { flex: 1, gap: 4 },
  category: {
    fontSize: FontSize.xs,
    color: Colors.primary,
    fontWeight: FontWeight.semibold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  name: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
    color: Colors.text,
  },
  priceContainer: {
    backgroundColor: Colors.primaryMuted,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: BorderRadius.lg,
  },
  price: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
    color: Colors.primary,
  },
  description: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  tags: { flexDirection: 'row', gap: 6, flexWrap: 'wrap', flex: 1 },
  difficultyTag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
  },
  difficultyText: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold,
  },
  tag: {
    backgroundColor: Colors.gray100,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
  },
  tagText: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
  },
  footerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  deadline: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  deadlineText: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
  },
});
