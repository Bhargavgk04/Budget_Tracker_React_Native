import AsyncStorage from '@react-native-async-storage/async-storage';
import { ApiResponse, PaginatedResponse } from '@/types';
import { API_ENDPOINTS, STORAGE_KEYS } from '@/utils/constants';
import { performanceMonitor } from '@/utils/performance';
import { withPerformanceMonitoring } from '@/utils/flipper';

// Cache configuration
interface CacheConfig {
  ttl: number; // Time to live in milliseconds
  key: string;
}

interface CachedData<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

// Network status
class NetworkStatus {
  private static isOnline = true;
  private static listeners: ((isOnline: boolean) => void)[] = [];

  static setOnline(status: boolean) {
    this.isOnline = status;
    this.listeners.forEach(listener => listener(status));
  }

  static getStatus(): boolean {
    return this.isOnline;
  }

  static addListener(listener: (isOnline: boolean) => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }
}

// Request queue for offline support
class RequestQueue {
  private static queue: Array<{
    id: string;
    url: string;
    options: RequestInit;
    timestamp: number;
  }> = [];

  static async addToQueue(url: string, options: RequestInit): Promise<string> {
    const id = Date.now().toString() + Math.random().toString(36).substr(2);
    const queueItem = { id, url, options, timestamp: Date.now() };
    
    this.queue.push(queueItem);
    await this.saveQueue();
    
    return id;
  }

  static async processQueue(): Promise<void> {
    if (!NetworkStatus.getStatus() || this.queue.length === 0) return;

    const itemsToProcess = [...this.queue];
    this.queue = [];

    for (const item of itemsToProcess) {
      try {
        await fetch(item.url, item.options);
      } catch (error) {
        // Re-add failed requests to queue
        this.queue.push(item);
      }
    }

    await this.saveQueue();
  }

  private static async saveQueue(): Promise<void> {
    try {
      await AsyncStorage.setItem('api_request_queue', JSON.stringify(this.queue));
    } catch (error) {
      console.error('Failed to save request queue:', error);
    }
  }

  static async loadQueue(): Promise<void> {
    try {
      const queueData = await AsyncStorage.getItem('api_request_queue');
      if (queueData) {
        this.queue = JSON.parse(queueData);
      }
    } catch (error) {
      console.error('Failed to load request queue:', error);
    }
  }
}

// Cache manager
class CacheManager {
  private static cache = new Map<string, CachedData<any>>();

  static async get<T>(key: string): Promise<T | null> {
    try {
      // Check memory cache first
      const memoryData = this.cache.get(key);
      if (memoryData && this.isValid(memoryData)) {
        return memoryData.data;
      }

      // Check AsyncStorage cache
      const storageData = await AsyncStorage.getItem(`cache_${key}`);
      if (storageData) {
        const parsed: CachedData<T> = JSON.parse(storageData);
        if (this.isValid(parsed)) {
          // Update memory cache
          this.cache.set(key, parsed);
          return parsed.data;
        } else {
          // Remove expired cache
          await this.remove(key);
        }
      }

      return null;
    } catch (error) {
      console.error('Cache get error:', error);
      return null;
    }
  }

  static async set<T>(key: string, data: T, ttl: number = 300000): Promise<void> {
    try {
      const cachedData: CachedData<T> = {
        data,
        timestamp: Date.now(),
        ttl,
      };

      // Update memory cache
      this.cache.set(key, cachedData);

      // Update AsyncStorage cache
      await AsyncStorage.setItem(`cache_${key}`, JSON.stringify(cachedData));
    } catch (error) {
      console.error('Cache set error:', error);
    }
  }

  static async remove(key: string): Promise<void> {
    try {
      this.cache.delete(key);
      await AsyncStorage.removeItem(`cache_${key}`);
    } catch (error) {
      console.error('Cache remove error:', error);
    }
  }

  static async clear(): Promise<void> {
    try {
      this.cache.clear();
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter(key => key.startsWith('cache_'));
      await AsyncStorage.multiRemove(cacheKeys);
    } catch (error) {
      console.error('Cache clear error:', error);
    }
  }

  private static isValid<T>(cachedData: CachedData<T>): boolean {
    return Date.now() - cachedData.timestamp < cachedData.ttl;
  }
}

// Main API service class
export class ApiService {
  private static baseURL = API_ENDPOINTS.BASE_URL;
  private static defaultHeaders = {
    'Content-Type': 'application/json',
  };

  // Initialize the service
  static async initialize(): Promise<void> {
    await RequestQueue.loadQueue();
    
    // Set up network status monitoring
    // In a real app, you'd use NetInfo from @react-native-community/netinfo
    NetworkStatus.addListener((isOnline) => {
      if (isOnline) {
        RequestQueue.processQueue();
      }
    });
  }

  // Generic request method with caching and offline support
  private static async request<T>(
    endpoint: string,
    options: RequestInit = {},
    cacheConfig?: CacheConfig
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseURL}${endpoint}`;
    const method = options.method || 'GET';
    
    // Start performance monitoring
    performanceMonitor.startApiCall(endpoint);

    // Check cache for GET requests
    if (method === 'GET' && cacheConfig) {
      const cachedData = await CacheManager.get<ApiResponse<T>>(cacheConfig.key);
      if (cachedData) {
        performanceMonitor.endApiCall(endpoint);
        return cachedData;
      }
    }

    // Get auth token
    const token = await AsyncStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
    
    const requestOptions: RequestInit = {
      ...options,
      headers: {
        ...this.defaultHeaders,
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
    };

    // Add timeout to prevent long waits
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
    requestOptions.signal = controller.signal;

    try {
      // Check network status
      if (!NetworkStatus.getStatus()) {
        clearTimeout(timeoutId);
        if (method !== 'GET') {
          // Queue non-GET requests for later
          await RequestQueue.addToQueue(url, requestOptions);
          return {
            success: false,
            error: 'Request queued for when connection is restored',
          };
        } else {
          throw new Error('No internet connection');
        }
      }

      const response = await fetch(url, requestOptions);
      clearTimeout(timeoutId);
      const responseTime = performanceMonitor.endApiCall(endpoint);

      // Handle token expiration
      if (response.status === 401) {
        console.log('[API] Received 401, attempting token refresh...');
        const refreshed = await this.handleTokenExpiration();
        
        if (refreshed) {
          // Retry the original request with new token
          console.log('[API] Retrying request with new token...');
          return this.request<T>(endpoint, options, cacheConfig);
        } else {
          // Clear tokens and throw error
          console.log('[API] Token refresh failed, clearing session...');
          await AsyncStorage.multiRemove([
            STORAGE_KEYS.AUTH_TOKEN,
            STORAGE_KEYS.REFRESH_TOKEN,
            STORAGE_KEYS.USER_DATA,
          ]);
          throw new Error('Session expired');
        }
      }

      if (!response.ok) {
        if (response.status === 304 && cacheConfig) {
          const cachedData = await CacheManager.get<ApiResponse<T>>(cacheConfig.key);
          if (cachedData) {
            performanceMonitor.endApiCall(endpoint);
            return cachedData;
          }
        }
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP ${response.status}`);
      }

      const data: ApiResponse<T> = await response.json();

      // Cache successful GET responses
      if (method === 'GET' && cacheConfig && data.success) {
        await CacheManager.set(cacheConfig.key, data, cacheConfig.ttl);
      }

      return data;
    } catch (error) {
      clearTimeout(timeoutId);
      performanceMonitor.endApiCall(endpoint);
      
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new Error('Request timeout - please check your connection');
        }
        throw error;
      }
      
      throw new Error('Network request failed');
    }
  }

  // Handle token expiration
  private static async handleTokenExpiration(): Promise<boolean> {
    try {
      const refreshToken = await AsyncStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
      if (!refreshToken) {
        console.log('[API] No refresh token available');
        return false;
      }

      console.log('[API] Attempting to refresh token...');
      const response = await fetch(`${this.baseURL}${API_ENDPOINTS.AUTH.REFRESH_TOKEN}`, {
        method: 'POST',
        headers: this.defaultHeaders,
        body: JSON.stringify({ refreshToken }),
      });

      if (!response.ok) {
        console.log('[API] Token refresh failed:', response.status);
        return false;
      }

      const data = await response.json();
      await AsyncStorage.multiSet([
        [STORAGE_KEYS.AUTH_TOKEN, data.token],
        [STORAGE_KEYS.REFRESH_TOKEN, data.refreshToken],
      ]);
      
      console.log('[API] Token refreshed successfully');
      return true;
    } catch (error) {
      console.error('[API] Token refresh error:', error);
      return false;
    }
  }

  // GET request with caching
  static async get<T>(
    endpoint: string,
    cacheConfig?: CacheConfig
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'GET' }, cacheConfig);
  }

  // POST request
  static async post<T>(
    endpoint: string,
    data?: any
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  // PUT request
  static async put<T>(
    endpoint: string,
    data?: any
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  // DELETE request
  static async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }

  // Paginated GET request
  static async getPaginated<T>(
    endpoint: string,
    page: number = 1,
    limit: number = 20,
    cacheConfig?: CacheConfig
  ): Promise<ApiResponse<PaginatedResponse<T>>> {
    const url = `${endpoint}?page=${page}&limit=${limit}`;
    return this.get<PaginatedResponse<T>>(url, cacheConfig);
  }

  // Upload file (for profile pictures, etc.)
  static async uploadFile<T>(
    endpoint: string,
    file: {
      uri: string;
      type: string;
      name: string;
    }
  ): Promise<ApiResponse<T>> {
    const formData = new FormData();
    formData.append('file', {
      uri: file.uri,
      type: file.type,
      name: file.name,
    } as any);

    const token = await AsyncStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);

    return this.request<T>(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'multipart/form-data',
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: formData,
    });
  }

  // Batch requests
  static async batch<T>(
    requests: Array<{
      endpoint: string;
      method?: string;
      data?: any;
    }>
  ): Promise<ApiResponse<T[]>> {
    return this.post<T[]>('/batch', { requests });
  }

  // Clear all caches
  static async clearCache(): Promise<void> {
    await CacheManager.clear();
  }

  // Get cache status
  static async getCacheStatus(): Promise<{
    size: number;
    keys: string[];
  }> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter(key => key.startsWith('cache_'));
      return {
        size: cacheKeys.length,
        keys: cacheKeys.map(key => key.replace('cache_', '')),
      };
    } catch (error) {
      return { size: 0, keys: [] };
    }
  }

  // Retry failed requests
  static async retryFailedRequests(): Promise<void> {
    await RequestQueue.processQueue();
  }

  // Set network status (for testing)
  static setNetworkStatus(isOnline: boolean): void {
    NetworkStatus.setOnline(isOnline);
  }
}

// Performance-monitored API service
export const apiService = {
  get: withPerformanceMonitoring(ApiService.get.bind(ApiService), 'api_get'),
  post: withPerformanceMonitoring(ApiService.post.bind(ApiService), 'api_post'),
  put: withPerformanceMonitoring(ApiService.put.bind(ApiService), 'api_put'),
  delete: withPerformanceMonitoring(ApiService.delete.bind(ApiService), 'api_delete'),
  getPaginated: withPerformanceMonitoring(ApiService.getPaginated.bind(ApiService), 'api_paginated'),
  uploadFile: withPerformanceMonitoring(ApiService.uploadFile.bind(ApiService), 'api_upload'),
  batch: withPerformanceMonitoring(ApiService.batch.bind(ApiService), 'api_batch'),
  clearCache: ApiService.clearCache.bind(ApiService),
  getCacheStatus: ApiService.getCacheStatus.bind(ApiService),
  retryFailedRequests: ApiService.retryFailedRequests.bind(ApiService),
  setNetworkStatus: ApiService.setNetworkStatus.bind(ApiService),
  initialize: ApiService.initialize.bind(ApiService),
};

export default apiService;
