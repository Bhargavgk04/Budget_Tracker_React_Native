const Settlement = require('../models/Settlement');
const Friendship = require('../models/Friendship');
const FriendService = require('./FriendService');

class SettlementService {
  /**
   * Create a settlement
   * @param {string} payerId - ID of user making payment
   * @param {string} recipientId - ID of user receiving payment
   * @param {number} amount - Settlement amount
   * @param {Object} details - Settlement details (paymentMethod, notes, date, groupId, relatedTransactions)
   * @returns {Promise<Object>} - Created settlement
   */
  static async createSettlement(payerId, recipientId, amount, details = {}) {
    // Validate users are different
    if (payerId === recipientId) {
      throw new Error('Payer and recipient cannot be the same user');
    }

    // Validate amount
    if (!amount || amount <= 0) {
      throw new Error('Settlement amount must be positive');
    }

    // Validate payment method
    if (!details.paymentMethod) {
      throw new Error('Payment method is required');
    }

    // Check if users are friends (unless it's a group settlement)
    if (!details.groupId) {
      const areFriends = await Friendship.areFriends(payerId, recipientId);
      if (!areFriends) {
        throw new Error('Users must be friends to create a settlement');
      }
    }

    // Create settlement
    const settlement = new Settlement({
      payer: payerId,
      recipient: recipientId,
      amount,
      paymentMethod: details.paymentMethod,
      notes: details.notes,
      date: details.date || new Date(),
      groupId: details.groupId,
      relatedTransactions: details.relatedTransactions || [],
      status: 'pending'
    });

    await settlement.save();

    // Update cached balance
    try {
      await FriendService.updateCachedBalance(payerId, recipientId);
    } catch (error) {
      console.error(`Failed to update cached balance: ${error.message}`);
    }

    return settlement.populate([
      { path: 'payer', select: 'uid name email profilePicture' },
      { path: 'recipient', select: 'uid name email profilePicture' },
      { path: 'groupId', select: 'name type' }
    ]);
  }

  /**
   * Confirm a settlement
   * @param {string} settlementId - Settlement ID
   * @param {string} userId - ID of user confirming (must be recipient)
   * @returns {Promise<Object>} - Confirmed settlement
   */
  static async confirmSettlement(settlementId, userId) {
    const settlement = await Settlement.findById(settlementId);

    if (!settlement) {
      throw new Error('Settlement not found');
    }

    // Use the confirm method from the model
    await settlement.confirm(userId);

    // Update cached balance
    try {
      await FriendService.updateCachedBalance(
        settlement.payer.toString(),
        settlement.recipient.toString()
      );
    } catch (error) {
      console.error(`Failed to update cached balance: ${error.message}`);
    }

    return settlement.populate([
      { path: 'payer', select: 'uid name email profilePicture' },
      { path: 'recipient', select: 'uid name email profilePicture' },
      { path: 'confirmedBy', select: 'uid name' },
      { path: 'groupId', select: 'name type' }
    ]);
  }

  /**
   * Dispute a settlement
   * @param {string} settlementId - Settlement ID
   * @param {string} userId - ID of user disputing
   * @param {string} reason - Reason for dispute
   * @returns {Promise<Object>} - Disputed settlement
   */
  static async disputeSettlement(settlementId, userId, reason) {
    const settlement = await Settlement.findById(settlementId);

    if (!settlement) {
      throw new Error('Settlement not found');
    }

    if (!reason || reason.trim().length === 0) {
      throw new Error('Dispute reason is required');
    }

    // Use the dispute method from the model
    await settlement.dispute(userId, reason);

    return settlement.populate([
      { path: 'payer', select: 'uid name email profilePicture' },
      { path: 'recipient', select: 'uid name email profilePicture' },
      { path: 'groupId', select: 'name type' }
    ]);
  }

  /**
   * Get settlements between two users
   * @param {string} userId1 - First user ID
   * @param {string} userId2 - Second user ID
   * @param {Object} filters - Optional filters (status, startDate, endDate)
   * @returns {Promise<Array>} - Array of settlements
   */
  static async getSettlements(userId1, userId2, filters = {}) {
    return Settlement.getBetweenUsers(userId1, userId2, filters);
  }

  /**
   * Get pending settlements for a user
   * @param {string} userId - User ID
   * @returns {Promise<Array>} - Array of pending settlements
   */
  static async getPendingSettlements(userId) {
    return Settlement.getPendingForUser(userId);
  }

  /**
   * Get all settlements for a user
   * @param {string} userId - User ID
   * @param {Object} filters - Optional filters
   * @returns {Promise<Array>} - Array of settlements
   */
  static async getSettlementsForUser(userId, filters = {}) {
    return Settlement.getForUser(userId, filters);
  }

  /**
   * Delete a settlement
   * @param {string} settlementId - Settlement ID
   * @param {string} userId - ID of user deleting
   * @returns {Promise<Object>} - Deleted settlement
   */
  static async deleteSettlement(settlementId, userId) {
    const settlement = await Settlement.findById(settlementId);

    if (!settlement) {
      throw new Error('Settlement not found');
    }

    // Only involved parties can delete
    if (!settlement.involvesUser(userId)) {
      throw new Error('Only involved parties can delete this settlement');
    }

    // Store payer and recipient for balance update
    const payerId = settlement.payer.toString();
    const recipientId = settlement.recipient.toString();

    // Delete the settlement
    await Settlement.findByIdAndDelete(settlementId);

    // Update cached balance
    try {
      await FriendService.updateCachedBalance(payerId, recipientId);
    } catch (error) {
      console.error(`Failed to update cached balance: ${error.message}`);
    }

    return settlement;
  }

  /**
   * Calculate settlement impact on balance
   * @param {Object} settlement - Settlement object
   * @returns {Object} - Impact details
   */
  static calculateSettlementImpact(settlement) {
    return {
      payer: settlement.payer,
      recipient: settlement.recipient,
      amount: settlement.amount,
      // Positive impact for recipient (receiving money)
      // Negative impact for payer (paying money)
      payerImpact: -settlement.amount,
      recipientImpact: settlement.amount
    };
  }

  /**
   * Get settlement statistics for a user
   * @param {string} userId - User ID
   * @returns {Promise<Object>} - Settlement statistics
   */
  static async getSettlementStats(userId) {
    const settlements = await Settlement.getForUser(userId);

    const stats = {
      total: settlements.length,
      pending: 0,
      confirmed: 0,
      disputed: 0,
      totalPaid: 0,
      totalReceived: 0,
      averageSettlementTime: 0
    };

    let totalSettlementTime = 0;
    let confirmedCount = 0;

    settlements.forEach(settlement => {
      // Count by status
      if (settlement.status === 'pending') stats.pending++;
      else if (settlement.status === 'confirmed') stats.confirmed++;
      else if (settlement.status === 'disputed') stats.disputed++;

      // Calculate amounts
      if (settlement.payer.toString() === userId.toString()) {
        stats.totalPaid += settlement.amount;
      } else {
        stats.totalReceived += settlement.amount;
      }

      // Calculate average settlement time for confirmed settlements
      if (settlement.status === 'confirmed' && settlement.confirmedAt) {
        const timeDiff = settlement.confirmedAt - settlement.createdAt;
        totalSettlementTime += timeDiff;
        confirmedCount++;
      }
    });

    // Calculate average in days
    if (confirmedCount > 0) {
      stats.averageSettlementTime = Math.round(
        (totalSettlementTime / confirmedCount) / (1000 * 60 * 60 * 24)
      );
    }

    return stats;
  }
}

module.exports = SettlementService;
