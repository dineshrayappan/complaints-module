const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const Complaint = require('../models/Complaint');
const User = require('../models/User');
const mockStore = require('../config/mockStore');

// Helper to convert any image path (including disk files in /uploads) into a self-contained data URL
const ensureDataUrl = (photoPath) => {
  if (!photoPath) return photoPath;
  if (
    photoPath.startsWith('data:image/') ||
    photoPath.startsWith('http://') ||
    photoPath.startsWith('https://')
  ) {
    return photoPath;
  }
  if (photoPath.startsWith('/uploads/') || !photoPath.includes('/')) {
    const filename = photoPath.replace(/^\/uploads\//, '');
    const diskPath = path.join(__dirname, '..', 'uploads', filename);
    if (fs.existsSync(diskPath)) {
      try {
        const ext = path.extname(filename).toLowerCase();
        let mime = 'image/jpeg';
        if (ext === '.png') mime = 'image/png';
        else if (ext === '.webp') mime = 'image/webp';
        else if (ext === '.svg') mime = 'image/svg+xml';
        const fileBuf = fs.readFileSync(diskPath);
        return `data:${mime};base64,${fileBuf.toString('base64')}`;
      } catch (e) {
        return photoPath;
      }
    }
  }
  return photoPath;
};

// Helper to ensure all complaint outputs have self-contained data URLs
const formatComplaintOutput = (complaint) => {
  if (!complaint) return null;
  const obj = typeof complaint.toObject === 'function' ? complaint.toObject() : { ...complaint };
  if (obj.beforePhoto) {
    obj.beforePhoto = ensureDataUrl(obj.beforePhoto);
  }
  if (obj.afterPhoto) {
    obj.afterPhoto = ensureDataUrl(obj.afterPhoto);
  }
  return obj;
};

// Helper to format file URL
const getFileUrl = (req, filename) => {
  if (!filename) return null;
  // If already full URL, data URI, or relative upload path, return as-is
  if (
    filename.startsWith('http') ||
    filename.startsWith('data:') ||
    filename.startsWith('/uploads/')
  ) {
    return filename;
  }
  return `/uploads/${filename}`;
};

// @desc    Create new complaint with Before Photo and 12-24h SLA
// @route   POST /api/complaints
// @access  Private (Auditor only)
const createComplaint = async (req, res) => {
  try {
    const {
      category = 'Stitching Fault',
      department,
      location = 'Production Floor',
      priority = 'HIGH',
      description = '',
      assignedToUserId,
      deadlineHours,
    } = req.body;

    const targetSupervisorId = assignedToUserId || req.body.assignedToId;

    // Validate SLA bounds: strictly between 12 and 24 hours, default gracefully to 16
    let hours = Number(deadlineHours);
    if (isNaN(hours) || hours < 12 || hours > 24) {
      hours = 16;
    }

    // Check Before Photo (file or base64 or url)
    let beforePhotoUrl = null;
    if (req.body.beforePhotoBase64 && req.body.beforePhotoBase64.startsWith('data:image/')) {
      beforePhotoUrl = req.body.beforePhotoBase64;
    } else if (req.file) {
      try {
        const fileBuf = fs.readFileSync(req.file.path);
        const mime = req.file.mimetype || 'image/jpeg';
        beforePhotoUrl = `data:${mime};base64,${fileBuf.toString('base64')}`;
      } catch (err) {
        beforePhotoUrl = getFileUrl(req, req.file.filename);
      }
    } else if (req.body.beforePhoto) {
      beforePhotoUrl = req.body.beforePhoto;
    } else if (req.body.beforePhotoUrl) {
      beforePhotoUrl = req.body.beforePhotoUrl;
    } else if (req.body.beforePhotoBase64) {
      beforePhotoUrl = req.body.beforePhotoBase64;
    }

    if (!beforePhotoUrl) {
      return res.status(400).json({
        success: false,
        message: 'Mandatory Before Photo proof is required (via device camera or upload).',
      });
    }

    const createdByData = {
      userId: req.user?._id || 'default-aud-001',
      employeeId: req.user?.employeeId || 'AUD-001',
      name: req.user?.name || 'Quality Auditor',
      role: req.user?.role || 'AUDITOR',
    };

    if (mongoose.connection.readyState !== 1) {
      const supervisor =
        mockStore.findUserById(targetSupervisorId) ||
        mockStore.getUsers().find((u) => u.employeeId === targetSupervisorId) ||
        mockStore.getUsers().find((u) => u.role === 'ACTION_PERSON') || {
          _id: '6ab21322cd50706ee2a84637',
          employeeId: 'SUP-101',
          name: 'Mohammad Arif',
          department: department || 'Sewing Line 1',
          designation: 'Line 1 In-Charge',
          mobileNumber: '+91 98111 22334',
        };

      const newTicket = mockStore.createComplaint({
        category: category || 'Stitching Fault',
        department: department || supervisor?.department || 'Sewing Line 1',
        location: location || 'Production Floor',
        priority: priority || 'HIGH',
        description: description || 'Audit Defect Logged',
        beforePhoto: beforePhotoUrl,
        assignedTo: {
          userId: supervisor?._id,
          employeeId: supervisor?.employeeId,
          name: supervisor?.name,
          department: supervisor?.department,
          designation: supervisor?.designation,
          mobileNumber: supervisor?.mobileNumber,
        },
        createdBy: createdByData,
        deadlineHours: hours,
        deadlineTimestamp: new Date(Date.now() + hours * 60 * 60 * 1000),
      });

      return res.status(201).json({
        success: true,
        message: `Defect logged with ID ${newTicket.complaintId}. 12–24h resolution SLA active.`,
        complaint: formatComplaintOutput(newTicket),
      });
    }

    // Lookup supervisor from pre-configured Master Contact list
    let supervisor = null;
    if (targetSupervisorId) {
      if (mongoose.Types.ObjectId.isValid(targetSupervisorId)) {
        supervisor = await User.findById(targetSupervisorId).catch(() => null);
      }
      if (!supervisor) {
        supervisor = await User.findOne({
          $or: [{ employeeId: targetSupervisorId }, { email: targetSupervisorId }],
        }).catch(() => null);
      }
      if (!supervisor) {
        const mockSup =
          mockStore.findUserById(targetSupervisorId) ||
          mockStore.getUsers().find(
            (u) => u.employeeId === targetSupervisorId || u._id === targetSupervisorId
          );
        if (mockSup) {
          try {
            supervisor = await User.findOneAndUpdate(
              { employeeId: mockSup.employeeId },
              {
                _id: mongoose.Types.ObjectId.isValid(mockSup._id)
                  ? new mongoose.Types.ObjectId(mockSup._id)
                  : new mongoose.Types.ObjectId(),
                employeeId: mockSup.employeeId,
                name: mockSup.name,
                email: mockSup.email,
                password: mockSup.password || 'Password123!',
                role: mockSup.role,
                department: mockSup.department,
                designation: mockSup.designation,
                mobileNumber: mockSup.mobileNumber,
                isActive: true,
              },
              { upsert: true, new: true, setDefaultsOnInsert: true }
            );
          } catch (e) {
            supervisor = mockSup;
          }
        }
      }
    }

    if (!supervisor) {
      supervisor = await User.findOne({ role: 'ACTION_PERSON', isActive: true }).catch(() => null);
    }

    if (!supervisor) {
      supervisor = mockStore.getUsers().find((u) => u.role === 'ACTION_PERSON') || {
        _id: '6ab21322cd50706ee2a84637',
        employeeId: 'SUP-101',
        name: 'Mohammad Arif',
        department: department || 'Sewing Line 1',
        designation: 'Line 1 In-Charge',
        mobileNumber: '+91 98111 22334',
      };
    }

    const now = new Date();
    const deadlineTimestamp = new Date(now.getTime() + hours * 60 * 60 * 1000);

    const complaint = new Complaint({
      category: category || 'Stitching Fault',
      department: department || supervisor.department || 'Sewing Line 1',
      location: location || 'Production Floor',
      priority: priority || 'HIGH',
      description: description || 'Audit Defect Logged',
      beforePhoto: beforePhotoUrl,
      assignedTo: {
        userId: supervisor._id,
        employeeId: supervisor.employeeId,
        name: supervisor.name,
        department: supervisor.department,
        designation: supervisor.designation,
        mobileNumber: supervisor.mobileNumber,
      },
      createdBy: createdByData,
      deadlineHours: hours,
      deadlineTimestamp,
      status: 'Assigned',
      timeline: [
        {
          action: 'CREATED',
          performedBy: {
            name: createdByData.name,
            role: createdByData.role,
            employeeId: createdByData.employeeId,
          },
          notes: `Defect logged in ${location}. Assigned to ${supervisor.name} (${supervisor.designation}) with strict ${hours}h SLA deadline.`,
          timestamp: now,
        },
      ],
    });

    try {
      await complaint.save();

      return res.status(201).json({
        success: true,
        message: `Complaint ${complaint.complaintId} created and assigned successfully.`,
        complaint: formatComplaintOutput(complaint),
      });
    } catch (dbErr) {
      console.error('[ComplaintController:createComplaint] DB save failed, falling back to mockStore:', dbErr.message);
      const fallbackTicket = mockStore.createComplaint({
        category: category || 'Stitching Fault',
        department: department || supervisor?.department || 'Sewing Line 1',
        location: location || 'Production Floor',
        priority: priority || 'HIGH',
        description: description || 'Audit Defect Logged',
        beforePhoto: beforePhotoUrl,
        assignedTo: {
          userId: supervisor?._id,
          employeeId: supervisor?.employeeId,
          name: supervisor?.name,
          department: supervisor?.department,
          designation: supervisor?.designation,
          mobileNumber: supervisor?.mobileNumber,
        },
        createdBy: createdByData,
        deadlineHours: hours,
        deadlineTimestamp,
      });

      return res.status(201).json({
        success: true,
        message: `Complaint ${fallbackTicket.complaintId} created and assigned successfully.`,
        complaint: formatComplaintOutput(fallbackTicket),
      });
    }
  } catch (error) {
    console.error('[ComplaintController:createComplaint] Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create complaint.',
      error: error.message,
    });
  }
};

// @desc    Get complaints list with RBAC filters
// @route   GET /api/complaints
// @access  Private
const getComplaints = async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      const complaints = mockStore.getComplaints(req.query, req.user);
      return res.status(200).json({
        success: true,
        count: complaints.length,
        complaints: complaints.map(formatComplaintOutput),
      });
    }

    const { status, category, priority, department, search, tab } = req.query;

    const filter = {};

    // RBAC: If tab === 'my-line' filter strictly by assigned supervisor;
    // Otherwise on default tabs (all, action-pending, under-verification, overdue, closed),
    // allow all factory complaints so the supervisor can view all assigned tasks across the floor
    if ((req.user.role === 'ACTION_PERSON' || req.user.role === 'SUPERVISOR') && tab === 'my-line') {
      const orConditions = [];
      if (req.user.employeeId) {
        orConditions.push({ 'assignedTo.employeeId': req.user.employeeId });
      }
      if (req.user._id) {
        orConditions.push({ 'assignedTo.userId': req.user._id });
        if (mongoose.Types.ObjectId.isValid(req.user._id)) {
          orConditions.push({ 'assignedTo.userId': new mongoose.Types.ObjectId(req.user._id) });
        }
      }
      if (req.user.department) {
        orConditions.push({
          department: new RegExp(`^${req.user.department.trim()}$`, 'i'),
        });
      }
      if (orConditions.length > 0) {
        filter.$or = orConditions;
      }
    }

    // Tab-based filtering
    if (tab === 'action-pending') {
      filter.status = { $in: ['Assigned', 'In Progress', 'Rejected / Sent Back'] };
    } else if (tab === 'under-verification') {
      filter.status = 'Under Verification';
    } else if (tab === 'closed') {
      filter.status = 'Closed';
    } else if (tab === 'overdue') {
      filter.status = { $ne: 'Closed' };
      filter.deadlineTimestamp = { $lt: new Date() };
    } else if (status) {
      filter.status = status;
    }

    if (category) filter.category = category;
    if (priority) filter.priority = priority;
    if (department) filter.department = department;

    if (search) {
      const searchRegex = new RegExp(search, 'i');
      filter.$and = filter.$and || [];
      filter.$and.push({
        $or: [
          { complaintId: searchRegex },
          { location: searchRegex },
          { description: searchRegex },
          { 'assignedTo.name': searchRegex },
          { category: searchRegex },
        ],
      });
    }

    const complaints = await Complaint.find(filter).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: complaints.length,
      complaints: complaints.map(formatComplaintOutput),
    });
  } catch (error) {
    console.error('[ComplaintController:getComplaints] Error:', error);
    const complaints = mockStore.getComplaints(req.query, req.user);
    res.status(200).json({
      success: true,
      count: complaints.length,
      complaints: complaints.map(formatComplaintOutput),
    });
  }
};

// @desc    Get single complaint detail by ID
// @route   GET /api/complaints/:id
// @access  Private
const getComplaintById = async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      const complaint = mockStore.getComplaintById(req.params.id);
      if (!complaint) {
        return res.status(404).json({
          success: false,
          message: 'Complaint ticket not found.',
        });
      }
      return res.status(200).json({ success: true, complaint: formatComplaintOutput(complaint) });
    }

    let complaint = null;
    if (mongoose.Types.ObjectId.isValid(req.params.id)) {
      complaint = await Complaint.findById(req.params.id);
    }
    if (!complaint) {
      complaint = await Complaint.findOne({ complaintId: req.params.id });
    }

    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: 'Complaint ticket not found.',
      });
    }

    res.status(200).json({
      success: true,
      complaint: formatComplaintOutput(complaint),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching complaint details.',
      error: error.message,
    });
  }
};

// @desc    Update complaint status to 'In Progress'
// @route   PATCH /api/complaints/:id/in-progress
// @access  Private (Action Person or Auditor)
const markInProgress = async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      const complaint = mockStore.getComplaintById(req.params.id);
      if (!complaint) {
        return res.status(404).json({
          success: false,
          message: 'Complaint not found.',
        });
      }
      if (complaint.status === 'Closed') {
        return res.status(400).json({
          success: false,
          message: 'Cannot modify a closed complaint.',
        });
      }
      complaint.status = 'In Progress';
      complaint.timeline.push({
        action: 'IN_PROGRESS',
        performedBy: {
          name: req.user.name,
          role: req.user.role,
          employeeId: req.user.employeeId,
        },
        notes: req.body.notes || 'Line In-Charge commenced defect rectification and machine inspection.',
        timestamp: new Date(),
      });
      mockStore.updateComplaint(complaint._id, complaint);
      return res.status(200).json({
        success: true,
        message: `Complaint ${complaint.complaintId} marked In Progress.`,
        complaint: formatComplaintOutput(complaint),
      });
    }

    let complaint = null;
    if (mongoose.Types.ObjectId.isValid(req.params.id)) {
      complaint = await Complaint.findById(req.params.id);
    }
    if (!complaint) {
      complaint = await Complaint.findOne({ complaintId: req.params.id });
    }

    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: 'Complaint not found.',
      });
    }

    if (complaint.status === 'Closed') {
      return res.status(400).json({
        success: false,
        message: 'Cannot modify a closed complaint.',
      });
    }

    complaint.status = 'In Progress';
    complaint.timeline.push({
      action: 'IN_PROGRESS',
      performedBy: {
        name: req.user.name,
        role: req.user.role,
        employeeId: req.user.employeeId,
      },
      notes: req.body.notes || 'Line In-Charge commenced defect rectification and machine inspection.',
      timestamp: new Date(),
    });

    try {
      await complaint.save();
    } catch (saveErr) {
      mockStore.updateComplaint(complaint._id, complaint);
    }

    res.status(200).json({
      success: true,
      message: `Complaint ${complaint.complaintId} marked In Progress.`,
      complaint: formatComplaintOutput(complaint),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update complaint status.',
      error: error.message,
    });
  }
};

// @desc    Submit action resolution with mandatory After Photo proof & feedback
// @route   POST /api/complaints/:id/submit-action
// @access  Private (Action Person, Supervisor, Auditor, Admin)
const submitAction = async (req, res) => {
  try {
    const { actionNotes, feedbackRemarks } = req.body;

    let afterPhotoUrl = null;
    if (req.body.afterPhotoBase64 && req.body.afterPhotoBase64.startsWith('data:image/')) {
      afterPhotoUrl = req.body.afterPhotoBase64;
    } else if (req.file) {
      try {
        const fileBuf = fs.readFileSync(req.file.path);
        const mime = req.file.mimetype || 'image/jpeg';
        afterPhotoUrl = `data:${mime};base64,${fileBuf.toString('base64')}`;
      } catch (err) {
        afterPhotoUrl = getFileUrl(req, req.file.filename);
      }
    } else if (req.body.afterPhoto) {
      afterPhotoUrl = req.body.afterPhoto;
    } else if (req.body.afterPhotoUrl) {
      afterPhotoUrl = req.body.afterPhotoUrl;
    } else if (req.body.afterPhotoBase64) {
      afterPhotoUrl = req.body.afterPhotoBase64;
    }

    if (afterPhotoUrl) {
      afterPhotoUrl = ensureDataUrl(afterPhotoUrl);
    }

    if (!afterPhotoUrl) {
      return res.status(400).json({
        success: false,
        message: 'Mandatory After Photo proof is required to submit defect resolution.',
      });
    }

    if (!actionNotes || !feedbackRemarks) {
      return res.status(400).json({
        success: false,
        message: 'Both Action Notes (work done) and Root Cause Feedback (preventive measures) are mandatory.',
      });
    }

    if (mongoose.connection.readyState !== 1) {
      const complaint = mockStore.getComplaintById(req.params.id);
      if (!complaint) {
        return res.status(404).json({
          success: false,
          message: 'Complaint not found.',
        });
      }
      if (complaint.status === 'Closed') {
        return res.status(400).json({
          success: false,
          message: 'Complaint has already been closed by audit.',
        });
      }
      complaint.afterPhoto = afterPhotoUrl;
      complaint.actionNotes = actionNotes;
      complaint.feedbackRemarks = feedbackRemarks;
      complaint.actualCompletedAt = new Date();
      complaint.status = 'Under Verification';
      complaint.timeline.push({
        action: 'ACTION_SUBMITTED',
        performedBy: {
          name: req.user.name,
          role: req.user.role,
          employeeId: req.user.employeeId,
        },
        notes: `Corrective action submitted for audit verification. Action: "${actionNotes}". Root Cause: "${feedbackRemarks}"`,
        timestamp: new Date(),
      });
      mockStore.updateComplaint(complaint._id, complaint);
      return res.status(200).json({
        success: true,
        message: `Resolution for ${complaint.complaintId} submitted for audit verification.`,
        complaint: formatComplaintOutput(complaint),
      });
    }

    let complaint = null;
    if (mongoose.Types.ObjectId.isValid(req.params.id)) {
      complaint = await Complaint.findById(req.params.id);
    }
    if (!complaint) {
      complaint = await Complaint.findOne({ complaintId: req.params.id });
    }

    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: 'Complaint not found.',
      });
    }

    if (complaint.status === 'Closed') {
      return res.status(400).json({
        success: false,
        message: 'Complaint has already been closed by audit.',
      });
    }

    complaint.afterPhoto = afterPhotoUrl;
    complaint.actionNotes = actionNotes;
    complaint.feedbackRemarks = feedbackRemarks;
    complaint.actualCompletedAt = new Date();
    complaint.status = 'Under Verification';

    complaint.timeline.push({
      action: 'ACTION_SUBMITTED',
      performedBy: {
        name: req.user.name,
        role: req.user.role,
        employeeId: req.user.employeeId,
      },
      notes: `Corrective action submitted for audit verification. Action: "${actionNotes}". Root Cause: "${feedbackRemarks}"`,
      timestamp: new Date(),
    });

    try {
      await complaint.save();
    } catch (saveErr) {
      console.warn('DB save fallback in submitAction:', saveErr.message);
      mockStore.updateComplaint(complaint._id, complaint);
    }

    res.status(200).json({
      success: true,
      message: `Resolution for ${complaint.complaintId} submitted for audit verification.`,
      complaint: formatComplaintOutput(complaint),
    });
  } catch (error) {
    console.error('[ComplaintController:submitAction] Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit action resolution.',
      error: error.message,
    });
  }
};

// @desc    Audit Verification Gateway: Approve & Close OR Reject & Return
// @route   POST /api/complaints/:id/verify
// @access  Private (Auditor only)
const verifyComplaint = async (req, res) => {
  try {
    const { decision, notes, rejectionReason } = req.body;

    if (!['APPROVE', 'REJECT'].includes(decision)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid verification decision. Must be APPROVE or REJECT.',
      });
    }

    if (mongoose.connection.readyState !== 1) {
      const complaint = mockStore.getComplaintById(req.params.id);
      if (!complaint) {
        return res.status(404).json({
          success: false,
          message: 'Complaint not found.',
        });
      }
      if (decision === 'APPROVE') {
        complaint.status = 'Closed';
        complaint.actualCompletedAt = new Date();
        complaint.rejectionReason = '';
        complaint.timeline.push({
          action: 'CLOSED',
          performedBy: {
            name: req.user.name,
            role: req.user.role,
            employeeId: req.user.employeeId,
          },
          notes: notes || 'Audit verified Before/After photos and approved closure of ticket.',
          timestamp: new Date(),
        });
      } else if (decision === 'REJECT') {
        const reason = rejectionReason || notes;
        if (!reason) {
          return res.status(400).json({
            success: false,
            message: 'A rejection reason is mandatory when returning a complaint to the line.',
          });
        }
        complaint.status = 'Rejected / Sent Back';
        complaint.rejectionReason = reason;
        complaint.timeline.push({
          action: 'REJECTED',
          performedBy: {
            name: req.user.name,
            role: req.user.role,
            employeeId: req.user.employeeId,
          },
          notes: `Audit rejected resolution and returned to line. Reason: ${reason}`,
          timestamp: new Date(),
        });
      }
      mockStore.updateComplaint(complaint._id, complaint);
      return res.status(200).json({
        success: true,
        message: `Complaint ${complaint.complaintId} has been ${decision === 'APPROVE' ? 'Approved & Closed' : 'Rejected & Returned to line'}.`,
        complaint: formatComplaintOutput(complaint),
      });
    }

    const complaint = await Complaint.findById(req.params.id);

    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: 'Complaint not found.',
      });
    }

    if (decision === 'APPROVE') {
      complaint.status = 'Closed';
      complaint.actualCompletedAt = new Date();
      complaint.rejectionReason = '';

      complaint.timeline.push({
        action: 'CLOSED',
        performedBy: {
          name: req.user.name,
          role: req.user.role,
          employeeId: req.user.employeeId,
        },
        notes: notes || 'Audit verified Before/After photos and approved closure of ticket.',
        timestamp: new Date(),
      });
    } else if (decision === 'REJECT') {
      const reason = rejectionReason || notes;
      if (!reason) {
        return res.status(400).json({
          success: false,
          message: 'A rejection reason is mandatory when returning a complaint to the line.',
        });
      }

      complaint.status = 'Rejected / Sent Back';
      complaint.rejectionReason = reason;

      complaint.timeline.push({
        action: 'REJECTED',
        performedBy: {
          name: req.user.name,
          role: req.user.role,
          employeeId: req.user.employeeId,
        },
        notes: `Audit rejected resolution and returned to line. Reason: ${reason}`,
        timestamp: new Date(),
      });
    }

    await complaint.save();

    res.status(200).json({
      success: true,
      message: `Complaint ${complaint.complaintId} has been ${decision === 'APPROVE' ? 'Approved & Closed' : 'Rejected & Returned to line'}.`,
      complaint: formatComplaintOutput(complaint),
    });
  } catch (error) {
    console.error('[ComplaintController:verifyComplaint] Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to verify complaint.',
      error: error.message,
    });
  }
};

// @desc    Add direct remark/comment to ticket timeline
// @route   POST /api/complaints/:id/timeline
// @access  Private
const addTimelineComment = async (req, res) => {
  try {
    const { comment } = req.body;

    if (!comment || !comment.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Comment text cannot be empty.',
      });
    }

    if (mongoose.connection.readyState !== 1) {
      const complaint = mockStore.getComplaintById(req.params.id);
      if (!complaint) {
        return res.status(404).json({
          success: false,
          message: 'Complaint not found.',
        });
      }
      complaint.timeline.push({
        action: 'COMMENT_ADDED',
        performedBy: {
          name: req.user.name,
          role: req.user.role,
          employeeId: req.user.employeeId,
        },
        notes: comment.trim(),
        timestamp: new Date(),
      });
      mockStore.updateComplaint(complaint._id, complaint);
      return res.status(200).json({
        success: true,
        message: 'Remark recorded in ticket audit trail.',
        timeline: complaint.timeline,
      });
    }

    const complaint = await Complaint.findById(req.params.id);

    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: 'Complaint not found.',
      });
    }

    complaint.timeline.push({
      action: 'COMMENT_ADDED',
      performedBy: {
        name: req.user.name,
        role: req.user.role,
        employeeId: req.user.employeeId,
      },
      notes: comment.trim(),
      timestamp: new Date(),
    });

    await complaint.save();

    res.status(200).json({
      success: true,
      message: 'Remark recorded in ticket audit trail.',
      timeline: complaint.timeline,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to append comment to timeline.',
      error: error.message,
    });
  }
};

// @desc    Get KPI metrics for dashboard cards
// @route   GET /api/complaints/stats/kpi
// @access  Private
const getKpiStats = async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      const allComplaints = mockStore.getComplaints();
      const now = new Date();
      const activeTickets = allComplaints.filter((c) =>
        ['Assigned', 'In Progress', 'Rejected / Sent Back'].includes(c.status)
      ).length;
      const underVerification = allComplaints.filter(
        (c) => c.status === 'Under Verification'
      ).length;
      const closedTickets = allComplaints.filter((c) => c.status === 'Closed').length;
      const overdueCount = allComplaints.filter(
        (c) => c.status !== 'Closed' && new Date(c.deadlineTimestamp) < now
      ).length;

      return res.status(200).json({
        success: true,
        metrics: {
          total: allComplaints.length,
          activeTickets,
          underVerification,
          closedTickets,
          overdueCount,
        },
      });
    }

    const baseFilter = {};

    if (req.user.role === 'ACTION_PERSON' || req.user.role === 'SUPERVISOR') {
      const orConditions = [
        { 'assignedTo.userId': req.user._id },
        { 'assignedTo.employeeId': req.user.employeeId },
      ];
      if (mongoose.Types.ObjectId.isValid(req.user._id)) {
        orConditions.push({ 'assignedTo.userId': new mongoose.Types.ObjectId(req.user._id) });
      }
      if (req.user.department) {
        orConditions.push({ department: new RegExp(`^${req.user.department.trim()}$`, 'i') });
      }
      baseFilter.$or = orConditions;
    }

    const allComplaints = await Complaint.find(baseFilter);

    const now = new Date();

    const activeTickets = allComplaints.filter((c) =>
      ['Assigned', 'In Progress', 'Rejected / Sent Back'].includes(c.status)
    ).length;

    const underVerification = allComplaints.filter(
      (c) => c.status === 'Under Verification'
    ).length;

    const closedTickets = allComplaints.filter((c) => c.status === 'Closed').length;

    const overdueCount = allComplaints.filter(
      (c) => c.status !== 'Closed' && new Date(c.deadlineTimestamp) < now
    ).length;

    res.status(200).json({
      success: true,
      metrics: {
        total: allComplaints.length,
        activeTickets,
        underVerification,
        closedTickets,
        overdueCount,
      },
    });
  } catch (error) {
    const allComplaints = mockStore.getComplaints();
    const now = new Date();
    res.status(200).json({
      success: true,
      metrics: {
        total: allComplaints.length,
        activeTickets: allComplaints.filter((c) => ['Assigned', 'In Progress'].includes(c.status)).length,
        underVerification: allComplaints.filter((c) => c.status === 'Under Verification').length,
        closedTickets: allComplaints.filter((c) => c.status === 'Closed').length,
        overdueCount: allComplaints.filter((c) => c.status !== 'Closed' && new Date(c.deadlineTimestamp) < now).length,
      },
    });
  }
};

// @desc    Get executive oversight metrics for Admin monitoring Auditor and Supervisor activities and inactions
// @route   GET /api/complaints/admin/oversight
// @access  Private (Admin or Auditor)
const getAdminOversightStats = async (req, res) => {
  try {
    const now = new Date();

    if (mongoose.connection.readyState !== 1) {
      const allComplaints = mockStore.getComplaints();
      const allUsers = mockStore.getUsers();
      const auditors = allUsers.filter((u) => u.role === 'AUDITOR');
      const supervisors = allUsers.filter(
        (u) => u.role === 'ACTION_PERSON' || u.role === 'SUPERVISOR'
      );
      const breachedTickets = allComplaints.filter(
        (c) => c.status !== 'Closed' && new Date(c.deadlineTimestamp) < now
      );
      const unstartedTickets = allComplaints.filter((c) => c.status === 'Assigned');
      const pendingVerificationTickets = allComplaints.filter((c) => c.status === 'Under Verification');
      const rejectedTickets = allComplaints.filter((c) => c.status === 'Rejected / Sent Back');
      const closed = allComplaints.filter((c) => c.status === 'Closed');

      return res.status(200).json({
        success: true,
        stats: {
          totalDefects: allComplaints.length,
          closedDefects: closed.length,
          activeInPipeline: allComplaints.length - closed.length,
          slaBreached: breachedTickets.length,
          underVerification: pendingVerificationTickets.length,
          cleanCloseRatePercent: 88,
          averageTurnaroundHours: 14.5,
        },
        inactionRadar: {
          overdueTickets: breachedTickets.map((c) => ({
            _id: c._id,
            complaintId: c.complaintId,
            category: c.category,
            department: c.department,
            location: c.location,
            priority: c.priority,
            assignedTo: c.assignedTo?.name,
            deadlineTimestamp: c.deadlineTimestamp,
            hoursOverdue: Math.round((now - new Date(c.deadlineTimestamp)) / (1000 * 60 * 60)),
          })),
          unstartedTickets: unstartedTickets.map((c) => ({
            _id: c._id,
            complaintId: c.complaintId,
            category: c.category,
            department: c.department,
            location: c.location,
            priority: c.priority,
            assignedTo: c.assignedTo?.name,
            createdAt: c.createdAt,
            hoursWaiting: Math.round((now - new Date(c.createdAt)) / (1000 * 60 * 60)),
          })),
          pendingVerificationTickets: pendingVerificationTickets.map((c) => ({
            _id: c._id,
            complaintId: c.complaintId,
            category: c.category,
            department: c.department,
            assignedTo: c.assignedTo?.name,
            updatedAt: c.updatedAt || now,
          })),
        },
        auditorActivity: {
          totalDefectsLogged: allComplaints.length,
          severityBreakdown: {
            critical: allComplaints.filter((c) => c.priority === 'CRITICAL').length,
            high: allComplaints.filter((c) => c.priority === 'HIGH').length,
            medium: allComplaints.filter((c) => c.priority === 'MEDIUM').length,
            low: allComplaints.filter((c) => c.priority === 'LOW').length,
          },
          pendingAuditorSignOff: pendingVerificationTickets.length,
          closedComplaints: closed.length,
          rejectedCount: rejectedTickets.length,
          auditorsList: auditors.map((aud) => ({
            _id: aud._id,
            name: aud.name,
            employeeId: aud.employeeId,
            department: aud.department,
            designation: aud.designation,
            email: aud.email,
            mobileNumber: aud.mobileNumber,
            ticketsLogged: allComplaints.filter((c) => c.createdBy?.employeeId === aud.employeeId).length,
          })),
        },
        supervisorScorecard: supervisors.map((sup) => {
          const supTickets = allComplaints.filter((c) => c.assignedTo?.employeeId === sup.employeeId);
          const supClosed = supTickets.filter((c) => c.status === 'Closed');
          return {
            _id: sup._id,
            name: sup.name,
            employeeId: sup.employeeId,
            department: sup.department,
            designation: sup.designation,
            mobileNumber: sup.mobileNumber,
            totalAssigned: supTickets.length,
            currentlyPending: supTickets.filter((c) => c.status !== 'Closed').length,
            resolved: supClosed.length,
            breachedCount: supTickets.filter((c) => c.status !== 'Closed' && new Date(c.deadlineTimestamp) < now).length,
            resolutionRatePercent: supTickets.length ? Math.round((supClosed.length / supTickets.length) * 100) : 100,
          };
        }),
        activityStream: [],
      });
    }

    const [allComplaints, allUsers] = await Promise.all([
      Complaint.find().sort({ createdAt: -1 }),
      User.find({ isActive: true }).select('name employeeId email role department designation mobileNumber'),
    ]);

    const auditors = allUsers.filter((u) => u.role === 'AUDITOR');
    const supervisors = allUsers.filter(
      (u) => u.role === 'ACTION_PERSON' || u.role === 'SUPERVISOR'
    );

    // 1. Inaction & Bottleneck Counters
    const breachedTickets = allComplaints.filter(
      (c) => c.status !== 'Closed' && new Date(c.deadlineTimestamp) < now
    );
    const unstartedTickets = allComplaints.filter((c) => c.status === 'Assigned');
    const pendingVerificationTickets = allComplaints.filter((c) => c.status === 'Under Verification');
    const rejectedTickets = allComplaints.filter((c) => c.status === 'Rejected / Sent Back');

    // 2. Auditor Quality Activity
    const auditorActivity = {
      totalDefectsLogged: allComplaints.length,
      severityBreakdown: {
        critical: allComplaints.filter((c) => c.priority === 'CRITICAL').length,
        high: allComplaints.filter((c) => c.priority === 'HIGH').length,
        medium: allComplaints.filter((c) => c.priority === 'MEDIUM').length,
        low: allComplaints.filter((c) => c.priority === 'LOW').length,
      },
      pendingAuditorSignOff: pendingVerificationTickets.length,
      closedComplaints: allComplaints.filter((c) => c.status === 'Closed').length,
      rejectedCount: rejectedTickets.length,
      auditorsList: auditors.map((aud) => {
        const loggedByAud = allComplaints.filter(
          (c) => c.createdBy?.employeeId === aud.employeeId || c.createdBy?.userId?.toString() === aud._id.toString()
        );
        return {
          _id: aud._id,
          name: aud.name,
          employeeId: aud.employeeId,
          department: aud.department,
          designation: aud.designation,
          email: aud.email,
          mobileNumber: aud.mobileNumber,
          ticketsLogged: loggedByAud.length,
        };
      }),
    };

    // 3. Supervisor Line-by-Line Accountability & Inaction
    const supervisorScorecard = supervisors.map((sup) => {
      const assignedTickets = allComplaints.filter((c) => {
        const cAssignedId = c.assignedTo?.userId ? c.assignedTo.userId.toString() : '';
        const cAssignedEmp = (c.assignedTo?.employeeId || '').toUpperCase();
        const supEmp = (sup.employeeId || '').toUpperCase();
        const cDept = (c.department || '').trim().toLowerCase();
        const supDept = (sup.department || '').trim().toLowerCase();

        return (
          (sup._id && cAssignedId === sup._id.toString()) ||
          (supEmp && cAssignedEmp === supEmp) ||
          (supDept && cDept === supDept)
        );
      });

      const unstarted = assignedTickets.filter((c) => c.status === 'Assigned');
      const inProgress = assignedTickets.filter((c) => c.status === 'In Progress');
      const underVerification = assignedTickets.filter((c) => c.status === 'Under Verification');
      const closed = assignedTickets.filter((c) => c.status === 'Closed');
      const rejected = assignedTickets.filter((c) => c.status === 'Rejected / Sent Back');
      const overdue = assignedTickets.filter(
        (c) => c.status !== 'Closed' && new Date(c.deadlineTimestamp) < now
      );

      // SLA Compliance calculation (% of resolved tickets finished within SLA)
      const closedOnTime = closed.filter((c) => {
        if (!c.actualCompletedAt) return true;
        return new Date(c.actualCompletedAt) <= new Date(c.deadlineTimestamp);
      }).length;
      const complianceRate = closed.length > 0 ? Math.round((closedOnTime / closed.length) * 100) : 100;

      return {
        _id: sup._id,
        name: sup.name,
        employeeId: sup.employeeId,
        department: sup.department,
        designation: sup.designation,
        email: sup.email,
        mobileNumber: sup.mobileNumber,
        totalAssigned: assignedTickets.length,
        unstartedCount: unstarted.length,
        inProgressCount: inProgress.length,
        underVerificationCount: underVerification.length,
        closedCount: closed.length,
        rejectedCount: rejected.length,
        overdueCount: overdue.length,
        complianceRate,
        // Inaction alerts
        hasBreachedSla: overdue.length > 0,
        hasUnstartedDefects: unstarted.length > 0,
        hasUnresolvedRejections: rejected.length > 0,
      };
    });

    // 4. Live Cross-Factory Audit Trail Activity Stream (Latest 60 events)
    const recentActivityStream = [];
    allComplaints.forEach((complaint) => {
      complaint.timeline.forEach((tl) => {
        recentActivityStream.push({
          id: tl._id,
          complaintId: complaint.complaintId,
          category: complaint.category,
          department: complaint.department,
          location: complaint.location,
          priority: complaint.priority,
          currentStatus: complaint.status,
          action: tl.action,
          notes: tl.notes,
          performedBy: tl.performedBy,
          timestamp: tl.timestamp,
        });
      });
    });

    // Sort descending by timestamp
    recentActivityStream.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    const latestEvents = recentActivityStream.slice(0, 60);

    res.status(200).json({
      success: true,
      timestamp: now,
      bottlenecks: {
        totalBreachedSlas: breachedTickets.length,
        totalUnstartedTickets: unstartedTickets.length,
        totalPendingAuditorSignOffs: pendingVerificationTickets.length,
        totalRejectedAwaitingRework: rejectedTickets.length,
        breachedTickets: breachedTickets.map((c) => ({
          _id: c._id,
          complaintId: c.complaintId,
          category: c.category,
          department: c.department,
          location: c.location,
          priority: c.priority,
          assignedTo: c.assignedTo?.name,
          deadlineTimestamp: c.deadlineTimestamp,
          hoursOverdue: Math.round((now - new Date(c.deadlineTimestamp)) / (1000 * 60 * 60)),
        })),
        unstartedTickets: unstartedTickets.map((c) => ({
          _id: c._id,
          complaintId: c.complaintId,
          category: c.category,
          department: c.department,
          location: c.location,
          priority: c.priority,
          assignedTo: c.assignedTo?.name,
          createdAt: c.createdAt,
          hoursWaiting: Math.round((now - new Date(c.createdAt)) / (1000 * 60 * 60)),
        })),
        pendingVerificationTickets: pendingVerificationTickets.map((c) => ({
          _id: c._id,
          complaintId: c.complaintId,
          category: c.category,
          department: c.department,
          assignedTo: c.assignedTo?.name,
          updatedAt: c.updatedAt,
        })),
      },
      auditorActivity,
      supervisorScorecard,
      activityStream: latestEvents,
    });
  } catch (error) {
    console.error('[ComplaintController:getAdminOversightStats] Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate admin oversight metrics.',
      error: error.message,
    });
  }
};

// @desc    Reassign defect ticket to a different supervisor
// @route   PATCH /api/complaints/:id/reassign
// @access  Private (Auditor or Admin)
const reassignComplaint = async (req, res) => {
  try {
    const { assignedToUserId, notes } = req.body;
    if (!assignedToUserId) {
      return res.status(400).json({
        success: false,
        message: 'Please provide the target Line In-Charge / Supervisor to assign this task to.',
      });
    }

    if (mongoose.connection.readyState !== 1) {
      const complaint = mockStore.getComplaintById(req.params.id);
      if (!complaint) {
        return res.status(404).json({
          success: false,
          message: 'Complaint ticket not found.',
        });
      }

      const supervisor =
        mockStore.findUserById(assignedToUserId) ||
        mockStore.getUsers().find(
          (u) =>
            u.employeeId === assignedToUserId ||
            u._id === assignedToUserId ||
            (u.email && u.email.toLowerCase() === assignedToUserId.toLowerCase())
        );

      if (!supervisor) {
        return res.status(400).json({
          success: false,
          message: 'Selected Line In-Charge was not found in the Master Contact list.',
        });
      }

      complaint.assignedTo = {
        userId: supervisor._id,
        employeeId: supervisor.employeeId,
        name: supervisor.name,
        department: supervisor.department,
        designation: supervisor.designation,
        mobileNumber: supervisor.mobileNumber,
      };

      complaint.timeline.push({
        action: 'REASSIGNED',
        performedBy: {
          userId: req.user._id,
          employeeId: req.user.employeeId,
          name: req.user.name,
          role: req.user.role,
        },
        notes:
          notes ||
          `Task reassigned to Line In-Charge ${supervisor.name} (${supervisor.employeeId} - ${supervisor.department})`,
        timestamp: new Date(),
      });

      mockStore.updateComplaint(complaint._id, complaint);

      return res.status(200).json({
        success: true,
        message: `Task successfully assigned to ${supervisor.name} (${supervisor.department}).`,
        complaint,
      });
    }

    let complaint = null;
    if (mongoose.Types.ObjectId.isValid(req.params.id)) {
      complaint = await Complaint.findById(req.params.id);
    }
    if (!complaint) {
      complaint = await Complaint.findOne({ complaintId: req.params.id });
    }

    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: 'Complaint ticket not found.',
      });
    }

    let supervisor = null;
    if (mongoose.Types.ObjectId.isValid(assignedToUserId)) {
      supervisor = await User.findById(assignedToUserId);
    }
    if (!supervisor) {
      supervisor = await User.findOne({
        $or: [{ employeeId: assignedToUserId }, { email: assignedToUserId }],
      });
    }
    if (!supervisor) {
      const mockSup =
        mockStore.findUserById(assignedToUserId) ||
        mockStore.getUsers().find(
          (u) => u.employeeId === assignedToUserId || u._id === assignedToUserId
        );
      if (mockSup) {
        try {
          supervisor = await User.findOneAndUpdate(
            { employeeId: mockSup.employeeId },
            {
              _id: new mongoose.Types.ObjectId(mockSup._id),
              employeeId: mockSup.employeeId,
              name: mockSup.name,
              email: mockSup.email,
              password: mockSup.password || 'Password123!',
              role: mockSup.role,
              department: mockSup.department,
              designation: mockSup.designation,
              mobileNumber: mockSup.mobileNumber,
              isActive: true,
            },
            { upsert: true, new: true, setDefaultsOnInsert: true }
          );
        } catch (e) {
          supervisor = mockSup;
        }
      }
    }

    if (!supervisor) {
      return res.status(400).json({
        success: false,
        message: 'Selected Line In-Charge was not found in the Master Contact list.',
      });
    }

    complaint.assignedTo = {
      userId: supervisor._id,
      employeeId: supervisor.employeeId,
      name: supervisor.name,
      department: supervisor.department,
      designation: supervisor.designation,
      mobileNumber: supervisor.mobileNumber,
    };

    complaint.timeline.push({
      action: 'REASSIGNED',
      performedBy: {
        userId: req.user._id,
        employeeId: req.user.employeeId,
        name: req.user.name,
        role: req.user.role,
      },
      notes:
        notes ||
        `Task reassigned to Line In-Charge ${supervisor.name} (${supervisor.employeeId} - ${supervisor.department})`,
      timestamp: new Date(),
    });

    await complaint.save();

    return res.status(200).json({
      success: true,
      message: `Task successfully assigned to ${supervisor.name} (${supervisor.department}).`,
      complaint: formatComplaintOutput(complaint),
    });
  } catch (error) {
    console.error('[ComplaintController:reassignComplaint] Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to reassign defect task.',
      error: error.message,
    });
  }
};

module.exports = {
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
};
