const express = require('express');
const router = express.Router();
const { getTasks, createTask, updateTask, completeTask, deleteTask } = require('../controllers/taskController');
const { verifyToken, requireRole } = require('../middleware/auth');

// List: every authenticated user sees their own tasks; ADMIN/AUDITOR see all.
// Filtering (state, department) is done server-side in the controller.
router.get('/', verifyToken, getTasks);

// Scheduling new recurring work is an audit/admin responsibility.
router.post('/', verifyToken, requireRole(['ADMIN', 'AUDITOR']), createTask);

// Update / complete: controller additionally checks the task is assigned to
// the caller, so a supervisor can act on their own work without being an admin.
router.put('/:id', verifyToken, updateTask);
router.post('/:id/complete', verifyToken, completeTask);

// Deletion is restricted to the same elevated roles as creation.
router.delete('/:id', verifyToken, requireRole(['ADMIN', 'AUDITOR']), deleteTask);

module.exports = router;
