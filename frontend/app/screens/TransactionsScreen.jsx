import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, 
  Text, 
  FlatList, 
  TouchableOpacity, 
  TextInput,
  RefreshControl,
  Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withDelay,
} from 'react-native-reanimated';
import { useTransactions } from '../context/TransactionContext';
import { formatCurrency, getRelativeTime } from '../utils/formatting';
import { CATEGORIES } from '../utils/constants';
import AnimatedCard from '../components/animations/AnimatedCard';
import SlideInAnimation from '../components/animations/SlideInAnimation';
import PulseAnimation from '../components/animations/PulseAnimation';
import AppHeader from '../components/common/AppHeader';
import RefreshControlComponent from '../components/common/RefreshControl';
import { useFocusEffect } from '@react-navigation/native';

const TransactionsScreen = ({ navigation }) => {
  const { transactions, refreshData, deleteTransaction, isLoading } = useTransactions();
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredTransactions, setFilteredTransactions] = useState([]);
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [refreshing, setRefreshing] = useState(false);

  // Animation values
  const headerOpacity = useSharedValue(0);
  const searchBarScale = useSharedValue(0.9);

  // Handle pull-to-refresh
  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await refreshData(true); // Force refresh
    } catch (error) {
      console.error('Error refreshing data:', error);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    // Animate entrance
    headerOpacity.value = withTiming(1, { duration: 600 });
    searchBarScale.value = withDelay(200, withSpring(1, {
      damping: 15,
      stiffness: 150
    }));
  }, []);

  useEffect(() => {
    let filtered = [...transactions];

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(transaction =>
        transaction.category.toLowerCase().includes(query) ||
        transaction.description?.toLowerCase().includes(query) ||
        transaction.amount.toString().includes(query)
      );
    }

    // Apply type filter
    if (selectedFilter !== 'all') {
      filtered = filtered.filter(transaction => transaction.type === selectedFilter);
    }

    // Sort by date (newest first)
    filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    setFilteredTransactions(filtered);
  }, [transactions, searchQuery, selectedFilter]);

  const getCategoryIcon = (categoryName) => {
    const category = CATEGORIES.find(cat => cat.name === categoryName);
    return category ? category.icon : 'category';
  };

  const getCategoryColor = (categoryName) => {
    const category = CATEGORIES.find(cat => cat.name === categoryName);
    return category ? category.color : '#6366F1';
  };

  const handleDeleteTransaction = (transactionId) => {
    Alert.alert(
      'Delete Transaction',
      'Are you sure you want to delete this transaction?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: () => deleteTransaction(transactionId)
        }
      ]
    );
  };

  const handleTransactionPress = (transaction) => {
    navigation.navigate('TransactionDetails', { transaction });
  };

  const renderTransactionItem = ({ item, index }) => (
    <SlideInAnimation direction="right" delay={index * 50}>
      <TouchableOpacity 
        className="bg-white mx-4 mb-3 rounded-2xl p-4" 
        style={{
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 8,
          elevation: 3,
        }}
        activeOpacity={0.7}
        onPress={() => handleTransactionPress(item)}
      >
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center flex-1">
            <PulseAnimation duration={2000 + index * 100}>
              <View 
                className="w-12 h-12 rounded-full items-center justify-center mr-4"
                style={{ backgroundColor: getCategoryColor(item.category) }}
              >
                <MaterialIcons 
                  name={getCategoryIcon(item.category)} 
                  size={24} 
                  color="white" 
                />
              </View>
            </PulseAnimation>
            <View className="flex-1">
              <Text className="text-textPrimary font-bold text-base">
                {item.category}
              </Text>
              {item.description && (
                <Text className="text-textSecondary text-sm mt-1">
                  {item.description}
                </Text>
              )}
              <Text className="text-textSecondary text-xs mt-1">
                {getRelativeTime(item.createdAt)}
              </Text>
            </View>
          </View>
          
          <View className="items-end">
            <Text className={`font-bold text-lg ${
              item.type === 'income' ? 'text-secondary' : 'text-error'
            }`}>
              {item.type === 'income' ? '+' : '-'}{formatCurrency(item.amount)}
            </Text>
            <TouchableOpacity
              onPress={() => handleDeleteTransaction(item.id)}
              className="mt-2 p-1"
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <PulseAnimation duration={3000}>
                <MaterialIcons name="delete-outline" size={20} color="#EF4444" />
              </PulseAnimation>
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    </SlideInAnimation>
  );

  const FilterButton = ({ title, value, isSelected }) => (
    <TouchableOpacity
      onPress={() => setSelectedFilter(value)}
      className={`px-4 py-2 rounded-full mr-3 ${
        isSelected ? 'bg-primary' : 'bg-white'
      }`}
      style={!isSelected && {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
      }}
      activeOpacity={0.8}
    >
      {isSelected ? (
        <PulseAnimation duration={2000}>
          <Text className="font-medium text-white">
            {title}
          </Text>
        </PulseAnimation>
      ) : (
        <Text className="font-medium text-textSecondary">
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );

  const headerAnimatedStyle = useAnimatedStyle(() => ({
    opacity: headerOpacity.value,
  }));

  const searchBarAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: searchBarScale.value }],
  }));

  useFocusEffect(
    useCallback(() => {
      let isActive = true;
      
      const refreshOnFocus = async () => {
        if (isActive) {
          await refreshData();
        }
      };
      
      refreshOnFocus();
      
      return () => {
        isActive = false;
      };
    }, [refreshData])
  );

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: '#F8FAFC' }}>
      {/* Header */}
      <AppHeader 
        title="Transactions" 
        rightComponent={
          <TouchableOpacity 
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            onPress={() => {
              // Toggle advanced filters
              console.log('Advanced filters');
            }}
          >
            <PulseAnimation duration={3000}>
              <MaterialIcons name="filter-list" size={24} color="#1E293B" />
            </PulseAnimation>
          </TouchableOpacity>
        }
      />

      <Animated.View className="px-6 pb-2" style={headerAnimatedStyle}>

        {/* Search Bar */}
        <Animated.View style={searchBarAnimatedStyle}>
          <View className="bg-white rounded-2xl px-4 py-3 mb-4 flex-row items-center" style={{
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 8,
            elevation: 3,
          }}>
            <PulseAnimation duration={2500}>
              <MaterialIcons name="search" size={20} color="#64748B" />
            </PulseAnimation>
            <TextInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search transactions..."
              className="flex-1 ml-3 text-base text-textPrimary"
              placeholderTextColor="#64748B"
            />
          </View>
        </Animated.View>

        {/* Filter Buttons */}
        <SlideInAnimation direction="up" delay={600}>
          <View className="flex-row mb-4">
            <FilterButton 
              title={`All (${transactions.length})`}
              value="all" 
              isSelected={selectedFilter === 'all'} 
            />
            <FilterButton 
              title={`Income (${transactions.filter(t => t.type === 'income').length})`}
              value="income" 
              isSelected={selectedFilter === 'income'} 
            />
            <FilterButton 
              title={`Expense (${transactions.filter(t => t.type === 'expense').length})`}
              value="expense" 
              isSelected={selectedFilter === 'expense'} 
            />
          </View>
        </SlideInAnimation>
      </Animated.View>

      {/* Transactions List */}
      {filteredTransactions.length > 0 ? (
        <FlatList
          data={filteredTransactions}
          renderItem={renderTransactionItem}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing || isLoading}
              onRefresh={handleRefresh}
              colors={['#6366F1']}
              tintColor="#6366F1"
            />
          }
          contentContainerStyle={{ paddingBottom: 100 }}
        />
      ) : (
        <SlideInAnimation direction="up" delay={800}>
          <View className="flex-1 justify-center items-center px-6">
            <PulseAnimation duration={3000}>
              <MaterialIcons name="receipt-long" size={64} color="#CBD5E1" />
            </PulseAnimation>
            <Text className="text-xl font-bold text-textPrimary mt-4 mb-2">
              No transactions found
            </Text>
            <Text className="text-base text-textSecondary text-center">
              {searchQuery || selectedFilter !== 'all' 
                ? 'Try adjusting your search or filters'
                : 'Start by adding your first transaction'
              }
            </Text>
          </View>
        </SlideInAnimation>
      )}
    </SafeAreaView>
  );
};

export default TransactionsScreen;