import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { TransitionPresets } from '@react-navigation/stack';

import AnalyticsScreen from '@/screens/analytics/AnalyticsScreen';
import DetailedAnalyticsScreen from '@/screens/analytics/DetailedAnalyticsScreen';
import InsightsScreen from '@/screens/analytics/InsightsScreen';

const Stack = createStackNavigator();

export default function AnalyticsNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        ...TransitionPresets.SlideFromRightIOS,
        gestureEnabled: true,
      }}
    >
      <Stack.Screen name="AnalyticsHome" component={AnalyticsScreen} />
      <Stack.Screen name="DetailedAnalytics" component={DetailedAnalyticsScreen} />
      <Stack.Screen name="Insights" component={InsightsScreen} />
    </Stack.Navigator>
  );
}