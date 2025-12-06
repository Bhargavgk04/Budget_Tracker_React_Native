import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { TransitionPresets } from '@react-navigation/stack';

import AddTransactionScreen from '@/screens/transactions/AddTransactionScreen';
import CategoryPickerScreen from '@/screens/categories/CategoryPickerScreen';
import RecurringPaymentScreen from '@/screens/recurring/RecurringPaymentScreen';

const Stack = createStackNavigator();

export default function AddNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        ...TransitionPresets.ModalSlideFromBottomIOS,
        gestureEnabled: true,
      }}
    >
      <Stack.Screen name="AddTransaction" component={AddTransactionScreen} />
      <Stack.Screen name="CategoryPicker" component={CategoryPickerScreen} />
      <Stack.Screen name="RecurringPayment" component={RecurringPaymentScreen} />
    </Stack.Navigator>
  );
}