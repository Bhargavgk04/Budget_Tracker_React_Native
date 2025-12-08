import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Dimensions, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { PieChart, BarChart } from 'react-native-chart-kit';
import { useFocusEffect } from '@react-navigation/native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
} from 'react-native-reanimated';
import { useTransactions } from '../context/TransactionContext';
import { formatCurrency } from '../utils/formatting';
import AnimatedCard from '../components/animations/AnimatedCard';
import SlideInAnimation from '../components/animations/SlideInAnimation';
import CountUpAnimation from '../components/animations/CountUpAnimation';
import PulseAnimation from '../components/animations/PulseAnimation';
import AppHeader from '../components/common/AppHeader';
import RefreshControlComponent from '../components/common/RefreshControl';
import api from '../services/api';

const { width: screenWidth } = Dimensions.get('window');

// Chart type options
const CHART_TYPES = [
  { value: 'donut', label: 'Donut', icon: 'donut-large' },
  { value: 'bar', label: 'Bar', icon: 'bar-chart' },
  { value: 'bubble', label: 'Bubble', icon: 'bubble-chart' },
  { value: 'bullet', label: 'Bullet', icon: 'show-chart' },
  { value: 'radar', label: 'Radar', icon: 'radar' },
];

const AnalyticsScreen = () => {
  const { summary, refreshData } = useTransactions();
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  const [selectedChartType, setSelectedChartType] = useState('donut');
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [analyticsData, setAnalyticsData] = useState(null);

  // Animation values
  const headerOpacity = useSharedValue(0);
  const chartsScale = useSharedValue(0.8);

  // Fetch analytics data
  const fetchAnalyticsData = async (forceRefresh = false) => {
    try {
      setLoading(true);
      const response = await api.get(`/analytics/charts?period=${selectedPeriod}`);
      if (response.data.success) {
        setAnalyticsData(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  // Auto-refresh when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      console.log('[AnalyticsScreen] Screen focused, refreshing data...');
      refreshData(true);
      fetchAnalyticsData(true);
    }, [refreshData, selectedPeriod])
  );

  // Refresh when period changes
  useEffect(() => {
    fetchAnalyticsData();
  }, [selectedPeriod]);

  // Handle pull-to-refresh
  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await refreshData(true);
      await fetchAnalyticsData(true);
    } catch (error) {
      console.error('Error refreshing data:', error);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    headerOpacity.value = withTiming(1, { duration: 600 });
    chartsScale.value = withSpring(1, {
      damping: 15,
      stiffness: 150
    });
  }, []);

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
          <Text className="font-medium text-white">{title}</Text>
        </PulseAnimation>
      ) : (
        <Text className="font-medium text-textSecondary">{title}</Text>
      )}
    </TouchableOpacity>
  );

  const ChartTypeButton = ({ type, isSelected }) => (
    <TouchableOpacity
      onPress={() => setSelectedChartType(type.value)}
      className={`px-4 py-3 rounded-xl mr-3 flex-row items-center ${
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
      <MaterialIcons 
        name={type.icon} 
        size={20} 
        color={isSelected ? '#fff' : '#6366F1'} 
      />
      <Text className={`ml-2 font-medium ${isSelected ? 'text-white' : 'text-primary'}`}>
        {type.label}
      </Text>
    </TouchableOpacity>
  );

  const renderDonutChart = () => {
    if (!analyticsData?.categoryMetrics || analyticsData.categoryMetrics.length === 0) {
      return <Text className="text-center text-textSecondary py-8">No data available</Text>;
    }

    const pieData = analyticsData.categoryMetrics.slice(0, 6).map(item => ({
      name: item.category,
      population: item.value,
      color: item.color,
      legendFontColor: '#1E293B',
      legendFontSize: 12,
    }));

    return (
      <View>
        <PieChart
          data={pieData}
          width={screenWidth - 80}
          height={220}
          chartConfig={chartConfig}
          accessor="population"
          backgroundColor="transparent"
          paddingLeft="15"
          center={[10, 0]}
          hasLegend={true}
        />
        <View className="mt-4">
          {analyticsData.categoryMetrics.slice(0, 6).map((item, index) => (
            <View key={index} className="flex-row items-center justify-between mb-2 px-2">
              <View className="flex-row items-center flex-1">
                <View 
                  className="w-3 h-3 rounded-full mr-2"
                  style={{ backgroundColor: item.color }}
                />
                <Text className="text-textSecondary text-sm">{item.category}</Text>
              </View>
              <Text className="text-textPrimary font-bold text-sm">
                {formatCurrency(item.value)} ({item.percentage.toFixed(1)}%)
              </Text>
            </View>
          ))}
        </View>
      </View>
    );
  };

  const renderBarChart = () => {
    if (!analyticsData?.timeSeriesData || analyticsData.timeSeriesData.length === 0) {
      return <Text className="text-center text-textSecondary py-8">No data available</Text>;
    }

    const barData = {
      labels: analyticsData.timeSeriesData.slice(-7).map(item => item.label),
      datasets: [{
        data: analyticsData.timeSeriesData.slice(-7).map(item => item.value || 100),
        color: (opacity = 1) => `rgba(99, 102, 241, ${opacity})`,
      }],
    };

    return (
      <BarChart
        data={barData}
        width={screenWidth - 80}
        height={220}
        chartConfig={chartConfig}
        style={{
          marginVertical: 8,
          borderRadius: 16,
        }}
        showBarTops={false}
        fromZero={true}
      />
    );
  };

  const renderBubbleChart = () => {
    if (!analyticsData?.bubbleData || analyticsData.bubbleData.length === 0) {
      return <Text className="text-center text-textSecondary py-8">No data available</Text>;
    }

    return (
      <View className="py-4">
        <Text className="text-textSecondary text-xs mb-4 px-2">
          Bubble size represents average transaction amount
        </Text>
        {analyticsData.bubbleData.slice(0, 6).map((item, index) => {
          const maxX = Math.max(...analyticsData.bubbleData.map(d => d.x));
          const widthPercent = (item.x / maxX) * 100;
          const bubbleSize = Math.max(40, Math.min(80, (item.radius / 1000) * 40));
          
          return (
            <View key={index} className="mb-4">
              <View className="flex-row items-center justify-between mb-1 px-2">
                <Text className="text-textPrimary font-medium">{item.label}</Text>
                <Text className="text-textSecondary text-xs">{item.y} transactions</Text>
              </View>
              <View className="flex-row items-center">
                <View 
                  className="rounded-full items-center justify-center"
                  style={{ 
                    width: bubbleSize, 
                    height: bubbleSize, 
                    backgroundColor: item.color,
                    marginRight: 8
                  }}
                >
                  <Text className="text-white font-bold text-xs">
                    {formatCurrency(item.radius).replace('₹', '')}
                  </Text>
                </View>
                <View className="flex-1">
                  <View 
                    className="h-6 rounded-full"
                    style={{ 
                      width: `${widthPercent}%`, 
                      backgroundColor: item.color,
                      opacity: 0.7
                    }}
                  />
                  <Text className="text-textSecondary text-xs mt-1">
                    Total: {formatCurrency(item.x)}
                  </Text>
                </View>
              </View>
            </View>
          );
        })}
      </View>
    );
  };

  const renderBulletGraph = () => {
    if (!analyticsData?.performanceMetrics || analyticsData.performanceMetrics.length === 0) {
      return <Text className="text-center text-textSecondary py-8">No data available</Text>;
    }

    return (
      <View className="py-4">
        <Text className="text-textSecondary text-xs mb-4 px-2">
          Performance vs Target (Green = Good, Yellow = Satisfactory, Red = Poor)
        </Text>
        {analyticsData.performanceMetrics.map((item, index) => {
          const maxRange = item.ranges.poor;
          const valuePercent = (item.value / maxRange) * 100;
          const targetPercent = (item.target / maxRange) * 100;
          const markerPercent = (item.marker / maxRange) * 100;
          
          return (
            <View key={index} className="mb-6">
              <View className="flex-row items-center justify-between mb-2 px-2">
                <Text className="text-textPrimary font-medium">{item.label}</Text>
                <Text className="text-textSecondary text-xs">
                  {formatCurrency(item.value)} / {formatCurrency(item.target)}
                </Text>
              </View>
              <View className="relative h-8">
                {/* Background ranges */}
                <View className="absolute inset-0 flex-row rounded-full overflow-hidden">
                  <View 
                    className="bg-green-200"
                    style={{ width: `${(item.ranges.good / maxRange) * 100}%` }}
                  />
                  <View 
                    className="bg-yellow-200"
                    style={{ width: `${((item.ranges.satisfactory - item.ranges.good) / maxRange) * 100}%` }}
                  />
                  <View 
                    className="bg-red-200"
                    style={{ width: `${((item.ranges.poor - item.ranges.satisfactory) / maxRange) * 100}%` }}
                  />
                </View>
                {/* Actual value bar */}
                <View 
                  className="absolute top-1 left-0 h-6 bg-primary rounded-full"
                  style={{ width: `${Math.min(valuePercent, 100)}%` }}
                />
                {/* Target marker */}
                <View 
                  className="absolute top-0 h-8 w-1 bg-gray-800"
                  style={{ left: `${targetPercent}%` }}
                />
                {/* Comparison marker */}
                <View 
                  className="absolute top-2 h-4 w-1 bg-orange-500"
                  style={{ left: `${markerPercent}%` }}
                />
              </View>
            </View>
          );
        })}
      </View>
    );
  };

  const renderRadarChart = () => {
    if (!analyticsData?.radarData || analyticsData.radarData.length === 0) {
      return <Text className="text-center text-textSecondary py-8">No data available</Text>;
    }

    return (
      <View className="py-4">
        <Text className="text-textSecondary text-xs mb-4 px-2">
          Spending distribution across categories
        </Text>
        {analyticsData.radarData.map((item, index) => {
          const percent = (item.value / item.maxValue) * 100;
          
          return (
            <View key={index} className="mb-4">
              <View className="flex-row items-center justify-between mb-1 px-2">
                <Text className="text-textPrimary font-medium">{item.axis}</Text>
                <Text className="text-textSecondary text-xs">
                  {formatCurrency(item.value)} ({percent.toFixed(0)}%)
                </Text>
              </View>
              <View className="h-3 bg-gray-100 rounded-full overflow-hidden">
                <View 
                  className="h-full rounded-full"
                  style={{ 
                    width: `${percent}%`,
                    backgroundColor: `hsl(${(100 - percent) * 1.2}, 70%, 50%)`
                  }}
                />
              </View>
            </View>
          );
        })}
      </View>
    );
  };

  const renderChart = () => {
    if (loading) {
      return (
        <View className="py-12 items-center justify-center">
          <ActivityIndicator size="large" color="#6366F1" />
          <Text className="text-textSecondary mt-4">Loading analytics...</Text>
        </View>
      );
    }

    switch (selectedChartType) {
      case 'donut':
        return renderDonutChart();
      case 'bar':
        return renderBarChart();
      case 'bubble':
        return renderBubbleChart();
      case 'bullet':
        return renderBulletGraph();
      case 'radar':
        return renderRadarChart();
      default:
        return renderDonutChart();
    }
  };

  const headerAnimatedStyle = useAnimatedStyle(() => ({
    opacity: headerOpacity.value,
  }));

  const chartsAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: chartsScale.value }],
  }));

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: '#F8FAFC' }}>
      <AppHeader 
        title="Analytics Dashboard" 
        subtitle={`${selectedPeriod.charAt(0).toUpperCase() + selectedPeriod.slice(1)} Overview`}
      />

      <Animated.View className="px-6 pb-2" style={headerAnimatedStyle}>
        {/* Period Selector */}
        <SlideInAnimation direction="up" delay={400}>
          <View className="flex-row mb-4">
            <PeriodButton title="Week" value="week" isSelected={selectedPeriod === 'week'} />
            <PeriodButton title="Month" value="month" isSelected={selectedPeriod === 'month'} />
            <PeriodButton title="Year" value="year" isSelected={selectedPeriod === 'year'} />
          </View>
        </SlideInAnimation>
      </Animated.View>

      <ScrollView 
        className="flex-1" 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControlComponent
            refreshing={refreshing}
            onRefresh={handleRefresh}
          />
        }
      >
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
                  endValue={analyticsData?.summary?.totalIncome || summary.income}
                  formatter={formatCurrency}
                  style={{
                    color: '#1E293B',
                    fontSize: 20,
                    fontWeight: 'bold'
                  }}
                  delay={1000}
                />
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
                  endValue={analyticsData?.summary?.totalExpense || summary.expense}
                  formatter={formatCurrency}
                  style={{
                    color: '#1E293B',
                    fontSize: 20,
                    fontWeight: 'bold'
                  }}
                  delay={1100}
                />
              </View>
            </AnimatedCard>
          </View>
        </View>

        {/* Chart Type Selector */}
        <View className="px-6 mb-4">
          <Text className="text-textPrimary text-sm font-bold mb-3">Visualization Type</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {CHART_TYPES.map(type => (
              <ChartTypeButton
                key={type.value}
                type={type}
                isSelected={selectedChartType === type.value}
              />
            ))}
          </ScrollView>
        </View>

        {/* Chart Display */}
        <AnimatedCard delay={1400} style={{ marginHorizontal: 24, marginBottom: 24 }}>
          <View className="bg-white rounded-2xl p-6" style={{
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 8,
            elevation: 3,
          }}>
            <SlideInAnimation direction="left" delay={1600}>
              <Text className="text-textPrimary text-lg font-bold mb-4">
                {CHART_TYPES.find(t => t.value === selectedChartType)?.label} Chart
              </Text>
            </SlideInAnimation>
            
            <Animated.View style={chartsAnimatedStyle}>
              {renderChart()}
            </Animated.View>
          </View>
        </AnimatedCard>

        {/* Insights */}
        {analyticsData?.summary && (
          <View className="bg-white mx-6 rounded-2xl p-6 mb-6" style={{
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 8,
            elevation: 3,
          }}>
            <Text className="text-textPrimary text-lg font-bold mb-4">Key Insights</Text>
            
            <View className="space-y-3">
              <View className="flex-row items-center justify-between py-2 border-b border-gray-100">
                <Text className="text-textSecondary">Total Transactions</Text>
                <Text className="text-textPrimary font-bold">
                  {analyticsData.summary.transactionCount}
                </Text>
              </View>
              <View className="flex-row items-center justify-between py-2 border-b border-gray-100">
                <Text className="text-textSecondary">Avg Transaction</Text>
                <Text className="text-textPrimary font-bold">
                  {formatCurrency(analyticsData.summary.avgTransactionSize)}
                </Text>
              </View>
              <View className="flex-row items-center justify-between py-2 border-b border-gray-100">
                <Text className="text-textSecondary">Top Category</Text>
                <Text className="text-textPrimary font-bold">
                  {analyticsData.summary.topCategory || 'N/A'}
                </Text>
              </View>
              <View className="flex-row items-center justify-between py-2">
                <Text className="text-textSecondary">Savings Rate</Text>
                <Text className={`font-bold ${analyticsData.summary.savingsRate >= 0 ? 'text-secondary' : 'text-error'}`}>
                  {analyticsData.summary.savingsRate.toFixed(1)}%
                </Text>
              </View>
            </View>
          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

export default AnalyticsScreen;
