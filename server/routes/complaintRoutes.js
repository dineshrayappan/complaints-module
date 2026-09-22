const express = require('express');
const router = express.Router();
const {
  createComplaint,
  getComplaints,
  getComplaintById,
  markInProgress,
  submitAction,
  verifyComplaint,
  addTimelineComment,
  getKpiStats,
  getAdminOversightStats,
  reassignComplaint,
} = require('../controllers/complaintController');
const { verifyToken, requireRole } = require('../middleware/auth');
const upload = require('../middleware/upload');

// Admin executive oversight & monitoring endpoint (must be declared before :id)
router.get('/admin/oversight', verifyToken, requireRole(['ADMIN', 'AUDITOR']), getAdminOversightStats);

// KPI Stats endpoint (must be declared before :id)
router.get('/stats/kpi', verifyToken, getKpiStats);

// Complaints CRUD & List
router.get('/', verifyToken, getComplaints);
router.get('/:id', verifyToken, getComplaintById);

// Create Complaint (AUDITOR or ADMIN role strictly enforced + Multer file upload for Before Photo)
router.post(
  '/',
  verifyToken,
  requireRole(['AUDITOR', 'ADMIN']),
  upload.single('beforePhoto'),
  createComplaint
);

// Reassign task to a different supervisor (AUDITOR or ADMIN)
router.patch(
  '/:id/reassign',
  verifyToken,
  requireRole(['AUDITOR', 'ADMIN']),
  reassignComplaint
);

// Update status to In Progress (Action Person, Supervisor, Auditor, or Admin)
router.patch('/:id/in-progress', verifyToken, markInProgress);

// Submit Action Resolution (ACTION_PERSON or SUPERVISOR role strictly enforced + Multer file upload for After Photo)
router.post(
  '/:id/submit-action',
  verifyToken,
  requireRole(['ACTION_PERSON', 'SUPERVISOR']),
  upload.single('afterPhoto'),
  submitAction
);

// Audit Verification Gateway: Approve & Close OR Reject & Return (AUDITOR or ADMIN)
router.post(
  '/:id/verify',
  verifyToken,
  requireRole(['AUDITOR', 'ADMIN']),
  verifyComplaint
);

// Direct timeline remarks / communication thread
router.post('/:id/timeline', verifyToken, addTimelineComment);

module.exports = router;
