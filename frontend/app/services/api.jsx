import AsyncStorage from "@react-native-async-storage/async-storage";
import { STORAGE_KEYS } from "../utils/constants";

// API Base URL - Update this to match your backend
const API_BASE_URL = "https://budget-tracker-react-native-kjff.onrender.com/api";

// Cache invalidation timestamps
const cacheInvalidationTimes = new Map();

// Helper function to get auth token
const getAuthToken = async () => {
  try {
    const token = await AsyncStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
    return token;
  } catch (error) {
    console.error("Error getting auth token:", error);
    return null;
  }
};

// Backend wake-up state
let backendWakeAttempted = false;
let backendIsAwake = false;

// Wake up backend (call health endpoint)
const wakeBackend = async () => {
  if (backendWakeAttempted) return;
  backendWakeAttempted = true;

  console.log('[API] Waking up backend...');
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout for wake

    const response = await fetch(`${API_BASE_URL.replace('/api', '')}/health`, {
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    
    if (response.ok) {
      backendIsAwake = true;
      console.log('[API] Backend is awake!');
    }
  } catch (error) {
    console.warn('[API] Backend wake-up failed, will retry on next request');
  }
};

// Call wake on module load
wakeBackend();

// Helper function to make API requests with cache invalidation and retry
const apiRequest = async (endpoint, options = {}, invalidateCache = false, retries = 1) => {
  // Invalidate cache for POST/PUT/DELETE operations
  if (invalidateCache || ['POST', 'PUT', 'DELETE'].includes(options.method)) {
    await invalidateRelatedCache(endpoint);
  }

  const token = await getAuthToken();
  const headers = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  let lastError;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const controller = new AbortController();
      // Longer timeout for first request if backend might be sleeping
      const timeout = (!backendIsAwake && attempt === 0) ? 30000 : 10000;
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // Mark backend as awake after first successful request
      if (!backendIsAwake) {
        backendIsAwake = true;
        console.log('[API] Backend confirmed awake');
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || data.message || "Request failed");
      }

      return data;
    } catch (error) {
      lastError = error;
      
      // Don't retry on auth errors or client errors
      if (error.message?.includes('401') || error.message?.includes('403')) {
        throw error;
      }

      // Log retry attempts
      if (attempt < retries) {
        console.warn(`API Request failed (${endpoint}), retrying... (${attempt + 1}/${retries})`);
        await new Promise(resolve => setTimeout(resolve, 2000)); // 2 second delay
      }
    }
  }

  console.error(`API Request Error (${endpoint}):`, lastError);
  
  // Provide helpful error message
  if (lastError.name === 'AbortError' || lastError.message?.includes('timeout')) {
    throw new Error('Backend is waking up. Please wait 30 seconds and try again.');
  }
  
  throw new Error(`Network error: ${lastError.message}`);
};

// Cache invalidation helper
const invalidateRelatedCache = async (endpoint) => {
  const cacheKeys = [
    'transactions_all',
    'transactions_stats'
  ];
  
  for (const key of cacheKeys) {
    cacheInvalidationTimes.set(key, Date.now());
  }
  
  console.log('Cache invalidated for:', cacheKeys);
};

// Auth API
export const authAPI = {
  login: async (email, password) => {
    try {
      const response = await apiRequest("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });

      // Store token
      if (response.data?.token) {
        await AsyncStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, response.data.token);
      }

      return response;
    } catch (error) {
      throw new Error(error.message || "Login failed");
    }
  },

  register: async (name, email, password) => {
    try {
      const response = await apiRequest("/auth/register", {
        method: "POST",
        body: JSON.stringify({ name, email, password }),
      });

      // Store token
      if (response.data?.token) {
        await AsyncStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, response.data.token);
      }

      return response;
    } catch (error) {
      throw new Error(error.message || "Registration failed");
    }
  },

  logout: async () => {
    try {
      await AsyncStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
      await AsyncStorage.removeItem(STORAGE_KEYS.USER_DATA);
    } catch (error) {
      console.error("Logout error:", error);
    }
  },

  sendOTP: async (email) => {
    try {
      const response = await apiRequest("/auth/send-otp", {
        method: "POST",
        body: JSON.stringify({ email }),
      });
      return response;
    } catch (error) {
      throw new Error(error.message || "Failed to send OTP");
    }
  },

  verifyOTP: async (email, otp) => {
    try {
      const response = await apiRequest("/auth/verify-otp", {
        method: "POST",
        body: JSON.stringify({ email, otp }),
      });
      return response;
    } catch (error) {
      throw new Error(error.message || "OTP verification failed");
    }
  },

};

// Transaction API
export const transactionAPI = {
  create: async (transactionData) => {
    console.log('[API] Creating transaction with data:', transactionData);
    const response = await apiRequest("/transactions", {
      method: "POST",
      body: JSON.stringify(transactionData),
    }, true); // Invalidate cache

    console.log('[API] Transaction created successfully:', response);
    return { success: true, data: response.data };
  },

  getAll: async (userId) => {
    const response = await apiRequest("/transactions");
    const raw = response.data?.data || response.data || [];
    const normalized = Array.isArray(raw)
      ? raw.map(item => ({ ...item, id: item.id || item._id }))
      : Array.isArray(raw.data)
        ? raw.data.map(item => ({ ...item, id: item.id || item._id }))
        : [];
    return { success: true, data: normalized };
  },

  update: async (id, transactionData) => {
    const response = await apiRequest(`/transactions/${id}`, {
      method: "PUT",
      body: JSON.stringify(transactionData),
    }, true); // Invalidate cache

    return { success: true, data: response.data };
  },

  delete: async (id) => {
    const response = await apiRequest(`/transactions/${id}`, {
      method: "DELETE",
    }, true); // Invalidate cache

    return { success: true, data: response.data };
  },

  // Split operations
  createSplit: async (transactionId, splitConfig) => {
    console.log('[API] Creating split for transaction:', transactionId);
    console.log('[API] Split config:', splitConfig);
    
    const payload = {
      splitType: splitConfig.splitType,
      paidBy: splitConfig.paidBy,
      participants: (splitConfig.participants || []).map(p => ({
        user: p.userId || p._id || p.user || undefined,
        share: p.share || 0,
        percentage: p.percentage,
      }))
    };

    console.log('[API] Split payload:', payload);

    const response = await apiRequest(`/transactions/${transactionId}/split`, {
      method: "POST",
      body: JSON.stringify(payload),
    }, true); // Invalidate cache

    console.log('[API] Split created successfully:', response);
    return { success: true, data: response.data };
  },
};

export default { authAPI, transactionAPI };
