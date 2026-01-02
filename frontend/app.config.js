const path = require('path');

module.exports = {
  owner: 'bhargavgk1104',
  name: 'Budget Tracker',
  slug: 'mobile-budget-tracker',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/icon.png',
  userInterfaceStyle: 'light',
  splash: {
    image: './assets/splash.png',
    resizeMode: 'contain',
    backgroundColor: '#6366F1'
  },
  updates: {
    fallbackToCacheTimeout: 0,
    // Enable automatic refresh on app resume
    checkAutomatically: 'ON_LOAD',
    enabled: true
  },
  assetBundlePatterns: ['**/*'],
  ios: {
    supportsTablet: true,
    bundleIdentifier: 'com.bhargavgk.mobilebudgettracker'
  },
  android: {
    adaptiveIcon: {
      foregroundImage: path.resolve(__dirname, 'assets/adaptive-icon.png'),
      backgroundColor: '#6366F1'
    },
    package: 'com.bhargavgk.mobilebudgettracker',
    permissions: ['INTERNET', 'ACCESS_NETWORK_STATE']
  },
  web: {
    favicon: './assets/favicon.png',
    bundler: 'metro',
    theme: {
      primaryColor: '#6366F1',
      backgroundColor: '#F8FAFC'
    },
    // Enable hot reload and auto-refresh for web
    hot: true,
    reload: true
  },
  extra: {
    eas: {
      projectId: '69b1d27b-0b9a-4b58-8bce-c87b95b29c51'
    },
    apiUrl: 'https://budget-tracker-react-native-kjff.onrender.com/api'
  },
  scheme: 'budget-tracker',
  platforms: ['ios', 'android', 'web'],
  // Add metro config reference for EAS Build
  metro: {
    config: './metro.config.js'
  }
};
