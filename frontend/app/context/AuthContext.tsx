import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User, ApiResponse } from '@/types';
import { STORAGE_KEYS, API_ENDPOINTS } from '@/utils/constants';
import { performanceMonitor } from '@/utils/performance';
import { withPerformanceMonitoring } from '@/utils/flipper';

// Auth state interface
interface AuthState {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
}

// Auth actions
type AuthAction =
  | { type: 'AUTH_START' }
  | { type: 'AUTH_SUCCESS'; payload: { user: User; token: string; refreshToken: string } }
  | { type: 'AUTH_FAILURE'; payload: string }
  | { type: 'LOGOUT' }
  | { type: 'CLEAR_ERROR' }
  | { type: 'UPDATE_USER'; payload: User }
  | { type: 'TOKEN_REFRESH'; payload: { token: string; refreshToken: string } };

// Initial state
const initialState: AuthState = {
  user: null,
  token: null,
  refreshToken: null,
  isLoading: true, // Start as true to wait for auth initialization
  isAuthenticated: false,
  error: null,
};

// Auth reducer
function authReducer(state: AuthState, action: AuthAction): AuthState {
  console.log('[REDUCER] Action:', action.type, 'Current state:', { isLoading: state.isLoading, isAuthenticated: state.isAuthenticated });
  
  switch (action.type) {
    case 'AUTH_START':
      console.log('[REDUCER] AUTH_START - Setting isLoading=true');
      return {
        ...state,
        isLoading: true,
        error: null,
      };
    case 'AUTH_SUCCESS':
      console.log('[REDUCER] AUTH_SUCCESS - Setting isLoading=false, isAuthenticated=true');
      return {
        ...state,
        isLoading: false,
        isAuthenticated: true,
        user: action.payload.user,
        token: action.payload.token,
        refreshToken: action.payload.refreshToken,
        error: null,
      };
    case 'AUTH_FAILURE':
      console.log('[REDUCER] AUTH_FAILURE - Setting isLoading=false, isAuthenticated=false');
      return {
        ...state,
        isLoading: false,
        isAuthenticated: false,
        user: null,
        token: null,
        refreshToken: null,
        error: action.payload,
      };
    case 'LOGOUT':
      console.log('[REDUCER] LOGOUT - Resetting to initial state');
      return {
        ...initialState,
        isLoading: false, // Don't show loading screen after logout
      };
    case 'CLEAR_ERROR':
      console.log('[REDUCER] CLEAR_ERROR');
      return {
        ...state,
        error: null,
      };
    case 'UPDATE_USER':
      console.log('[REDUCER] UPDATE_USER');
      return {
        ...state,
        user: action.payload,
      };
    case 'TOKEN_REFRESH':
      console.log('[REDUCER] TOKEN_REFRESH');
      return {
        ...state,
        token: action.payload.token,
        refreshToken: action.payload.refreshToken,
      };
    default:
      return state;
  }
}

// Auth context interface
interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
  verifyOTP: (email: string, otp: string) => Promise<void>;
  resetPassword: (email: string, otp: string, newPassword: string) => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  refreshAuthToken: () => Promise<void>;
  updateProfile: (userData: Partial<User>) => Promise<void>;
  clearError: () => void;
  demoLogin: () => Promise<void>;
}

// Create context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Secure storage utilities
class SecureStorage {
  static async setItem(key: string, value: string): Promise<void> {
    try {
      await AsyncStorage.setItem(key, value);
    } catch (error) {
      console.error('Error storing secure data:', error);
      throw new Error('Failed to store secure data');
    }
  }

  static async getItem(key: string): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(key);
    } catch (error) {
      console.error('Error retrieving secure data:', error);
      return null;
    }
  }

  static async removeItem(key: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(key);
    } catch (error) {
      console.error('Error removing secure data:', error);
    }
  }

  static async multiSet(keyValuePairs: [string, string][]): Promise<void> {
    try {
      await AsyncStorage.multiSet(keyValuePairs);
    } catch (error) {
      console.error('Error storing multiple secure items:', error);
      throw new Error('Failed to store secure data');
    }
  }

  static async multiRemove(keys: string[]): Promise<void> {
    try {
      await AsyncStorage.multiRemove(keys);
    } catch (error) {
      console.error('Error removing multiple secure items:', error);
    }
  }
}

// JWT utilities
class JWTManager {
  static isTokenExpired(token: string): boolean {
    try {
      // Validate token format
      if (!token || typeof token !== 'string' || token.split('.').length !== 3) {
        console.error('Invalid JWT token format');
        return true;
      }
      
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const payload = JSON.parse(atob(base64));
      const currentTime = Date.now() / 1000;
      return payload.exp < currentTime;
    } catch (error) {
      console.error('Error parsing JWT token:', error);
      return true;
    }
  }

  static getTokenPayload(token: string): any {
    try {
      // Validate token format
      if (!token || typeof token !== 'string' || token.split('.').length !== 3) {
        console.error('Invalid JWT token format');
        return null;
      }
      
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      return JSON.parse(atob(base64));
    } catch (error) {
      console.error('Error parsing JWT payload:', error);
      return null;
    }
  }

  static async storeTokens(token: string, refreshToken: string): Promise<void> {
    console.log('[JWTManager] Storing tokens...');
    console.log('[JWTManager] Token key:', STORAGE_KEYS.AUTH_TOKEN);
    console.log('[JWTManager] Token present:', !!token);
    
    await SecureStorage.multiSet([
      [STORAGE_KEYS.AUTH_TOKEN, token],
      [STORAGE_KEYS.REFRESH_TOKEN, refreshToken],
    ]);
    
    console.log('[JWTManager] Tokens stored successfully');
    
    // Verify storage
    const storedToken = await SecureStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
    console.log('[JWTManager] Verification - token stored:', !!storedToken);
  }

  static async getStoredTokens(): Promise<{ token: string | null; refreshToken: string | null }> {
    const [token, refreshToken] = await Promise.all([
      SecureStorage.getItem(STORAGE_KEYS.AUTH_TOKEN),
      SecureStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN),
    ]);
    return { token, refreshToken };
  }

  static async clearTokens(): Promise<void> {
    await SecureStorage.multiRemove([
      STORAGE_KEYS.AUTH_TOKEN,
      STORAGE_KEYS.REFRESH_TOKEN,
      STORAGE_KEYS.USER_DATA,
    ]);
  }
}

// API service for authentication
class AuthService {
  private static baseURL = API_ENDPOINTS.BASE_URL;

  private static async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const startTime = Date.now();
    const fullUrl = `${this.baseURL}${endpoint}`;
    
    console.log('[AuthService] Making request to:', fullUrl);
    console.log('[AuthService] Method:', options.method || 'GET');
    
    try {
      const response = await fetch(fullUrl, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        ...options,
      });

      const responseTime = Date.now() - startTime;
      performanceMonitor.endApiCall(endpoint);

      console.log('[AuthService] Response status:', response.status, response.statusText);
      console.log('[AuthService] Response time:', responseTime, 'ms');

      if (!response.ok) {
        let errorData;
        try {
          errorData = await response.json();
        } catch (e) {
          errorData = { message: `HTTP ${response.status}: ${response.statusText}` };
        }
        console.error('[AuthService] Error response:', errorData);
        throw new Error(errorData.error || errorData.message || 'Request failed');
      }

      const data = await response.json();
      console.log('[AuthService] Success response received');
      return data;
    } catch (error) {
      const responseTime = Date.now() - startTime;
      console.error(`[AuthService] API Error (${endpoint}):`, error);
      console.error('[AuthService] Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        url: fullUrl,
        responseTime,
      });
      
      // Provide more helpful error messages
      if (error instanceof TypeError && error.message.includes('Network request failed')) {
        throw new Error('Cannot connect to server. Please check your internet connection and ensure the backend is running.');
      }
      
      throw error;
    }
  }

  static login = withPerformanceMonitoring(
    async (email: string, password: string): Promise<{ user: User; token: string; refreshToken: string }> => {
      performanceMonitor.startApiCall('login');
      
      console.log('[AuthService] Login attempt for:', email);
      console.log('[AuthService] API URL:', `${this.baseURL}${API_ENDPOINTS.AUTH.LOGIN}`);
      
      const response = await this.makeRequest<{ user: User; token: string; refreshToken: string }>(
        API_ENDPOINTS.AUTH.LOGIN,
        {
          method: 'POST',
          body: JSON.stringify({ email, password }),
        }
      );

      console.log('[AuthService] Login response:', { success: response.success, hasData: !!response.data });

      if (!response.success || !response.data) {
        throw new Error(response.error || 'Login failed');
      }

      return response.data;
    },
    'login'
  );

  static register = withPerformanceMonitoring(
    async (email: string, password: string, name: string): Promise<{ user: User; token: string; refreshToken: string }> => {
      performanceMonitor.startApiCall('register');
      const response = await this.makeRequest<{ user: User; token: string; refreshToken: string }>(
        API_ENDPOINTS.AUTH.REGISTER,
        {
          method: 'POST',
          body: JSON.stringify({ email, password, name }),
        }
      );

      if (!response.success || !response.data) {
        throw new Error(response.error || 'Registration failed');
      }

      return response.data;
    },
    'register'
  );

  static forgotPassword = withPerformanceMonitoring(
    async (email: string): Promise<void> => {
      performanceMonitor.startApiCall('forgot-password');
      const response = await this.makeRequest<void>(API_ENDPOINTS.AUTH.SEND_OTP, {
        method: 'POST',
        body: JSON.stringify({ email }),
      });

      if (!response.success) {
        throw new Error(response.error || 'Failed to send OTP');
      }
    },
    'forgot-password'
  );

  static verifyOTP = withPerformanceMonitoring(
    async (email: string, otp: string): Promise<void> => {
      performanceMonitor.startApiCall('verify-otp');
      const response = await this.makeRequest<void>(API_ENDPOINTS.AUTH.VERIFY_OTP, {
        method: 'POST',
        body: JSON.stringify({ email, otp }),
      });

      if (!response.success) {
        throw new Error(response.error || 'Invalid OTP');
      }
    },
    'verify-otp'
  );

  static resetPassword = withPerformanceMonitoring(
    async (email: string, otp: string, newPassword: string): Promise<void> => {
      performanceMonitor.startApiCall('reset-password');
      const response = await this.makeRequest<void>(API_ENDPOINTS.AUTH.RESET_PASSWORD, {
        method: 'POST',
        body: JSON.stringify({ email, otp, newPassword }),
      });

      if (!response.success) {
        throw new Error(response.error || 'Failed to reset password');
      }
    },
    'reset-password'
  );

  static refreshToken = withPerformanceMonitoring(
    async (refreshToken: string): Promise<{ token: string; refreshToken: string }> => {
      performanceMonitor.startApiCall('refresh-token');
      const response = await this.makeRequest<{ token: string; refreshToken: string }>(
        API_ENDPOINTS.AUTH.REFRESH_TOKEN,
        {
          method: 'POST',
          body: JSON.stringify({ refreshToken }),
        }
      );

      if (!response.success || !response.data) {
        throw new Error(response.error || 'Token refresh failed');
      }

      return response.data;
    },
    'refresh-token'
  );

  static changePassword = withPerformanceMonitoring(
    async (currentPassword: string, newPassword: string): Promise<void> => {
      performanceMonitor.startApiCall('change-password');
      const response = await this.makeRequest<void>(API_ENDPOINTS.AUTH.CHANGE_PASSWORD, {
        method: 'POST',
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      if (!response.success) {
        throw new Error(response.error || 'Failed to change password');
      }
    },
    'change-password'
  );
}

// Auth provider component
interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Initialize auth state from storage
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        console.log('[AUTH] Starting initialization...');
        const { token, refreshToken } = await JWTManager.getStoredTokens();
        const userData = await SecureStorage.getItem(STORAGE_KEYS.USER_DATA);
        
        console.log('[AUTH] Token exists:', !!token);
        console.log('[AUTH] User data exists:', !!userData);

        if (token && refreshToken && userData) {
          const user = JSON.parse(userData);
          console.log('[AUTH] User loaded:', user.email);

          // For demo users, skip token validation and just authenticate
          if (token.startsWith('demo-token-')) {
            console.log('[AUTH] Demo user detected - authenticating immediately');
            dispatch({
              type: 'AUTH_SUCCESS',
              payload: { user, token, refreshToken },
            });
            console.log('[AUTH] Demo user authenticated successfully');
            return;
          }

          // Check if token is expired
          if (JWTManager.isTokenExpired(token)) {
            console.log('[AUTH] Token expired - logging out');
            await JWTManager.clearTokens();
            dispatch({ type: 'LOGOUT' });
          } else {
            console.log('[AUTH] Token valid - authenticating');
            dispatch({
              type: 'AUTH_SUCCESS',
              payload: { user, token, refreshToken },
            });
            console.log('[AUTH] User authenticated successfully');
          }
        } else {
          console.log('[AUTH] No stored credentials - showing login');
          dispatch({ type: 'LOGOUT' });
        }
      } catch (error) {
        console.error('[AUTH] Initialization error:', error);
        dispatch({ type: 'LOGOUT' });
      }
    };

    // Add timeout to prevent infinite loading
    const timeout = setTimeout(() => {
      console.warn('[AUTH] Initialization timeout - forcing logout');
      dispatch({ type: 'LOGOUT' });
    }, 3000); // 3 second timeout

    initializeAuth().finally(() => {
      console.log('[AUTH] Initialization complete');
      clearTimeout(timeout);
    });

    return () => clearTimeout(timeout);
  }, []);

  // Auth methods
  const login = async (email: string, password: string): Promise<void> => {
    try {
      console.log('[LOGIN] Starting login for:', email);
      dispatch({ type: 'AUTH_START' });
      
      console.log('[LOGIN] Calling backend API...');
      const authData = await AuthService.login(email, password);
      
      console.log('[LOGIN] Login successful, storing tokens...');
      // Store tokens and user data
      await JWTManager.storeTokens(authData.token, authData.refreshToken);
      await SecureStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(authData.user));

      console.log('[LOGIN] Dispatching AUTH_SUCCESS...');
      dispatch({
        type: 'AUTH_SUCCESS',
        payload: authData,
      });
      console.log('[LOGIN] Login complete!');
    } catch (error) {
      console.error('[LOGIN] Login failed:', error);
      dispatch({
        type: 'AUTH_FAILURE',
        payload: error instanceof Error ? error.message : 'Login failed',
      });
      throw error;
    }
  };

  const register = async (email: string, password: string, name: string): Promise<void> => {
    try {
      dispatch({ type: 'AUTH_START' });
      const authData = await AuthService.register(email, password, name);
      
      // Store tokens and user data
      await JWTManager.storeTokens(authData.token, authData.refreshToken);
      await SecureStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(authData.user));

      dispatch({
        type: 'AUTH_SUCCESS',
        payload: authData,
      });
    } catch (error) {
      dispatch({
        type: 'AUTH_FAILURE',
        payload: error instanceof Error ? error.message : 'Registration failed',
      });
      throw error;
    }
  };

  const logout = async (): Promise<void> => {
    try {
      await JWTManager.clearTokens();
      dispatch({ type: 'LOGOUT' });
    } catch (error) {
      console.error('Logout error:', error);
      dispatch({ type: 'LOGOUT' });
    }
  };

  const forgotPassword = async (email: string): Promise<void> => {
    try {
      await AuthService.forgotPassword(email);
    } catch (error) {
      throw error;
    }
  };

  const verifyOTP = async (email: string, otp: string): Promise<void> => {
    try {
      await AuthService.verifyOTP(email, otp);
    } catch (error) {
      throw error;
    }
  };

  const resetPassword = async (email: string, otp: string, newPassword: string): Promise<void> => {
    try {
      await AuthService.resetPassword(email, otp, newPassword);
    } catch (error) {
      throw error;
    }
  };

  const changePassword = async (currentPassword: string, newPassword: string): Promise<void> => {
    try {
      if (!state.token) {
        throw new Error('Not authenticated');
      }

      // Call your API to change password
      await AuthService.changePassword(currentPassword, newPassword);

      // Update the token if the backend returns a new one
      // const data = await response.json();
      // if (data.token) {
      //   await JWTManager.storeTokens(data.token, state.refreshToken || '');
      //   dispatch({
      //     type: 'TOKEN_REFRESH',
      //     payload: {
      //       token: data.token,
      //       refreshToken: state.refreshToken || '',
      //     },
      //   });
      // }
    } catch (error) {
      console.error('Change password error:', error);
      throw new Error(error instanceof Error ? error.message : 'Failed to change password');
    }
  };

  const refreshAuthToken = async (): Promise<void> => {
    try {
      if (!state.refreshToken) {
        throw new Error('No refresh token available');
      }

      const newTokens = await AuthService.refreshToken(state.refreshToken);
      await JWTManager.storeTokens(newTokens.token, newTokens.refreshToken);

      dispatch({
        type: 'TOKEN_REFRESH',
        payload: newTokens,
      });
    } catch (error) {
      // If refresh fails, logout user
      await logout();
      throw error;
    }
  };

  const updateProfile = async (userData: Partial<User>): Promise<void> => {
    try {
      if (!state.user) {
        throw new Error('No user logged in');
      }

      const updatedUser = { ...state.user, ...userData };
      await SecureStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(updatedUser));

      dispatch({
        type: 'UPDATE_USER',
        payload: updatedUser,
      });
    } catch (error) {
      throw error;
    }
  };

  const clearError = (): void => {
    dispatch({ type: 'CLEAR_ERROR' });
  };

  const demoLogin = async (): Promise<void> => {
    try {
      console.log('[DEMO] Starting demo login...');
      dispatch({ type: 'AUTH_START' });
      
      // Create demo user data
      const demoUser: User = {
        id: 'demo-user-123',
        email: 'demo@example.com',
        name: 'Demo User',
        currency: 'USD',
        preferences: {
          theme: 'light',
          notifications: true,
          biometric: false,
          language: 'en',
          dateFormat: 'MM/DD/YYYY',
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      const demoToken = 'demo-token-' + Date.now();
      const demoRefreshToken = 'demo-refresh-token-' + Date.now();
      
      console.log('[DEMO] Storing tokens...');
      // Store demo tokens and user data (parallel for speed)
      await Promise.all([
        JWTManager.storeTokens(demoToken, demoRefreshToken),
        SecureStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(demoUser)),
      ]);

      console.log('[DEMO] Tokens stored, dispatching AUTH_SUCCESS...');
      // Dispatch success immediately for fast navigation
      dispatch({
        type: 'AUTH_SUCCESS',
        payload: {
          user: demoUser,
          token: demoToken,
          refreshToken: demoRefreshToken,
        },
      });
      
      console.log('[DEMO] Demo login successful!');

      // Initialize demo data in background (don't wait)
      console.log('[DEMO] Loading demo data in background...');
      import('@/services/MockDataService').then(({ MockDataService }) => {
        MockDataService.initializeDemoData().catch(err => 
          console.error('[DEMO] Demo data initialization error:', err)
        );
      });
    } catch (error) {
      console.error('[DEMO] Demo login error:', error);
      dispatch({
        type: 'AUTH_FAILURE',
        payload: error instanceof Error ? error.message : 'Demo login failed',
      });
      throw error;
    }
  };

  const contextValue: AuthContextType = {
    ...state,
    login,
    register,
    logout,
    forgotPassword,
    verifyOTP,
    resetPassword,
    changePassword,
    refreshAuthToken,
    updateProfile,
    clearError,
    demoLogin,
  };

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>;
}

// Custom hook to use auth context
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthContext;