import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { PieChart, BarChart } from 'react-native-chart-kit';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withDelay,
} from 'react-native-reanimated';
import { useTransactions } from '../context/TransactionContext';
import { formatCurrency } from '../utils/formatting';
import AnimatedCard from '../components/animations/AnimatedCard';
import SlideInAnimation from '../components/animations/SlideInAnimation';
import CountUpAnimation from '../components/animations/CountUpAnimation';
import PulseAnimation from '../components/animations/PulseAnimation';
import AppHeader from '../components/common/AppHeader';

const { width: screenWidth } = Dimensions.get('window');

const AnalyticsScreen = () => {
  const { summary, categoryBreakdown, transactions, refreshData } = useTransactions();
  const [selectedPeriod, setSelectedPeriod] = useState('month');

  // Animation values
  const headerOpacity = useSharedValue(0);
  const chartsScale = useSharedValue(0.8);

  useEffect(() => {
    // Data is already loaded by TransactionContext
    
    // Animate entrance
    headerOpacity.value = withTiming(1, { duration: 600 });
    chartsScale.value = withDelay(400, withSpring(1, {
      damping: 15,
      stiffness: 150
    }));
  }, []);

  // Prepare pie chart data
  const pieChartData = categoryBreakdown
    .filter(item => item.type === 'expense' && item.total > 0)
    .slice(0, 5)
    .map((item, index) => ({
      name: item.category,
      population: item.total,
      color: ['#6366F1', '#8B5CF6', '#EC4899', '#F59E0B', '#10B981'][index],
      legendFontColor: '#1E293B',
      legendFontSize: 12,
    }));

  // Calculate weekly spending trends based on actual data
  const getWeeklyData = () => {
    const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const weeklySpending = new Array(7).fill(0);
    
    // Get transactions from last 7 days
    const lastWeek = new Date();
    lastWeek.setDate(lastWeek.getDate() - 7);
    
    transactions
      .filter(t => t.type === 'expense' && new Date(t.createdAt) >= lastWeek)
      .forEach(transaction => {
        const dayIndex = new Date(transaction.createdAt).getDay();
        weeklySpending[dayIndex] += transaction.amount;
      });

    return {
      labels: weekDays,
      datasets: [
        {
          data: weeklySpending.map(amount => amount || 100), // Minimum 100 for chart visibility
          color: (opacity = 1) => `rgba(99, 102, 241, ${opacity})`,
        },
      ],
    };
  };

  const barChartData = getWeeklyData();

  const chartConfig = {
    backgroundColor: '#ffffff',
    backgroundGradientFrom: '#ffffff',
    backgroundGradientTo: '#ffffff',
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(99, 102, 241, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(30, 41, 59, ${opacity})`,
    style: {
      borderRadius: 16,
    },
    propsForLabels: {
      fontSize: 12,
    },
  };

  const PeriodButton = ({ title, value, isSelected }) => (
    <TouchableOpacity
      onPress={() => setSelectedPeriod(value)}
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

  const chartsAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: chartsScale.value }],
  }));

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: '#F8FAFC' }}>
      {/* Header */}
      <AppHeader 
        title="Analytics" 
        subtitle={`${selectedPeriod.charAt(0).toUpperCase() + selectedPeriod.slice(1)} Overview`}
      />

      <Animated.View className="px-6 pb-2" style={headerAnimatedStyle}>
        {/* Period Selector */}
        <SlideInAnimation direction="up" delay={400}>
          <View className="flex-row mb-4">
            <PeriodButton 
              title="Week" 
              value="week" 
              isSelected={selectedPeriod === 'week'} 
            />
            <PeriodButton 
              title="Month" 
              value="month" 
              isSelected={selectedPeriod === 'month'} 
            />
            <PeriodButton 
              title="Year" 
              value="year" 
              isSelected={selectedPeriod === 'year'} 
            />
          </View>
        </SlideInAnimation>
      </Animated.View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Summary Cards */}
        <View className="px-6 mb-6">
          <View className="flex-row justify-between">
            <AnimatedCard delay={600} style={{ flex: 1, marginRight: 8 }}>
              <View className="bg-white rounded-2xl p-4" style={{
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 8,
                elevation: 3,
              }}>
                <SlideInAnimation direction="left" delay={800}>
                  <View className="flex-row items-center mb-2">
                    <PulseAnimation duration={2000}>
                      <MaterialIcons name="trending-up" size={20} color="#10B981" />
                    </PulseAnimation>
                    <Text className="text-secondary text-sm font-medium ml-2">Income</Text>
                  </View>
                </SlideInAnimation>
                <CountUpAnimation
                  endValue={summary.income}
                  formatter={formatCurrency}
                  style={{
                    color: '#1E293B',
                    fontSize: 20,
                    fontWeight: 'bold'
                  }}
                  delay={1000}
                />
                <SlideInAnimation direction="up" delay={1200}>
                  <Text className="text-secondary text-xs mt-1">+12% from last month</Text>
                </SlideInAnimation>
              </View>
            </AnimatedCard>
            
            <AnimatedCard delay={700} style={{ flex: 1, marginLeft: 8 }}>
              <View className="bg-white rounded-2xl p-4" style={{
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 8,
                elevation: 3,
              }}>
                <SlideInAnimation direction="right" delay={900}>
                  <View className="flex-row items-center mb-2">
                    <PulseAnimation duration={2500}>
                      <MaterialIcons name="trending-down" size={20} color="#EF4444" />
                    </PulseAnimation>
                    <Text className="text-error text-sm font-medium ml-2">Expenses</Text>
                  </View>
                </SlideInAnimation>
                <CountUpAnimation
                  endValue={summary.expense}
                  formatter={formatCurrency}
                  style={{
                    color: '#1E293B',
                    fontSize: 20,
                    fontWeight: 'bold'
                  }}
                  delay={1100}
                />
                <SlideInAnimation direction="up" delay={1300}>
                  <Text className="text-error text-xs mt-1">+8% from last month</Text>
                </SlideInAnimation>
              </View>
            </AnimatedCard>
          </View>
        </View>

        {/* Spending Chart */}
        <AnimatedCard delay={1400} style={{ marginHorizontal: 24, marginBottom: 24 }}>
          <View className="bg-white rounded-2xl p-6" style={{
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 8,
            elevation: 3,
          }}>
            <SlideInAnimation direction="left" delay={1600}>
              <Text className="text-textPrimary text-lg font-bold mb-4">Spend Chart</Text>
            </SlideInAnimation>
            
            {/* Bar Chart */}
            <Animated.View style={chartsAnimatedStyle}>
              <BarChart
                data={barChartData}
                width={screenWidth - 80}
                height={200}
                chartConfig={chartConfig}
                style={{
                  marginVertical: 8,
                  borderRadius: 16,
                }}
                showBarTops={false}
                fromZero={true}
              />
            </Animated.View>
          </View>
        </AnimatedCard>

        {/* Category Breakdown */}
        {pieChartData.length > 0 && (
          <View className="bg-white mx-6 rounded-2xl p-6 mb-6" style={{
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 8,
            elevation: 3,
          }}>
            <Text className="text-textPrimary text-lg font-bold mb-4">Breakdown</Text>
            
            <PieChart
              data={pieChartData}
              width={screenWidth - 80}
              height={200}
              chartConfig={chartConfig}
              accessor="population"
              backgroundColor="transparent"
              paddingLeft="15"
              style={{
                marginVertical: 8,
                borderRadius: 16,
              }}
            />

            {/* Category Percentages */}
            <View className="flex-row flex-wrap justify-between mt-4">
              {pieChartData.map((item, index) => {
                const percentage = ((item.population / summary.expense) * 100).toFixed(0);
                return (
                  <View key={index} className="flex-row items-center mb-2" style={{ width: '48%' }}>
                    <View 
                      className="w-3 h-3 rounded-full mr-2"
                      style={{ backgroundColor: item.color }}
                    />
                    <Text className="text-textSecondary text-sm flex-1">{item.name}</Text>
                    <Text className="text-textPrimary font-bold text-sm">{percentage}%</Text>
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {/* Account Info */}
        <View className="bg-white mx-6 rounded-2xl p-6 mb-6" style={{
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 8,
          elevation: 3,
        }}>
          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-textPrimary text-lg font-bold">Account Details</Text>
            <TouchableOpacity className="bg-primary px-4 py-2 rounded-full">
              <Text className="text-white font-medium text-sm">Export Data</Text>
            </TouchableOpacity>
          </View>
          
          <View className="border-t border-gray-100 pt-4">
            <View className="flex-row justify-between mb-3">
              <Text className="text-textSecondary">Account Number:</Text>
              <Text className="text-textPrimary font-medium">**** **** **** 4423</Text>
            </View>
            <View className="flex-row justify-between mb-3">
              <Text className="text-textSecondary">Total Transactions:</Text>
              <Text className="text-textPrimary font-medium">{summary.totalTransactions}</Text>
            </View>
            <View className="flex-row justify-between">
              <Text className="text-textSecondary">Savings Rate:</Text>
              <Text className="text-secondary font-bold">
                {summary.income > 0 ? ((summary.income - summary.expense) / summary.income * 100).toFixed(1) : 0}%
              </Text>
            </View>
          </View>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

export default AnalyticsScreen;