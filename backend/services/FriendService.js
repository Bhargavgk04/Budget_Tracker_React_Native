const Friendship = require('../models/Friendship');
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const Settlement = require('../models/Settlement');
const mongoose = require('mongoose');

class FriendService {
  /**
   * Search users by UID, email, or phone
   * @param {string} query - Search query
   * @param {string} currentUserId - ID of the user performing the search
   * @returns {Promise<Array>} - Array of matching users
   */
  static async searchUsers(query, currentUserId) {
    if (!query || query.trim().length === 0) {
      throw new Error('Search query is required');
    }

    // Prevent searching for self
    const trimmedQuery = query.trim();
    
    // Build search criteria
    const searchCriteria = {
      _id: { $ne: currentUserId }, // Exclude current user
      $or: [
        { uid: { $regex: trimmedQuery, $options: 'i' } },
        { email: { $regex: trimmedQuery, $options: 'i' } },
        { name: { $regex: trimmedQuery, $options: 'i' } }
      ]
    };

    // Limit results to prevent data scraping
    const users = await User.find(searchCriteria)
      .select('uid name email profilePicture')
      .limit(10)
      .lean();

    // For each user, check if they're already a friend
    const usersWithFriendshipStatus = await Promise.all(
      users.map(async (user) => {
        const friendship = await Friendship.findBetweenUsers(currentUserId, user._id);
        
        return {
          ...user,
          friendshipStatus: friendship ? friendship.status : null,
          friendshipId: friendship ? friendship._id : null
        };
      })
    );

    return usersWithFriendshipStatus;
  }

  /**
   * Send a friend request
   * @param {string} requesterId - ID of user sending the request
   * @param {string} recipientId - ID of user receiving the request
   * @returns {Promise<Object>} - Created friendship
   */
  static async sendFriendRequest(requesterId, recipientId) {
    // Validate users are different
    if (requesterId === recipientId) {
      throw new Error('Cannot send friend request to yourself');
    }

    // Check if recipient exists
    const recipient = await User.findById(recipientId);
    if (!recipient) {
      throw new Error('Recipient user not found');
    }

    // Check if friendship already exists
    const existingFriendship = await Friendship.findBetweenUsers(requesterId, recipientId);
    
    if (existingFriendship) {
      if (existingFriendship.status === 'pending') {
        throw new Error('Friend request already pending');
      } else if (existingFriendship.status === 'accepted') {
        throw new Error('Users are already friends');
      } else if (existingFriendship.status === 'declined') {
        // Allow resending after decline
        existingFriendship.status = 'pending';
        existingFriendship.requestedAt = new Date();
        existingFriendship.respondedAt = undefined;
        await existingFriendship.save();
        
        return existingFriendship.populate([
          { path: 'requester', select: 'uid name email profilePicture' },
          { path: 'recipient', select: 'uid name email profilePicture' }
        ]);
      } else if (existingFriendship.status === 'blocked') {
        throw new Error('Cannot send friend request to this user');
      }
    }

    // Create new friendship
    const friendship = new Friendship({
      requester: requesterId,
      recipient: recipientId,
      status: 'pending',
      requestedAt: new Date()
    });

    await friendship.save();

    return friendship.populate([
      { path: 'requester', select: 'uid name email profilePicture' },
      { path: 'recipient', select: 'uid name email profilePicture' }
    ]);
  }

  /**
   * Accept a friend request
   * @param {string} friendshipId - ID of the friendship
   * @param {string} userId - ID of user accepting (must be recipient)
   * @returns {Promise<Object>} - Updated friendship
   */
  static async acceptFriendRequest(friendshipId, userId) {
    const friendship = await Friendship.findById(friendshipId);

    if (!friendship) {
      throw new Error('Friend request not found');
    }

    // Only recipient can accept
    if (friendship.recipient.toString() !== userId.toString()) {
      throw new Error('Only the recipient can accept this friend request');
    }

    if (friendship.status !== 'pending') {
      throw new Error('Friend request is not pending');
    }

    friendship.status = 'accepted';
    friendship.respondedAt = new Date();
    await friendship.save();

    return friendship.populate([
      { path: 'requester', select: 'uid name email profilePicture' },
      { path: 'recipient', select: 'uid name email profilePicture' }
    ]);
  }

  /**
   * Decline a friend request
   * @param {string} friendshipId - ID of the friendship
   * @param {string} userId - ID of user declining (must be recipient)
   * @returns {Promise<Object>} - Updated friendship
   */
  static async declineFriendRequest(friendshipId, userId) {
    const friendship = await Friendship.findById(friendshipId);

    if (!friendship) {
      throw new Error('Friend request not found');
    }

    // Only recipient can decline
    if (friendship.recipient.toString() !== userId.toString()) {
      throw new Error('Only the recipient can decline this friend request');
    }

    if (friendship.status !== 'pending') {
      throw new Error('Friend request is not pending');
    }

    friendship.status = 'declined';
    friendship.respondedAt = new Date();
    await friendship.save();

    return friendship;
  }

  /**
   * Get friend list with balances
   * @param {string} userId - ID of the user
   * @param {Object} filters - Optional filters (status, balanceStatus)
   * @returns {Promise<Array>} - Array of friends with balance info
   */
  static async getFriendList(userId, filters = {}) {
    const status = filters.status || 'accepted';
    
    const friendships = await Friendship.getFriendsForUser(userId, status);

    // Add balance information and format response
    const friendsWithBalances = friendships.map(friendship => {
      const isRequester = friendship.requester._id.toString() === userId.toString();
      const friend = isRequester ? friendship.recipient : friendship.requester;
      
      // Determine balance direction from user's perspective
      let balanceAmount = friendship.balance.amount;
      let balanceDirection = 'settled';
      
      if (Math.abs(balanceAmount) > 0.01) {
        if (friendship.balance.direction === 'requester_owes') {
          balanceDirection = isRequester ? 'you_owe' : 'owes_you';
        } else if (friendship.balance.direction === 'recipient_owes') {
          balanceDirection = isRequester ? 'owes_you' : 'you_owe';
        }
      }

      return {
        _id: friend._id,
        uid: friend.uid,
        name: friend.name,
        email: friend.email,
        profilePicture: friend.profilePicture,
        friendshipId: friendship._id,
        friendshipStatus: friendship.status,
        balance: {
          amount: Math.abs(balanceAmount),
          direction: balanceDirection,
          lastUpdated: friendship.balance.lastUpdated
        }
      };
    });

    // Apply balance filter if specified
    if (filters.balanceStatus) {
      return friendsWithBalances.filter(f => f.balance.direction === filters.balanceStatus);
    }

    return friendsWithBalances;
  }

  /**
   * Get friend details
   * @param {string} userId - ID of the current user
   * @param {string} friendId - ID of the friend
   * @returns {Promise<Object>} - Friend details with balance and transaction info
   */
  static async getFriendDetails(userId, friendId) {
    // Check if they are friends
    const friendship = await Friendship.findBetweenUsers(userId, friendId);
    
    if (!friendship) {
      throw new Error('Friendship not found');
    }

    if (friendship.status !== 'accepted') {
      throw new Error('Users are not friends');
    }

    // Get friend user details
    const friend = await User.findById(friendId).select('uid name email profilePicture');
    
    if (!friend) {
      throw new Error('Friend not found');
    }

    // Calculate current balance
    const balance = await this.calculateBalance(userId, friendId);

    // Get shared transactions count
    const sharedTransactions = await Transaction.getSharedBetweenUsers(userId, friendId);
    
    // Get settlements
    const settlements = await Settlement.getBetweenUsers(userId, friendId);

    return {
      friend: {
        _id: friend._id,
        uid: friend.uid,
        name: friend.name,
        email: friend.email,
        profilePicture: friend.profilePicture
      },
      friendshipId: friendship._id,
      balance: {
        amount: Math.abs(balance),
        direction: balance > 0 ? 'owes_you' : balance < 0 ? 'you_owe' : 'settled',
        lastUpdated: friendship.balance.lastUpdated
      },
      stats: {
        totalSharedTransactions: sharedTransactions.length,
        totalSettlements: settlements.length,
        confirmedSettlements: settlements.filter(s => s.status === 'confirmed').length
      }
    };
  }

  /**
   * Calculate balance between two users
   * @param {string} userId1 - First user ID
   * @param {string} userId2 - Second user ID
   * @returns {Promise<number>} - Balance (positive: user2 owes user1, negative: user1 owes user2)
   */
  static async calculateBalance(userId1, userId2) {
    // Get balance from shared transactions
    const transactionBalance = await Transaction.calculateBalanceBetweenUsers(userId1, userId2);
    
    // Get confirmed settlements
    const settlements = await Settlement.getBetweenUsers(userId1, userId2, { status: 'confirmed' });
    
    // Calculate settlement adjustments
    let settlementAdjustment = 0;
    settlements.forEach(settlement => {
      if (settlement.payer._id.toString() === userId1.toString()) {
        // User1 paid user2, so reduce what user2 owes user1
        settlementAdjustment -= settlement.amount;
      } else {
        // User2 paid user1, so reduce what user1 owes user2
        settlementAdjustment += settlement.amount;
      }
    });

    return transactionBalance + settlementAdjustment;
  }

  /**
   * Update cached balance in friendship
   * @param {string} userId1 - First user ID
   * @param {string} userId2 - Second user ID
   * @returns {Promise<Object>} - Updated friendship
   */
  static async updateCachedBalance(userId1, userId2) {
    const friendship = await Friendship.findBetweenUsers(userId1, userId2);
    
    if (!friendship) {
      throw new Error('Friendship not found');
    }

    const balance = await this.calculateBalance(userId1, userId2);
    
    // Determine direction based on friendship structure
    const isUser1Requester = friendship.requester.toString() === userId1.toString();
    
    let direction = 'settled';
    let amount = 0;
    
    if (Math.abs(balance) > 0.01) {
      amount = Math.abs(balance);
      
      if (balance > 0) {
        // User2 owes User1
        direction = isUser1Requester ? 'recipient_owes' : 'requester_owes';
      } else {
        // User1 owes User2
        direction = isUser1Requester ? 'requester_owes' : 'recipient_owes';
      }
    }

    return friendship.updateBalance(amount, direction);
  }

  /**
   * Remove friend (archive friendship)
   * @param {string} userId - ID of user removing the friend
   * @param {string} friendId - ID of friend to remove
   * @returns {Promise<Object>} - Archived friendship
   */
  static async removeFriend(userId, friendId) {
    const friendship = await Friendship.findBetweenUsers(userId, friendId);
    
    if (!friendship) {
      throw new Error('Friendship not found');
    }

    if (friendship.status !== 'accepted') {
      throw new Error('Users are not friends');
    }

    // Check for unsettled balance
    if (Math.abs(friendship.balance.amount) > 0.01) {
      throw new Error('Cannot remove friend with unsettled balance. Please settle all expenses first.');
    }

    return friendship.archive();
  }

  /**
   * Get pending friend requests for a user
   * @param {string} userId - ID of the user
   * @returns {Promise<Object>} - Incoming and outgoing requests
   */
  static async getPendingRequests(userId) {
    const incoming = await Friendship.getPendingRequests(userId);
    const outgoing = await Friendship.getSentRequests(userId);

    return {
      incoming: incoming.map(f => ({
        friendshipId: f._id,
        user: {
          _id: f.requester._id,
          uid: f.requester.uid,
          name: f.requester.name,
          email: f.requester.email,
          profilePicture: f.requester.profilePicture
        },
        requestedAt: f.requestedAt
      })),
      outgoing: outgoing.map(f => ({
        friendshipId: f._id,
        user: {
          _id: f.recipient._id,
          uid: f.recipient.uid,
          name: f.recipient.name,
          email: f.recipient.email,
          profilePicture: f.recipient.profilePicture
        },
        requestedAt: f.requestedAt
      }))
    };
  }
}

module.exports = FriendService;
