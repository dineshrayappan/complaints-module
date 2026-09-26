const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const { supabase, isSupabaseConfigured } = require('../config/supabase');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const uploadsDir = path.join(__dirname, '..', 'uploads');

// Helper to generate a realistic defect sample image (SVG)
const ensureSampleImages = () => {
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
  ensureSampleImages();

  if (!isSupabaseConfigured || !supabase) {
    console.log('⚡ [Seed] Supabase credentials not set in .env. Falling back to built-in in-memory mock store.');
    return;
  }

  try {
    console.log('[Seed] Seeding Supabase PostgreSQL database...');

    const salt = await bcrypt.genSalt(10);
    const adminPassword = await bcrypt.hash('admin123', salt);
    const auditorPassword = await bcrypt.hash('auditor123', salt);
    const supervisorPassword = await bcrypt.hash('supervisor123', salt);

    const initialUsers = [
      {
        id: 'usr-adm-001',
        employeeId: 'ADM-001',
        name: 'Anil Mehta',
        email: 'admin@factory.com',
        password: adminPassword,
        role: 'ADMIN',
        department: 'Plant Operations & Executive Oversight',
        designation: 'General Operations Director',
        mobileNumber: '+91 98000 11223',
        isActive: true,
      },
      {
        id: 'usr-aud-001',
        employeeId: 'AUD-001',
        name: 'Rajesh Kumar',
        email: 'auditor@factory.com',
        password: auditorPassword,
        role: 'AUDITOR',
        department: 'Central Quality Audit',
        designation: 'Chief QA & Compliance Auditor',
        mobileNumber: '+91 98765 43210',
        isActive: true,
      },
      {
        id: 'usr-aud-002',
        employeeId: 'AUD-002',
        name: 'Dinesh Rayappan',
        email: 'dinesh@factory.com',
        password: auditorPassword,
        role: 'AUDITOR',
        department: 'Central Quality Audit',
        designation: 'Internal Quality Auditor',
        mobileNumber: '+91 98111 55667',
        isActive: true,
      },
      {
        id: 'usr-sup-101',
        employeeId: 'SUP-101',
        name: 'Mohammad Arif',
        email: 'arif@factory.com',
        password: supervisorPassword,
        role: 'ACTION_PERSON',
        department: 'Sewing Line 1',
        designation: 'Line 1 In-Charge',
        mobileNumber: '+91 98111 22334',
        isActive: true,
      },
      {
        id: 'usr-sup-102',
        employeeId: 'SUP-102',
        name: 'Priya Sharma',
        email: 'priya@factory.com',
        password: supervisorPassword,
        role: 'ACTION_PERSON',
        department: 'Sewing Line 2',
        designation: 'Line 2 In-Charge',
        mobileNumber: '+91 98222 33445',
        isActive: true,
      },
      {
        id: 'usr-sup-103',
        employeeId: 'SUP-103',
        name: 'Kamal Hasan',
        email: 'kamal@factory.com',
        password: supervisorPassword,
        role: 'ACTION_PERSON',
        department: 'Spreading & Cutting',
        designation: 'Cutting Section Head',
        mobileNumber: '+91 98333 44556',
        isActive: true,
      },
      {
        id: 'usr-sup-104',
        employeeId: 'SUP-104',
        name: 'Sunita Roy',
        email: 'sunita@factory.com',
        password: supervisorPassword,
        role: 'ACTION_PERSON',
        department: 'Finishing & Packing',
        designation: 'Finishing Floor Manager',
        mobileNumber: '+91 98444 55667',
        isActive: true,
      },
    ];

    const { error: userErr } = await supabase.from('users').upsert(initialUsers, { onConflict: 'employeeId' });
    if (userErr) {
      console.warn('⚠️ [Seed] Users upsert notice:', userErr.message);
    } else {
      console.log('✅ [Seed] Factory Users successfully seeded in Supabase.');
    }

    const getSampleDataUrl = (filename) => {
      const filePath = path.join(uploadsDir, filename);
      if (fs.existsSync(filePath)) {
        try {
          return `data:image/svg+xml;base64,${fs.readFileSync(filePath).toString('base64')}`;
        } catch (e) {}
      }
      return `/uploads/${filename}`;
    };

    const now = new Date();
    const sampleComplaints = [
      {
        id: 'cmp-001',
        complaintId: 'CMP-10492',
        category: 'Stitching Fault',
        department: 'Sewing Line 1',
        location: 'Machine #14 - Overlock',
        priority: 'CRITICAL',
        description: 'Severe skipped stitches and seam slippage identified on collar band seam of 100% cotton pique polo shirts (Order #PO-8821).',
        beforePhoto: getSampleDataUrl('sample-before-stitch.svg'),
        afterPhoto: null,
        assignedTo: {
          userId: 'usr-sup-101',
          employeeId: 'SUP-101',
          name: 'Mohammad Arif',
          department: 'Sewing Line 1',
          designation: 'Line 1 In-Charge',
          mobileNumber: '+91 98111 22334',
        },
        createdBy: {
          userId: 'usr-aud-001',
          employeeId: 'AUD-001',
          name: 'Rajesh Kumar',
          role: 'AUDITOR',
        },
        deadlineHours: 16,
        deadlineTimestamp: new Date(now.getTime() + 14 * 60 * 60 * 1000).toISOString(),
        status: 'Assigned',
        actionNotes: '',
        feedbackRemarks: '',
        rejectionReason: '',
        timeline: [
          {
            action: 'CREATED',
            performedBy: { name: 'Rajesh Kumar', role: 'AUDITOR', employeeId: 'AUD-001' },
            notes: 'Defect logged during inline roving audit. Strict 16-hour resolution SLA activated.',
            timestamp: new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString(),
          },
        ],
        createdAt: new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: 'cmp-002',
        complaintId: 'CMP-10493',
        category: 'Oil / Stain',
        department: 'Sewing Line 2',
        location: 'Machine #08 - Single Needle Lockstitch',
        priority: 'HIGH',
        description: 'Needle bar oil leak causing dark spots on right sleeve cuff panels across 18 bundled garments.',
        beforePhoto: getSampleDataUrl('sample-before-oil.svg'),
        afterPhoto: null,
        assignedTo: {
          userId: 'usr-sup-102',
          employeeId: 'SUP-102',
          name: 'Priya Sharma',
          department: 'Sewing Line 2',
          designation: 'Line 2 In-Charge',
          mobileNumber: '+91 98222 33445',
        },
        createdBy: {
          userId: 'usr-aud-001',
          employeeId: 'AUD-001',
          name: 'Rajesh Kumar',
          role: 'AUDITOR',
        },
        deadlineHours: 12,
        deadlineTimestamp: new Date(now.getTime() + 2.5 * 60 * 60 * 1000).toISOString(),
        status: 'In Progress',
        actionNotes: '',
        feedbackRemarks: '',
        rejectionReason: '',
        timeline: [
          {
            action: 'CREATED',
            performedBy: { name: 'Rajesh Kumar', role: 'AUDITOR', employeeId: 'AUD-001' },
            notes: 'Oil defect detected at End-of-Line table.',
            timestamp: new Date(now.getTime() - 9.5 * 60 * 60 * 1000).toISOString(),
          },
          {
            action: 'IN_PROGRESS',
            performedBy: { name: 'Priya Sharma', role: 'ACTION_PERSON', employeeId: 'SUP-102' },
            notes: 'Mechanic dispatched to replace needle bar seal; spot cleaning underway on soiled pieces.',
            timestamp: new Date(now.getTime() - 4 * 60 * 60 * 1000).toISOString(),
          },
        ],
        createdAt: new Date(now.getTime() - 9.5 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(now.getTime() - 4 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: 'cmp-003',
        complaintId: 'CMP-10494',
        category: 'Fabric Defect',
        department: 'Spreading & Cutting',
        location: 'Cutting Table #3 - Automatic Knife',
        priority: 'MEDIUM',
        description: 'Micro tears and knit fabric runs caused by dull straight-knife blade during ply trimming.',
        beforePhoto: getSampleDataUrl('sample-before-cut.svg'),
        afterPhoto: getSampleDataUrl('sample-after-cut.svg'),
        assignedTo: {
          userId: 'usr-sup-103',
          employeeId: 'SUP-103',
          name: 'Kamal Hasan',
          department: 'Spreading & Cutting',
          designation: 'Cutting Section Head',
          mobileNumber: '+91 98333 44556',
        },
        createdBy: {
          userId: 'usr-aud-001',
          employeeId: 'AUD-001',
          name: 'Rajesh Kumar',
          role: 'AUDITOR',
        },
        deadlineHours: 18,
        deadlineTimestamp: new Date(now.getTime() + 10 * 60 * 60 * 1000).toISOString(),
        status: 'Under Verification',
        actionNotes: 'Replaced blunt knife with new high-speed steel blade #10. Re-trimmed damaged plies with clean margin.',
        feedbackRemarks: 'Preventive maintenance schedule updated: knife blade inspection interval reduced from 48h to 24h. Spreading operator retrained on blade tensioning.',
        rejectionReason: '',
        timeline: [
          {
            action: 'CREATED',
            performedBy: { name: 'Rajesh Kumar', role: 'AUDITOR', employeeId: 'AUD-001' },
            notes: 'Defect logged during random cutting inspection.',
            timestamp: new Date(now.getTime() - 8 * 60 * 60 * 1000).toISOString(),
          },
          {
            action: 'IN_PROGRESS',
            performedBy: { name: 'Kamal Hasan', role: 'ACTION_PERSON', employeeId: 'SUP-103' },
            notes: 'Knife replacement initiated on Cutting Table #3.',
            timestamp: new Date(now.getTime() - 5 * 60 * 60 * 1000).toISOString(),
          },
          {
            action: 'ACTION_SUBMITTED',
            performedBy: { name: 'Kamal Hasan', role: 'ACTION_PERSON', employeeId: 'SUP-103' },
            notes: 'Resolution submitted with After Photo proof. Awaiting audit sign-off.',
            timestamp: new Date(now.getTime() - 1 * 60 * 60 * 1000).toISOString(),
          },
        ],
        createdAt: new Date(now.getTime() - 8 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(now.getTime() - 1 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: 'cmp-004',
        complaintId: 'CMP-10488',
        category: 'Measurement / Fit',
        department: 'Sewing Line 1',
        location: 'Machine #22 - Waistband Folder',
        priority: 'CRITICAL',
        description: 'Waistband width tolerance deviation (+2.8cm over specification) detected on ladies chino trousers.',
        beforePhoto: getSampleDataUrl('sample-before-stitch.svg'),
        afterPhoto: null,
        assignedTo: {
          userId: 'usr-sup-101',
          employeeId: 'SUP-101',
          name: 'Mohammad Arif',
          department: 'Sewing Line 1',
          designation: 'Line 1 In-Charge',
          mobileNumber: '+91 98111 22334',
        },
        createdBy: {
          userId: 'usr-aud-001',
          employeeId: 'AUD-001',
          name: 'Rajesh Kumar',
          role: 'AUDITOR',
        },
        deadlineHours: 12,
        deadlineTimestamp: new Date(now.getTime() - 5.5 * 60 * 60 * 1000).toISOString(),
        status: 'In Progress',
        actionNotes: '',
        feedbackRemarks: '',
        rejectionReason: '',
        timeline: [
          {
            action: 'CREATED',
            performedBy: { name: 'Rajesh Kumar', role: 'AUDITOR', employeeId: 'AUD-001' },
            notes: 'CRITICAL: Spec sheet discrepancy logged. 12h resolution SLA assigned.',
            timestamp: new Date(now.getTime() - 17.5 * 60 * 60 * 1000).toISOString(),
          },
          {
            action: 'IN_PROGRESS',
            performedBy: { name: 'Mohammad Arif', role: 'ACTION_PERSON', employeeId: 'SUP-101' },
            notes: 'Attachment folder angle being recalibrated by tooling engineer.',
            timestamp: new Date(now.getTime() - 12 * 60 * 60 * 1000).toISOString(),
          },
        ],
        createdAt: new Date(now.getTime() - 17.5 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(now.getTime() - 12 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: 'cmp-005',
        complaintId: 'CMP-10475',
        category: 'Finishing / Pressing',
        department: 'Finishing & Packing',
        location: 'Steam Press Table #2',
        priority: 'LOW',
        description: 'Excessive iron shine gloss on dark navy twill jackets from worn Teflon iron shoe.',
        beforePhoto: getSampleDataUrl('sample-before-oil.svg'),
        afterPhoto: getSampleDataUrl('sample-after-oil.svg'),
        assignedTo: {
          userId: 'usr-sup-104',
          employeeId: 'SUP-104',
          name: 'Sunita Roy',
          department: 'Finishing & Packing',
          designation: 'Finishing Floor Manager',
          mobileNumber: '+91 98444 55667',
        },
        createdBy: {
          userId: 'usr-aud-001',
          employeeId: 'AUD-001',
          name: 'Rajesh Kumar',
          role: 'AUDITOR',
        },
        deadlineHours: 16,
        deadlineTimestamp: new Date(now.getTime() - 10 * 60 * 60 * 1000).toISOString(),
        actualCompletedAt: new Date(now.getTime() - 12 * 60 * 60 * 1000).toISOString(),
        status: 'Closed',
        actionNotes: 'Replaced worn Teflon shoe with silicone non-shine diffuser shoe. Hand-steamed 24 jackets to restore matte nap.',
        feedbackRemarks: 'Preventive checklist item added: weekly iron shoe wear inspection on all 8 pressing stations.',
        rejectionReason: '',
        timeline: [
          {
            action: 'CREATED',
            performedBy: { name: 'Rajesh Kumar', role: 'AUDITOR', employeeId: 'AUD-001' },
            notes: 'Defect logged at finishing press line.',
            timestamp: new Date(now.getTime() - 28 * 60 * 60 * 1000).toISOString(),
          },
          {
            action: 'ACTION_SUBMITTED',
            performedBy: { name: 'Sunita Roy', role: 'ACTION_PERSON', employeeId: 'SUP-104' },
            notes: 'Corrective action submitted with After Photo proof.',
            timestamp: new Date(now.getTime() - 14 * 60 * 60 * 1000).toISOString(),
          },
          {
            action: 'CLOSED',
            performedBy: { name: 'Rajesh Kumar', role: 'AUDITOR', employeeId: 'AUD-001' },
            notes: 'Audit verified Before/After photos and approved closure of ticket.',
            timestamp: new Date(now.getTime() - 12 * 60 * 60 * 1000).toISOString(),
          },
        ],
        createdAt: new Date(now.getTime() - 28 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(now.getTime() - 12 * 60 * 60 * 1000).toISOString(),
      },
    ];

    // Safely upsert complaints so missing standard tickets are populated while preserving any user records
    const { data: existingRecords } = await supabase.from('complaints').select('id');
    const existingIdSet = new Set((existingRecords || []).map((r) => r.id));
    const missingComplaints = sampleComplaints.filter((c) => !existingIdSet.has(c.id));

    if (missingComplaints.length > 0) {
      const { error: cmpErr } = await supabase.from('complaints').insert(missingComplaints);
      if (cmpErr) {
        console.warn('⚠️ [Seed] Complaints insert notice:', cmpErr.message);
      } else {
        console.log(`✅ [Seed] Added ${missingComplaints.length} missing complaints to Supabase.`);
      }
    } else {
      console.log('✅ [Seed] All sample complaints already present in Supabase.');
    }
  } catch (err) {
    console.error('❌ [Seed] Error during seeding:', err.message);
  }
};

if (require.main === module) {
  seedData()
    .then(() => {
      console.log('🎉 Seeding completed!');
      process.exit(0);
    })
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}

module.exports = { seedData };
