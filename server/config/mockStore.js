// Automatically utilized whenever Supabase credentials are unset or during offline development

const initialUsers = [
  {
    _id: '6ab26b3053ceb237bcda4f74',
    employeeId: 'ADM-001',
    name: 'Anil Mehta',
    email: 'admin@factory.com',
    role: 'ADMIN',
    department: 'Plant Operations & Executive Oversight',
    designation: 'General Operations Director',
    mobileNumber: '+91 98000 11223',
    isActive: true,
    password: 'admin123',
  },
  {
    _id: '6ab21322cd50706ee2a84631',
    employeeId: 'AUD-001',
    name: 'Rajesh Kumar',
    email: 'auditor@factory.com',
    role: 'AUDITOR',
    department: 'Central Quality Audit',
    designation: 'Chief QA & Compliance Auditor',
    mobileNumber: '+91 98765 43210',
    isActive: true,
    password: 'auditor123',
  },
  {
    _id: '6ab21322cd50706ee2a84632',
    employeeId: 'AUD-002',
    name: 'Dinesh Rayappan',
    email: 'dinesh@factory.com',
    role: 'AUDITOR',
    department: 'Central Quality Audit',
    designation: 'Internal Quality Auditor',
    mobileNumber: '+91 98111 55667',
    isActive: true,
    password: 'auditor123',
  },
  {
    _id: '6ab21322cd50706ee2a84637',
    employeeId: 'SUP-101',
    name: 'Mohammad Arif',
    email: 'arif@factory.com',
    role: 'ACTION_PERSON',
    department: 'Sewing Line 1',
    designation: 'Line 1 In-Charge',
    mobileNumber: '+91 98111 22334',
    isActive: true,
    password: 'supervisor123',
  },
  {
    _id: '6ab21322cd50706ee2a84638',
    employeeId: 'SUP-102',
    name: 'Priya Sharma',
    email: 'priya@factory.com',
    role: 'ACTION_PERSON',
    department: 'Sewing Line 2',
    designation: 'Line 2 In-Charge',
    mobileNumber: '+91 98222 33445',
    isActive: true,
    password: 'supervisor123',
  },
  {
    _id: '6ab21322cd50706ee2a84639',
    employeeId: 'SUP-103',
    name: 'Kamal Hasan',
    email: 'kamal@factory.com',
    role: 'ACTION_PERSON',
    department: 'Spreading & Cutting',
    designation: 'Cutting Section Head',
    mobileNumber: '+91 98333 44556',
    isActive: true,
    password: 'supervisor123',
  },
  {
    _id: '6ab21322cd50706ee2a84640',
    employeeId: 'SUP-104',
    name: 'Sunita Roy',
    email: 'sunita@factory.com',
    role: 'ACTION_PERSON',
    department: 'Finishing & Packing',
    designation: 'Finishing Floor Manager',
    mobileNumber: '+91 98444 55667',
    isActive: true,
    password: 'supervisor123',
  },
  {
    _id: '6ab21322cd50706ee2a84641',
    employeeId: 'SUP-105',
    name: 'Ramesh Patel',
    email: 'ramesh@factory.com',
    role: 'ACTION_PERSON',
    department: 'Sewing Line 3',
    designation: 'Line 3 Supervisor',
    mobileNumber: '+91 98555 66778',
    isActive: true,
    password: 'supervisor123',
  },
  {
    _id: '6ab21322cd50706ee2a84642',
    employeeId: 'SUP-106',
    name: 'Kavita Deshmukh',
    email: 'kavita@factory.com',
    role: 'ACTION_PERSON',
    department: 'Sewing Line 4',
    designation: 'Line 4 Supervisor',
    mobileNumber: '+91 98666 77889',
    isActive: true,
    password: 'supervisor123',
  },
  {
    _id: '6ab21322cd50706ee2a84643',
    employeeId: 'SUP-107',
    name: "Anthony D'Souza",
    email: 'anthony@factory.com',
    role: 'ACTION_PERSON',
    department: 'Embroidery & Printing',
    designation: 'Embroidery Unit Master',
    mobileNumber: '+91 98777 88990',
    isActive: true,
    password: 'supervisor123',
  },
  {
    _id: '6ab21322cd50706ee2a84644',
    employeeId: 'SUP-108',
    name: 'Meera Nambiar',
    email: 'meera@factory.com',
    role: 'ACTION_PERSON',
    department: 'Wet Processing & Washing',
    designation: 'Washing Lab In-Charge',
    mobileNumber: '+91 98888 99001',
    isActive: true,
    password: 'supervisor123',
  },
  {
    _id: '6ab21322cd50706ee2a84645',
    employeeId: 'SUP-109',
    name: 'Gurpreet Singh',
    email: 'gurpreet@factory.com',
    role: 'ACTION_PERSON',
    department: 'Trims & Special Machinery',
    designation: 'Buttoning & Snap Rivet Master',
    mobileNumber: '+91 98999 00112',
    isActive: true,
    password: 'supervisor123',
  },
  {
    _id: '6ab21322cd50706ee2a84646',
    employeeId: 'SUP-110',
    name: 'Lakshmi Narayanan',
    email: 'lakshmi@factory.com',
    role: 'ACTION_PERSON',
    department: 'End-Line Inspection',
    designation: 'Final QC & Audit Coordinator',
    mobileNumber: '+91 98012 34567',
    isActive: true,
    password: 'supervisor123',
  },
];

const now = new Date();
const initialComplaints = [
  {
    _id: 'cmp-001',
    complaintId: 'CMP-10492',
    category: 'Stitching Fault',
    department: 'Sewing Line 1',
    location: 'Machine #14 - Overlock',
    priority: 'CRITICAL',
    description: 'Severe skipped stitches and seam slippage identified on collar band seam of 100% cotton pique polo shirts (Order #PO-8821).',
    beforePhoto: '/uploads/sample-before-stitch.svg',
    assignedTo: {
      userId: '6ab21322cd50706ee2a84637',
      employeeId: 'SUP-101',
      name: 'Mohammad Arif',
      department: 'Sewing Line 1',
      designation: 'Line 1 In-Charge',
      mobileNumber: '+91 98111 22334',
    },
    createdBy: {
      userId: '6ab21322cd50706ee2a84631',
      employeeId: 'AUD-001',
      name: 'Rajesh Kumar',
      role: 'AUDITOR',
    },
    deadlineHours: 16,
    deadlineTimestamp: new Date(now.getTime() + 14 * 60 * 60 * 1000),
    status: 'Assigned',
    timeline: [
      {
        action: 'CREATED',
        performedBy: { name: 'Rajesh Kumar', role: 'AUDITOR', employeeId: 'AUD-001' },
        notes: 'Defect logged during inline roving audit. Strict 16-hour resolution SLA activated.',
        timestamp: new Date(now.getTime() - 2 * 60 * 60 * 1000),
      },
    ],
    createdAt: new Date(now.getTime() - 2 * 60 * 60 * 1000),
  },
  {
    _id: 'cmp-002',
    complaintId: 'CMP-10493',
    category: 'Oil / Stain',
    department: 'Sewing Line 2',
    location: 'Machine #08 - Single Needle Lockstitch',
    priority: 'HIGH',
    description: 'Needle bar oil leak causing dark spots on right sleeve cuff panels across 18 bundled garments.',
    beforePhoto: '/uploads/sample-before-oil.svg',
    assignedTo: {
      userId: '6ab21322cd50706ee2a84638',
      employeeId: 'SUP-102',
      name: 'Priya Sharma',
      department: 'Sewing Line 2',
      designation: 'Line 2 In-Charge',
      mobileNumber: '+91 98222 33445',
    },
    createdBy: {
      userId: '6ab21322cd50706ee2a84631',
      employeeId: 'AUD-001',
      name: 'Rajesh Kumar',
      role: 'AUDITOR',
    },
    deadlineHours: 12,
    deadlineTimestamp: new Date(now.getTime() + 2.5 * 60 * 60 * 1000),
    status: 'In Progress',
    timeline: [
      {
        action: 'CREATED',
        performedBy: { name: 'Rajesh Kumar', role: 'AUDITOR', employeeId: 'AUD-001' },
        notes: 'Oil defect detected at End-of-Line table.',
        timestamp: new Date(now.getTime() - 9.5 * 60 * 60 * 1000),
      },
      {
        action: 'IN_PROGRESS',
        performedBy: { name: 'Priya Sharma', role: 'ACTION_PERSON', employeeId: 'SUP-102' },
        notes: 'Mechanic dispatched to replace needle bar seal; spot cleaning underway on soiled pieces.',
        timestamp: new Date(now.getTime() - 4 * 60 * 60 * 1000),
      },
    ],
    createdAt: new Date(now.getTime() - 9.5 * 60 * 60 * 1000),
  },
  {
    _id: 'cmp-003',
    complaintId: 'CMP-10494',
    category: 'Fabric Defect',
    department: 'Spreading & Cutting',
    location: 'Cutting Table #3 - Automatic Knife',
    priority: 'MEDIUM',
    description: 'Micro tears and knit fabric runs caused by dull straight-knife blade during ply trimming.',
    beforePhoto: '/uploads/sample-before-cut.svg',
    afterPhoto: '/uploads/sample-after-cut.svg',
    assignedTo: {
      userId: '6ab21322cd50706ee2a84639',
      employeeId: 'SUP-103',
      name: 'Kamal Hasan',
      department: 'Spreading & Cutting',
      designation: 'Cutting Section Head',
      mobileNumber: '+91 98333 44556',
    },
    createdBy: {
      userId: '6ab21322cd50706ee2a84631',
      employeeId: 'AUD-001',
      name: 'Rajesh Kumar',
      role: 'AUDITOR',
    },
    deadlineHours: 18,
    deadlineTimestamp: new Date(now.getTime() + 10 * 60 * 60 * 1000),
    status: 'Under Verification',
    actionNotes: 'Replaced blunt knife with new high-speed steel blade #10. Re-trimmed damaged plies with clean margin.',
    feedbackRemarks: 'Preventive maintenance schedule updated: knife blade inspection interval reduced from 48h to 24h. Spreading operator retrained on blade tensioning.',
    timeline: [
      {
        action: 'CREATED',
        performedBy: { name: 'Rajesh Kumar', role: 'AUDITOR', employeeId: 'AUD-001' },
        notes: 'Defect logged during random cutting inspection.',
        timestamp: new Date(now.getTime() - 8 * 60 * 60 * 1000),
      },
      {
        action: 'IN_PROGRESS',
        performedBy: { name: 'Kamal Hasan', role: 'ACTION_PERSON', employeeId: 'SUP-103' },
        notes: 'Knife replacement initiated on Cutting Table #3.',
        timestamp: new Date(now.getTime() - 5 * 60 * 60 * 1000),
      },
      {
        action: 'ACTION_SUBMITTED',
        performedBy: { name: 'Kamal Hasan', role: 'ACTION_PERSON', employeeId: 'SUP-103' },
        notes: 'Resolution submitted with After Photo proof. Awaiting audit sign-off.',
        timestamp: new Date(now.getTime() - 1 * 60 * 60 * 1000),
      },
    ],
    createdAt: new Date(now.getTime() - 8 * 60 * 60 * 1000),
  },
  {
    _id: 'cmp-004',
    complaintId: 'CMP-10488',
    category: 'Measurement / Fit',
    department: 'Sewing Line 1',
    location: 'Machine #22 - Waistband Folder',
    priority: 'CRITICAL',
    description: 'Waistband width tolerance deviation (+2.8cm over specification) detected on ladies chino trousers.',
    beforePhoto: '/uploads/sample-before-stitch.svg',
    assignedTo: {
      userId: '6ab21322cd50706ee2a84637',
      employeeId: 'SUP-101',
      name: 'Mohammad Arif',
      department: 'Sewing Line 1',
      designation: 'Line 1 In-Charge',
      mobileNumber: '+91 98111 22334',
    },
    createdBy: {
      userId: '6ab21322cd50706ee2a84631',
      employeeId: 'AUD-001',
      name: 'Rajesh Kumar',
      role: 'AUDITOR',
    },
    deadlineHours: 12,
    deadlineTimestamp: new Date(now.getTime() - 5.5 * 60 * 60 * 1000),
    status: 'In Progress',
    timeline: [
      {
        action: 'CREATED',
        performedBy: { name: 'Rajesh Kumar', role: 'AUDITOR', employeeId: 'AUD-001' },
        notes: 'CRITICAL: Spec sheet discrepancy logged. 12h resolution SLA assigned.',
        timestamp: new Date(now.getTime() - 17.5 * 60 * 60 * 1000),
      },
      {
        action: 'IN_PROGRESS',
        performedBy: { name: 'Mohammad Arif', role: 'ACTION_PERSON', employeeId: 'SUP-101' },
        notes: 'Attachment folder angle being recalibrated by tooling engineer.',
        timestamp: new Date(now.getTime() - 12 * 60 * 60 * 1000),
      },
    ],
    createdAt: new Date(now.getTime() - 17.5 * 60 * 60 * 1000),
  },
  {
    _id: 'cmp-005',
    complaintId: 'CMP-10475',
    category: 'Finishing / Pressing',
    department: 'Finishing & Packing',
    location: 'Steam Press Table #2',
    priority: 'LOW',
    description: 'Excessive iron shine gloss on dark navy twill jackets from worn Teflon iron shoe.',
    beforePhoto: '/uploads/sample-before-oil.svg',
    afterPhoto: '/uploads/sample-after-oil.svg',
    assignedTo: {
      userId: '6ab21322cd50706ee2a84640',
      employeeId: 'SUP-104',
      name: 'Sunita Roy',
      department: 'Finishing & Packing',
      designation: 'Finishing Floor Manager',
      mobileNumber: '+91 98444 55667',
    },
    createdBy: {
      userId: '6ab21322cd50706ee2a84631',
      employeeId: 'AUD-001',
      name: 'Rajesh Kumar',
      role: 'AUDITOR',
    },
    deadlineHours: 24,
    deadlineTimestamp: new Date(now.getTime() - 24 * 60 * 60 * 1000),
    status: 'Closed',
    actualCompletedAt: new Date(now.getTime() - 26 * 60 * 60 * 1000),
    actionNotes: 'Replaced Teflon shoe on iron press #2; all 40 pieces steamed with velvet touch board.',
    feedbackRemarks: 'Weekly replacement cycle established for Teflon iron shoes on all press stations.',
    timeline: [
      {
        action: 'CREATED',
        performedBy: { name: 'Rajesh Kumar', role: 'AUDITOR', employeeId: 'AUD-001' },
        notes: 'Shine defect noted during pre-packing audit.',
        timestamp: new Date(now.getTime() - 36 * 60 * 60 * 1000),
      },
      {
        action: 'CLOSED',
        performedBy: { name: 'Rajesh Kumar', role: 'AUDITOR', employeeId: 'AUD-001' },
        notes: 'Before and After comparison inspected. Garments meet AQL 1.5 standard. Closed.',
        timestamp: new Date(now.getTime() - 26 * 60 * 60 * 1000),
      },
    ],
    createdAt: new Date(now.getTime() - 36 * 60 * 60 * 1000),
  },
];

// In-Memory state
let mockUsers = [...initialUsers];
let mockComplaints = [...initialComplaints];

module.exports = {
  getUsers: () => [...mockUsers],
  findUserById: (id) => mockUsers.find((u) => u._id === id || u.employeeId === id),
  findUserByIdentifier: (identifier) => {
    const term = (identifier || '').trim().toLowerCase();
    if (term === 'admin') return mockUsers.find((u) => u.role === 'ADMIN');
    if (term === 'auditor') return mockUsers.find((u) => u.role === 'AUDITOR');
    if (term === 'dinesh') return mockUsers.find((u) => u.employeeId === 'AUD-002' || u.email.toLowerCase().includes('dinesh'));
    if (term === 'supervisor' || term === 'arif') return mockUsers.find((u) => u.employeeId === 'SUP-101' || u.role === 'ACTION_PERSON' || u.role === 'SUPERVISOR');
    return mockUsers.find(
      (u) => u.email.toLowerCase() === term || u.employeeId.toLowerCase() === term
    );
  },
  createUser: (userData) => {
    const newUser = {
      _id: `user-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      ...userData,
      isActive: true,
    };
    mockUsers.unshift(newUser);
    return newUser;
  },
  updateUser: (id, updates) => {
    const idx = mockUsers.findIndex((u) => u._id === id || u.employeeId === id);
    if (idx !== -1) {
      mockUsers[idx] = { ...mockUsers[idx], ...updates };
      return mockUsers[idx];
    }
    return null;
  },
  getComplaints: (params = {}, user = null) => {
    let result = [...mockComplaints];

    // Role-based filtering for Supervisor / Action Person
    if (user && (user.role === 'ACTION_PERSON' || user.role === 'SUPERVISOR')) {
      const uEmp = (user.employeeId || '').toUpperCase();
      const uId = String(user._id || '');
      const uDept = (user.department || '').trim().toLowerCase();

      // If user specifically requested their assigned tab or department, filter;
      // otherwise, if on 'all' tab, allow supervisor to see all factory defect tasks
      if (params.tab === 'my-line') {
        result = result.filter((c) => {
          const cAssignedId = String(c.assignedTo?.userId || '');
          const cAssignedEmp = (c.assignedTo?.employeeId || '').toUpperCase();
          const cDept = (c.department || '').trim().toLowerCase();

          return (
            (uEmp && cAssignedEmp === uEmp) ||
            (uId && cAssignedId === uId) ||
            (uDept && cDept === uDept)
          );
        });
      }
    }

    if (params.tab === 'action-pending' || params.tab === 'pending') {
      result = result.filter((c) => ['Assigned', 'In Progress', 'Rejected / Sent Back'].includes(c.status));
    } else if (params.tab === 'under-verification' || params.tab === 'under_verification') {
      result = result.filter((c) => c.status === 'Under Verification');
    } else if (params.tab === 'closed' || params.tab === 'resolved') {
      result = result.filter((c) => c.status === 'Closed');
    } else if (params.tab === 'overdue') {
      result = result.filter((c) => c.status !== 'Closed' && new Date(c.deadlineTimestamp) < new Date());
    }

    if (params.category) {
      result = result.filter((c) => c.category === params.category);
    }
    if (params.priority) {
      result = result.filter((c) => c.priority === params.priority);
    }
    return result;
  },
  getComplaintById: (id) =>
    mockComplaints.find((c) => c._id === id || c.complaintId === id),
  createComplaint: (data) => {
    const newTicket = {
      _id: data._id || data.id || `cmp-${Date.now()}`,
      complaintId: data.complaintId || `CMP-${Math.floor(10000 + Math.random() * 90000)}`,
      ...data,
      status: data.status || 'Assigned',
      timeline: data.timeline || [
        {
          action: 'CREATED',
          performedBy: data.createdBy,
          notes: 'Defect logged into system.',
          timestamp: new Date(),
        },
      ],
      createdAt: data.createdAt || new Date(),
    };
    const existingIdx = mockComplaints.findIndex(
      (c) => c._id === newTicket._id || c.complaintId === newTicket.complaintId
    );
    if (existingIdx !== -1) {
      mockComplaints[existingIdx] = { ...mockComplaints[existingIdx], ...newTicket };
    } else {
      mockComplaints.unshift(newTicket);
    }
    return newTicket;
  },
  updateComplaint: (id, updates) => {
    const idx = mockComplaints.findIndex((c) => c._id === id || c.complaintId === id);
    if (idx !== -1) {
      mockComplaints[idx] = { ...mockComplaints[idx], ...updates };
      return mockComplaints[idx];
    }
    return null;
  },
  deleteComplaint: (id) => {
    const paramStr = String(id);
    const idx = mockComplaints.findIndex(
      (c) =>
        String(c._id) === paramStr ||
        String(c.id) === paramStr ||
        c.complaintId === paramStr
    );
    if (idx !== -1) {
      const removed = mockComplaints.splice(idx, 1)[0];
      return removed;
    }
    return null;
  },
};
