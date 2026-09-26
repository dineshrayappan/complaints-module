import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/api';

const AuthContext = createContext(null);

// Instant fallback profiles so UI is never blank even if offline or before API loads
const DEFAULT_DEMO_USERS = [
  {
    _id: 'default-admin-001',
    employeeId: 'ADM-001',
    name: 'Anil Mehta',
    email: 'admin@factory.com',
    role: 'ADMIN',
    department: 'Plant Operations & Executive Oversight',
    designation: 'Operations Director',
    mobileNumber: '+91 98000 11223',
    isActive: true,
  },
  {
    _id: 'default-aud-001',
    employeeId: 'AUD-001',
    name: 'Priya Sharma',
    email: 'priya.sharma@factory.com',
    role: 'AUDITOR',
    department: 'Central Quality Audit',
    designation: 'Senior QA Auditor',
    mobileNumber: '+91 98111 22334',
    isActive: true,
  },
  {
    _id: 'default-aud-002',
    employeeId: 'AUD-002',
    name: 'Dinesh Rayappan',
    email: 'dinesh@factory.com',
    role: 'AUDITOR',
    department: 'Central Quality Audit',
    designation: 'Internal Quality Auditor',
    mobileNumber: '+91 98111 55667',
    isActive: true,
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
  },
];

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('garment_qms_token'));
  const [demoUsers, setDemoUsers] = useState(DEFAULT_DEMO_USERS);
  // Never block initial UI mount with loading = true
  const [loading, setLoading] = useState(false);

  // Fetch demo users from API and merge with default users
  const fetchDemoUsers = async () => {
    try {
      const res = await authService.getDemoUsers();
      if (res.data?.success && Array.isArray(res.data.users) && res.data.users.length > 0) {
        setDemoUsers(res.data.users);
        return res.data.users;
      }
    } catch (err) {
      console.warn('API demo-users fetch deferred or offline. Using embedded demo profiles.', err?.message);
    }
    return DEFAULT_DEMO_USERS;
  };

  // Initialize and verify saved session
  useEffect(() => {
    let active = true;

    const initAuth = async () => {
      fetchDemoUsers();

      const storedToken = localStorage.getItem('garment_qms_token');
      if (storedToken) {
        try {
          const res = await authService.getMe();
          if (active && res.data?.success && res.data.user) {
            setUser(res.data.user);
            return;
          }
        } catch (err) {
          console.warn('Session verification notice (clearing stale token):', err?.message);
          localStorage.removeItem('garment_qms_token');
          if (active) {
            setToken(null);
            setUser(null);
          }
        }
      }
    };

    initAuth();

    return () => {
      active = false;
    };
  }, []);

  const switchUser = async (userId) => {
    try {
      // 1. Try server API
      const res = await authService.switchDemoUser(userId);
      if (res.data?.success && res.data.user) {
        localStorage.setItem('garment_qms_token', res.data.token);
        setToken(res.data.token);
        setUser(res.data.user);
        return { success: true, user: res.data.user };
      }
    } catch (err) {
      console.warn('Remote switchUser failed, activating instant client fallback...', err?.message);
    }

    // 2. Client fallback matching
    const matched = demoUsers.find((u) => u._id === userId || u.employeeId === userId);
    if (matched) {
      const mockToken = `mock-token-${matched.role}-${Date.now()}`;
      localStorage.setItem('garment_qms_token', mockToken);
      setToken(mockToken);
      setUser(matched);
      return { success: true, user: matched };
    }

    return { success: false, message: 'User profile not found.' };
  };

  const login = async (identifier, password, expectedRole) => {
    try {
      // 1. Attempt standard API login
      const res = await authService.login({ identifier, password, expectedRole });
      if (res.data?.success && res.data.user) {
        localStorage.setItem('garment_qms_token', res.data.token);
        setToken(res.data.token);
        setUser(res.data.user);
        return { success: true, user: res.data.user };
      }
    } catch (err) {
      // If server returned a definitive bad credentials response (401/403/400)
      if (err.response && err.response.data?.message) {
        return {
          success: false,
          message: err.response.data.message,
        };
      }
      console.warn('Backend login unavailable or cold-start, testing local demo credentials fallback...', err?.message);
    }

    // 2. Offline / Serverless cold-start demo fallback
    const idTrim = (identifier || '').trim().toLowerCase();
    let targetEmp = idTrim;
    if (idTrim === 'admin') targetEmp = 'adm-001';
    else if (idTrim === 'auditor') targetEmp = 'aud-001';
    else if (idTrim === 'dinesh') targetEmp = 'aud-002';
    else if (idTrim === 'supervisor' || idTrim === 'arif') targetEmp = 'sup-101';

    const matched = demoUsers.find(
      (u) =>
        u.employeeId.toLowerCase() === targetEmp ||
        u.email.toLowerCase() === idTrim ||
        u.employeeId.toLowerCase() === idTrim
    );

    const validFallbackPasswords = [
      'admin123',
      'auditor123',
      'supervisor123',
      'Password123!',
      'Admin@123',
      'Auditor@123',
      'Supervisor@123',
    ];

    if (matched && validFallbackPasswords.includes(password)) {
      if (expectedRole) {
        const isAdminPortal = expectedRole === 'ADMIN';
        const isAuditorPortal = expectedRole === 'AUDITOR';
        const isSupervisorPortal = expectedRole === 'SUPERVISOR' || expectedRole === 'ACTION_PERSON';

        if (isAdminPortal && matched.role !== 'ADMIN') {
          return {
            success: false,
            message: `Access Denied: Account (${matched.name}) is registered as ${matched.role === 'AUDITOR' ? 'Internal Auditor' : 'Line Supervisor'}. You cannot log in through the Administrator portal. Please switch to the ${matched.role === 'AUDITOR' ? 'Auditor' : 'Supervisor'} Login tab.`,
          };
        }

        if (isAuditorPortal && matched.role !== 'AUDITOR') {
          return {
            success: false,
            message: `Access Denied: Account (${matched.name}) is registered as ${matched.role === 'ADMIN' ? 'System Administrator' : 'Line Supervisor'}. You cannot log in through the Auditor portal. Please switch to the corresponding login tab.`,
          };
        }

        if (isSupervisorPortal && matched.role !== 'ACTION_PERSON' && matched.role !== 'SUPERVISOR') {
          return {
            success: false,
            message: `Access Denied: Account (${matched.name}) is registered as ${matched.role === 'ADMIN' ? 'System Administrator' : 'Internal Auditor'}. You cannot log in through the Supervisor portal. Please switch to the corresponding login tab.`,
          };
        }
      }

      const mockToken = `mock-token-${matched.role}-${Date.now()}`;
      localStorage.setItem('garment_qms_token', mockToken);
      setToken(mockToken);
      setUser(matched);
      return { success: true, user: matched };
    }

    return {
      success: false,
      message: 'Login failed. Please verify Employee ID / Email and password.',
    };
  };

  const register = async (userData) => {
    try {
      const res = await authService.register(userData);
      if (res.data?.success && res.data.user) {
        localStorage.setItem('garment_qms_token', res.data.token);
        setToken(res.data.token);
        setUser(res.data.user);
        await fetchDemoUsers();
        return { success: true, user: res.data.user };
      }
    } catch (err) {
      if (err.response?.data?.message) {
        return { success: false, message: err.response.data.message };
      }
    }

    // Fallback registration client-side if API offline
    const newUser = {
      _id: `user-${Date.now()}`,
      ...userData,
      isActive: true,
    };
    setDemoUsers((prev) => [newUser, ...prev]);
    const mockToken = `mock-token-${newUser.role}-${Date.now()}`;
    localStorage.setItem('garment_qms_token', mockToken);
    setToken(mockToken);
    setUser(newUser);
    return { success: true, user: newUser };
  };

  const logout = () => {
    localStorage.removeItem('garment_qms_token');
    localStorage.removeItem('garment_qms_cached_complaints');
    setToken(null);
    setUser(null);
  };

  const isAdmin = user?.role === 'ADMIN';
  const isAuditor = user?.role === 'AUDITOR' || user?.role === 'ADMIN';
  const isActionPerson = user?.role === 'ACTION_PERSON' || user?.role === 'SUPERVISOR';
  const isSupervisor = isActionPerson;

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        demoUsers,
        loading,
        login,
        register,
        logout,
        switchUser,
        isAdmin,
        isAuditor,
        isActionPerson,
        isSupervisor,
        fetchDemoUsers,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
