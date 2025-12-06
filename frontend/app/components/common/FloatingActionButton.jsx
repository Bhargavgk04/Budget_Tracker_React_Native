import React, { useEffect, useMemo } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  Easing,
} from 'react-native-reanimated';

const FloatingActionButton = ({
  actions = [],
  position = 'bottom-right',
}) => {
  const navigation = useNavigation();
  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);
  const isOpen = useSharedValue(0);

  useEffect(() => {
    // Simple entrance animation
    scale.value = withSpring(1, {
      damping: 20,
      stiffness: 200
    });
    opacity.value = withTiming(1, {
      duration: 300,
      easing: Easing.out(Easing.quad)
    });
  }, []);

  const handlePressIn = () => {
    scale.value = withTiming(0.95, {
      duration: 100,
      easing: Easing.out(Easing.quad)
    });
  };

  const handlePressOut = () => {
    scale.value = withTiming(1, {
      duration: 100,
      easing: Easing.out(Easing.quad)
    });
  };

  const handleMainPress = () => {
    if (actions && actions.length > 0) {
      isOpen.value = isOpen.value ? 0 : 1;
    } else {
      navigation.navigate('Add', { screen: 'AddTransaction' });
    }
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }), []);

  const containerStyle = useMemo(() => {
    const base = {
      position: 'absolute',
      bottom: 90,
      shadowColor: '#6366F1',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 8,
    };
    if (position === 'bottom-left') {
      return { ...base, left: 20 };
    }
    return { ...base, right: 20 };
  }, [position]);

  const getActionAnimatedStyle = (index) => {
    return useAnimatedStyle(() => ({
      transform: [
        { translateY: withTiming(isOpen.value ? -(70 * (index + 1)) : 0, { duration: 200 }) },
        { scale: withTiming(isOpen.value ? 1 : 0.9, { duration: 200 }) },
      ],
      opacity: withTiming(isOpen.value ? 1 : 0, { duration: 200 }),
    }));
  };

  return (
    <Animated.View style={[containerStyle, animatedStyle]}>
      {actions && actions.length > 0 && (
        <View>
          {actions.map((action, idx) => {
            const actionStyle = getActionAnimatedStyle(idx);
            return (
              <Animated.View key={`${action.label}-${idx}`} style={[{ position: 'absolute', right: 0 }, actionStyle]}>
                <TouchableOpacity
                  activeOpacity={0.9}
                  onPress={() => {
                    isOpen.value = 0;
                    action.onPress && action.onPress();
                  }}
                  style={{ flexDirection: 'row', alignItems: 'center' }}
                >
                  <View style={{
                    paddingHorizontal: 12,
                    paddingVertical: 8,
                    borderRadius: 16,
                    backgroundColor: '#111827CC',
                    marginRight: 8,
                  }}>
                    <Text style={{ color: '#fff', fontSize: 12 }}>{action.label}</Text>
                  </View>
                  <LinearGradient
                    colors={[action.color || '#8B5CF6', '#6366F1']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: 24,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <MaterialIcons name={action.icon || 'add'} size={24} color="white" />
                  </LinearGradient>
                </TouchableOpacity>
              </Animated.View>
            );
          })}
        </View>
      )}

      <TouchableOpacity
        onPress={handleMainPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={0.9}
      >
        <LinearGradient
          colors={['#8B5CF6', '#6366F1']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            width: 56,
            height: 56,
            borderRadius: 28,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <MaterialIcons name={actions && actions.length > 0 && isOpen.value ? 'close' : 'add'} size={28} color="white" />
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );
};

export default FloatingActionButton;
