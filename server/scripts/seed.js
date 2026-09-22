const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const User = require('../models/User');
const Complaint = require('../models/Complaint');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

// Helper to generate a realistic defect sample image (SVG converted or saved as SVG/PNG)
const ensureSampleImages = () => {
  const uploadsDir = path.join(__dirname, '..', 'uploads');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  const sampleImages = [
    {
      name: 'sample-before-stitch.svg',
      title: 'DEFECT PROOF: SKIPPED STITCHES',
      badge: 'BEFORE RECTIFICATION',
      accent: '#ef4444',
      detail: 'Machine #14 - 8 skipped stitches per 10cm along collar seam line.',
    },
    {
      name: 'sample-after-stitch.svg',
      title: 'CORRECTED: RE-STITCHED & TENSION BALANCED',
      badge: 'AFTER PROOF (RESOLVED)',
      accent: '#10b981',
      detail: 'Needle replaced with Groz-Beckert 75/11; looper timing calibrated.',
    },
    {
      name: 'sample-before-oil.svg',
      title: 'DEFECT PROOF: NEEDLE BAR OIL DRIP',
      badge: 'BEFORE RECTIFICATION',
      accent: '#f59e0b',
      detail: 'Sewing Line 2 - Dark lubricant stain on right sleeve cuff panel.',
    },
    {
      name: 'sample-after-oil.svg',
      title: 'CORRECTED: SPOT CLEANED & WIPED',
      badge: 'AFTER PROOF (RESOLVED)',
      accent: '#10b981',
      detail: 'Ultrasonic stain remover spray applied; felt wick oiler adjusted.',
    },
    {
      name: 'sample-before-cut.svg',
      title: 'DEFECT PROOF: NEEDLE CUT / KNIT RUN',
      badge: 'BEFORE RECTIFICATION',
      accent: '#ef4444',
      detail: 'Spreading & Cutting - Micro tears at seam allowance of interlock rib.',
    },
    {
      name: 'sample-after-cut.svg',
      title: 'CORRECTED: BALL-POINT NEEDLE TESTED',
      badge: 'AFTER PROOF (RESOLVED)',
      accent: '#10b981',
      detail: 'Swapped to SES ball-point needle; 100 pcs 100% defect-free.',
    },
  ];

  sampleImages.forEach((img) => {
    const filePath = path.join(uploadsDir, img.name);
    const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600" width="100%" height="100%">
  <defs>
    <linearGradient id="grad-${img.name}" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#1e293b;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#0f172a;stop-opacity:1" />
    </linearGradient>
    <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
      <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#334155" stroke-width="0.8" stroke-opacity="0.4"/>
    </pattern>
  </defs>
  <rect width="100%" height="100%" fill="url(#grad-${img.name})" />
  <rect width="100%" height="100%" fill="url(#grid)" />
  
  <rect x="40" y="40" width="720" height="520" rx="16" fill="#1e293b" fill-opacity="0.8" stroke="#475569" stroke-width="2" />
  
  <!-- Header Badge -->
  <rect x="70" y="70" width="220" height="38" rx="8" fill="${img.accent}" />
  <text x="180" y="94" fill="#ffffff" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="13" font-weight="bold" text-anchor="middle" letter-spacing="1.2">${img.badge}</text>
  
  <!-- Textile QMS Stamp -->
  <text x="730" y="95" fill="#94a3b8" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="12" font-weight="600" text-anchor="end">GARMENT QMS AUDIT PROOF</text>
  
  <!-- Title -->
  <text x="70" y="150" fill="#f8fafc" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="24" font-weight="800">${img.title}</text>
  
  <!-- Spec Box -->
  <rect x="70" y="180" width="660" height="260" rx="12" fill="#0f172a" stroke="#334155" stroke-width="1.5" />
  
  <!-- Fabric simulation graphics -->
  <line x1="100" y1="310" x2="700" y2="310" stroke="${img.accent}" stroke-width="4" stroke-dasharray="12,8" />
  <circle cx="400" cy="310" r="45" fill="${img.accent}" fill-opacity="0.2" stroke="${img.accent}" stroke-width="2.5" />
  <text x="400" y="315" fill="#f8fafc" font-family="monospace" font-size="14" font-weight="bold" text-anchor="middle">INSPECTION ZONE</text>
  
  <text x="70" y="480" fill="#cbd5e1" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="15" font-weight="500">${img.detail}</text>
  <text x="70" y="520" fill="#64748b" font-family="monospace" font-size="12">METRO TEXTILE APPAREL QMS • REAR SENSOR CAMERA VERIFIED</text>
</svg>`;

    fs.writeFileSync(filePath, svgContent, 'utf8');
  });
};

const seedData = async () => {
  try {
    ensureSampleImages();

    console.log('[Seed] Clearing existing Users and Complaints collection...');
    await User.deleteMany({});
    await Complaint.deleteMany({});

    console.log('[Seed] Creating pre-configured Admin, Auditor & Line In-Charges...');

    // 1. Executive Plant Administrator
    const admin = await User.create({
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

    // 2. Auditor
    const auditor = await User.create({
      employeeId: 'AUD-001',
      name: 'Rajesh Kumar',
      email: 'auditor@factory.com',
      password: 'Password123!',
      role: 'AUDITOR',
      department: 'Central Quality Audit',
      designation: 'Chief QA & Compliance Auditor',
      mobileNumber: '+91 98765 43210',
      isActive: true,
    });

    // 3. Line Supervisors (4 Line In-Charges)
    const supervisor1 = await User.create({
      employeeId: 'SUP-101',
      name: 'Mohammad Arif',
      email: 'arif@factory.com',
      password: 'Password123!',
      role: 'ACTION_PERSON',
      department: 'Sewing Line 1',
      designation: 'Line 1 In-Charge',
      mobileNumber: '+91 98111 22334',
      isActive: true,
    });

    const supervisor2 = await User.create({
      employeeId: 'SUP-102',
      name: 'Priya Sharma',
      email: 'priya@factory.com',
      password: 'Password123!',
      role: 'ACTION_PERSON',
      department: 'Sewing Line 2',
      designation: 'Line 2 In-Charge',
      mobileNumber: '+91 98222 33445',
      isActive: true,
    });

    const supervisor3 = await User.create({
      employeeId: 'SUP-103',
      name: 'Kamal Hasan',
      email: 'kamal@factory.com',
      password: 'Password123!',
      role: 'ACTION_PERSON',
      department: 'Spreading & Cutting',
      designation: 'Cutting Section Head',
      mobileNumber: '+91 98333 44556',
      isActive: true,
    });

    const supervisor4 = await User.create({
      employeeId: 'SUP-104',
      name: 'Sunita Roy',
      email: 'sunita@factory.com',
      password: 'Password123!',
      role: 'ACTION_PERSON',
      department: 'Finishing & Packing',
      designation: 'Finishing Floor Manager',
      mobileNumber: '+91 98444 55667',
      isActive: true,
    });

    console.log('✅ [Seed] Successfully seeded 1 Auditor and 4 Line In-Charges.');

    const now = new Date();

    // Complaint 1: Active Assigned (14h SLA remaining - Normal state)
    const c1Deadline = new Date(now.getTime() + 14 * 60 * 60 * 1000);
    const complaint1 = new Complaint({
      complaintId: 'CMP-10492',
      category: 'Stitching Fault',
      department: 'Sewing Line 1',
      location: 'Machine #14 - Overlock',
      priority: 'CRITICAL',
      description: 'Severe skipped stitches and seam slippage identified on collar band seam of 100% cotton pique polo shirts (Order #PO-8821).',
      beforePhoto: '/uploads/sample-before-stitch.svg',
      assignedTo: {
        userId: supervisor1._id,
        employeeId: supervisor1.employeeId,
        name: supervisor1.name,
        department: supervisor1.department,
        designation: supervisor1.designation,
        mobileNumber: supervisor1.mobileNumber,
      },
      createdBy: {
        userId: auditor._id,
        employeeId: auditor.employeeId,
        name: auditor.name,
        role: auditor.role,
      },
      deadlineHours: 16,
      deadlineTimestamp: c1Deadline,
      status: 'Assigned',
      timeline: [
        {
          action: 'CREATED',
          performedBy: {
            name: auditor.name,
            role: auditor.role,
            employeeId: auditor.employeeId,
          },
          notes: 'Defect logged during inline roving audit. Strict 16-hour resolution SLA activated.',
          timestamp: new Date(now.getTime() - 2 * 60 * 60 * 1000),
        },
      ],
    });

    // Complaint 2: In Progress with Warning SLA (< 4 hours remaining - Amber Warning)
    const c2Deadline = new Date(now.getTime() + 2.5 * 60 * 60 * 1000); // 2.5h remaining (<4h warning!)
    const complaint2 = new Complaint({
      complaintId: 'CMP-10493',
      category: 'Oil / Stain',
      department: 'Sewing Line 2',
      location: 'Machine #08 - Single Needle Lockstitch',
      priority: 'HIGH',
      description: 'Needle bar oil leak causing dark spots on right sleeve cuff panels across 18 bundled garments.',
      beforePhoto: '/uploads/sample-before-oil.svg',
      assignedTo: {
        userId: supervisor2._id,
        employeeId: supervisor2.employeeId,
        name: supervisor2.name,
        department: supervisor2.department,
        designation: supervisor2.designation,
        mobileNumber: supervisor2.mobileNumber,
      },
      createdBy: {
        userId: auditor._id,
        employeeId: auditor.employeeId,
        name: auditor.name,
        role: auditor.role,
      },
      deadlineHours: 12,
      deadlineTimestamp: c2Deadline,
      status: 'In Progress',
      timeline: [
        {
          action: 'CREATED',
          performedBy: {
            name: auditor.name,
            role: auditor.role,
            employeeId: auditor.employeeId,
          },
          notes: 'Oil defect detected at End-of-Line table.',
          timestamp: new Date(now.getTime() - 9.5 * 60 * 60 * 1000),
        },
        {
          action: 'IN_PROGRESS',
          performedBy: {
            name: supervisor2.name,
            role: supervisor2.role,
            employeeId: supervisor2.employeeId,
          },
          notes: 'Mechanic dispatched to replace needle bar seal; spot cleaning underway on soiled pieces.',
          timestamp: new Date(now.getTime() - 4 * 60 * 60 * 1000),
        },
      ],
    });

    // Complaint 3: Under Verification (Action Person submitted resolution, awaiting Auditor Review!)
    const c3Deadline = new Date(now.getTime() + 10 * 60 * 60 * 1000);
    const complaint3 = new Complaint({
      complaintId: 'CMP-10494',
      category: 'Fabric Defect',
      department: 'Spreading & Cutting',
      location: 'Cutting Table #3 - Automatic Knife',
      priority: 'MEDIUM',
      description: 'Micro tears and knit fabric runs caused by dull straight-knife blade during ply trimming.',
      beforePhoto: '/uploads/sample-before-cut.svg',
      afterPhoto: '/uploads/sample-after-cut.svg',
      assignedTo: {
        userId: supervisor3._id,
        employeeId: supervisor3.employeeId,
        name: supervisor3.name,
        department: supervisor3.department,
        designation: supervisor3.designation,
        mobileNumber: supervisor3.mobileNumber,
      },
      createdBy: {
        userId: auditor._id,
        employeeId: auditor.employeeId,
        name: auditor.name,
        role: auditor.role,
      },
      deadlineHours: 18,
      deadlineTimestamp: c3Deadline,
      status: 'Under Verification',
      actionNotes: 'Replaced blunt knife with new high-speed steel blade #10. Re-trimmed damaged plies with clean margin.',
      feedbackRemarks: 'Preventive maintenance schedule updated: knife blade inspection interval reduced from 48h to 24h. Spreading operator retrained on blade tensioning.',
      timeline: [
        {
          action: 'CREATED',
          performedBy: {
            name: auditor.name,
            role: auditor.role,
            employeeId: auditor.employeeId,
          },
          notes: 'Defect logged during random cutting inspection.',
          timestamp: new Date(now.getTime() - 8 * 60 * 60 * 1000),
        },
        {
          action: 'IN_PROGRESS',
          performedBy: {
            name: supervisor3.name,
            role: supervisor3.role,
            employeeId: supervisor3.employeeId,
          },
          notes: 'Knife replacement initiated on Cutting Table #3.',
          timestamp: new Date(now.getTime() - 5 * 60 * 60 * 1000),
        },
        {
          action: 'ACTION_SUBMITTED',
          performedBy: {
            name: supervisor3.name,
            role: supervisor3.role,
            employeeId: supervisor3.employeeId,
          },
          notes: 'Resolution submitted with After Photo proof. Awaiting audit sign-off.',
          timestamp: new Date(now.getTime() - 1 * 60 * 60 * 1000),
        },
      ],
    });

    // Complaint 4: Overdue Alert (Deadline expired - Pulsating Red Overdue State!)
    const c4Deadline = new Date(now.getTime() - 5.5 * 60 * 60 * 1000); // 5.5h overdue!
    const complaint4 = new Complaint({
      complaintId: 'CMP-10488',
      category: 'Measurement / Fit',
      department: 'Sewing Line 1',
      location: 'Machine #22 - Waistband Folder',
      priority: 'CRITICAL',
      description: 'Waistband width tolerance deviation (+2.8cm over specification) detected on ladies chino trousers.',
      beforePhoto: '/uploads/sample-before-stitch.svg',
      assignedTo: {
        userId: supervisor1._id,
        employeeId: supervisor1.employeeId,
        name: supervisor1.name,
        department: supervisor1.department,
        designation: supervisor1.designation,
        mobileNumber: supervisor1.mobileNumber,
      },
      createdBy: {
        userId: auditor._id,
        employeeId: auditor.employeeId,
        name: auditor.name,
        role: auditor.role,
      },
      deadlineHours: 12,
      deadlineTimestamp: c4Deadline,
      status: 'In Progress',
      timeline: [
        {
          action: 'CREATED',
          performedBy: {
            name: auditor.name,
            role: auditor.role,
            employeeId: auditor.employeeId,
          },
          notes: 'CRITICAL: Spec sheet discrepancy logged. 12h resolution SLA assigned.',
          timestamp: new Date(now.getTime() - 17.5 * 60 * 60 * 1000),
        },
        {
          action: 'IN_PROGRESS',
          performedBy: {
            name: supervisor1.name,
            role: supervisor1.role,
            employeeId: supervisor1.employeeId,
          },
          notes: 'Attachment folder angle being recalibrated by tooling engineer.',
          timestamp: new Date(now.getTime() - 12 * 60 * 60 * 1000),
        },
      ],
    });

    // Complaint 5: Closed & Approved (Defect successfully rectified and signed off)
    const c5Deadline = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const complaint5 = new Complaint({
      complaintId: 'CMP-10475',
      category: 'Finishing / Pressing',
      department: 'Finishing & Packing',
      location: 'Steam Press Table #2',
      priority: 'LOW',
      description: 'Excessive iron shine gloss on dark navy twill jackets from worn Teflon iron shoe.',
      beforePhoto: '/uploads/sample-before-oil.svg',
      afterPhoto: '/uploads/sample-after-oil.svg',
      assignedTo: {
        userId: supervisor4._id,
        employeeId: supervisor4.employeeId,
        name: supervisor4.name,
        department: supervisor4.department,
        designation: supervisor4.designation,
        mobileNumber: supervisor4.mobileNumber,
      },
      createdBy: {
        userId: auditor._id,
        employeeId: auditor.employeeId,
        name: auditor.name,
        role: auditor.role,
      },
      deadlineHours: 24,
      deadlineTimestamp: c5Deadline,
      status: 'Closed',
      actualCompletedAt: new Date(now.getTime() - 26 * 60 * 60 * 1000),
      actionNotes: 'Replaced Teflon shoe on iron press #2; all 40 pieces steamed with velvet touch board.',
      feedbackRemarks: 'Weekly replacement cycle established for Teflon iron shoes on all press stations.',
      timeline: [
        {
          action: 'CREATED',
          performedBy: {
            name: auditor.name,
            role: auditor.role,
            employeeId: auditor.employeeId,
          },
          notes: 'Shine defect noted during pre-packing audit.',
          timestamp: new Date(now.getTime() - 36 * 60 * 60 * 1000),
        },
        {
          action: 'ACTION_SUBMITTED',
          performedBy: {
            name: supervisor4.name,
            role: supervisor4.role,
            employeeId: supervisor4.employeeId,
          },
          notes: 'Rectification complete. Samples re-inspected under standard D65 lightbox.',
          timestamp: new Date(now.getTime() - 27 * 60 * 60 * 1000),
        },
        {
          action: 'CLOSED',
          performedBy: {
            name: auditor.name,
            role: auditor.role,
            employeeId: auditor.employeeId,
          },
          notes: 'Before and After comparison inspected. Garments meet AQL 1.5 standard. Closed.',
          timestamp: new Date(now.getTime() - 26 * 60 * 60 * 1000),
        },
      ],
    });

    await Complaint.insertMany([
      complaint1,
      complaint2,
      complaint3,
      complaint4,
      complaint5,
    ]);

    console.log('✅ [Seed] Successfully seeded 5 comprehensive complaint tickets spanning all lifecycle states.');
  } catch (error) {
    console.error('❌ [Seed] Error during seeding:', error);
    throw error;
  }
};

// If run directly via CLI
if (require.main === module) {
  const { connectDB, disconnectDB } = require('../config/db');

  connectDB()
    .then(async () => {
      await seedData();
      await disconnectDB();
      console.log('🎉 Seeding completed successfully!');
      process.exit(0);
    })
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}

module.exports = { seedData };
