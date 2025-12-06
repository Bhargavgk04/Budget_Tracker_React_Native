# Implementation Plan

- [x] 1. Create backend data models

  - Create Friendship model with schema, indexes, and instance methods
  - Create Settlement model with validation and status tracking
  - Create Group model with member management and balance caching
  - Extend Transaction model to include friendUid, friendId, and splitInfo fields
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8_

- [x] 2. Implement Friend Service and API endpoints

  - [x] 2.1 Create FriendService class with user search functionality

    - Implement searchUsers method to find users by UID, email, or phone
    - Add validation to prevent searching for self
    - Write unit tests for search functionality
    - _Requirements: 1.1_

  - [x] 2.2 Implement friend request management

    - Code sendFriendRequest method with duplicate prevention
    - Code acceptFriendRequest method to create bidirectional friendship
    - Code declineFriendRequest method
    - Write unit tests for request lifecycle
    - _Requirements: 1.2, 1.3, 1.4_

  - [x] 2.3 Implement friend list and balance calculation

    - Code getFriendList method with balance status filtering
    - Code calculateBalance method using transaction aggregation
    - Code updateCachedBalance method for performance optimization
    - Write unit tests for balance calculations
    - _Requirements: 1.6, 1.7_

  - [x] 2.4 Create friend management API routes

    - Implement POST /api/friends/search endpoint
    - Implement POST /api/friends/request endpoint
    - Implement POST /api/friends/:id/accept endpoint
    - Implement POST /api/friends/:id/decline endpoint
    - Implement GET /api/friends endpoint with filters
    - Implement GET /api/friends/:id endpoint
    - Implement DELETE /api/friends/:id endpoint with balance check
    - Add authentication middleware to all routes
    - Write integration tests for friend routes
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8, 9.3_

- [x] 3. Implement Split Service and transaction integration

  - [x] 3.1 Create SplitService class with validation methods

    - Implement validateSplit method for all split types
    - Implement calculateEqualSplit method with rounding handling
    - Implement calculatePercentageSplit method with 100% validation
    - Implement validateCustomSplit method to ensure amounts sum correctly
    - Write unit tests for all split calculations
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.8, 9.1, 9.2_

  - [x] 3.2 Implement split creation and management

    - Code createSplit method to add split info to transactions
    - Code updateSplit method with participant validation
    - Code markParticipantSettled method
    - Code getUserShare helper method
    - Write unit tests for split management
    - _Requirements: 3.5, 3.6, 3.7_

  - [x] 3.3 Create split API routes

    - Implement POST /api/transactions/:id/split endpoint
    - Implement PUT /api/transactions/:id/split endpoint
    - Implement DELETE /api/transactions/:id/split endpoint
    - Implement POST /api/transactions/:id/split/settle/:userId endpoint
    - Implement GET /api/transactions/shared endpoint with filters
    - Add authorization checks for split modifications
    - Write integration tests for split routes
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 9.3, 9.4_

  - [ ] 3.4 Update transaction creation to support friend integration

    - Modify transaction creation endpoint to accept friendUid field
    - Implement auto-lookup of friend details when UID is provided
    - Add validation to ensure friend exists and friendship is accepted
    - Update transaction response to include friend details

    - Write tests for friend-linked transactions

    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7_

- [ ] 4. Implement Settlement Service and API endpoints

  - [ ] 4.1 Create SettlementService class

    - Implement createSettlement method with validation
    - Implement confirmSettlement method with authorization

    - Implement disputeSettlement method
    - Implement getSettlements method with filtering
    - Implement deleteSettlement method with balance restoration
    - Write unit tests for settlement operations
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7, 6.8, 6.9_

  - [ ] 4.2 Implement balance update logic

    - Code calculateSettlementImpact method
    - Integrate settlement creation with friend balance updates
    - Integrate settlement confirmation with balance updates
    - Add transaction to update cached balances in Friendship model
    - Write tests for balance update accuracy
    - _Requirements: 6.3, 6.7_

  - [x] 4.3 Create settlement API routes

    - Implement POST /api/settlements endpoint
    - Implement GET /api/settlements endpoint with filters
    - Implement GET /api/settlements/:id endpoint
    - Implement POST /api/settlements/:id/confirm endpoint
    - Implement POST /api/settlements/:id/dispute endpoint
    - Implement DELETE /api/settlements/:id endpoint
    - Implement GET /api/settlements/pending endpoint
    - Add authorization middleware
    - Write integration tests for settlement routes
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.8, 6.9, 9.3_


- [-] 5. Implement Group Service and API endpoints


  - [x] 5.1 Create GroupService class with group management



    - Implement createGroup method with member validation
    - Implement addMember method with permission checks
    - Implement removeMember method with balance validation
    - Implement getGroupDetails method
    - Implement getUserGroups method with filters
    - Write unit tests for group management
    - _Requirements: 7.1, 7.2, 7.8, 7.9_

  - [x] 5.2 Implement group balance calculations


    - Code calculateGroupBalances method using aggregation
    - Code updateGroupBalances method for caching
    - Code markGroupSettled method
    - Implement getGroupExpenses method with filters
    - Write tests for group balance accuracy
    - _Requirements: 7.5, 7.6, 7.10_

  - [x] 5.3 Create group API routes


    - Implement POST /api/groups endpoint
    - Implement GET /api/groups endpoint
    - Implement GET /api/groups/:id endpoint
    - Implement PUT /api/groups/:id endpoint
    - Implement DELETE /api/groups/:id endpoint
    - Implement POST /api/groups/:id/members endpoint
    - Implement DELETE /api/groups/:id/members/:userId endpoint
    - Implement GET /api/groups/:id/expenses endpoint
    - Implement GET /api/groups/:id/balances endpoint
    - Implement POST /api/groups/:id/settle endpoint
    - Add authorization checks for group operations
    - Write integration tests for group routes
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7, 7.8, 7.9, 7.10, 9.3_

- [-] 6. Implement Debt Simplification Service


  - [x] 6.1 Create DebtSimplificationService class



    - Implement greedy algorithm for debt simplification
    - Code simplifyDebts method with creditor/debtor matching
    - Code calculateNetBalances method
    - Write unit tests with various balance scenarios
    - Test edge cases (circular debts, all settled, single pair)
    - _Requirements: 4.1, 4.2, 4.3, 4.4_




  - [ ] 6.2 Integrate simplification with friend and group services
    - Implement getSimplifiedSettlements method for friend pairs
    - Implement getGroupSimplifiedSettlements method
    - Add API endpoint GET /api/friends/:id/simplify
    - Add API endpoint GET /api/groups/:id/simplify


    - Write integration tests for simplification endpoints
    - _Requirements: 4.5, 4.6, 4.7_

- [ ] 7. Create frontend TypeScript types and interfaces

  - Define Friend interface with balance information
  - Define SplitConfig and SplitParticipant interfaces
  - Define Settlement interface


  - Define Group, GroupMember, and GroupBalance interfaces

  - Define SimplifiedSettlement interface
  - Define API response types for all endpoints
  - _Requirements: All requirements (type safety)_

- [ ] 8. Implement Friend Service on frontend

  - [ ] 8.1 Create FriendService class

    - Implement searchUsers method with debouncing
    - Implement sendFriendRequest method
    - Implement acceptFriendRequest method

    - Implement declineFriendRequest method
    - Implement getFriendList method with caching
    - Implement getFriendDetails method
    - Implement removeFriend method
    - Add error handling for all methods
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7_

  - [x] 8.2 Create SplitService class on frontend


    - Implement validateSplit method
    - Implement calculateSplitPreview method
    - Implement createSplit method
    - Implement updateSplit method
    - Add client-side validation
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.8_


  - [ ] 8.3 Create SettlementService class on frontend

    - Implement createSettlement method
    - Implement confirmSettlement method
    - Implement getSettlements method
    - Implement deleteSettlement method
    - Add error handling
    - _Requirements: 6.1, 6.2, 6.4, 6.6, 6.9_




  - [ ] 8.4 Create GroupService class on frontend
    - Implement createGroup method
    - Implement getUserGroups method
    - Implement getGroupDetails method
    - Implement addMember method
    - Implement removeMember method
    - Implement getGroupExpenses method
    - Add caching for group data


    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.8, 7.9_

- [ ] 9. Create Friend Selector component

  - [ ] 9.1 Build FriendSelector UI component

    - Create text input with auto-complete dropdown
    - Implement debounced search on UID input
    - Display friend suggestions with name and profile picture
    - Show current balance with friend in suggestion
    - Add "Add Friend" option for non-friends
    - Style component to match app design
    - _Requirements: 2.1, 2.2, 2.3, 2.4_

  - [x] 9.2 Integrate FriendSelector with transaction form


    - Add FriendSelector to transaction creation form
    - Implement onSelect handler to populate friendUid field
    - Auto-fetch and display friend details when UID is entered
    - Add validation for friend selection
    - Test component with various user interactions
    - _Requirements: 2.1, 2.2, 2.3, 2.5, 2.6_

- [ ] 10. Create Split Configuration component


  - [ ] 10.1 Build SplitConfig UI component

    - Create split type selector (equal, percentage, custom)
    - Build equal split UI with participant list
    - Build percentage split UI with percentage inputs
    - Build custom split UI with amount inputs
    - Add real-time validation and error messages
    - Display split preview showing each person's share
    - Style component for mobile responsiveness
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.8_


  - [ ] 10.2 Integrate SplitConfig with transaction form
    - Show SplitConfig when friend is selected
    - Pass transaction amount to SplitConfig
    - Handle split configuration changes
    - Validate split before allowing transaction save
    - Add tests for split integration
    - _Requirements: 3.1, 3.5, 3.6, 3.7_

- [ ] 11. Create Friend List screen


  - [ ] 11.1 Build FriendList UI component

    - Create list view with friend cards
    - Display friend name, profile picture, and balance status
    - Add visual indicators for balance direction (owes you, you owe, settled)
    - Implement pull-to-refresh functionality
    - Add search bar for filtering friends
    - Implement filter options (all, owes you, you owe, settled)
    - Add navigation to friend detail page on tap
    - Style list for optimal mobile experience
    - _Requirements: 1.6, 1.7_


  - [ ] 11.2 Implement friend request management UI
    - Create pending requests section
    - Display incoming friend requests with accept/decline buttons
    - Show outgoing pending requests
    - Add notification badge for pending requests
    - Implement accept/decline actions
    - Add success/error feedback
    - _Requirements: 1.2, 1.3, 1.4, 1.5_

- [x] 12. Create Friend Detail screen


  - [ ] 12.1 Build FriendDetail UI component

    - Create balance summary card at top
    - Display current net balance with visual indicator
    - Add "Settle Up" button
    - Create shared expenses list section
    - Implement expense filtering (date range, category, status)
    - Display settlement history section
    - Add expense breakdown by category chart
    - Style page for clear information hierarchy

    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7_

  - [ ] 12.2 Implement expense and settlement interactions
    - Add tap handler to navigate to transaction details
    - Implement settlement creation flow
    - Add settlement confirmation functionality
    - Implement expense filtering logic
    - Add loading states and error handling

    - Test all user interactions
    - _Requirements: 5.1, 5.3, 5.4, 5.7, 6.1, 6.2_

- [ ] 13. Create Settlement Form component

  - Build SettlementForm modal/screen
  - Add amount input with suggested amount pre-filled
  - Create payment method selector
  - Add notes text input field
  - Implement date picker for settlement date
  - Add form validation
  - Create confirmation dialog before submission
  - Implement submit handler with API integration
  - Add success/error feedback
  - Style form for mobile usability

  - _Requirements: 6.1, 6.2, 6.3_

- [ ] 14. Create Group Manager screen

  - [ ] 14.1 Build GroupList UI component

    - Create list view of user's groups
    - Display group name, type, and member count
    - Show total outstanding balance for each group
    - Add visual indicator for settled groups

    - Implement "Create Group" button
    - Add navigation to group detail page
    - Style list for mobile experience
    - _Requirements: 7.9_

  - [ ] 14.2 Build CreateGroup form
    - Create group name input
    - Add group type selector (Trip, Rent, Office Lunch, Custom)
    - Implement member selection from friend list
    - Add description text area
    - Validate group creation (name required, at least 2 members)

    - Implement submit handler
    - Add success/error feedback
    - _Requirements: 7.1, 7.2_

- [ ] 15. Create Group Detail screen

  - [ ] 15.1 Build GroupDetail UI component

    - Create group info header with name, type, and members
    - Display balance matrix showing who owes whom
    - Create group expenses list section

    - Add "Add Expense" button
    - Display simplified settlement suggestions
    - Show settlement history section
    - Add "Mark as Settled" button when all balanced
    - Style page for complex data visualization
    - _Requirements: 7.3, 7.4, 7.5, 7.6, 7.7, 7.10_

  - [ ] 15.2 Implement group management actions
    - Add member addition functionality

    - Implement member removal with balance check
    - Create group expense addition flow
    - Implement settlement recording for group
    - Add expense filtering
    - Handle group settling action
    - Add loading states and error handling
    - _Requirements: 7.3, 7.4, 7.6, 7.7, 7.8_

- [x] 16. Create Debt Simplification View component


  - Build SimplificationView UI component
  - Display current debts list
  - Show simplified settlement plan
  - Add comparison visualization (before/after transaction count)
  - Implement "Create Settlements" button to generate all settlements
  - Add visual graph/diagram of debt relationships
  - Style component for clarity
  - Integrate with friend detail and group detail pages
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6_

- [ ] 17. Implement notification system

  - [x] 17.1 Create notification service on backend



    - Implement notification creation for friend requests
    - Implement notification creation for shared expenses
    - Implement notification creation for settlements
    - Implement notification creation for group activities
    - Add notification preferences checking
    - Write tests for notification triggers
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6_


  - [ ] 17.2 Integrate push notifications on frontend
    - Set up push notification handling
    - Implement notification display
    - Add tap handlers to navigate to relevant screens
    - Implement notification preferences UI
    - Test notification delivery and navigation
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7_

- [ ] 18. Implement analytics and reporting

  - [ ] 18.1 Create analytics endpoints on backend

    - Implement GET /api/analytics/shared-expenses endpoint
    - Implement GET /api/analytics/friends/:id endpoint
    - Implement GET /api/analytics/groups/:id endpoint
    - Add aggregation queries for expense breakdowns
    - Add time-series data for spending trends
    - Write tests for analytics calculations
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 10.6, 10.7_

  - [ ] 18.2 Create analytics views on frontend
    - Build shared vs personal expense breakdown chart
    - Create friend expense analytics view
    - Build group spending trends visualization
    - Implement export functionality with split details
    - Add monthly summary with owed/owing totals
    - Style analytics views for data clarity
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 10.6_


- [ ] 19. Add comprehensive error handling and validation

  - Implement client-side validation for all forms
  - Add server-side validation for all API endpoints
  - Create user-friendly error messages
  - Implement error logging on backend
  - Add error boundaries on frontend
  - Test error scenarios (network failures, invalid data, unauthorized access)
  - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6, 9.7_


- [ ] 20. Write comprehensive tests

  - [ ] 20.1 Write backend unit tests

    - Test all service methods with various inputs
    - Test model validations and middleware
    - Test debt simplification algorithm thoroughly
    - Test balance calculation accuracy
    - Achieve 80%+ code coverage
    - _Requirements: All requirements (quality assurance)_

  - [ ] 20.2 Write backend integration tests

    - Test complete friend workflow
    - Test complete group workflow
    - Test transaction split workflow
    - Test settlement workflow
    - Test API endpoint responses and error handling
    - _Requirements: All requirements (quality assurance)_

  - [ ] 20.3 Write frontend component tests
    - Test all components with React Testing Library
    - Test user interactions and state changes
    - Test form validations
    - Test API integration with mocked responses
    - Test error handling in components
    - _Requirements: All requirements (quality assurance)_

- [ ] 21. Optimize performance

  - Add database indexes for all query patterns
  - Implement caching for friend balances
  - Implement caching for group balances
  - Add pagination for large lists
  - Optimize aggregation queries
  - Implement lazy loading on frontend
  - Add debouncing for search inputs

  - Test performance with large datasets
  - _Requirements: All requirements (performance)_

- [ ] 22. Create database migration scripts

  - Write migration to add splitInfo to Transaction schema
  - Write migration to create Friendship collection
  - Write migration to create Settlement collection
  - Write migration to create Group collection
  - Write migration to add indexes


  - Test migrations on development database
  - Create rollback scripts
  - _Requirements: All requirements (deployment)_

- [ ] 23. Update API documentation

  - Document all new API endpoints
  - Add request/response examples
  - Document error codes and messages
  - Add authentication requirements
  - Create Postman collection for testing
  - Update README with new features
  - _Requirements: All requirements (documentation)_

- [ ] 24. Integration and end-to-end testing
  - Test complete user journey: add friend → create shared expense → settle
  - Test group creation and expense management flow
  - Test debt simplification with real scenarios
  - Test notification delivery
  - Test on multiple devices (iOS, Android)
  - Perform user acceptance testing
  - Fix any bugs discovered during testing
  - _Requirements: All requirements (quality assurance)_
