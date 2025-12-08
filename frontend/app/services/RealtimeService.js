import { AppState, AppStateStatus } from 'react-native';
import { transactionAPI, analyticsAPI } from './api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '../utils/constants';

class RealtimeService {
  constructor() {
    this.isRunning = false;
    this.intervalId = null;
    this.appState = AppState.currentState;
    this.subscribers = new Set();
    this.lastSyncTime = 0;
    this.syncInterval = 10000; // 10 seconds
    this.backgroundSyncInterval = 30000; // 30 seconds when background
  }

  // Subscribe to real-time updates
  subscribe(callback) {
    this.subscribers.add(callback);
    return () => this.subscribers.delete(callback);
  }

  // Notify all subscribers
  notifySubscribers(data) {
    this.subscribers.forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error('Error notifying subscriber:', error);
      }
    });
  }

  // Start real-time synchronization
  async start() {
    if (this.isRunning) return;
    
    console.log('Starting real-time service...');
    this.isRunning = true;
    
    // Set up app state monitoring
    AppState.addEventListener('change', this.handleAppStateChange.bind(this));
    
    // Start sync loop
    this.startSyncLoop();
    
    // Initial sync
    await this.syncData();
  }

  // Stop real-time synchronization
  stop() {
    if (!this.isRunning) return;
    
    console.log('Stopping real-time service...');
    this.isRunning = false;
    
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  // Handle app state changes
  handleAppStateChange(nextAppState) {
    console.log('App state changed:', nextAppState);
    
    if (this.appState.match(/inactive|background/) && nextAppState === 'active') {
      // App came to foreground, sync immediately and reduce interval
      console.log('App became active, syncing immediately...');
      this.syncData();
      this.startSyncLoop(); // Restart with shorter interval
    }
    
    this.appState = nextAppState;
  }

  // Start sync loop with appropriate interval
  startSyncLoop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }

    const interval = this.appState === 'active' ? this.syncInterval : this.backgroundSyncInterval;
    
    this.intervalId = setInterval(async () => {
      if (this.isRunning) {
        await this.syncData();
      }
    }, interval);
  }

  // Sync data with server
  async syncData(force = false) {
    try {
      const now = Date.now();
      
      // Prevent excessive sync calls (minimum 2 seconds between calls unless forced)
      if (!force && now - this.lastSyncTime < 2000) {
        console.log('Sync throttled, skipping...');
        return;
      }
      
      this.lastSyncTime = now;
      
      // Get user ID from storage
      const userData = await AsyncStorage.getItem(STORAGE_KEYS.USER_DATA);
      if (!userData) return;
      
      const user = JSON.parse(userData);
      const userId = user.id || user._id;
      
      if (!userId) return;

      console.log('Syncing data for user:', userId);
      
      // Sync transactions and analytics in parallel
      const [transactionsResponse, summaryResponse, categoryResponse] = await Promise.allSettled([
        transactionAPI.getAll(userId),
        analyticsAPI.getSummary(userId),
        analyticsAPI.getCategoryBreakdown(userId)
      ]);

      const syncData = {
        timestamp: now,
        transactions: transactionsResponse.status === 'fulfilled' ? transactionsResponse.value.data : [],
        summary: summaryResponse.status === 'fulfilled' ? summaryResponse.value.data : {},
        categoryBreakdown: categoryResponse.status === 'fulfilled' ? categoryResponse.value.data : [],
        errors: [
          transactionsResponse.status === 'rejected' ? transactionsResponse.reason : null,
          summaryResponse.status === 'rejected' ? summaryResponse.reason : null,
          categoryResponse.status === 'rejected' ? categoryResponse.reason : null
        ].filter(Boolean)
      };

      // Notify subscribers with updated data
      this.notifySubscribers(syncData);
      
      console.log('Data synced successfully');
      
    } catch (error) {
      console.error('Error syncing data:', error);
      this.notifySubscribers({
        timestamp: Date.now(),
        error: error.message
      });
    }
  }

  // Force sync immediately (for after mutations)
  async forceSync() {
    return await this.syncData(true);
  }
  
  // Trigger sync after mutation with slight delay to batch multiple operations
  triggerMutationSync() {
    if (!this.isRunning) {
      console.warn('[RealtimeService] Service not running, skipping mutation sync');
      return;
    }
    
    if (this.mutationSyncTimeout) {
      clearTimeout(this.mutationSyncTimeout);
    }
    this.mutationSyncTimeout = setTimeout(() => {
      this.forceSync();
    }, 500); // 500ms delay to batch operations
  }

  // Get sync status
  getStatus() {
    return {
      isRunning: this.isRunning,
      lastSyncTime: this.lastSyncTime,
      subscriberCount: this.subscribers.size,
      appState: this.appState
    };
  }

  // Update sync intervals
  setSyncInterval(interval) {
    this.syncInterval = interval;
    if (this.isRunning) {
      this.startSyncLoop();
    }
  }

  setBackgroundSyncInterval(interval) {
    this.backgroundSyncInterval = interval;
    if (this.isRunning && this.appState !== 'active') {
      this.startSyncLoop();
    }
  }
}

// Create singleton instance
const realtimeService = new RealtimeService();

export default realtimeService;
