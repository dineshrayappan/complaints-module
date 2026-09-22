const mongoose = require('mongoose');
const Complaint = require('../models/Complaint');
const User = require('../models/User');

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
      category,
      department,
      location,
      priority = 'MEDIUM',
      description,
      assignedToUserId,
      deadlineHours,
    } = req.body;

    // Validate SLA bounds: strictly between 12 and 24 hours
    const hours = Number(deadlineHours);
    if (isNaN(hours) || hours < 12 || hours > 24) {
      return res.status(400).json({
        success: false,
        message: 'Resolution deadline must be strictly bounded between 12 and 24 hours.',
      });
    }

    // Check Before Photo
    if (!req.file && !req.body.beforePhoto) {
      return res.status(400).json({
        success: false,
        message: 'Mandatory Before Photo proof is required (via device camera or upload).',
      });
    }

    const beforePhotoUrl = req.file
      ? getFileUrl(req, req.file.filename)
      : req.body.beforePhoto;

    // Lookup supervisor from pre-configured Master Contact list
    const supervisor = await User.findById(assignedToUserId);
    if (!supervisor || supervisor.role !== 'ACTION_PERSON') {
      return res.status(400).json({
        success: false,
        message: 'Invalid Line In-Charge selected from Master Contact list.',
      });
    }

    const now = new Date();
    const deadlineTimestamp = new Date(now.getTime() + hours * 60 * 60 * 1000);

    const complaint = new Complaint({
      category,
      department: department || supervisor.department,
      location,
      priority,
      description,
      beforePhoto: beforePhotoUrl,
      assignedTo: {
        userId: supervisor._id,
        employeeId: supervisor.employeeId,
        name: supervisor.name,
        department: supervisor.department,
        designation: supervisor.designation,
        mobileNumber: supervisor.mobileNumber,
      },
      createdBy: {
        userId: req.user._id,
        employeeId: req.user.employeeId,
        name: req.user.name,
        role: req.user.role,
      },
      deadlineHours: hours,
      deadlineTimestamp,
      status: 'Assigned',
      timeline: [
        {
          action: 'CREATED',
          performedBy: {
            name: req.user.name,
            role: req.user.role,
            employeeId: req.user.employeeId,
          },
          notes: `Defect logged in ${location}. Assigned to ${supervisor.name} (${supervisor.designation}) with strict ${hours}h SLA deadline.`,
          timestamp: now,
        },
      ],
    });

    await complaint.save();

    res.status(201).json({
      success: true,
      message: `Complaint ${complaint.complaintId} created and assigned successfully.`,
      complaint,
    });
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
    const { status, category, priority, department, search, tab } = req.query;

    const filter = {};

    // RBAC: Action person can only view complaints assigned to them or their department
    if (req.user.role === 'ACTION_PERSON') {
      filter.$or = [
        { 'assignedTo.userId': req.user._id },
        { department: req.user.department },
      ];
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
      complaints,
    });
  } catch (error) {
    console.error('[ComplaintController:getComplaints] Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve complaints.',
      error: error.message,
    });
  }
};

// @desc    Get single complaint detail by ID
// @route   GET /api/complaints/:id
// @access  Private
const getComplaintById = async (req, res) => {
  try {
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

    // RBAC check for Action Person
    if (
      req.user.role === 'ACTION_PERSON' &&
      complaint.assignedTo.userId.toString() !== req.user._id.toString() &&
      complaint.department !== req.user.department
    ) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only view complaints for your assigned line.',
      });
    }

    res.status(200).json({
      success: true,
      complaint,
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
    const complaint = await Complaint.findById(req.params.id);

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

    await complaint.save();

    res.status(200).json({
      success: true,
      message: `Complaint ${complaint.complaintId} marked In Progress.`,
      complaint,
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
// @access  Private (Action Person only)
const submitAction = async (req, res) => {
  try {
    const complaint = await Complaint.findById(req.params.id);

    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: 'Complaint not found.',
      });
    }

    // Constraint: Action person cannot close tickets under any circumstances!
    if (complaint.status === 'Closed') {
      return res.status(400).json({
        success: false,
        message: 'Complaint has already been closed by audit.',
      });
    }

    // Mandatory After Photo check
    if (!req.file && !req.body.afterPhoto) {
      return res.status(400).json({
        success: false,
        message: 'Mandatory After Photo proof is required to submit defect resolution.',
      });
    }

    const { actionNotes, feedbackRemarks } = req.body;

    if (!actionNotes || !feedbackRemarks) {
      return res.status(400).json({
        success: false,
        message: 'Both Action Notes (work done) and Root Cause Feedback (preventive measures) are mandatory.',
      });
    }

    const afterPhotoUrl = req.file
      ? getFileUrl(req, req.file.filename)
      : req.body.afterPhoto;

    complaint.afterPhoto = afterPhotoUrl;
    complaint.actionNotes = actionNotes;
    complaint.feedbackRemarks = feedbackRemarks;
    complaint.status = 'Under Verification'; // Strict audit gateway

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

    await complaint.save();

    res.status(200).json({
      success: true,
      message: `Resolution for ${complaint.complaintId} submitted for audit verification.`,
      complaint,
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
      complaint,
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
    const baseFilter = {};

    if (req.user.role === 'ACTION_PERSON') {
      baseFilter.$or = [
        { 'assignedTo.userId': req.user._id },
        { department: req.user.department },
      ];
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
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve KPI metrics.',
      error: error.message,
    });
  }
};

// @desc    Get executive oversight metrics for Admin monitoring Auditor and Supervisor activities and inactions
// @route   GET /api/complaints/admin/oversight
// @access  Private (Admin or Auditor)
const getAdminOversightStats = async (req, res) => {
  try {
    const now = new Date();

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
      const assignedTickets = allComplaints.filter(
        (c) =>
          c.assignedTo?.userId?.toString() === sup._id.toString() ||
          c.department === sup.department
      );

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
};
