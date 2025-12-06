# Requirements Document

## Introduction

This feature redesigns the main dashboard/home screen to provide a simplified, focused user experience centered around the user's balance with quick access to transaction recording. The new design prioritizes the most important information (balance) and streamlines the transaction creation flow while maintaining easy navigation to all app features through a bottom navigation bar and a menu accessible via a three-dot icon in the top-left corner.

## Requirements

### Requirement 1: Simplified Dashboard Layout

**User Story:** As a user, I want to see my current balance prominently displayed when I open the app, so that I can quickly understand my financial status at a glance.

#### Acceptance Criteria

1. WHEN the user logs in or opens the app THEN the system SHALL display the dashboard screen as the default landing page
2. WHEN the dashboard loads THEN the system SHALL display the user's current balance in large, centered text at the top of the screen
3. WHEN the dashboard loads THEN the system SHALL calculate and display the balance as (total income - total expenses)
4. WHEN the balance is positive THEN the system SHALL display it in green color
5. WHEN the balance is negative THEN the system SHALL display it in red color
6. WHEN the balance is zero THEN the system SHALL display it in a neutral color

### Requirement 2: Central Transaction Button

**User Story:** As a user, I want a prominent button in the center of the dashboard to add transactions, so that I can quickly record my income or expenses without navigating through multiple screens.

#### Acceptance Criteria

1. WHEN the dashboard loads THEN the system SHALL display a centered action button below the balance display
2. WHEN the user taps the central action button THEN the system SHALL display two options: "Credit" (income) and "Debit" (expense)
3. WHEN the user selects "Credit" THEN the system SHALL navigate to the add transaction screen with type pre-selected as "income"
4. WHEN the user selects "Debit" THEN the system SHALL navigate to the add transaction screen with type pre-selected as "expense"
5. WHEN the transaction options are displayed THEN the system SHALL provide a clear visual distinction between credit and debit options
6. WHEN the user taps outside the transaction options THEN the system SHALL close the options menu

### Requirement 3: Recent Transactions Display

**User Story:** As a user, I want to see my 5 most recent transactions on the dashboard, so that I can quickly review my latest financial activity without navigating to a separate screen.

#### Acceptance Criteria

1. WHEN the dashboard loads THEN the system SHALL fetch and display the 5 most recent transactions
2. WHEN displaying transactions THEN the system SHALL show them in reverse chronological order (newest first)
3. WHEN displaying each transaction THEN the system SHALL show the transaction type (income/expense), category, amount, and date
4. WHEN displaying income transactions THEN the system SHALL show the amount with a "+" prefix in green color
5. WHEN displaying expense transactions THEN the system SHALL show the amount with a "-" prefix in red color
6. WHEN there are no transactions THEN the system SHALL display an empty state message encouraging the user to add their first transaction
7. WHEN the user taps on a transaction THEN the system SHALL navigate to the transaction details or edit screen

### Requirement 4: Bottom Navigation Bar

**User Story:** As a user, I want a bottom navigation bar with quick access to main sections of the app, so that I can easily navigate between different features.

#### Acceptance Criteria

1. WHEN the dashboard is displayed THEN the system SHALL show a bottom navigation bar with icons for main sections
2. WHEN the bottom navigation bar is displayed THEN the system SHALL include navigation items for: Dashboard/Home, Transactions List, Analytics, and Profile
3. WHEN the user taps a navigation item THEN the system SHALL navigate to the corresponding screen
4. WHEN on a specific screen THEN the system SHALL highlight the corresponding navigation item in the bottom bar
5. WHEN navigating between screens THEN the system SHALL maintain the bottom navigation bar visibility across all main screens

### Requirement 5: Top Menu Access

**User Story:** As a user, I want to access additional features through a menu icon in the top-left corner, so that I can reach all app functionality without cluttering the main interface.

#### Acceptance Criteria

1. WHEN the dashboard is displayed THEN the system SHALL show a three-dot menu icon in the top-left corner
2. WHEN the user taps the three-dot menu icon THEN the system SHALL display a dropdown or slide-out menu with additional options
3. WHEN the menu is displayed THEN the system SHALL include options for: Settings, Categories, Budgets, Recurring Payments, Export Data, and Logout
4. WHEN the user selects a menu option THEN the system SHALL navigate to the corresponding screen or execute the corresponding action
5. WHEN the user taps outside the menu THEN the system SHALL close the menu
6. WHEN the menu is open THEN the system SHALL provide a clear visual indication that it is active

### Requirement 6: Balance Calculation API

**User Story:** As a developer, I need a backend API endpoint to calculate and return the user's current balance, so that the frontend can display accurate financial information.

#### Acceptance Criteria

1. WHEN the frontend requests balance data THEN the system SHALL provide an API endpoint at GET /api/user/balance
2. WHEN the balance endpoint is called THEN the system SHALL require user authentication
3. WHEN calculating balance THEN the system SHALL sum all income transactions for the authenticated user
4. WHEN calculating balance THEN the system SHALL sum all expense transactions for the authenticated user
5. WHEN calculating balance THEN the system SHALL return (total income - total expenses) as the balance
6. WHEN the balance is calculated THEN the system SHALL also return totalIncome and totalExpenses separately
7. WHEN the balance endpoint responds THEN the system SHALL return data in JSON format with structure: { success: true, data: { balance, totalIncome, totalExpenses } }

### Requirement 7: Recent Transactions API

**User Story:** As a developer, I need a backend API endpoint to fetch recent transactions, so that the frontend can display the latest financial activity.

#### Acceptance Criteria

1. WHEN the frontend requests recent transactions THEN the system SHALL provide an API endpoint at GET /api/transactions/recent
2. WHEN the recent transactions endpoint is called THEN the system SHALL require user authentication
3. WHEN fetching recent transactions THEN the system SHALL accept an optional query parameter "limit" with a default value of 5
4. WHEN fetching recent transactions THEN the system SHALL return transactions sorted by date in descending order (newest first)
5. WHEN fetching recent transactions THEN the system SHALL only return transactions belonging to the authenticated user
6. WHEN the recent transactions endpoint responds THEN the system SHALL return data in JSON format with structure: { success: true, data: [transactions array] }
7. WHEN returning transaction data THEN the system SHALL include fields: id, type, category, amount, date, description, and paymentMode

### Requirement 8: Dashboard Data Loading

**User Story:** As a user, I want the dashboard to load quickly and show loading states, so that I understand the app is working and my data is being fetched.

#### Acceptance Criteria

1. WHEN the dashboard screen mounts THEN the system SHALL immediately fetch balance and recent transactions data
2. WHEN data is being fetched THEN the system SHALL display loading indicators for the balance and transactions sections
3. WHEN data fetching fails THEN the system SHALL display an error message with a retry option
4. WHEN the user pulls down on the dashboard THEN the system SHALL refresh all dashboard data
5. WHEN data is refreshing THEN the system SHALL show a pull-to-refresh indicator
6. WHEN data loads successfully THEN the system SHALL remove loading indicators and display the data

### Requirement 9: Responsive Design

**User Story:** As a user, I want the dashboard to work well on different screen sizes, so that I have a consistent experience across devices.

#### Acceptance Criteria

1. WHEN the dashboard is displayed on any screen size THEN the system SHALL adapt the layout to fit the available space
2. WHEN the dashboard is displayed THEN the system SHALL ensure all interactive elements are easily tappable (minimum 44x44 points)
3. WHEN the dashboard is displayed on small screens THEN the system SHALL maintain readability of text and numbers
4. WHEN the dashboard is displayed THEN the system SHALL use responsive spacing and sizing for all components
5. WHEN the screen orientation changes THEN the system SHALL adjust the layout appropriately

### Requirement 10: Navigation Integration

**User Story:** As a developer, I need to integrate the new dashboard layout with the existing navigation structure, so that users can seamlessly move between screens.

#### Acceptance Criteria

1. WHEN implementing the bottom navigation THEN the system SHALL use React Navigation's bottom tabs navigator
2. WHEN navigating to the add transaction screen THEN the system SHALL pass the transaction type (income/expense) as a navigation parameter
3. WHEN returning from the add transaction screen THEN the system SHALL refresh the dashboard data to reflect new transactions
4. WHEN navigating to transaction details THEN the system SHALL pass the transaction ID as a navigation parameter
5. WHEN the user is on any main screen THEN the system SHALL maintain the bottom navigation bar visibility
6. WHEN implementing the top menu THEN the system SHALL ensure it doesn't conflict with existing navigation patterns
