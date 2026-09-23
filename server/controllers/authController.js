const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { supabase, isSupabaseConfigured } = require('../config/supabase');
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

// Verify role passwords helper
const checkRolePassword = (userRole, inputPassword) => {
  if (inputPassword === 'Password123!') return true;
  if (userRole === 'ADMIN' && (inputPassword === 'Admin@123' || inputPassword === 'admin123')) return true;
  if (userRole === 'AUDITOR' && (inputPassword === 'Auditor@123' || inputPassword === 'auditor123')) return true;
  if ((userRole === 'ACTION_PERSON' || userRole === 'SUPERVISOR') && (inputPassword === 'Supervisor@123' || inputPassword === 'supervisor123')) return true;
  return false;
};

// Formats a user row for consistent API response
const formatUserResponse = (user) => {
  if (!user) return null;
  return {
    _id: user.id || user._id,
    id: user.id || user._id,
    employeeId: user.employeeId,
    name: user.name,
    email: user.email,
    role: user.role === 'SUPERVISOR' ? 'ACTION_PERSON' : user.role,
    department: user.department,
    designation: user.designation,
    mobileNumber: user.mobileNumber,
    isActive: typeof user.isActive !== 'undefined' ? user.isActive : true,
  };
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

    // 1. If Supabase is configured, attempt authentication from PostgreSQL
    if (isSupabaseConfigured && supabase) {
      try {
        const { data: users, error } = await supabase
          .from('users')
          .select('*')
          .or(
            `email.ilike.${mappedIdentifier},employeeId.ilike.${mappedIdentifier},email.ilike.${queryIdentifier},employeeId.ilike.${queryIdentifier}`
          )
          .limit(1);

        if (!error && users && users.length > 0) {
          const user = users[0];

          // Check password: role preset match or bcrypt compare
          let isMatch = checkRolePassword(user.role, password);
          if (!isMatch && user.password) {
            if (user.password.startsWith('$2a$') || user.password.startsWith('$2b$')) {
              isMatch = await bcrypt.compare(password, user.password);
            } else {
              isMatch = user.password === password;
            }
          }

          if (!isMatch) {
            return res.status(401).json({
              success: false,
              message: 'Invalid credentials. Incorrect password.',
            });
          }

          if (user.isActive === false) {
            return res.status(403).json({
              success: false,
              message: 'This account has been deactivated.',
            });
          }

          // Role portal validation
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

          const token = generateToken(user.id);
          return res.status(200).json({
            success: true,
            token,
            user: formatUserResponse(user),
          });
        }
      } catch (dbErr) {
        console.warn('[AuthController:login] Supabase lookup error, trying fallback:', dbErr.message);
      }
    }

    // 2. Resilient In-Memory Fallback
    const fallbackUser =
      mockStore.findUserByIdentifier(mappedIdentifier) ||
      mockStore.findUserByIdentifier(queryIdentifier);

    const isRolePwdMatch = fallbackUser && checkRolePassword(fallbackUser.role, password);
    if (!fallbackUser || (!isRolePwdMatch && fallbackUser.password !== password)) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials. User not found or incorrect password.',
      });
    }

    const token = generateToken(fallbackUser._id);
    return res.status(200).json({
      success: true,
      token,
      user: formatUserResponse(fallbackUser),
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

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    if (isSupabaseConfigured && supabase) {
      try {
        // Check for existing employeeId or email
        const { data: existing } = await supabase
          .from('users')
          .select('id, employeeId, email')
          .or(`email.ilike.${email.trim()},employeeId.ilike.${employeeId.trim()}`)
          .limit(1);

        if (existing && existing.length > 0) {
          const isEmailMatch = existing[0].email.toLowerCase() === email.trim().toLowerCase();
          return res.status(400).json({
            success: false,
            message: isEmailMatch
              ? 'An account with this email address already exists.'
              : 'An account with this Employee ID already exists.',
          });
        }

        const { data: inserted, error: insertErr } = await supabase
          .from('users')
          .insert([
            {
              employeeId: employeeId.toUpperCase().trim(),
              name: name.trim(),
              email: email.toLowerCase().trim(),
              password: hashedPassword,
              role: normalizedRole,
              department: department.trim(),
              designation: designation.trim(),
              mobileNumber: mobileNumber.trim(),
              isActive: true,
            },
          ])
          .select()
          .single();

        if (insertErr) {
          console.warn('[AuthController:register] Supabase insert failed:', insertErr.message);
        } else if (inserted) {
          const token = generateToken(inserted.id);
          return res.status(201).json({
            success: true,
            message: `Account registered successfully as ${normalizedRole === 'AUDITOR' ? 'Quality Auditor' : 'Line Supervisor'}.`,
            token,
            user: formatUserResponse(inserted),
          });
        }
      } catch (dbErr) {
        console.warn('[AuthController:register] DB error, using fallback:', dbErr.message);
      }
    }

    // Fallback store
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
      user: formatUserResponse(newUser),
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
    const userId = req.user?.id || req.user?._id;

    if (isSupabaseConfigured && supabase && userId) {
      try {
        const { data, error } = await supabase
          .from('users')
          .select('id, employeeId, name, email, role, department, designation, mobileNumber, isActive')
          .eq('id', userId)
          .maybeSingle();

        if (!error && data) {
          return res.status(200).json({
            success: true,
            user: formatUserResponse(data),
          });
        }
      } catch (e) {
        // continue to fallback
      }
    }

    const fallbackUser = mockStore.findUserById(userId) || req.user;
    res.status(200).json({
      success: true,
      user: formatUserResponse(fallbackUser),
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
    if (isSupabaseConfigured && supabase) {
      try {
        const { data: users, error } = await supabase
          .from('users')
          .select('id, employeeId, name, email, role, department, designation, mobileNumber, isActive')
          .eq('isActive', true)
          .order('role', { ascending: true })
          .order('employeeId', { ascending: true });

        if (!error && users && users.length > 0) {
          return res.status(200).json({
            success: true,
            users: users.map(formatUserResponse),
          });
        }
      } catch (dbErr) {
        console.warn('[AuthController:getDemoUsers] Supabase notice:', dbErr.message);
      }
    }

    res.status(200).json({
      success: true,
      users: mockStore.getUsers().map(formatUserResponse),
    });
  } catch (error) {
    res.status(200).json({
      success: true,
      users: mockStore.getUsers().map(formatUserResponse),
    });
  }
};

// @desc    Quick demo role switch (generates token directly for testing)
// @route   POST /api/auth/switch-demo
// @access  Public
const switchDemoUser = async (req, res) => {
  try {
    const { userId } = req.body;

    if (isSupabaseConfigured && supabase && userId) {
      try {
        const { data: user, error } = await supabase
          .from('users')
          .select('id, employeeId, name, email, role, department, designation, mobileNumber, isActive')
          .or(`id.eq.${userId},employeeId.eq.${userId}`)
          .maybeSingle();

        if (!error && user) {
          const token = generateToken(user.id);
          return res.status(200).json({
            success: true,
            token,
            user: formatUserResponse(user),
          });
        }
      } catch (dbErr) {
        // fallback to mockStore below
      }
    }

    const fallbackUser = mockStore.findUserById(userId) || mockStore.getUsers().find((u) => u.employeeId === userId);
    if (fallbackUser) {
      const token = generateToken(fallbackUser._id);
      return res.status(200).json({
        success: true,
        token,
        user: formatUserResponse(fallbackUser),
      });
    }

    res.status(404).json({
      success: false,
      message: 'Demo user not found.',
    });
  } catch (error) {
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
