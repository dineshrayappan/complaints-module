const express = require('express');
const router = express.Router();
const {
  getLineSupervisors,
  getAllUsers,
  createUser,
  updateUser,
  resetUserPassword,
  toggleUserStatus,
} = require('../controllers/userController');
const { verifyToken, requireRole } = require('../middleware/auth');

// Line In-Charges master contact list (for assignment dropdown)
router.get('/line-supervisors', verifyToken, getLineSupervisors);

// Users Directory (Admin and internal authenticated users)
router.get('/', verifyToken, getAllUsers);

// Admin-Only User & Credential Management
router.post('/', verifyToken, requireRole(['ADMIN']), createUser);
router.put('/:id', verifyToken, requireRole(['ADMIN']), updateUser);
router.patch('/:id/reset-password', verifyToken, requireRole(['ADMIN']), resetUserPassword);
router.patch('/:id/toggle-status', verifyToken, requireRole(['ADMIN']), toggleUserStatus);

module.exports = router;
