/**
 * Split Calculation Utilities
 * Provides precise calculation methods for bill splitting
 */

export interface SplitParticipant {
  id: string;
  name: string;
  share?: number;
  percentage?: number;
}

export interface SplitResult {
  participants: Array<SplitParticipant & { 
    finalShare: number; 
    finalPercentage: number; 
  }>;
  totalAllocated: number;
  remaining: number;
  isValid: boolean;
  errors: string[];
}

export class SplitCalculator {
  /**
   * Calculate equal split with precise cent distribution
   */
  static calculateEqualSplit(amount: number, participantCount: number): number[] {
    if (participantCount <= 0) {
      throw new Error('Participant count must be positive');
    }

    // Convert to cents for precise calculation
    const totalCents = Math.round(amount * 100);
    const baseShareCents = Math.floor(totalCents / participantCount);
    const remainderCents = totalCents - (baseShareCents * participantCount);

    const shares = new Array(participantCount).fill(baseShareCents);
    
    // Distribute remainder cents to first participants
    for (let i = 0; i < remainderCents; i++) {
      shares[i] += 1;
    }

    // Convert back to dollars with proper rounding
    return shares.map(cents => Math.round(cents) / 100);
  }

  /**
   * Calculate percentage-based split
   */
  static calculatePercentageSplit(amount: number, percentages: number[]): SplitResult {
    const participants = percentages.map((percentage, index) => ({
      id: `participant_${index}`,
      name: `Participant ${index + 1}`,
      percentage,
      finalShare: Math.round((amount * percentage / 100) * 100) / 100,
      finalPercentage: percentage
    }));

    const totalAllocated = participants.reduce((sum, p) => sum + p.finalShare, 0);
    const totalPercentage = percentages.reduce((sum, p) => sum + p, 0);
    const remaining = Math.round((amount - totalAllocated) * 100) / 100;

    const errors: string[] = [];
    
    // Validate percentages
    if (Math.abs(totalPercentage - 100) > 0.01) {
      errors.push(`Percentages must sum to 100%, got ${totalPercentage.toFixed(2)}%`);
    }

    // Adjust for rounding errors if percentages are correct
    if (Math.abs(totalPercentage - 100) < 0.01 && Math.abs(remaining) > 0) {
      participants[0].finalShare += remaining;
    }

    return {
      participants,
      totalAllocated: participants.reduce((sum, p) => sum + p.finalShare, 0),
      remaining: amount - participants.reduce((sum, p) => sum + p.finalShare, 0),
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Validate custom split amounts
   */
  static validateCustomSplit(amount: number, customAmounts: number[]): SplitResult {
    const participants = customAmounts.map((share, index) => ({
      id: `participant_${index}`,
      name: `Participant ${index + 1}`,
      share,
      finalShare: share,
      finalPercentage: Math.round((share / amount) * 100 * 100) / 100
    }));

    const totalAllocated = participants.reduce((sum, p) => sum + p.finalShare, 0);
    const remaining = Math.round((amount - totalAllocated) * 100) / 100;

    const errors: string[] = [];

    // Validate individual amounts
    participants.forEach((p, index) => {
      if (p.finalShare < 0) {
        errors.push(`Participant ${index + 1}: Amount cannot be negative`);
      }
      if (p.finalShare > amount) {
        errors.push(`Participant ${index + 1}: Amount cannot exceed total`);
      }
    });

    // Validate total
    if (Math.abs(remaining) > 0.01) {
      errors.push(`Custom amounts must sum to ${amount.toFixed(2)}, got ${totalAllocated.toFixed(2)}`);
    }

    return {
      participants,
      totalAllocated,
      remaining,
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Auto-adjust split to match total amount
   */
  static autoAdjustSplit(
    amount: number, 
    participants: SplitParticipant[], 
    lockedIndices: number[] = []
  ): SplitResult {
    const adjustedParticipants = [...participants];
    const totalCurrent = participants.reduce((sum, p) => sum + (p.share || 0), 0);
    const difference = amount - totalCurrent;

    if (Math.abs(difference) < 0.01) {
      // Already balanced
      return this.validateCustomSplit(amount, participants.map(p => p.share || 0));
    }

    // Find unlocked participants to adjust
    const unlockedIndices = participants
      .map((_, index) => index)
      .filter(index => !lockedIndices.includes(index));

    if (unlockedIndices.length === 0) {
      // All locked, can't adjust
      return this.validateCustomSplit(amount, participants.map(p => p.share || 0));
    }

    // Distribute difference among unlocked participants
    const adjustmentPerParticipant = difference / unlockedIndices.length;
    
    unlockedIndices.forEach(index => {
      const currentShare = adjustedParticipants[index].share || 0;
      const newShare = Math.max(0, currentShare + adjustmentPerParticipant);
      adjustedParticipants[index].share = Math.round(newShare * 100) / 100;
    });

    return this.validateCustomSplit(amount, adjustedParticipants.map(p => p.share || 0));
  }

  /**
   * Calculate split with tips
   */
  static calculateSplitWithTip(
    baseAmount: number,
    tipPercentage: number,
    participants: SplitParticipant[],
    splitType: 'equal' | 'percentage' | 'custom' = 'equal'
  ): SplitResult {
    const tipAmount = Math.round((baseAmount * tipPercentage / 100) * 100) / 100;
    const totalAmount = baseAmount + tipAmount;

    switch (splitType) {
      case 'equal':
        const equalShares = this.calculateEqualSplit(totalAmount, participants.length);
        const equalParticipants = participants.map((p, index) => ({
          ...p,
          finalShare: equalShares[index],
          finalPercentage: Math.round((equalShares[index] / totalAmount) * 100 * 100) / 100
        }));
        
        return {
          participants: equalParticipants,
          totalAllocated: totalAmount,
          remaining: 0,
          isValid: true,
          errors: []
        };

      case 'percentage':
        const percentages = participants.map(p => p.percentage || (100 / participants.length));
        return this.calculatePercentageSplit(totalAmount, percentages);

      case 'custom':
        // Scale custom amounts proportionally
        const baseTotal = participants.reduce((sum, p) => sum + (p.share || 0), 0);
        if (baseTotal === 0) {
          return this.calculateEqualSplit(totalAmount, participants.length).map((share, index) => ({
            ...participants[index],
            finalShare: share,
            finalPercentage: Math.round((share / totalAmount) * 100 * 100) / 100
          })) as any;
        }

        const scaledParticipants = participants.map(p => ({
          ...p,
          finalShare: Math.round(((p.share || 0) / baseTotal * totalAmount) * 100) / 100,
          finalPercentage: Math.round(((p.share || 0) / baseTotal * 100) * 100) / 100
        }));

        return {
          participants: scaledParticipants,
          totalAllocated: totalAmount,
          remaining: 0,
          isValid: true,
          errors: []
        };

      default:
        throw new Error('Invalid split type');
    }
  }

  /**
   * Calculate optimal settlement between multiple people
   */
  static calculateOptimalSettlement(balances: Record<string, number>): Array<{
    from: string;
    to: string;
    amount: number;
  }> {
    const settlements: Array<{ from: string; to: string; amount: number }> = [];
    
    // Separate debtors and creditors
    const debtors = Object.entries(balances)
      .filter(([_, balance]) => balance < 0)
      .map(([person, balance]) => ({ person, amount: Math.abs(balance) }))
      .sort((a, b) => b.amount - a.amount);

    const creditors = Object.entries(balances)
      .filter(([_, balance]) => balance > 0)
      .map(([person, balance]) => ({ person, amount: balance }))
      .sort((a, b) => b.amount - a.amount);

    // Match debtors with creditors
    let debtorIndex = 0;
    let creditorIndex = 0;

    while (debtorIndex < debtors.length && creditorIndex < creditors.length) {
      const debtor = debtors[debtorIndex];
      const creditor = creditors[creditorIndex];

      const settlementAmount = Math.min(debtor.amount, creditor.amount);
      
      if (settlementAmount > 0.01) {
        settlements.push({
          from: debtor.person,
          to: creditor.person,
          amount: Math.round(settlementAmount * 100) / 100
        });
      }

      debtor.amount -= settlementAmount;
      creditor.amount -= settlementAmount;

      if (debtor.amount < 0.01) debtorIndex++;
      if (creditor.amount < 0.01) creditorIndex++;
    }

    return settlements;
  }

  /**
   * Format split summary for display
   */
  static formatSplitSummary(result: SplitResult): string {
    if (!result.isValid) {
      return `Invalid split: ${result.errors.join(', ')}`;
    }

    const participantSummaries = result.participants.map(p => 
      `${p.name}: ${p.finalShare.toFixed(2)} (${p.finalPercentage.toFixed(1)}%)`
    );

    return `Split: ${participantSummaries.join(', ')}. Total: ${result.totalAllocated.toFixed(2)}`;
  }

  /**
   * Convert split result to API format
   */
  static toAPIFormat(result: SplitResult, splitType: string, paidBy: string) {
    return {
      splitType,
      paidBy,
      participants: result.participants.map(p => ({
        user: p.id,
        share: p.finalShare,
        percentage: p.finalPercentage,
      }))
    };
  }
}

export default SplitCalculator;