import React from 'react';
import { RefreshControl as RNRefreshControl, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

const RefreshControl = ({ refreshing, onRefresh, colors = ['#6366F1'], tintColor = '#6366F1' }) => {
  return (
    <RNRefreshControl
      refreshing={refreshing}
      onRefresh={onRefresh}
      colors={colors}
      tintColor={tintColor}
      progressBackgroundColor="#FFFFFF"
      style={styles.refreshControl}
    />
  );
};

const styles = StyleSheet.create({
  refreshControl: {
    backgroundColor: 'transparent',
  },
});

export default RefreshControl;
