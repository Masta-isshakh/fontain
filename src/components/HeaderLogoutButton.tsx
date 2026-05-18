import React, { useState } from 'react';
import { Alert, TouchableOpacity, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { Colors, Spacing } from '../theme';
import { ConfirmDialog } from './ConfirmDialog';

export function HeaderLogoutButton() {
  const { logout, user } = useAuth();
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  if (!user) {
    return null;
  }

  const doLogout = () => {
    setIsLoggingOut(true);
    void logout().then(() => {
      setShowConfirm(false);
    }).catch((err: any) => {
      if (Platform.OS === 'web') {
        window.alert(err?.message ?? 'La déconnexion a échoué.');
      } else {
        Alert.alert('Erreur', err?.message ?? 'La déconnexion a échoué.');
      }
    }).finally(() => {
      setIsLoggingOut(false);
    });
  };

  return (
    <>
      <TouchableOpacity
        onPress={() => setShowConfirm(true)}
        style={{ paddingHorizontal: Spacing[2], paddingVertical: Spacing[1] }}
        accessibilityRole="button"
        accessibilityLabel="Se déconnecter"
      >
        <Ionicons name="log-out-outline" size={22} color={Colors.primary} />
      </TouchableOpacity>

      <ConfirmDialog
        visible={showConfirm}
        type="danger"
        title="Se déconnecter ?"
        message="Vous allez revenir à la page de connexion."
        confirmLabel="Se déconnecter"
        cancelLabel="Rester connecté"
        onConfirm={doLogout}
        onCancel={() => {
          if (!isLoggingOut) {
            setShowConfirm(false);
          }
        }}
        loading={isLoggingOut}
      />
    </>
  );
}