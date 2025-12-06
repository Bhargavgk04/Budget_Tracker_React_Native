# Requirements Document

## Introduction

This feature introduces a comprehensive friend and expense splitting system similar to Splitwise, enabling users to manage shared expenses, track debts, and settle balances with friends. The system will integrate seamlessly with the existing transaction management system by adding an optional "Friend UID" field that automatically populates friend details when a UID is entered. Users will be able to add friends, split expenses in multiple ways (equal, percentage, custom), simplify debts using algorithms, create groups for shared expenses, and track settlements.

## Requirements

### Requirement 1: Friend Management System

**User Story:** As a user, I want to manage my friend connections, so that I can track shared expenses with specific people.

#### Acceptance Criteria

1. WHEN a user enters a valid UID, phone number, or email in the friend search field THEN the system SHALL display matching user profiles with their name and profile picture
2. WHEN a user sends a friend request THEN the system SHALL create a pending friend request record and notify the recipient
3. WHEN a user receives a friend request THEN the system SHALL display the request with options to accept or decline
4. WHEN a user accepts a friend request THEN the system SHALL create a bidirectional friendship relationship and update both users' friend lists
5. WHEN a user declines a friend request THEN the system SHALL remove the pending request without creating a friendship
6. WHEN a user views their friend list THEN the system SHALL display all friends with their current balance status (owes you, you owe, settled)
7. WHEN a user removes a friend THEN the system SHALL archive the friendship but preserve historical transaction data
8. IF a user has unsettled balances with a friend THEN the system SHALL display a warning before allowing friend removal

### Requirement 2: Transaction Friend Integration

**User Story:** As a user, I want to add a friend to my transactions easily, so that I can track which expenses are shared with specific friends.

#### Acceptance Criteria

1. WHEN a user creates or edits a transaction THEN the system SHALL display an optional "Friend UID" field
2. WHEN a user types a UID in the Friend UID field THEN the system SHALL automatically fetch and display the friend's name, profile picture, and current balance
3. WHEN a user selects a friend from their friend list THEN the system SHALL auto-fill the Friend UID field with that friend's UID
4. IF the entered UID is not in the user's friend list THEN the system SHALL display an option to send a friend request
5. WHEN a transaction with a friend is saved THEN the system SHALL link the transaction to both users' accounts
6. WHEN a user views a transaction with a friend THEN the system SHALL display the friend's details and split information
7. IF a friend UID field is left empty THEN the system SHALL treat the transaction as a personal (non-shared) transaction

### Requirement 3: Expense Splitting Options

**User Story:** As a user, I want to split expenses with friends in different ways, so that I can accurately reflect how costs were shared.

#### Acceptance Criteria

1. WHEN a user adds a friend to a transaction THEN the system SHALL display split options: equal split, percentage-based split, and custom split
2. WHEN a user selects "equal split" THEN the system SHALL divide the transaction amount equally among all participants
3. WHEN a user selects "percentage-based split" THEN the system SHALL allow the user to assign percentage values to each participant and validate that percentages sum to 100%
4. WHEN a user selects "custom split" THEN the system SHALL allow the user to enter specific amounts for each participant and validate that amounts sum to the total transaction amount
5. WHEN a split is configured THEN the system SHALL display a preview showing each person's share before saving
6. WHEN a user is the payer THEN the system SHALL calculate how much each other participant owes them
7. WHEN a user is not the payer THEN the system SHALL calculate how much they owe the payer
8. IF split amounts don't match the total THEN the system SHALL display an error and prevent saving

### Requirement 4: Debt Simplification

**User Story:** As a user, I want the system to simplify my debts automatically, so that I can minimize the number of transactions needed to settle all balances.

#### Acceptance Criteria

1. WHEN multiple shared expenses exist between users THEN the system SHALL calculate net balances between each pair of friends
2. WHEN a user views their overall balance summary THEN the system SHALL display simplified debts using a greedy algorithm to minimize settlements
3. WHEN user A owes user B and user B owes user C THEN the system SHALL suggest direct payment from A to C when possible to reduce transaction count
4. WHEN the system calculates simplified debts THEN it SHALL ensure all original debts are mathematically satisfied
5. WHEN a user views debt simplification suggestions THEN the system SHALL display both the original debts and the simplified settlement plan
6. WHEN a user opts to use simplified settlements THEN the system SHALL update the settlement tracking accordingly
7. IF simplification is not possible or beneficial THEN the system SHALL maintain direct peer-to-peer settlements

### Requirement 5: Friend Detail Page

**User Story:** As a user, I want to view detailed information about my financial relationship with each friend, so that I can track our shared expenses and settlement history.

#### Acceptance Criteria

1. WHEN a user navigates to a friend's detail page THEN the system SHALL display all shared expenses in chronological order
2. WHEN viewing the friend detail page THEN the system SHALL display the current net balance (who owes whom and how much)
3. WHEN viewing the friend detail page THEN the system SHALL display a complete settlement history with dates and amounts
4. WHEN a user views shared expenses THEN the system SHALL show the split details for each transaction
5. WHEN a user filters expenses on the friend detail page THEN the system SHALL support filtering by date range, category, and settlement status
6. WHEN a user views the balance summary THEN the system SHALL display a breakdown by expense category
7. WHEN a user taps on a shared expense THEN the system SHALL navigate to the full transaction detail view

### Requirement 6: Settlement Management

**User Story:** As a user, I want to record and track payments made to settle shared expenses, so that I can maintain accurate balance records with my friends.

#### Acceptance Criteria

1. WHEN a user records a settlement payment THEN the system SHALL require the amount, date, and payment method
2. WHEN a user records a settlement THEN the system SHALL allow adding optional notes (e.g., "Paid via UPI", "Cash payment")
3. WHEN a settlement is recorded THEN the system SHALL update the balance between the two users immediately
4. WHEN a settlement is created THEN the system SHALL set its status to "pending" by default
5. WHEN the recipient confirms a settlement THEN the system SHALL update the status to "settled"
6. WHEN a user views settlements THEN the system SHALL display all settlements with their status (pending/settled)
7. WHEN a settlement fully clears a balance THEN the system SHALL mark the friend relationship as "settled" in the friend list
8. IF a settlement is disputed THEN the system SHALL allow users to add comments and resolve the discrepancy
9. WHEN a user deletes a settlement THEN the system SHALL restore the previous balance and require confirmation

### Requirement 7: Group Expense Management

**User Story:** As a user, I want to create groups for shared expenses with multiple friends, so that I can manage recurring group expenses like trips, rent, or office lunches.

#### Acceptance Criteria

1. WHEN a user creates a group THEN the system SHALL require a group name and allow adding multiple members from their friend list
2. WHEN a user creates a group THEN the system SHALL support group types (Trip, Rent, Office Lunch, Custom)
3. WHEN a user adds an expense to a group THEN the system SHALL automatically include all group members in the split calculation
4. WHEN a group expense is created THEN the system SHALL support all split options (equal, percentage, custom)
5. WHEN a user views a group detail page THEN the system SHALL display all group expenses and the current balance for each member
6. WHEN viewing group balances THEN the system SHALL show who owes whom within the group
7. WHEN a user settles a group expense THEN the system SHALL update balances for all affected members
8. WHEN a user leaves a group THEN the system SHALL require all their balances to be settled first
9. WHEN a user views their groups THEN the system SHALL display a list of all groups with their total outstanding balance
10. IF a group has no outstanding balances THEN the system SHALL mark it as "settled" but keep it accessible for history

### Requirement 8: Notifications and Reminders

**User Story:** As a user, I want to receive notifications about friend requests, shared expenses, and settlement requests, so that I stay informed about my financial interactions.

#### Acceptance Criteria

1. WHEN a user receives a friend request THEN the system SHALL send a push notification
2. WHEN a friend adds a shared expense THEN the system SHALL notify the user with expense details
3. WHEN a friend records a settlement THEN the system SHALL notify the user to confirm
4. WHEN a user has pending settlements older than 7 days THEN the system SHALL send a reminder notification
5. WHEN a group expense is added THEN the system SHALL notify all group members
6. WHEN a user's notification preferences are set to "off" THEN the system SHALL respect those preferences
7. WHEN a notification is tapped THEN the system SHALL navigate to the relevant detail page (friend, transaction, or group)

### Requirement 9: Data Validation and Security

**User Story:** As a user, I want my financial data to be secure and accurate, so that I can trust the system with sensitive information.

#### Acceptance Criteria

1. WHEN a user enters split amounts THEN the system SHALL validate that all amounts are positive numbers
2. WHEN a user configures a split THEN the system SHALL validate that the total matches the transaction amount
3. WHEN a user accesses friend or group data THEN the system SHALL verify they have permission to view that data
4. WHEN a user attempts to modify a shared expense THEN the system SHALL require confirmation from all participants
5. WHEN sensitive financial data is transmitted THEN the system SHALL use encrypted connections
6. WHEN a user deletes their account THEN the system SHALL anonymize their data in shared expenses but preserve transaction history for other users
7. IF a user attempts unauthorized access to another user's data THEN the system SHALL deny access and log the attempt

### Requirement 10: Reporting and Analytics

**User Story:** As a user, I want to view analytics about my shared expenses, so that I can understand my spending patterns with friends and groups.

#### Acceptance Criteria

1. WHEN a user views their expense analytics THEN the system SHALL include a breakdown of shared vs. personal expenses
2. WHEN a user views friend analytics THEN the system SHALL display total amounts shared with each friend over time
3. WHEN a user views group analytics THEN the system SHALL show spending trends for each group
4. WHEN a user exports their transaction history THEN the system SHALL include shared expense details and split information
5. WHEN a user views monthly summaries THEN the system SHALL display total amounts owed and owing
6. WHEN a user views category breakdowns THEN the system SHALL separate shared and personal expenses
7. WHEN a user views settlement history THEN the system SHALL provide summary statistics (total settled, average settlement time)
