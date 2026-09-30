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
        name: 'Pooja Sharma',
        email: 'auditor@factory.com',
        password: auditorPassword,
        role: 'AUDITOR',
        department: 'Central Quality Audit',
        designation: 'Senior QA Auditor',
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
        id: 'usr-sup-001',
        employeeId: 'SUP-001',
        name: 'Rajesh Kumar',
        email: 'supervisor@factory.com',
        password: supervisorPassword,
        role: 'ACTION_PERSON',
        department: 'Production',
        designation: 'Production Floor In-Charge',
        mobileNumber: '+91 98111 22334',
        isActive: true,
      },
      {
        id: 'usr-sup-002',
        employeeId: 'SUP-002',
        name: 'Kavita Nair',
        email: 'quality@factory.com',
        password: supervisorPassword,
        role: 'ACTION_PERSON',
        department: 'Quality',
        designation: 'Quality Control Lead',
        mobileNumber: '+91 98222 33445',
        isActive: true,
      },
      {
        id: 'usr-sup-003',
        employeeId: 'SUP-003',
        name: 'Vikram Singh',
        email: 'maintenance@factory.com',
        password: supervisorPassword,
        role: 'ACTION_PERSON',
        department: 'Maintenance',
        designation: 'Maintenance Chief Engineer',
        mobileNumber: '+91 98333 44556',
        isActive: true,
      },
      {
        id: 'usr-sup-004',
        employeeId: 'SUP-004',
        name: 'Ramesh Patel',
        email: 'store@factory.com',
        password: supervisorPassword,
        role: 'ACTION_PERSON',
        department: 'Store',
        designation: 'Store & Inventory Manager',
        mobileNumber: '+91 98444 55667',
        isActive: true,
      },
      {
        id: 'usr-sup-005',
        employeeId: 'SUP-005',
        name: 'Sunil Verma',
        email: 'ehs@factory.com',
        password: supervisorPassword,
        role: 'ACTION_PERSON',
        department: 'EHS',
        designation: 'EHS Safety Officer',
        mobileNumber: '+91 98555 66778',
        isActive: true,
      },
      {
        id: 'usr-sup-006',
        employeeId: 'SUP-006',
        name: 'Deepak Joshi',
        email: 'edp@factory.com',
        password: supervisorPassword,
        role: 'ACTION_PERSON',
        department: 'EDP',
        designation: 'EDP & Systems Specialist',
        mobileNumber: '+91 98666 77889',
        isActive: true,
      },
      {
        id: 'usr-sup-007',
        employeeId: 'SUP-007',
        name: 'Meera Swaminathan',
        email: 'hr@factory.com',
        password: supervisorPassword,
        role: 'ACTION_PERSON',
        department: 'HR',
        designation: 'HR & Compliance Manager',
        mobileNumber: '+91 98777 88990',
        isActive: true,
      },
      {
        id: 'usr-all-001',
        employeeId: 'ALL-001',
        name: 'Universal User (Auditor/Admin/Supervisor)',
        email: 'all@factory.com',
        password: adminPassword,
        role: 'ADMIN',
        department: 'Plant Operations & Quality Oversight',
        designation: 'Master Operations & QA Lead',
        mobileNumber: '+91 99999 88888',
        isActive: true,
      },
    ];

    const { count: userCount, error: countErr } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true });

    if (!countErr && (userCount === 0 || userCount === null)) {
      const { error: userErr } = await supabase.from('users').insert(initialUsers);
      if (userErr) {
        console.warn('⚠️ [Seed] Users insert notice:', userErr.message);
      } else {
        console.log('✅ [Seed] Factory Users successfully seeded in Supabase.');
      }
    } else {
      console.log(`✅ [Seed] Users table already has ${userCount} records. Preserving existing user accounts.`);
    }

    console.log('✅ [Seed] Complaints table initialized clean with zero demo records.');
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
