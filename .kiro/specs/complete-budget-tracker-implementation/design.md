# Design Document - Complete Budget Tracker Implementation

## Overview

This design document outlines the architecture and implementation strategy for a comprehensive budget tracking application with expense splitting capabilities. The system will be built using a three-tier architecture with React Native/Expo for cross-platform frontend, Node.js/Express for backend API, and MongoDB for data persistence.

### Key Design Principles

1. **Cross-Platform First**: Single codebase for iOS, Android, and Web using React Native/Expo
2. **Offline-First**: Local caching with background sync for seamless offline experience
3. **Security-First**: JWT authentication, encrypted data, input validation at all layers
4. **Performance-First**: Lazy loading, pagination, image optimization, caching strategies
5. **User-First**: Intuitive UI, clear error messages, loading states, accessibility

### Technology Stack

**Frontend:**
- React Native with Expo SDK 49+
- React Navigation v6 for routing
- React Context API + useReducer for state management
- React Native Paper for Material Design components
- Axios for HTTP requests with interceptors
- AsyncStorage for local persistence
- expo-image-picker for camera/gallery access
- react-native-chart-kit for data visualization

**Backend:**
- Node.js v18+ with Express.js
- MongoDB with Mongoose ODM
- JWT for authentication (access + refresh tokens)
- bcrypt for password hashing
- Multer for file uploads
- Google Vision API or Tesseract.js for OCR
- Nodemailer for email notifications
- express-validator for input validation

**Database:**
- MongoDB Atlas (cloud-hosted)
- Collections: users, transactions, categories, budgets, friends, friendRequests, groups, notifications, receipts, splits

---

## Architecture

### System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                     Client Layer                             │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐                  │
│  │   iOS    │  │  Android │  │   Web    │                  │
│  │  (Expo)  │  │  (Expo)  │  │ (React)  │                  │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘                  │
│       └─────────────┼─────────────┘                         │
│                     │                                        │
│              React Native App                                │
│  ┌──────────────────┴──────────────────┐                   │
│  │  Context API (Auth, Transaction)    │                   │
│  │  Services (API, Storage, OCR)       │                   │
│  │  Navigation (Stack, Tab, Drawer)    │                   │
│  └──────────────────┬──────────────────┘                   │
└────────────────────┼────────────────────────────────────────┘
                     │ HTTPS/REST API
┌────────────────────┼────────────────────────────────────────┐
│                    │  Backend Layer                          │
│  ┌─────────────────┴──────────────────┐                    │
│  │      Express.js API Server          │                    │
│  │  ┌──────────────────────────────┐  │                    │
│  │  │  Middleware Layer            │  │                    │
│  │  │  - Authentication (JWT)      │  │                    │
│  │  │  - Validation                │  │                    │
│  │  │  - Error Handling            │  │                    │
│  │  │  - Rate Limiting             │  │                    │
│  │  └──────────────────────────────┘  │                    │
│  │  ┌──────────────────────────────┐  │                    │
│  │  │  Route Handlers              │  │                    │
│  │  │  - Auth Routes               │  │                    │
│  │  │  - Transaction Routes        │  │                    │
│  │  │  - Category Routes           │  │                    │
│  │  │  - Friend Routes             │  │                    │
│  │  │  - Budget Routes             │  │                    │
│  │  │  - Analytics Routes          │  │                    │
│  │  └──────────────────────────────┘  │                    │
│  │  ┌──────────────────────────────┐  │                    │
│  │  │  Business Logic Layer        │  │                    │
│  │  │  - OCR Service               │  │                    │
│  │  │  - Debt Simplification       │  │                    │
│  │  │  - Notification Service      │  │                    │
│  │  │  - Analytics Engine          │  │                    │
│  │  └──────────────────────────────┘  │                    │
│  └─────────────────┬──────────────────┘                    │
└────────────────────┼────────────────────────────────────────┘
                     │ Mongoose ODM
┌────────────────────┼────────────────────────────────────────┐
│                    │  Data Layer                             │
│  ┌─────────────────┴──────────────────┐                    │
│  │         MongoDB Atlas               │                    │
│  │  ┌──────────────────────────────┐  │                    │
│  │  │  Collections                 │  │                    │
│  │  │  - users                     │  │                    │
│  │  │  - transactions              │  │                    │
│  │  │  - categories                │  │                    │
│  │  │  - budgets                   │  │                    │
│  │  │  - friends                   │  │                    │
│  │  │  - friendRequests            │  │                    │
│  │  │  - groups                    │  │                    │
│  │  │  - notifications             │  │                    │
│  │  │  - receipts                  │  │                    │
│  │  │  - splits                    │  │                    │
│  │  └──────────────────────────────┘  │                    │
│  └─────────────────────────────────────┘                    │
└─────────────────────────────────────────────────────────────┘
```


### Request Flow

1. **User Action** → UI Component triggers action
2. **Context/Service** → Business logic processes request
3. **API Call** → HTTP request to backend with auth token
4. **Middleware** → Authentication, validation, rate limiting
5. **Route Handler** → Processes request, calls business logic
6. **Database** → Mongoose queries MongoDB
7. **Response** → JSON response back to client
8. **State Update** → Context updates, UI re-renders

---

## Components and Interfaces

### Frontend Components

#### 1. Authentication Components

**LoginScreen**
- Email/password input fields
- Remember me checkbox
- Login button with loading state
- Forgot password link
- Demo login button
- Error message display

**SignupScreen**
- Name, email, password fields
- Password strength indicator
- Terms & conditions checkbox
- Signup button with loading state
- Navigate to login link

**ForgotPasswordScreen**
- Email input field
- Send reset link button
- OTP verification input
- New password fields
- Reset button

**ProfileScreen**
- Profile picture with upload/edit
- Name, email display/edit
- Currency selector
- Theme toggle (light/dark)
- Language selector
- Logout button

#### 2. Transaction Components

**AddTransactionScreen**
- Amount input with currency symbol
- Type toggle (income/expense)
- Category selector with icons
- Date picker
- Description text area
- Tags input with autocomplete
- Receipt upload button
- Camera capture button
- Recurring toggle with frequency selector
- Friend selector for splits
- Save button

**TransactionListScreen**
- Infinite scroll list
- Pull-to-refresh
- Filter chips (date, category, type)
- Search bar
- Swipe-to-delete gesture
- Tap to view details
- Floating action button for quick add

**TransactionDetailScreen**
- Full transaction details
- Receipt image viewer with zoom
- Edit button
- Delete button
- Duplicate button
- Share button

**ReceiptScannerScreen**
- Camera view with capture button
- Gallery picker button
- OCR processing indicator
- Extracted data preview
- Edit extracted fields
- Confirm button

#### 3. Category Components

**CategoryListScreen**
- Grid/list view toggle
- Category cards with icon, color, usage count
- Add category button
- Edit/delete actions
- Drag-to-reorder

**CategoryFormScreen**
- Name input
- Icon picker (50+ icons)
- Color picker
- Type selector (income/expense/both)
- Parent category selector (for subcategories)
- Save button

#### 4. Friend & Split Components

**FriendListScreen**
- Friend cards with balance status
- Color-coded (green: they owe, red: you owe)
- Add friend button
- Pending requests section
- Search friends

**FriendDetailScreen**
- Friend info and balance
- Shared expenses list
- Settlement history
- Settle up button
- Remove friend button

**AddFriendScreen**
- Search by UID/email/name
- Send friend request button
- QR code scanner

**SplitExpenseScreen**
- Participant selector
- Split method selector (equal/percentage/custom)
- Amount input per person
- Total validation
- Confirm split button

**GroupScreen**
- Group name and members
- Group expenses list
- Add expense button
- Group analytics
- Leave group button

#### 5. Budget Components

**BudgetListScreen**
- Budget cards with progress bars
- Color-coded status (green/yellow/orange/red)
- Add budget button
- Monthly/yearly toggle

**BudgetFormScreen**
- Budget name
- Amount input
- Category selector
- Period selector (monthly/yearly)
- Start date picker
- Alert threshold slider
- Save button

**SavingsGoalScreen**
- Goal cards with progress
- Target amount and deadline
- Current savings
- Add goal button
- Mark as achieved button

#### 6. Analytics Components

**DashboardScreen**
- Summary cards (income, expenses, savings)
- Month-over-month comparison
- Quick actions (add transaction, scan receipt)
- Recent transactions list
- Budget progress overview

**AnalyticsScreen**
- Date range selector
- Chart type tabs (pie, bar, line)
- Category breakdown pie chart
- Monthly trends bar chart
- Income vs expenses line chart
- Export button

**InsightsScreen**
- Top spending categories
- Spending trends
- Budget alerts
- Savings suggestions
- Comparison with previous period

#### 7. Notification Components

**NotificationScreen**
- Notification list with icons
- Unread badge
- Mark as read action
- Clear all button
- Navigate to relevant screen on tap

**NotificationSettingsScreen**
- Toggle switches for each notification type
- Budget alert threshold slider
- Push notification toggle

#### 8. Settings Components

**SettingsScreen**
- Profile section
- Preferences section
- Security section
- Data management section
- About section

**PreferencesScreen**
- Theme selector
- Currency selector
- Language selector
- Date format selector
- Number format selector

**SecurityScreen**
- Change password
- Biometric authentication toggle
- Active sessions list
- Logout from all devices button

**DataManagementScreen**
- Import data button
- Export data button (CSV/Excel/PDF)
- Backup data button
- Clear cache button
- Delete account button


### Backend API Endpoints

#### Authentication Endpoints
```
POST   /api/auth/register              - Register new user
POST   /api/auth/login                 - Login user
POST   /api/auth/logout                - Logout user
POST   /api/auth/refresh-token         - Refresh access token
POST   /api/auth/forgot-password       - Request password reset
POST   /api/auth/verify-otp            - Verify OTP
POST   /api/auth/reset-password        - Reset password
POST   /api/auth/change-password       - Change password
GET    /api/auth/me                    - Get current user
```

#### Transaction Endpoints
```
GET    /api/transactions               - Get all transactions (paginated)
GET    /api/transactions/:id           - Get transaction by ID
POST   /api/transactions               - Create transaction
PUT    /api/transactions/:id           - Update transaction
DELETE /api/transactions/:id           - Delete transaction
GET    /api/transactions/search        - Search transactions
POST   /api/transactions/bulk          - Bulk create transactions
GET    /api/transactions/export        - Export transactions
POST   /api/transactions/import        - Import transactions
GET    /api/transactions/recent        - Get recent transactions
POST   /api/transactions/duplicate/:id - Duplicate transaction
```

#### Receipt Endpoints
```
POST   /api/receipts/upload            - Upload receipt image
POST   /api/receipts/scan              - Scan receipt with OCR
GET    /api/receipts/:id               - Get receipt by ID
DELETE /api/receipts/:id               - Delete receipt
```

#### Category Endpoints
```
GET    /api/categories                 - Get all categories
GET    /api/categories/:id             - Get category by ID
POST   /api/categories                 - Create category
PUT    /api/categories/:id             - Update category
DELETE /api/categories/:id             - Delete category
POST   /api/categories/reorder         - Reorder categories
GET    /api/categories/default         - Get default categories
```

#### Friend Endpoints
```
GET    /api/friends                    - Get all friends
GET    /api/friends/:id                - Get friend by ID
POST   /api/friends/request            - Send friend request
POST   /api/friends/accept/:id         - Accept friend request
POST   /api/friends/decline/:id        - Decline friend request
DELETE /api/friends/:id                - Remove friend
GET    /api/friends/requests           - Get pending requests
GET    /api/friends/search             - Search users
```

#### Split Endpoints
```
GET    /api/splits                     - Get all splits
GET    /api/splits/:id                 - Get split by ID
POST   /api/splits                     - Create split
PUT    /api/splits/:id                 - Update split
DELETE /api/splits/:id                 - Delete split
POST   /api/splits/settle/:id          - Settle split
GET    /api/splits/balances            - Get all balances
GET    /api/splits/simplify            - Get simplified debts
```

#### Group Endpoints
```
GET    /api/groups                     - Get all groups
GET    /api/groups/:id                 - Get group by ID
POST   /api/groups                     - Create group
PUT    /api/groups/:id                 - Update group
DELETE /api/groups/:id                 - Delete group
POST   /api/groups/:id/members         - Add member to group
DELETE /api/groups/:id/members/:userId - Remove member from group
GET    /api/groups/:id/expenses        - Get group expenses
POST   /api/groups/:id/expenses        - Add group expense
```

#### Budget Endpoints
```
GET    /api/budgets                    - Get all budgets
GET    /api/budgets/:id                - Get budget by ID
POST   /api/budgets                    - Create budget
PUT    /api/budgets/:id                - Update budget
DELETE /api/budgets/:id                - Delete budget
GET    /api/budgets/progress           - Get budget progress
GET    /api/budgets/alerts             - Get budget alerts
```

#### Analytics Endpoints
```
GET    /api/analytics/summary          - Get summary analytics
GET    /api/analytics/category         - Get category breakdown
GET    /api/analytics/trends           - Get spending trends
GET    /api/analytics/comparison       - Get period comparison
GET    /api/analytics/insights         - Get AI insights
GET    /api/analytics/export           - Export analytics report
```

#### Notification Endpoints
```
GET    /api/notifications              - Get all notifications
GET    /api/notifications/:id          - Get notification by ID
PUT    /api/notifications/:id/read     - Mark as read
DELETE /api/notifications/:id          - Delete notification
POST   /api/notifications/clear        - Clear all notifications
PUT    /api/notifications/settings     - Update notification settings
```

#### User Endpoints
```
GET    /api/user/profile               - Get user profile
PUT    /api/user/profile               - Update user profile
POST   /api/user/profile/picture       - Upload profile picture
PUT    /api/user/preferences           - Update preferences
GET    /api/user/stats                 - Get user statistics
POST   /api/user/export                - Export user data
POST   /api/user/import                - Import user data
DELETE /api/user/account               - Delete user account
```

---

## Data Models

### User Model
```javascript
{
  _id: ObjectId,
  uid: String (unique, 8-char alphanumeric),
  name: String (required),
  email: String (required, unique),
  password: String (hashed, required),
  profilePicture: String (URL),
  currency: String (default: 'INR'),
  preferences: {
    theme: String (light/dark),
    notifications: {
      budgetAlerts: Boolean,
      friendRequests: Boolean,
      settlements: Boolean,
      recurring: Boolean
    },
    biometric: Boolean,
    language: String,
    dateFormat: String
  },
  refreshTokens: [{
    token: String,
    deviceInfo: Object,
    rememberMe: Boolean,
    createdAt: Date,
    expiresAt: Date
  }],
  passwordResetToken: String,
  passwordResetExpires: Date,
  emailVerified: Boolean,
  lastLogin: Date,
  loginAttempts: Number,
  lockUntil: Date,
  createdAt: Date,
  updatedAt: Date
}
```

### Transaction Model
```javascript
{
  _id: ObjectId,
  userId: ObjectId (ref: User, required),
  type: String (income/expense, required),
  amount: Number (required, min: 0),
  category: ObjectId (ref: Category, required),
  description: String,
  date: Date (required),
  paymentMode: String (cash/card/upi/bank),
  tags: [String],
  notes: String,
  receipt: ObjectId (ref: Receipt),
  recurring: {
    enabled: Boolean,
    frequency: String (daily/weekly/monthly/yearly),
    nextDate: Date,
    endDate: Date
  },
  splits: [{
    userId: ObjectId (ref: User),
    amount: Number,
    percentage: Number,
    settled: Boolean,
    settledAt: Date
  }],
  isDeleted: Boolean (soft delete),
  deletedAt: Date,
  createdAt: Date,
  updatedAt: Date
}
```

### Category Model
```javascript
{
  _id: ObjectId,
  userId: ObjectId (ref: User, required),
  name: String (required),
  icon: String (icon name),
  color: String (hex color),
  type: String (income/expense/both),
  parentCategory: ObjectId (ref: Category),
  isDefault: Boolean,
  usageCount: Number (default: 0),
  order: Number,
  createdAt: Date,
  updatedAt: Date
}
```

### Budget Model
```javascript
{
  _id: ObjectId,
  userId: ObjectId (ref: User, required),
  name: String (required),
  amount: Number (required),
  category: ObjectId (ref: Category),
  period: String (monthly/yearly),
  startDate: Date (required),
  endDate: Date,
  alertThreshold: Number (percentage, default: 80),
  spent: Number (calculated),
  status: String (active/exceeded/completed),
  createdAt: Date,
  updatedAt: Date
}
```

### Friend Model
```javascript
{
  _id: ObjectId,
  userId: ObjectId (ref: User, required),
  friendId: ObjectId (ref: User, required),
  status: String (pending/accepted/declined),
  balance: Number (calculated, positive = they owe you),
  createdAt: Date,
  updatedAt: Date
}
```

### FriendRequest Model
```javascript
{
  _id: ObjectId,
  senderId: ObjectId (ref: User, required),
  receiverId: ObjectId (ref: User, required),
  status: String (pending/accepted/declined),
  message: String,
  createdAt: Date,
  updatedAt: Date
}
```

### Group Model
```javascript
{
  _id: ObjectId,
  name: String (required),
  description: String,
  createdBy: ObjectId (ref: User, required),
  members: [{
    userId: ObjectId (ref: User),
    role: String (admin/member),
    joinedAt: Date
  }],
  totalExpenses: Number (calculated),
  isActive: Boolean,
  createdAt: Date,
  updatedAt: Date
}
```

### Split Model
```javascript
{
  _id: ObjectId,
  transactionId: ObjectId (ref: Transaction, required),
  paidBy: ObjectId (ref: User, required),
  participants: [{
    userId: ObjectId (ref: User),
    amount: Number,
    percentage: Number,
    settled: Boolean,
    settledAt: Date,
    settledNote: String
  }],
  splitMethod: String (equal/percentage/custom),
  totalAmount: Number,
  groupId: ObjectId (ref: Group),
  createdAt: Date,
  updatedAt: Date
}
```

### Receipt Model
```javascript
{
  _id: ObjectId,
  transactionId: ObjectId (ref: Transaction),
  userId: ObjectId (ref: User, required),
  imageUrl: String (required),
  thumbnailUrl: String,
  ocrData: {
    amount: Number,
    date: Date,
    merchant: String,
    category: String,
    confidence: Number,
    rawText: String
  },
  fileSize: Number,
  mimeType: String,
  createdAt: Date,
  updatedAt: Date
}
```

### Notification Model
```javascript
{
  _id: ObjectId,
  userId: ObjectId (ref: User, required),
  type: String (budget_alert/friend_request/settlement/recurring),
  title: String (required),
  message: String (required),
  data: Object (additional data),
  read: Boolean (default: false),
  readAt: Date,
  actionUrl: String,
  createdAt: Date,
  updatedAt: Date
}
```

### SavingsGoal Model
```javascript
{
  _id: ObjectId,
  userId: ObjectId (ref: User, required),
  name: String (required),
  targetAmount: Number (required),
  currentAmount: Number (default: 0),
  deadline: Date,
  category: ObjectId (ref: Category),
  achieved: Boolean (default: false),
  achievedAt: Date,
  createdAt: Date,
  updatedAt: Date
}
```


---

## Error Handling

### Frontend Error Handling

**Error Types:**
1. **Network Errors** - Connection failures, timeouts
2. **Validation Errors** - Invalid input data
3. **Authentication Errors** - Invalid credentials, expired tokens
4. **Authorization Errors** - Insufficient permissions
5. **Server Errors** - 500 errors, database failures

**Error Handling Strategy:**
```typescript
// Centralized error handler in ApiService
class ApiService {
  async handleError(error: any): Promise<never> {
    if (error.response) {
      // Server responded with error
      const status = error.response.status;
      const message = error.response.data?.error || 'An error occurred';
      
      switch (status) {
        case 400:
          throw new ValidationError(message);
        case 401:
          // Token expired, try refresh
          await this.refreshToken();
          throw new AuthenticationError('Please login again');
        case 403:
          throw new AuthorizationError('Access denied');
        case 404:
          throw new NotFoundError(message);
        case 429:
          throw new RateLimitError('Too many requests');
        case 500:
          throw new ServerError('Server error, please try again');
        default:
          throw new Error(message);
      }
    } else if (error.request) {
      // Request made but no response
      throw new NetworkError('Cannot connect to server');
    } else {
      // Something else happened
      throw new Error(error.message);
    }
  }
}
```

**User-Friendly Error Messages:**
```typescript
const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Please check your internet connection',
  AUTH_ERROR: 'Please login again',
  VALIDATION_ERROR: 'Please check your input',
  SERVER_ERROR: 'Something went wrong. Please try again',
  NOT_FOUND: 'Item not found',
  RATE_LIMIT: 'Too many requests. Please wait a moment',
};
```

### Backend Error Handling

**Global Error Handler Middleware:**
```javascript
const errorHandler = (err, req, res, next) => {
  console.error(err.stack);
  
  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map(e => e.message);
    return res.status(400).json({
      success: false,
      error: 'Validation Error',
      details: errors
    });
  }
  
  // Mongoose duplicate key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    return res.status(400).json({
      success: false,
      error: `${field} already exists`
    });
  }
  
  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      error: 'Invalid token'
    });
  }
  
  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      error: 'Token expired'
    });
  }
  
  // Default error
  res.status(err.statusCode || 500).json({
    success: false,
    error: err.message || 'Server Error'
  });
};
```

---

## Testing Strategy

### Frontend Testing

**Unit Tests (Jest + React Native Testing Library):**
- Test utility functions (validation, formatting, calculations)
- Test custom hooks (useAuth, useTransactions)
- Test service classes (ApiService, TransactionService)
- Test context reducers (authReducer, transactionReducer)

**Component Tests:**
- Test component rendering
- Test user interactions (button clicks, form submissions)
- Test conditional rendering
- Test error states and loading states

**Integration Tests:**
- Test navigation flows
- Test API integration
- Test state management
- Test offline functionality

**E2E Tests (Detox):**
- Test complete user flows (signup, login, add transaction)
- Test cross-screen navigation
- Test data persistence
- Test error scenarios

### Backend Testing

**Unit Tests (Jest):**
- Test model methods
- Test utility functions
- Test middleware functions
- Test validation schemas

**Integration Tests:**
- Test API endpoints
- Test database operations
- Test authentication flow
- Test file uploads

**API Tests (Supertest):**
- Test all endpoints with valid data
- Test error responses
- Test authentication/authorization
- Test rate limiting

### Test Coverage Goals
- Frontend: 80%+ coverage
- Backend: 90%+ coverage
- Critical paths: 100% coverage

---

## Security Considerations

### Authentication & Authorization

**JWT Token Strategy:**
- Access Token: 1 hour expiry, stored in memory
- Refresh Token: 7-30 days expiry, stored in secure storage
- Token rotation on refresh
- Blacklist for revoked tokens

**Password Security:**
- Minimum 8 characters
- Must include uppercase, lowercase, number, special char
- Bcrypt hashing with cost factor 12
- Password history to prevent reuse
- Account lockout after 5 failed attempts

**Session Management:**
- Track active sessions per device
- Allow logout from all devices
- Automatic session cleanup
- Remember me functionality

### Data Security

**Encryption:**
- HTTPS/TLS 1.3 for all communications
- Encrypt sensitive data at rest
- Secure storage for tokens (Keychain/Keystore)

**Input Validation:**
- Validate all inputs on frontend and backend
- Sanitize user inputs to prevent XSS
- Use parameterized queries to prevent SQL injection
- Validate file uploads (type, size, content)

**API Security:**
- Rate limiting (100 requests per 15 minutes)
- CORS with whitelist
- Helmet.js for security headers
- Request size limits
- API versioning

### Privacy

**Data Protection:**
- GDPR compliance
- User data export functionality
- Account deletion with data purge
- Audit logs for sensitive operations

**Permissions:**
- Request only necessary permissions
- Explain why permissions are needed
- Handle permission denials gracefully

---

## Performance Optimization

### Frontend Optimization

**Rendering Performance:**
- Use React.memo for expensive components
- Implement virtualized lists (FlatList with windowSize)
- Lazy load images with placeholder
- Debounce search inputs
- Throttle scroll events

**Bundle Size:**
- Code splitting by route
- Tree shaking unused code
- Compress images before upload
- Use SVG for icons
- Minimize dependencies

**Caching Strategy:**
- Cache API responses (5-15 minutes TTL)
- Cache images locally
- Implement offline-first with background sync
- Use AsyncStorage for persistent data

**Network Optimization:**
- Batch API requests where possible
- Implement request deduplication
- Use pagination (20 items per page)
- Compress request/response payloads
- Implement retry logic with exponential backoff

### Backend Optimization

**Database Optimization:**
- Index frequently queried fields
- Use aggregation pipelines for analytics
- Implement database connection pooling
- Use lean() for read-only queries
- Implement query result caching

**API Optimization:**
- Implement response compression (gzip)
- Use CDN for static assets
- Implement API response caching
- Optimize image processing
- Use background jobs for heavy tasks

**Monitoring:**
- Log slow queries (>1 second)
- Monitor API response times
- Track error rates
- Monitor memory usage
- Set up alerts for anomalies

---

## OCR Implementation

### OCR Service Design

**Technology Choice:**
- **Option 1:** Google Vision API (cloud-based, high accuracy)
- **Option 2:** Tesseract.js (on-device, free, lower accuracy)
- **Recommendation:** Google Vision API for production

**OCR Flow:**
```
1. User captures/uploads receipt image
2. Frontend compresses image (max 2MB)
3. Upload to backend
4. Backend sends to OCR service
5. Parse OCR response
6. Extract structured data:
   - Amount (regex: currency symbols + numbers)
   - Date (regex: date patterns)
   - Merchant (first line or largest text)
   - Category (keyword matching)
7. Return structured data to frontend
8. Auto-fill transaction form
9. User reviews and edits if needed
10. Save transaction with receipt reference
```

**Data Extraction Patterns:**
```javascript
const extractAmount = (text) => {
  // Match currency symbols followed by numbers
  const patterns = [
    /₹\s*(\d+(?:,\d{3})*(?:\.\d{2})?)/,
    /INR\s*(\d+(?:,\d{3})*(?:\.\d{2})?)/,
    /Total:?\s*₹?\s*(\d+(?:,\d{3})*(?:\.\d{2})?)/i
  ];
  
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      return parseFloat(match[1].replace(/,/g, ''));
    }
  }
  return null;
};

const extractDate = (text) => {
  // Match common date formats
  const patterns = [
    /(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})/,
    /(\d{2,4})[\/\-](\d{1,2})[\/\-](\d{1,2})/,
    /(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+(\d{1,2}),?\s+(\d{4})/i
  ];
  
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      return new Date(match[0]);
    }
  }
  return new Date();
};

const suggestCategory = (merchant, text) => {
  const keywords = {
    'Food': ['restaurant', 'cafe', 'food', 'pizza', 'burger'],
    'Groceries': ['supermarket', 'grocery', 'mart', 'store'],
    'Transport': ['uber', 'ola', 'taxi', 'metro', 'bus'],
    'Shopping': ['amazon', 'flipkart', 'mall', 'shop'],
    'Bills': ['electricity', 'water', 'gas', 'internet', 'mobile']
  };
  
  const lowerText = text.toLowerCase();
  for (const [category, words] of Object.entries(keywords)) {
    if (words.some(word => lowerText.includes(word))) {
      return category;
    }
  }
  return 'Other';
};
```

---

## Debt Simplification Algorithm

### Greedy Algorithm Implementation

**Problem:** Minimize the number of transactions needed to settle all debts.

**Algorithm:**
```javascript
function simplifyDebts(balances) {
  // balances: { userId: amount } (positive = owed, negative = owes)
  
  // Separate creditors and debtors
  const creditors = [];
  const debtors = [];
  
  for (const [userId, amount] of Object.entries(balances)) {
    if (amount > 0) {
      creditors.push({ userId, amount });
    } else if (amount < 0) {
      debtors.push({ userId, amount: Math.abs(amount) });
    }
  }
  
  // Sort by amount (descending)
  creditors.sort((a, b) => b.amount - a.amount);
  debtors.sort((a, b) => b.amount - a.amount);
  
  const transactions = [];
  let i = 0, j = 0;
  
  while (i < creditors.length && j < debtors.length) {
    const creditor = creditors[i];
    const debtor = debtors[j];
    
    const amount = Math.min(creditor.amount, debtor.amount);
    
    transactions.push({
      from: debtor.userId,
      to: creditor.userId,
      amount: amount
    });
    
    creditor.amount -= amount;
    debtor.amount -= amount;
    
    if (creditor.amount === 0) i++;
    if (debtor.amount === 0) j++;
  }
  
  return transactions;
}
```

**Example:**
```
Input:
  User A owes: -100
  User B owes: -50
  User C is owed: +80
  User D is owed: +70

Output:
  A pays C: 80
  A pays D: 20
  B pays D: 50

Instead of 6 possible transactions, only 3 are needed.
```

---

## Notification System

### Push Notification Implementation

**Technology:**
- Expo Push Notifications for mobile
- Web Push API for web

**Notification Types:**
1. Budget alerts (80%, 100% thresholds)
2. Friend requests
3. Expense settlements
4. Recurring transaction reminders
5. Savings goal achievements

**Implementation:**
```javascript
// Backend: Send notification
async function sendNotification(userId, notification) {
  // Save to database
  await Notification.create({
    userId,
    type: notification.type,
    title: notification.title,
    message: notification.message,
    data: notification.data
  });
  
  // Get user's push tokens
  const user = await User.findById(userId);
  const pushTokens = user.pushTokens || [];
  
  // Send push notification
  for (const token of pushTokens) {
    await expo.sendPushNotificationAsync({
      to: token,
      sound: 'default',
      title: notification.title,
      body: notification.message,
      data: notification.data
    });
  }
}

// Frontend: Handle notification
useEffect(() => {
  const subscription = Notifications.addNotificationReceivedListener(
    notification => {
      // Update notification badge
      // Show in-app notification
    }
  );
  
  const responseSubscription = Notifications.addNotificationResponseReceivedListener(
    response => {
      // Navigate to relevant screen
      const data = response.notification.request.content.data;
      if (data.screen) {
        navigation.navigate(data.screen, data.params);
      }
    }
  );
  
  return () => {
    subscription.remove();
    responseSubscription.remove();
  };
}, []);
```

---

## Deployment Strategy

### Frontend Deployment

**Development:**
- Expo Go for testing on physical devices
- Web: localhost:19006

**Staging:**
- Expo EAS Build for internal testing
- TestFlight (iOS) / Internal Testing (Android)
- Web: staging.yourapp.com

**Production:**
- App Store (iOS)
- Google Play Store (Android)
- Web: yourapp.com
- PWA support for offline access

### Backend Deployment

**Development:**
- Local Node.js server
- Local MongoDB or MongoDB Atlas

**Staging:**
- Heroku / AWS / DigitalOcean
- MongoDB Atlas (staging cluster)
- Environment variables via platform

**Production:**
- AWS / Google Cloud / Azure
- MongoDB Atlas (production cluster)
- Load balancer for scaling
- CDN for static assets
- SSL certificate
- Monitoring (Sentry, DataDog)

### CI/CD Pipeline

**GitHub Actions Workflow:**
```yaml
1. On push to main:
   - Run tests
   - Build frontend
   - Build backend
   - Deploy to staging

2. On release tag:
   - Run tests
   - Build production bundles
   - Deploy to production
   - Create app store builds
   - Send deployment notification
```

---

## Monitoring & Analytics

### Application Monitoring

**Error Tracking:**
- Sentry for error logging
- Track error rates and types
- Alert on critical errors

**Performance Monitoring:**
- Track API response times
- Monitor database query performance
- Track app startup time
- Monitor memory usage

**User Analytics:**
- Google Analytics / Mixpanel
- Track user flows
- Track feature usage
- Track conversion rates

### Business Metrics

**Key Metrics:**
- Daily Active Users (DAU)
- Monthly Active Users (MAU)
- User retention rate
- Average transactions per user
- Feature adoption rates
- Error rates
- API response times

---

## Future Enhancements

### Phase 2 Features
1. AI-powered spending insights
2. Automatic transaction categorization
3. Bill reminders
4. Investment tracking
5. Multi-currency support with real-time exchange rates

### Phase 3 Features
1. Family accounts with shared budgets
2. Merchant integrations
3. Bank account sync
4. Credit card integration
5. Tax report generation

### Phase 4 Features
1. Voice commands
2. Chatbot assistant
3. Predictive budgeting
4. Financial goal recommendations
5. Social features (leaderboards, challenges)

