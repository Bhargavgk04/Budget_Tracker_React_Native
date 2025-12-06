import React from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';

// Minimal loading screen for fastest possible render
export default function LoadingScreen() {
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#6200EE" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
});
