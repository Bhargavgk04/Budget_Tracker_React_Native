const express = require('express');
const router = express.Router();
const FriendService = require('../services/FriendService');
const authMiddleware = require('../middleware/auth');

/**
 * @route   POST /api/friends/search
 * @desc    Search for users by UID, email, or name
 * @access  Private
 */
router.post('/search', authMiddleware, async (req, res) => {
  try {
    const { query } = req.body;
    const userId = req.user.id;

    if (!query) {
      return res.status(400).json({
        success: false,
        error: 'Search query is required'
      });
    }

    const users = await FriendService.searchUsers(query, userId);

    res.json({
      success: true,
      data: users
    });
  } catch (error) {
    console.error('Search users error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to search users'
    });
  }
});

/**
 * @route   POST /api/friends/request
 * @desc    Send a friend request
 * @access  Private
 */
router.post('/request', authMiddleware, async (req, res) => {
  try {
    const { recipientId } = req.body;
    const requesterId = req.user.id;

    if (!recipientId) {
      return res.status(400).json({
        success: false,
        error: 'Recipient ID is required'
      });
    }

    const friendship = await FriendService.sendFriendRequest(requesterId, recipientId);

    res.status(201).json({
      success: true,
      data: friendship,
      message: 'Friend request sent successfully'
    });
  } catch (error) {
    console.error('Send friend request error:', error);
    
    // Handle specific error cases
    if (error.message.includes('already')) {
      return res.status(409).json({
        success: false,
        error: error.message
      });
    }
    
    if (error.message.includes('not found')) {
      return res.status(404).json({
        success: false,
        error: error.message
      });
    }

    res.status(500).json({
      success: false,
      error: error.message || 'Failed to send friend request'
    });
  }
});

/**
 * @route   POST /api/friends/:id/accept
 * @desc    Accept a friend request
 * @access  Private
 */
router.post('/:id/accept', authMiddleware, async (req, res) => {
  try {
    const friendshipId = req.params.id;
    const userId = req.user.id;

    const friendship = await FriendService.acceptFriendRequest(friendshipId, userId);

    res.json({
      success: true,
      data: friendship,
      message: 'Friend request accepted'
    });
  } catch (error) {
    console.error('Accept friend request error:', error);
    
    if (error.message.includes('not found')) {
      return res.status(404).json({
        success: false,
        error: error.message
      });
    }
    
    if (error.message.includes('Only the recipient')) {
      return res.status(403).json({
        success: false,
        error: error.message
      });
    }

    res.status(500).json({
      success: false,
      error: error.message || 'Failed to accept friend request'
    });
  }
});

/**
 * @route   POST /api/friends/:id/decline
 * @desc    Decline a friend request
 * @access  Private
 */
router.post('/:id/decline', authMiddleware, async (req, res) => {
  try {
    const friendshipId = req.params.id;
    const userId = req.user.id;

    const friendship = await FriendService.declineFriendRequest(friendshipId, userId);

    res.json({
      success: true,
      data: friendship,
      message: 'Friend request declined'
    });
  } catch (error) {
    console.error('Decline friend request error:', error);
    
    if (error.message.includes('not found')) {
      return res.status(404).json({
        success: false,
        error: error.message
      });
    }
    
    if (error.message.includes('Only the recipient')) {
      return res.status(403).json({
        success: false,
        error: error.message
      });
    }

    res.status(500).json({
      success: false,
      error: error.message || 'Failed to decline friend request'
    });
  }
});

/**
 * @route   GET /api/friends
 * @desc    Get friend list with balances
 * @access  Private
 */
router.get('/', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const { status, balanceStatus } = req.query;

    const filters = {};
    if (status) filters.status = status;
    if (balanceStatus) filters.balanceStatus = balanceStatus;

    const friends = await FriendService.getFriendList(userId, filters);

    res.json({
      success: true,
      data: friends,
      count: friends.length
    });
  } catch (error) {
    console.error('Get friend list error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get friend list'
    });
  }
});

/**
 * @route   GET /api/friends/requests/pending
 * @desc    Get pending friend requests (incoming and outgoing)
 * @access  Private
 */
router.get('/requests/pending', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;

    const requests = await FriendService.getPendingRequests(userId);

    res.json({
      success: true,
      data: requests
    });
  } catch (error) {
    console.error('Get pending requests error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get pending requests'
    });
  }
});

/**
 * @route   GET /api/friends/:id
 * @desc    Get friend details with balance and transaction info
 * @access  Private
 */
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const friendId = req.params.id;

    const friendDetails = await FriendService.getFriendDetails(userId, friendId);

    res.json({
      success: true,
      data: friendDetails
    });
  } catch (error) {
    console.error('Get friend details error:', error);
    
    if (error.message.includes('not found')) {
      return res.status(404).json({
        success: false,
        error: error.message
      });
    }
    
    if (error.message.includes('not friends')) {
      return res.status(403).json({
        success: false,
        error: error.message
      });
    }

    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get friend details'
    });
  }
});

/**
 * @route   GET /api/friends/:id/balance
 * @desc    Get balance with a specific friend
 * @access  Private
 */
router.get('/:id/balance', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const friendId = req.params.id;

    const balance = await FriendService.calculateBalance(userId, friendId);

    res.json({
      success: true,
      data: {
        balance: Math.abs(balance),
        direction: balance > 0 ? 'owes_you' : balance < 0 ? 'you_owe' : 'settled'
      }
    });
  } catch (error) {
    console.error('Get balance error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get balance'
    });
  }
});

/**
 * @route   DELETE /api/friends/:id
 * @desc    Remove a friend (archive friendship)
 * @access  Private
 */
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const friendId = req.params.id;

    const friendship = await FriendService.removeFriend(userId, friendId);

    res.json({
      success: true,
      data: friendship,
      message: 'Friend removed successfully'
    });
  } catch (error) {
    console.error('Remove friend error:', error);
    
    if (error.message.includes('not found')) {
      return res.status(404).json({
        success: false,
        error: error.message
      });
    }
    
    if (error.message.includes('unsettled balance')) {
      return res.status(400).json({
        success: false,
        error: error.message
      });
    }

    res.status(500).json({
      success: false,
      error: error.message || 'Failed to remove friend'
    });
  }
});

module.exports = router;


/**
 * @route   GET /api/friends/:id/simplify
 * @desc    Get simplified settlement plan with a friend
 * @access  Private
 */
router.get('/:id/simplify', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const friendId = req.params.id;
    const DebtSimplificationService = require('../services/DebtSimplificationService');

    const simplification = await DebtSimplificationService.getSimplifiedSettlements(userId, [friendId]);
    const stats = DebtSimplificationService.getSimplificationStats(simplification);

    res.json({
      success: true,
      data: {
        ...simplification,
        stats
      }
    });
  } catch (error) {
    console.error('Get simplified settlements error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get simplified settlements'
    });
  }
});
