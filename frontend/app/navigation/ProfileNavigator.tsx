import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { TransitionPresets } from '@react-navigation/stack';

import ProfileScreen from '@/screens/profile/ProfileScreen';
import SettingsScreen from '@/screens/profile/SettingsScreen';
import CategoriesScreen from '@/screens/categories/CategoriesScreen';
import BudgetScreen from '@/screens/budget/BudgetScreen';
import ExportScreen from '@/screens/export/ExportScreen';
import ChangePasswordScreen from '@/screens/auth/ChangePasswordScreen';
import OTPChangePasswordScreen from '@/screens/auth/OTPChangePasswordScreen';

const Stack = createStackNavigator();

export default function ProfileNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        ...TransitionPresets.SlideFromRightIOS,
        gestureEnabled: true,
      }}
    >
      <Stack.Screen name="ProfileHome" component={ProfileScreen} />
      <Stack.Screen name="Settings" component={SettingsScreen} />
      <Stack.Screen name="Categories" component={CategoriesScreen} />
      <Stack.Screen name="Budget" component={BudgetScreen} />
      <Stack.Screen name="Export" component={ExportScreen} />
      <Stack.Screen 
        name="ChangePassword" 
        component={ChangePasswordScreen}
        options={{ 
          headerShown: true,
          title: 'Change Password',
          ...TransitionPresets.SlideFromRightIOS
        }}
      />
      <Stack.Screen 
        name="OTPChangePassword" 
        component={OTPChangePasswordScreen}
        options={{ 
          headerShown: true,
          title: 'Change Password with OTP',
          ...TransitionPresets.SlideFromRightIOS
        }}
      />
    </Stack.Navigator>
  );
}