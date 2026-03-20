import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

const BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000/api';

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
});

// Attach token to every request
api.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync('access_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Auto-refresh on 401
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      try {
        const refreshToken = await SecureStore.getItemAsync('refresh_token');
        const { data } = await axios.post(`${BASE_URL}/auth/refresh`, { refreshToken });
        await SecureStore.setItemAsync('access_token', data.token);
        original.headers.Authorization = `Bearer ${data.token}`;
        return api(original);
      } catch {
        await SecureStore.deleteItemAsync('access_token');
        await SecureStore.deleteItemAsync('refresh_token');
        // Redirect to login handled by Redux auth state
      }
    }
    return Promise.reject(error);
  }
);

// ── Auth ──────────────────────────────────────────────────────
export const authAPI = {
  register:    (data) => api.post('/auth/register', data),
  login:       (data) => api.post('/auth/login', data),
  sendOTP:     (phone) => api.post('/auth/send-otp', { phone }),
  verifyOTP:   (data) => api.post('/auth/verify-otp', data),
  logout:      () => api.post('/auth/logout'),
  changePassword: (data) => api.put('/auth/change-password', data),
};

// ── Users ─────────────────────────────────────────────────────
export const usersAPI = {
  getMe:       () => api.get('/users/me'),
  updateMe:    (data) => api.put('/users/me', data),
  getDashboard: () => api.get('/users/me/dashboard'),
  getStats:    (year) => api.get('/users/me/stats', { params: { year } }),
  uploadAvatar: (formData) => api.post('/users/me/avatar', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
};

// ── Vehicles ──────────────────────────────────────────────────
export const vehiclesAPI = {
  getAll:          () => api.get('/vehicles'),
  getOne:          (id) => api.get(`/vehicles/${id}`),
  create:          (data) => api.post('/vehicles', data),
  update:          (id, data) => api.put(`/vehicles/${id}`, data),
  remove:          (id) => api.delete(`/vehicles/${id}`),
  setPrimary:      (id) => api.put(`/vehicles/${id}/primary`),
  getServiceHistory: (id) => api.get(`/vehicles/${id}/service-history`),
  updateMileage:   (id, mileage) => api.put(`/vehicles/${id}/mileage`, { mileage }),
};

// ── Appointments ──────────────────────────────────────────────
export const appointmentsAPI = {
  getAll:          (params) => api.get('/appointments', { params }),
  getUpcoming:     () => api.get('/appointments/upcoming'),
  getAvailableSlots: (date) => api.get('/appointments/available-slots', { params: { date } }),
  getOne:          (id) => api.get(`/appointments/${id}`),
  create:          (data) => api.post('/appointments', data),
  update:          (id, data) => api.put(`/appointments/${id}`, data),
  cancel:          (id, reason) => api.delete(`/appointments/${id}/cancel`, { data: { reason } }),
};

// ── Points ────────────────────────────────────────────────────
export const pointsAPI = {
  getSummary:    () => api.get('/points/summary'),
  getHistory:    (params) => api.get('/points/history', { params }),
  getExpiring:   () => api.get('/points/expiring'),
  getRewards:    () => api.get('/points/rewards'),
  redeem:        (data) => api.post('/points/redeem', data),
  checkin:       () => api.post('/points/checkin'),
  getTiers:      () => api.get('/points/tiers'),
};

// ── Notifications ─────────────────────────────────────────────
export const notificationsAPI = {
  getAll:          (params) => api.get('/notifications', { params }),
  getUnreadCount:  () => api.get('/notifications/unread-count'),
  markRead:        (id) => api.put(`/notifications/${id}/read`),
  markAllRead:     () => api.put('/notifications/read-all'),
  remove:          (id) => api.delete(`/notifications/${id}`),
  updatePushToken: (data) => api.put('/notifications/push-token', data),
  getPreferences:  () => api.get('/notifications/preferences'),
  updatePreferences: (data) => api.put('/notifications/preferences', data),
};

// ── Promotions ─────────────────────────────────────────────────
export const promotionsAPI = {
  getActive:     () => api.get('/promotions'),
  getOne:        (id) => api.get(`/promotions/${id}`),
  validateCode:  (data) => api.post('/promotions/validate-code', data),
};

// ── Services ──────────────────────────────────────────────────
export const servicesAPI = {
  getAll:        () => api.get('/services'),
  getCategories: () => api.get('/services/categories'),
  getMyRecords:  (params) => api.get('/services/records/my', { params }),
  getRecordDetail: (id) => api.get(`/services/records/${id}`),
};

// ── Reviews ───────────────────────────────────────────────────
export const reviewsAPI = {
  getPublished:  (params) => api.get('/reviews', { params }),
  getMy:         () => api.get('/reviews/my'),
  create:        (data) => api.post('/reviews', data),
};

export default api;
