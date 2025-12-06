import { Platform } from 'react-native';
import Constants from 'expo-constants';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '@/utils/constants';

/**
 * API Configuration
 * 
 * Automatically detects the correct backend URL based on platform:
 * - Expo Go (Physical Device): Uses Render backend
 * - Android Emulator: Uses Render backend
 * - iOS Simulator: Uses Render backend
 * - Web: Uses Render backend
 * 
 * For all platforms, we use the Render backend for consistency!
 */

// Fallback IP if Expo can't detect (update this to your computer's IP)
const FALLBACK_LOCAL_IP = '192.168.1.7';

// Get the local network IP from Expo or use fallback
const getLocalNetworkIP = (): string => {
  // Expo provides the dev server URL which includes your computer's IP
  const debuggerHost = Constants.expoConfig?.hostUri;
  
  if (debuggerHost) {
    // Extract IP from debuggerHost (format: "192.168.1.100:8081")
    const ip = debuggerHost.split(':')[0];
    console.log('[API Config] Detected IP from Expo:', ip);
    return ip;
  }
  
  console.log('[API Config] Using fallback IP:', FALLBACK_LOCAL_IP);
  return FALLBACK_LOCAL_IP;
};

// Detect if running in Expo Go on physical device
const isExpoGo = (): boolean => {
  return Constants.appOwnership === 'expo';
};

// Auto-detect if running on physical device vs emulator
const isPhysicalDevice = (): boolean => {
  if (Platform.OS === 'web') return false;
  
  // If running in Expo Go, it's likely a physical device
  if (isExpoGo()) {
    console.log('[API Config] Running in Expo Go - using physical device IP');
    return true;
  }
  
  // Check if explicitly set via environment variable
  if (process.env.USE_PHYSICAL_DEVICE === 'true') {
    return true;
  }
  
  // Default to emulator for Android, physical for iOS
  return Platform.OS === 'ios';
};

const getDevBaseURL = () => {
  // Always use Render backend for all platforms
  console.log('[API Config] Using Render backend');
  return 'https://budget-tracker-react-native-kjff.onrender.com/api';
};

export const API_CONFIG = {
  DEV_BASE_URL: process.env.API_URL || 'https://budget-tracker-react-native-kjff.onrender.com/api',
  PROD_BASE_URL: process.env.API_URL || 'https://budget-tracker-react-native-kjff.onrender.com/api',
  TIMEOUT: 30000, // 30 seconds
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000, // 1 second
  
  // Network configuration
  HEADERS: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
};

// Helper function to check if backend is reachable
export const checkBackendConnection = async (): Promise<boolean> => {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    
    const response = await fetch(
      `${__DEV__ ? API_CONFIG.DEV_BASE_URL.replace('/api', '') : API_CONFIG.PROD_BASE_URL.replace('/api', '')}/health`,
      {
        method: 'GET',
        signal: controller.signal,
      }
    );
    
    clearTimeout(timeoutId);
    return response.ok;
  } catch (error) {
    console.error('[API] Backend connection check failed:', error);
    return false;
  }
};

// Helper to get current API base URL
export const getApiBaseUrl = (): string => {
  // Always use production URL
  return API_CONFIG.PROD_BASE_URL;
};

// Log current configuration in development
if (__DEV__) {
  console.log('[API Config] ========================================');
  console.log('[API Config] Platform:', Platform.OS);
  console.log('[API Config] Running in Expo Go:', isExpoGo());
  console.log('[API Config] Is Physical Device:', isPhysicalDevice());
  console.log('[API Config] Base URL:', getDevBaseURL());
  console.log('[API Config] ========================================');
}

// Create axios instance
const API = axios.create({
  baseURL: getApiBaseUrl(),
  timeout: API_CONFIG.TIMEOUT,
  headers: API_CONFIG.HEADERS,
});

// Request interceptor to add auth token
API.interceptors.request.use(
  async (config) => {
    try {
      // Read the same key AuthContext uses for JWT storage
      const token = await AsyncStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
      console.log('[API Config] Auth token present:', !!token);
      console.log('[API Config] Token key being checked:', STORAGE_KEYS.AUTH_TOKEN);
      
      // Debug: Check all storage keys
      const allKeys = await AsyncStorage.getAllKeys();
      console.log('[API Config] All storage keys:', allKeys);
      
      // Debug: Check if our token key exists
      const tokenExists = allKeys.includes(STORAGE_KEYS.AUTH_TOKEN);
      console.log('[API Config] Token key exists in storage:', tokenExists);

      if (token) {
        config.headers = config.headers || {};
        config.headers.Authorization = `Bearer ${token}`;
        console.log('[API Config] Token added to request headers');
      }
    } catch (error) {
      console.log('Error getting token from AsyncStorage:', error);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
API.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      const errorMessage = error.response?.data?.error;
      
      // Handle token expiration specifically
      if (errorMessage === 'Token expired') {
        console.log('Token expired - clearing auth and redirecting to login');
        // Clear the expired token
        await AsyncStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
        await AsyncStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
        
        // You might want to emit an event or use a navigation service here
        // For now, we'll just log it and let individual components handle navigation
      } else {
        console.log('Unauthorized - redirecting to login');
      }
    }
    return Promise.reject(error);
  }
);

export default API;
