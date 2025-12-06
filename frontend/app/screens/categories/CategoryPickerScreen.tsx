import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useTheme } from '@/hooks/useTheme';
import { DEFAULT_CATEGORIES } from '@/utils/constants';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';

export default function CategoryPickerScreen() {
  const theme = useTheme();
  const navigation = useNavigation();
  const route = useRoute();
  
  const type = (route as any)?.params?.type || 'expense';
  const selectedCategory = (route as any)?.params?.selectedCategory;
  // Removed onSelect param to fix non-serializable values warning
  // const onSelect = (route as any)?.params?.onSelect;

  const categories = type === 'income' ? DEFAULT_CATEGORIES.INCOME : DEFAULT_CATEGORIES.EXPENSE;

  const styles = React.useMemo(() => StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    gradientHeader: {
      paddingTop: theme.spacing.lg,
      paddingBottom: theme.spacing.xl,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: theme.spacing.lg,
      paddingBottom: theme.spacing.md,
    },
    headerTitle: {
      fontSize: 20,
      fontWeight: '600',
      flex: 1,
      textAlign: 'center',
      marginRight: 24,
    },
    scrollContent: {
      padding: theme.spacing.lg,
    },
    categoryItem: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: theme.spacing.md,
      marginBottom: theme.spacing.sm,
      borderRadius: theme.borderRadius.md,
      backgroundColor: theme.colors.surface,
      borderWidth: 2,
      borderColor: theme.colors.surface,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 2,
    },
    categoryItemSelected: {
      borderColor: theme.colors.primary,
      backgroundColor: theme.colors.primary + '20',
    },
    iconContainer: {
      marginRight: theme.spacing.md,
      padding: 10,
      borderRadius: 24,
    },
    categoryName: {
      fontSize: 16,
      fontWeight: '500',
      color: theme.colors.onSurface,
      flex: 1,
    },
    checkIcon: {
      marginLeft: theme.spacing.sm,
    },
  }), [theme]);

  const handleSelect = (category: { name: string; icon?: string; color?: string }) => {
    (navigation as any).navigate({
      name: 'AddTransaction',
      params: { selectedCategory: category.name },
      merge: true,
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={[theme.colors.primary, theme.colors.primaryVariant || theme.colors.primary]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradientHeader}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <MaterialIcons name="close" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: '#FFFFFF' }]}>
            Select {type === 'income' ? 'Income' : 'Expense'} Category
          </Text>
        </View>
      </LinearGradient>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {categories.map((category, index) => (
          <Animated.View key={category.name} entering={FadeInDown.delay(50 + index * 30)}>
            <TouchableOpacity
              style={[
                styles.categoryItem,
                selectedCategory === category.name && styles.categoryItemSelected,
              ]}
              onPress={() => handleSelect(category)}
            >
              <View style={[styles.iconContainer, { backgroundColor: category.color }]}> 
                <MaterialIcons name={category.icon} size={24} color={'#fff'} />
              </View>
              <Text style={styles.categoryName}>{category.name}</Text>
              {selectedCategory === category.name && (
                <MaterialIcons 
                  name="check-circle" 
                  size={24} 
                  color={theme.colors.primary} 
                  style={styles.checkIcon}
                />
              )}
            </TouchableOpacity>
          </Animated.View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}
