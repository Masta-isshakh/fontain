import 'react-native-gesture-handler';
import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { Amplify } from 'aws-amplify';
import amplifyOutputs from './amplify_outputs.json';

import { LoadingProvider } from './src/context/LoadingContext';
import { AuthProvider } from './src/context/AuthContext';
import { RootNavigator } from './src/navigation';

Amplify.configure(amplifyOutputs);

export default function App() {
  return (
    <SafeAreaProvider>
      <LoadingProvider>
        <AuthProvider>
          <NavigationContainer>
            <StatusBar style="auto" />
            <RootNavigator />
          </NavigationContainer>
        </AuthProvider>
      </LoadingProvider>
    </SafeAreaProvider>
  );
}
