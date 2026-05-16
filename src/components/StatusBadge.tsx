import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, FontSize, FontWeight, BorderRadius } from '../theme';

type StatusType =
  | 'PENDING'
  | 'ACTIVE'
  | 'INACTIVE'
  | 'SUSPENDED'
  | 'APPROVED'
  | 'REJECTED'
  | 'REQUESTED'
  | 'SCHEDULED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'UNDER_REVIEW'
  | 'UNDER_VERIFICATION'
  | 'REVISION_REQUESTED'
  | 'PASSED'
  | 'FAILED'
  | 'CANCELLED'
  | 'OPEN'
  | 'DRAFT'
  | 'PUBLISHED'
  | 'ARCHIVED'
  | 'BRONZE'
  | 'SILVER'
  | 'GOLD'
  | 'PLATINUM'
  | 'ELITE';

const STATUS_MAP: Record<StatusType, { label: string; bg: string; color: string }> = {
  PENDING: { label: 'En attente', bg: Colors.warningBg, color: Colors.warning },
  ACTIVE: { label: 'Actif', bg: Colors.successBg, color: Colors.success },
  INACTIVE: { label: 'Inactif', bg: Colors.gray100, color: Colors.gray500 },
  SUSPENDED: { label: 'Suspendu', bg: Colors.dangerBg, color: Colors.danger },
  APPROVED: { label: 'Approuvé', bg: Colors.successBg, color: Colors.success },
  REJECTED: { label: 'Rejeté', bg: Colors.dangerBg, color: Colors.danger },
  REQUESTED: { label: 'Demandé', bg: Colors.infoBg, color: Colors.info },
  SCHEDULED: { label: 'Planifié', bg: Colors.secondaryMuted, color: Colors.secondary },
  IN_PROGRESS: { label: 'En cours', bg: Colors.infoBg, color: Colors.info },
  COMPLETED: { label: 'Complété', bg: Colors.successBg, color: Colors.success },
  UNDER_REVIEW: { label: 'En révision', bg: Colors.warningBg, color: Colors.warning },
  UNDER_VERIFICATION: { label: 'Vérification', bg: Colors.warningBg, color: Colors.warning },
  REVISION_REQUESTED: { label: 'Révision demandée', bg: Colors.dangerBg, color: Colors.danger },
  PASSED: { label: 'Réussi', bg: Colors.successBg, color: Colors.success },
  FAILED: { label: 'Échoué', bg: Colors.dangerBg, color: Colors.danger },
  CANCELLED: { label: 'Annulé', bg: Colors.gray100, color: Colors.gray500 },
  OPEN: { label: 'Ouvert', bg: Colors.successBg, color: Colors.success },
  DRAFT: { label: 'Brouillon', bg: Colors.gray100, color: Colors.gray500 },
  PUBLISHED: { label: 'Publié', bg: Colors.successBg, color: Colors.success },
  ARCHIVED: { label: 'Archivé', bg: Colors.gray100, color: Colors.gray500 },
  BRONZE: { label: 'Bronze', bg: '#FDF3E7', color: Colors.bronze },
  SILVER: { label: 'Argent', bg: '#F0F0F0', color: Colors.silver },
  GOLD: { label: 'Or', bg: '#FFFDE7', color: Colors.gold },
  PLATINUM: { label: 'Platine', bg: '#F5F5F5', color: '#888' },
  ELITE: { label: 'Elite', bg: Colors.secondaryMuted, color: Colors.elite },
};

interface Props {
  status: StatusType | string;
  size?: 'sm' | 'md';
}

export function StatusBadge({ status, size = 'md' }: Props) {
  const config = STATUS_MAP[status as StatusType] ?? {
    label: status,
    bg: Colors.gray100,
    color: Colors.gray500,
  };
  return (
    <View
      style={[
        styles.badge,
        { backgroundColor: config.bg },
        size === 'sm' && styles.sm,
      ]}
    >
      <Text
        style={[
          styles.text,
          { color: config.color },
          size === 'sm' && styles.textSm,
        ]}
      >
        {config.label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
    alignSelf: 'flex-start',
  },
  sm: { paddingHorizontal: 8, paddingVertical: 3 },
  text: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold,
  },
  textSm: { fontSize: 10 },
});
