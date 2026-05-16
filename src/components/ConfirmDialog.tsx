import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, FontSize, FontWeight, BorderRadius, Shadow } from '../theme';
import { AppButton } from './AppButton';

interface Props {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  type?: 'info' | 'danger' | 'success';
  loading?: boolean;
}

const ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  info: 'information-circle',
  danger: 'warning',
  success: 'checkmark-circle',
};

const ICON_COLORS: Record<string, string> = {
  info: Colors.info,
  danger: Colors.danger,
  success: Colors.success,
};

export function ConfirmDialog({
  visible,
  title,
  message,
  confirmLabel = 'Confirmer',
  cancelLabel = 'Annuler',
  onConfirm,
  onCancel,
  type = 'info',
  loading = false,
}: Props) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
    >
      <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={onCancel}>
        <TouchableOpacity activeOpacity={1} style={styles.dialog}>
          <View style={[styles.iconWrap, { backgroundColor: ICON_COLORS[type] + '20' }]}>
            <Ionicons name={ICONS[type]} size={32} color={ICON_COLORS[type]} />
          </View>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>
          <View style={styles.actions}>
            <AppButton
              title={cancelLabel}
              onPress={onCancel}
              variant="outline"
              style={styles.btn}
              disabled={loading}
            />
            <AppButton
              title={confirmLabel}
              onPress={onConfirm}
              variant={type === 'danger' ? 'danger' : 'primary'}
              style={styles.btn}
              loading={loading}
            />
          </View>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: Colors.overlay,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  dialog: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius['2xl'],
    padding: 24,
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
    gap: 16,
    ...Shadow.xl,
  },
  iconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
    color: Colors.text,
    textAlign: 'center',
  },
  message: {
    fontSize: FontSize.base,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  btn: { flex: 1 },
});
