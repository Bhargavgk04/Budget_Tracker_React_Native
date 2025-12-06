import { Settlement, SettlementFormData } from '@/types';
import { apiService } from './ApiService';

export class SettlementService {
  /**
   * Create settlement
   */
  static async createSettlement(data: SettlementFormData): Promise<Settlement> {
    try {
      const response = await apiService.post<Settlement>('/settlements', data);
      
      if (!response.success || !response.data) {
        throw new Error(response.error || 'Failed to create settlement');
      }

      return response.data;
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to create settlement');
    }
  }

  /**
   * Confirm settlement
   */
  static async confirmSettlement(settlementId: string): Promise<Settlement> {
    try {
      const response = await apiService.post<Settlement>(
        `/settlements/${settlementId}/confirm`,
        {}
      );
      
      if (!response.success || !response.data) {
        throw new Error(response.error || 'Failed to confirm settlement');
      }

      return response.data;
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to confirm settlement');
    }
  }

  /**
   * Dispute settlement
   */
  static async disputeSettlement(settlementId: string, reason: string): Promise<Settlement> {
    try {
      const response = await apiService.post<Settlement>(
        `/settlements/${settlementId}/dispute`,
        { reason }
      );
      
      if (!response.success || !response.data) {
        throw new Error(response.error || 'Failed to dispute settlement');
      }

      return response.data;
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to dispute settlement');
    }
  }

  /**
   * Get settlements
   */
  static async getSettlements(filters?: any): Promise<Settlement[]> {
    try {
      const params = new URLSearchParams();
      if (filters?.status) params.append('status', filters.status);
      if (filters?.startDate) params.append('startDate', filters.startDate.toISOString());
      if (filters?.endDate) params.append('endDate', filters.endDate.toISOString());
      if (filters?.groupId) params.append('groupId', filters.groupId);
      if (filters?.friendId) params.append('friendId', filters.friendId);

      const endpoint = `/settlements${params.toString() ? '?' + params.toString() : ''}`;
      const response = await apiService.get<Settlement[]>(endpoint);
      
      if (!response.success || !response.data) {
        throw new Error(response.error || 'Failed to get settlements');
      }

      return response.data;
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to get settlements');
    }
  }

  /**
   * Get pending settlements
   */
  static async getPendingSettlements(): Promise<Settlement[]> {
    try {
      const response = await apiService.get<Settlement[]>('/settlements/pending');
      
      if (!response.success || !response.data) {
        throw new Error(response.error || 'Failed to get pending settlements');
      }

      return response.data;
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to get pending settlements');
    }
  }

  /**
   * Get settlement details
   */
  static async getSettlementDetails(settlementId: string): Promise<Settlement> {
    try {
      const response = await apiService.get<Settlement>(`/settlements/${settlementId}`);
      
      if (!response.success || !response.data) {
        throw new Error(response.error || 'Failed to get settlement details');
      }

      return response.data;
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to get settlement details');
    }
  }

  /**
   * Delete settlement
   */
  static async deleteSettlement(settlementId: string): Promise<void> {
    try {
      const response = await apiService.delete(`/settlements/${settlementId}`);
      
      if (!response.success) {
        throw new Error(response.error || 'Failed to delete settlement');
      }
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to delete settlement');
    }
  }
}

export default SettlementService;
