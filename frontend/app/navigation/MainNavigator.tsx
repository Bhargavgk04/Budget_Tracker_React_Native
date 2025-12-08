import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialIcons } from '@expo/vector-icons';
import { View, StyleSheet, Dimensions } from 'react-native';
import Animated, { useAnimatedStyle, withSpring } from 'react-native-reanimated';

import { ELEVATION_LEVELS } from '@/utils/constants';

// Import stack navigators for each tab
import HomeNavigator from './HomeNavigator';
import AddNavigator from './AddNavigator';
import ProfileNavigator from './ProfileNavigator';
import FloatingActionButton from '@/components/common/FloatingActionButton';
import { useNavigation } from '@react-navigation/native';

const Tab = createBottomTabNavigator();

interface TabBarIconProps {
  focused: boolean;
  color: string;
  size: number;
  iconName: keyof typeof MaterialIcons.glyphMap;
}

function TabBarIcon({ focused, color, size, iconName }: TabBarIconProps) {
  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        {
          scale: withSpring(focused ? 1.2 : 1, {
            damping: 15,
            stiffness: 150,
          }),
        },
      ],
    };
  });

  return (
    <Animated.View style={animatedStyle}>
      <MaterialIcons name={iconName} size={size} color={color} />
    </Animated.View>
  );
}

export default function MainNavigator() {
  const navigation = useNavigation<any>();

  const { width: screenWidth } = Dimensions.get('window');
  const isWeb = screenWidth > 768;

  const styles = StyleSheet.create({
    tabBar: {
      backgroundColor: '#FFFFFF',
      borderTopColor: '#E2E8F0',
      height: 60,
      paddingBottom: 5,
      paddingTop: 5,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 3,
      elevation: 3,
    },
    tabBarLabel: {
      fontSize: 12,
      marginTop: -5,
    },
  });

  return (
    <>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarIcon: ({ focused, color, size }) => {
            let iconName: keyof typeof MaterialIcons.glyphMap;

            switch (route.name) {
              case 'Home':
                iconName = 'dashboard';
                break;
              case 'Add':
                iconName = 'add-circle';
                break;
              case 'Profile':
                iconName = 'person';
                break;
              default:
                iconName = 'help';
            }

            return (
              <TabBarIcon
                focused={focused}
                color={color}
                size={size}
                iconName={iconName}
              />
            );
          },
          tabBarActiveTintColor: '#6366F1',
          tabBarInactiveTintColor: '#94A3B8',
          tabBarStyle: styles.tabBar,
          tabBarLabelStyle: styles.tabBarLabel,
          tabBarHideOnKeyboard: true,
        })}
      >
        <Tab.Screen
          name="Home"
          component={HomeNavigator}
          options={{
            tabBarLabel: 'Home',
          }}
        />
        <Tab.Screen
          name="Add"
          component={AddNavigator}
          options={{
            tabBarLabel: 'Add',
          }}
        />
        <Tab.Screen
          name="Profile"
          component={ProfileNavigator}
          options={{
            tabBarLabel: 'Profile',
          }}
        />
      </Tab.Navigator>
    </>
  );
}
