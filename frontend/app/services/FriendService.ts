import { Friend, FriendDetails, PendingRequests, FriendBalance, ApiResponse } from '@/types';
import { apiService } from './ApiService';

export class FriendService {
  private static cacheConfig = {
    list: { key: 'friends_list', ttl: 300000 }, // 5 minutes
    details: { key: 'friend_details', ttl: 600000 }, // 10 minutes
  };

  /**
   * Search users by UID, email, or name
   */
  static async searchUsers(query: string): Promise<Friend[]> {
    try {
      const response = await apiService.post<Friend[]>('/friends/search', { query });
      
      if (!response.success || !response.data) {
        throw new Error(response.error || 'Failed to search users');
      }

      return response.data;
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to search users');
    }
  }

  /**
   * Send friend request
   */
  static async sendFriendRequest(recipientId: string): Promise<any> {
    try {
      const response = await apiService.post('/friends/request', { recipientId });
      
      if (!response.success) {
        throw new Error(response.error || 'Failed to send friend request');
      }

      // Clear cache
      await this.clearCache();

      return response.data;
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to send friend request');
    }
  }

  /**
   * Accept friend request
   */
  static async acceptFriendRequest(friendshipId: string): Promise<any> {
    try {
      const response = await apiService.post(`/friends/${friendshipId}/accept`, {});
      
      if (!response.success) {
        throw new Error(response.error || 'Failed to accept friend request');
      }

      await this.clearCache();
      return response.data;
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to accept friend request');
    }
  }

  /**
   * Decline friend request
   */
  static async declineFriendRequest(friendshipId: string): Promise<any> {
    try {
      const response = await apiService.post(`/friends/${friendshipId}/decline`, {});
      
      if (!response.success) {
        throw new Error(response.error || 'Failed to decline friend request');
      }

      await this.clearCache();
      return response.data;
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to decline friend request');
    }
  }

  /**
   * Get friend list
   */
  static async getFriendList(filters?: { status?: string; balanceStatus?: string }): Promise<Friend[]> {
    try {
      const params = new URLSearchParams();
      if (filters?.status) params.append('status', filters.status);
      if (filters?.balanceStatus) params.append('balanceStatus', filters.balanceStatus);

      const endpoint = `/friends${params.toString() ? '?' + params.toString() : ''}`;
      const cacheKey = `${this.cacheConfig.list.key}_${params.toString()}`;

      const response = await apiService.get<Friend[]>(endpoint, { ...this.cacheConfig.list, key: cacheKey });
      
      if (!response.success || !response.data) {
        throw new Error(response.error || 'Failed to get friend list');
      }

      return response.data;
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to get friend list');
    }
  }

  /**
   * Get friend details
   */
  static async getFriendDetails(friendId: string): Promise<FriendDetails> {
    try {
      const cacheKey = `${this.cacheConfig.details.key}_${friendId}`;
      const response = await apiService.get<FriendDetails>(
        `/friends/${friendId}`,
        { ...this.cacheConfig.details, key: cacheKey }
      );
      
      if (!response.success || !response.data) {
        throw new Error(response.error || 'Failed to get friend details');
      }

      return response.data;
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to get friend details');
    }
  }

  /**
   * Get balance with friend
   */
  static async getFriendBalance(friendId: string): Promise<FriendBalance> {
    try {
      const response = await apiService.get<{ balance: number; direction: string }>(
        `/friends/${friendId}/balance`
      );
      
      if (!response.success || !response.data) {
        throw new Error(response.error || 'Failed to get balance');
      }

      return {
        amount: response.data.balance,
        direction: response.data.direction as 'you_owe' | 'owes_you' | 'settled'
      };
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to get balance');
    }
  }

  /**
   * Remove friend
   */
  static async removeFriend(friendId: string): Promise<void> {
    try {
      const response = await apiService.delete(`/friends/${friendId}`);
      
      if (!response.success) {
        throw new Error(response.error || 'Failed to remove friend');
      }

      await this.clearCache();
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to remove friend');
    }
  }

  /**
   * Get pending requests
   */
  static async getPendingRequests(): Promise<PendingRequests> {
    try {
      const response = await apiService.get<PendingRequests>('/friends/requests/pending');
      
      if (!response.success || !response.data) {
        throw new Error(response.error || 'Failed to get pending requests');
      }

      return response.data;
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to get pending requests');
    }
  }

  /**
   * Get simplified settlements with friend
   */
  static async getSimplifiedSettlements(friendId: string): Promise<any> {
    try {
      const response = await apiService.get(`/friends/${friendId}/simplify`);
      
      if (!response.success || !response.data) {
        throw new Error(response.error || 'Failed to get simplified settlements');
      }

      return response.data;
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to get simplified settlements');
    }
  }

  /**
   * Clear cache
   */
  private static async clearCache(): Promise<void> {
    try {
      await apiService.clearCache();
    } catch (error) {
      console.warn('Failed to clear friend cache:', error);
    }
  }
}

export default FriendService;
