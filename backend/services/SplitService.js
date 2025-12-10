const Transaction = require('../models/Transaction');
const Friendship = require('../models/Friendship');
const FriendService = require('./FriendService');

class SplitService {
  /**
   * Validate split configuration
   * @param {number} amount - Total transaction amount
   * @param {string} splitType - Type of split (equal, percentage, custom)
   * @param {Array} participants - Array of participant objects
   * @returns {Object} - Validation result
   */
  static validateSplit(amount, splitType, participants) {
    const errors = [];

    // Validate amount
    if (!amount || amount <= 0) {
      errors.push('Transaction amount must be positive');
    }

    // Validate split type
    if (!['equal', 'percentage', 'custom'].includes(splitType)) {
      errors.push('Split type must be equal, percentage, or custom');
    }

    // Validate participants
    if (!participants || participants.length === 0) {
      errors.push('At least one participant is required');
    }

    if (participants) {
      // Check for duplicate participants
      const userIds = participants
        .filter(p => p.user)
        .map(p => p.user.toString());
      const uniqueUserIds = new Set(userIds);
      if (userIds.length !== uniqueUserIds.size) {
        errors.push('Duplicate participants are not allowed');
      }

      // Validate each participant
      participants.forEach((p, index) => {
        // Accept either user (ObjectId) or nonAppUser (object with name/uid)
        if (!p.user && !(p.nonAppUser && p.nonAppUser.name)) {
          errors.push(`Participant ${index + 1}: must have either a user or nonAppUser.name`);
        }
        
        // Validate share amount
        const share = p.share || 0;
        if (share < 0) {
          errors.push(`Participant ${index + 1}: share cannot be negative`);
        }
        
        if (share > amount) {
          errors.push(`Participant ${index + 1}: share (${share.toFixed(2)}) cannot exceed transaction amount (${amount.toFixed(2)})`);
        }

        // For percentage splits, validate percentage
        if (splitType === 'percentage') {
          const percentage = p.percentage || 0;
          if (percentage < 0) {
            errors.push(`Participant ${index + 1}: percentage cannot be negative`);
          }
          if (percentage > 100) {
            errors.push(`Participant ${index + 1}: percentage cannot exceed 100%`);
          }
        }
      });

      // Validate percentage splits sum to 100
      if (splitType === 'percentage') {
        const totalPercentage = participants.reduce((sum, p) => sum + (p.percentage || 0), 0);
        if (Math.abs(totalPercentage - 100) > 0.01) {
          errors.push(`Percentages must sum to 100%, got ${totalPercentage.toFixed(2)}%`);
        }
      }

      // Validate split amounts sum to total (with small tolerance for rounding)
      const totalShares = participants.reduce((sum, p) => sum + (p.share || 0), 0);
      const difference = Math.abs(totalShares - amount);
      
      if (difference > 0.01) {
        errors.push(`Split amounts (₹${totalShares.toFixed(2)}) must sum to transaction amount (₹${amount.toFixed(2)})`);
      }

      // Validate that at least one participant has a non-zero share
      const hasNonZeroShare = participants.some(p => (p.share || 0) > 0);
      if (!hasNonZeroShare) {
        errors.push('At least one participant must have a non-zero share');
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Calculate equal split
   * @param {number} amount - Total amount to split
   * @param {number} participantCount - Number of participants
   * @returns {Array} - Array of equal shares
   */
  static calculateEqualSplit(amount, participantCount) {
    if (participantCount <= 0) {
      throw new Error('Participant count must be positive');
    }

    // Convert to cents to avoid floating point precision issues
    const totalCents = Math.round(amount * 100);
    const baseShareCents = Math.floor(totalCents / participantCount);
    const remainderCents = totalCents - (baseShareCents * participantCount);

    const shares = new Array(participantCount).fill(baseShareCents);
    
    // Distribute remainder cents to first participants
    for (let i = 0; i < remainderCents; i++) {
      shares[i] += 1;
    }

    // Convert back to dollars
    return shares.map(cents => Math.round(cents) / 100);
  }

  /**
   * Calculate percentage split
   * @param {number} amount - Total amount to split
   * @param {Array} percentages - Array of percentage values
   * @returns {Array} - Array of calculated shares
   */
  static calculatePercentageSplit(amount, percentages) {
    // Validate percentages sum to 100
    const totalPercentage = percentages.reduce((sum, p) => sum + p, 0);
    if (Math.abs(totalPercentage - 100) > 0.01) {
      throw new Error(`Percentages must sum to 100, got ${totalPercentage}`);
    }

    // Calculate shares
    const shares = percentages.map(percentage => 
      Math.round((amount * percentage) / 100 * 100) / 100
    );

    // Adjust for rounding errors
    const totalShares = shares.reduce((sum, s) => sum + s, 0);
    const difference = Math.round((amount - totalShares) * 100) / 100;
    
    if (Math.abs(difference) > 0) {
      shares[0] += difference;
    }

    return shares;
  }

  /**
   * Validate custom split
   * @param {number} amount - Total amount
   * @param {Array} customAmounts - Array of custom amounts
   * @returns {boolean} - Whether split is valid
   */
  static validateCustomSplit(amount, customAmounts) {
    const totalCustom = customAmounts.reduce((sum, a) => sum + a, 0);
    const difference = Math.abs(totalCustom - amount);
    
    if (difference > 0.01) {
      throw new Error(`Custom amounts (${totalCustom.toFixed(2)}) must sum to transaction amount (${amount.toFixed(2)})`);
    }

    // Validate all amounts are non-negative
    if (customAmounts.some(a => a < 0)) {
      throw new Error('All custom amounts must be non-negative');
    }

    return true;
  }

  /**
   * Create split for transaction
   * @param {string} transactionId - Transaction ID
   * @param {Object} splitConfig - Split configuration
   * @returns {Promise<Object>} - Updated transaction
   */
  static async createSplit(transactionId, splitConfig) {
    console.log('[SplitService] Creating split for transaction:', transactionId);
    console.log('[SplitService] Split config:', JSON.stringify(splitConfig, null, 2));
    
    const transaction = await Transaction.findById(transactionId);
    
    if (!transaction) {
      console.error('[SplitService] Transaction not found:', transactionId);
      throw new Error('Transaction not found');
    }

    console.log('[SplitService] Found transaction:', transaction._id);

    // Validate split configuration
    console.log('[SplitService] Validating split with amount:', transaction.amount);
    const validation = this.validateSplit(
      transaction.amount,
      splitConfig.splitType,
      splitConfig.participants
    );

    if (!validation.isValid) {
      console.error('[SplitService] Split validation failed:', validation.errors);
      throw new Error(`Split validation failed: ${validation.errors.join(', ')}`);
    }

    console.log('[SplitService] Split validation passed');

    // Ensure paidBy is set
    if (!splitConfig.paidBy) {
      console.error('[SplitService] paidBy is missing');
      throw new Error('paidBy is required for split transactions');
    }

    console.log('[SplitService] paidBy validation passed:', splitConfig.paidBy);

    // Verify all participants are friends with the payer (if not group)
    if (!splitConfig.groupId) {
      for (const participant of splitConfig.participants) {
        // Only check friendship for registered users
        if (participant.user && participant.user.toString() !== splitConfig.paidBy.toString()) {
          try {
            const areFriends = await Friendship.areFriends(splitConfig.paidBy, participant.user);
            if (!areFriends) {
              throw new Error('All registered participants must be friends with the payer');
            }
          } catch (error) {
            // Log error but don't throw for friendship check
            console.error('Friendship check error:', error.message);
          }
        }
      }
    }

    // Update transaction with split info
    transaction.splitInfo = {
      isShared: true,
      paidBy: splitConfig.paidBy,
      splitType: splitConfig.splitType,
      participants: splitConfig.participants.map(p => ({
        user: p.user,
        nonAppUser: p.nonAppUser, // support non-app user
        share: p.share,
        percentage: p.percentage,
        settled: p.user && p.user.toString() === splitConfig.paidBy.toString(), // Only auto-settle for registered payer
        settledAt: p.user && p.user.toString() === splitConfig.paidBy.toString() ? new Date() : undefined
      })),
      groupId: splitConfig.groupId
    };

    await transaction.save();

    // Notify registered users only
    const paidBy = splitConfig.paidBy.toString();
    const registeredParticipantIds = splitConfig.participants
      .filter(p => p.user && p.user.toString() !== paidBy)
      .map(p => p.user.toString());
    if (registeredParticipantIds.length > 0) {
      try {
        const NotificationService = require('./NotificationService');
        await NotificationService.createSharedExpenseNotification(
          transaction._id,
          paidBy,
          registeredParticipantIds
        );
      } catch (error) {
        console.error('Failed to create notification:', error.message);
      }
    }

    // Update cached balances for all participant pairs
    for (const participant of splitConfig.participants) {
      const participantId = participant.user?.toString();
      if (participantId && participantId !== paidBy) {
        try {
          await FriendService.updateCachedBalance(paidBy, participantId);
        } catch (error) {
          console.error(`Failed to update cached balance: ${error.message}`);
        }
      }
    }

    return transaction.populate([
      { path: 'userId', select: 'uid name email profilePicture' },
      { path: 'friendId', select: 'uid name email profilePicture' },
      { path: 'splitInfo.paidBy', select: 'uid name email profilePicture' },
      { path: 'splitInfo.participants.user', select: 'uid name email profilePicture' },
      { path: 'splitInfo.groupId', select: 'name type' }
    ]);
  }

  /**
   * Update split
   * @param {string} transactionId - Transaction ID
   * @param {Object} splitConfig - Updated split configuration
   * @returns {Promise<Object>} - Updated transaction
   */
  static async updateSplit(transactionId, splitConfig) {
    const transaction = await Transaction.findById(transactionId);
    
    if (!transaction) {
      throw new Error('Transaction not found');
    }

    if (!transaction.splitInfo || !transaction.splitInfo.isShared) {
      throw new Error('Transaction is not a split transaction');
    }

    // Validate split configuration
    const validation = this.validateSplit(
      transaction.amount,
      splitConfig.splitType,
      splitConfig.participants
    );

    if (!validation.isValid) {
      throw new Error(`Split validation failed: ${validation.errors.join(', ')}`);
    }

    // Store old participants for balance update
    const oldParticipants = transaction.splitInfo.participants.map(p => p.user.toString());

    // Update split info
    transaction.splitInfo.splitType = splitConfig.splitType;
    transaction.splitInfo.participants = splitConfig.participants.map(p => ({
      user: p.user,
      share: p.share,
      percentage: p.percentage,
      settled: p.user.toString() === transaction.splitInfo.paidBy.toString(),
      settledAt: p.user.toString() === transaction.splitInfo.paidBy.toString() ? new Date() : undefined
    }));

    await transaction.save();

    // Update cached balances for affected users
    const paidBy = transaction.splitInfo.paidBy.toString();
    const newParticipants = splitConfig.participants.map(p => p.user.toString());
    const affectedUsers = new Set([...oldParticipants, ...newParticipants]);

    for (const userId of affectedUsers) {
      if (userId !== paidBy) {
        try {
          await FriendService.updateCachedBalance(paidBy, userId);
        } catch (error) {
          console.error(`Failed to update cached balance: ${error.message}`);
        }
      }
    }

    return transaction.populate([
      { path: 'userId', select: 'uid name email profilePicture' },
      { path: 'friendId', select: 'uid name email profilePicture' },
      { path: 'splitInfo.paidBy', select: 'uid name email profilePicture' },
      { path: 'splitInfo.participants.user', select: 'uid name email profilePicture' },
      { path: 'splitInfo.groupId', select: 'name type' }
    ]);
  }

  /**
   * Mark participant as settled
   * @param {string} transactionId - Transaction ID
   * @param {string} userId - User ID to mark as settled
   * @returns {Promise<Object>} - Updated transaction
   */
  static async markParticipantSettled(transactionId, userId) {
    const transaction = await Transaction.findById(transactionId);
    
    if (!transaction) {
      throw new Error('Transaction not found');
    }

    await transaction.markParticipantSettled(userId);

    // Update cached balance
    const paidBy = transaction.splitInfo.paidBy.toString();
    if (userId.toString() !== paidBy) {
      try {
        await FriendService.updateCachedBalance(paidBy, userId);
      } catch (error) {
        console.error(`Failed to update cached balance: ${error.message}`);
      }
    }

    return transaction.populate([
      { path: 'userId', select: 'uid name email profilePicture' },
      { path: 'splitInfo.paidBy', select: 'uid name email profilePicture' },
      { path: 'splitInfo.participants.user', select: 'uid name email profilePicture' }
    ]);
  }

  /**
   * Get user's share in transaction
   * @param {Object} transaction - Transaction object
   * @param {string} userId - User ID
   * @returns {Object|null} - User's share or null
   */
  static getUserShare(transaction, userId) {
    return transaction.getUserShare(userId);
  }

  /**
   * Remove split from transaction
   * @param {string} transactionId - Transaction ID
   * @returns {Promise<Object>} - Updated transaction
   */
  static async removeSplit(transactionId) {
    const transaction = await Transaction.findById(transactionId);
    
    if (!transaction) {
      throw new Error('Transaction not found');
    }

    if (!transaction.splitInfo || !transaction.splitInfo.isShared) {
      throw new Error('Transaction is not a split transaction');
    }

    // Store participants for balance update
    const paidBy = transaction.splitInfo.paidBy.toString();
    const participants = transaction.splitInfo.participants.map(p => p.user.toString());

    // Remove split info
    transaction.splitInfo = {
      isShared: false,
      paidBy: undefined,
      splitType: undefined,
      participants: [],
      groupId: undefined
    };

    await transaction.save();

    // Update cached balances
    for (const userId of participants) {
      if (userId !== paidBy) {
        try {
          await FriendService.updateCachedBalance(paidBy, userId);
        } catch (error) {
          console.error(`Failed to update cached balance: ${error.message}`);
        }
      }
    }

    return transaction;
  }

  /**
   * Get shared transactions for a user
   * @param {string} userId - User ID
   * @param {Object} filters - Optional filters
   * @returns {Promise<Array>} - Array of shared transactions
   */
  static async getSharedTransactions(userId, filters = {}) {
    return Transaction.getSharedForUser(userId, filters);
  }

  /**
   * Get shared transactions between two users
   * @param {string} userId1 - First user ID
   * @param {string} userId2 - Second user ID
   * @param {Object} filters - Optional filters
   * @returns {Promise<Array>} - Array of shared transactions
   */
  static async getSharedBetweenUsers(userId1, userId2, filters = {}) {
    return Transaction.getSharedBetweenUsers(userId1, userId2, filters);
  }

  /**
   * Get detailed balance breakdown between two users
   * @param {string} userId1 - First user ID
   * @param {string} userId2 - Second user ID
   * @returns {Promise<Object>} - Detailed balance information
   */
  static async getDetailedBalance(userId1, userId2) {
    const transactions = await Transaction.getSharedBetweenUsers(userId1, userId2);
    
    let totalBalance = 0;
    let unsettledAmount = 0;
    let transactionCount = 0;
    const transactionBreakdown = [];

    transactions.forEach(transaction => {
      const user1Share = transaction.getUserShare(userId1);
      const user2Share = transaction.getUserShare(userId2);
      
      if (!user1Share || !user2Share) return;
      
      transactionCount++;
      const paidByUser1 = transaction.splitInfo.paidBy.toString() === userId1.toString();
      const paidByUser2 = transaction.splitInfo.paidBy.toString() === userId2.toString();
      
      let transactionBalance = 0;
      let isSettled = user1Share.settled && user2Share.settled;
      
      if (paidByUser1) {
        transactionBalance = user2Share.share;
      } else if (paidByUser2) {
        transactionBalance = -user1Share.share;
      }
      
      totalBalance += transactionBalance;
      
      if (!isSettled) {
        unsettledAmount += Math.abs(transactionBalance);
      }
      
      transactionBreakdown.push({
        transactionId: transaction._id,
        amount: transaction.amount,
        category: transaction.category,
        date: transaction.date,
        paidBy: transaction.splitInfo.paidBy,
        user1Share: user1Share.share,
        user2Share: user2Share.share,
        balance: transactionBalance,
        settled: isSettled,
        description: transaction.description || transaction.notes
      });
    });

    return {
      totalBalance, // Positive: user2 owes user1, Negative: user1 owes user2
      unsettledAmount,
      transactionCount,
      transactionBreakdown,
      summary: {
        user1Owes: totalBalance < 0 ? Math.abs(totalBalance) : 0,
        user2Owes: totalBalance > 0 ? totalBalance : 0,
        isSettled: Math.abs(totalBalance) < 0.01
      }
    };
  }

  /**
   * Get user's split transaction summary
   * @param {string} userId - User ID
   * @param {Object} filters - Optional filters
   * @returns {Promise<Object>} - User's split summary
   */
  static async getUserSplitSummary(userId, filters = {}) {
    const transactions = await Transaction.getSharedForUser(userId, filters);
    
    let totalOwed = 0; // Amount others owe this user
    let totalOwing = 0; // Amount this user owes others
    let unsettledTransactions = 0;
    const friendBalances = new Map();

    transactions.forEach(transaction => {
      const userShare = transaction.getUserShare(userId);
      if (!userShare) return;

      const paidByUser = transaction.splitInfo.paidBy.toString() === userId.toString();
      const isSettled = userShare.settled;

      // Calculate what this user is owed or owes
      transaction.splitInfo.participants.forEach(participant => {
        if (!participant.user || participant.user.toString() === userId.toString()) return;
        
        const participantId = participant.user.toString();
        
        if (paidByUser && !participant.settled) {
          // User paid, participant owes user
          totalOwed += participant.share;
          
          const currentBalance = friendBalances.get(participantId) || 0;
          friendBalances.set(participantId, currentBalance + participant.share);
        } else if (!paidByUser && !isSettled) {
          // Someone else paid, user owes
          const payerId = transaction.splitInfo.paidBy.toString();
          if (payerId !== userId.toString()) {
            totalOwing += userShare.share;
            
            const currentBalance = friendBalances.get(payerId) || 0;
            friendBalances.set(payerId, currentBalance - userShare.share);
          }
        }
      });

      if (!isSettled) {
        unsettledTransactions++;
      }
    });

    return {
      totalOwed,
      totalOwing,
      netBalance: totalOwed - totalOwing,
      unsettledTransactions,
      totalTransactions: transactions.length,
      friendBalances: Object.fromEntries(friendBalances)
    };
  }
}

module.exports = SplitService;
