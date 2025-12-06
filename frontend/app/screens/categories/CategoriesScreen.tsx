import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useTheme } from '@/hooks/useTheme';
import { DEFAULT_CATEGORIES } from '@/utils/constants';

interface Category {
  name: string;
  icon: string;
  color: string;
}

export default function CategoriesScreen({ navigation }: any) {
  const theme = useTheme();
  const [selectedTab, setSelectedTab] = useState<'expense' | 'income'>('expense');

  const categories = selectedTab === 'expense'
    ? DEFAULT_CATEGORIES.EXPENSE
    : DEFAULT_CATEGORIES.INCOME;

  const renderCategoryItem = ({ item, index }: { item: Category; index: number }) => (
    <Animated.View entering={FadeInDown.delay(50 + index * 30)}>
      <TouchableOpacity
        style={styles.categoryCard}
        activeOpacity={0.7}
        onPress={() => navigation.navigate('CategoryDetails', { category: item })}
      >
        <View style={[styles.iconContainer, { backgroundColor: item.color + '20' }]}>
          <MaterialIcons name={item.icon as any} size={28} color={item.color} />
        </View>
        <View style={styles.categoryInfo}>
          <Text style={styles.categoryName}>{item.name}</Text>
          <Text style={styles.categoryType}>{selectedTab}</Text>
        </View>
        <MaterialIcons name="chevron-right" size={24} color={theme.colors.onSurface + '40'} />
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
      paddingHorizontal: theme.spacing.lg,
      paddingTop: theme.spacing.lg,
      paddingBottom: theme.spacing.md,
    },
    headerTop: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: theme.spacing.md,
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
    addButton: {
      padding: theme.spacing.sm,
    },
    tabContainer: {
      flexDirection: 'row',
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
      borderRadius: theme.borderRadius.md,
      padding: theme.spacing.xs,
    },
    tab: {
      flex: 1,
      paddingVertical: theme.spacing.sm,
      paddingHorizontal: theme.spacing.md,
      borderRadius: theme.borderRadius.sm,
      alignItems: 'center',
    },
    tabActive: {
      backgroundColor: '#FFFFFF',
    },
    tabText: {
      fontSize: 14,
      fontWeight: '600',
      color: '#FFFFFF',
    },
    tabTextActive: {
      color: theme.colors.primary,
    },
    listContainer: {
      padding: theme.spacing.md,
    },
    categoryCard: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: theme.spacing.md,
      backgroundColor: theme.colors.surface,
      borderRadius: theme.borderRadius.md,
      marginBottom: theme.spacing.sm,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 4,
      elevation: 3,
    },
    iconContainer: {
      width: 56,
      height: 56,
      borderRadius: 28,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: theme.spacing.md,
    },
    categoryInfo: {
      flex: 1,
    },
    categoryName: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.onSurface,
      marginBottom: 2,
    },
    categoryType: {
      fontSize: 12,
      color: theme.colors.onSurface + '60',
      textTransform: 'capitalize',
    },
    statsContainer: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      padding: theme.spacing.lg,
      backgroundColor: theme.colors.surface,
      marginHorizontal: theme.spacing.md,
      marginBottom: theme.spacing.md,
      borderRadius: theme.borderRadius.lg,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 2,
    },
    statItem: {
      alignItems: 'center',
    },
    statValue: {
      fontSize: 24,
      fontWeight: 'bold',
      color: theme.colors.primary,
      marginBottom: 4,
    },
    statLabel: {
      fontSize: 12,
      color: theme.colors.onSurface + '80',
    },
  }), [theme, selectedTab]);

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={[theme.colors.primary, theme.colors.primaryVariant || theme.colors.primary]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradientHeader}
      >
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <MaterialIcons name="arrow-back" size={24} color="#FFFFFF" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Categories</Text>
            <TouchableOpacity style={styles.addButton}>
              <MaterialIcons name="add" size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
          
          <View style={styles.tabContainer}>
            <TouchableOpacity
              style={[styles.tab, selectedTab === 'expense' && styles.tabActive]}
              onPress={() => setSelectedTab('expense')}
            >
              <Text style={[styles.tabText, selectedTab === 'expense' && styles.tabTextActive]}>
                Expenses
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, selectedTab === 'income' && styles.tabActive]}
              onPress={() => setSelectedTab('income')}
            >
              <Text style={[styles.tabText, selectedTab === 'income' && styles.tabTextActive]}>
                Income
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </LinearGradient>

      <Animated.View entering={FadeInDown.delay(100)} style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{categories.length}</Text>
          <Text style={styles.statLabel}>Total</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>12</Text>
          <Text style={styles.statLabel}>Used</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>245</Text>
          <Text style={styles.statLabel}>Transactions</Text>
        </View>
      </Animated.View>

      <FlatList
        data={categories}
        renderItem={renderCategoryItem}
        keyExtractor={(item) => item.name}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}