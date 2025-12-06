import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useTheme } from '@/hooks/useTheme';

interface ExportOption {
  id: string;
  title: string;
  subtitle: string;
  icon: string;
  color: string;
  format: 'PDF' | 'CSV' | 'EXCEL' | 'JSON';
}

export default function ExportScreen({ navigation }: any) {
  const theme = useTheme();
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'year' | 'all'>('month');

  const exportOptions: ExportOption[] = [
    {
      id: 'pdf',
      title: 'PDF Report',
      subtitle: 'Detailed transaction report with charts',
      icon: 'picture-as-pdf',
      color: '#EF4444',
      format: 'PDF',
    },
    {
      id: 'csv',
      title: 'CSV File',
      subtitle: 'Comma-separated values for Excel',
      icon: 'table-chart',
      color: '#10B981',
      format: 'CSV',
    },
    {
      id: 'excel',
      title: 'Excel Spreadsheet',
      subtitle: 'Microsoft Excel format (.xlsx)',
      icon: 'description',
      color: '#059669',
      format: 'EXCEL',
    },
    {
      id: 'json',
      title: 'JSON Data',
      subtitle: 'Raw data in JSON format',
      icon: 'code',
      color: '#6366F1',
      format: 'JSON',
    },
  ];

  const periods = [
    { value: 'week', label: 'This Week' },
    { value: 'month', label: 'This Month' },
    { value: 'year', label: 'This Year' },
    { value: 'all', label: 'All Time' },
  ];

  const handleExport = (option: ExportOption) => {
    Alert.alert(
      `Export ${option.format}`,
      `Export transactions as ${option.format} for ${selectedPeriod}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Export',
          onPress: () => {
            // Handle export logic here
            Alert.alert('Success', `Data exported as ${option.format}`);
          },
        },
      ]
    );
  };

  const renderExportOption = (option: ExportOption, index: number) => (
    <Animated.View key={option.id} entering={FadeInDown.delay(50 + index * 40)}>
      <TouchableOpacity
        style={styles.exportCard}
        onPress={() => handleExport(option)}
        activeOpacity={0.7}
      >
        <View style={[styles.iconContainer, { backgroundColor: option.color + '20' }]}>
          <MaterialIcons name={option.icon as any} size={32} color={option.color} />
        </View>
        <View style={styles.exportInfo}>
          <Text style={styles.exportTitle}>{option.title}</Text>
          <Text style={styles.exportSubtitle}>{option.subtitle}</Text>
        </View>
        <MaterialIcons name="download" size={24} color={theme.colors.onSurface + '60'} />
      </TouchableOpacity>
    </Animated.View>
  );

  const styles = React.useMemo(() => StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    gradientHeader: {
      paddingBottom: theme.spacing.lg,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: theme.spacing.lg,
      paddingTop: theme.spacing.lg,
      paddingBottom: theme.spacing.md,
    },
    backButton: {
      padding: theme.spacing.sm,
      marginRight: theme.spacing.md,
    },
    headerTitle: {
      fontSize: 24,
      fontWeight: 'bold',
      color: '#FFFFFF',
      flex: 1,
    },
    scrollContainer: {
      padding: theme.spacing.md,
    },
    section: {
      marginBottom: theme.spacing.xl,
    },
    sectionTitle: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.colors.onSurface + '80',
      marginBottom: theme.spacing.md,
      marginLeft: theme.spacing.sm,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    periodContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: theme.spacing.sm,
      marginBottom: theme.spacing.xl,
    },
    periodButton: {
      flex: 1,
      minWidth: '45%',
      paddingVertical: theme.spacing.md,
      paddingHorizontal: theme.spacing.lg,
      backgroundColor: theme.colors.surface,
      borderRadius: theme.borderRadius.md,
      alignItems: 'center',
      borderWidth: 2,
      borderColor: 'transparent',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 1,
    },
    periodButtonActive: {
      borderColor: theme.colors.primary,
      backgroundColor: theme.colors.primary + '10',
    },
    periodButtonText: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.colors.onSurface,
    },
    periodButtonTextActive: {
      color: theme.colors.primary,
    },
    exportCard: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: theme.spacing.lg,
      backgroundColor: theme.colors.surface,
      borderRadius: theme.borderRadius.lg,
      marginBottom: theme.spacing.md,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 4,
      elevation: 3,
    },
    iconContainer: {
      width: 64,
      height: 64,
      borderRadius: 32,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: theme.spacing.md,
    },
    exportInfo: {
      flex: 1,
    },
    exportTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.onSurface,
      marginBottom: 4,
    },
    exportSubtitle: {
      fontSize: 12,
      color: theme.colors.onSurface + '60',
      lineHeight: 18,
    },
    infoCard: {
      backgroundColor: theme.colors.primary + '10',
      padding: theme.spacing.lg,
      borderRadius: theme.borderRadius.md,
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: theme.spacing.md,
    },
    infoIcon: {
      marginRight: theme.spacing.md,
    },
    infoText: {
      flex: 1,
      fontSize: 12,
      color: theme.colors.primary,
      lineHeight: 18,
    },
  }), [theme, selectedPeriod]);

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={[theme.colors.primary, theme.colors.primaryVariant || theme.colors.primary]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradientHeader}
      >
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <MaterialIcons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Export Data</Text>
        </View>
      </LinearGradient>

      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Select Period</Text>
          <View style={styles.periodContainer}>
            {periods.map((period) => (
              <TouchableOpacity
                key={period.value}
                style={[
                  styles.periodButton,
                  selectedPeriod === period.value && styles.periodButtonActive,
                ]}
                onPress={() => setSelectedPeriod(period.value as any)}
              >
                <Text
                  style={[
                    styles.periodButtonText,
                    selectedPeriod === period.value && styles.periodButtonTextActive,
                  ]}
                >
                  {period.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Export Format</Text>
          {exportOptions.map((option, index) => renderExportOption(option, index))}
        </View>

        <Animated.View entering={FadeInDown.delay(300)} style={styles.infoCard}>
          <MaterialIcons
            name="info-outline"
            size={24}
            color={theme.colors.primary}
            style={styles.infoIcon}
          />
          <Text style={styles.infoText}>
            Your data will be exported in the selected format. Large exports may take a few moments to prepare.
          </Text>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}