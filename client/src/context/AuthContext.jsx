import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('garment_qms_token'));
  const [demoUsers, setDemoUsers] = useState([]);
  // If no token exists in localStorage, user is immediately not authenticated (loading = false)
  const [loading, setLoading] = useState(() => Boolean(localStorage.getItem('garment_qms_token')));

  // Fetch demo users for the role switcher toggle
  const fetchDemoUsers = async () => {
    try {
      const res = await authService.getDemoUsers();
      if (res.data?.success) {
        setDemoUsers(res.data.users);
        return res.data.users;
      }
    } catch (err) {
      console.error('Failed to load demo users:', err);
    }
    return [];
  };

  // Initialize auth state
  useEffect(() => {
    let isMounted = true;

    // Safety timeout: Never keep the app loading more than 1 second
    const safetyTimer = setTimeout(() => {
      if (isMounted) {
        setLoading(false);
      }
    }, 1000);

    const initAuth = async () => {
      // Fetch demo users in background
      fetchDemoUsers();

      const storedToken = localStorage.getItem('garment_qms_token');
      if (storedToken) {
        try {
          const res = await authService.getMe();
          if (isMounted && res.data?.success) {
            setUser(res.data.user);
          }
        } catch (err) {
          console.warn('Session expired or invalid, clearing stored token...');
          localStorage.removeItem('garment_qms_token');
          if (isMounted) {
            setToken(null);
            setUser(null);
          }
        } finally {
          clearTimeout(safetyTimer);
          if (isMounted) {
            setLoading(false);
          }
        }
      } else {
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
