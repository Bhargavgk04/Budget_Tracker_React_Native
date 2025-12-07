import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';

import LoginScreen from '@/screens/auth/LoginScreen';
import SignupScreen from '@/screens/auth/SignupScreen';
import ForgotPasswordScreen from '@/screens/auth/ForgotPasswordScreen';
import OTPVerificationScreen from '@/screens/auth/OTPVerificationScreen';
import ResetPasswordScreen from '@/screens/auth/ResetPasswordScreen';
import OTPChangePasswordScreen from '@/screens/auth/OTPChangePasswordScreen';
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
      <Stack.Screen 
        name="ForgotPassword" 
        component={ForgotPasswordScreen}
        options={screenTransitions.ForgotPassword}
      />
      <Stack.Screen 
        name="OTPVerification" 
        component={OTPVerificationScreen}
        options={screenTransitions.OTPVerification}
      />
      <Stack.Screen 
        name="ResetPassword" 
        component={ResetPasswordScreen}
        options={screenTransitions.ResetPassword}
      />
      <Stack.Screen 
        name="OTPChangePassword" 
        component={OTPChangePasswordScreen}
        options={{ 
          title: 'Change Password with OTP',
          headerShown: true,
          ...screenTransitions.ResetPassword
        }}
      />
    </Stack.Navigator>
  );
}