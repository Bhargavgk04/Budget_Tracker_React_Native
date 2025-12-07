const jwt = require('jsonwebtoken');
const User = require('../models/User');

const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.header('Authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (process.env.NODE_ENV === 'production') {
      console.log('Auth Debug - Request headers:', Object.keys(req.headers));
      console.log('Auth Debug - Authorization header:', authHeader ? 'Present' : 'Missing');
      console.log('Auth Debug - Token extracted:', token ? 'Yes' : 'No');
      console.log('Auth Debug - JWT_SECRET exists:', !!process.env.JWT_SECRET);
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'No token, authorization denied'
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    if (process.env.NODE_ENV === 'production') {
      console.log('Auth Debug - Token verified, user ID:', decoded.id);
    }
    
    // Get user from database
    const user = await User.findById(decoded.id).select('-password');
    
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Token is not valid - user not found'
      });
    }

    if (process.env.NODE_ENV === 'production') {
      console.log('Auth Debug - User found:', user.email);
    }

    // Add user to request
    req.user = user;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        error: 'Token expired - please login again'
      });
    }
    
    if (error.name === 'JsonWebTokenError') {
      if (process.env.NODE_ENV === 'production') {
        console.log('Auth Debug - JWT verification failed - possible secret mismatch');
      }
      return res.status(401).json({
        success: false,
        error: 'Invalid token - please login again'
      });
    }

    res.status(500).json({
      success: false,
      error: 'Server error in authentication'
    });
  }
};

module.exports = authMiddleware;