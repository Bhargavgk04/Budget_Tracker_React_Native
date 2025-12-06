const express = require('express');
const User = require('../models/User');
const upload = require('../config/multer.config');
const ImageProcessor = require('../utils/imageProcessor');
const Transaction = require('../models/Transaction');
const Category = require('../models/Category');
const bcrypt = require('bcryptjs');

const router = express.Router();

// @desc    Get user profile
// @route   GET /api/user/profile
// @access  Private
router.get('/profile', async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    
    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Update user profile
// @route   PUT /api/user/profile
// @access  Private
router.put('/profile', async (req, res, next) => {
  try {
    const allowedUpdates = ['name', 'currency', 'preferences'];
    const updates = {};
    
    Object.keys(req.body).forEach(key => {
      if (allowedUpdates.includes(key)) {
        updates[key] = req.body[key];
      }
    });

    const user = await User.findByIdAndUpdate(
      req.user._id,
      updates,
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      data: user,
      message: 'Profile updated successfully'
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Upload profile picture
// @route   POST /api/user/profile/picture
// @access  Private
router.post('/profile/picture', upload.single('profilePicture'), async (req, res, next) => {
  try {
    // Check if file was uploaded
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'Please upload an image file'
      });
    }

    // Validate image
    await ImageProcessor.validateImage(req.file.buffer);

    // Process and save image
    const imageInfo = await ImageProcessor.processProfilePicture(
      req.file.buffer,
      req.file.originalname
    );

    // Get user and delete old profile picture if exists
    const user = await User.findById(req.user._id);
    
    if (user.profilePicture) {
      // Extract filename from old URL and delete
      const oldFilename = user.profilePicture.split('/').pop();
      await ImageProcessor.deleteProfilePicture(oldFilename);
    }

    // Update user profile picture URL
    user.profilePicture = imageInfo.url;
    await user.save();

    res.status(200).json({
      success: true,
      data: {
        profilePicture: imageInfo.url,
        size: imageInfo.size,
        dimensions: imageInfo.dimensions
      },
      message: 'Profile picture uploaded successfully'
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Delete profile picture
// @route   DELETE /api/user/profile/picture
// @access  Private
router.delete('/profile/picture', async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user.profilePicture) {
      return res.status(400).json({
        success: false,
        error: 'No profile picture to delete'
      });
    }

    // Extract filename and delete file
    const filename = user.profilePicture.split('/').pop();
    await ImageProcessor.deleteProfilePicture(filename);

    // Remove profile picture URL from user
    user.profilePicture = null;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Profile picture deleted successfully'
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Get user statistics
// @route   GET /api/user/stats
// @access  Private
router.get('/stats', async (req, res, next) => {
  try {
    // Get user's transactions count
    const transactionCount = await Transaction.countDocuments({ userId: req.user._id });
    
    // Get user's categories count
    const categoryCount = await Category.countDocuments({ userId: req.user._id });
    
    // Get user's budgets count (if budget model exists)
    let budgetCount = 0;
    try {
      const Budget = require('../models/Budget');
      budgetCount = await Budget.countDocuments({ userId: req.user._id });
    } catch (error) {
      // Budget model might not exist yet
      console.log('Budget model not found, setting budget count to 0');
    }

    res.status(200).json({
      success: true,
      data: {
        transactions: transactionCount,
        categories: categoryCount,
        budgets: budgetCount
      }
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Change password
// @route   PUT /api/user/change-password
// @access  Private
router.put('/change-password', async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    // Validate input
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        error: 'Current password and new password are required'
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        error: 'New password must be at least 8 characters long'
      });
    }

    // Get user with password
    const user = await User.findById(req.user._id).select('+password');

    // Check current password
    const isMatch = await user.matchPassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        error: 'Current password is incorrect'
      });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Export user data
// @route   GET /api/user/export
// @access  Private
router.get('/export', async (req, res, next) => {
  try {
    const { format = 'json' } = req.query;
    
    // Get user data
    const user = await User.findById(req.user._id);
    
    // Get user's transactions
    const transactions = await Transaction.find({ userId: req.user._id })
      .populate('categoryId', 'name color')
      .populate('splits.friendId', 'name uid email')
      .sort({ date: -1 });
    
    // Get user's categories
    const categories = await Category.find({ userId: req.user._id });
    
    const exportData = {
      user: {
        name: user.name,
        email: user.email,
        uid: user.uid,
        currency: user.currency,
        preferences: user.preferences,
        createdAt: user.createdAt
      },
      transactions: transactions.map(t => ({
        description: t.description,
        amount: t.amount,
        type: t.type,
        category: t.categoryId?.name || 'Uncategorized',
        date: t.date,
        paymentMode: t.paymentMode,
        notes: t.notes,
        splits: t.splits
      })),
      categories: categories.map(c => ({
        name: c.name,
        color: c.color,
        icon: c.icon,
        type: c.type
      })),
      exportDate: new Date().toISOString(),
      totalTransactions: transactions.length,
      totalCategories: categories.length
    };

    if (format === 'csv') {
      // Convert to CSV format
      const csv = convertToCSV(exportData);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="budget-tracker-export-${Date.now()}.csv"`);
      res.send(csv);
    } else {
      res.json({
        success: true,
        data: exportData
      });
    }
  } catch (error) {
    next(error);
  }
});

// @desc    Delete user account
// @route   DELETE /api/user/account
// @access  Private
router.delete('/account', async (req, res, next) => {
  try {
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({
        success: false,
        error: 'Password is required to delete account'
      });
    }

    // Get user with password
    const user = await User.findById(req.user._id).select('+password');

    // Check password
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        error: 'Password is incorrect'
      });
    }

    // Delete user's profile picture if exists
    if (user.profilePicture) {
      const filename = user.profilePicture.split('/').pop();
      await ImageProcessor.deleteProfilePicture(filename);
    }

    // Delete user's transactions
    await Transaction.deleteMany({ userId: req.user._id });

    // Delete user's categories
    await Category.deleteMany({ userId: req.user._id });

    // Delete user
    await User.findByIdAndDelete(req.user._id);

    res.status(200).json({
      success: true,
      message: 'Account deleted successfully'
    });
  } catch (error) {
    next(error);
  }
});

// Helper function to convert data to CSV
function convertToCSV(data) {
  const csvRows = [];
  
  // User info
  csvRows.push('USER INFORMATION');
  csvRows.push('Name,Email,UID,Currency,Created At');
  csvRows.push(`${data.user.name},${data.user.email},${data.user.uid},${data.user.currency},${data.user.createdAt}`);
  csvRows.push('');
  
  // Transactions
  csvRows.push('TRANSACTIONS');
  csvRows.push('Description,Amount,Type,Category,Date,Payment Mode,Notes');
  data.transactions.forEach(t => {
    csvRows.push(`"${t.description}",${t.amount},${t.type},"${t.category}",${t.date},${t.paymentMode},"${t.notes || ''}"`);
  });
  csvRows.push('');
  
  // Categories
  csvRows.push('CATEGORIES');
  csvRows.push('Name,Color,Icon,Type');
  data.categories.forEach(c => {
    csvRows.push(`${c.name},${c.color},${c.icon},${c.type}`);
  });
  
  return csvRows.join('\n');
}

module.exports = router;