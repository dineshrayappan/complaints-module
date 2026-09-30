// Automatically utilized whenever Supabase credentials are unset or during offline development

const initialUsers = [
  {
    _id: 'usr-adm-001',
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
    _id: 'usr-aud-001',
    employeeId: 'AUD-001',
    name: 'Pooja Sharma',
    email: 'auditor@factory.com',
    role: 'AUDITOR',
    department: 'Central Quality Audit',
    designation: 'Senior QA Auditor',
    mobileNumber: '+91 98765 43210',
    isActive: true,
    password: 'auditor123',
  },
  {
    _id: 'usr-aud-002',
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
    _id: 'usr-sup-001',
    employeeId: 'SUP-001',
    name: 'Rajesh Kumar',
    email: 'supervisor@factory.com',
    role: 'ACTION_PERSON',
    department: 'Production',
    designation: 'Production Floor In-Charge',
    mobileNumber: '+91 98111 22334',
    isActive: true,
    password: 'supervisor123',
  },
  {
    _id: 'usr-sup-002',
    employeeId: 'SUP-002',
    name: 'Kavita Nair',
    email: 'quality@factory.com',
    role: 'ACTION_PERSON',
    department: 'Quality',
    designation: 'Quality Control Lead',
    mobileNumber: '+91 98222 33445',
    isActive: true,
    password: 'supervisor123',
  },
  {
    _id: 'usr-sup-003',
    employeeId: 'SUP-003',
    name: 'Vikram Singh',
    email: 'maintenance@factory.com',
    role: 'ACTION_PERSON',
    department: 'Maintenance',
    designation: 'Maintenance Chief Engineer',
    mobileNumber: '+91 98333 44556',
    isActive: true,
    password: 'supervisor123',
  },
  {
    _id: 'usr-sup-004',
    employeeId: 'SUP-004',
    name: 'Ramesh Patel',
    email: 'store@factory.com',
    role: 'ACTION_PERSON',
    department: 'Store',
    designation: 'Store & Inventory Manager',
    mobileNumber: '+91 98444 55667',
    isActive: true,
    password: 'supervisor123',
  },
  {
    _id: 'usr-sup-005',
    employeeId: 'SUP-005',
    name: 'Sunil Verma',
    email: 'ehs@factory.com',
    role: 'ACTION_PERSON',
    department: 'EHS',
    designation: 'EHS Safety Officer',
    mobileNumber: '+91 98555 66778',
    isActive: true,
    password: 'supervisor123',
  },
  {
    _id: 'usr-sup-006',
    employeeId: 'SUP-006',
    name: 'Deepak Joshi',
    email: 'edp@factory.com',
    role: 'ACTION_PERSON',
    department: 'EDP',
    designation: 'EDP & Systems Specialist',
    mobileNumber: '+91 98666 77889',
    isActive: true,
    password: 'supervisor123',
  },
  {
    _id: 'usr-sup-007',
    employeeId: 'SUP-007',
    name: 'Meera Swaminathan',
    email: 'hr@factory.com',
    role: 'ACTION_PERSON',
    department: 'HR',
    designation: 'HR & Compliance Manager',
    mobileNumber: '+91 98777 88990',
    isActive: true,
    password: 'supervisor123',
  },
  {
    _id: 'usr-all-001',
    employeeId: 'ALL-001',
    name: 'Universal User (Auditor/Admin/Supervisor)',
    email: 'all@factory.com',
    role: 'ADMIN',
    department: 'Plant Operations & Quality Oversight',
    designation: 'Master Operations & QA Lead',
    mobileNumber: '+91 99999 88888',
    isActive: true,
    isUniversal: true,
    hasAllRoles: true,
    password: 'master123',
  },
];

const initialComplaints = [];

// In-Memory state
let mockUsers = [...initialUsers];
let mockComplaints = [...initialComplaints];

module.exports = {
  getUsers: () => [...mockUsers],
  findUserById: (id) => mockUsers.find((u) => u._id === id || u.employeeId === id),
  findUserByIdentifier: (identifier) => {
    const term = (identifier || '').trim().toLowerCase();
    return mockUsers.find(
      (u) => (u.email && u.email.toLowerCase() === term) || (u.employeeId && u.employeeId.toLowerCase() === term)
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
  getComplaintById: (id) => {
    const s = String(id);
    return mockComplaints.find(
      (c) => String(c._id) === s || String(c.id) === s || String(c.complaintId) === s
    );
  },
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
      (c) =>
        String(c._id) === String(newTicket._id) ||
        String(c.id) === String(newTicket._id) ||
        c.complaintId === newTicket.complaintId
    );
    if (existingIdx !== -1) {
      mockComplaints[existingIdx] = { ...mockComplaints[existingIdx], ...newTicket };
    } else {
      mockComplaints.unshift(newTicket);
    }
    return newTicket;
  },
  updateComplaint: (id, updates) => {
    const s = String(id);
    const idx = mockComplaints.findIndex(
      (c) => String(c._id) === s || String(c.id) === s || String(c.complaintId) === s
    );
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
  syncWithSupabase: (tickets) => {
    if (Array.isArray(tickets)) {
      mockComplaints = tickets.map((t) => ({
        ...t,
        _id: t.id || t._id,
        complaintId: t.complaintId,
      }));
    }
    return mockComplaints;
  },
  syncUsersWithSupabase: (users) => {
    if (Array.isArray(users)) {
      mockUsers = users.map((u) => ({
        ...u,
        _id: u.id || u._id,
      }));
    }
    return mockUsers;
  },
};
