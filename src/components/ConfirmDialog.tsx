import React, { useEffect, useRef } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Easing,
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
  const backdropOpacity = useRef(new Animated.Value(0)).current;
  const dialogOpacity = useRef(new Animated.Value(0)).current;
  const dialogScale = useRef(new Animated.Value(0.94)).current;
  const dialogTranslateY = useRef(new Animated.Value(18)).current;
  const iconScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!visible) {
      backdropOpacity.setValue(0);
      dialogOpacity.setValue(0);
      dialogScale.setValue(0.94);
      dialogTranslateY.setValue(18);
      iconScale.setValue(1);
      return;
    }

    Animated.parallel([
      Animated.timing(backdropOpacity, {
        toValue: 1,
        duration: 230,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(dialogOpacity, {
        toValue: 1,
        duration: 260,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.spring(dialogScale, {
        toValue: 1,
        friction: 7,
        tension: 90,
        useNativeDriver: true,
      }),
      Animated.timing(dialogTranslateY, {
        toValue: 0,
        duration: 260,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();

    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(iconScale, {
          toValue: 1.05,
          duration: 700,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(iconScale, {
          toValue: 1,
          duration: 700,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ])
    );

    pulseLoop.start();
    return () => {
      pulseLoop.stop();
      iconScale.setValue(1);
    };
  }, [
    visible,
    backdropOpacity,
    dialogOpacity,
    dialogScale,
    dialogTranslateY,
    iconScale,
  ]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
    >
      <Animated.View style={[styles.overlay, { opacity: backdropOpacity }]}>
        <TouchableOpacity
          style={styles.overlayTouch}
          activeOpacity={1}
          onPress={() => {
            if (!loading) {
              onCancel();
            }
          }}
        >
          <Animated.View
            style={[
              styles.dialog,
              {
                opacity: dialogOpacity,
                transform: [{ scale: dialogScale }, { translateY: dialogTranslateY }],
              },
            ]}
          >
          <View style={styles.glowTop} />
          <View style={styles.glowRight} />

            <Animated.View
              style={[
                styles.iconWrap,
                {
                  backgroundColor: ICON_COLORS[type] + '20',
                  transform: [{ scale: iconScale }],
                },
              ]}
            >
            <Ionicons name={ICONS[type]} size={34} color={ICON_COLORS[type]} />
            </Animated.View>

            <View style={styles.content}>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.message}>{message}</Text>
            </View>

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
          </Animated.View>
        </TouchableOpacity>
      </Animated.View>
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
  overlayTouch: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    flex: 1,
  },
  dialog: {
    position: 'relative',
    overflow: 'hidden',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius['2xl'],
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: 20,
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.gray200,
    ...Shadow.xl,
  },
  glowTop: {
    position: 'absolute',
    top: -120,
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: Colors.primaryMuted,
    opacity: 0.8,
  },
  glowRight: {
    position: 'absolute',
    right: -70,
    top: 40,
    width: 130,
    height: 130,
    borderRadius: 65,
    backgroundColor: Colors.secondaryMuted,
    opacity: 0.85,
  },
  iconWrap: {
    width: 78,
    height: 78,
    borderRadius: 39,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.gray200,
    marginBottom: 16,
  },
  content: {
    width: '100%',
    alignItems: 'center',
    gap: 10,
    marginBottom: 20,
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
  btn: { flex: 1, borderRadius: BorderRadius.xl },
});
