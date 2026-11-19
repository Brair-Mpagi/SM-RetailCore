import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1';

// Create axios instance
const api: AxiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: false,
});

// Request interceptor - add auth token
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('access_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // If 401 and we haven't retried yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refresh_token');
        if (!refreshToken) {
          throw new Error('No refresh token');
        }

        const response = await axios.post(`${API_URL}/auth/refresh`, {
          refreshToken,
        });

        const { accessToken, refreshToken: newRefreshToken } = response.data;
        
        localStorage.setItem('access_token', accessToken);
        localStorage.setItem('refresh_token', newRefreshToken);

        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        }

        return api(originalRequest);
      } catch (refreshError) {
        // Refresh failed - logout
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;

// API Endpoints
export const authAPI = {
  login: (email: string, password: string) => 
    api.post('/auth/login', { email, password }),
  logout: () => 
    api.post('/auth/logout'),
  refresh: (refreshToken: string) => 
    api.post('/auth/refresh', { refreshToken }),
  me: () => 
    api.get('/auth/me'),
};

export const productsAPI = {
  getAll: (params?: any) => 
    api.get('/products', { params }),
  getById: (id: number) => 
    api.get(`/products/${id}`),
  create: (data: any) => 
    api.post('/products', data),
  update: (id: number, data: any) => 
    api.put(`/products/${id}`, data),
  delete: (id: number) => 
    api.delete(`/products/${id}`),
  search: (query: string) => 
    api.get('/products/search', { params: { query } }),
  lowStock: () => 
    api.get('/products/low-stock'),
};

export const categoriesAPI = {
  getAll: () => 
    api.get('/categories'),
  create: (data: any) => 
    api.post('/categories', data),
  update: (id: number, data: any) => 
    api.put(`/categories/${id}`, data),
  delete: (id: number) => 
    api.delete(`/categories/${id}`),
};

export const transactionsAPI = {
  getAll: (params?: any) => 
    api.get('/transactions', { params }),
  getById: (id: number) => 
    api.get(`/transactions/${id}`),
  create: (data: any) => 
    api.post('/transactions', data),
  getReceipt: (id: number) => 
    api.get(`/transactions/${id}/receipt`),
};

export const inventoryAPI = {
  getAll: (params?: any) => 
    api.get('/inventory', { params }),
  updateStock: (productId: number, quantity: number, type: string, reason?: string) => 
    api.post('/inventory/adjust', { productId, quantity, type, reason }),
  getMovements: (productId: number) => 
    api.get(`/inventory/movements/${productId}`),
};

export const cashSessionsAPI = {
  getAll: (params?: any) => 
    api.get('/cash-sessions', { params }),
  getCurrent: () => 
    api.get('/cash-sessions/current'),
  open: (data: any) => 
    api.post('/cash-sessions/open', data),
  close: (id: number, data: any) => 
    api.post(`/cash-sessions/${id}/close`, data),
};

export const usersAPI = {
  getAll: () => 
    api.get('/users'),
  getById: (id: number) => 
    api.get(`/users/${id}`),
  create: (data: any) => 
    api.post('/users', data),
  update: (id: number, data: any) => 
    api.put(`/users/${id}`, data),
  delete: (id: number) => 
    api.delete(`/users/${id}`),
  changePassword: (userId: number, data: any) => 
    api.put(`/users/${userId}/password`, data),
};

export const suppliersAPI = {
  getAll: () => 
    api.get('/suppliers'),
  create: (data: any) => 
    api.post('/suppliers', data),
  update: (id: number, data: any) => 
    api.put(`/suppliers/${id}`, data),
  delete: (id: number) => 
    api.delete(`/suppliers/${id}`),
};

export const purchaseOrdersAPI = {
  getAll: (params?: any) => 
    api.get('/purchase-orders', { params }),
  getById: (id: number) => 
    api.get(`/purchase-orders/${id}`),
  create: (data: any) => 
    api.post('/purchase-orders', data),
  receive: (id: number, data: any) => 
    api.post(`/purchase-orders/${id}/receive`, data),
  cancel: (id: number) => 
    api.post(`/purchase-orders/${id}/cancel`),
};

export const reportsAPI = {
  salesSummary: (params: any) => 
    api.get('/reports/sales-summary', { params }),
  topProducts: (params: any) => 
    api.get('/reports/top-products', { params }),
  categoryPerformance: (params: any) => 
    api.get('/reports/category-performance', { params }),
  hourlyBreakdown: (params: any) => 
    api.get('/reports/hourly-breakdown', { params }),
  cashierPerformance: (params: any) => 
    api.get('/reports/cashier-performance', { params }),
};

export const alertsAPI = {
  getAll: (params?: any) => 
    api.get('/alerts', { params }),
  markAsRead: (id: number) => 
    api.put(`/alerts/${id}/read`),
  markAllAsRead: () => 
    api.put('/alerts/read-all'),
};

export const promotionsAPI = {
  getAll: () => 
    api.get('/promotions'),
  getActive: () => 
    api.get('/promotions/active'),
  create: (data: any) => 
    api.post('/promotions', data),
  update: (id: number, data: any) => 
    api.put(`/promotions/${id}`, data),
  delete: (id: number) => 
    api.delete(`/promotions/${id}`),
};

export const stocktakesAPI = {
  getAll: (params?: any) => 
    api.get('/stocktakes', { params }),
  getById: (id: number) => 
    api.get(`/stocktakes/${id}`),
  create: (data: any) => 
    api.post('/stocktakes', data),
  complete: (id: number, data: any) => 
    api.post(`/stocktakes/${id}/complete`, data),
};
