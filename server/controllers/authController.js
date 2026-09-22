const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const User = require('../models/User');
const mockStore = require('../config/mockStore');

const generateToken = (id) => {
  return jwt.sign(
    { id },
    process.env.JWT_SECRET || 'garment_qms_super_secret_jwt_key_2026_sewing_audit',
    {
      expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    }
  );
};

// @desc    Sign in user with email or employeeId & password
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res) => {
  try {
    const { identifier, email, employeeId, password, expectedRole } = req.body;
    const queryIdentifier = (identifier || email || employeeId || '').trim();

    if (!queryIdentifier || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both an Email/Employee ID and password.',
      });
    }

    let mappedIdentifier = queryIdentifier;
    const lowerId = queryIdentifier.toLowerCase();
    if (lowerId === 'admin') mappedIdentifier = 'ADM-001';
    else if (lowerId === 'auditor') mappedIdentifier = 'AUD-001';
    else if (lowerId === 'supervisor') mappedIdentifier = 'SUP-101';

    // Verify role passwords helper
    const checkRolePassword = (userRole, inputPassword) => {
      if (inputPassword === 'Password123!') return true;
      if (userRole === 'ADMIN' && (inputPassword === 'Admin@123' || inputPassword === 'admin123')) return true;
      if (userRole === 'AUDITOR' && (inputPassword === 'Auditor@123' || inputPassword === 'auditor123')) return true;
      if ((userRole === 'ACTION_PERSON' || userRole === 'SUPERVISOR') && (inputPassword === 'Supervisor@123' || inputPassword === 'supervisor123')) return true;
      return false;
    };

    // Fallback store when MongoDB is not connected
    if (mongoose.connection.readyState !== 1) {
      const user = mockStore.findUserByIdentifier(mappedIdentifier) || mockStore.findUserByIdentifier(queryIdentifier);
      const isRolePwdMatch = user && checkRolePassword(user.role, password);
      if (!user || (!isRolePwdMatch && user.password !== password)) {
        return res.status(401).json({
          success: false,
          message: 'Invalid credentials. User not found or incorrect password.',
        });
      }
      const token = generateToken(user._id);
      return res.status(200).json({
        success: true,
        token,
        user: {
          _id: user._id,
          employeeId: user.employeeId,
          name: user.name,
          email: user.email,
          role: user.role,
          department: user.department,
          designation: user.designation,
          mobileNumber: user.mobileNumber,
        },
      });
    }

    const user = await User.findOne({
      $or: [
        { email: mappedIdentifier.toLowerCase() },
        { employeeId: mappedIdentifier.toUpperCase() },
        { email: queryIdentifier.toLowerCase() },
        { employeeId: queryIdentifier.toUpperCase() },
      ],
    }).select('+password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials. User not found.',
      });
    }

    const isMatch = checkRolePassword(user.role, password) || (await user.matchPassword(password));
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials. Incorrect password.',
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'This account has been deactivated.',
      });
    }

    // Optional Role Validation for separate portals
    if (expectedRole) {
      const isAdminPortal = expectedRole === 'ADMIN';
      const isAuditorPortal = expectedRole === 'AUDITOR';
      const isSupervisorPortal = expectedRole === 'SUPERVISOR' || expectedRole === 'ACTION_PERSON';

      if (isAdminPortal && user.role !== 'ADMIN') {
        return res.status(400).json({
          success: false,
          message: `This account (${user.name}) does not have Executive Administrator privileges. Please switch to the ${user.role === 'AUDITOR' ? 'Auditor' : 'Supervisor'} Login portal.`,
        });
      }

      if (isAuditorPortal && user.role !== 'AUDITOR') {
        return res.status(400).json({
          success: false,
          message: `This account (${user.name}) is registered as a ${user.role === 'ADMIN' ? 'System Administrator' : 'Line Supervisor'}. Please switch to the corresponding login tab.`,
        });
      }

      if (isSupervisorPortal && user.role !== 'ACTION_PERSON' && user.role !== 'SUPERVISOR') {
        return res.status(400).json({
          success: false,
          message: `This account (${user.name}) is registered as a ${user.role === 'ADMIN' ? 'System Administrator' : 'Internal Auditor'}. Please switch to the corresponding login tab.`,
        });
      }
    }

    const token = generateToken(user._id);

    res.status(200).json({
      success: true,
      token,
      user: {
        _id: user._id,
        employeeId: user.employeeId,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        designation: user.designation,
        mobileNumber: user.mobileNumber,
      },
    });
  } catch (error) {
    console.error('[AuthController:login] Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during authentication.',
      error: error.message,
    });
  }
};

// @desc    Register a new user (Auditor or Line Supervisor)
// @route   POST /api/auth/register
// @access  Public
const register = async (req, res) => {
  try {
    const {
      employeeId,
      name,
      email,
      password,
      role = 'ACTION_PERSON',
      department,
      designation,
      mobileNumber,
    } = req.body;

    if (!employeeId || !name || !email || !password || !department || !designation || !mobileNumber) {
      return res.status(400).json({
        success: false,
        message: 'All fields (Employee ID, Full Name, Email, Password, Department, Designation, Mobile Number) are mandatory.',
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long.',
      });
    }

    let normalizedRole = 'ACTION_PERSON';
    if (role === 'ADMIN') {
      normalizedRole = 'ADMIN';
    } else if (role === 'AUDITOR') {
      normalizedRole = 'AUDITOR';
    }

    if (mongoose.connection.readyState !== 1) {
      const newUser = mockStore.createUser({
        employeeId: employeeId.toUpperCase().trim(),
        name: name.trim(),
        email: email.toLowerCase().trim(),
        password,
        role: normalizedRole,
        department: department.trim(),
        designation: designation.trim(),
        mobileNumber: mobileNumber.trim(),
      });
      const token = generateToken(newUser._id);
      return res.status(201).json({
        success: true,
        message: `Account registered successfully as ${normalizedRole === 'AUDITOR' ? 'Quality Auditor' : 'Line Supervisor'}.`,
        token,
        user: newUser,
      });
    }

    // Check if employeeId or email already exists
    const existing = await User.findOne({
      $or: [
        { email: email.toLowerCase().trim() },
        { employeeId: employeeId.toUpperCase().trim() },
      ],
    });

    if (existing) {
      const isEmail = existing.email === email.toLowerCase().trim();
      return res.status(400).json({
        success: false,
        message: isEmail
          ? 'An account with this email address already exists.'
          : 'An account with this Employee ID already exists.',
      });
    }

    const newUser = await User.create({
      employeeId: employeeId.toUpperCase().trim(),
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password,
      role: normalizedRole,
      department: department.trim(),
      designation: designation.trim(),
      mobileNumber: mobileNumber.trim(),
      isActive: true,
    });

    const token = generateToken(newUser._id);

    res.status(201).json({
      success: true,
      message: `Account registered successfully as ${normalizedRole === 'AUDITOR' ? 'Quality Auditor' : 'Line Supervisor'}.`,
      token,
      user: {
        _id: newUser._id,
        employeeId: newUser.employeeId,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        department: newUser.department,
        designation: newUser.designation,
        mobileNumber: newUser.mobileNumber,
      },
    });
  } catch (error) {
    console.error('[AuthController:register] Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during user registration.',
      error: error.message,
    });
  }
};

// @desc    Get currently authenticated user
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      const user = mockStore.findUserById(req.user?._id || req.user?.id);
      return res.status(200).json({
        success: true,
        user: user || req.user,
      });
    }

    const user = await User.findById(req.user._id);
    res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve user profile.',
      error: error.message,
    });
  }
};

// @desc    Get available demo users for quick role switching
// @route   GET /api/auth/demo-users
// @access  Public
const getDemoUsers = async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(200).json({
        success: true,
        users: mockStore.getUsers(),
      });
    }

    // Ensure default Admin user exists in database
    let admin = await User.findOne({ role: 'ADMIN' });
    if (!admin) {
      await User.create({
        employeeId: 'ADM-001',
        name: 'Anil Mehta',
        email: 'admin@factory.com',
        password: 'Password123!',
        role: 'ADMIN',
        department: 'Plant Operations & Executive Oversight',
        designation: 'General Operations Director',
        mobileNumber: '+91 98000 11223',
        isActive: true,
      });
    }

    const users = await User.find({ isActive: true }).sort({ role: 1, employeeId: 1 });
    res.status(200).json({
      success: true,
      users,
    });
  } catch (error) {
    console.warn('[AuthController:getDemoUsers] Using fallback store due to DB error:', error.message);
    res.status(200).json({
      success: true,
      users: mockStore.getUsers(),
    });
  }
};

// @desc    Quick demo role switch (generates token directly for testing)
// @route   POST /api/auth/switch-demo
// @access  Public
const switchDemoUser = async (req, res) => {
  try {
    const { userId } = req.body;

    if (mongoose.connection.readyState !== 1) {
      const user = mockStore.findUserById(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'Demo user not found.',
        });
      }
      const token = generateToken(user._id);
      return res.status(200).json({
        success: true,
        token,
        user,
      });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Demo user not found.',
      });
    }

    const token = generateToken(user._id);

    res.status(200).json({
      success: true,
      token,
      user,
    });
  } catch (error) {
    const fallbackUser = mockStore.findUserById(req.body.userId);
    if (fallbackUser) {
      const token = generateToken(fallbackUser._id);
      return res.status(200).json({ success: true, token, user: fallbackUser });
    }
    res.status(500).json({
      success: false,
      message: 'Error switching demo user.',
      error: error.message,
    });
  }
};

module.exports = {
  login,
  register,
  getMe,
  getDemoUsers,
  switchDemoUser,
};
