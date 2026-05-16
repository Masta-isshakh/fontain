import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { FontWeight } from '../theme';

// Admin screens
import { AdminDashboardScreen } from '../screens/admin/AdminDashboardScreen';
import { AdminUsersScreen } from '../screens/admin/AdminUsersScreen';
import { AdminCoursesScreen } from '../screens/admin/AdminCoursesScreen';
import { AdminProjectsScreen } from '../screens/admin/AdminProjectsScreen';
import { AdminAssignmentsScreen } from '../screens/admin/AdminAssignmentsScreen';
import { AdminExamsScreen } from '../screens/admin/AdminExamsScreen';
import { AdminMediaScreen } from '../screens/admin/AdminMediaScreen';
import { AdminChatScreen } from '../screens/admin/AdminChatScreen';
import { AdminLoyaltyScreen } from '../screens/admin/AdminLoyaltyScreen';
import { AdminPerformanceScreen } from '../screens/admin/AdminPerformanceScreen';
import { AdminAuditLogScreen } from '../screens/admin/AdminAuditLogScreen';

const Stack = createNativeStackNavigator();

export function AdminNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerTitleStyle: { fontWeight: FontWeight.bold as any },
      }}
    >
      <Stack.Screen
        name="AdminDashboard"
        component={AdminDashboardScreen}
        options={{ title: 'Administration' }}
      />
      <Stack.Screen
        name="AdminUsers"
        component={AdminUsersScreen}
        options={{ title: 'Utilisateurs' }}
      />
      <Stack.Screen
        name="AdminCourses"
        component={AdminCoursesScreen}
        options={{ title: 'Formations' }}
      />
      <Stack.Screen
        name="AdminProjects"
        component={AdminProjectsScreen}
        options={{ title: 'Projets' }}
      />
      <Stack.Screen
        name="AdminAssignments"
        component={AdminAssignmentsScreen}
        options={{ title: 'Assignments' }}
      />
      <Stack.Screen
        name="AdminExams"
        component={AdminExamsScreen}
        options={{ title: 'Examens' }}
      />
      <Stack.Screen
        name="AdminMedia"
        component={AdminMediaScreen}
        options={{ title: 'Médias' }}
      />
      <Stack.Screen
        name="AdminChat"
        component={AdminChatScreen}
        options={{ title: 'Messagerie' }}
      />
      <Stack.Screen
        name="AdminLoyalty"
        component={AdminLoyaltyScreen}
        options={{ title: 'Fidélité' }}
      />
      <Stack.Screen
        name="AdminPerformance"
        component={AdminPerformanceScreen}
        options={{ title: 'Performances' }}
      />
      <Stack.Screen
        name="AdminAuditLog"
        component={AdminAuditLogScreen}
        options={{ title: 'Audit Log' }}
      />
    </Stack.Navigator>
  );
}
