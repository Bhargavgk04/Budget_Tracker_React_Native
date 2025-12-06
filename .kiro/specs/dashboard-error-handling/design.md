# Design Document

## Overview

This design addresses the runtime error in DashboardScreen by implementing comprehensive error handling, data validation, and type safety measures. The solution ensures that the dashboard remains functional even when API calls fail or return unexpected data structures.

## Architecture

### Component Structure

```
DashboardScreen
├── Data Loading Layer (with error handling)
├── State Management (with type guards)
├── Rendering Layer (with null checks)
└── Error Recovery (with fallbacks)
```

### Data Flow

1. **API Call** → Validation → State Update → Render
2. **Error Path** → Log Error → Fallback Data → Render Empty/Partial State
3. **Type Guard** → Validate Structure → Safe Access → Render

## Components and Interfaces

### 1. Data Validation Utilities

```typescript
// Add to utils/validation.ts or create new file
class DataValidationUtils {
  static isValidTransactionArray(data: any): data is Transaction[] {
    return Array.isArray(data) && 
           data.every(item => 
             item && 
             typeof item.id === 'string' &&
             typeof item.amount === 'number' &&
             typeof item.type === 'string'
           );
  }

  static isValidFinancialSummary(data: any): data is FinancialSummary {
    return data &&
           typeof data.totalIncome === 'number' &&
           typeof data.totalExpenses === 'number' &&
           typeof data.balance === 'number';
  }

  static sanitizeTransactions(data: any): Transaction[] {
    if (!data) return [];
    if (!Array.isArray(data)) return [];
    return data.filter(item => 
      item && 
      typeof item.id === 'string' &&
      typeof item.amount === 'number'
    );
  }
}
```

### 2. Enhanced Error Handling in DashboardScreen

**Key Changes:**

1. **Wrap API calls with try-catch per call** (not just outer try-catch)
2. **Validate data before setState**
3. **Use Array.isArray() checks before .map()**
4. **Provide fallback values for all data**

```typescript
const loadDashboardData = async () => {
  try {
    setIsLoading(true);
    trackCustom('dashboard_load_start', { period: selectedPeriod });

    const isDemoUser = user?.id === 'demo-user-123';
    
    if (isDemoUser) {
      await loadDemoData();
    } else {
      await loadRealData();
    }
  } catch (error) {
    handleLoadError(error);
  } finally {
    setIsLoading(false);
    setIsRefreshing(false);
  }
};

const loadRealData = async () => {
  const period = DataTransformUtils.generateTimePeriod(selectedPeriod);
  
  // Load analytics with error handling
  let analyticsData = null;
  try {
    analyticsData = await TransactionService.getTransactionAnalytics(
      period.startDate,
      period.endDate
    );
  } catch (error) {
    console.error('Analytics load failed:', error);
    trackCustom('analytics_load_error', { error: error.message });
  }

  // Load transactions with error handling
  let transactionsData: Transaction[] = [];
  try {
    const response = await TransactionService.getRecentTransactions(5);
    transactionsData = DataValidationUtils.sanitizeTransactions(response);
  } catch (error) {
    console.error('Transactions load failed:', error);
    trackCustom('transactions_load_error', { error: error.message });
  }

  // Set state with validated data
  if (analyticsData) {
    const summaryData: FinancialSummary = {
      totalIncome: analyticsData.totalIncome ?? 0,
      totalExpenses: analyticsData.totalExpenses ?? 0,
      balance: analyticsData.balance ?? 0,
      period,
      categoryBreakdown: Array.isArray(analyticsData.categoryBreakdown) 
        ? analyticsData.categoryBreakdown.map(item => ({
            category: item.category ?? 'Unknown',
            amount: item.amount ?? 0,
            percentage: item.percentage ?? 0,
            color: CHART_COLORS[Math.abs((item.category?.length ?? 0)) % CHART_COLORS.length],
            icon: 'help',
          }))
        : [],
    };
    setSummary(summaryData);
  }

  setRecentTransactions(transactionsData);
  
  trackCustom('dashboard_load_success', { 
    period: selectedPeriod,
    isDemoUser: false,
    hasAnalytics: !!analyticsData,
    transactionCount: transactionsData.length
  });
};
```

### 3. Safe Rendering with Type Guards

```typescript
const renderRecentTransactions = () => {
  // Ensure recentTransactions is always an array
  const transactions = Array.isArray(recentTransactions) ? recentTransactions : [];
  
  return (
    <Animated.View entering={FadeInDown.delay(300)} style={styles.transactionsCard}>
      <View style={styles.transactionsHeader}>
        <Text style={styles.transactionsTitle}>Recent Transactions</Text>
        <TouchableOpacity onPress={navigateToTransactions}>
          <Text style={styles.viewAllText}>View All</Text>
        </TouchableOpacity>
      </View>

      {transactions.length > 0 ? (
        transactions.map((transaction, index) => (
          <View key={transaction.id || `transaction-${index}`} style={styles.transactionItem}>
            {/* ... transaction item content ... */}
          </View>
        ))
      ) : (
        <View style={styles.emptyState}>
          <MaterialIcons name="receipt" size={48} color={theme.colors.onSurface + '40'} />
          <Text style={styles.emptyStateText}>No transactions yet</Text>
          <Text style={styles.emptyStateSubtext}>Add your first transaction to get started</Text>
        </View>
      )}
    </Animated.View>
  );
};
```

### 4. Loading State Improvements

```typescript
// Add loading skeleton or spinner
const renderLoadingState = () => (
  <View style={styles.loadingContainer}>
    <ActivityIndicator size="large" color={theme.colors.primary} />
    <Text style={styles.loadingText}>Loading your financial data...</Text>
  </View>
);

// In main render
return (
  <SafeAreaView style={styles.container}>
    <ResponsiveContainer>
      {/* ... header ... */}
      
      {isLoading && !isRefreshing ? (
        renderLoadingState()
      ) : (
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          refreshControl={
            <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
          }
          showsVerticalScrollIndicator={false}
        >
          {renderSummaryCard()}
          {renderCategoryChart()}
          {renderRecentTransactions()}
        </ScrollView>
      )}
      
      {/* ... FAB ... */}
    </ResponsiveContainer>
  </SafeAreaView>
);
```

## Data Models

### Enhanced Type Definitions

```typescript
// Ensure types have proper defaults
interface FinancialSummary {
  totalIncome: number;
  totalExpenses: number;
  balance: number;
  period: TimePeriod;
  categoryBreakdown: CategoryBreakdown[];
}

// Add type guard helpers
type ValidatedTransaction = Transaction & {
  id: string;
  amount: number;
  type: 'income' | 'expense';
  category: string;
  date: string;
};
```

## Error Handling

### Error Categories

1. **Network Errors**: API unavailable, timeout
2. **Data Format Errors**: Unexpected response structure
3. **Validation Errors**: Data doesn't match expected types
4. **State Errors**: Invalid state transitions

### Error Recovery Strategy

```typescript
const handleLoadError = (error: any) => {
  const errorMessage = error instanceof Error ? error.message : 'Unknown error';
  
  trackCustom('dashboard_load_error', { 
    error: errorMessage,
    period: selectedPeriod 
  });
  
  console.error('Dashboard load error:', error);
  
  // Set safe defaults
  setSummary({
    totalIncome: 0,
    totalExpenses: 0,
    balance: 0,
    period: DataTransformUtils.generateTimePeriod(selectedPeriod),
    categoryBreakdown: [],
  });
  
  setRecentTransactions([]);
  
  // Optionally show toast/alert to user
  // Alert.alert('Error', 'Failed to load dashboard data. Please try again.');
};
```

## Testing Strategy

### Unit Tests

1. **Data Validation Tests**
   - Test `isValidTransactionArray` with various inputs
   - Test `sanitizeTransactions` with malformed data
   - Test type guards with edge cases

2. **Component Tests**
   - Test rendering with empty data
   - Test rendering with partial data
   - Test error states
   - Test loading states

3. **Integration Tests**
   - Test full data loading flow
   - Test error recovery
   - Test refresh functionality

### Test Cases

```typescript
describe('DashboardScreen Data Handling', () => {
  it('should handle null transactions response', () => {
    const result = DataValidationUtils.sanitizeTransactions(null);
    expect(result).toEqual([]);
  });

  it('should handle undefined transactions response', () => {
    const result = DataValidationUtils.sanitizeTransactions(undefined);
    expect(result).toEqual([]);
  });

  it('should filter invalid transactions', () => {
    const input = [
      { id: '1', amount: 100, type: 'income' },
      { id: '2' }, // missing amount
      null,
      { amount: 50 }, // missing id
    ];
    const result = DataValidationUtils.sanitizeTransactions(input);
    expect(result).toHaveLength(1);
  });

  it('should render without crashing when recentTransactions is not an array', () => {
    const { getByText } = render(
      <DashboardScreen navigation={mockNavigation} />
    );
    // Should show empty state instead of crashing
    expect(getByText('No transactions yet')).toBeTruthy();
  });
});
```

## Performance Considerations

1. **Memoization**: Use `useMemo` for expensive data transformations
2. **Lazy Loading**: Load chart data only when needed
3. **Debouncing**: Debounce refresh calls to prevent rapid re-fetching
4. **Caching**: Consider caching dashboard data for offline access

## Security Considerations

1. **Input Validation**: Validate all API responses before use
2. **Error Messages**: Don't expose sensitive error details to users
3. **Logging**: Log errors for debugging but sanitize sensitive data

## Migration Strategy

1. Add validation utilities
2. Update DashboardScreen with error handling
3. Add loading states
4. Test thoroughly with various error scenarios
5. Deploy with monitoring
6. Monitor error rates and adjust as needed
