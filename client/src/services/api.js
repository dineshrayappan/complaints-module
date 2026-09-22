import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 60000, // 60s timeout for mobile camera photo uploads
});

// Attach JWT token automatically to every outgoing request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('garment_qms_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    // CRITICAL: When data is FormData, remove Content-Type so browser / axios
    // automatically populates multipart/form-data with the required boundary string
    if (typeof FormData !== 'undefined' && config.data instanceof FormData) {
      if (config.headers) {
        if (typeof config.headers.delete === 'function') {
          config.headers.delete('Content-Type');
          config.headers.delete('content-type');
        } else {
          delete config.headers['Content-Type'];
          delete config.headers['content-type'];
        }
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for token expiry handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    return Promise.reject(error);
  }
);

export const authService = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  getMe: () => api.get('/auth/me'),
  getDemoUsers: () => api.get('/auth/demo-users'),
  switchDemoUser: (userId) => api.post('/auth/switch-demo', { userId }),
};

export const userService = {
  getLineSupervisors: () => api.get('/users/line-supervisors'),
  getAllUsers: (params) => api.get('/users', { params }),
  createUser: (userData) => api.post('/users', userData),
  updateUser: (id, userData) => api.put(`/users/${id}`, userData),
  resetPassword: (id, newPassword) => api.patch(`/users/${id}/reset-password`, { newPassword }),
  toggleUserStatus: (id) => api.patch(`/users/${id}/toggle-status`),
};

export const complaintService = {
  getComplaints: (params) => api.get('/complaints', { params }),
  getComplaintById: (id) => api.get(`/complaints/${id}`),
  getKpiStats: () => api.get('/complaints/stats/kpi'),
  createComplaint: (data) => {
    if (typeof FormData !== 'undefined' && data instanceof FormData) {
      return api.post('/complaints', data, {
        headers: { 'Content-Type': undefined },
      });
    }
    return api.post('/complaints', data);
  },
  reassignComplaint: (id, assignedToUserId, notes) =>
    api.patch(`/complaints/${id}/reassign`, { assignedToUserId, notes }),
  markInProgress: (id, notes) =>
    api.patch(`/complaints/${id}/in-progress`, { notes }),
  submitAction: (id, data) => {
    if (typeof FormData !== 'undefined' && data instanceof FormData) {
      return api.post(`/complaints/${id}/submit-action`, data, {
        headers: { 'Content-Type': undefined },
      });
    }
    return api.post(`/complaints/${id}/submit-action`, data);
  },
  verifyComplaint: (id, payload) =>
    api.post(`/complaints/${id}/verify`, payload),
  addTimelineComment: (id, comment) =>
    api.post(`/complaints/${id}/timeline`, { comment }),
  getAdminOversight: () => api.get('/complaints/admin/oversight'),
};

export default api;
