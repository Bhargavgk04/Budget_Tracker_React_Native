# Budget Tracker - Frontend

React Native mobile application built with Expo for iOS, Android, and Web.

## 🎯 Overview

Cross-platform expense tracking mobile app with beautiful UI, offline support, and real-time synchronization.

## 🛠️ Tech Stack

- **React Native** - Mobile framework
- **Expo** - Development platform
- **TypeScript** - Type safety
- **React Navigation** - Navigation library
- **AsyncStorage** - Local storage
- **NativeWind** - Tailwind CSS for React Native
- **React Hook Form** - Form management
- **React Native Chart Kit** - Data visualization

## 📁 Project Structure

```
frontend/
├── app/                      # Application source code
│   ├── components/           # Reusable components
│   │   ├── common/          # Common UI components
│   │   ├── transactions/    # Transaction components
│   │   └── animations/      # Animation components
│   ├── screens/             # Screen components
│   │   ├── auth/           # Authentication screens
│   │   ├── dashboard/      # Dashboard screens
│   │   ├── transactions/   # Transaction screens
│   │   ├── budget/         # Budget screens
│   │   ├── analytics/      # Analytics screens
│   │   └── profile/        # Profile screens
│   ├── navigation/          # Navigation setup
│   ├── context/             # React Context (State management)
│   │   ├── AuthContext.tsx
│   │   ├── ThemeContext.tsx
│   │   └── TransactionContext.tsx
│   ├── services/            # API services
│   │   ├── ApiService.ts
│   │   └── TransactionService.ts
│   ├── utils/               # Utility functions
│   │   ├── constants.ts
│   │   ├── validation.ts
│   │   ├── formatting.ts
│   │   └── performance.ts
│   ├── hooks/               # Custom React hooks
│   ├── theme/               # Theme configuration
│   └── types/               # TypeScript types
├── assets/                  # Static assets
│   ├── images/
│   ├── fonts/
│   └── icons/
├── App.tsx                  # Application entry point
├── app.json                 # Expo configuration
├── package.json             # Dependencies
├── tsconfig.json            # TypeScript configuration
├── babel.config.js          # Babel configuration
├── tailwind.config.js       # Tailwind configuration
└── .env                     # Environment variables
```

## 🚀 Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Expo CLI: `npm install -g expo-cli`
- iOS Simulator (Mac only) or Android Studio

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm start
```

### Running the App

After starting the development server:

**On Physical Device:**
1. Install Expo Go app from App Store or Play Store
2. Scan the QR code shown in terminal

**On Emulator/Simulator:**
- Press `a` for Android emulator
- Press `i` for iOS simulator
- Press `w` for web browser

## 🔧 Configuration

### Environment Variables

Create a `.env` file:

```env
# Backend API URL
API_URL=http://localhost:3000/api

# For physical device, use your computer's IP
# API_URL=http://192.168.1.x:3000/api
```

### API Configuration

API endpoints are configured in `app/utils/constants.ts`:

```typescript
export const API_ENDPOINTS = {
  BASE_URL: __DEV__ ? 'http://localhost:3000/api' : 'https://your-api.com/api',
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    // ...
  },
  // ...
};
```

## 📱 Features

### Implemented
- ✅ User authentication (login, register, logout)
- ✅ Token management with auto-refresh
- ✅ Offline support with request queue
- ✅ API caching system
- ✅ Performance monitoring
- ✅ Error handling
- ✅ Loading states
- ✅ Form validation

### Coming Soon
- Profile management
- Transaction management
- Budget tracking
- Analytics dashboard
- Receipt scanning
- Friend expense splitting
- Push notifications

## 🧪 Testing

```bash
# Run tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm test -- --coverage
```

## 📦 Building

### Development Build

```bash
# Android
expo build:android

# iOS
expo build:ios
```

### Production Build

```bash
# Configure app.json first
expo build:android -t app-bundle
expo build:ios -t archive
```

## 🎨 Styling

This project uses **NativeWind** (Tailwind CSS for React Native).

```tsx
// Example usage
<View className="flex-1 bg-white p-4">
  <Text className="text-2xl font-bold text-gray-800">
    Hello World
  </Text>
</View>
```

## 🔐 Security

- Secure token storage using AsyncStorage
- Automatic token refresh
- Request encryption
- Input validation
- XSS protection

## 📊 Performance

- Lazy loading of screens
- Image optimization
- Virtual scrolling for lists
- Memoization of expensive components
- Performance monitoring with Flipper

## 🐛 Debugging

### React Native Debugger

```bash
# Install React Native Debugger
brew install --cask react-native-debugger

# Or download from:
# https://github.com/jhen0409/react-native-debugger/releases
```

### Flipper

Flipper is integrated for advanced debugging:
- Network inspector
- Layout inspector
- Performance monitoring
- Crash reporter

## 📝 Code Style

- ESLint for linting
- Prettier for formatting
- TypeScript for type safety

```bash
# Lint code
npm run lint

# Format code
npm run format
```

## 🌐 Internationalization

Support for multiple languages (coming soon):
- English
- Hindi
- Spanish
- French

## 📱 Platform-Specific Code

```typescript
import { Platform } from 'react-native';

const styles = StyleSheet.create({
  container: {
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
      },
      android: {
        elevation: 4,
      },
    }),
  },
});
```

## 🔄 State Management

Using React Context API:

```typescript
// Using AuthContext
const { user, login, logout } = useAuth();

// Using TransactionContext
const { transactions, addTransaction } = useTransactions();
```

## 🌐 API Integration

```typescript
import { apiService } from '@/services/ApiService';

// Make API calls
const response = await apiService.post('/auth/login', {
  email,
  password,
});
```

## 📚 Resources

- [React Native Docs](https://reactnative.dev/)
- [Expo Docs](https://docs.expo.dev/)
- [React Navigation](https://reactnavigation.org/)
- [NativeWind](https://www.nativewind.dev/)

## 🤝 Contributing

1. Create a feature branch
2. Make your changes
3. Write/update tests
4. Submit a pull request

## 📄 License

MIT License

## 👥 Support

For issues or questions, please open an issue on GitHub.

---

**Built with ❤️ using React Native and Expo**
