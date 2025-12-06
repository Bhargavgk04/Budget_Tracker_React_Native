const express = require('express');
const router = express.Router();
const SplitService = require('../services/SplitService');

/**
 * @route   POST /api/transactions/:id/split
 * @desc    Add split to a transaction
 * @access  Private
 */
router.post('/:id/split', async (req, res) => {
  try {
    const transactionId = req.params.id;
    const { splitType, participants, paidBy, groupId } = req.body;
    const userId = req.user.id;

    // Validate required fields
    if (!splitType) {
      return res.status(400).json({
        success: false,
        error: 'Split type is required'
      });
    }

    if (!participants || participants.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'At least one participant is required'
      });
    }

    if (!paidBy) {
      return res.status(400).json({
        success: false,
        error: 'paidBy is required'
      });
    }

    const splitConfig = {
      splitType,
      participants,
      paidBy,
      groupId
    };

    const transaction = await SplitService.createSplit(transactionId, splitConfig);

    res.status(201).json({
      success: true,
      data: transaction,
      message: 'Split created successfully'
    });
  } catch (error) {
    console.error('Create split error:', error);
    
    if (error.message.includes('not found')) {
      return res.status(404).json({
        success: false,
        error: error.message
      });
    }
    
    if (error.message.includes('validation failed') || error.message.includes('must')) {
      return res.status(400).json({
        success: false,
        error: error.message
      });
    }

    res.status(500).json({
      success: false,
      error: error.message || 'Failed to create split'
    });
  }
});

/**
 * @route   PUT /api/transactions/:id/split
 * @desc    Update split on a transaction
 * @access  Private
 */
router.put('/:id/split', async (req, res) => {
  try {
    const transactionId = req.params.id;
    const { splitType, participants } = req.body;
    const userId = req.user.id;

    // Validate required fields
    if (!splitType) {
      return res.status(400).json({
        success: false,
        error: 'Split type is required'
      });
    }

    if (!participants || participants.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'At least one participant is required'
      });
    }

    const splitConfig = {
      splitType,
      participants
    };

    const transaction = await SplitService.updateSplit(transactionId, splitConfig);

    res.json({
      success: true,
      data: transaction,
      message: 'Split updated successfully'
    });
  } catch (error) {
    console.error('Update split error:', error);
    
    if (error.message.includes('not found')) {
      return res.status(404).json({
        success: false,
        error: error.message
      });
    }
    
    if (error.message.includes('validation failed') || error.message.includes('must')) {
      return res.status(400).json({
        success: false,
        error: error.message
      });
    }

    res.status(500).json({
      success: false,
      error: error.message || 'Failed to update split'
    });
  }
});

/**
 * @route   DELETE /api/transactions/:id/split
 * @desc    Remove split from a transaction
 * @access  Private
 */
router.delete('/:id/split', async (req, res) => {
  try {
    const transactionId = req.params.id;
    const userId = req.user.id;

    const transaction = await SplitService.removeSplit(transactionId);

    res.json({
      success: true,
      data: transaction,
      message: 'Split removed successfully'
    });
  } catch (error) {
    console.error('Remove split error:', error);
    
    if (error.message.includes('not found')) {
      return res.status(404).json({
        success: false,
        error: error.message
      });
    }

    res.status(500).json({
      success: false,
      error: error.message || 'Failed to remove split'
    });
  }
});

/**
 * @route   POST /api/transactions/:id/split/settle/:userId
 * @desc    Mark participant as settled in a split
 * @access  Private
 */
router.post('/:id/split/settle/:userId', async (req, res) => {
  try {
    const transactionId = req.params.id;
    const userIdToSettle = req.params.userId;
    const currentUserId = req.user.id;

    const transaction = await SplitService.markParticipantSettled(transactionId, userIdToSettle);

    res.json({
      success: true,
      data: transaction,
      message: 'Participant marked as settled'
    });
  } catch (error) {
    console.error('Mark participant settled error:', error);
    
    if (error.message.includes('not found')) {
      return res.status(404).json({
        success: false,
        error: error.message
      });
    }
    
    if (error.message.includes('not a participant')) {
      return res.status(400).json({
        success: false,
        error: error.message
      });
    }

    res.status(500).json({
      success: false,
      error: error.message || 'Failed to mark participant as settled'
    });
  }
});

/**
 * @route   GET /api/transactions/shared
 * @desc    Get shared transactions for current user
 * @access  Private
 */
router.get('/shared', async (req, res) => {
  try {
    const userId = req.user.id;
    const { startDate, endDate, groupId, category } = req.query;

    const filters = {};
    if (startDate) filters.startDate = new Date(startDate);
    if (endDate) filters.endDate = new Date(endDate);
    if (groupId) filters.groupId = groupId;
    if (category) filters.category = category;

    const transactions = await SplitService.getSharedTransactions(userId, filters);

    res.json({
      success: true,
      data: transactions,
      count: transactions.length
    });
  } catch (error) {
    console.error('Get shared transactions error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get shared transactions'
    });
  }
});

module.exports = router;
