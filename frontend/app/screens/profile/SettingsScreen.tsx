import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown } from 'react-native-reanimated';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '@/utils/constants';

interface SettingItem {
  id: string;
  icon: string;
  title: string;
  subtitle?: string;
  type: 'toggle' | 'navigation';
  value?: boolean;
  onPress?: () => void;
}

export default function SettingsScreen({ navigation }: any) {
  const [notifications, setNotifications] = React.useState(true);
  const [biometric, setBiometric] = React.useState(false);
  const [currency, setCurrency] = React.useState('INR');

  // Load saved preferences on mount
  React.useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    try {
      const savedNotifications = await AsyncStorage.getItem(STORAGE_KEYS.NOTIFICATIONS_ENABLED);
      const savedBiometric = await AsyncStorage.getItem(STORAGE_KEYS.BIOMETRIC_ENABLED);
      const savedCurrency = await AsyncStorage.getItem(STORAGE_KEYS.CURRENCY);
      
      setNotifications(savedNotifications !== 'false');
      setBiometric(savedBiometric === 'true');
      if (savedCurrency) setCurrency(savedCurrency);
    } catch (error) {
      console.error('Error loading preferences:', error);
    }
  };

  const handleNotificationsToggle = async () => {
    const newValue = !notifications;
    setNotifications(newValue);
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.NOTIFICATIONS_ENABLED, newValue.toString());
      Alert.alert('Success', `Notifications ${newValue ? 'enabled' : 'disabled'}`);
    } catch (error) {
      console.error('Error saving notification preference:', error);
      Alert.alert('Error', 'Failed to save notification preference');
    }
  };

  const handleBiometricToggle = async () => {
    const newValue = !biometric;
    setBiometric(newValue);
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.BIOMETRIC_ENABLED, newValue.toString());
      Alert.alert('Success', `Biometric lock ${newValue ? 'enabled' : 'disabled'}`);
    } catch (error) {
      console.error('Error saving biometric preference:', error);
      Alert.alert('Error', 'Failed to save biometric preference');
    }
  };

  const handleCurrencyPress = () => {
    Alert.alert('Currency', 'Currency selection will be available in the next update');
  };

  const handleLanguagePress = () => {
    Alert.alert('Language', 'Language selection will be available in the next update');
  };



  const handleBackup = () => {
    Alert.alert('Backup', 'Cloud backup will be available in the next update');
  };

  const handlePrivacyPolicy = () => {
    Alert.alert('Privacy Policy', 'Privacy policy will be available soon');
  };

  const handleTermsOfService = () => {
    Alert.alert('Terms of Service', 'Terms of service will be available soon');
  };

  const settingsSections: { title: string; items: SettingItem[] }[] = [
    {
      title: 'Preferences',
      items: [
        {
          id: 'notifications',
          icon: 'notifications',
          title: 'Push Notifications',
          subtitle: 'Receive alerts for transactions',
          type: 'toggle',
          value: notifications,
          onPress: handleNotificationsToggle,
        },
        {
          id: 'currency',
          icon: 'attach-money',
          title: 'Currency',
          subtitle: 'INR (₹)',
          type: 'navigation',
          onPress: handleCurrencyPress,
        },
        {
          id: 'language',
          icon: 'language',
          title: 'Language',
          subtitle: 'English',
          type: 'navigation',
          onPress: handleLanguagePress,
        },
      ],
    },
    {
      title: 'Security',
      items: [
        {
          id: 'biometric',
          icon: 'fingerprint',
          title: 'Biometric Lock',
          subtitle: 'Use fingerprint or face ID',
          type: 'toggle',
          value: biometric,
          onPress: handleBiometricToggle,
        },
      ],
    },
    {
      title: 'Data',
      items: [
        {
          id: 'backup',
          icon: 'cloud-upload',
          title: 'Backup Data',
          subtitle: 'Backup to cloud',
          type: 'navigation',
          onPress: handleBackup,
        },
        {
          id: 'export',
          icon: 'download',
          title: 'Export Data',
          subtitle: 'Download as CSV/PDF',
          type: 'navigation',
          onPress: () => navigation.navigate('Export'),
        },
      ],
    },
    {
      title: 'About',
      items: [
        {
          id: 'version',
          icon: 'info',
          title: 'Version',
          subtitle: '1.0.0',
          type: 'navigation',
          onPress: () => {},
        },
        {
          id: 'privacy',
          icon: 'privacy-tip',
          title: 'Privacy Policy',
          type: 'navigation',
          onPress: handlePrivacyPolicy,
        },
        {
          id: 'terms',
          icon: 'description',
          title: 'Terms of Service',
          type: 'navigation',
          onPress: handleTermsOfService,
        },
      ],
    },
  ];

  const renderSettingItem = (item: SettingItem, index: number) => (
    <Animated.View key={item.id} entering={FadeInDown.delay(50 + index * 30)}>
      <TouchableOpacity
        style={styles.settingItem}
        onPress={item.onPress}
        activeOpacity={0.7}
      >
        <View style={styles.iconContainer}>
          <MaterialIcons name={item.icon as any} size={24} color="#000" />
        </View>
        <View style={styles.settingContent}>
          <Text style={styles.settingTitle}>{item.title}</Text>
          {item.subtitle && <Text style={styles.settingSubtitle}>{item.subtitle}</Text>}
        </View>
        {item.type === 'toggle' ? (
          <Switch
            value={item.value}
            onValueChange={item.onPress}
            trackColor={{ false: '#ccc', true: '#4CAF50' }}
            thumbColor="#FFFFFF"
          />
        ) : (
          <MaterialIcons name="chevron-right" size={24} color="#ccc" />
        )}
      </TouchableOpacity>
    </Animated.View>
  );

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#FFFFFF',
    },
    gradientHeader: {
      paddingBottom: 20,
      backgroundColor: '#6366F1',
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingTop: 20,
      paddingBottom: 10,
    },
    backButton: {
      padding: 10,
      marginRight: 10,
    },
    headerTitle: {
      fontSize: 24,
      fontWeight: 'bold',
      color: '#333',
      flex: 1,
    },
    scrollContainer: {
      padding: 10,
    },
    section: {
      marginBottom: 20,
    },
    sectionTitle: {
      fontSize: 14,
      fontWeight: '600',
      color: '#666',
      marginBottom: 10,
      marginLeft: 10,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    settingItem: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 10,
      backgroundColor: '#FFFFFF',
      borderRadius: 10,
      marginBottom: 5,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 1,
    },
    iconContainer: {
      width: 48,
      height: 48,
      borderRadius: 24,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 10,
    },
    settingContent: {
      flex: 1,
    },
    settingTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: '#333',
      marginBottom: 2,
    },
    settingSubtitle: {
      fontSize: 12,
      color: '#666',
    },
  });

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.gradientHeader}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <MaterialIcons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Settings</Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        {settingsSections.map((section, sectionIndex) => (
          <View key={section.title} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            {section.items.map((item, itemIndex) =>
              renderSettingItem(item, sectionIndex * 10 + itemIndex)
            )}
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}