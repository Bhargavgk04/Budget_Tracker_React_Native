import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { useAuth } from '../context/AuthContext';
import { useTransactions } from '../context/TransactionContext';
import { formatCurrency, getRelativeTime } from '../utils/formatting';
import { CATEGORIES } from '../utils/constants';
import AnimatedCard from '../components/animations/AnimatedCard';
import CountUpAnimation from '../components/animations/CountUpAnimation';
import MenuModal from '../components/common/MenuModal';
import RefreshControl from '../components/common/RefreshControl';
import { useNavigation, useFocusEffect } from '@react-navigation/native';

const DashboardScreen = () => {
  const { user } = useAuth();
  const { transactions, summary, refreshData, isLoading } = useTransactions();
  const navigation = useNavigation();
  const [showMenu, setShowMenu] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Animation values
  const headerOpacity = useSharedValue(0);

  // Auto-refresh when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      console.log('[DashboardScreen] Screen focused, refreshing data...');
      refreshData(true);
    }, [refreshData])
  );

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
    // Simple header animation
    headerOpacity.value = withTiming(1, { 
      duration: 400,
      easing: Easing.out(Easing.quad)
    });
  }, []);

  const recentTransactions = transactions.slice(0, 5);

  const headerAnimatedStyle = useAnimatedStyle(() => ({
    opacity: headerOpacity.value,
  }), []);

  const getCategoryIcon = (categoryName) => {
    const category = CATEGORIES.find(cat => cat.name === categoryName);
    return category ? category.icon : 'category';
  };

  const getCategoryColor = (categoryName) => {
    const category = CATEGORIES.find(cat => cat.name === categoryName);
    return category ? category.color : '#6366F1';
  };

  const renderTransactionItem = ({ item, index }) => (
    <AnimatedCard delay={index * 30} style={{ marginBottom: 8 }}>
      <TouchableOpacity 
        className="flex-row items-center justify-between py-3 px-4 bg-white rounded-xl"
        style={{
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.05,
          shadowRadius: 4,
          elevation: 2,
        }}
        activeOpacity={0.7}
      >
        <View className="flex-row items-center flex-1">
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
          <View className="flex-1">
            <Text className="text-textPrimary font-semibold text-base">
              {item.category}
            </Text>
            <Text className="text-textSecondary text-sm">
              {getRelativeTime(item.createdAt)}
            </Text>
          </View>
        </View>
        <Text 
          className={`font-bold text-base ${
            item.type === 'income' ? 'text-secondary' : 'text-error'
          }`}
        >
          {item.type === 'income' ? '+' : '-'}{formatCurrency(item.amount)}
        </Text>
      </TouchableOpacity>
    </AnimatedCard>
  );

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: '#F8FAFC' }}>
      {/* Header */}
      <Animated.View 
        className="flex-row items-center justify-between px-6 pt-4 pb-2"
        style={headerAnimatedStyle}
      >
        <TouchableOpacity 
          onPress={() => setShowMenu(true)}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          activeOpacity={0.7}
        >
          <MaterialIcons name="menu" size={24} color="#1E293B" />
        </TouchableOpacity>
        <Text className="text-sm text-textSecondary font-medium">Total Balance</Text>
        <TouchableOpacity 
          onPress={() => navigation.navigate('Profile')}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          activeOpacity={0.8}
        >
          <View className="w-10 h-10 bg-primary rounded-full items-center justify-center">
            <Text className="text-white font-bold text-base">
              {user?.name?.charAt(0)?.toUpperCase()}
            </Text>
          </View>
        </TouchableOpacity>
      </Animated.View>

      <ScrollView 
        className="flex-1" 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
          />
        }
      >
        {/* Balance Display */}
        <View className="px-6 mb-6">
          <CountUpAnimation
            endValue={summary.income - summary.expense}
            formatter={formatCurrency}
            style={{
              fontSize: 32,
              fontWeight: 'bold',
              color: '#1E293B',
              textAlign: 'center',
              marginBottom: 32
            }}
            delay={200}
          />

          {/* Card */}
          <AnimatedCard delay={300} style={{ marginBottom: 24 }}>
            <LinearGradient
              colors={['#8B5CF6', '#6366F1']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              className="rounded-2xl p-6"
              style={{
                shadowColor: '#6366F1',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.2,
                shadowRadius: 8,
                elevation: 6,
              }}
            >
              <Text className="text-white text-sm opacity-80 mb-2">Current Balance</Text>
              <CountUpAnimation
                endValue={summary.income - summary.expense}
                formatter={formatCurrency}
                style={{
                  color: 'white',
                  fontSize: 24,
                  fontWeight: 'bold',
                  marginBottom: 24
                }}
                delay={400}
              />
              
              <View className="flex-row items-center justify-between">
                <Text className="text-white text-sm opacity-80">
                  {user?.uid || '1234 5678 9012 3456'}
                </Text>
                <View className="flex-row">
                  <View className="w-8 h-8 bg-white bg-opacity-20 rounded-full mr-2" />
                  <View className="w-8 h-8 bg-white bg-opacity-30 rounded-full" />
                </View>
              </View>
              
              <View className="flex-row justify-between mt-4">
                <Text className="text-white text-xs opacity-60">
                  {new Date().toLocaleDateString('en-GB')}
                </Text>
                <Text className="text-white text-xs opacity-60">
                  CVV: ***
                </Text>
              </View>
            </LinearGradient>
          </AnimatedCard>

          {/* Quick Actions */}
          <AnimatedCard delay={500}>
            <View className="flex-row justify-center mb-6">
              <View className="flex-row bg-white rounded-full p-1 shadow-sm">
                <TouchableOpacity 
                  className="bg-primary px-6 py-2 rounded-full"
                  onPress={() => navigation.navigate('Add', { type: 'income' })}
                  activeOpacity={0.8}
                >
                  <Text className="text-white font-medium">Add Income</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  className="px-6 py-2"
                  onPress={() => navigation.navigate('Add', { type: 'expense' })}
                  activeOpacity={0.8}
                >
                  <Text className="text-textSecondary font-medium">Add Expense</Text>
                </TouchableOpacity>
              </View>
            </View>
          </AnimatedCard>
        </View>

        {/* Recent Transactions */}
        <AnimatedCard delay={600} style={{ marginHorizontal: 24, marginBottom: 24 }}>
          <View className="bg-white rounded-2xl p-6" style={{
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 8,
            elevation: 3,
          }}>
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-textPrimary text-lg font-bold">Recent Transactions</Text>
              <TouchableOpacity 
                onPress={() => navigation.navigate('Transactions')}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                activeOpacity={0.7}
              >
                <Text className="text-primary font-medium">See All</Text>
              </TouchableOpacity>
            </View>

            {recentTransactions.length > 0 ? (
              <FlatList
                data={recentTransactions}
                renderItem={renderTransactionItem}
                keyExtractor={(item) => item.id || item._id}
                scrollEnabled={false}
                showsVerticalScrollIndicator={false}
              />
            ) : (
              <View className="items-center py-8">
                <MaterialIcons name="receipt-long" size={48} color="#CBD5E1" />
                <Text className="text-textSecondary text-base mt-2">No transactions yet</Text>
                <Text className="text-textSecondary text-sm">Start by adding your first transaction</Text>
              </View>
            )}
          </View>
        </AnimatedCard>

        {/* Quick Stats */}
        <View className="flex-row px-6 mb-6">
          <AnimatedCard delay={700} style={{ flex: 1, marginRight: 12 }}>
            <View className="bg-white rounded-2xl p-4" style={{
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 8,
              elevation: 3,
            }}>
              <View className="flex-row items-center mb-2">
                <MaterialIcons name="trending-up" size={20} color="#10B981" />
                <Text className="text-secondary text-sm font-medium ml-2">Income</Text>
              </View>
              <CountUpAnimation
                endValue={summary.income}
                formatter={formatCurrency}
                style={{
                  color: '#1E293B',
                  fontSize: 20,
                  fontWeight: 'bold'
                }}
                delay={800}
              />
            </View>
          </AnimatedCard>
          
          <AnimatedCard delay={750} style={{ flex: 1, marginLeft: 12 }}>
            <View className="bg-white rounded-2xl p-4" style={{
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 8,
              elevation: 3,
            }}>
              <View className="flex-row items-center mb-2">
                <MaterialIcons name="trending-down" size={20} color="#EF4444" />
                <Text className="text-error text-sm font-medium ml-2">Expenses</Text>
              </View>
              <CountUpAnimation
                endValue={summary.expense}
                formatter={formatCurrency}
                style={{
                  color: '#1E293B',
                  fontSize: 20,
                  fontWeight: 'bold'
                }}
                delay={850}
              />
            </View>
          </AnimatedCard>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Menu Modal */}
      <MenuModal 
        visible={showMenu}
        onClose={() => setShowMenu(false)}
        navigation={navigation}
      />
    </SafeAreaView>
  );
};

export default DashboardScreen;
