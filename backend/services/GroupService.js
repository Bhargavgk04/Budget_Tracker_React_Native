const Group = require('../models/Group');
const Friendship = require('../models/Friendship');
const Transaction = require('../models/Transaction');
const User = require('../models/User');

class GroupService {
  /**
   * Create a new group
   * @param {string} name - Group name
   * @param {string} type - Group type
   * @param {string} createdBy - Creator user ID
   * @param {Array} memberIds - Array of member user IDs
   * @param {string} description - Optional description
   * @returns {Promise<Object>} - Created group
   */
  static async createGroup(name, type, createdBy, memberIds, description = '') {
    // Validate name
    if (!name || name.trim().length < 2) {
      throw new Error('Group name must be at least 2 characters');
    }

    // Validate type
    const validTypes = ['trip', 'rent', 'office_lunch', 'custom'];
    if (!validTypes.includes(type)) {
      throw new Error('Invalid group type');
    }

    // Validate members
    if (!memberIds || memberIds.length < 1) {
      throw new Error('At least one member is required besides the creator');
    }

    // Ensure creator is included in members
    const allMemberIds = [createdBy, ...memberIds.filter(id => id !== createdBy)];

    // Validate all members exist
    const users = await User.find({ _id: { $in: allMemberIds } });
    if (users.length !== allMemberIds.length) {
      throw new Error('One or more members not found');
    }

    // Check if all members are friends with creator (optional, can be relaxed for groups)
    // For now, we'll allow group creation without friendship requirement

    // Create group
    const group = new Group({
      name: name.trim(),
      type,
      description: description.trim(),
      createdBy,
      members: allMemberIds.map(userId => ({
        user: userId,
        role: userId === createdBy ? 'admin' : 'member',
        joinedAt: new Date(),
        isActive: true
      })),
      balances: allMemberIds.map(userId => ({
        user: userId,
        netBalance: 0,
        lastUpdated: new Date()
      })),
      totalExpenses: 0,
      isActive: true,
      isSettled: true
    });

    await group.save();

    return group.populate([
      { path: 'createdBy', select: 'uid name email profilePicture' },
      { path: 'members.user', select: 'uid name email profilePicture' },
      { path: 'balances.user', select: 'uid name email profilePicture' }
    ]);
  }

  /**
   * Add member to group
   * @param {string} groupId - Group ID
   * @param {string} userId - User ID to add
   * @param {string} addedBy - User ID adding the member
   * @returns {Promise<Object>} - Updated group
   */
  static async addMember(groupId, userId, addedBy) {
    const group = await Group.findById(groupId);

    if (!group) {
      throw new Error('Group not found');
    }

    if (!group.isActive) {
      throw new Error('Cannot add members to inactive group');
    }

    // Check if addedBy is an admin
    if (!group.isAdmin(addedBy)) {
      throw new Error('Only group admins can add members');
    }

    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Add member using group method
    await group.addMember(userId);

    return group.populate([
      { path: 'createdBy', select: 'uid name email profilePicture' },
      { path: 'members.user', select: 'uid name email profilePicture' },
      { path: 'balances.user', select: 'uid name email profilePicture' }
    ]);
  }

  /**
   * Remove member from group
   * @param {string} groupId - Group ID
   * @param {string} userId - User ID to remove
   * @param {string} removedBy - User ID removing the member
   * @returns {Promise<Object>} - Updated group
   */
  static async removeMember(groupId, userId, removedBy) {
    const group = await Group.findById(groupId);

    if (!group) {
      throw new Error('Group not found');
    }

    // Check if removedBy is an admin or the user themselves
    if (!group.isAdmin(removedBy) && removedBy !== userId) {
      throw new Error('Only group admins or the user themselves can remove members');
    }

    // Remove member using group method (includes balance check)
    await group.removeMember(userId);

    return group.populate([
      { path: 'createdBy', select: 'uid name email profilePicture' },
      { path: 'members.user', select: 'uid name email profilePicture' },
      { path: 'balances.user', select: 'uid name email profilePicture' }
    ]);
  }

  /**
   * Get group details
   * @param {string} groupId - Group ID
   * @param {string} userId - User ID requesting details
   * @returns {Promise<Object>} - Group details
   */
  static async getGroupDetails(groupId, userId) {
    const group = await Group.getDetailedById(groupId);

    if (!group) {
      throw new Error('Group not found');
    }

    // Check if user is a member
    if (!group.isMember(userId)) {
      throw new Error('Access denied: User is not a member of this group');
    }

    // Get group expenses
    const expenses = await Transaction.getGroupTransactions(groupId);

    return {
      ...group.toObject(),
      stats: {
        totalExpenses: group.totalExpenses,
        expenseCount: expenses.length,
        activeMembersCount: group.activeMembersCount,
        isSettled: group.isSettled
      }
    };
  }

  /**
   * Get user's groups
   * @param {string} userId - User ID
   * @param {Object} filters - Optional filters
   * @returns {Promise<Array>} - Array of groups
   */
  static async getUserGroups(userId, filters = {}) {
    return Group.getForUser(userId, filters);
  }

  /**
   * Calculate group balances
   * @param {string} groupId - Group ID
   * @returns {Promise<Object>} - Calculated balances
   */
  static async calculateGroupBalances(groupId) {
    const group = await Group.findById(groupId);

    if (!group) {
      throw new Error('Group not found');
    }

    // Get all group transactions
    const transactions = await Transaction.getGroupTransactions(groupId);

    // Initialize balances for all members
    const balances = {};
    group.members.forEach(member => {
      if (member.isActive) {
        balances[member.user.toString()] = 0;
      }
    });

    // Calculate balances from transactions
    transactions.forEach(transaction => {
      if (!transaction.splitInfo || !transaction.splitInfo.isShared) return;

      const paidBy = transaction.splitInfo.paidBy.toString();

      transaction.splitInfo.participants.forEach(participant => {
        const userId = participant.user.toString();
        
        if (userId !== paidBy && balances.hasOwnProperty(userId)) {
          // This user owes the payer
          balances[userId] -= participant.share;
        }
        
        if (userId === paidBy && balances.hasOwnProperty(userId)) {
          // This user paid, so others owe them
          const othersShare = transaction.splitInfo.participants
            .filter(p => p.user.toString() !== paidBy)
            .reduce((sum, p) => sum + p.share, 0);
          balances[userId] += othersShare;
        }
      });
    });

    return balances;
  }

  /**
   * Update cached group balances
   * @param {string} groupId - Group ID
   * @returns {Promise<Object>} - Updated group
   */
  static async updateGroupBalances(groupId) {
    const group = await Group.findById(groupId);

    if (!group) {
      throw new Error('Group not found');
    }

    const balances = await this.calculateGroupBalances(groupId);

    // Update each member's balance
    for (const [userId, balance] of Object.entries(balances)) {
      await group.updateMemberBalance(userId, balance);
    }

    // Check if group is settled
    await group.checkIfSettled();

    return group.populate([
      { path: 'createdBy', select: 'uid name email profilePicture' },
      { path: 'members.user', select: 'uid name email profilePicture' },
      { path: 'balances.user', select: 'uid name email profilePicture' }
    ]);
  }

  /**
   * Mark group as settled
   * @param {string} groupId - Group ID
   * @param {string} userId - User ID marking as settled
   * @returns {Promise<Object>} - Updated group
   */
  static async markGroupSettled(groupId, userId) {
    const group = await Group.findById(groupId);

    if (!group) {
      throw new Error('Group not found');
    }

    // Check if user is an admin
    if (!group.isAdmin(userId)) {
      throw new Error('Only group admins can mark group as settled');
    }

    // Verify all balances are actually settled
    const hasUnsettledBalances = group.balances.some(b => Math.abs(b.netBalance) > 0.01);
    
    if (hasUnsettledBalances) {
      throw new Error('Cannot mark group as settled with outstanding balances');
    }

    group.isSettled = true;
    group.settledAt = new Date();
    await group.save();

    return group.populate([
      { path: 'createdBy', select: 'uid name email profilePicture' },
      { path: 'members.user', select: 'uid name email profilePicture' },
      { path: 'balances.user', select: 'uid name email profilePicture' }
    ]);
  }

  /**
   * Get group expenses
   * @param {string} groupId - Group ID
   * @param {string} userId - User ID requesting expenses
   * @param {Object} filters - Optional filters
   * @returns {Promise<Array>} - Array of expenses
   */
  static async getGroupExpenses(groupId, userId, filters = {}) {
    const group = await Group.findById(groupId);

    if (!group) {
      throw new Error('Group not found');
    }

    // Check if user is a member
    if (!group.isMember(userId)) {
      throw new Error('Access denied: User is not a member of this group');
    }

    return Transaction.getGroupTransactions(groupId, filters);
  }

  /**
   * Update group details
   * @param {string} groupId - Group ID
   * @param {string} userId - User ID updating
   * @param {Object} updates - Updates to apply
   * @returns {Promise<Object>} - Updated group
   */
  static async updateGroup(groupId, userId, updates) {
    const group = await Group.findById(groupId);

    if (!group) {
      throw new Error('Group not found');
    }

    // Check if user is an admin
    if (!group.isAdmin(userId)) {
      throw new Error('Only group admins can update group details');
    }

    // Apply allowed updates
    if (updates.name) group.name = updates.name.trim();
    if (updates.description !== undefined) group.description = updates.description.trim();
    if (updates.type && ['trip', 'rent', 'office_lunch', 'custom'].includes(updates.type)) {
      group.type = updates.type;
    }

    await group.save();

    return group.populate([
      { path: 'createdBy', select: 'uid name email profilePicture' },
      { path: 'members.user', select: 'uid name email profilePicture' },
      { path: 'balances.user', select: 'uid name email profilePicture' }
    ]);
  }

  /**
   * Delete/deactivate group
   * @param {string} groupId - Group ID
   * @param {string} userId - User ID deleting
   * @returns {Promise<Object>} - Deactivated group
   */
  static async deleteGroup(groupId, userId) {
    const group = await Group.findById(groupId);

    if (!group) {
      throw new Error('Group not found');
    }

    // Check if user is the creator
    if (group.createdBy.toString() !== userId.toString()) {
      throw new Error('Only the group creator can delete the group');
    }

    // Check if group has unsettled balances
    const hasUnsettledBalances = group.balances.some(b => Math.abs(b.netBalance) > 0.01);
    
    if (hasUnsettledBalances) {
      throw new Error('Cannot delete group with unsettled balances');
    }

    group.isActive = false;
    await group.save();

    return group;
  }
}

module.exports = GroupService;
