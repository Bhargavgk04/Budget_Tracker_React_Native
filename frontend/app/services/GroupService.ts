import { Group, GroupDetails, GroupFormData, SharedTransaction } from '@/types';
import { apiService } from './ApiService';

export class GroupService {
  private static cacheConfig = {
    list: { key: 'groups_list', ttl: 300000 }, // 5 minutes
    details: { key: 'group_details', ttl: 600000 }, // 10 minutes
  };

  /**
   * Create group
   */
  static async createGroup(data: GroupFormData): Promise<Group> {
    try {
      const response = await apiService.post<Group>('/groups', data);
      
      if (!response.success || !response.data) {
        throw new Error(response.error || 'Failed to create group');
      }

      await this.clearCache();
      return response.data;
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to create group');
    }
  }

  /**
   * Get user's groups
   */
  static async getUserGroups(filters?: any): Promise<Group[]> {
    try {
      const params = new URLSearchParams();
      if (filters?.isActive !== undefined) params.append('isActive', filters.isActive.toString());
      if (filters?.isSettled !== undefined) params.append('isSettled', filters.isSettled.toString());
      if (filters?.type) params.append('type', filters.type);

      const endpoint = `/groups${params.toString() ? '?' + params.toString() : ''}`;
      const cacheKey = `${this.cacheConfig.list.key}_${params.toString()}`;

      const response = await apiService.get<Group[]>(endpoint, { ...this.cacheConfig.list, key: cacheKey });
      
      if (!response.success || !response.data) {
        throw new Error(response.error || 'Failed to get groups');
      }

      return response.data;
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to get groups');
    }
  }

  /**
   * Get group details
   */
  static async getGroupDetails(groupId: string): Promise<GroupDetails> {
    try {
      const cacheKey = `${this.cacheConfig.details.key}_${groupId}`;
      const response = await apiService.get<GroupDetails>(
        `/groups/${groupId}`,
        { ...this.cacheConfig.details, key: cacheKey }
      );
      
      if (!response.success || !response.data) {
        throw new Error(response.error || 'Failed to get group details');
      }

      return response.data;
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to get group details');
    }
  }

  /**
   * Update group
   */
  static async updateGroup(groupId: string, updates: Partial<GroupFormData>): Promise<Group> {
    try {
      const response = await apiService.put<Group>(`/groups/${groupId}`, updates);
      
      if (!response.success || !response.data) {
        throw new Error(response.error || 'Failed to update group');
      }

      await this.clearCache();
      return response.data;
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to update group');
    }
  }

  /**
   * Delete group
   */
  static async deleteGroup(groupId: string): Promise<void> {
    try {
      const response = await apiService.delete(`/groups/${groupId}`);
      
      if (!response.success) {
        throw new Error(response.error || 'Failed to delete group');
      }

      await this.clearCache();
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to delete group');
    }
  }

  /**
   * Add member to group
   */
  static async addMember(groupId: string, userId: string): Promise<Group> {
    try {
      const response = await apiService.post<Group>(
        `/groups/${groupId}/members`,
        { userId }
      );
      
      if (!response.success || !response.data) {
        throw new Error(response.error || 'Failed to add member');
      }

      await this.clearCache();
      return response.data;
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to add member');
    }
  }

  /**
   * Remove member from group
   */
  static async removeMember(groupId: string, userId: string): Promise<void> {
    try {
      const response = await apiService.delete(`/groups/${groupId}/members/${userId}`);
      
      if (!response.success) {
        throw new Error(response.error || 'Failed to remove member');
      }

      await this.clearCache();
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to remove member');
    }
  }

  /**
   * Get group expenses
   */
  static async getGroupExpenses(groupId: string, filters?: any): Promise<SharedTransaction[]> {
    try {
      const params = new URLSearchParams();
      if (filters?.startDate) params.append('startDate', filters.startDate.toISOString());
      if (filters?.endDate) params.append('endDate', filters.endDate.toISOString());
      if (filters?.category) params.append('category', filters.category);

      const endpoint = `/groups/${groupId}/expenses${params.toString() ? '?' + params.toString() : ''}`;
      const response = await apiService.get<SharedTransaction[]>(endpoint);
      
      if (!response.success || !response.data) {
        throw new Error(response.error || 'Failed to get group expenses');
      }

      return response.data;
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to get group expenses');
    }
  }

  /**
   * Get group balances
   */
  static async getGroupBalances(groupId: string): Promise<any> {
    try {
      const response = await apiService.get(`/groups/${groupId}/balances`);
      
      if (!response.success || !response.data) {
        throw new Error(response.error || 'Failed to get group balances');
      }

      return response.data;
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to get group balances');
    }
  }

  /**
   * Mark group as settled
   */
  static async markGroupSettled(groupId: string): Promise<Group> {
    try {
      const response = await apiService.post<Group>(`/groups/${groupId}/settle`, {});
      
      if (!response.success || !response.data) {
        throw new Error(response.error || 'Failed to mark group as settled');
      }

      await this.clearCache();
      return response.data;
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to mark group as settled');
    }
  }

  /**
   * Update group balances
   */
  static async updateGroupBalances(groupId: string): Promise<Group> {
    try {
      const response = await apiService.post<Group>(`/groups/${groupId}/balances/update`, {});
      
      if (!response.success || !response.data) {
        throw new Error(response.error || 'Failed to update group balances');
      }

      await this.clearCache();
      return response.data;
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to update group balances');
    }
  }

  /**
   * Get simplified settlements for group
   */
  static async getSimplifiedSettlements(groupId: string): Promise<any> {
    try {
      const response = await apiService.get(`/groups/${groupId}/simplify`);
      
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
      console.warn('Failed to clear group cache:', error);
    }
  }
}

export default GroupService;
