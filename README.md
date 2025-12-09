# Budget Tracker - Personal Finance Management App

A full-stack mobile application for tracking personal finances, built with React Native (Expo) and Node.js.

## 🌟 Features

### Core Functionality
- **Transaction Management**: Add, edit, delete income and expense transactions
- **Dashboard**: Visual overview with balance, income, and expense summaries
- **Category Breakdown**: Professional pie chart showing expense distribution
- **Transaction Details**: Comprehensive view with date, time, payment mode, and notes
- **Real-time Updates**: Instant UI updates when transactions are added/modified
- **Period Filtering**: View transactions by Today, This Week, This Month, or This Year

### User Experience
- **Smooth Animations**: React Native Reanimated for fluid transitions
- **Professional UI**: Modern design with Material Design icons
- **Color-Coded Balance**: Red indicator when expenses exceed income
- **Pull-to-Refresh**: Easy data synchronization
- **Search & Filter**: Find transactions quickly
- **Responsive Design**: Works on all screen sizes

### Technical Features
- **JWT Authentication**: Secure user sessions
- **Offline Support**: Queue requests when offline
- **Performance Monitoring**: Track API response times
- **Error Handling**: Graceful error messages and recovery
- **Caching**: Smart caching for faster load times
- **Backend Wake-up**: Automatic handling of Render cold starts

## 🏗️ Architecture

### Frontend (React Native + Expo)
```
frontend/
├── app/
│   ├── components/      # Reusable UI components
│   ├── context/         # React Context for state management
│   ├── hooks/           # Custom React hooks
│   ├── navigation/      # React Navigation setup
│   ├── screens/         # App screens
│   ├── services/        # API services
│   ├── theme/           # Theme configuration
│   ├── types/           # TypeScript type definitions
│   └── utils/           # Utility functions
```

### Backend (Node.js + Express + MongoDB)
```
backend/
├── models/              # Mongoose schemas
├── routes/              # API endpoints
├── services/            # Business logic
├── middleware/          # Auth, validation, error handling
├── utils/               # Helper functions
└── server.js            # Express server setup
```

## 🚀 Getting Started

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn
- MongoDB (local or Atlas)
- Expo CLI (for mobile development)

### Backend Setup

1. **Navigate to backend directory**
   ```bash
   cd backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Create `.env` file**
   ```env
   PORT=3000
   MONGODB_URI=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret_key
   JWT_REFRESH_SECRET=your_refresh_secret_key
   NODE_ENV=development
   ```

4. **Start the server**
   ```bash
   npm start
   ```

   The backend will run on `http://localhost:3000`

### Frontend Setup

1. **Navigate to frontend directory**
   ```bash
   cd frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Update API configuration**
   
   Edit `frontend/app/utils/constants.ts`:
   ```typescript
   // For local development
   const USE_LOCAL = true;
   
   // Update with your computer's IP address
   return 'http://YOUR_IP_ADDRESS:3000/api';
   ```

4. **Start Expo**
   ```bash
   npm start
   ```

5. **Run on device/emulator**
   - Press `a` for Android
   - Press `i` for iOS
   - Scan QR code with Expo Go app

## 📱 App Screens

### Dashboard
- Total balance with color indicator
- Income and expense summary
- Period selector (Today, Week, Month, Year)
- Category breakdown pie chart
- Recent transactions list

### Transactions
- Complete transaction list
- Filter by type (All, Income, Expense)
- Search functionality
- Pull-to-refresh
- Click to view details

### Transaction Details
- Full transaction information
- Date and time display
- Payment mode
- Category
- Description/Notes
- Edit and delete actions

### Add Transaction
- Income/Expense toggle
- Amount input
- Category selection
- Payment mode (Cash/Online)
- Date picker
- Notes field

### Profile
- User information
- Transaction statistics
- Total income and expenses
- Settings and logout

## 🔧 Configuration

### Backend Configuration

**Environment Variables:**
- `PORT`: Server port (default: 3000)
- `MONGODB_URI`: MongoDB connection string
- `JWT_SECRET`: Secret for access tokens
- `JWT_REFRESH_SECRET`: Secret for refresh tokens
- `NODE_ENV`: Environment (development/production)

**Security Features:**
- Helmet for HTTP headers
- CORS configuration
- Rate limiting
- JWT authentication
- Password hashing with bcrypt

### Frontend Configuration

**API Endpoints:**
Located in `frontend/app/utils/constants.ts`

**Theme:**
Located in `frontend/app/theme/index.ts`

**Colors:**
Professional color palette in `frontend/app/utils/constants.ts`

## 🎨 Design System

### Colors
- **Primary**: #6366F1 (Indigo)
- **Success**: #10B981 (Green)
- **Error**: #EF4444 (Red)
- **Background**: #F8FAFC
- **Surface**: #FFFFFF

### Typography
- **Headers**: Bold, 24-36px
- **Body**: Regular, 14-16px
- **Captions**: Regular, 12px

### Components
- Material Design icons
- Rounded corners (8-16px)
- Subtle shadows
- Smooth animations

## 🔐 Authentication

### Registration
- Email and password
- Password validation (min 8 chars, uppercase, lowercase, number, special char)
- Automatic login after registration

### Login
- Email and password
- JWT token generation
- Refresh token for session management

### Security
- Passwords hashed with bcrypt
- JWT tokens with expiration
- Refresh token rotation
- Secure HTTP-only cookies (production)

## 📊 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/refresh-token` - Refresh access token
- `POST /api/auth/logout` - Logout user

### Transactions
- `GET /api/transactions` - Get all transactions
- `GET /api/transactions/:id` - Get single transaction
- `POST /api/transactions` - Create transaction
- `PUT /api/transactions/:id` - Update transaction
- `DELETE /api/transactions/:id` - Delete transaction
- `GET /api/transactions/stats` - Get statistics

### Categories
- `GET /api/categories` - Get all categories
- `POST /api/categories` - Create category
- `PUT /api/categories/:id` - Update category
- `DELETE /api/categories/:id` - Delete category

### User
- `GET /api/user/profile` - Get user profile
- `PUT /api/user/profile` - Update profile
- `GET /api/user/stats` - Get user statistics

## 🧪 Testing

### Backend Tests
```bash
cd backend
npm test
```

### Frontend Tests
```bash
cd frontend
npm test
```

## 📦 Deployment

### Backend (Render)
1. Create new Web Service on Render
2. Connect GitHub repository
3. Set environment variables
4. Deploy

**Note:** Free tier spins down after 15 minutes of inactivity. First request may take 20-30 seconds.

### Frontend (Expo)
1. Build for production:
   ```bash
   expo build:android
   expo build:ios
   ```

2. Submit to stores:
   ```bash
   expo submit:android
   expo submit:ios
   ```

## 🛠️ Technologies Used

### Frontend
- **React Native** - Mobile framework
- **Expo** - Development platform
- **TypeScript** - Type safety
- **React Navigation** - Navigation
- **React Native Reanimated** - Animations
- **Axios** - HTTP client
- **AsyncStorage** - Local storage
- **React Native Chart Kit** - Charts

### Backend
- **Node.js** - Runtime
- **Express** - Web framework
- **MongoDB** - Database
- **Mongoose** - ODM
- **JWT** - Authentication
- **Bcrypt** - Password hashing
- **Joi** - Validation
- **Helmet** - Security
- **CORS** - Cross-origin requests

## 🐛 Known Issues

### Render Free Tier
- Backend spins down after 15 minutes of inactivity
- First request after sleep takes 20-30 seconds
- Solution: App automatically wakes backend on start

### Solutions Implemented
- Automatic backend wake-up
- Extended timeout for first request (35s)
- Clear error messages
- Retry logic with exponential backoff

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

## 📝 License

This project is licensed under the MIT License.

## 👨‍💻 Author

**Bhargav Katkam**
- Email: bhargavkatkam0@gmail.com

## 🙏 Acknowledgments

- Material Design Icons
- React Native Community
- Expo Team
- MongoDB Team

## 📞 Support

For support, email bhargavkatkam0@gmail.com or open an issue on GitHub.

---

**Made with ❤️ using React Native and Node.js**
