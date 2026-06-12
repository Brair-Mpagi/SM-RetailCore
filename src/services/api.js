import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api/v1';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('rstms_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('rstms_token');
      localStorage.removeItem('rstms_user');
      localStorage.removeItem('rstms_refresh_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: (email, password) => api.post('/auth/login', { email, password }),
  logout: () => api.post('/auth/logout'),
  me: () => api.get('/auth/me'),
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
  resetPasswordWithPin: (email, pin, new_password) => api.post('/auth/reset-password-pin', { email, pin, new_password })
};

// Products API
export const productsAPI = {
  getAll: (params) => api.get('/products', { params }),
  getOne: (id) => api.get(`/products/${id}`),
  create: (data) => api.post('/products', data),
  update: (id, data) => api.put(`/products/${id}`, data),
  delete: (id) => api.delete(`/products/${id}`),
  bulkCreate: (products) => api.post('/products/bulk', { products }),
  getNextBarcode: (count = 1) => api.get('/products/next-barcode', { params: { count } })
};

// Categories API
export const categoriesAPI = {
  getAll: (params) => api.get('/categories', { params }),
  getOne: (id) => api.get(`/categories/${id}`),
  create: (data) => api.post('/categories', data),
  update: (id, data) => api.put(`/categories/${id}`, data),
  delete: (id) => api.delete(`/categories/${id}`)
};

// Suppliers API
export const suppliersAPI = {
  getAll: (params) => api.get('/suppliers', { params }),
  getOne: (id) => api.get(`/suppliers/${id}`),
  create: (data) => api.post('/suppliers', data),
  update: (id, data) => api.put(`/suppliers/${id}`, data),
  delete: (id) => api.delete(`/suppliers/${id}`)
};

// Inventory API
export const inventoryAPI = {
  getAll: (params) => api.get('/inventory', { params }),
  getProduct: (productId) => api.get(`/inventory/${productId}`),
  adjust: (data) => api.post('/inventory/adjust', data)
};

// Transactions API
export const transactionsAPI = {
  create: (data) => api.post('/transactions', data),
  getAll: (params) => api.get('/transactions', { params }),
  getOne: (id) => api.get(`/transactions/${id}`),
  getByReceipt: (receiptNumber) => api.get(`/transactions/receipt/${receiptNumber}`),
  void: (id, reason) => api.post(`/transactions/${id}/void`, { reason })
};

// Cash Sessions API
export const cashSessionsAPI = {
  open: (data) => api.post('/cash-sessions', data),
  getActive: () => api.get('/cash-sessions/active'),
  close: (id, data) => api.put(`/cash-sessions/${id}/close`, data)
};

// Returns API
export const returnsAPI = {
  create: (data) => api.post('/returns', data),
  getAll: (params) => api.get('/returns', { params })
};

// Purchase Orders API
export const purchaseOrdersAPI = {
  getAll: (params) => api.get('/purchase-orders', { params }),
  create: (data) => api.post('/purchase-orders', data),
  update: (id, data) => api.put(`/purchase-orders/${id}`, data),
  receive: (id, data) => api.put(`/purchase-orders/${id}/receive`, data)
};

// Purchase Requests API
export const purchaseRequestsAPI = {
  getAll: (params) => api.get('/purchase-requests', { params }),
  getOne: (id) => api.get(`/purchase-requests/${id}`),
  create: (data) => api.post('/purchase-requests', data),
  updateStatus: (id, status) => api.put(`/purchase-requests/${id}/status`, { status }),
  delete: (id) => api.delete(`/purchase-requests/${id}`)
};

// Stocktakes API
export const stocktakesAPI = {
  create: (data) => api.post('/stocktakes', data),
  getOne: (id) => api.get(`/stocktakes/${id}`),
  commit: (id, data) => api.put(`/stocktakes/${id}/commit`, data)
};

// Promotions API
export const promotionsAPI = {
  getAll: (params) => api.get('/promotions', { params }),
  create: (data) => api.post('/promotions', data)
};

// Reports API
export const reportsAPI = {
  daily: (params) => api.get('/reports/daily', { params }),
  shift: (params) => api.get('/reports/shift', { params }),
  inventory: (params) => api.get('/reports/inventory', { params }),
  export: (params) => api.get('/reports/export', { params, responseType: 'blob' })
};

// Manager API (manager / admin only)
export const managerAPI = {
  overview:          ()       => api.get('/manager/overview'),
  cashierPerf:       (params) => api.get('/manager/cashier-perf', { params }),
  shiftBreakdowns:   (params) => api.get('/manager/shift-breakdowns', { params }),
  recentTxns:        (params) => api.get('/manager/recent-txns', { params }),
  productAnalytics:  (id, params) => api.get(`/manager/product-analytics/${id}`, { params }),
  allActiveSessions:   ()      => api.get('/cash-sessions/all-active'),
  forceCloseSession: (id, data) => api.put(`/cash-sessions/${id}/force-close`, data),
  assignSession:     (data) => api.post('/cash-sessions/assign', data),
};

// Settings API
export const settingsAPI = {
  getAll: () => api.get('/settings'),
  update: (settings) => api.put('/settings', { settings })
};

// Alerts API
export const alertsAPI = {
  getAll: (params) => api.get('/alerts', { params }),
  markRead: (id) => api.put(`/alerts/${id}/read`),
  markAllRead: () => api.put('/alerts/read-all'),
  generate: () => api.post('/alerts/generate'),
  delete: (id) => api.delete(`/alerts/${id}`)
};

// Losses API
export const lossesAPI = {
  getAll: (params) => api.get('/losses', { params }),
  create: (data) => api.post('/losses', data)
};

// Audit Logs API
export const auditLogsAPI = {
  getAll: (params) => api.get('/audit-logs', { params })
};

// Forecasts API
export const forecastsAPI = {
  getAll: (params) => api.get('/forecasts', { params })
};

// Users API
export const usersAPI = {
  getAll: (params) => api.get('/users', { params }),
  create: (data) => api.post('/users', data),
  update: (id, data) => api.put(`/users/${id}`, data),
  delete: (id) => api.delete(`/users/${id}`),
  resetPassword: (id, data) => api.put(`/users/${id}/reset-password`, data)
};

// Shelf Tags API
export const shelfTagsAPI = {
  getAll: (params) => api.get('/shelf-tags', { params }),
  getOne: (id) => api.get(`/shelf-tags/${id}`),
  create: (data) => api.post('/shelf-tags', data),
  update: (id, data) => api.put(`/shelf-tags/${id}`, data),
  delete: (id) => api.delete(`/shelf-tags/${id}`)
};

// Scanner API
export const scannerAPI = {
  scan: (barcode, sid) => api.post('/scanner/scan', { barcode, sid }),
  status: () => api.get('/scanner/status')
};

// Payments API
export const paymentsAPI = {
  initiate: (data) => api.post('/payments/initiate', data),
  status: (reference) => api.get(`/payments/status/${reference}`)
};

export default api;
