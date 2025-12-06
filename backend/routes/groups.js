const express = require('express');
const router = express.Router();
const GroupService = require('../services/GroupService');

/**
 * @route   POST /api/groups
 * @desc    Create a new group
 * @access  Private
 */
router.post('/', async (req, res) => {
  try {
    const { name, type, memberIds, description } = req.body;
    const createdBy = req.user.id;

    if (!name) {
      return res.status(400).json({
        success: false,
        error: 'Group name is required'
      });
    }

    if (!type) {
      return res.status(400).json({
        success: false,
        error: 'Group type is required'
      });
    }

    if (!memberIds || memberIds.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'At least one member is required'
      });
    }

    const group = await GroupService.createGroup(name, type, createdBy, memberIds, description);

    res.status(201).json({
      success: true,
      data: group,
      message: 'Group created successfully'
    });
  } catch (error) {
    console.error('Create group error:', error);
    
    if (error.message.includes('not found') || error.message.includes('required')) {
      return res.status(400).json({
        success: false,
        error: error.message
      });
    }

    res.status(500).json({
      success: false,
      error: error.message || 'Failed to create group'
    });
  }
});

/**
 * @route   GET /api/groups
 * @desc    Get user's groups
 * @access  Private
 */
router.get('/', async (req, res) => {
  try {
    const userId = req.user.id;
    const { isActive, isSettled, type } = req.query;

    const filters = {};
    if (isActive !== undefined) filters.isActive = isActive === 'true';
    if (isSettled !== undefined) filters.isSettled = isSettled === 'true';
    if (type) filters.type = type;

    const groups = await GroupService.getUserGroups(userId, filters);

    res.json({
      success: true,
      data: groups,
      count: groups.length
    });
  } catch (error) {
    console.error('Get groups error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get groups'
    });
  }
});

/**
 * @route   GET /api/groups/:id
 * @desc    Get group details
 * @access  Private
 */
router.get('/:id', async (req, res) => {
  try {
    const groupId = req.params.id;
    const userId = req.user.id;

    const group = await GroupService.getGroupDetails(groupId, userId);

    res.json({
      success: true,
      data: group
    });
  } catch (error) {
    console.error('Get group details error:', error);
    
    if (error.message.includes('not found')) {
      return res.status(404).json({
        success: false,
        error: error.message
      });
    }
    
    if (error.message.includes('Access denied')) {
      return res.status(403).json({
        success: false,
        error: error.message
      });
    }

    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get group details'
    });
  }
});

/**
 * @route   PUT /api/groups/:id
 * @desc    Update group details
 * @access  Private
 */
router.put('/:id', async (req, res) => {
  try {
    const groupId = req.params.id;
    const userId = req.user.id;
    const updates = req.body;

    const group = await GroupService.updateGroup(groupId, userId, updates);

    res.json({
      success: true,
      data: group,
      message: 'Group updated successfully'
    });
  } catch (error) {
    console.error('Update group error:', error);
    
    if (error.message.includes('not found')) {
      return res.status(404).json({
        success: false,
        error: error.message
      });
    }
    
    if (error.message.includes('Only group admins')) {
      return res.status(403).json({
        success: false,
        error: error.message
      });
    }

    res.status(500).json({
      success: false,
      error: error.message || 'Failed to update group'
    });
  }
});

/**
 * @route   DELETE /api/groups/:id
 * @desc    Delete/deactivate group
 * @access  Private
 */
router.delete('/:id', async (req, res) => {
  try {
    const groupId = req.params.id;
    const userId = req.user.id;

    const group = await GroupService.deleteGroup(groupId, userId);

    res.json({
      success: true,
      data: group,
      message: 'Group deleted successfully'
    });
  } catch (error) {
    console.error('Delete group error:', error);
    
    if (error.message.includes('not found')) {
      return res.status(404).json({
        success: false,
        error: error.message
      });
    }
    
    if (error.message.includes('Only the group creator') || error.message.includes('unsettled')) {
      return res.status(403).json({
        success: false,
        error: error.message
      });
    }

    res.status(500).json({
      success: false,
      error: error.message || 'Failed to delete group'
    });
  }
});

/**
 * @route   POST /api/groups/:id/members
 * @desc    Add member to group
 * @access  Private
 */
router.post('/:id/members', async (req, res) => {
  try {
    const groupId = req.params.id;
    const { userId: memberUserId } = req.body;
    const addedBy = req.user.id;

    if (!memberUserId) {
      return res.status(400).json({
        success: false,
        error: 'User ID is required'
      });
    }

    const group = await GroupService.addMember(groupId, memberUserId, addedBy);

    res.json({
      success: true,
      data: group,
      message: 'Member added successfully'
    });
  } catch (error) {
    console.error('Add member error:', error);
    
    if (error.message.includes('not found')) {
      return res.status(404).json({
        success: false,
        error: error.message
      });
    }
    
    if (error.message.includes('Only group admins') || error.message.includes('already a member')) {
      return res.status(403).json({
        success: false,
        error: error.message
      });
    }

    res.status(500).json({
      success: false,
      error: error.message || 'Failed to add member'
    });
  }
});

/**
 * @route   DELETE /api/groups/:id/members/:userId
 * @desc    Remove member from group
 * @access  Private
 */
router.delete('/:id/members/:userId', async (req, res) => {
  try {
    const groupId = req.params.id;
    const memberUserId = req.params.userId;
    const removedBy = req.user.id;

    const group = await GroupService.removeMember(groupId, memberUserId, removedBy);

    res.json({
      success: true,
      data: group,
      message: 'Member removed successfully'
    });
  } catch (error) {
    console.error('Remove member error:', error);
    
    if (error.message.includes('not found')) {
      return res.status(404).json({
        success: false,
        error: error.message
      });
    }
    
    if (error.message.includes('Only group admins') || error.message.includes('unsettled balance')) {
      return res.status(403).json({
        success: false,
        error: error.message
      });
    }

    res.status(500).json({
      success: false,
      error: error.message || 'Failed to remove member'
    });
  }
});

/**
 * @route   GET /api/groups/:id/expenses
 * @desc    Get group expenses
 * @access  Private
 */
router.get('/:id/expenses', async (req, res) => {
  try {
    const groupId = req.params.id;
    const userId = req.user.id;
    const { startDate, endDate, category } = req.query;

    const filters = {};
    if (startDate) filters.startDate = new Date(startDate);
    if (endDate) filters.endDate = new Date(endDate);
    if (category) filters.category = category;

    const expenses = await GroupService.getGroupExpenses(groupId, userId, filters);

    res.json({
      success: true,
      data: expenses,
      count: expenses.length
    });
  } catch (error) {
    console.error('Get group expenses error:', error);
    
    if (error.message.includes('not found')) {
      return res.status(404).json({
        success: false,
        error: error.message
      });
    }
    
    if (error.message.includes('Access denied')) {
      return res.status(403).json({
        success: false,
        error: error.message
      });
    }

    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get group expenses'
    });
  }
});

/**
 * @route   GET /api/groups/:id/balances
 * @desc    Get group balances
 * @access  Private
 */
router.get('/:id/balances', async (req, res) => {
  try {
    const groupId = req.params.id;
    const userId = req.user.id;

    // First check if user is a member
    const group = await GroupService.getGroupDetails(groupId, userId);
    
    // Calculate current balances
    const balances = await GroupService.calculateGroupBalances(groupId);

    res.json({
      success: true,
      data: {
        groupId,
        balances,
        cachedBalances: group.balances
      }
    });
  } catch (error) {
    console.error('Get group balances error:', error);
    
    if (error.message.includes('not found')) {
      return res.status(404).json({
        success: false,
        error: error.message
      });
    }
    
    if (error.message.includes('Access denied')) {
      return res.status(403).json({
        success: false,
        error: error.message
      });
    }

    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get group balances'
    });
  }
});

/**
 * @route   POST /api/groups/:id/settle
 * @desc    Mark group as settled
 * @access  Private
 */
router.post('/:id/settle', async (req, res) => {
  try {
    const groupId = req.params.id;
    const userId = req.user.id;

    const group = await GroupService.markGroupSettled(groupId, userId);

    res.json({
      success: true,
      data: group,
      message: 'Group marked as settled'
    });
  } catch (error) {
    console.error('Mark group settled error:', error);
    
    if (error.message.includes('not found')) {
      return res.status(404).json({
        success: false,
        error: error.message
      });
    }
    
    if (error.message.includes('Only group admins') || error.message.includes('outstanding balances')) {
      return res.status(403).json({
        success: false,
        error: error.message
      });
    }

    res.status(500).json({
      success: false,
      error: error.message || 'Failed to mark group as settled'
    });
  }
});

/**
 * @route   POST /api/groups/:id/balances/update
 * @desc    Update cached group balances
 * @access  Private
 */
router.post('/:id/balances/update', async (req, res) => {
  try {
    const groupId = req.params.id;
    const userId = req.user.id;

    // Check if user is a member
    const groupDetails = await GroupService.getGroupDetails(groupId, userId);
    
    const group = await GroupService.updateGroupBalances(groupId);

    res.json({
      success: true,
      data: group,
      message: 'Group balances updated successfully'
    });
  } catch (error) {
    console.error('Update group balances error:', error);
    
    if (error.message.includes('not found')) {
      return res.status(404).json({
        success: false,
        error: error.message
      });
    }
    
    if (error.message.includes('Access denied')) {
      return res.status(403).json({
        success: false,
        error: error.message
      });
    }

    res.status(500).json({
      success: false,
      error: error.message || 'Failed to update group balances'
    });
  }
});

module.exports = router;


/**
 * @route   GET /api/groups/:id/simplify
 * @desc    Get simplified settlement plan for group
 * @access  Private
 */
router.get('/:id/simplify', async (req, res) => {
  try {
    const groupId = req.params.id;
    const userId = req.user.id;
    const DebtSimplificationService = require('../services/DebtSimplificationService');

    // Check if user is a member
    const group = await GroupService.getGroupDetails(groupId, userId);

    const simplification = await DebtSimplificationService.getGroupSimplifiedSettlements(groupId);
    const stats = DebtSimplificationService.getSimplificationStats(simplification);

    res.json({
      success: true,
      data: {
        ...simplification,
        stats
      }
    });
  } catch (error) {
    console.error('Get group simplified settlements error:', error);
    
    if (error.message.includes('not found')) {
      return res.status(404).json({
        success: false,
        error: error.message
      });
    }
    
    if (error.message.includes('Access denied')) {
      return res.status(403).json({
        success: false,
        error: error.message
      });
    }

    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get simplified settlements'
    });
  }
});
