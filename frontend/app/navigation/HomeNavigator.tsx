import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';

import DashboardScreen from '@/screens/dashboard/DashboardScreen';
import TransactionDetailsScreen from '@/screens/transactions/TransactionDetailsScreen';
import CategoryDetailsScreen from '@/screens/categories/CategoryDetailsScreen';
import { defaultScreenOptions, screenTransitions } from './transitions';

const Stack = createStackNavigator();

export default function HomeNavigator() {
  return (
    <Stack.Navigator screenOptions={defaultScreenOptions}>
      <Stack.Screen 
        name="Dashboard" 
        component={DashboardScreen}
        options={screenTransitions.Dashboard}
      />
      <Stack.Screen 
        name="TransactionDetails"
        component={(props) => <TransactionDetailsScreen {...props} />}
        options={screenTransitions.TransactionDetails}
      />
      <Stack.Screen 
        name="CategoryDetails" 
        component={CategoryDetailsScreen}
        options={screenTransitions.CategoryDetails}
      />
    </Stack.Navigator>
  );
}