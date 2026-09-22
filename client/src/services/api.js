import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 10000, // 10s safety timeout to prevent hanging requests
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach JWT token automatically to every outgoing request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('garment_qms_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for token expiry handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Clear token if expired or invalid
      // localStorage.removeItem('garment_qms_token');
    }
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
  createComplaint: (formData) =>
    api.post('/complaints', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  markInProgress: (id, notes) =>
    api.patch(`/complaints/${id}/in-progress`, { notes }),
  submitAction: (id, formData) =>
    api.post(`/complaints/${id}/submit-action`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  verifyComplaint: (id, payload) =>
    api.post(`/complaints/${id}/verify`, payload),
  addTimelineComment: (id, comment) =>
    api.post(`/complaints/${id}/timeline`, { comment }),
  getAdminOversight: () => api.get('/complaints/admin/oversight'),
};

export default api;
