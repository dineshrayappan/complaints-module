const fs = require('fs');
const path = require('path');
const { supabase, isSupabaseConfigured } = require('../config/supabase');
const mockStore = require('../config/mockStore');

const sampleSvgTemplates = {
  'sample-before-stitch.svg': {
    title: 'DEFECT PROOF: SKIPPED STITCHES',
    badge: 'BEFORE RECTIFICATION',
    accent: '#ef4444',
    detail: 'Machine #14 - 8 skipped stitches per 10cm along collar seam line.',
  },
  'sample-after-stitch.svg': {
    title: 'CORRECTED: RE-STITCHED & TENSION BALANCED',
    badge: 'AFTER PROOF (RESOLVED)',
    accent: '#10b981',
    detail: 'Needle replaced with Groz-Beckert 75/11; looper timing calibrated.',
  },
  'sample-before-oil.svg': {
    title: 'DEFECT PROOF: NEEDLE BAR OIL DRIP',
    badge: 'BEFORE RECTIFICATION',
    accent: '#f59e0b',
    detail: 'Sewing Line 2 - Dark lubricant stain on right sleeve cuff panel.',
  },
  'sample-after-oil.svg': {
    title: 'CORRECTED: SPOT CLEANED & WIPED',
    badge: 'AFTER PROOF (RESOLVED)',
    accent: '#10b981',
    detail: 'Ultrasonic stain remover spray applied; felt wick oiler adjusted.',
  },
  'sample-before-cut.svg': {
    title: 'DEFECT PROOF: NEEDLE CUT / KNIT RUN',
    badge: 'BEFORE RECTIFICATION',
    accent: '#ef4444',
    detail: 'Spreading & Cutting - Micro tears at seam allowance of interlock rib.',
  },
  'sample-after-cut.svg': {
    title: 'CORRECTED: BALL-POINT NEEDLE TESTED',
    badge: 'AFTER PROOF (RESOLVED)',
    accent: '#10b981',
    detail: 'Swapped to SES ball-point needle; 100 pcs 100% defect-free.',
  },
};

const generateSampleSvgDataUrl = (filename) => {
  const img = sampleSvgTemplates[filename];
  if (!img) return null;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600" width="100%" height="100%">
  <defs>
    <linearGradient id="grad-${filename}" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#1e293b;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#0f172a;stop-opacity:1" />
    </linearGradient>
    <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
      <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#334155" stroke-width="0.8" stroke-opacity="0.4"/>
    </pattern>
  </defs>
  <rect width="100%" height="100%" fill="url(#grad-${filename})" />
  <rect width="100%" height="100%" fill="url(#grid)" />
  <rect x="40" y="40" width="720" height="520" rx="16" fill="#1e293b" fill-opacity="0.8" stroke="#475569" stroke-width="2" />
  <rect x="70" y="70" width="220" height="38" rx="8" fill="${img.accent}" />
  <text x="180" y="94" fill="#ffffff" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="13" font-weight="bold" text-anchor="middle" letter-spacing="1.2">${img.badge}</text>
  <text x="730" y="95" fill="#94a3b8" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="12" font-weight="600" text-anchor="end">GARMENT QMS AUDIT PROOF</text>
  <text x="70" y="150" fill="#f8fafc" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="24" font-weight="800">${img.title}</text>
  <rect x="70" y="180" width="660" height="260" rx="12" fill="#0f172a" stroke="#334155" stroke-width="1.5" />
  <line x1="100" y1="310" x2="700" y2="310" stroke="${img.accent}" stroke-width="4" stroke-dasharray="12,8" />
  <circle cx="400" cy="310" r="45" fill="${img.accent}" fill-opacity="0.2" stroke="${img.accent}" stroke-width="2.5" />
  <text x="400" y="315" fill="#f8fafc" font-family="monospace" font-size="14" font-weight="bold" text-anchor="middle">INSPECTION ZONE</text>
  <text x="70" y="480" fill="#cbd5e1" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="15" font-weight="500">${img.detail}</text>
  <text x="70" y="520" fill="#64748b" font-family="monospace" font-size="12">METRO TEXTILE APPAREL QMS • REAR SENSOR CAMERA VERIFIED</text>
</svg>`;
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
};

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
        // fallback
      }
    }
    const sampleSvg = generateSampleSvgDataUrl(filename);
    if (sampleSvg) return sampleSvg;
  }
  return photoPath;
};

// Helper to ensure all complaint outputs have self-contained data URLs and compatible identifiers
const formatComplaintOutput = (complaint) => {
  if (!complaint) return null;
  const obj = typeof complaint.toObject === 'function' ? complaint.toObject() : { ...complaint };
  obj._id = obj.id || obj._id;
  obj.id = obj.id || obj._id;

  if (obj.beforePhoto) {
    obj.beforePhoto = ensureDataUrl(obj.beforePhoto);
  }
  if (obj.afterPhoto) {
    obj.afterPhoto = ensureDataUrl(obj.afterPhoto);
  }

  // Virtual property: dynamic calculation whether currently overdue
  if (typeof obj.isCurrentlyOverdue === 'undefined') {
    obj.isCurrentlyOverdue =
      obj.status !== 'Closed' && new Date() > new Date(obj.deadlineTimestamp);
  }

  // Ensure timeline is an array
  if (!Array.isArray(obj.timeline)) {
    try {
      obj.timeline = typeof obj.timeline === 'string' ? JSON.parse(obj.timeline) : [];
    } catch (e) {
      obj.timeline = [];
    }
  }

  return obj;
};

// Helper to format file URL
const getFileUrl = (req, filename) => {
  if (!filename) return null;
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
    }

    if (beforePhotoUrl) {
      beforePhotoUrl = ensureDataUrl(beforePhotoUrl);
    }

    if (!beforePhotoUrl) {
      return res.status(400).json({
        success: false,
        message: 'Mandatory Before Photo proof is required (via device camera or upload).',
      });
    }

    const createdByData = {
      userId: req.user?.id || req.user?._id || 'usr-aud-001',
      employeeId: req.user?.employeeId || 'AUD-001',
      name: req.user?.name || 'Quality Auditor',
      role: req.user?.role || 'AUDITOR',
    };

    // Lookup supervisor from Supabase or mockStore
    let supervisor = null;

    if (isSupabaseConfigured && supabase && targetSupervisorId) {
      try {
        const { data: sups } = await supabase
          .from('users')
          .select('*')
          .or(`id.eq.${targetSupervisorId},employeeId.eq.${targetSupervisorId},email.eq.${targetSupervisorId}`)
          .limit(1);

        if (sups && sups.length > 0) {
          supervisor = sups[0];
        }
      } catch (e) {
        // fallback to mockStore
      }
    }

    if (!supervisor) {
      supervisor =
        mockStore.findUserById(targetSupervisorId) ||
        mockStore.getUsers().find((u) => u.employeeId === targetSupervisorId) ||
        mockStore.getUsers().find((u) => u.role === 'ACTION_PERSON') || {
          _id: 'usr-sup-101',
          employeeId: 'SUP-101',
          name: 'Mohammad Arif',
          department: department || 'Sewing Line 1',
          designation: 'Line 1 In-Charge',
          mobileNumber: '+91 98111 22334',
        };
    }

    const assignedToData = {
      userId: supervisor.id || supervisor._id,
      employeeId: supervisor.employeeId,
      name: supervisor.name,
      department: supervisor.department,
      designation: supervisor.designation,
      mobileNumber: supervisor.mobileNumber,
    };

    const now = new Date();
    const deadlineTimestamp = new Date(now.getTime() + hours * 60 * 60 * 1000);
    const randomSuffix = Math.floor(10000 + Math.random() * 90000);
    const complaintId = `CMP-${randomSuffix}`;

    const initialTimeline = [
      {
        action: 'CREATED',
        performedBy: {
          name: createdByData.name,
          role: createdByData.role,
          employeeId: createdByData.employeeId,
        },
        notes: `Defect logged in ${location}. Assigned to ${supervisor.name} (${supervisor.designation}) with strict ${hours}h SLA deadline.`,
        timestamp: now.toISOString(),
      },
    ];

    if (isSupabaseConfigured && supabase) {
      try {
        const insertPayload = {
          complaintId,
          category: category || 'Stitching Fault',
          department: department || supervisor.department || 'Sewing Line 1',
          location: location || 'Production Floor',
          priority: priority || 'HIGH',
          description: description || 'Audit Defect Logged',
          beforePhoto: beforePhotoUrl,
          afterPhoto: null,
          assignedTo: assignedToData,
          createdBy: createdByData,
          deadlineHours: hours,
          deadlineTimestamp: deadlineTimestamp.toISOString(),
          status: 'Assigned',
          actionNotes: '',
          feedbackRemarks: '',
          rejectionReason: '',
          timeline: initialTimeline,
          createdAt: now.toISOString(),
          updatedAt: now.toISOString(),
        };

        const { data: inserted, error: insertErr } = await supabase
          .from('complaints')
          .insert([insertPayload])
          .select()
          .single();

        if (!insertErr && inserted) {
          // Immediately sync to mockStore so in-memory store and Supabase stay identical
          mockStore.createComplaint({ ...inserted, _id: inserted.id, complaintId: inserted.complaintId });
          return res.status(201).json({
            success: true,
            message: `Complaint ${inserted.complaintId} created and assigned successfully.`,
            complaint: formatComplaintOutput(inserted),
          });
        } else if (insertErr) {
          console.warn('[ComplaintController:createComplaint] Supabase insert notice:', insertErr.message);
        }
      } catch (dbErr) {
        console.warn('[ComplaintController:createComplaint] Supabase error, falling back:', dbErr.message);
      }
    }

    // Resilient Fallback
    const fallbackTicket = mockStore.createComplaint({
      category: category || 'Stitching Fault',
      department: department || supervisor.department || 'Sewing Line 1',
      location: location || 'Production Floor',
      priority: priority || 'HIGH',
      description: description || 'Audit Defect Logged',
      beforePhoto: beforePhotoUrl,
      assignedTo: assignedToData,
      createdBy: createdByData,
      deadlineHours: hours,
      deadlineTimestamp,
    });

    res.status(201).json({
      success: true,
      message: `Complaint ${fallbackTicket.complaintId} created and assigned successfully.`,
      complaint: formatComplaintOutput(fallbackTicket),
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
    const now = new Date();

    if (isSupabaseConfigured && supabase) {
      try {
        let query = supabase.from('complaints').select('*');

        // RBAC filtering for Line In-Charge
        if ((req.user.role === 'ACTION_PERSON' || req.user.role === 'SUPERVISOR') && tab === 'my-line') {
          const userEmpId = req.user.employeeId;
          const userId = req.user.id || req.user._id;
          const userDept = req.user.department;

          let orFilters = [];
          if (userEmpId) orFilters.push(`assignedTo->>employeeId.eq.${userEmpId}`);
          if (userId) orFilters.push(`assignedTo->>userId.eq.${userId}`);
          if (userDept) orFilters.push(`department.ilike.${userDept}`);

          if (orFilters.length > 0) {
            query = query.or(orFilters.join(','));
          }
        }

        // Tab filtering
        if (tab === 'action-pending') {
          query = query.in('status', ['Assigned', 'In Progress', 'Rejected / Sent Back']);
        } else if (tab === 'under-verification') {
          query = query.eq('status', 'Under Verification');
        } else if (tab === 'closed') {
          query = query.eq('status', 'Closed');
        } else if (tab === 'overdue') {
          query = query.neq('status', 'Closed').lt('deadlineTimestamp', now.toISOString());
        } else if (status) {
          query = query.eq('status', status);
        }

        if (category) query = query.eq('category', category);
        if (priority) query = query.eq('priority', priority);
        if (department) query = query.eq('department', department);

        if (search) {
          const s = `%${search}%`;
          query = query.or(`complaintId.ilike.${s},location.ilike.${s},description.ilike.${s},category.ilike.${s},assignedTo->>name.ilike.${s}`);
        }

        const { data, error } = await query.order('createdAt', { ascending: false });

        if (!error && data) {
          // Sync any new mockStore tickets that might have been created during a transient Supabase latency
          const supabaseIds = new Set(data.map((d) => String(d.id || d.complaintId)));
          const mockTickets = mockStore.getComplaints(req.query, req.user);
          const unsyncedFromMock = mockTickets.filter(
            (m) => !supabaseIds.has(String(m._id || m.id)) && !supabaseIds.has(String(m.complaintId))
          );

          // Bidirectional sync: keep mockStore updated with Supabase records
          data.forEach((t) => {
            mockStore.createComplaint({ ...t, _id: t.id, complaintId: t.complaintId });
          });

          const combined = [...unsyncedFromMock, ...data];
          return res.status(200).json({
            success: true,
            count: combined.length,
            complaints: combined.map(formatComplaintOutput),
          });
        }
      } catch (dbErr) {
        console.warn('[ComplaintController:getComplaints] Supabase query notice:', dbErr.message);
      }
    }

    // Fallback store
    const complaints = mockStore.getComplaints(req.query, req.user);
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
    const paramId = req.params.id;

    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('complaints')
          .select('*')
          .or(`id.eq.${paramId},complaintId.eq.${paramId}`)
          .maybeSingle();

        if (!error && data) {
          mockStore.createComplaint({ ...data, _id: data.id, complaintId: data.complaintId });
          return res.status(200).json({
            success: true,
            complaint: formatComplaintOutput(data),
          });
        }
      } catch (e) {
        // fallback
      }
    }

    const complaint = mockStore.getComplaintById(paramId);
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
    const paramId = req.params.id;
    const now = new Date();

    if (isSupabaseConfigured && supabase) {
      try {
        const { data: current } = await supabase
          .from('complaints')
          .select('*')
          .or(`id.eq.${paramId},complaintId.eq.${paramId}`)
          .maybeSingle();

        if (current) {
          if (current.status === 'Closed') {
            return res.status(400).json({
              success: false,
              message: 'Cannot modify a closed complaint.',
            });
          }

          const timeline = Array.isArray(current.timeline) ? [...current.timeline] : [];
          timeline.push({
            action: 'IN_PROGRESS',
            performedBy: {
              name: req.user.name,
              role: req.user.role,
              employeeId: req.user.employeeId,
            },
            notes: req.body.notes || 'Line In-Charge commenced defect rectification and machine inspection.',
            timestamp: now.toISOString(),
          });

          const { data: updated, error } = await supabase
            .from('complaints')
            .update({
              status: 'In Progress',
              timeline,
              updatedAt: now.toISOString(),
            })
            .eq('id', current.id)
            .select()
            .single();

          if (!error && updated) {
            mockStore.updateComplaint(current.id, {
              status: 'In Progress',
              timeline: updated.timeline,
              updatedAt: now.toISOString(),
            });
            return res.status(200).json({
              success: true,
              message: `Complaint ${updated.complaintId} marked In Progress.`,
              complaint: formatComplaintOutput(updated),
            });
          }
        }
      } catch (dbErr) {
        console.warn('[ComplaintController:markInProgress] Supabase notice:', dbErr.message);
      }
    }

    const complaint = mockStore.getComplaintById(paramId);
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
      timestamp: now,
    });
    mockStore.updateComplaint(complaint._id, complaint);

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
    const paramId = req.params.id;
    const { actionNotes, feedbackRemarks } = req.body;
    const now = new Date();

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

    if (isSupabaseConfigured && supabase) {
      try {
        const { data: current } = await supabase
          .from('complaints')
          .select('*')
          .or(`id.eq.${paramId},complaintId.eq.${paramId}`)
          .maybeSingle();

        if (current) {
          if (current.status === 'Closed') {
            return res.status(400).json({
              success: false,
              message: 'Complaint has already been closed by audit.',
            });
          }

          const timeline = Array.isArray(current.timeline) ? [...current.timeline] : [];
          timeline.push({
            action: 'ACTION_SUBMITTED',
            performedBy: {
              name: req.user.name,
              role: req.user.role,
              employeeId: req.user.employeeId,
            },
            notes: `Corrective action submitted for audit verification. Action: "${actionNotes}". Root Cause: "${feedbackRemarks}"`,
            timestamp: now.toISOString(),
          });

          const { data: updated, error } = await supabase
            .from('complaints')
            .update({
              afterPhoto: afterPhotoUrl,
              actionNotes,
              feedbackRemarks,
              actualCompletedAt: now.toISOString(),
              status: 'Under Verification',
              timeline,
              updatedAt: now.toISOString(),
            })
            .eq('id', current.id)
            .select()
            .single();

          if (!error && updated) {
            mockStore.updateComplaint(current.id, {
              afterPhoto: afterPhotoUrl,
              actionNotes,
              feedbackRemarks,
              actualCompletedAt: now.toISOString(),
              status: 'Under Verification',
              timeline: updated.timeline,
              updatedAt: now.toISOString(),
            });
            return res.status(200).json({
              success: true,
              message: `Resolution for ${updated.complaintId} submitted for audit verification.`,
              complaint: formatComplaintOutput(updated),
            });
          }
        }
      } catch (dbErr) {
        console.warn('[ComplaintController:submitAction] Supabase notice:', dbErr.message);
      }
    }

    const complaint = mockStore.getComplaintById(paramId);
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
    complaint.actualCompletedAt = now;
    complaint.status = 'Under Verification';
    complaint.timeline.push({
      action: 'ACTION_SUBMITTED',
      performedBy: {
        name: req.user.name,
        role: req.user.role,
        employeeId: req.user.employeeId,
      },
      notes: `Corrective action submitted for audit verification. Action: "${actionNotes}". Root Cause: "${feedbackRemarks}"`,
      timestamp: now,
    });
    mockStore.updateComplaint(complaint._id, complaint);

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
    const paramId = req.params.id;
    const { decision, notes, rejectionReason } = req.body;
    const now = new Date();

    if (!['APPROVE', 'REJECT'].includes(decision)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid verification decision. Must be APPROVE or REJECT.',
      });
    }

    if (decision === 'REJECT' && !rejectionReason && !notes) {
      return res.status(400).json({
        success: false,
        message: 'A rejection reason is mandatory when returning a complaint to the line.',
      });
    }

    if (isSupabaseConfigured && supabase) {
      try {
        const { data: current } = await supabase
          .from('complaints')
          .select('*')
          .or(`id.eq.${paramId},complaintId.eq.${paramId}`)
          .maybeSingle();

        if (current) {
          const timeline = Array.isArray(current.timeline) ? [...current.timeline] : [];
          let newStatus = current.status;
          let updatePayload = { updatedAt: now.toISOString() };

          if (decision === 'APPROVE') {
            newStatus = 'Closed';
            updatePayload.status = newStatus;
            updatePayload.actualCompletedAt = now.toISOString();
            updatePayload.rejectionReason = '';
            timeline.push({
              action: 'CLOSED',
              performedBy: {
                name: req.user.name,
                role: req.user.role,
                employeeId: req.user.employeeId,
              },
              notes: notes || 'Audit verified Before/After photos and approved closure of ticket.',
              timestamp: now.toISOString(),
            });
          } else {
            const reason = rejectionReason || notes;
            newStatus = 'Rejected / Sent Back';
            updatePayload.status = newStatus;
            updatePayload.rejectionReason = reason;
            timeline.push({
              action: 'REJECTED',
              performedBy: {
                name: req.user.name,
                role: req.user.role,
                employeeId: req.user.employeeId,
              },
              notes: `Audit rejected resolution and returned to line. Reason: ${reason}`,
              timestamp: now.toISOString(),
            });
          }

          updatePayload.timeline = timeline;

          const { data: updated, error } = await supabase
            .from('complaints')
            .update(updatePayload)
            .eq('id', current.id)
            .select()
            .single();

          if (!error && updated) {
            mockStore.updateComplaint(current.id, updatePayload);
            return res.status(200).json({
              success: true,
              message: `Complaint ${updated.complaintId} has been ${decision === 'APPROVE' ? 'Approved & Closed' : 'Rejected & Returned to line'}.`,
              complaint: formatComplaintOutput(updated),
            });
          }
        }
      } catch (dbErr) {
        console.warn('[ComplaintController:verifyComplaint] Supabase notice:', dbErr.message);
      }
    }

    const complaint = mockStore.getComplaintById(paramId);
    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: 'Complaint not found.',
      });
    }

    if (decision === 'APPROVE') {
      complaint.status = 'Closed';
      complaint.actualCompletedAt = now;
      complaint.rejectionReason = '';
      complaint.timeline.push({
        action: 'CLOSED',
        performedBy: {
          name: req.user.name,
          role: req.user.role,
          employeeId: req.user.employeeId,
        },
        notes: notes || 'Audit verified Before/After photos and approved closure of ticket.',
        timestamp: now,
      });
    } else {
      const reason = rejectionReason || notes;
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
        timestamp: now,
      });
    }

    mockStore.updateComplaint(complaint._id, complaint);

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
    const paramId = req.params.id;
    const { comment } = req.body;
    const now = new Date();

    if (!comment || !comment.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Comment text cannot be empty.',
      });
    }

    if (isSupabaseConfigured && supabase) {
      try {
        const { data: current } = await supabase
          .from('complaints')
          .select('*')
          .or(`id.eq.${paramId},complaintId.eq.${paramId}`)
          .maybeSingle();

        if (current) {
          const timeline = Array.isArray(current.timeline) ? [...current.timeline] : [];
          timeline.push({
            action: 'COMMENT_ADDED',
            performedBy: {
              name: req.user.name,
              role: req.user.role,
              employeeId: req.user.employeeId,
            },
            notes: comment.trim(),
            timestamp: now.toISOString(),
          });

          const { data: updated, error } = await supabase
            .from('complaints')
            .update({ timeline, updatedAt: now.toISOString() })
            .eq('id', current.id)
            .select()
            .single();

          if (!error && updated) {
            mockStore.updateComplaint(current.id, { timeline: updated.timeline, updatedAt: now.toISOString() });
            return res.status(200).json({
              success: true,
              message: 'Remark recorded in ticket audit trail.',
              timeline: updated.timeline,
              complaint: formatComplaintOutput(updated),
            });
          }
        }
      } catch (dbErr) {
        console.warn('[ComplaintController:addTimelineComment] Supabase notice:', dbErr.message);
      }
    }

    const complaint = mockStore.getComplaintById(paramId);
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
      timestamp: now,
    });
    mockStore.updateComplaint(complaint._id, complaint);

    res.status(200).json({
      success: true,
      message: 'Remark recorded in ticket audit trail.',
      timeline: complaint.timeline,
      complaint: formatComplaintOutput(complaint),
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
    const now = new Date();

    if (isSupabaseConfigured && supabase) {
      try {
        let query = supabase.from('complaints').select('status, deadlineTimestamp, assignedTo, department');

        if ((req.user.role === 'ACTION_PERSON' || req.user.role === 'SUPERVISOR') && (req.query.scope === 'my-line' || req.query.tab === 'my-line')) {
          const userEmpId = req.user.employeeId;
          const userId = req.user.id || req.user._id;
          const userDept = req.user.department;

          let orFilters = [];
          if (userEmpId) orFilters.push(`assignedTo->>employeeId.eq.${userEmpId}`);
          if (userId) orFilters.push(`assignedTo->>userId.eq.${userId}`);
          if (userDept) orFilters.push(`department.ilike.${userDept}`);

          if (orFilters.length > 0) {
            query = query.or(orFilters.join(','));
          }
        }

        const { data: allComplaints, error } = await query;

        if (!error && allComplaints) {
          const activeTickets = allComplaints.filter((c) =>
            ['Assigned', 'In Progress', 'Rejected / Sent Back'].includes(c.status)
          ).length;
          const underVerification = allComplaints.filter((c) => c.status === 'Under Verification').length;
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
      } catch (dbErr) {
        console.warn('[ComplaintController:getKpiStats] Supabase notice:', dbErr.message);
      }
    }

    const allComplaints = mockStore.getComplaints();
    const activeTickets = allComplaints.filter((c) =>
      ['Assigned', 'In Progress', 'Rejected / Sent Back'].includes(c.status)
    ).length;
    const underVerification = allComplaints.filter((c) => c.status === 'Under Verification').length;
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

    let allComplaints = [];
    let allUsers = [];

    if (isSupabaseConfigured && supabase) {
      try {
        const [complaintsRes, usersRes] = await Promise.all([
          supabase.from('complaints').select('*').order('createdAt', { ascending: false }),
          supabase.from('users').select('*').eq('isActive', true),
        ]);

        if (!complaintsRes.error && complaintsRes.data) {
          allComplaints = complaintsRes.data.map(formatComplaintOutput);
        }
        if (!usersRes.error && usersRes.data) {
          allUsers = usersRes.data.map((u) => ({ ...u, _id: u.id }));
        }
      } catch (dbErr) {
        console.warn('[ComplaintController:getAdminOversightStats] Supabase notice:', dbErr.message);
      }
    }

    if (allComplaints.length === 0) {
      allComplaints = mockStore.getComplaints().map(formatComplaintOutput);
    }
    if (allUsers.length === 0) {
      allUsers = mockStore.getUsers();
    }

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

    const auditorActivity = {
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
      auditorsList: auditors.map((aud) => {
        const loggedByAud = allComplaints.filter(
          (c) =>
            c.createdBy?.employeeId === aud.employeeId ||
            (aud._id && c.createdBy?.userId === aud._id.toString())
        );
        return {
          _id: aud._id || aud.id,
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
      const closedTickets = assignedTickets.filter((c) => c.status === 'Closed');
      const rejected = assignedTickets.filter((c) => c.status === 'Rejected / Sent Back');
      const overdue = assignedTickets.filter(
        (c) => c.status !== 'Closed' && new Date(c.deadlineTimestamp) < now
      );

      const closedOnTime = closedTickets.filter((c) => {
        if (!c.actualCompletedAt) return true;
        return new Date(c.actualCompletedAt) <= new Date(c.deadlineTimestamp);
      }).length;
      const complianceRate = closedTickets.length > 0 ? Math.round((closedOnTime / closedTickets.length) * 100) : 100;

      return {
        _id: sup._id || sup.id,
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
        closedCount: closedTickets.length,
        rejectedCount: rejected.length,
        overdueCount: overdue.length,
        complianceRate,
        hasBreachedSla: overdue.length > 0,
        hasUnstartedDefects: unstarted.length > 0,
        hasUnresolvedRejections: rejected.length > 0,
      };
    });

    const recentActivityStream = [];
    allComplaints.forEach((complaint) => {
      if (Array.isArray(complaint.timeline)) {
        complaint.timeline.forEach((tl) => {
          recentActivityStream.push({
            id: tl._id || tl.id || `${complaint.complaintId}-${tl.timestamp}`,
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
      }
    });

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
          _id: c._id || c.id,
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
          _id: c._id || c.id,
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
          _id: c._id || c.id,
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
    const paramId = req.params.id;
    const { assignedToUserId, notes } = req.body;
    const now = new Date();

    if (!assignedToUserId) {
      return res.status(400).json({
        success: false,
        message: 'Please provide the target Line In-Charge / Supervisor to assign this task to.',
      });
    }

    let supervisor = null;

    if (isSupabaseConfigured && supabase) {
      try {
        const { data: sups } = await supabase
          .from('users')
          .select('*')
          .or(`id.eq.${assignedToUserId},employeeId.eq.${assignedToUserId},email.eq.${assignedToUserId}`)
          .limit(1);

        if (sups && sups.length > 0) {
          supervisor = sups[0];
        }
      } catch (e) {
        // fallback
      }
    }

    if (!supervisor) {
      supervisor =
        mockStore.findUserById(assignedToUserId) ||
        mockStore.getUsers().find(
          (u) =>
            u.employeeId === assignedToUserId ||
            u._id === assignedToUserId ||
            (u.email && u.email.toLowerCase() === assignedToUserId.toLowerCase())
        );
    }

    if (!supervisor) {
      return res.status(400).json({
        success: false,
        message: 'Selected Line In-Charge was not found in the Master Contact list.',
      });
    }

    const assignedTo = {
      userId: supervisor.id || supervisor._id,
      employeeId: supervisor.employeeId,
      name: supervisor.name,
      department: supervisor.department,
      designation: supervisor.designation,
      mobileNumber: supervisor.mobileNumber,
    };

    if (isSupabaseConfigured && supabase) {
      try {
        const { data: current } = await supabase
          .from('complaints')
          .select('*')
          .or(`id.eq.${paramId},complaintId.eq.${paramId}`)
          .maybeSingle();

        if (current) {
          const timeline = Array.isArray(current.timeline) ? [...current.timeline] : [];
          timeline.push({
            action: 'REASSIGNED',
            performedBy: {
              userId: req.user.id || req.user._id,
              employeeId: req.user.employeeId,
              name: req.user.name,
              role: req.user.role,
            },
            notes:
              notes ||
              `Task reassigned to Line In-Charge ${supervisor.name} (${supervisor.employeeId} - ${supervisor.department})`,
            timestamp: now.toISOString(),
          });

          const { data: updated, error } = await supabase
            .from('complaints')
            .update({
              assignedTo,
              timeline,
              updatedAt: now.toISOString(),
            })
            .eq('id', current.id)
            .select()
            .single();

          if (!error && updated) {
            mockStore.updateComplaint(current.id, {
              assignedTo,
              timeline: updated.timeline,
              updatedAt: now.toISOString(),
            });
            return res.status(200).json({
              success: true,
              message: `Task successfully assigned to ${supervisor.name} (${supervisor.department}).`,
              complaint: formatComplaintOutput(updated),
            });
          }
        }
      } catch (dbErr) {
        console.warn('[ComplaintController:reassignComplaint] Supabase notice:', dbErr.message);
      }
    }

    const complaint = mockStore.getComplaintById(paramId);
    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: 'Complaint ticket not found.',
      });
    }

    complaint.assignedTo = assignedTo;
    complaint.timeline.push({
      action: 'REASSIGNED',
      performedBy: {
        userId: req.user._id || req.user.id,
        employeeId: req.user.employeeId,
        name: req.user.name,
        role: req.user.role,
      },
      notes:
        notes ||
        `Task reassigned to Line In-Charge ${supervisor.name} (${supervisor.employeeId} - ${supervisor.department})`,
      timestamp: now,
    });
    mockStore.updateComplaint(complaint._id, complaint);

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

// @desc    Delete complaint / defect log
// @route   DELETE /api/complaints/:id
// @access  Private (Auditor or Admin)
const deleteComplaint = async (req, res) => {
  try {
    const paramId = req.params.id;

    // Delete from Supabase if configured
    if (isSupabaseConfigured && supabase) {
      try {
        await supabase
          .from('complaints')
          .delete()
          .or(`id.eq.${paramId},complaintId.eq.${paramId}`);
      } catch (err) {
        console.warn('[ComplaintController:deleteComplaint] Supabase delete warning:', err.message);
      }
    }

    // Delete from in-memory mock store
    mockStore.deleteComplaint(paramId);

    return res.status(200).json({
      success: true,
      message: `Defect log ${paramId} deleted successfully.`,
      id: paramId,
    });
  } catch (error) {
    console.error('[ComplaintController:deleteComplaint] Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete complaint log.',
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
  deleteComplaint,
};
