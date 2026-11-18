# Phase 2: Next.js Frontend Migration - Complete Implementation Guide

**Phase:** Frontend Migration  
**Duration:** 2 weeks  
**Status:** 🟡 In Progress (Foundation Created)

---

## Overview

This guide provides step-by-step instructions to migrate the existing React/Vite frontend to Next.js 14+ while preserving all business logic and improving architecture.

**Next.js Project Created:** ✅ `/frontend-next/`

---

## Phase 2 Architecture

### Technology Stack

**Core:**
- Next.js 14+ (App Router)
- TypeScript (strict mode)
- React 18
- Tailwind CSS 3

**Additional Dependencies to Install:**
```bash
cd frontend-next
npm install axios @tanstack/react-query lucide-react socket.io-client date-fns recharts js-cookie
npm install -D @types/js-cookie
```

### Project Structure

```
frontend-next/
├── src/
│   ├── app/                      # App Router pages
│   │   ├── (auth)/
│   │   │   └── login/
│   │   │       └── page.tsx      # Login page
│   │   ├── dashboard/
│   │   │   ├── layout.tsx        # Dashboard layout (AppShell)
│   │   │   ├── manager/
│   │   │   │   └── page.tsx      # Manager dashboard
│   │   │   ├── pos/
│   │   │   │   └── page.tsx      # POS Interface (client)
│   │   │   ├── inventory/
│   │   │   ├── transactions/
│   │   │   ├── users/
│   │   │   └── ...
│   │   ├── scan/
│   │   │   └── page.tsx          # Phone scanner (client)
│   │   ├── layout.tsx            # Root layout
│   │   └── page.tsx              # Home (redirects)
│   ├── components/
│   │   ├── ui/                   # Reusable UI components
│   │   ├── pos/                  # POS-specific components
│   │   ├── inventory/            # Inventory components
│   │   ├── layout/               # Layout components
│   │   └── ...
│   ├── lib/
│   │   ├── api.ts                # API client
│   │   ├── auth.ts               # Auth utilities
│   │   ├── utils.ts              # General utilities
│   │   └── formatters.ts         # Format utilities
│   ├── hooks/
│   │   ├── useAuth.ts
│   │   ├── useSettings.ts
│   │   └── ...
│   ├── types/
│   │   ├── api.ts                # API response types
│   │   ├── models.ts             # Database model types
│   │   └── ...
│   ├── contexts/
│   │   ├── AuthContext.tsx
│   │   └── SettingsContext.tsx
│   └── middleware.ts             # Auth middleware
├── public/
├── .env.local
├── next.config.ts
└── tsconfig.json
```

---

## Implementation Steps

### Step 1: Install Dependencies (5 minutes)

```bash
cd frontend-next

# Core dependencies
npm install axios @tanstack/react-query lucide-react socket.io-client date-fns recharts js-cookie

# Type definitions
npm install -D @types/js-cookie
```

### Step 2: Configure Environment Variables (2 minutes)

Create `frontend-next/.env.local`:

```env
# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:3000/api/v1
NEXT_PUBLIC_WS_URL=http://localhost:3000

# Environment
NEXT_PUBLIC_ENV=development
```

### Step 3: Configure Next.js (5 minutes)

Update `frontend-next/next.config.ts`:

```typescript
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Disable static optimization for pages that need auth
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
  
  // Image optimization
  images: {
    domains: ['localhost'],
  },
  
  // Redirect root to appropriate dashboard
  async redirects() {
    return [
      {
        source: '/',
        destination: '/dashboard',
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
```

### Step 4: Create Type Definitions (30 minutes)

**File:** `src/types/models.ts`

```typescript
export interface User {
  id: number;
  name: string;
  email: string;
  role: 'admin' | 'manager' | 'cashier' | 'stock';
  is_active: boolean;
  device_id?: string;
  created_at: string;
  updated_at: string;
}

export interface Product {
  id: number;
  name: string;
  sku: string;
  barcode?: string;
  category_id: number;
  unit_price: number;
  cost_price: number;
  supplier_id?: number;
  reorder_point: number;
  unit_of_measure: string;
  expiry_date?: string;
  is_active: boolean;
  inventory?: Inventory;
  category?: Category;
  supplier?: Supplier;
}

export interface Inventory {
  id: number;
  product_id: number;
  quantity_on_hand: number;
  last_restocked_at?: string;
  product?: Product;
}

export interface Category {
  id: number;
  name: string;
  description?: string;
}

export interface Supplier {
  id: number;
  name: string;
  contact_phone?: string;
  contact_email?: string;
  lead_time_days: number;
  is_active: boolean;
}

export interface SalesTransaction {
  id: number;
  receipt_number: string;
  cashier_id: number;
  cash_session_id?: number;
  total_amount: number;
  tax_amount: number;
  discount_amount: number;
  payment_method: 'cash' | 'mtn_momo' | 'airtel_money';
  amount_tendered: number;
  change_given: number;
  status: 'completed' | 'voided' | 'refunded';
  items?: SaleItem[];
  cashier?: User;
  created_at: string;
}

export interface SaleItem {
  id: number;
  transaction_id: number;
  product_id: number;
  quantity: number;
  unit_price: number;
  cost_price: number;
  subtotal: number;
  product?: Product;
}

export interface CashSession {
  id: number;
  cashier_id: number;
  opening_balance: number;
  expected_closing_balance?: number;
  actual_closing_balance?: number;
  discrepancy?: number;
  status: 'open' | 'closed' | 'force_closed';
  opened_at: string;
  closed_at?: string;
  cashier?: User;
}
```

**File:** `src/types/api.ts`

```typescript
export interface ApiResponse<T> {
  data: T;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface ApiError {
  error: string;
  code: number;
  details?: any[];
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  user: User;
  token: string;
  refreshToken: string;
  expires_in: number;
  token_type: string;
}

export interface CreateSaleRequest {
  items: {
    product_id: number;
    quantity: number;
    unit_price: number;
    subtotal: number;
  }[];
  subtotal: number;
  tax_amount: number;
  total_amount: number;
  discount_amount?: number;
  payment_method: 'cash' | 'mtn_momo' | 'airtel_money';
  amount_tendered: number;
  change_given: number;
  momo_reference?: string;
  cash_session_id?: number;
}
```

### Step 5: Create API Client (45 minutes)

**File:** `src/lib/api.ts`

```typescript
import axios, { AxiosInstance, AxiosError } from 'axios';
import Cookies from 'js-cookie';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1';

class APIClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
      withCredentials: true,
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor - add auth token
    this.client.interceptors.request.use(
      (config) => {
        // Try to get token from cookie first (more secure), then localStorage
        const token = Cookies.get('rstms_token') || 
                     (typeof window !== 'undefined' ? localStorage.getItem('rstms_token') : null);
        
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor - handle errors
    this.client.interceptors.response.use(
      (response) => response,
      async (error: AxiosError<ApiError>) => {
        if (error.response?.status === 401) {
          // Token expired - try refresh
          const refreshToken = Cookies.get('rstms_refresh_token') || 
                              localStorage.getItem('rstms_refresh_token');

          if (refreshToken && error.response.data?.expired) {
            try {
              const response = await this.client.post('/auth/refresh', {
                refresh_token: refreshToken,
              });

              const { access_token, refresh_token: newRefreshToken } = response.data;

              // Save new tokens
              Cookies.set('rstms_token', access_token, { expires: 1/3 }); // 8 hours
              Cookies.set('rstms_refresh_token', newRefreshToken, { expires: 7 });
              localStorage.setItem('rstms_token', access_token);
              localStorage.setItem('rstms_refresh_token', newRefreshToken);

              // Retry original request
              if (error.config) {
                error.config.headers.Authorization = `Bearer ${access_token}`;
                return this.client.request(error.config);
              }
            } catch (refreshError) {
              // Refresh failed - logout
              this.clearAuth();
              if (typeof window !== 'undefined') {
                window.location.href = '/login';
              }
            }
          } else {
            // No refresh token - logout
            this.clearAuth();
            if (typeof window !== 'undefined') {
              window.location.href = '/login';
            }
          }
        }

        return Promise.reject(error);
      }
    );
  }

  private clearAuth() {
    Cookies.remove('rstms_token');
    Cookies.remove('rstms_refresh_token');
    if (typeof window !== 'undefined') {
      localStorage.removeItem('rstms_token');
      localStorage.removeItem('rstms_refresh_token');
      localStorage.removeItem('rstms_user');
    }
  }

  // Auth API
  auth = {
    login: async (email: string, password: string) =>
      this.client.post<ApiResponse<LoginResponse>>('/auth/login', { email, password }),
    
    logout: async () => {
      const refreshToken = Cookies.get('rstms_refresh_token') || localStorage.getItem('rstms_refresh_token');
      await this.client.post('/auth/logout', { refresh_token: refreshToken });
      this.clearAuth();
    },
    
    me: () => this.client.get<ApiResponse<User>>('/auth/me'),
  };

  // Products API
  products = {
    getAll: (params?: Record<string, any>) =>
      this.client.get<PaginatedResponse<Product>>('/products', { params }),
    
    getOne: (id: number) =>
      this.client.get<ApiResponse<Product>>(`/products/${id}`),
    
    create: (data: Partial<Product>) =>
      this.client.post<ApiResponse<Product>>('/products', data),
    
    update: (id: number, data: Partial<Product>) =>
      this.client.put<ApiResponse<Product>>(`/products/${id}`, data),
    
    delete: (id: number) =>
      this.client.delete(`/products/${id}`),
  };

  // Transactions API
  transactions = {
    create: (data: CreateSaleRequest, idempotencyKey?: string) =>
      this.client.post<ApiResponse<SalesTransaction>>('/transactions', data, {
        headers: idempotencyKey ? { 'Idempotency-Key': idempotencyKey } : {},
      }),
    
    getAll: (params?: Record<string, any>) =>
      this.client.get<PaginatedResponse<SalesTransaction>>('/transactions', { params }),
    
    getOne: (id: number) =>
      this.client.get<ApiResponse<SalesTransaction>>(`/transactions/${id}`),
    
    getByReceipt: (receiptNumber: string) =>
      this.client.get<ApiResponse<SalesTransaction>>(`/transactions/receipt/${receiptNumber}`),
  };

  // Cash Sessions API
  cashSessions = {
    open: (data: { opening_balance: number }) =>
      this.client.post<ApiResponse<CashSession>>('/cash-sessions', data),
    
    getActive: () =>
      this.client.get<ApiResponse<CashSession>>('/cash-sessions/active'),
    
    close: (id: number, data: { actual_closing_balance: number }) =>
      this.client.put<ApiResponse<CashSession>>(`/cash-sessions/${id}/close`, data),
  };

  // Add more API modules as needed...
}

export const api = new APIClient();
export type { ApiResponse, PaginatedResponse, ApiError };
```

### Step 6: Create Authentication Context (30 minutes)

**File:** `src/contexts/AuthContext.tsx`

```typescript
'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import type { User, LoginResponse } from '@/types';
import Cookies from 'js-cookie';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Check for existing session
    const checkAuth = async () => {
      const token = Cookies.get('rstms_token') || localStorage.getItem('rstms_token');
      
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const response = await api.auth.me();
        setUser(response.data.data);
      } catch (error) {
        // Token invalid - clear auth
        Cookies.remove('rstms_token');
        Cookies.remove('rstms_refresh_token');
        localStorage.removeItem('rstms_token');
        localStorage.removeItem('rstms_refresh_token');
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const response = await api.auth.login(email, password);
      const data: LoginResponse = response.data.data;

      // Store tokens (cookie more secure, localStorage fallback)
      Cookies.set('rstms_token', data.token, { expires: 1/3 }); // 8 hours
      Cookies.set('rstms_refresh_token', data.refreshToken, { expires: 7 }); // 7 days
      localStorage.setItem('rstms_token', data.token);
      localStorage.setItem('rstms_refresh_token', data.refreshToken);
      localStorage.setItem('rstms_user', JSON.stringify(data.user));

      setUser(data.user);

      // Redirect based on role
      const defaultRoute = {
        manager: '/dashboard/manager',
        cashier: '/dashboard/pos',
        stock: '/dashboard/inventory',
        admin: '/dashboard/manager',
      }[data.user.role] || '/dashboard';

      router.push(defaultRoute);
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Login failed');
    }
  };

  const logout = async () => {
    try {
      await api.auth.logout();
    } catch (error) {
      // Logout anyway even if API call fails
    } finally {
      setUser(null);
      router.push('/login');
    }
  };

  const refreshUser = async () => {
    try {
      const response = await api.auth.me();
      setUser(response.data.data);
    } catch (error) {
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
```

---

## Continue in PHASE2_IMPLEMENTATION_GUIDE_PART2.md...

This guide continues with:
- Middleware for route protection
- Login page implementation
- POS Interface migration
- Manager Dashboard migration
- Component library setup
- Testing strategy

**Current Progress:** 20% (Foundation Complete)

**Next:** Implement authentication pages and protected routes
