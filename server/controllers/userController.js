const mongoose = require('mongoose');
const User = require('../models/User');
const mockStore = require('../config/mockStore');

// @desc    Get Master Contact List of Line In-Charges for assignment
// @route   GET /api/users/line-supervisors
// @access  Private (Auditor or Authenticated)
const getLineSupervisors = async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      const supervisors = mockStore
        .getUsers()
        .filter((u) => u.role === 'ACTION_PERSON' && u.isActive);
      return res.status(200).json({
        success: true,
        count: supervisors.length,
        supervisors,
      });
    }

    const supervisors = await User.find({
      role: 'ACTION_PERSON',
      isActive: true,
    })
      .select('name employeeId department designation mobileNumber email')
      .sort({ department: 1, name: 1 });

    res.status(200).json({
      success: true,
      count: supervisors.length,
      supervisors,
    });
  } catch (error) {
    const supervisors = mockStore
      .getUsers()
      .filter((u) => u.role === 'ACTION_PERSON' && u.isActive);
    res.status(200).json({
      success: true,
      count: supervisors.length,
      supervisors,
    });
  }
};

// @desc    Get all users (with optional filtering)
// @route   GET /api/users
// @access  Private (Admin or Authenticated)
const getAllUsers = async (req, res) => {
  try {
    const { role, department, search, isActive } = req.query;

    if (mongoose.connection.readyState !== 1) {
      let users = mockStore.getUsers();
      if (role) {
        if (role === 'SUPERVISOR') {
          users = users.filter((u) => u.role === 'ACTION_PERSON' || u.role === 'SUPERVISOR');
        } else {
          users = users.filter((u) => u.role === role);
        }
      }
      if (department) {
        users = users.filter((u) => u.department === department);
      }
      if (typeof isActive !== 'undefined') {
        users = users.filter((u) => Boolean(u.isActive) === (isActive === 'true'));
      }
      if (search) {
        const q = search.toLowerCase();
        users = users.filter(
          (u) =>
            u.name?.toLowerCase().includes(q) ||
            u.employeeId?.toLowerCase().includes(q) ||
            u.email?.toLowerCase().includes(q) ||
            u.department?.toLowerCase().includes(q)
        );
      }
      return res.status(200).json({
        success: true,
        count: users.length,
        users,
      });
    }

    const filter = {};

    if (role) {
      if (role === 'SUPERVISOR') {
        filter.role = { $in: ['ACTION_PERSON', 'SUPERVISOR'] };
      } else {
        filter.role = role;
      }
    }

    if (department) {
      filter.department = department;
    }

    if (typeof isActive !== 'undefined') {
      filter.isActive = isActive === 'true';
    }

    if (search) {
      const regex = new RegExp(search, 'i');
      filter.$or = [
        { name: regex },
        { employeeId: regex },
        { email: regex },
        { department: regex },
        { designation: regex },
      ];
    }

    const users = await User.find(filter).sort({ role: 1, name: 1 });

    res.status(200).json({
      success: true,
      count: users.length,
      users,
    });
  } catch (error) {
    const users = mockStore.getUsers();
    res.status(200).json({
      success: true,
      count: users.length,
      users,
    });
  }
};

// @desc    Admin: Create new user (Auditor, Supervisor, Admin)
// @route   POST /api/users
// @access  Private (Admin Only)
const createUser = async (req, res) => {
  try {
    const {
      employeeId,
      name,
      email,
      password,
      role,
      department,
      designation,
      mobileNumber,
    } = req.body;

    // Validation
    if (!employeeId || !name || !email || !password || !role || !department || !designation || !mobileNumber) {
      return res.status(400).json({
        success: false,
        message: 'All fields are mandatory: employeeId, name, email, password, role, department, designation, and mobileNumber.',
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long.',
      });
    }

    const normalizedRole = role === 'SUPERVISOR' ? 'ACTION_PERSON' : role;

    if (mongoose.connection.readyState !== 1) {
      const newUser = mockStore.createUser({
        employeeId: employeeId.trim().toUpperCase(),
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password,
        role: normalizedRole,
        department: department.trim(),
        designation: designation.trim(),
        mobileNumber: mobileNumber.trim(),
        isActive: true,
      });

      return res.status(201).json({
        success: true,
        message: `User '${newUser.name}' (${newUser.employeeId}) created successfully.`,
        user: newUser,
      });
    }

    // Check duplicate employeeId
    const existingEmpId = await User.findOne({
      employeeId: employeeId.trim().toUpperCase(),
    });
    if (existingEmpId) {
      return res.status(400).json({
        success: false,
        message: `Employee ID '${employeeId.toUpperCase()}' is already registered to ${existingEmpId.name}.`,
      });
    }

    // Check duplicate email
    const existingEmail = await User.findOne({
      email: email.trim().toLowerCase(),
    });
    if (existingEmail) {
      return res.status(400).json({
        success: false,
        message: `Email address '${email.toLowerCase()}' is already registered in the system.`,
      });
    }

    const newUser = new User({
      employeeId: employeeId.trim().toUpperCase(),
      name: name.trim(),
      email: email.trim().toLowerCase(),
      password,
      role: normalizedRole,
      department: department.trim(),
      designation: designation.trim(),
      mobileNumber: mobileNumber.trim(),
      isActive: true,
    });

    await newUser.save();

    res.status(201).json({
      success: true,
      message: `User '${newUser.name}' (${newUser.employeeId}) created successfully.`,
      user: newUser,
    });
  } catch (error) {
    console.error('[UserController] Create user error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error while creating user account.',
    });
  }
};

// @desc    Admin: Update user details
// @route   PUT /api/users/:id
// @access  Private (Admin Only)
const updateUser = async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      const updated = mockStore.updateUser(req.params.id, req.body);
      return res.status(200).json({
        success: true,
        message: 'User updated successfully.',
        user: updated,
      });
    }

    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User account not found.',
      });
    }

    const {
      name,
      email,
      department,
      designation,
      mobileNumber,
      role,
      isActive,
    } = req.body;

    if (name) user.name = name.trim();
    if (department) user.department = department.trim();
    if (designation) user.designation = designation.trim();
    if (mobileNumber) user.mobileNumber = mobileNumber.trim();
    if (typeof isActive !== 'undefined') user.isActive = Boolean(isActive);

    if (role) {
      user.role = role === 'SUPERVISOR' ? 'ACTION_PERSON' : role;
    }

    if (email && email.toLowerCase() !== user.email) {
      const emailConflict = await User.findOne({
        email: email.trim().toLowerCase(),
        _id: { $ne: user._id },
      });
      if (emailConflict) {
        return res.status(400).json({
          success: false,
          message: `Email '${email}' is already in use by another account.`,
        });
      }
      user.email = email.trim().toLowerCase();
    }

    await user.save();

    res.status(200).json({
      success: true,
      message: `User '${user.name}' updated successfully.`,
      user,
    });
  } catch (error) {
    console.error('[UserController] Update user error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to update user account.',
    });
  }
};

// @desc    Admin: Reset or update user password
// @route   PATCH /api/users/:id/reset-password
// @access  Private (Admin Only)
const resetUserPassword = async (req, res) => {
  try {
    const { newPassword } = req.body;

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters in length.',
      });
    }

    if (mongoose.connection.readyState !== 1) {
      const updated = mockStore.updateUser(req.params.id, { password: newPassword });
      return res.status(200).json({
        success: true,
        message: `Password for '${updated?.name || 'User'}' updated successfully.`,
        user: updated,
      });
    }

    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User account not found.',
      });
    }

    user.password = newPassword;
    await user.save(); // triggers pre('save') bcrypt hash

    res.status(200).json({
      success: true,
      message: `Password for '${user.name}' (${user.employeeId}) has been successfully updated.`,
      user: {
        _id: user._id,
        employeeId: user.employeeId,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('[UserController] Reset password error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to reset user password.',
    });
  }
};

// @desc    Admin: Toggle user active/inactive status
// @route   PATCH /api/users/:id/toggle-status
// @access  Private (Admin Only)
const toggleUserStatus = async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      const user = mockStore.findUserById(req.params.id);
      const updated = mockStore.updateUser(req.params.id, { isActive: !user?.isActive });
      return res.status(200).json({
        success: true,
        message: `User '${updated?.name}' status updated.`,
        isActive: updated?.isActive,
        user: updated,
      });
    }

    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User account not found.',
      });
    }

    // Protect active admin from deactivating themselves
    if (req.user && req.user._id.toString() === user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'You cannot deactivate your own administrative account.',
      });
    }

    user.isActive = !user.isActive;
    await user.save();

    res.status(200).json({
      success: true,
      message: `User '${user.name}' has been ${user.isActive ? 'activated' : 'deactivated'}.`,
      isActive: user.isActive,
      user,
    });
  } catch (error) {
    console.error('[UserController] Toggle status error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to toggle user status.',
    });
  }
};

module.exports = {
  getLineSupervisors,
  getAllUsers,
  createUser,
  updateUser,
  resetUserPassword,
  toggleUserStatus,
};
