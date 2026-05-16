import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../context/AuthContext';
import { AuthNavigator } from './AuthNavigator';
import { FreelancerNavigator } from './FreelancerNavigator';
import { AdminNavigator } from './AdminNavigator';
import { LoadingScreen } from '../components';

const Stack = createNativeStackNavigator();

export function RootNavigator() {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingScreen message="Chargement..." />;
  }

  // Admin gets their own navigator
  if (user?.role === 'ADMIN') {
    return (
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="AdminRoot" component={AdminNavigator} />
      </Stack.Navigator>
    );
  }

  // Authenticated freelancer or public user → FreelancerNavigator (handles guest state gracefully)
  if (user) {
    return (
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="FreelancerRoot" component={FreelancerNavigator} />
        <Stack.Screen name="AuthModal" component={AuthNavigator} />
      </Stack.Navigator>
    );
  }

  // Unauthenticated → show auth + public content accessible
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="PublicRoot" component={FreelancerNavigator} />
      <Stack.Screen name="AuthModal" component={AuthNavigator} />
    </Stack.Navigator>
  );
}
