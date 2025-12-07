const path = require('path');

module.exports = {
  owner: 'bhargavgk',
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
    versionCode: 1,
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
      projectId: '65ee79b5-5180-46c2-937a-005107b3ae7b'
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
