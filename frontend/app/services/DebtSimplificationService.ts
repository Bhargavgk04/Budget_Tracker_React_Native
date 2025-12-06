import { SimplifiedSettlement } from '@/types';
import { apiService } from './ApiService';

export class DebtSimplificationService {
  /**
   * Get simplified settlements for a friend
   */
  static async getSimplifiedSettlements(friendId: string): Promise<{
    original: SimplifiedSettlement[];
    simplified: SimplifiedSettlement[];
  }> {
    try {
      const response = await apiService.get<{
        original: SimplifiedSettlement[];
        simplified: SimplifiedSettlement[];
      }>(`/friends/${friendId}/simplify`);
      
      if (!response.success || !response.data) {
        throw new Error(response.error || 'Failed to get simplified settlements');
      }

      return response.data;
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to get simplified settlements');
    }
  }

  /**
   * Get simplified settlements for a group
   */
  static async getGroupSimplifiedSettlements(groupId: string): Promise<{
    original: SimplifiedSettlement[];
    simplified: SimplifiedSettlement[];
  }> {
    try {
      const response = await apiService.get<{
        original: SimplifiedSettlement[];
        simplified: SimplifiedSettlement[];
      }>(`/groups/${groupId}/simplify`);
      
      if (!response.success || !response.data) {
        throw new Error(response.error || 'Failed to get group simplified settlements');
      }

      return response.data;
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to get group simplified settlements');
    }
  }

  /**
   * Calculate net balances from transactions
   */
  static calculateNetBalances(transactions: any[]): Map<string, number> {
    const balances = new Map<string, number>();

    transactions.forEach(transaction => {
      if (transaction.splitInfo && transaction.splitInfo.isShared) {
        const paidBy = transaction.splitInfo.paidBy;
        const participants = transaction.splitInfo.participants;

        participants.forEach((participant: any) => {
          if (participant.user !== paidBy) {
            const currentBalance = balances.get(participant.user) || 0;
            balances.set(participant.user, currentBalance - participant.share);

            const payerBalance = balances.get(paidBy) || 0;
            balances.set(paidBy, payerBalance + participant.share);
          }
        });
      }
    });

    return balances;
  }

  /**
   * Simplify debts using greedy algorithm
   */
  static simplifyDebts(balances: Map<string, number>): SimplifiedSettlement[] {
    const creditors: Array<{ userId: string; amount: number }> = [];
    const debtors: Array<{ userId: string; amount: number }> = [];
    const settlements: SimplifiedSettlement[] = [];

    // Separate creditors and debtors
    balances.forEach((balance, userId) => {
      if (balance > 0.01) {
        creditors.push({ userId, amount: balance });
      } else if (balance < -0.01) {
        debtors.push({ userId, amount: Math.abs(balance) });
      }
    });

    // Sort by amount (descending)
    creditors.sort((a, b) => b.amount - a.amount);
    debtors.sort((a, b) => b.amount - a.amount);

    let i = 0, j = 0;

    // Match creditors with debtors
    while (i < creditors.length && j < debtors.length) {
      const creditor = creditors[i];
      const debtor = debtors[j];

      const settleAmount = Math.min(creditor.amount, debtor.amount);

      settlements.push({
        from: { _id: debtor.userId, name: debtor.userId, uid: debtor.userId },
        to: { _id: creditor.userId, name: creditor.userId, uid: creditor.userId },
        amount: settleAmount
      });

      creditor.amount -= settleAmount;
      debtor.amount -= settleAmount;

      if (creditor.amount < 0.01) i++;
      if (debtor.amount < 0.01) j++;
    }

    return settlements;
  }
}

export default DebtSimplificationService;
