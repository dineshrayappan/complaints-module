const express = require('express');
const router = express.Router();
const {
  login,
  register,
  getMe,
  getDemoUsers,
  switchDemoUser,
} = require('../controllers/authController');
const { verifyToken } = require('../middleware/auth');

router.post('/login', login);
router.post('/register', register);
router.get('/me', verifyToken, getMe);
router.get('/demo-users', getDemoUsers);
router.post('/switch-demo', switchDemoUser);

module.exports = router;
