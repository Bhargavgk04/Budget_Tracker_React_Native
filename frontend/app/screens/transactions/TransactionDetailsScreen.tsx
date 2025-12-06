import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/hooks/useTheme';
import TransactionService from '@/services/TransactionService';
import { Transaction } from '@/types';

interface TransactionDetailsScreenProps {
  navigation: any;
  route: {
    params: {
      transactionId: string;
    };
  };
}

export default function TransactionDetailsScreen({ navigation, route }: TransactionDetailsScreenProps) {
  const theme = useTheme();
  const { transactionId } = route?.params || {};
  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (transactionId) {
      loadTransactionDetails();
    } else {
      setIsLoading(false);
    }
  }, [transactionId]);

  const loadTransactionDetails = async () => {
    try {
      setIsLoading(true);
      // Mock data for now - replace with actual API call when ready
      await new Promise(resolve => setTimeout(resolve, 500));
      setTransaction(null);
    } catch (error) {
      console.error('Error loading transaction:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const styles = React.useMemo(() => StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: theme.spacing.lg,
      paddingVertical: theme.spacing.md,
      backgroundColor: theme.colors.surface,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 2,
    },
    backButton: {
      padding: theme.spacing.sm,
      marginRight: theme.spacing.md,
    },
    title: {
      fontSize: 18,
      fontWeight: '600',
      color: theme.colors.textPrimary || theme.colors.onBackground,
    },
    content: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: theme.spacing.xl,
    },
    text: {
      fontSize: 20,
      fontWeight: '600',
      color: theme.colors.textPrimary || theme.colors.onBackground,
      textAlign: 'center',
      marginTop: theme.spacing.lg,
    },
    subtitle: {
      fontSize: 14,
      color: theme.colors.textSecondary || theme.colors.onBackground + '70',
      textAlign: 'center',
      marginTop: theme.spacing.md,
      lineHeight: 24,
    },
  }), [theme]);

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <MaterialIcons name="arrow-back" size={24} color={theme.colors.textPrimary || theme.colors.onBackground} />
          </TouchableOpacity>
          <Text style={styles.title}>Transaction Details</Text>
        </View>
        <View style={styles.content}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <MaterialIcons name="arrow-back" size={24} color={theme.colors.textPrimary || theme.colors.onBackground} />
        </TouchableOpacity>
        <Text style={styles.title}>Transaction Details</Text>
      </View>
      
      <View style={styles.content}>
        <MaterialIcons name="receipt-long" size={64} color={theme.colors.primary} />
        <Text style={styles.text}>Transaction Details</Text>
        {transactionId && (
          <Text style={styles.subtitle}>
            Transaction ID: {transactionId}
          </Text>
        )}
        <Text style={styles.subtitle}>
          Detailed transaction information will be displayed here.
        </Text>
      </View>
    </SafeAreaView>
  );
}