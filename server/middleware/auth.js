const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const User = require('../models/User');
const mockStore = require('../config/mockStore');

const verifyToken = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      token = req.headers.authorization.split(' ')[1];

      // 1. Support client-side mock tokens (used in offline/demo fallback mode)
      if (token.startsWith('mock-token-')) {
        const parts = token.split('-');
        const role = parts[2] || 'AUDITOR';
        let mockUser = mockStore.getUsers().find((u) => u.role === role);
        if (!mockUser) {
          mockUser = mockStore.getUsers()[0];
        }
        req.user = mockUser;
        return next();
      }

      // 2. Verify JWT token
      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || 'garment_qms_super_secret_jwt_key_2026_sewing_audit'
      );

      let user = null;

      // Try database lookup if MongoDB is connected and ID is valid ObjectId
      if (mongoose.connection.readyState === 1 && mongoose.Types.ObjectId.isValid(decoded.id)) {
        user = await User.findById(decoded.id).select('-password');
      }

      // Try mockStore lookup by ID or employeeId
      if (!user) {
        user =
          mockStore.findUserById(decoded.id) ||
          mockStore.getUsers().find(
            (u) => u.employeeId === decoded.id || u._id === decoded.id || u.email === decoded.id
          );
      }

      // Try secondary database lookup by employeeId or email
      if (!user && mongoose.connection.readyState === 1) {
        user = await User.findOne({
          $or: [{ employeeId: decoded.id }, { email: decoded.id }],
        }).select('-password');
      }

      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'User account associated with this token no longer exists.',
        });
      }

      if (user.isActive === false) {
        return res.status(403).json({
          success: false,
          message: 'This user account is currently deactivated.',
        });
      }

      req.user = user;
      next();
    } catch (err) {
      console.error('[AuthMiddleware] Token verification failed:', err.message);
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired authentication token. Please sign in again.',
      });
    }
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Authentication token missing. Please sign in to access this resource.',
    });
  }
};

// Role-based Access Control Middleware
const requireRole = (allowedRoles = []) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required before role check.',
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Role '${req.user.role}' is not authorized to perform this operation. Allowed: [${allowedRoles.join(', ')}]`,
      });
    }

    next();
  };
};

module.exports = { verifyToken, requireRole };
