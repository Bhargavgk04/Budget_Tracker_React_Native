import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  TouchableOpacity,
  Animated,
  Easing,
  TextInput as RNTextInput,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/hooks/useAuth";
import Button from "@/components/common/Button";
import { formatCurrency } from "@/utils/formatting";
import { validateAmount } from "@/utils/validation";
import TransactionService from "@/services/TransactionService";
import { CATEGORIES } from "@/utils/constants";
import FriendSelector from "@/components/friends/FriendSelector";
import SplitConfig from "@/components/splits/SplitConfig";
import { TransactionFormData, Friend, SplitFormData } from "@/types";

interface AddTransactionScreenProps {
  navigation: any;
  route?: {
    params?: {
      type?: "income" | "expense";
      transactionId?: string;
      selectedCategory?: string;
    };
  };
}

const AddTransactionScreen = ({
  navigation,
  route,
}: AddTransactionScreenProps) => {
  const theme = useTheme();
  const { user } = useAuth();
  
  // Form state
  const [amount, setAmount] = useState("");
  const [type, setType] = useState<"income" | "expense">(
    route?.params?.type || "expense"
  );
  const [category, setCategory] = useState(route?.params?.selectedCategory || "");
  const [paymentMode, setPaymentMode] = useState("cash");
  const [notes, setNotes] = useState("");
  const [date, setDate] = useState(new Date());
  const [isLoading, setIsLoading] = useState(false);
  
  // Friend and split state
  const [selectedFriends, setSelectedFriends] = useState<Friend[]>([]);
  const [splitConfig, setSplitConfig] = useState<SplitFormData | null>(null);
  const [showSplitConfig, setShowSplitConfig] = useState(false);
  
  // UI state
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  
  // Refs
  const amountInputRef = useRef<RNTextInput>(null);

  // Filter categories based on transaction type
  const filteredCategories = CATEGORIES.filter((cat) => {
    if (type === "income") {
      return ["Salary", "Freelance", "Investment", "Business", "Other Income"].includes(cat.name);
    }
    return !["Salary", "Freelance", "Investment", "Business", "Other Income"].includes(cat.name);
  });

  // Animation effects
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        easing: Easing.out(Easing.exp),
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        easing: Easing.out(Easing.exp),
        useNativeDriver: true,
      })
    ]).start();
  }, []);

  // Handle category selection from CategoryPicker
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      const selectedCategory = (route?.params as any)?.selectedCategory;
      if (selectedCategory && selectedCategory !== category) {
        setCategory(selectedCategory);
        if (navigation.setParams) {
          navigation.setParams({ selectedCategory: undefined });
        }
      }
    });

    return unsubscribe;
  }, [navigation, category, route?.params]);

  // Validate form
  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!validateAmount(amount)) {
      newErrors.amount = "Please enter a valid amount greater than 0";
    }
    
    if (!category) {
      newErrors.category = "Please select a category";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      setIsLoading(true);
      
      const transactionData: any = {
        amount: parseFloat(amount),
        category,
        type,
        paymentMode,
        notes: notes || undefined,
        date: date.toISOString(),
      };

      const isDemoUser = user?.id === "demo-user-123";
      
      if (isDemoUser) {
        const { MockDataService } = await import("@/services/MockDataService");
        await MockDataService.addTransaction(transactionData);
      } else {
        const created = await TransactionService.createTransaction(transactionData);
        
        // Handle split creation if configured
        const createdId = (created as any)?._id || (created as any)?.id;
        if (splitConfig && createdId) {
          try {
            const SplitService = (await import("@/services/SplitService")).default;
            await SplitService.createSplit(createdId, splitConfig);
          } catch (e) {
            console.warn('Failed to create split:', e);
          }
        }
      }

      // Reset form
      setAmount("");
      setCategory("");
      setNotes("");
      setSelectedFriends([]);
      setShowSplitConfig(false);
      setSplitConfig(null);
      
      Alert.alert("Success", "Transaction added successfully");
      navigation.goBack();
    } catch (error) {
      console.error("Failed to add transaction:", error);
      Alert.alert("Error", "Failed to add transaction. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle friend selection for splitting
  const handleFriendSelect = (friend: Friend) => {
    setSelectedFriends([friend]);
    setShowSplitConfig(true);
  };

  // Handle split configuration changes
  const handleSplitChange = (split: SplitFormData) => {
    setSplitConfig(split);
  };

  // Navigate to category picker
  const openCategoryPicker = () => {
    navigation.navigate("CategoryPicker", {
      type,
      selectedCategory: category,
    });
  };

  // Format amount for display
  const formatDisplayAmount = (value: string) => {
    if (!value) return "";
    const num = parseFloat(value);
    return isNaN(num) ? "" : formatCurrency(num);
  };

  // Handle amount input change with proper formatting
  const handleAmountChange = (text: string) => {
    // Remove any non-numeric characters except decimal point
    const cleaned = text.replace(/[^0-9.]/g, '');
    
    // Ensure only one decimal point
    const parts = cleaned.split('.');
    if (parts.length > 2) {
      return;
    }
    
    // Limit to 2 decimal places
    if (parts[1] && parts[1].length > 2) {
      const newValue = parts[0] + '.' + parts[1].substring(0, 2);
      setAmount(newValue);
      return;
    }
    
    setAmount(cleaned);
    
    // Clear amount error if valid
    if (validateAmount(cleaned)) {
      setErrors(prev => {
        const newErrors = {...prev};
        delete newErrors.amount;
        return newErrors;
      });
    }
  };

  // Render category item
  const renderCategoryItem = (item: typeof CATEGORIES[0]) => (
    <TouchableOpacity
      key={item.id}
      style={[
        styles.categoryItem,
        {
          backgroundColor: theme.colors.surface,
          borderColor: category === item.name 
            ? (type === "income" ? theme.colors.success : theme.colors.primary) 
            : theme.colors.border,
        }
      ]}
      onPress={() => setCategory(item.name)}
    >
      <View 
        style={[
          styles.categoryIconContainer,
          {
            backgroundColor: item.color,
          }
        ]}
      >
        <MaterialIcons name={item.icon} size={20} color="#FFFFFF" />
      </View>
      <Text 
        style={[
          styles.categoryText,
          {
            color: theme.colors.textPrimary,
          }
        ]}
      >
        {item.name}
      </Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <LinearGradient
        colors={
          type === "income"
            ? [theme.colors.success || "#10B981", theme.colors.success || "#059669"]
            : [theme.colors.primary, theme.colors.primaryVariant || theme.colors.primary]
        }
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.headerGradient}
      >
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => navigation.goBack()}
          >
            <MaterialIcons name="close" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Add Transaction</Text>
          <View style={{ width: 24 }} />
        </View>
      </LinearGradient>

      <Animated.View 
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          }
        ]}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.keyboardAvoidingView}
        >
          <ScrollView 
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Amount Input Section */}
            <View 
              style={[
                styles.amountCard,
                {
                  backgroundColor: theme.colors.surface,
                  ...theme.shadows.lg,
                }
              ]}
            >
              <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>
                Amount
              </Text>
              
              <View style={styles.amountInputContainer}>
                <Text style={[styles.currencySymbol, { color: theme.colors.textPrimary }]}>
                  ₹
                </Text>
                <RNTextInput
                  ref={amountInputRef}
                  value={amount}
                  onChangeText={handleAmountChange}
                  onFocus={() => setFocusedField("amount")}
                  onBlur={() => setFocusedField(null)}
                  placeholder="0.00"
                  placeholderTextColor={theme.colors.textTertiary}
                  keyboardType="decimal-pad"
                  returnKeyType="done"
                  style={[
                    styles.amountInput,
                    {
                      color: theme.colors.textPrimary,
                      borderColor: errors.amount 
                        ? theme.colors.error 
                        : (focusedField === "amount" 
                          ? (type === "income" ? theme.colors.success : theme.colors.primary)
                          : theme.colors.border),
                    }
                  ]}
                />
              </View>
              
              {amount ? (
                <Text style={[styles.amountDisplay, { color: theme.colors.textSecondary }]}>
                  {formatDisplayAmount(amount)}
                </Text>
              ) : (
                <Text style={[styles.amountPlaceholder, { color: theme.colors.textTertiary }]}>
                  Enter transaction amount
                </Text>
              )}
              
              {errors.amount ? (
                <Text style={[styles.errorText, { color: theme.colors.error }]}>
                  {errors.amount}
                </Text>
              ) : null}
            </View>

            {/* Transaction Type Toggle */}
            <View 
              style={[
                styles.card,
                {
                  backgroundColor: theme.colors.surface,
                  ...theme.shadows.md,
                }
              ]}
            >
              <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>
                Transaction Type
              </Text>
              
              <View style={styles.typeToggleContainer}>
                <TouchableOpacity
                  style={[
                    styles.typeButton,
                    type === "expense" && styles.activeTypeButton,
                    {
                      backgroundColor: type === "expense" 
                        ? theme.colors.primary 
                        : theme.colors.surfaceVariant,
                      borderColor: type === "expense" 
                        ? theme.colors.primary 
                        : theme.colors.border,
                    }
                  ]}
                  onPress={() => setType("expense")}
                >
                  <Text 
                    style={[
                      styles.typeButtonText,
                      {
                        color: type === "expense" 
                          ? theme.colors.onPrimary 
                          : theme.colors.textSecondary,
                      }
                    ]}
                  >
                    Expense
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[
                    styles.typeButton,
                    type === "income" && styles.activeTypeButton,
                    {
                      backgroundColor: type === "income" 
                        ? theme.colors.success 
                        : theme.colors.surfaceVariant,
                      borderColor: type === "income" 
                        ? theme.colors.success 
                        : theme.colors.border,
                    }
                  ]}
                  onPress={() => setType("income")}
                >
                  <Text 
                    style={[
                      styles.typeButtonText,
                      {
                        color: type === "income" 
                          ? theme.colors.onPrimary 
                          : theme.colors.textSecondary,
                      }
                    ]}
                  >
                    Income
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Category Selection */}
            <View 
              style={[
                styles.card,
                {
                  backgroundColor: theme.colors.surface,
                  ...theme.shadows.md,
                }
              ]}
            >
              <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>
                Category
              </Text>
              
              <TouchableOpacity
                style={[
                  styles.categorySelector,
                  {
                    backgroundColor: theme.colors.surfaceVariant,
                    borderColor: errors.category 
                      ? theme.colors.error 
                      : theme.colors.border,
                  }
                ]}
                onPress={openCategoryPicker}
              >
                <Text 
                  style={[
                    styles.categorySelectorText,
                    {
                      color: category 
                        ? theme.colors.textPrimary 
                        : theme.colors.textTertiary,
                    }
                  ]}
                >
                  {category || "Select category"}
                </Text>
                <MaterialIcons 
                  name="keyboard-arrow-down" 
                  size={24} 
                  color={theme.colors.textSecondary} 
                />
              </TouchableOpacity>
              
              {errors.category ? (
                <Text style={[styles.errorText, { color: theme.colors.error }]}>
                  {errors.category}
                </Text>
              ) : null}
              
              {/* Quick Category Selection */}
              {category ? null : (
                <View style={styles.quickCategories}>
                  <Text style={[styles.subSectionTitle, { color: theme.colors.textSecondary }]}>
                    Quick Select
                  </Text>
                  <View style={styles.categoryGrid}>
                    {filteredCategories.slice(0, 6).map(renderCategoryItem)}
                  </View>
                </View>
              )}
            </View>

            {/* Payment Mode */}
            <View 
              style={[
                styles.card,
                {
                  backgroundColor: theme.colors.surface,
                  ...theme.shadows.md,
                }
              ]}
            >
              <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>
                Payment Mode
              </Text>
              
              <View style={styles.paymentModes}>
                {["cash", "upi", "card", "bank"].map((mode) => (
                  <TouchableOpacity
                    key={mode}
                    style={[
                      styles.paymentModeButton,
                      paymentMode === mode && styles.activePaymentModeButton,
                      {
                        backgroundColor: paymentMode === mode 
                          ? theme.colors.primary 
                          : theme.colors.surfaceVariant,
                        borderColor: paymentMode === mode 
                          ? theme.colors.primary 
                          : theme.colors.border,
                      }
                    ]}
                    onPress={() => setPaymentMode(mode)}
                  >
                    <Text 
                      style={[
                        styles.paymentModeText,
                        {
                          color: paymentMode === mode 
                            ? theme.colors.onPrimary 
                            : theme.colors.textSecondary,
                        }
                      ]}
                    >
                      {mode.charAt(0).toUpperCase() + mode.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Notes */}
            <View 
              style={[
                styles.card,
                {
                  backgroundColor: theme.colors.surface,
                  ...theme.shadows.md,
                }
              ]}
            >
              <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>
                Notes (Optional)
              </Text>
              
              <RNTextInput
                value={notes}
                onChangeText={setNotes}
                placeholder="Add a note about this transaction..."
                placeholderTextColor={theme.colors.textTertiary}
                multiline
                numberOfLines={3}
                style={[
                  styles.notesInput,
                  {
                    backgroundColor: theme.colors.surfaceVariant,
                    color: theme.colors.textPrimary,
                    borderColor: theme.colors.border,
                  }
                ]}
                textAlignVertical="top"
              />
            </View>

            {/* Friend Split */}
            <View 
              style={[
                styles.card,
                {
                  backgroundColor: theme.colors.surface,
                  ...theme.shadows.md,
                }
              ]}
            >
              <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>
                Split with Friends (Optional)
              </Text>
              
              <FriendSelector
                value={selectedFriends.length > 0 ? selectedFriends[0].uid : ""}
                onSelect={handleFriendSelect}
                onUidChange={() => {}}
                placeholder="Select a friend to split with..."
              />
              
              {selectedFriends.length > 0 && (
                <View style={styles.selectedFriendContainer}>
                  <Text style={[styles.selectedFriendText, { color: theme.colors.textPrimary }]}>
                    Selected: {selectedFriends[0].name}
                  </Text>
                  <TouchableOpacity
                    onPress={() => {
                      setSelectedFriends([]);
                      setShowSplitConfig(false);
                      setSplitConfig(null);
                    }}
                  >
                    <MaterialIcons name="close" size={20} color={theme.colors.error} />
                  </TouchableOpacity>
                </View>
              )}
            </View>

            {/* Split Configuration */}
            {selectedFriends.length > 0 && amount && parseFloat(amount) > 0 && (
              <View style={styles.splitConfigContainer}>
                <SplitConfig
                  totalAmount={parseFloat(amount)}
                  participants={[
                    { _id: user?._id || "", name: user?.name || "You", uid: user?.uid || "" },
                    selectedFriends[0]
                  ]}
                  splitType="equal"
                  onSplitChange={handleSplitChange}
                  paidBy={user?._id || ""}
                />
              </View>
            )}

            {/* Submit Button */}
            <Button
              title={`Add ${type === "income" ? "Income" : "Expense"}`}
              onPress={handleSubmit}
              loading={isLoading}
              disabled={isLoading}
              fullWidth
              style={styles.submitButton}
              variant="gradient"
              gradientColors={
                type === "income"
                  ? [theme.colors.success || "#10B981", theme.colors.success || "#059669"]
                  : [theme.colors.primary, theme.colors.primaryVariant || theme.colors.primary]
              }
            />
          </ScrollView>
        </KeyboardAvoidingView>
      </Animated.View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerGradient: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 24,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  closeButton: {
    padding: 8,
    borderRadius: 20,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  content: {
    flex: 1,
    marginTop: -20,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  card: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  amountCard: {
    borderRadius: 16,
    padding: 24,
    marginBottom: 16,
    alignItems: "center",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 16,
  },
  subSectionTitle: {
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 12,
  },
  amountInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  currencySymbol: {
    fontSize: 28,
    fontWeight: "600",
    marginRight: 8,
  },
  amountInput: {
    fontSize: 32,
    fontWeight: "700",
    textAlign: "center",
    paddingVertical: 8,
    minWidth: 150,
    borderBottomWidth: 2,
  },
  amountDisplay: {
    fontSize: 16,
    fontWeight: "500",
    marginTop: 8,
  },
  amountPlaceholder: {
    fontSize: 14,
    fontStyle: "italic",
    marginTop: 8,
  },
  errorText: {
    fontSize: 14,
    marginTop: 8,
    textAlign: "center",
  },
  typeToggleContainer: {
    flexDirection: "row",
    borderRadius: 12,
    borderWidth: 1,
    overflow: "hidden",
  },
  typeButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
    borderWidth: 1,
  },
  activeTypeButton: {
    borderWidth: 0,
  },
  typeButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
  categorySelector: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  categorySelectorText: {
    fontSize: 16,
    flex: 1,
  },
  quickCategories: {
    marginTop: 16,
  },
  categoryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  categoryItem: {
    width: "48%",
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  categoryIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  categoryText: {
    fontSize: 14,
    fontWeight: "500",
    flex: 1,
  },
  paymentModes: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  paymentModeButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 12,
    marginRight: 12,
  },
  activePaymentModeButton: {
    borderWidth: 0,
  },
  paymentModeText: {
    fontSize: 14,
    fontWeight: "500",
  },
  notesInput: {
    minHeight: 100,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    fontSize: 16,
  },
  selectedFriendContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 12,
    backgroundColor: "rgba(99, 102, 241, 0.1)",
    borderRadius: 12,
    marginTop: 12,
  },
  selectedFriendText: {
    fontSize: 16,
    fontWeight: "500",
    flex: 1,
  },
  splitConfigContainer: {
    marginBottom: 16,
  },
  submitButton: {
    marginTop: 8,
  },
});

export default AddTransactionScreen;