import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  Modal,
  FlatList,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withDelay,
  withSequence,
} from 'react-native-reanimated';
import { useAuth } from '../context/AuthContext';
import { useTransactions } from '../context/TransactionContext';
import { transactionAPI } from '../services/api';
import { CATEGORIES, TRANSACTION_TYPES } from '../utils/constants';
import { formatCurrency } from '../utils/formatting';
import AnimatedCard from '../components/animations/AnimatedCard';
import SlideInAnimation from '../components/animations/SlideInAnimation';
import PulseAnimation from '../components/animations/PulseAnimation';
import FriendSelector from '../components/friends/FriendSelector';
import SplitConfig from '../components/splits/SplitConfig';

const AddTransactionScreen = ({ navigation, route }) => {
  const { user } = useAuth();
  const { addTransaction } = useTransactions();
  
  const [amount, setAmount] = useState('');
  const [type, setType] = useState(route?.params?.type || TRANSACTION_TYPES.EXPENSE);
  const [category, setCategory] = useState('');

  // Debugging: Log category changes
  useEffect(() => {
    console.log('Category state updated:', category);
  }, [category]);
  const [description, setDescription] = useState('');
  const [paymentMode, setPaymentMode] = useState('cash');
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // Friend and split state
  const [friendUid, setFriendUid] = useState('');
  const [selectedFriend, setSelectedFriend] = useState(null);
  const [showSplitConfig, setShowSplitConfig] = useState(false);
  const [splitData, setSplitData] = useState(null);

  // Listen for navigation focus to check for selected category
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      // Check if we have a selected category from params
      const selectedCategory = route?.params?.selectedCategory;
      if (selectedCategory && selectedCategory !== category) {
        setCategory(selectedCategory);
      }
    });

    return unsubscribe;
  }, [navigation, category]);

  // New user modal state
  const [showNewUserModal, setShowNewUserModal] = useState(false);
  const [newUserName, setNewUserName] = useState('');
  const [newUserUid, setNewUserUid] = useState('');

  // Animation values
  const headerOpacity = useSharedValue(0);
  const amountScale = useSharedValue(0.8);
  const buttonScale = useSharedValue(0);

  useEffect(() => {
    // Animate entrance
    headerOpacity.value = withTiming(1, { duration: 600 });
    amountScale.value = withDelay(200, withSpring(1, {
      damping: 15,
      stiffness: 150
    }));
    buttonScale.value = withDelay(400, withSpring(1, {
      damping: 20,
      stiffness: 100
    }));
  }, []); // Fixed: Kept empty dependency array since these are one-time animations

  const headerAnimatedStyle = useAnimatedStyle(() => ({
    opacity: headerOpacity.value,
  }));

  const amountAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: amountScale.value }],
  }));

  const buttonAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: buttonScale.value }],
  }));

  const incomeCategories = ['Salary', 'Freelance', 'Investment'];
  
  const filteredCategories = CATEGORIES.filter(cat => {
    if (type === TRANSACTION_TYPES.INCOME) {
      return incomeCategories.includes(cat.name);
    }
    return !incomeCategories.includes(cat.name);
  });

  const handleFriendSelect = (friend) => {
    if (friend.isNew) {
      setNewUserName(friend.name);
      setNewUserUid(friend.uid);
      setShowNewUserModal(true);
      return;
    }
    setSelectedFriend(friend);
    setFriendUid(friend.uid);
    setShowSplitConfig(true);
  };

  const handleSplitChange = (split) => {
    setSplitData(split);
  };

  const handleCreateNewUser = () => {
    if (!newUserName) {
      Alert.alert('Error', 'Please enter a name for the new user');
      return;
    }
    // Create a pseudo-friend object for non-app user
    const newFriend = {
      uid: newUserUid || newUserName,
      name: newUserName,
      isNew: true,
      _id: `temp_${Date.now()}`
    };
    setSelectedFriend(newFriend);
    setFriendUid(newFriend.uid);
    setShowSplitConfig(true);
    setShowNewUserModal(false);
  };

  const handleSave = async () => {
    console.log('Attempting to save transaction');
    console.log('Amount:', amount);
    console.log('Category:', category);
    console.log('Type:', type);
    
    if (!amount || !category) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    if (isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }

    // Validate split if friend is selected
    if (selectedFriend && showSplitConfig && !splitData) {
      Alert.alert('Error', 'Please configure the split before saving');
      return;
    }

    setIsLoading(true);

    try {
      const transactionData = {
        type,
        amount: parseFloat(amount),
        category,
        notes: description.trim(),
        paymentMode,
        date: new Date().toISOString(),
        friendUid: selectedFriend ? friendUid : undefined,
        friendId: selectedFriend ? selectedFriend._id : undefined,
        splitInfo: splitData ? {
          isShared: true,
          paidBy: user._id,
          splitType: splitData.splitType,
          participants: splitData.participants
        } : undefined
      };

      console.log('Sending transaction data:', transactionData);
      const result = await addTransaction(transactionData);
      console.log('Transaction result:', result);
      
      if (result.success) {
        Alert.alert('Success', 'Transaction added successfully', [
          { text: 'OK', onPress: () => navigation.goBack() }
        ]);
      } else {
        Alert.alert('Error', result.error || 'Failed to add transaction');
      }
    } catch (error) {
      console.error('Error adding transaction:', error);
      Alert.alert('Error', 'Failed to add transaction');
    } finally {
      setIsLoading(false);
    }
  };

  const renderCategoryItem = ({ item, index }) => (
    <SlideInAnimation direction="right" delay={index * 50}>
      <TouchableOpacity
        onPress={() => {
          console.log('Category selected:', item.name);
          setCategory(item.name);
          // Navigate back instead of just closing modal
          navigation.goBack();
        }}
        className="bg-white mx-4 mb-3 rounded-2xl p-4 flex-row items-center"
        style={{
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 8,
          elevation: 3,
        }}
      >
        <PulseAnimation duration={2000 + index * 200}>
          <View 
            className="w-12 h-12 rounded-full items-center justify-center mr-4"
            style={{ backgroundColor: item.color }}
          >
            <MaterialIcons name={item.icon} size={24} color="white" />
          </View>
        </PulseAnimation>
        <Text className="text-base font-medium text-textPrimary">{item.name}</Text>
      </TouchableOpacity>
    </SlideInAnimation>
  );

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: '#F8FAFC' }}>
      {/* Header */}
      <Animated.View 
        className="flex-row items-center justify-between px-6 pt-4 pb-2"
        style={headerAnimatedStyle}
      >
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <PulseAnimation duration={3000}>
            <MaterialIcons name="arrow-back" size={24} color="#1E293B" />
          </PulseAnimation>
        </TouchableOpacity>
        <SlideInAnimation direction="down" delay={300}>
          <Text className="text-xl font-bold text-textPrimary">Add Transaction</Text>
        </SlideInAnimation>
        <View style={{ width: 24 }} />
      </Animated.View>

      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScrollView 
          className="flex-1" 
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
        {/* Amount Input Card */}
        <AnimatedCard delay={600} style={{ marginHorizontal: 24, marginBottom: 24, marginTop: 16 }}>
          <View className="bg-white rounded-2xl p-8 items-center justify-center" style={{
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 8,
            elevation: 3,
            minHeight: 180,
          }}>
            <SlideInAnimation direction="down" delay={800}>
              <Text className="text-lg font-semibold text-textPrimary mb-6 text-center">
                Enter Amount
              </Text>
            </SlideInAnimation>
            <Animated.View className="items-center justify-center flex-1 w-full" style={amountAnimatedStyle}>
              <View className="flex-row items-center justify-center mb-4 w-full max-w-xs">
                <PulseAnimation duration={2000}>
                  <Text className="text-4xl font-bold text-textSecondary mr-3">₹</Text>
                </PulseAnimation>
                <TextInput
                  value={amount}
                  onChangeText={(text) => {
                    // Allow only numeric input with decimal point
                    if (text === '' || /^\d*\.?\d*$/.test(text)) {
                      setAmount(text);
                    }
                  }}
                  placeholder="0.00"
                  keyboardType="decimal-pad"
                  className="text-5xl font-bold text-primary flex-1 text-center"
                  style={{ minWidth: 150, textAlign: 'center', padding: 0 }}
                  placeholderTextColor="#CBD5E1"
                  returnKeyType="done"
                  autoFocus={true}
                />
              </View>
              <SlideInAnimation direction="up" delay={1000}>
                <Text className="text-sm text-textSecondary mt-2 text-center">
                  {amount ? `Total: ${formatCurrency(parseFloat(amount) || 0)}` : 'Enter transaction amount'}
                </Text>
              </SlideInAnimation>
            </Animated.View>
          </View>
        </AnimatedCard>

        {/* Type Toggle */}
        <AnimatedCard delay={1200} style={{ marginHorizontal: 24, marginBottom: 24 }}>
          <View className="bg-white rounded-2xl p-6" style={{
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 8,
            elevation: 3,
          }}>
            <SlideInAnimation direction="left" delay={1400}>
              <Text className="text-base font-semibold text-textPrimary mb-4">
                Transaction Type
              </Text>
            </SlideInAnimation>
            <SlideInAnimation direction="right" delay={1600}>
              <View className="flex-row bg-gray-100 rounded-2xl p-1">
                <TouchableOpacity
                  onPress={() => setType(TRANSACTION_TYPES.EXPENSE)}
                  className={`flex-1 py-3 rounded-xl ${
                    type === TRANSACTION_TYPES.EXPENSE ? '' : 'bg-transparent'
                  }`}
                >
                  {type === TRANSACTION_TYPES.EXPENSE ? (
                    <LinearGradient
                      colors={['#EF4444', '#DC2626']}
                      className="py-3 rounded-xl"
                    >
                      <Text className="text-center font-semibold text-white">
                        Expense
                      </Text>
                    </LinearGradient>
                  ) : (
                    <Text className="text-center font-semibold text-textSecondary py-3">
                      Expense
                    </Text>
                  )}
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setType(TRANSACTION_TYPES.INCOME)}
                  className={`flex-1 py-3 rounded-xl ${
                    type === TRANSACTION_TYPES.INCOME ? '' : 'bg-transparent'
                  }`}
                >
                  {type === TRANSACTION_TYPES.INCOME ? (
                    <LinearGradient
                      colors={['#10B981', '#059669']}
                      className="py-3 rounded-xl"
                    >
                      <Text className="text-center font-semibold text-white">
                        Income
                      </Text>
                    </LinearGradient>
                  ) : (
                    <Text className="text-center font-semibold text-textSecondary py-3">
                      Income
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            </SlideInAnimation>
          </View>
        </AnimatedCard>

        {/* Category Selection */}
        <View className="bg-white mx-6 rounded-2xl p-6 mb-6" style={{
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 8,
          elevation: 3,
        }}>
          <Text className="text-base font-semibold text-textPrimary mb-4">
            Category
          </Text>
          <TouchableOpacity
            onPress={() => {
              console.log('Opening category modal');
              // Pass current type and selected category to picker
              navigation.navigate('CategoryPicker', {
                type: type,
                selectedCategory: category
              });
            }}
            className="bg-gray-50 rounded-2xl p-4 flex-row items-center justify-between"
          >
            <Text className={`text-base ${category ? 'text-textPrimary font-medium' : 'text-textSecondary'}`}>
              {category || 'Select category'}
            </Text>
            <MaterialIcons name="keyboard-arrow-down" size={24} color="#64748B" />
          </TouchableOpacity>
        </View>

        {/* Payment Mode Selection */}
        <View className="bg-white mx-6 rounded-2xl p-6 mb-6" style={{
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 8,
          elevation: 3,
        }}>
          <Text className="text-base font-semibold text-textPrimary mb-4">
            Payment Mode
          </Text>
          <View className="flex-row justify-around">
            {['cash', 'upi', 'card', 'bank_transfer'].map(mode => (
              <TouchableOpacity
                key={mode}
                onPress={() => setPaymentMode(mode)}
                className={`py-2 px-4 rounded-full ${paymentMode === mode ? 'bg-blue-500' : 'bg-gray-200'}`}
              >
                <Text className={`font-semibold ${paymentMode === mode ? 'text-white' : 'text-gray-600'}`}>
                  {mode === 'bank_transfer' ? 'Bank' : mode.charAt(0).toUpperCase() + mode.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Description */}
        <View className="bg-white mx-6 rounded-2xl p-6 mb-6" style={{
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 8,
          elevation: 3,
        }}>
          <Text className="text-base font-semibold text-textPrimary mb-4">
            Description (Optional)
          </Text>
          <TextInput
            value={description}
            onChangeText={setDescription}
            placeholder="Add a note about this transaction..."
            multiline
            numberOfLines={3}
            className="bg-gray-50 rounded-2xl p-4 text-base text-textPrimary"
            textAlignVertical="top"
            placeholderTextColor="#64748B"
            returnKeyType="done"
            blurOnSubmit
          />
        </View>

        {/* Friend Selector */}
        <View className="bg-white mx-6 rounded-2xl p-6 mb-6" style={{
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 8,
          elevation: 3,
        }}>
          <Text className="text-base font-semibold text-textPrimary mb-4">
            Split with Friend (Optional)
          </Text>
          <FriendSelector
            value={friendUid}
            onSelect={handleFriendSelect}
            onUidChange={setFriendUid}
            placeholder="Enter friend UID to split expense..."
          />
          {selectedFriend && (
            <View className="mt-4 p-3 bg-blue-50 rounded-xl">
              <Text className="text-sm text-blue-800">
                Selected: {selectedFriend.name}
              </Text>
              <TouchableOpacity
                onPress={() => {
                  setSelectedFriend(null);
                  setFriendUid('');
                  setShowSplitConfig(false);
                  setSplitData(null);
                }}
                className="mt-2"
              >
                <Text className="text-sm text-blue-600 font-medium">Remove</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Split Configuration */}
        {selectedFriend && showSplitConfig && amount && parseFloat(amount) > 0 && (
          <View className="mx-6 mb-6">
            <SplitConfig
              totalAmount={parseFloat(amount)}
              participants={[
                { _id: user._id, name: user.name || 'You', uid: user.uid },
                selectedFriend
              ]}
              splitType="equal"
              onSplitChange={handleSplitChange}
              paidBy={user._id}
            />
          </View>
        )}

        {/* Save Button */}
        <Animated.View className="px-6 mb-8" style={buttonAnimatedStyle}>
          <TouchableOpacity
            onPress={handleSave}
            disabled={isLoading}
            className="rounded-2xl overflow-hidden"
          >
            <PulseAnimation duration={2000} scale={1.02}>
              <LinearGradient
                colors={isLoading ? ['#9CA3AF', '#6B7280'] : ['#6366F1', '#8B5CF6']}
                className="py-4"
              >
                <Text className="text-white text-center font-bold text-lg">
                  {isLoading ? 'Saving Transaction...' : 'Save Transaction'}
                </Text>
              </LinearGradient>
            </PulseAnimation>
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>
      </KeyboardAvoidingView>

      {/* Category Selection Modal */}
      <Modal
        visible={showCategoryModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView className="flex-1" style={{ backgroundColor: '#F8FAFC' }}>
          <View className="flex-row items-center justify-between px-6 pt-4 pb-2">
            <TouchableOpacity onPress={() => setShowCategoryModal(false)}>
              <MaterialIcons name="close" size={24} color="#1E293B" />
            </TouchableOpacity>
            <Text className="text-xl font-bold text-textPrimary">Select Category</Text>
            <View style={{ width: 24 }} />
          </View>
          
          <FlatList
            data={filteredCategories}
            renderItem={renderCategoryItem}
            keyExtractor={(item) => item.id}
            className="flex-1 pt-4"
            showsVerticalScrollIndicator={false}
          />
        </SafeAreaView>
      </Modal>

      {/* New User Modal */}
      <Modal
        visible={showNewUserModal}
        animationType="slide"
        transparent
      >
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.3)' }}>
          <View style={{ backgroundColor: 'white', padding: 24, borderRadius: 16, width: '80%' }}>
            <Text style={{ fontWeight: 'bold', fontSize: 18, marginBottom: 12 }}>Add New Person</Text>
            <TextInput
              value={newUserName}
              onChangeText={setNewUserName}
              placeholder="Name"
              style={{ borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 10, marginBottom: 12 }}
            />
            <TextInput
              value={newUserUid}
              onChangeText={setNewUserUid}
              placeholder="UID (optional)"
              style={{ borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 10, marginBottom: 12 }}
            />
            <View style={{ flexDirection: 'row', justifyContent: 'flex-end' }}>
              <TouchableOpacity onPress={() => setShowNewUserModal(false)} style={{ marginRight: 16 }}>
                <Text style={{ color: '#888' }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleCreateNewUser}>
                <Text style={{ color: '#007AFF', fontWeight: 'bold' }}>Add</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

export default AddTransactionScreen;