import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { useAuth } from '@/hooks/useAuth';
import AuthNavigator from './AuthNavigator';
import MainNavigator from './MainNavigator';
import LoadingScreen from '@/screens/LoadingScreen';

const Stack = createStackNavigator();

export default function AppNavigator() {
  const { isAuthenticated, isLoading } = useAuth();

  console.log('[NAV] AppNavigator render - isLoading:', isLoading, 'isAuthenticated:', isAuthenticated);

  if (isLoading) {
    console.log('[NAV] Showing LoadingScreen');
    return <LoadingScreen />;
  }

  if (isAuthenticated) {
    console.log('[NAV] User authenticated - showing MainNavigator');
  } else {
    console.log('[NAV] User not authenticated - showing AuthNavigator');
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {isAuthenticated ? (
        <Stack.Screen name="Main" component={MainNavigator} />
      ) : (
        <Stack.Screen name="Auth" component={AuthNavigator} />
      )}
    </Stack.Navigator>
  );
}