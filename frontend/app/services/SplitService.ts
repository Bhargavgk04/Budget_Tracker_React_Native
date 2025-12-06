import { SplitConfig, SplitFormData, SharedTransaction } from '@/types';
import { apiService } from './ApiService';

export class SplitService {
  /**
   * Get participant name for error messages
   */
  private static getParticipantName(participant: any, index: number): string {
    return participant.name || `Participant ${index + 1}`;
  }

  /**
   * Validate split configuration
   */
  static validateSplit(amount: number, splitType: string, participants: any[]): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!amount || amount <= 0) {
      errors.push('Amount must be positive');
    }

    if (!['equal', 'percentage', 'custom'].includes(splitType)) {
      errors.push('Invalid split type');
    }

    if (!participants || participants.length === 0) {
      errors.push('At least one participant is required');
    }

    if (participants) {
      // Validate each participant's share
      participants.forEach((participant, index) => {
        const share = participant.share || 0;
        const participantName = this.getParticipantName(participant, index);
        
        if (share < 0) {
          errors.push(`${participantName}: Share cannot be negative`);
        }
        
        if (share > amount) {
          errors.push(`${participantName}: Share (₹${share.toFixed(2)}) cannot exceed total amount (₹${amount.toFixed(2)})`);
        }
        
        // For percentage splits, validate percentage bounds
        if (splitType === 'percentage' && participant.percentage !== undefined) {
          if (participant.percentage < 0) {
            errors.push(`${participantName}: Percentage cannot be negative`);
          }
          if (participant.percentage > 100) {
            errors.push(`${participantName}: Percentage cannot exceed 100%`);
          }
        }
      });

      // Validate split amounts sum to total
      const totalShares = participants.reduce((sum, p) => sum + (p.share || 0), 0);
      if (Math.abs(totalShares - amount) > 0.01) {
        errors.push(`Split amounts must sum to ₹${amount.toFixed(2)}`);
      }

      // Validate percentages sum to 100
      if (splitType === 'percentage') {
        const totalPercentage = participants.reduce((sum, p) => sum + (p.percentage || 0), 0);
        if (Math.abs(totalPercentage - 100) > 0.01) {
          errors.push('Percentages must sum to 100%');
        }
      }
    }

    return { isValid: errors.length === 0, errors };
  }

  /**
   * Calculate equal split
   */
  static calculateEqualSplit(amount: number, participantCount: number): number[] {
    const baseShare = Math.floor((amount * 100) / participantCount) / 100;
    const remainder = Math.round((amount - (baseShare * participantCount)) * 100) / 100;
    
    const shares = new Array(participantCount).fill(baseShare);
    if (remainder > 0) {
      shares[0] += remainder;
    }
    
    return shares;
  }

  /**
   * Calculate percentage split
   */
  static calculatePercentageSplit(amount: number, percentages: number[]): number[] {
    const shares = percentages.map(p => Math.round((amount * p) / 100 * 100) / 100);
    const totalShares = shares.reduce((sum, s) => sum + s, 0);
    const difference = Math.round((amount - totalShares) * 100) / 100;
    
    if (Math.abs(difference) > 0) {
      shares[0] += difference;
    }
    
    return shares;
  }

  /**
   * Calculate split preview
   */
  static calculateSplitPreview(amount: number, splitData: SplitFormData): any[] {
    const { splitType, participants } = splitData;
    
    if (splitType === 'equal') {
      const shares = this.calculateEqualSplit(amount, participants.length);
      return participants.map((p, i) => ({ ...p, share: shares[i] }));
    } else if (splitType === 'percentage') {
      const percentages = participants.map(p => p.percentage || 0);
      const shares = this.calculatePercentageSplit(amount, percentages);
      return participants.map((p, i) => ({ ...p, share: shares[i] }));
    } else {
      return participants;
    }
  }

  /**
   * Create split
   */
  static async createSplit(transactionId: string, splitConfig: SplitFormData): Promise<SharedTransaction> {
    try {
      const payload = {
        splitType: splitConfig.splitType,
        paidBy: splitConfig.paidBy,
        participants: (splitConfig.participants || []).map(p => ({
          user: (p as any)._id || (p as any).userId || (p as any).user || undefined,
          share: p.share || 0,
          percentage: p.percentage,
        }))
      };

      const response = await apiService.post<SharedTransaction>(
        `/transactions/${transactionId}/split`,
        payload
      );
      
      if (!response.success || !response.data) {
        throw new Error(response.error || 'Failed to create split');
      }

      return response.data;
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to create split');
    }
  }

  /**
   * Update split
   */
  static async updateSplit(transactionId: string, splitConfig: Partial<SplitFormData>): Promise<SharedTransaction> {
    try {
      const payload = {
        splitType: splitConfig.splitType,
        participants: (splitConfig.participants || []).map(p => ({
          user: (p as any)._id || (p as any).userId || (p as any).user || undefined,
          share: p.share || 0,
          percentage: p.percentage,
        }))
      };

      const response = await apiService.put<SharedTransaction>(
        `/transactions/${transactionId}/split`,
        payload
      );
      
      if (!response.success || !response.data) {
        throw new Error(response.error || 'Failed to update split');
      }

      return response.data;
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to update split');
    }
  }

  /**
   * Remove split
   */
  static async removeSplit(transactionId: string): Promise<void> {
    try {
      const response = await apiService.delete(`/transactions/${transactionId}/split`);
      
      if (!response.success) {
        throw new Error(response.error || 'Failed to remove split');
      }
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to remove split');
    }
  }

  /**
   * Mark participant as settled
   */
  static async markParticipantSettled(transactionId: string, userId: string): Promise<SharedTransaction> {
    try {
      const response = await apiService.post<SharedTransaction>(
        `/transactions/${transactionId}/split/settle/${userId}`,
        {}
      );
      
      if (!response.success || !response.data) {
        throw new Error(response.error || 'Failed to mark participant as settled');
      }

      return response.data;
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to mark participant as settled');
    }
  }

  /**
   * Get shared transactions
   */
  static async getSharedTransactions(filters?: any): Promise<SharedTransaction[]> {
    try {
      const params = new URLSearchParams();
      if (filters?.startDate) params.append('startDate', filters.startDate.toISOString());
      if (filters?.endDate) params.append('endDate', filters.endDate.toISOString());
      if (filters?.groupId) params.append('groupId', filters.groupId);
      if (filters?.category) params.append('category', filters.category);

      const endpoint = `/transactions/shared${params.toString() ? '?' + params.toString() : ''}`;
      const response = await apiService.get<SharedTransaction[]>(endpoint);
      
      if (!response.success || !response.data) {
        throw new Error(response.error || 'Failed to get shared transactions');
      }

      return response.data;
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to get shared transactions');
    }
  }
}

export default SplitService;
