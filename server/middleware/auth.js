const jwt = require('jsonwebtoken');
const { supabase, isSupabaseConfigured } = require('../config/supabase');
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

      // Try Supabase lookup if configured
      if (isSupabaseConfigured && supabase) {
        try {
          const { data, error } = await supabase
            .from('users')
            .select('*')
            .or(`id.eq.${decoded.id},employeeId.eq.${decoded.id},email.eq.${decoded.id}`)
            .limit(1)
            .maybeSingle();

          if (!error && data) {
            user = { ...data, _id: data.id };
            delete user.password;
          }
        } catch (dbErr) {
          console.warn('[AuthMiddleware] Supabase query notice:', dbErr.message);
        }
      }

      // Fallback to mockStore
      if (!user) {
        user =
          mockStore.findUserById(decoded.id) ||
          mockStore.getUsers().find(
            (u) => u.employeeId === decoded.id || u._id === decoded.id || u.id === decoded.id || u.email === decoded.id
          );
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
