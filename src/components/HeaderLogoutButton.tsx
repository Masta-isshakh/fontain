import React from 'react';
import { Alert, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { Colors, Spacing } from '../theme';

export function HeaderLogoutButton() {
  const { logout, user } = useAuth();

  if (!user) {
    return null;
  }

  const handleLogout = () => {
    Alert.alert('Déconnexion', 'Êtes-vous sûr de vouloir vous déconnecter?', [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Déconnexion', style: 'destructive', onPress: () => void logout() },
    ]);
  };

  return (
    <TouchableOpacity
      onPress={handleLogout}
      style={{ paddingHorizontal: Spacing[2], paddingVertical: Spacing[1] }}
      accessibilityRole="button"
      accessibilityLabel="Se déconnecter"
    >
      <Ionicons name="log-out-outline" size={22} color={Colors.primary} />
    </TouchableOpacity>
  );
}