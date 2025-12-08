import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';

import LoginScreen from '@/screens/auth/LoginScreen';
import SignupScreen from '@/screens/auth/SignupScreen';
import { defaultScreenOptions, screenTransitions } from './transitions';

const Stack = createStackNavigator();

export default function AuthNavigator() {
  return (
    <Stack.Navigator
      screenOptions={defaultScreenOptions}
      initialRouteName="Login"
    >
      <Stack.Screen 
        name="Login" 
        component={LoginScreen}
        options={screenTransitions.Login}
      />
      <Stack.Screen 
        name="Signup" 
        component={SignupScreen}
        options={screenTransitions.Signup}
      />
    </Stack.Navigator>
  );
}