const Transaction = require("../models/Transaction");
const Settlement = require("../models/Settlement");
const GroupService = require("./GroupService");

class DebtSimplificationService {
  /**
   * Simplify debts using greedy algorithm
   * @param {Object} balances - Map of userId -> net balance (positive = owed, negative = owes)
   * @returns {Array} - Array of simplified settlements
   */
  static simplifyDebts(balances) {
    const creditors = []; // Users who are owed money
    const debtors = []; // Users who owe money
    const settlements = [];

    // Separate creditors and debtors
    for (const [userId, balance] of Object.entries(balances)) {
      if (balance > 0.01) {
        creditors.push({ userId, amount: balance });
      } else if (balance < -0.01) {
        debtors.push({ userId, amount: Math.abs(balance) });
      }
    }

    // Sort by amount (descending) for greedy approach
    creditors.sort((a, b) => b.amount - a.amount);
    debtors.sort((a, b) => b.amount - a.amount);

    let i = 0,
      j = 0;

    // Match creditors with debtors
    while (i < creditors.length && j < debtors.length) {
      const creditor = creditors[i];
      const debtor = debtors[j];

      const settleAmount = Math.min(creditor.amount, debtor.amount);

      // Round to 2 decimal places
      const roundedAmount = Math.round(settleAmount * 100) / 100;

      if (roundedAmount > 0.01) {
        settlements.push({
          from: debtor.userId,
          to: creditor.userId,
          amount: roundedAmount,
        });
      }

      creditor.amount -= settleAmount;
      debtor.amount -= settleAmount;

      // Move to next creditor/debtor if current one is settled
      if (creditor.amount < 0.01) i++;
      if (debtor.amount < 0.01) j++;
    }

    return settlements;
  }

  /**
   * Calculate net balances for a group of users
   * @param {Array} transactions - Array of transactions
   * @returns {Object} - Map of userId -> net balance
   */
  static calculateNetBalances(transactions) {
    const balances = {};

    transactions.forEach((transaction) => {
      if (!transaction.splitInfo || !transaction.splitInfo.isShared) return;

      const paidBy = transaction.splitInfo.paidBy._id
        ? transaction.splitInfo.paidBy._id.toString()
        : transaction.splitInfo.paidBy.toString();

      // Initialize payer balance if not exists
      if (!balances[paidBy]) {
        balances[paidBy] = 0;
      }

      transaction.splitInfo.participants.forEach((participant) => {
        const userId = participant.user._id
          ? participant.user._id.toString()
          : participant.user.toString();

        // Initialize participant balance if not exists
        if (!balances[userId]) {
          balances[userId] = 0;
        }

        if (userId !== paidBy) {
          // This user owes the payer
          balances[userId] -= participant.share;
          balances[paidBy] += participant.share;
        }
      });
    });

    return balances;
  }

  /**
   * Get simplified settlement plan for a user with their friends
   * @param {string} userId - User ID
   * @param {Array} friendIds - Array of friend IDs
   * @returns {Promise<Object>} - Simplified settlement plan
   */
  static async getSimplifiedSettlements(userId, friendIds) {
    // Get all shared transactions between user and friends
    const allTransactions = [];

    for (const friendId of friendIds) {
      const transactions = await Transaction.getSharedBetweenUsers(
        userId,
        friendId
      );
      allTransactions.push(...transactions);
    }

    // Get all settlements
    const allSettlements = [];
    for (const friendId of friendIds) {
      const settlements = await Settlement.getBetweenUsers(userId, friendId, {
        status: "confirmed",
      });
      allSettlements.push(...settlements);
    }

    // Calculate net balances from transactions
    const transactionBalances = this.calculateNetBalances(allTransactions);

    // Adjust for settlements
    allSettlements.forEach((settlement) => {
      const payerId = settlement.payer._id
        ? settlement.payer._id.toString()
        : settlement.payer.toString();
      const recipientId = settlement.recipient._id
        ? settlement.recipient._id.toString()
        : settlement.recipient.toString();

      if (!transactionBalances[payerId]) transactionBalances[payerId] = 0;
      if (!transactionBalances[recipientId])
        transactionBalances[recipientId] = 0;

      // Settlement reduces what payer owes or increases what they're owed
      transactionBalances[payerId] += settlement.amount;
      transactionBalances[recipientId] -= settlement.amount;
    });

    // Calculate original debts (before simplification)
    const originalDebts = [];
    for (const friendId of friendIds) {
      const balance = transactionBalances[friendId] || 0;
      const userBalance = transactionBalances[userId] || 0;

      if (Math.abs(balance) > 0.01 || Math.abs(userBalance) > 0.01) {
        const netBalance = userBalance + balance;
        if (Math.abs(netBalance) > 0.01) {
          originalDebts.push({
            from: netBalance < 0 ? userId : friendId,
            to: netBalance < 0 ? friendId : userId,
            amount: Math.abs(netBalance),
          });
        }
      }
    }

    // Simplify debts
    const simplifiedSettlements = this.simplifyDebts(transactionBalances);

    // Filter to only include settlements involving the user
    const userSimplifiedSettlements = simplifiedSettlements.filter(
      (s) => s.from === userId || s.to === userId
    );

    return {
      originalDebts,
      simplifiedSettlements: userSimplifiedSettlements,
      savingsCount: originalDebts.length - userSimplifiedSettlements.length,
      balances: transactionBalances,
    };
  }

  /**
   * Get simplified settlements for a group
   * @param {string} groupId - Group ID
   * @returns {Promise<Object>} - Simplified settlement plan for group
   */
  static async getGroupSimplifiedSettlements(groupId) {
    // Get all group transactions
    const transactions = await Transaction.getGroupTransactions(groupId);

    // Calculate net balances
    const balances = this.calculateNetBalances(transactions);

    // Get group settlements
    const settlements = await Settlement.find({
      groupId,
      status: "confirmed",
    });

    // Adjust balances for settlements
    settlements.forEach((settlement) => {
      const payerId = settlement.payer._id
        ? settlement.payer._id.toString()
        : settlement.payer.toString();
      const recipientId = settlement.recipient._id
        ? settlement.recipient._id.toString()
        : settlement.recipient.toString();

      if (!balances[payerId]) balances[payerId] = 0;
      if (!balances[recipientId]) balances[recipientId] = 0;

      balances[payerId] += settlement.amount;
      balances[recipientId] -= settlement.amount;
    });

    // Calculate original debts (all pairwise debts)
    const originalDebts = [];
    const userIds = Object.keys(balances);

    for (let i = 0; i < userIds.length; i++) {
      for (let j = i + 1; j < userIds.length; j++) {
        const user1 = userIds[i];
        const user2 = userIds[j];
        const balance1 = balances[user1] || 0;
        const balance2 = balances[user2] || 0;

        // Calculate what user1 owes user2 (or vice versa)
        if (balance1 > 0 && balance2 < 0) {
          const amount = Math.min(balance1, Math.abs(balance2));
          if (amount > 0.01) {
            originalDebts.push({
              from: user2,
              to: user1,
              amount: Math.round(amount * 100) / 100,
            });
          }
        } else if (balance2 > 0 && balance1 < 0) {
          const amount = Math.min(balance2, Math.abs(balance1));
          if (amount > 0.01) {
            originalDebts.push({
              from: user1,
              to: user2,
              amount: Math.round(amount * 100) / 100,
            });
          }
        }
      }
    }

    // Simplify debts
    const simplifiedSettlements = this.simplifyDebts(balances);

    return {
      groupId,
      originalDebts,
      simplifiedSettlements,
      savingsCount: originalDebts.length - simplifiedSettlements.length,
      balances,
    };
  }

  /**
   * Validate that simplified settlements satisfy all original debts
   * @param {Object} originalBalances - Original balance map
   * @param {Array} simplifiedSettlements - Simplified settlements
   * @returns {boolean} - Whether simplification is valid
   */
  static validateSimplification(originalBalances, simplifiedSettlements) {
    // Create a copy of balances to track
    const testBalances = { ...originalBalances };

    // Apply simplified settlements
    simplifiedSettlements.forEach((settlement) => {
      if (!testBalances[settlement.from]) testBalances[settlement.from] = 0;
      if (!testBalances[settlement.to]) testBalances[settlement.to] = 0;

      testBalances[settlement.from] += settlement.amount;
      testBalances[settlement.to] -= settlement.amount;
    });

    // Check if all balances are settled (within rounding error)
    for (const balance of Object.values(testBalances)) {
      if (Math.abs(balance) > 0.01) {
        return false;
      }
    }

    return true;
  }

  /**
   * Get debt simplification statistics
   * @param {Object} simplificationResult - Result from getSimplifiedSettlements or getGroupSimplifiedSettlements
   * @returns {Object} - Statistics about the simplification
   */
  static getSimplificationStats(simplificationResult) {
    const { originalDebts, simplifiedSettlements } = simplificationResult;

    const originalTotal = originalDebts.reduce(
      (sum, debt) => sum + debt.amount,
      0
    );
    const simplifiedTotal = simplifiedSettlements.reduce(
      (sum, s) => sum + s.amount,
      0
    );

    return {
      originalTransactionCount: originalDebts.length,
      simplifiedTransactionCount: simplifiedSettlements.length,
      transactionsSaved: originalDebts.length - simplifiedSettlements.length,
      savingsPercentage:
        originalDebts.length > 0
          ? Math.round(
              ((originalDebts.length - simplifiedSettlements.length) /
                originalDebts.length) *
                100
            )
          : 0,
      originalTotalAmount: Math.round(originalTotal * 100) / 100,
      simplifiedTotalAmount: Math.round(simplifiedTotal * 100) / 100,
      amountDifference:
        Math.round((originalTotal - simplifiedTotal) * 100) / 100,
    };
  }
}

module.exports = DebtSimplificationService;
