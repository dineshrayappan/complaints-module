import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('garment_qms_token'));
  const [demoUsers, setDemoUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch demo users for the role switcher toggle
  const fetchDemoUsers = async () => {
    try {
      const res = await authService.getDemoUsers();
      if (res.data.success) {
        setDemoUsers(res.data.users);
        return res.data.users;
      }
    } catch (err) {
      console.error('Failed to load demo users:', err);
    }
    return [];
  };

  // Initialize auth state with bulletproof error handling and timeout safeguard
  useEffect(() => {
    let isMounted = true;

    // Safety timeout: Never leave UI in loading state for more than 2 seconds
    const safetyTimer = setTimeout(() => {
      if (isMounted) {
        setLoading(false);
      }
    }, 2000);

    const initAuth = async () => {
      try {
        const storedToken = localStorage.getItem('garment_qms_token');

        // Run demo users and me profile checks in parallel
        const [demoRes, meRes] = await Promise.allSettled([
          authService.getDemoUsers(),
          storedToken ? authService.getMe() : Promise.resolve(null),
        ]);

        if (!isMounted) return;

        if (demoRes.status === 'fulfilled' && demoRes.value?.data?.success) {
          setDemoUsers(demoRes.value.data.users);
        }

        if (meRes.status === 'fulfilled' && meRes.value?.data?.success) {
          setUser(meRes.value.data.user);
        } else if (storedToken) {
          // Token was rejected or expired
          console.warn('Session expired or invalid, clearing stored token...');
          localStorage.removeItem('garment_qms_token');
          setToken(null);
          setUser(null);
        } else {
          setUser(null);
        }
      } catch (err) {
        console.error('Auth initialization error:', err);
      } finally {
        clearTimeout(safetyTimer);
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    initAuth();

    return () => {
      isMounted = false;
      clearTimeout(safetyTimer);
    };
  }, []);

  const switchUser = async (userId) => {
    try {
      setLoading(true);
      const res = await authService.switchDemoUser(userId);
      if (res.data.success) {
        localStorage.setItem('garment_qms_token', res.data.token);
        setToken(res.data.token);
        setUser(res.data.user);
      }
    } catch (err) {
      console.error('Failed to switch user:', err);
    } finally {
      setLoading(false);
    }
  };

  const login = async (identifier, password, expectedRole) => {
    setLoading(true);
    try {
      const res = await authService.login({ identifier, password, expectedRole });
      if (res.data.success) {
        localStorage.setItem('garment_qms_token', res.data.token);
        setToken(res.data.token);
        setUser(res.data.user);
        return { success: true, user: res.data.user };
      }
    } catch (err) {
      return {
        success: false,
        message: err.response?.data?.message || 'Login failed. Please verify credentials.',
      };
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData) => {
    setLoading(true);
    try {
      const res = await authService.register(userData);
      if (res.data.success) {
        localStorage.setItem('garment_qms_token', res.data.token);
        setToken(res.data.token);
        setUser(res.data.user);
        await fetchDemoUsers();
        return { success: true, user: res.data.user };
      }
    } catch (err) {
      return {
        success: false,
        message: err.response?.data?.message || 'Registration failed.',
      };
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('garment_qms_token');
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
