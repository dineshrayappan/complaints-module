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

  // Extract audit workflow fields if embedded in description or native
  if (!obj.requirement && obj.description && obj.description.includes('[Audit Requirement:')) {
    const m = obj.description.match(/\[Audit Requirement:\s*(.*?)\]/);
    if (m) obj.requirement = m[1];
  }
  if (!obj.requirement) {
    obj.requirement = 'AQL 1.5 Workmanship Standard';
  }

  if (typeof obj.capRequired === 'undefined') {
    if (obj.description && obj.description.includes('[CAP Required:')) {
      obj.capRequired = obj.description.includes('[CAP Required: YES]');
    } else {
      obj.capRequired = false;
    }
  }

  if (!obj.verificationMethod && obj.description && obj.description.includes('[Verification:')) {
    const m = obj.description.match(/\[Verification:\s*(.*?)\]/);
    if (m) obj.verificationMethod = m[1];
  }
  if (!obj.verificationMethod) {
    obj.verificationMethod = 'Physical Floor Re-inspection';
  }

  if (!obj.riskSeverity) {
    obj.riskSeverity = obj.priority || 'HIGH';
  }

  return obj;
};

// Helper to safely parse timeline whether it is an Array or JSON String
const parseTimeline = (tl) => {
  if (Array.isArray(tl)) return [...tl];
  if (typeof tl === 'string') {
    try {
      const parsed = JSON.parse(tl);
      if (Array.isArray(parsed)) return parsed;
    } catch (e) {}
  }
  return [];
};

// Helper to extract photo data URL from base64, memory buffer, disk file, or URL
const extractPhotoPayload = (req, fieldName, base64FieldName) => {
  if (req.body && req.body[base64FieldName] && req.body[base64FieldName].startsWith('data:image/')) {
    return ensureDataUrl(req.body[base64FieldName]);
  }
  if (req.file) {
    try {
      const mime = req.file.mimetype || 'image/jpeg';
      if (req.file.buffer) {
        return ensureDataUrl(`data:${mime};base64,${req.file.buffer.toString('base64')}`);
      }
      if (req.file.path && fs.existsSync(req.file.path)) {
        const fileBuf = fs.readFileSync(req.file.path);
        return ensureDataUrl(`data:${mime};base64,${fileBuf.toString('base64')}`);
      }
    } catch (e) {}
    if (req.file.filename) {
      return ensureDataUrl(getFileUrl(req, req.file.filename));
    }
  }
  if (req.body && req.body[fieldName]) {
    return ensureDataUrl(req.body[fieldName]);
  }
  if (req.body && req.body[`${fieldName}Url`]) {
    return ensureDataUrl(req.body[`${fieldName}Url`]);
  }
  return null;
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
      findingDescription = '',
      assignedToUserId,
      deadlineHours,
      requirement = 'AQL 1.5 Workmanship Standard',
      riskSeverity,
      capRequired,
      verificationMethod = 'Physical Floor Re-inspection',
      dueDate,
    } = req.body;

    const targetSupervisorId = assignedToUserId || req.body.assignedToId;

    const now = new Date();
    let hours = Number(deadlineHours);
    if (isNaN(hours) || hours < 1) {
      hours = 16;
    }

    let deadlineTimestamp;
    if (dueDate && !isNaN(new Date(dueDate).getTime())) {
      deadlineTimestamp = new Date(dueDate);
      hours = Math.max(1, Math.round((deadlineTimestamp.getTime() - now.getTime()) / (1000 * 60 * 60)));
    } else {
      deadlineTimestamp = new Date(now.getTime() + hours * 60 * 60 * 1000);
    }

    const effectivePriority = (riskSeverity || priority || 'HIGH').toUpperCase();
    const effectiveRequirement = requirement || 'AQL 1.5 Workmanship Standard';
    const isCapRequired = String(capRequired) === 'true' || capRequired === true;
    const effectiveVerification = verificationMethod || 'Physical Floor Re-inspection';
    const rawFinding = findingDescription || description || 'Non-Conformance Observed';

    // Build enriched description to permanently preserve audit criteria
    let enrichedDescription = rawFinding;
    if (!enrichedDescription.includes('[Audit Requirement:')) {
      enrichedDescription = `[Audit Requirement: ${effectiveRequirement}] [Risk: ${effectivePriority}] [CAP Required: ${isCapRequired ? 'YES' : 'NO'}] [Verification: ${effectiveVerification}]\n\n${rawFinding}`;
    }

    // Extract Before Photo (memory buffer, disk file, base64 or URL)
    const beforePhotoUrl = extractPhotoPayload(req, 'beforePhoto', 'beforePhotoBase64');

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

    const supervisorIdMap = {
      '6ab21322cd50706ee2a84637': 'SUP-101',
      '6ab21322cd50706ee2a84638': 'SUP-102',
      '6ab21322cd50706ee2a84639': 'SUP-103',
      '6ab21322cd50706ee2a84640': 'SUP-104',
      '6ab21322cd50706ee2a84641': 'SUP-105',
      '6ab21322cd50706ee2a84642': 'SUP-106',
      '6ab21322cd50706ee2a84643': 'SUP-107',
      '6ab21322cd50706ee2a84644': 'SUP-108',
      '6ab21322cd50706ee2a84645': 'SUP-109',
      '6ab21322cd50706ee2a84646': 'SUP-110',
    };
    const lookupSupervisorId = supervisorIdMap[targetSupervisorId] || targetSupervisorId;

    // Lookup supervisor from Supabase or mockStore
    let supervisor = null;

    if (isSupabaseConfigured && supabase && lookupSupervisorId) {
      try {
        const { data: sups } = await supabase
          .from('users')
          .select('*')
          .or(`id.eq.${lookupSupervisorId},employeeId.eq.${lookupSupervisorId},email.eq.${lookupSupervisorId}`)
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
        mockStore.findUserById(lookupSupervisorId) ||
        mockStore.getUsers().find((u) => u.employeeId === lookupSupervisorId) ||
        mockStore.getUsers().find((u) => u.role === 'ACTION_PERSON') || {
          _id: 'usr-sup-101',
          id: 'usr-sup-101',
          employeeId: 'SUP-101',
          name: 'Mohammad Arif',
          department: department || 'Sewing Line 1',
          designation: 'Line 1 In-Charge',
          mobileNumber: '+91 98111 22334',
        };
    }

    const assignedToData = {
      userId: supervisor.id || supervisor._id || 'usr-sup-101',
      employeeId: supervisor.employeeId || 'SUP-101',
      name: supervisor.name || 'Mohammad Arif',
      department: supervisor.department || department || 'Sewing Line 1',
      designation: supervisor.designation || 'Line In-Charge',
      mobileNumber: supervisor.mobileNumber || '+91 98111 22334',
    };

    const randomSuffix = Math.floor(10000 + Math.random() * 90000);
    const complaintId = `CMP-${randomSuffix}`;

    const initialTimeline = [
      {
        action: 'CREATED',
        performedBy: {
          userId: createdByData.userId,
          name: createdByData.name,
          role: createdByData.role,
          employeeId: createdByData.employeeId,
        },
        notes: `NC logged for ${department || assignedToData.department} against standard "${effectiveRequirement}". Risk: ${effectivePriority}. CAP Required: ${isCapRequired ? 'YES' : 'NO'}. Verification: ${effectiveVerification}. Assigned to ${assignedToData.name} (${assignedToData.designation}) with ${hours}h SLA.`,
        timestamp: now.toISOString(),
      },
    ];

    if (isSupabaseConfigured && supabase) {
      try {
        const basePayload = {
          complaintId,
          category: category || 'Stitching Fault',
          department: department || supervisor.department || 'Sewing Line 1',
          location: location || 'Production Floor',
          priority: effectivePriority,
          description: enrichedDescription,
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

        let inserted = null;
        try {
          const fullPayload = {
            ...basePayload,
            requirement: effectiveRequirement,
            riskSeverity: effectivePriority,
            capRequired: isCapRequired,
            verificationMethod: effectiveVerification,
          };
          const { data, error } = await supabase.from('complaints').insert([fullPayload]).select().single();
          if (!error && data) {
            inserted = data;
          } else {
            const { data: baseData, error: baseErr } = await supabase.from('complaints').insert([basePayload]).select().single();
            if (baseErr) throw baseErr;
            inserted = {
              ...baseData,
              requirement: effectiveRequirement,
              riskSeverity: effectivePriority,
              capRequired: isCapRequired,
              verificationMethod: effectiveVerification,
            };
          }
        } catch (supabaseErr) {
          console.warn('[ComplaintController:createComplaint] Supabase column fallback:', supabaseErr.message);
          const { data: fallbackData, error: fallbackErr } = await supabase.from('complaints').insert([basePayload]).select().single();
          if (fallbackErr) throw fallbackErr;
          inserted = fallbackData;
        }

        if (inserted) {
          mockStore.createComplaint({
            ...inserted,
            _id: inserted.id,
            complaintId: inserted.complaintId,
            requirement: effectiveRequirement,
            riskSeverity: effectivePriority,
            capRequired: isCapRequired,
            verificationMethod: effectiveVerification,
          });
          return res.status(201).json({
            success: true,
            message: `NC Defect ${inserted.complaintId} created and assigned successfully.`,
            complaint: formatComplaintOutput({
              ...inserted,
              requirement: effectiveRequirement,
              riskSeverity: effectivePriority,
              capRequired: isCapRequired,
              verificationMethod: effectiveVerification,
            }),
          });
        }
      } catch (dbErr) {
        console.error('[ComplaintController:createComplaint] Supabase exception:', dbErr);
        return res.status(500).json({
          success: false,
          message: `Database error: ${dbErr.message}`,
          error: dbErr.message,
        });
      }
    }

    // Fallback when Supabase is not configured
    const fallbackTicket = mockStore.createComplaint({
      category: category || 'Stitching Fault',
      department: department || supervisor.department || 'Sewing Line 1',
      location: location || 'Production Floor',
      priority: effectivePriority,
      description: enrichedDescription,
      requirement: effectiveRequirement,
      riskSeverity: effectivePriority,
      capRequired: isCapRequired,
      verificationMethod: effectiveVerification,
      beforePhoto: beforePhotoUrl,
      assignedTo: assignedToData,
      createdBy: createdByData,
      deadlineHours: hours,
      deadlineTimestamp,
    });

    return res.status(201).json({
      success: true,
      message: `NC Defect ${fallbackTicket.complaintId} created and assigned successfully (offline mode).`,
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

        if (error) {
          console.error('[ComplaintController:getComplaints] Supabase query error:', error.message);
          return res.status(500).json({
            success: false,
            message: 'Database query error: ' + error.message,
            error: error.message,
          });
        }

        if (data) {
          // Keep in-memory store strictly synchronized as a warm cache
          mockStore.syncWithSupabase(data);

          return res.status(200).json({
            success: true,
            count: data.length,
            complaints: data.map(formatComplaintOutput),
          });
        }
      } catch (dbErr) {
        console.error('[ComplaintController:getComplaints] Supabase query exception:', dbErr.message);
        return res.status(500).json({
          success: false,
          message: 'Database query exception: ' + dbErr.message,
          error: dbErr.message,
        });
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
        const { data: current, error: findErr } = await supabase
          .from('complaints')
          .select('*')
          .or(`id.eq.${paramId},complaintId.eq.${paramId}`)
          .maybeSingle();

        if (findErr) {
          console.error('[ComplaintController:markInProgress] Supabase find error:', findErr.message);
          return res.status(500).json({
            success: false,
            message: 'Database error looking up complaint: ' + findErr.message,
            error: findErr.message,
          });
        }

        if (!current) {
          return res.status(404).json({
            success: false,
            message: 'Complaint not found in database.',
          });
        }

        if (current.status === 'Closed') {
          return res.status(400).json({
            success: false,
            message: 'Cannot modify a closed complaint.',
          });
        }

        const timeline = parseTimeline(current.timeline);
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

        const { data: updated, error: updateErr } = await supabase
          .from('complaints')
          .update({
            status: 'In Progress',
            timeline,
            updatedAt: now.toISOString(),
          })
          .eq('id', current.id)
          .select()
          .single();

        if (updateErr) {
          console.error('[ComplaintController:markInProgress] Supabase update error:', updateErr.message);
          return res.status(500).json({
            success: false,
            message: 'Failed to update complaint in database: ' + updateErr.message,
            error: updateErr.message,
          });
        }

        if (updated) {
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
      } catch (dbErr) {
        console.error('[ComplaintController:markInProgress] Supabase exception:', dbErr.message);
        return res.status(500).json({
          success: false,
          message: 'Database exception: ' + dbErr.message,
          error: dbErr.message,
        });
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

    return res.status(200).json({
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

    const afterPhotoUrl = extractPhotoPayload(req, 'afterPhoto', 'afterPhotoBase64');

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
        const { data: current, error: findErr } = await supabase
          .from('complaints')
          .select('*')
          .or(`id.eq.${paramId},complaintId.eq.${paramId}`)
          .maybeSingle();

        if (findErr) {
          console.error('[ComplaintController:submitAction] Supabase lookup error:', findErr.message);
          return res.status(500).json({
            success: false,
            message: 'Database error looking up complaint: ' + findErr.message,
            error: findErr.message,
          });
        }

        if (!current) {
          return res.status(404).json({
            success: false,
            message: 'Complaint not found in database.',
          });
        }

        if (current.status === 'Closed') {
          return res.status(400).json({
            success: false,
            message: 'Complaint has already been closed by audit.',
          });
        }

        const timeline = parseTimeline(current.timeline);
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

        const { data: updated, error: updateErr } = await supabase
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

        if (updateErr) {
          console.error('[ComplaintController:submitAction] Supabase update error:', updateErr.message);
          return res.status(500).json({
            success: false,
            message: 'Failed to record action in database: ' + updateErr.message,
            error: updateErr.message,
          });
        }

        if (updated) {
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
      } catch (dbErr) {
        console.error('[ComplaintController:submitAction] Supabase exception:', dbErr.message);
        return res.status(500).json({
          success: false,
          message: 'Database exception: ' + dbErr.message,
          error: dbErr.message,
        });
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

    return res.status(200).json({
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
        const { data: current, error: findErr } = await supabase
          .from('complaints')
          .select('*')
          .or(`id.eq.${paramId},complaintId.eq.${paramId}`)
          .maybeSingle();

        if (findErr) {
          console.error('[ComplaintController:verifyComplaint] Supabase find error:', findErr.message);
          return res.status(500).json({
            success: false,
            message: 'Database error looking up complaint: ' + findErr.message,
            error: findErr.message,
          });
        }

        if (!current) {
          return res.status(404).json({
            success: false,
            message: 'Complaint not found in database.',
          });
        }

        const timeline = parseTimeline(current.timeline);
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

        const { data: updated, error: updateErr } = await supabase
          .from('complaints')
          .update(updatePayload)
          .eq('id', current.id)
          .select()
          .single();

        if (updateErr) {
          console.error('[ComplaintController:verifyComplaint] Supabase update error:', updateErr.message);
          return res.status(500).json({
            success: false,
            message: 'Failed to record audit decision in database: ' + updateErr.message,
            error: updateErr.message,
          });
        }

        if (updated) {
          mockStore.updateComplaint(current.id, updatePayload);
          return res.status(200).json({
            success: true,
            message: `Complaint ${updated.complaintId} has been ${decision === 'APPROVE' ? 'Approved & Closed' : 'Rejected & Returned to line'}.`,
            complaint: formatComplaintOutput(updated),
          });
        }
      } catch (dbErr) {
        console.error('[ComplaintController:verifyComplaint] Supabase exception:', dbErr.message);
        return res.status(500).json({
          success: false,
          message: 'Database exception: ' + dbErr.message,
          error: dbErr.message,
        });
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

    return res.status(200).json({
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
        const { data: current, error: findErr } = await supabase
          .from('complaints')
          .select('*')
          .or(`id.eq.${paramId},complaintId.eq.${paramId}`)
          .maybeSingle();

        if (findErr) {
          console.error('[ComplaintController:addTimelineComment] Supabase find error:', findErr.message);
          return res.status(500).json({
            success: false,
            message: 'Database error looking up complaint: ' + findErr.message,
            error: findErr.message,
          });
        }

        if (!current) {
          return res.status(404).json({
            success: false,
            message: 'Complaint not found in database.',
          });
        }

        const timeline = parseTimeline(current.timeline);
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

        const { data: updated, error: updateErr } = await supabase
          .from('complaints')
          .update({ timeline, updatedAt: now.toISOString() })
          .eq('id', current.id)
          .select()
          .single();

        if (updateErr) {
          console.error('[ComplaintController:addTimelineComment] Supabase update error:', updateErr.message);
          return res.status(500).json({
            success: false,
            message: 'Failed to record remark in database: ' + updateErr.message,
            error: updateErr.message,
          });
        }

        if (updated) {
          mockStore.updateComplaint(current.id, { timeline: updated.timeline, updatedAt: now.toISOString() });
          return res.status(200).json({
            success: true,
            message: 'Remark recorded in ticket audit trail.',
            timeline: updated.timeline,
            complaint: formatComplaintOutput(updated),
          });
        }
      } catch (dbErr) {
        console.error('[ComplaintController:addTimelineComment] Supabase exception:', dbErr.message);
        return res.status(500).json({
          success: false,
          message: 'Database exception: ' + dbErr.message,
          error: dbErr.message,
        });
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

    return res.status(200).json({
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

    const supervisorIdMap = {
      '6ab21322cd50706ee2a84637': 'SUP-101',
      '6ab21322cd50706ee2a84638': 'SUP-102',
      '6ab21322cd50706ee2a84639': 'SUP-103',
      '6ab21322cd50706ee2a84640': 'SUP-104',
      '6ab21322cd50706ee2a84641': 'SUP-105',
      '6ab21322cd50706ee2a84642': 'SUP-106',
      '6ab21322cd50706ee2a84643': 'SUP-107',
      '6ab21322cd50706ee2a84644': 'SUP-108',
      '6ab21322cd50706ee2a84645': 'SUP-109',
      '6ab21322cd50706ee2a84646': 'SUP-110',
    };
    const lookupSupervisorId = supervisorIdMap[assignedToUserId] || assignedToUserId;

    if (isSupabaseConfigured && supabase) {
      try {
        const { data: sups } = await supabase
          .from('users')
          .select('*')
          .or(`id.eq.${lookupSupervisorId},employeeId.eq.${lookupSupervisorId},email.eq.${lookupSupervisorId}`)
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
        mockStore.findUserById(lookupSupervisorId) ||
        mockStore.getUsers().find(
          (u) =>
            u.employeeId === lookupSupervisorId ||
            u._id === lookupSupervisorId ||
            (u.email && u.email.toLowerCase() === lookupSupervisorId.toLowerCase())
        );
    }

    if (!supervisor) {
      return res.status(400).json({
        success: false,
        message: 'Selected Line In-Charge was not found in the Master Contact list.',
      });
    }

    const assignedTo = {
      userId: supervisor.id || supervisor._id || 'usr-sup-101',
      employeeId: supervisor.employeeId || 'SUP-101',
      name: supervisor.name || 'Mohammad Arif',
      department: supervisor.department || 'Sewing Line 1',
      designation: supervisor.designation || 'Line In-Charge',
      mobileNumber: supervisor.mobileNumber || '+91 98111 22334',
    };

    if (isSupabaseConfigured && supabase) {
      try {
        const { data: current, error: findErr } = await supabase
          .from('complaints')
          .select('*')
          .or(`id.eq.${paramId},complaintId.eq.${paramId}`)
          .maybeSingle();

        if (findErr) {
          console.error('[ComplaintController:reassignComplaint] Supabase lookup error:', findErr.message);
          return res.status(500).json({
            success: false,
            message: 'Database error looking up complaint: ' + findErr.message,
            error: findErr.message,
          });
        }

        if (!current) {
          return res.status(404).json({
            success: false,
            message: 'Complaint not found in database.',
          });
        }

        const timeline = parseTimeline(current.timeline);
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

        const { data: updated, error: updateErr } = await supabase
          .from('complaints')
          .update({
            assignedTo,
            timeline,
            updatedAt: now.toISOString(),
          })
          .eq('id', current.id)
          .select()
          .single();

        if (updateErr) {
          console.error('[ComplaintController:reassignComplaint] Supabase update error:', updateErr.message);
          return res.status(500).json({
            success: false,
            message: 'Failed to update assignment in database: ' + updateErr.message,
            error: updateErr.message,
          });
        }

        if (updated) {
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
      } catch (dbErr) {
        console.error('[ComplaintController:reassignComplaint] Supabase exception:', dbErr.message);
        return res.status(500).json({
          success: false,
          message: 'Database exception: ' + dbErr.message,
          error: dbErr.message,
        });
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
        const { error: delErr } = await supabase
          .from('complaints')
          .delete()
          .or(`id.eq.${paramId},complaintId.eq.${paramId}`);

        if (delErr) {
          console.error('[ComplaintController:deleteComplaint] Supabase delete error:', delErr.message);
          return res.status(500).json({
            success: false,
            message: 'Failed to delete complaint from database: ' + delErr.message,
            error: delErr.message,
          });
        }
      } catch (err) {
        console.error('[ComplaintController:deleteComplaint] Supabase exception:', err.message);
        return res.status(500).json({
          success: false,
          message: 'Database exception: ' + err.message,
          error: err.message,
        });
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
    return res.status(500).json({
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
