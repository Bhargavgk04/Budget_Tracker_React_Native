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
import { useTransactions } from "@/hooks/useTransactions";
import Button from "@/components/common/Button";
import { formatCurrency } from "@/utils/formatting";
import { ValidationUtils } from "@/utils/validation";
import { DEFAULT_CATEGORIES, FEATURE_FLAGS } from "@/utils/constants";
import FriendSelector from "@/components/friends/FriendSelector";
import SplitConfig from "@/components/splits/SplitConfig";
import { TransactionFormData, Friend as FriendType, SplitFormData } from "@/types";

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
  const { addTransaction: addTransactionToContext } = useTransactions();
  
  // Debug mount and initial params
  useEffect(() => {
    console.log('AddTransactionScreen mounted with route params:', route?.params);
  }, []);
  
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
  const [selectedFriends, setSelectedFriends] = useState<FriendType[]>([]);
  const [splitConfig, setSplitConfig] = useState<SplitFormData | null>(null);
  const [showSplitConfig, setShowSplitConfig] = useState(false);
  const [multi, setMulti] = useState(false); // Enable multi-friend selection
  
  // UI state
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  
  // Refs
  const amountInputRef = useRef<RNTextInput>(null);
  const clearButtonScale = useRef(new Animated.Value(1)).current;

  // Filter categories based on transaction type
  const filteredCategories = (type === "income" ? DEFAULT_CATEGORIES.INCOME : DEFAULT_CATEGORIES.EXPENSE).filter((cat: any) => {
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
      console.log('Navigation focus event triggered');
      const selectedCategory = (route?.params as any)?.selectedCategory;
      console.log('Category selection focus event:', { selectedCategory, currentCategory: category, routeParams: route?.params });
      if (selectedCategory && selectedCategory !== category) {
        console.log('Setting category to:', selectedCategory);
        setCategory(selectedCategory);
        // Clear the param after setting it to prevent it from persisting
        if (navigation.setParams) {
          navigation.setParams({ selectedCategory: undefined });
        }
      } else {
        console.log('No category change needed:', { selectedCategory, currentCategory: category });
      }
    });

    return unsubscribe;
  }, [navigation, category, route?.params]);

  // Validate form
  const validateForm = () => {
    console.log('Validating form with:', { amount, category });
    const newErrors: Record<string, string> = {};
    
    if (!ValidationUtils.validateAmount(parseFloat(amount))) {
      newErrors.amount = "Please enter a valid amount greater than 0";
    }
    
    if (!category) {
      newErrors.category = "Please select a category";
    }
    
    console.log('Validation errors:', newErrors);
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async () => {
    console.log('handleSubmit called with:', { amount, category, type, paymentMode, notes, selectedFriends, splitConfig });
    
    if (!validateForm()) {
      console.log('Form validation failed');
      return;
    }

    // Show loading briefly for user feedback
    setIsLoading(true);
    
    const transactionData: any = {
      amount: parseFloat(amount),
      category,
      type,
      paymentMode,
      date: new Date().toISOString(), // Use current time to avoid future date issues
    };
    
    // Only add notes if it has a value
    if (notes && notes.trim()) {
      transactionData.notes = notes.trim();
    }

    const isDemoUser = user?.id === "demo-user-123";
    
    try {
      if (isDemoUser) {
        const { MockDataService } = await import("@/services/MockDataService");
        await MockDataService.addTransaction(transactionData);
      } else {
        // Add timeout protection (10 seconds to handle backend wake-up)
        const timeoutPromise = new Promise<{ success: false; error: string }>((_, reject) => 
          setTimeout(() => reject(new Error('Request timeout - backend may be sleeping. Please try again.')), 10000)
        );
        
        const result = await Promise.race([
          addTransactionToContext(transactionData),
          timeoutPromise
        ]);
        
        if (!result || !result.success) {
          throw new Error(result?.error || 'Failed to add transaction');
        }
        
        // Handle split creation if configured
        const createdId = result.data?._id || result.data?.id;
        if (splitConfig && createdId) {
          try {
            const SplitService = (await import("@/services/SplitService")).default;
            await SplitService.createSplit(createdId, splitConfig);
          } catch (e) {
            console.warn('Failed to create split:', e);
          }
        }
      }

      // Stop loading before navigation
      setIsLoading(false);
      
      // Reset form
      setAmount("");
      setCategory("");
      setNotes("");
      setSelectedFriends([]);
      setShowSplitConfig(false);
      setSplitConfig(null);
      
      // Show success and navigate back
      Alert.alert("Success", "Transaction added successfully");
      navigation.goBack();
      
    } catch (error) {
      console.error("Failed to add transaction:", error);
      Alert.alert("Error", error instanceof Error ? error.message : "Failed to add transaction. Please try again.");
      setIsLoading(false);
    }
  };

  // Handle friend selection for splitting
  const handleFriendSelect = (friend: FriendType) => {
    console.log('Friend selected in AddTransactionScreen:', friend);
    if (multi) {
      // Multi-friend mode handled by onSelectMany
      return;
    }
    setSelectedFriends([friend]);
    setShowSplitConfig(true);
  };

  // Handle multiple friends selection
  const handleMultipleFriendsSelect = (friends: FriendType[]) => {
    console.log('Multiple friends selected:', friends);
    setSelectedFriends(friends);
    if (friends.length > 0) {
      setShowSplitConfig(true);
    } else {
      setShowSplitConfig(false);
      setSplitConfig(null);
    }
  };

  // Handle friend UID change
  const handleFriendUidChange = (uid: string) => {
    console.log('Friend UID changed:', uid);
    // This is needed for the FriendSelector component
  };

  // Handle split configuration changes
  const handleSplitChange = (split: SplitFormData) => {
    console.log('Split configuration changed:', split);
    setSplitConfig(split);
  };

  // Navigate to category picker
  const openCategoryPicker = () => {
    console.log('Opening CategoryPicker with:', { type, selectedCategory: category || undefined });
    navigation.navigate("CategoryPicker", {
      type,
      selectedCategory: category || undefined,
    });
  };

  // Handle amount input change with enhanced formatting and validation
  const handleAmountChange = (text: string) => {
    // Remove any non-numeric characters except decimal point
    let cleaned = text.replace(/[^0-9.]/g, '');
    
    // Handle empty input
    if (cleaned === '') {
      setAmount('');
      clearAmountError();
      return;
    }
    
    // Ensure only one decimal point
    const parts = cleaned.split('.');
    if (parts.length > 2) {
      cleaned = parts[0] + '.' + parts.slice(1).join('');
    }
    
    // Limit to 2 decimal places
    if (parts[1] && parts[1].length > 2) {
      cleaned = parts[0] + '.' + parts[1].substring(0, 2);
    }
    
    // Prevent leading zeros (except for decimals like 0.50)
    if (cleaned.length > 1 && cleaned[0] === '0' && cleaned[1] !== '.') {
      cleaned = cleaned.substring(1);
    }
    
    // Prevent values exceeding 9999999.99
    const numValue = parseFloat(cleaned);
    if (numValue > 9999999.99) {
      cleaned = '9999999.99';
    }
    
    // Set the cleaned value
    setAmount(cleaned);
    
    // Validate amount and clear error if valid
    if (ValidationUtils.validateAmount(parseFloat(cleaned))) {
      clearAmountError();
    }
  };

  // Clear amount error
  const clearAmountError = () => {
    console.log('Clearing amount error');
    setErrors(prev => {
      const newErrors = {...prev};
      delete newErrors.amount;
      return newErrors;
    });
  };

  // Clear amount with animation
  const clearAmountWithAnimation = () => {
    Animated.sequence([
      Animated.timing(clearButtonScale, {
        toValue: 0.8,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(clearButtonScale, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      })
    ]).start(() => {
      setAmount('');
      clearAmountError();
      if (amountInputRef.current) {
        amountInputRef.current.focus();
      }
    });
  };

  // Format amount for display with proper currency formatting
  const formatDisplayAmount = (value: string) => {
    if (!value) return "";
    const num = parseFloat(value);
    return isNaN(num) ? "" : formatCurrency(num);
  };

  // Handle amount input blur to format the value
  const handleAmountBlur = () => {
    setFocusedField(null);
    
    // Format the amount when user leaves the field
    if (amount && ValidationUtils.validateAmount(parseFloat(amount))) {
      const formatted = parseFloat(amount).toFixed(2);
      setAmount(formatted);
    }
  };

  // Handle amount input focus
  const handleAmountFocus = () => {
    setFocusedField("amount");
    // When focusing, remove trailing zeros for easier editing
    if (amount && amount.includes('.')) {
      const trimmed = parseFloat(amount).toString();
      setAmount(trimmed);
    }
  };

  // Show hint when amount is focused and empty
  const showAmountHint = focusedField === "amount" && !amount;

  // Render category item
  const renderCategoryItem = (item: any) => (
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
            keyboardShouldPersistTaps="handled"
          >
            {/* Amount Input Section */}
            <View 
              style={[
                styles.amountCard,
                {
                  backgroundColor: theme.colors.surface,
                  ...(theme.shadows ? theme.shadows.lg : {}),
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
                  onFocus={handleAmountFocus}
                  onBlur={handleAmountBlur}
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
                {amount ? (
                  <Animated.View style={{ transform: [{ scale: clearButtonScale }] }}>
                    <TouchableOpacity
                      style={styles.clearButton}
                      onPress={clearAmountWithAnimation}
                      activeOpacity={0.7}
                    >
                      <MaterialIcons name="close" size={20} color={theme.colors.textTertiary} />
                    </TouchableOpacity>
                  </Animated.View>
                ) : null}
              </View>
              
              {amount ? (
                <Text style={[styles.amountDisplay, { color: theme.colors.textSecondary }]}>
                  {formatDisplayAmount(amount)}
                </Text>
              ) : showAmountHint ? (
                <Text style={[styles.amountPlaceholder, { color: theme.colors.primary, fontStyle: 'normal' }]}>
                  Enter transaction amount
                </Text>
              ) : (
                <Text style={[styles.amountPlaceholder, { color: theme.colors.textTertiary }]}>Enter transaction amount
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
                  ...(theme.shadows ? theme.shadows.md : {})
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
                  ...(theme.shadows ? theme.shadows.md : {})
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
                accessibilityLabel="Select category"
                accessibilityHint="Tap to select a category for this transaction"
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
              {FEATURE_FLAGS.QUICK_CATEGORY_SELECT && !category && (
                <View style={{ marginTop: 8 }}>
                  <Text style={[styles.sectionTitle, { color: theme.colors.onSurface + '80' }]}>Popular Categories</Text>
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
                  ...(theme.shadows ? theme.shadows.md : {})
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
                  ...(theme.shadows ? theme.shadows.md : {})
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
                  ...(theme.shadows ? theme.shadows.md : {}),
                  zIndex: 100
                }
              ]}
            >
              <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>
                Split with Friends (Optional)
              </Text>
              
              <View style={styles.friendSelectorContainer}>
                <FriendSelector
                  value={selectedFriends.length > 0 ? selectedFriends[0].uid : ""}
                  onSelect={handleFriendSelect}
                  onUidChange={handleFriendUidChange}
                  placeholder="Select friends to split with..."
                  multi={true}
                  onSelectMany={handleMultipleFriendsSelect}
                  maxFriends={6}
                />
                {selectedFriends.length > 0 && (
                  <Text style={{ marginTop: 4, fontSize: 12, color: theme.colors.textSecondary }}>
                    Selected: {selectedFriends.map(f => f.name).join(', ')}
                  </Text>
                )}
              </View>
              {selectedFriends.length > 0 && (
                <Text style={{ marginTop: 8, color: theme.colors.textSecondary, fontSize: 14 }}>
                  Tap 'X' on selected friends to remove them
                </Text>
              )}
              
              {selectedFriends.length > 0 && (
                <View style={styles.selectedFriendContainer}>
                  <Text style={[styles.selectedFriendText, { color: theme.colors.textPrimary }]}>
                    Selected Friends ({selectedFriends.length})
                  </Text>
                  <TouchableOpacity
                    onPress={() => {
                      setSelectedFriends([]);
                      setShowSplitConfig(false);
                      setSplitConfig(null);
                    }}
                    style={styles.clearFriendsButton}
                  >
                    <MaterialIcons name="clear" size={20} color="#dc3545" />
                  </TouchableOpacity>
                </View>
              )}
            </View>

            {/* Split Configuration */}
            {selectedFriends.length > 0 && amount && parseFloat(amount) > 0 && (
              <View style={styles.splitConfigContainer}>
                <Text style={{ fontSize: 16, fontWeight: '600', color: theme.colors.textPrimary, marginBottom: 8 }}>
                  Split Configuration
                </Text>
                <SplitConfig
                  totalAmount={parseFloat(amount)}
                  participants={[
                    { _id: user?.id || "", uid: user?.uid || "", name: user?.name || "You", email: "", balance: { amount: 0, direction: 'settled' }, friendshipStatus: 'accepted', friendshipId: "" },
                    ...selectedFriends
                  ]}
                  splitType="equal"
                  onSplitChange={handleSplitChange}
                  paidBy={user?.id || ""}
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
    paddingBottom: 100, // Extra padding to ensure FriendSelector dropdown has space
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
    position: 'relative',
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
  clearButton: {
    position: 'absolute',
    right: 10,
    padding: 5,
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
  friendSelectorContainer: {
    position: 'relative',
    zIndex: 1000,
  },
  selectedFriendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
    padding: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
  },
  selectedFriendText: {
    fontSize: 16,
    fontWeight: '600',
  },
  clearFriendsButton: {
    padding: 4,
    borderRadius: 12,
  },
  splitConfigContainer: {
    marginTop: 16,
    padding: 16,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    marginBottom: 16,
  },
  submitButton: {
    marginTop: 8,
  },
});

export default AddTransactionScreen;
