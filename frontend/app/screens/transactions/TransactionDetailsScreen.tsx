import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";
import { useTheme } from "@/hooks/useTheme";
import { Transaction } from "@/types";

const TransactionDetailsScreen = ({ navigation, route }: any) => {
  const theme = useTheme();
  const transaction = route?.params?.transaction;

  // Debug logging
  React.useEffect(() => {
    console.log('[TransactionDetails] Route params:', route?.params);
    console.log('[TransactionDetails] Transaction data:', transaction);
    console.log('[TransactionDetails] Has transaction:', !!transaction);
    if (transaction) {
      console.log('[TransactionDetails] Transaction fields:', {
        id: transaction.id || transaction._id,
        type: transaction.type,
        amount: transaction.amount,
        category: transaction.category,
        date: transaction.date,
      });
    }
  }, []);

  // Handle missing transaction data
  React.useEffect(() => {
    if (!transaction) {
      console.error('[TransactionDetails] No transaction data found in route params');
      Alert.alert(
        'Error',
        'Transaction data not found',
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    }
  }, [transaction, navigation]);

  // Return early if no transaction
  if (!transaction) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#F8FAFC' }}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <MaterialIcons name="error-outline" size={64} color="#EF4444" />
          <Text style={{ marginTop: 16, fontSize: 18, color: '#64748B' }}>
            Transaction not found
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const formatCurrency = (amount: number): string => {
    return `₹${Math.abs(amount).toFixed(2)}`;
  };

  const formatDate = (date: string | Date | undefined): string => {
    if (!date) return 'N/A';
    try {
      const d = new Date(date);
      if (isNaN(d.getTime())) return 'Invalid Date';
      return d.toLocaleDateString("en-IN", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch (error) {
      return 'Invalid Date';
    }
  };

  const formatTime = (date: string | Date | undefined): string => {
    if (!date) return 'N/A';
    try {
      const d = new Date(date);
      if (isNaN(d.getTime())) return 'Invalid Time';
      return d.toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      });
    } catch (error) {
      return 'Invalid Time';
    }
  };

  const handleEdit = () => {
    navigation.navigate("Add", {
      screen: "AddTransaction",
      params: { transaction, mode: "edit" },
    });
  };

  const handleDelete = () => {
    Alert.alert(
      "Delete Transaction",
      "Are you sure you want to delete this transaction?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            // Handle delete logic here
            navigation.goBack();
          },
        },
      ]
    );
  };

  const DetailRow = ({ icon, label, value, valueColor }: any) => (
    <Animated.View entering={FadeInDown} style={styles.detailRow}>
      <View style={styles.detailLeft}>
        <MaterialIcons
          name={icon}
          size={20}
          color={theme.colors.textSecondary}
        />
        <Text
          style={[styles.detailLabel, { color: theme.colors.textSecondary }]}
        >
          {label}
        </Text>
      </View>
      <Text
        style={[
          styles.detailValue,
          { color: valueColor || theme.colors.textPrimary },
        ]}
      >
        {value}
      </Text>
    </Animated.View>
  );

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: theme.spacing.lg,
      paddingVertical: theme.spacing.md,
    },
    backButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: theme.colors.surface,
      alignItems: "center",
      justifyContent: "center",
      ...theme.shadows.sm,
    },
    headerTitle: {
      ...theme.typography.h6,
      color: theme.colors.textPrimary,
      fontWeight: "600",
    },
    actionButtons: {
      flexDirection: "row",
      gap: 12,
    },
    actionButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: theme.colors.surface,
      alignItems: "center",
      justifyContent: "center",
      ...theme.shadows.sm,
    },
    scrollContent: {
      padding: theme.spacing.lg,
    },
    amountCard: {
      backgroundColor: theme.colors.surface,
      borderRadius: theme.borderRadius.xl,
      padding: theme.spacing.xl,
      alignItems: "center",
      marginBottom: theme.spacing.lg,
      ...theme.shadows.md,
    },
    typeLabel: {
      ...theme.typography.caption,
      textTransform: "uppercase",
      letterSpacing: 1,
      marginBottom: theme.spacing.sm,
    },
    amount: {
      ...theme.typography.h1,
      fontWeight: "700",
      fontSize: 48,
      marginBottom: theme.spacing.xs,
    },
    category: {
      ...theme.typography.h6,
      color: theme.colors.textSecondary,
    },
    detailsCard: {
      backgroundColor: theme.colors.surface,
      borderRadius: theme.borderRadius.lg,
      padding: theme.spacing.lg,
      ...theme.shadows.sm,
    },
    sectionTitle: {
      ...theme.typography.h6,
      color: theme.colors.textPrimary,
      fontWeight: "600",
      marginBottom: theme.spacing.md,
    },
    detailRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingVertical: theme.spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.onSurface + "10",
    },
    detailLeft: {
      flexDirection: "row",
      alignItems: "center",
      flex: 1,
    },
    detailLabel: {
      ...theme.typography.body2,
      marginLeft: theme.spacing.sm,
    },
    detailValue: {
      ...theme.typography.body1,
      fontWeight: "600",
      textAlign: "right",
      flex: 1,
    },
    descriptionCard: {
      backgroundColor: theme.colors.surface,
      borderRadius: theme.borderRadius.lg,
      padding: theme.spacing.lg,
      marginTop: theme.spacing.lg,
      ...theme.shadows.sm,
    },
    description: {
      ...theme.typography.body1,
      color: theme.colors.textPrimary,
      lineHeight: 24,
    },
  });

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <Animated.View entering={FadeInUp} style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <MaterialIcons
            name="arrow-back"
            size={24}
            color={theme.colors.textPrimary}
          />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Transaction Details</Text>
        <View style={styles.actionButtons}>
          <TouchableOpacity style={styles.actionButton} onPress={handleEdit}>
            <MaterialIcons name="edit" size={20} color={theme.colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} onPress={handleDelete}>
            <MaterialIcons name="delete" size={20} color={theme.colors.error} />
          </TouchableOpacity>
        </View>
      </Animated.View>

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Amount Card */}
        <Animated.View
          entering={FadeInDown.delay(100)}
          style={styles.amountCard}
        >
          <Text
            style={[
              styles.typeLabel,
              {
                color:
                  transaction.type === "income"
                    ? theme.colors.success
                    : theme.colors.error,
              },
            ]}
          >
            {transaction.type}
          </Text>
          <Text
            style={[
              styles.amount,
              {
                color:
                  transaction.type === "income"
                    ? theme.colors.success
                    : theme.colors.error,
              },
            ]}
          >
            {transaction.type === "income" ? "+" : "-"}
            {formatCurrency(transaction.amount)}
          </Text>
          <Text style={styles.category}>{transaction.category}</Text>
        </Animated.View>

        {/* Details Card */}
        <Animated.View
          entering={FadeInDown.delay(200)}
          style={styles.detailsCard}
        >
          <Text style={styles.sectionTitle}>Details</Text>

          <DetailRow
            icon="calendar-today"
            label="Date"
            value={formatDate(transaction.date)}
          />

          <DetailRow
            icon="access-time"
            label="Time"
            value={formatTime(transaction.date)}
          />

          <DetailRow
            icon="category"
            label="Category"
            value={transaction.category}
          />

          {transaction.paymentMode && (
            <DetailRow
              icon="payment"
              label="Payment Mode"
              value={transaction.paymentMode === "cash" ? "Cash" : "Online"}
            />
          )}

          {transaction.createdAt && (
            <DetailRow
              icon="add-circle-outline"
              label="Created"
              value={formatDate(transaction.createdAt)}
            />
          )}

          {transaction.updatedAt &&
            transaction.updatedAt !== transaction.createdAt && (
              <DetailRow
                icon="update"
                label="Last Updated"
                value={formatDate(transaction.updatedAt)}
              />
            )}
        </Animated.View>

        {/* Description Card */}
        {(transaction.description || transaction.notes) && (
          <Animated.View
            entering={FadeInDown.delay(300)}
            style={styles.descriptionCard}
          >
            <Text style={styles.sectionTitle}>Description</Text>
            <Text style={styles.description}>
              {transaction.description || transaction.notes}
            </Text>
          </Animated.View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

export default TransactionDetailsScreen;
