import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  FlatList,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/hooks/useAuth";
import { SplitService } from "@/services/SplitService";
import { formatCurrency } from "@/utils/formatting";
import { SplitSummary } from "@/components/splits/SplitSummary";
import { BalanceDisplay } from "@/components/splits/BalanceDisplay";

interface SplitManagementScreenProps {
  navigation: any;
}

interface SharedTransaction {
  _id: string;
  amount: number;
  category: string;
  date: string;
  description?: string;
  splitInfo: {
    isShared: boolean;
    splitType: string;
    paidBy: string;
    participants: Array<{
      user: string;
      share: number;
      settled: boolean;
      settledAt?: string;
    }>;
  };
}

interface FriendBalance {
  friendId: string;
  friendName: string;
  balance: number;
  unsettledAmount: number;
  transactionCount: number;
}

export const SplitManagementScreen: React.FC<SplitManagementScreenProps> = ({
  navigation,
}) => {
  const theme = useTheme();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<
    "summary" | "transactions" | "balances"
  >("summary");
  const [sharedTransactions, setSharedTransactions] = useState<
    SharedTransaction[]
  >([]);
  const [friendBalances, setFriendBalances] = useState<FriendBalance[]>([]);
  const [splitSummary, setSplitSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);

      // Load split summary
      const summary = await SplitService.getSplitSummary();
      setSplitSummary(summary);

      // Load shared transactions
      const transactions = await SplitService.getSharedTransactions();
      setSharedTransactions(transactions);

      // Extract friend balances from summary
      if (summary.friendBalances) {
        const balances = Object.entries(summary.friendBalances).map(
          ([friendId, balance]) => ({
            friendId,
            friendName: `Friend ${friendId.slice(-4)}`, // Placeholder - should get actual name
            balance: balance as number,
            unsettledAmount: Math.abs(balance as number),
            transactionCount: transactions.filter((t) =>
              t.splitInfo.participants.some((p) => p.user === friendId)
            ).length,
          })
        );
        setFriendBalances(balances);
      }
    } catch (error) {
      console.error("Failed to load split data:", error);
      Alert.alert("Error", "Failed to load split data");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const handleSettleUp = (friendId: string, amount: number) => {
    Alert.alert(
      "Settle Up",
      `Settle ${formatCurrency(amount)} with this friend?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Settle",
          onPress: () => {
            // Navigate to settlement screen
            navigation.navigate("CreateSettlement", {
              friendId,
              suggestedAmount: amount,
            });
          },
        },
      ]
    );
  };

  const renderTransactionItem = ({ item }: { item: SharedTransaction }) => {
    const userShare = item.splitInfo.participants.find(
      (p) => p.user === user?.id
    );
    const isPaidByUser = item.splitInfo.paidBy === user?.id;

    return (
      <TouchableOpacity
        style={[
          styles.transactionCard,
          { backgroundColor: theme.colors.surface },
        ]}
        onPress={() =>
          navigation.navigate("TransactionDetails", { transactionId: item._id })
        }
      >
        <View style={styles.transactionHeader}>
          <View style={styles.transactionInfo}>
            <Text
              style={[
                styles.transactionCategory,
                { color: theme.colors.textPrimary },
              ]}
            >
              {item.category}
            </Text>
            <Text
              style={[
                styles.transactionDate,
                { color: theme.colors.textSecondary },
              ]}
            >
              {new Date(item.date).toLocaleDateString()}
            </Text>
          </View>
          <View style={styles.transactionAmount}>
            <Text
              style={[
                styles.transactionTotal,
                { color: theme.colors.textPrimary },
              ]}
            >
              {formatCurrency(item.amount)}
            </Text>
            <View style={styles.splitIndicator}>
              <MaterialIcons
                name="call-split"
                size={16}
                color={theme.colors.primary}
              />
              <Text style={[styles.splitText, { color: theme.colors.primary }]}>
                {item.splitInfo.participants.length} people
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.transactionDetails}>
          <Text
            style={[styles.shareText, { color: theme.colors.textSecondary }]}
          >
            Your share: {formatCurrency(userShare?.share || 0)}
            {isPaidByUser && " (You paid)"}
          </Text>

          <View style={styles.statusContainer}>
            <MaterialIcons
              name={userShare?.settled ? "check-circle" : "schedule"}
              size={16}
              color={
                userShare?.settled ? theme.colors.success : theme.colors.warning
              }
            />
            <Text
              style={[
                styles.statusText,
                {
                  color: userShare?.settled
                    ? theme.colors.success
                    : theme.colors.warning,
                },
              ]}
            >
              {userShare?.settled ? "Settled" : "Pending"}
            </Text>
          </View>
        </View>

        {item.description && (
          <Text
            style={[
              styles.transactionDescription,
              { color: theme.colors.textSecondary },
            ]}
          >
            {item.description}
          </Text>
        )}
      </TouchableOpacity>
    );
  };

  const renderBalanceItem = ({ item }: { item: FriendBalance }) => (
    <View
      style={[styles.balanceCard, { backgroundColor: theme.colors.surface }]}
    >
      <View style={styles.balanceHeader}>
        <View style={styles.friendInfo}>
          <Text
            style={[styles.friendName, { color: theme.colors.textPrimary }]}
          >
            {item.friendName}
          </Text>
          <Text
            style={[
              styles.transactionCount,
              { color: theme.colors.textSecondary },
            ]}
          >
            {item.transactionCount} transactions
          </Text>
        </View>

        <View style={styles.balanceAmount}>
          <Text
            style={[
              styles.balanceValue,
              {
                color:
                  item.balance > 0 ? theme.colors.success : theme.colors.error,
              },
            ]}
          >
            {formatCurrency(Math.abs(item.balance))}
          </Text>
          <Text
            style={[
              styles.balanceDirection,
              { color: theme.colors.textSecondary },
            ]}
          >
            {item.balance > 0 ? "owes you" : "you owe"}
          </Text>
        </View>
      </View>

      {Math.abs(item.balance) > 0.01 && (
        <TouchableOpacity
          style={[
            styles.settleButton,
            { backgroundColor: theme.colors.primary },
          ]}
          onPress={() => handleSettleUp(item.friendId, Math.abs(item.balance))}
        >
          <MaterialIcons
            name="payment"
            size={16}
            color={theme.colors.onPrimary}
          />
          <Text
            style={[styles.settleButtonText, { color: theme.colors.onPrimary }]}
          >
            Settle Up
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case "summary":
        return (
          <SplitSummary
            onViewDetails={() => setActiveTab("transactions")}
            onSettleUp={() => setActiveTab("balances")}
          />
        );

      case "transactions":
        return (
          <View style={styles.tabContent}>
            <Text
              style={[styles.tabTitle, { color: theme.colors.textPrimary }]}
            >
              Shared Transactions ({sharedTransactions.length})
            </Text>
            <FlatList
              data={sharedTransactions}
              renderItem={renderTransactionItem}
              keyExtractor={(item) => item._id}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.listContainer}
            />
          </View>
        );

      case "balances":
        return (
          <View style={styles.tabContent}>
            <Text
              style={[styles.tabTitle, { color: theme.colors.textPrimary }]}
            >
              Friend Balances ({friendBalances.length})
            </Text>
            <FlatList
              data={friendBalances}
              renderItem={renderBalanceItem}
              keyExtractor={(item) => item.friendId}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.listContainer}
            />
          </View>
        );

      default:
        return null;
    }
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      {/* Header */}
      <LinearGradient
        colors={[
          theme.colors.primary,
          theme.colors.primaryVariant || theme.colors.primary,
        ]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.headerGradient}
      >
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <MaterialIcons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Split Management</Text>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => navigation.navigate("AddTransaction")}
          >
            <MaterialIcons name="add" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* Tab Navigation */}
      <View
        style={[styles.tabContainer, { backgroundColor: theme.colors.surface }]}
      >
        {[
          { key: "summary", label: "Summary", icon: "dashboard" },
          { key: "transactions", label: "Transactions", icon: "list" },
          { key: "balances", label: "Balances", icon: "account-balance" },
        ].map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[
              styles.tab,
              activeTab === tab.key && [
                styles.activeTab,
                { backgroundColor: theme.colors.primary },
              ],
            ]}
            onPress={() => setActiveTab(tab.key as any)}
          >
            <MaterialIcons
              name={tab.icon as any}
              size={20}
              color={
                activeTab === tab.key
                  ? theme.colors.onPrimary
                  : theme.colors.textSecondary
              }
            />
            <Text
              style={[
                styles.tabText,
                {
                  color:
                    activeTab === tab.key
                      ? theme.colors.onPrimary
                      : theme.colors.textSecondary,
                },
              ]}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Content */}
      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {renderTabContent()}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerGradient: {
    paddingTop: 10,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  addButton: {
    padding: 8,
  },
  tabContainer: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 8,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  tab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 8,
    marginHorizontal: 4,
  },
  activeTab: {
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  tabText: {
    fontSize: 12,
    fontWeight: "500",
    marginLeft: 4,
  },
  content: {
    flex: 1,
  },
  tabContent: {
    padding: 16,
  },
  tabTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 16,
  },
  listContainer: {
    paddingBottom: 20,
  },
  transactionCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  transactionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  transactionInfo: {
    flex: 1,
  },
  transactionCategory: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 2,
  },
  transactionDate: {
    fontSize: 14,
  },
  transactionAmount: {
    alignItems: "flex-end",
  },
  transactionTotal: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  splitIndicator: {
    flexDirection: "row",
    alignItems: "center",
  },
  splitText: {
    fontSize: 12,
    marginLeft: 4,
  },
  transactionDetails: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  shareText: {
    fontSize: 14,
  },
  statusContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  statusText: {
    fontSize: 12,
    marginLeft: 4,
  },
  transactionDescription: {
    fontSize: 14,
    fontStyle: "italic",
  },
  balanceCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  balanceHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  friendInfo: {
    flex: 1,
  },
  friendName: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 2,
  },
  transactionCount: {
    fontSize: 14,
  },
  balanceAmount: {
    alignItems: "flex-end",
  },
  balanceValue: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 2,
  },
  balanceDirection: {
    fontSize: 12,
  },
  settleButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  settleButtonText: {
    fontSize: 14,
    fontWeight: "500",
    marginLeft: 8,
  },
});

export default SplitManagementScreen;
