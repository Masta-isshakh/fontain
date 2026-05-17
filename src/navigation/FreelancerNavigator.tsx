import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { Colors, FontSize, FontWeight } from '../theme';
import { HeaderLogoutButton } from '../components';

// Public / shared screens
import { HomeScreen } from '../screens/public/HomeScreen';
import { CoursesScreen } from '../screens/public/CoursesScreen';
import { ProjectsScreen } from '../screens/public/ProjectsScreen';
import { PlaylistDetailScreen } from '../screens/public/PlaylistDetailScreen';
import { VideoPlayerScreen } from '../screens/public/VideoPlayerScreen';
import { ProjectDetailScreen } from '../screens/public/ProjectDetailScreen';

// Freelancer screens
import { ProfileScreen } from '../screens/freelancer/ProfileScreen';
import { MyProjectsScreen } from '../screens/freelancer/MyProjectsScreen';
import { MyExamsScreen } from '../screens/freelancer/MyExamsScreen';
import { LoyaltyScreen } from '../screens/freelancer/LoyaltyScreen';
import { ChatScreen } from '../screens/freelancer/ChatScreen';
import { PerformanceScreen } from '../screens/freelancer/PerformanceScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const TAB_ACTIVE = Colors.primary;
const TAB_INACTIVE = Colors.gray400;
const stackScreenOptions = {
  headerTitleStyle: { fontWeight: FontWeight.bold as any },
  headerRight: () => <HeaderLogoutButton />,
};

// --- Nested Stack Navigators for each tab ---

function HomeStack() {
  return (
    <Stack.Navigator screenOptions={stackScreenOptions}>
      <Stack.Screen name="HomeMain" component={HomeScreen} options={{ title: 'Accueil' }} />
    </Stack.Navigator>
  );
}

function CoursesStack() {
  return (
    <Stack.Navigator screenOptions={stackScreenOptions}>
      <Stack.Screen name="CoursesList" component={CoursesScreen} options={{ title: 'Formations' }} />
      <Stack.Screen name="PlaylistDetail" component={PlaylistDetailScreen} options={{ title: 'Playlist' }} />
      <Stack.Screen name="VideoPlayer" component={VideoPlayerScreen} options={{ title: 'Vidéo', headerShown: false }} />
    </Stack.Navigator>
  );
}

function ProjectsStack() {
  return (
    <Stack.Navigator screenOptions={stackScreenOptions}>
      <Stack.Screen name="ProjectsList" component={ProjectsScreen} options={{ title: 'Projets' }} />
      <Stack.Screen name="ProjectDetail" component={ProjectDetailScreen} options={{ title: 'Projet' }} />
    </Stack.Navigator>
  );
}

function ProfileStack() {
  return (
    <Stack.Navigator screenOptions={stackScreenOptions}>
      <Stack.Screen name="ProfileMain" component={ProfileScreen} options={{ title: 'Profil' }} />
      <Stack.Screen name="MyProjects" component={MyProjectsScreen} options={{ title: 'Mes projets' }} />
      <Stack.Screen name="MyExams" component={MyExamsScreen} options={{ title: 'Mes examens' }} />
      <Stack.Screen name="Loyalty" component={LoyaltyScreen} options={{ title: 'Fidélité' }} />
      <Stack.Screen name="Chat" component={ChatScreen} options={{ title: 'Support' }} />
      <Stack.Screen name="Performance" component={PerformanceScreen} options={{ title: 'Performances' }} />
    </Stack.Navigator>
  );
}

// --- Main Freelancer Navigator (bottom tabs) ---
export function FreelancerNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: TAB_ACTIVE,
        tabBarInactiveTintColor: TAB_INACTIVE,
        tabBarStyle: {
          borderTopWidth: 1,
          borderTopColor: Colors.border,
          backgroundColor: Colors.surface,
          height: 60,
          paddingBottom: 8,
          paddingTop: 6,
        },
        tabBarLabelStyle: {
          fontSize: FontSize.xs,
          fontWeight: FontWeight.medium as any,
        },
        tabBarIcon: ({ focused, color, size }) => {
          const icons: Record<string, [string, string]> = {
            HomeTab: ['home', 'home-outline'],
            CoursesTab: ['play-circle', 'play-circle-outline'],
            ProjectsTab: ['briefcase', 'briefcase-outline'],
            ProfileTab: ['person', 'person-outline'],
          };
          const [active, inactive] = icons[route.name] ?? ['ellipse', 'ellipse-outline'];
          return <Ionicons name={(focused ? active : inactive) as any} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="HomeTab" component={HomeStack} options={{ title: 'Accueil' }} />
      <Tab.Screen name="CoursesTab" component={CoursesStack} options={{ title: 'Formations' }} />
      <Tab.Screen name="ProjectsTab" component={ProjectsStack} options={{ title: 'Projets' }} />
      <Tab.Screen name="ProfileTab" component={ProfileStack} options={{ title: 'Profil' }} />
    </Tab.Navigator>
  );
}
