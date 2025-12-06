const express = require('express');
const router = express.Router();
const SettlementService = require('../services/SettlementService');

/**
 * @route   POST /api/settlements
 * @desc    Create a new settlement
 * @access  Private
 */
router.post('/', async (req, res) => {
  try {
    const { recipientId, amount, paymentMethod, notes, date, groupId, relatedTransactions } = req.body;
    const payerId = req.user.id;

    // Validate required fields
    if (!recipientId) {
      return res.status(400).json({
        success: false,
        error: 'Recipient ID is required'
      });
    }

    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Valid amount is required'
      });
    }

    if (!paymentMethod) {
      return res.status(400).json({
        success: false,
        error: 'Payment method is required'
      });
    }

    const details = {
      paymentMethod,
      notes,
      date: date ? new Date(date) : undefined,
      groupId,
      relatedTransactions
    };

    const settlement = await SettlementService.createSettlement(payerId, recipientId, amount, details);

    res.status(201).json({
      success: true,
      data: settlement,
      message: 'Settlement created successfully'
    });
  } catch (error) {
    console.error('Create settlement error:', error);
    
    if (error.message.includes('must be friends')) {
      return res.status(403).json({
        success: false,
        error: error.message
      });
    }
    
    if (error.message.includes('required') || error.message.includes('must be')) {
      return res.status(400).json({
        success: false,
        error: error.message
      });
    }

    res.status(500).json({
      success: false,
      error: error.message || 'Failed to create settlement'
    });
  }
});

/**
 * @route   GET /api/settlements
 * @desc    Get settlements for current user with filters
 * @access  Private
 */
router.get('/', async (req, res) => {
  try {
    const userId = req.user.id;
    const { status, startDate, endDate, groupId, friendId } = req.query;

    let settlements;

    if (friendId) {
      // Get settlements between user and specific friend
      const filters = {};
      if (status) filters.status = status;
      if (startDate) filters.startDate = new Date(startDate);
      if (endDate) filters.endDate = new Date(endDate);
      
      settlements = await SettlementService.getSettlements(userId, friendId, filters);
    } else {
      // Get all settlements for user
      const filters = {};
      if (status) filters.status = status;
      if (startDate) filters.startDate = new Date(startDate);
      if (endDate) filters.endDate = new Date(endDate);
      if (groupId) filters.groupId = groupId;
      
      settlements = await SettlementService.getSettlementsForUser(userId, filters);
    }

    res.json({
      success: true,
      data: settlements,
      count: settlements.length
    });
  } catch (error) {
    console.error('Get settlements error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get settlements'
    });
  }
});

/**
 * @route   GET /api/settlements/pending
 * @desc    Get pending settlements for current user
 * @access  Private
 */
router.get('/pending', async (req, res) => {
  try {
    const userId = req.user.id;

    const settlements = await SettlementService.getPendingSettlements(userId);

    res.json({
      success: true,
      data: settlements,
      count: settlements.length
    });
  } catch (error) {
    console.error('Get pending settlements error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get pending settlements'
    });
  }
});

/**
 * @route   GET /api/settlements/:id
 * @desc    Get settlement details
 * @access  Private
 */
router.get('/:id', async (req, res) => {
  try {
    const Settlement = require('../models/Settlement');
    const settlementId = req.params.id;
    const userId = req.user.id;

    const settlement = await Settlement.findById(settlementId)
      .populate('payer', 'uid name email profilePicture')
      .populate('recipient', 'uid name email profilePicture')
      .populate('confirmedBy', 'uid name')
      .populate('groupId', 'name type');

    if (!settlement) {
      return res.status(404).json({
        success: false,
        error: 'Settlement not found'
      });
    }

    // Check if user is involved
    if (!settlement.involvesUser(userId)) {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }

    res.json({
      success: true,
      data: settlement
    });
  } catch (error) {
    console.error('Get settlement details error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get settlement details'
    });
  }
});

/**
 * @route   POST /api/settlements/:id/confirm
 * @desc    Confirm a settlement
 * @access  Private
 */
router.post('/:id/confirm', async (req, res) => {
  try {
    const settlementId = req.params.id;
    const userId = req.user.id;

    const settlement = await SettlementService.confirmSettlement(settlementId, userId);

    res.json({
      success: true,
      data: settlement,
      message: 'Settlement confirmed successfully'
    });
  } catch (error) {
    console.error('Confirm settlement error:', error);
    
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
      error: error.message || 'Failed to confirm settlement'
    });
  }
});

/**
 * @route   POST /api/settlements/:id/dispute
 * @desc    Dispute a settlement
 * @access  Private
 */
router.post('/:id/dispute', async (req, res) => {
  try {
    const settlementId = req.params.id;
    const userId = req.user.id;
    const { reason } = req.body;

    if (!reason) {
      return res.status(400).json({
        success: false,
        error: 'Dispute reason is required'
      });
    }

    const settlement = await SettlementService.disputeSettlement(settlementId, userId, reason);

    res.json({
      success: true,
      data: settlement,
      message: 'Settlement disputed successfully'
    });
  } catch (error) {
    console.error('Dispute settlement error:', error);
    
    if (error.message.includes('not found')) {
      return res.status(404).json({
        success: false,
        error: error.message
      });
    }
    
    if (error.message.includes('Only involved parties')) {
      return res.status(403).json({
        success: false,
        error: error.message
      });
    }

    res.status(500).json({
      success: false,
      error: error.message || 'Failed to dispute settlement'
    });
  }
});

/**
 * @route   DELETE /api/settlements/:id
 * @desc    Delete a settlement
 * @access  Private
 */
router.delete('/:id', async (req, res) => {
  try {
    const settlementId = req.params.id;
    const userId = req.user.id;

    const settlement = await SettlementService.deleteSettlement(settlementId, userId);

    res.json({
      success: true,
      data: settlement,
      message: 'Settlement deleted successfully'
    });
  } catch (error) {
    console.error('Delete settlement error:', error);
    
    if (error.message.includes('not found')) {
      return res.status(404).json({
        success: false,
        error: error.message
      });
    }
    
    if (error.message.includes('Only involved parties')) {
      return res.status(403).json({
        success: false,
        error: error.message
      });
    }

    res.status(500).json({
      success: false,
      error: error.message || 'Failed to delete settlement'
    });
  }
});

module.exports = router;
