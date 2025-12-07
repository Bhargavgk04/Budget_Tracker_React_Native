import AsyncStorage from "@react-native-async-storage/async-storage";
import { STORAGE_KEYS } from "../utils/constants";

// API Base URL - Update this to match your backend
const API_BASE_URL = process.env.API_URL || "http://192.168.0.125:3000/api";

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

// Helper function to make API requests with cache invalidation
const apiRequest = async (endpoint, options = {}, invalidateCache = false) => {
  try {
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

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || data.message || "Request failed");
    }

    return data;
  } catch (error) {
    console.error(`API Request Error (${endpoint}):`, error);
    throw error;
  }
};

// Cache invalidation helper
const invalidateRelatedCache = async (endpoint) => {
  const cacheKeys = [
    'transactions_all',
    'transactions_stats', 
    'analytics_category-breakdown',
    'analytics_summary'
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
};

// Transaction API
export const transactionAPI = {
  create: async (transactionData) => {
    try {
      const response = await apiRequest("/transactions", {
        method: "POST",
        body: JSON.stringify(transactionData),
      }, true); // Invalidate cache

      return { success: true, data: response.data };
    } catch (error) {
      console.error("Error creating transaction:", error);
      return { success: false, error: error.message };
    }
  },

  getAll: async (userId) => {
    try {
      const response = await apiRequest("/transactions");
      const raw = response.data?.data || response.data || [];
      const normalized = Array.isArray(raw)
        ? raw.map(item => ({ ...item, id: item.id || item._id }))
        : Array.isArray(raw.data)
          ? raw.data.map(item => ({ ...item, id: item.id || item._id }))
          : [];
      return { success: true, data: normalized };
    } catch (error) {
      console.error("Error getting transactions:", error);
      return { success: false, data: [], error: error.message };
    }
  },

  update: async (id, transactionData) => {
    try {
      const response = await apiRequest(`/transactions/${id}`, {
        method: "PUT",
        body: JSON.stringify(transactionData),
      }, true); // Invalidate cache

      return { success: true, data: response.data };
    } catch (error) {
      console.error("Error updating transaction:", error);
      throw error;
    }
  },

  delete: async (id) => {
    try {
      const response = await apiRequest(`/transactions/${id}`, {
        method: "DELETE",
      }, true); // Invalidate cache

      return { success: true, data: response.data };
    } catch (error) {
      console.error("Error deleting transaction:", error);
      throw error;
    }
  },
};

// Analytics API
export const analyticsAPI = {
  getSummary: async (userId) => {
    try {
      const response = await apiRequest("/transactions/stats");
      
      // Transform backend response to match expected format
      const stats = response.data || {};
      return {
        data: {
          income: stats.income?.total || 0,
          expense: stats.expense?.total || 0,
          savings: stats.balance || 0,
          totalTransactions: stats.totalTransactions || 0,
        },
      };
    } catch (error) {
      console.error("Error getting summary:", error);
      return {
        data: {
          income: 0,
          expense: 0,
          savings: 0,
          totalTransactions: 0,
        },
      };
    }
  },

  getCategoryBreakdown: async (userId) => {
    try {
      const response = await apiRequest("/analytics/category-breakdown");
      return { data: response.data || [] };
    } catch (error) {
      console.error("Error getting category breakdown:", error);
      return { data: [] };
    }
  },
};

export default { authAPI, transactionAPI, analyticsAPI };
