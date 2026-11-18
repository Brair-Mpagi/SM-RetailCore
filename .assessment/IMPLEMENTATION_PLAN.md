# Enterprise POS System - Detailed Implementation Plan

**Project:** SM-RetailCore Modernization  
**Version:** 1.0  
**Date:** November 18, 2026

---

## Implementation Approach

This plan follows the **"Modernize in Place"** strategy:
- **Retain** the well-structured Express backend
- **Enhance** security, reliability, and observability
- **Migrate** frontend from React/Vite to Next.js
- **Preserve** all existing business logic and workflows
- **Add** production-grade features incrementally

---

## Phase 1: Security Hardening & Foundation (Priority: CRITICAL)

### 1.1 Backend Security Enhancements

#### Task 1.1.1: Implement Secure Session Management
**File:** `backend/src/middleware/auth.js`

**Actions:**
1. Add refresh token rotation mechanism
2. Implement token revocation store (Redis)
3. Add session tracking per user
4. Implement "logout all devices" functionality

**Changes:**
```javascript
// New: Refresh token handling
exports.refreshAccessToken = async (req, res, next) => {
  // Verify refresh token
  // Generate new access token
  // Rotate refresh token
  // Invalidate old refresh token
};

// New: Token revocation check
exports.authenticate = async (req, res, next) => {
  // ... existing checks
  // Check if token is revoked (Redis lookup)
  if (await isTokenRevoked(token)) {
    return res.status(401).json({ error: 'Token revoked' });
  }
};
```

#### Task 1.1.2: Enhanced Input Validation
**Files:** All `backend/src/controllers/*.js`

**Actions:**
1. Audit all controllers for input validation
2. Add express-validator to all endpoints
3. Implement request sanitization
4. Add validation middleware

**Example:**
```javascript
// backend/src/validators/transaction.js (NEW)
const { body, query, param } = require('express-validator');

exports.createSaleValidation = [
  body('items').isArray({ min: 1 }).withMessage('Items required'),
  body('items.*.product_id').isInt({ min: 1 }),
  body('items.*.quantity').isInt({ min: 1, max: 10000 }),
  body('total_amount').isDecimal({ decimal_digits: '0,2' }),
  body('payment_method').isIn(['cash', 'mtn_momo', 'airtel_money']),
  // ... more validations
];
```

#### Task 1.1.3: Implement CSRF Protection
**File:** `backend/src/server.js`

**Actions:**
1. Add csurf middleware for state-changing operations
2. Generate CSRF tokens on login
3. Validate tokens on POST/PUT/DELETE requests

#### Task 1.1.4: API Rate Limiting Per User
**File:** `backend/src/middleware/rateLimiter.js` (NEW)

**Actions:**
1. Create user-specific rate limits
2. Implement sliding window algorithm
3. Add Redis-backed rate limiter
4. Different limits for different endpoints:
   - Login: 5 attempts / 15 minutes
   - General API: 100 requests / minute
   - POS checkout: 20 transactions / minute (prevent spam)

#### Task 1.1.5: Secrets Management
**Actions:**
1. Move JWT secrets to environment-specific secure storage
2. Implement secret rotation strategy
3. Add Pesapal credential encryption
4. Document secret management procedures

**Production Options:**
- AWS Secrets Manager
- HashiCorp Vault
- Azure Key Vault
- Kubernetes Secrets

### 1.2 Testing Infrastructure Setup

#### Task 1.2.1: Jest Configuration
**File:** `backend/jest.config.js` (NEW)

```javascript
module.exports = {
  testEnvironment: 'node',
  coverageDirectory: 'coverage',
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/server.js',
    '!src/migrations/**',
    '!src/seeders/**'
  ],
  testMatch: ['**/__tests__/**/*.test.js'],
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js']
};
```

#### Task 1.2.2: Test Database Setup
**File:** `backend/tests/setup.js` (NEW)

```javascript
const { sequelize } = require('../src/models');

beforeAll(async () => {
  await sequelize.sync({ force: true });
  // Seed minimal test data
});

afterAll(async () => {
  await sequelize.close();
});
```

#### Task 1.2.3: Critical Transaction Tests
**File:** `backend/__tests__/transactions.test.js` (NEW)

**Test Cases:**
1. Successful sale with inventory deduction
2. Insufficient stock rejection
3. Concurrent sale conflict handling
4. Receipt number uniqueness
5. Payment validation
6. Cash session validation
7. Transaction rollback on error
8. Stock movement record creation

**Example:**
```javascript
describe('Sales Transaction', () => {
  test('should create sale and deduct inventory atomically', async () => {
    // Setup: Create product with 10 units
    // Action: Sell 5 units
    // Assert: Transaction created, inventory = 5, stock movement recorded
  });

  test('should prevent overselling (concurrent)', async () => {
    // Setup: Product with 1 unit
    // Action: 2 cashiers try to sell simultaneously
    // Assert: Only 1 succeeds, other gets "insufficient stock"
  });
});
```

#### Task 1.2.4: Authentication & Authorization Tests
**File:** `backend/__tests__/auth.test.js` (NEW)

**Test Cases:**
1. Login with valid credentials
2. Login with invalid credentials (lockout after 5 attempts)
3. JWT token validation
4. Expired token rejection
5. Role-based access control (cashier cannot access manager endpoints)
6. Token refresh flow
7. Logout and token revocation

### 1.3 Infrastructure & Deployment

#### Task 1.3.1: Docker Configuration
**File:** `backend/Dockerfile` (NEW)

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY src/ ./src/

EXPOSE 3000

CMD ["node", "src/server.js"]
```

**File:** `docker-compose.yml` (NEW)

```yaml
version: '3.8'

services:
  backend:
    build: ./backend
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DB_HOST=mysql
    depends_on:
      - mysql
      - redis
    restart: unless-stopped

  mysql:
    image: mysql:8.0
    environment:
      MYSQL_ROOT_PASSWORD: ${MYSQL_ROOT_PASSWORD}
      MYSQL_DATABASE: rstms_db
    volumes:
      - mysql-data:/var/lib/mysql
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    restart: unless-stopped

volumes:
  mysql-data:
```

#### Task 1.3.2: CI/CD Pipeline
**File:** `.github/workflows/backend-ci.yml` (NEW)

```yaml
name: Backend CI

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    services:
      mysql:
        image: mysql:8.0
        env:
          MYSQL_ROOT_PASSWORD: test
          MYSQL_DATABASE: rstms_test
        ports:
          - 3306:3306
    
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      
      - name: Install dependencies
        run: cd backend && npm ci
      
      - name: Run tests
        run: cd backend && npm test
        env:
          DB_HOST: 127.0.0.1
          DB_NAME: rstms_test
          DB_USER: root
          DB_PASS: test
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3
```

#### Task 1.3.3: Database Backup Strategy
**File:** `backend/scripts/backup-db.sh` (NEW)

```bash
#!/bin/bash
BACKUP_DIR="/var/backups/rstms"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/rstms_$DATE.sql.gz"

# Create backup
mysqldump -h $DB_HOST -u $DB_USER -p$DB_PASS $DB_NAME | gzip > $BACKUP_FILE

# Retain only last 30 days
find $BACKUP_DIR -name "rstms_*.sql.gz" -mtime +30 -delete

# Verify backup
gunzip -t $BACKUP_FILE && echo "Backup successful: $BACKUP_FILE"
```

**File:** `backend/scripts/restore-db.sh` (NEW)

### 1.4 Enhanced Logging

#### Task 1.4.1: Winston Structured Logging
**File:** `backend/src/utils/logger.js` (NEW)

```javascript
const winston = require('winston');

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'rstms-backend' },
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' }),
  ],
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple(),
  }));
}

module.exports = logger;
```

**Usage in controllers:**
```javascript
const logger = require('../utils/logger');

exports.createSale = async (req, res, next) => {
  logger.info('Creating sale', { 
    cashier_id: req.user.id, 
    items_count: req.body.items.length,
    total_amount: req.body.total_amount 
  });
  
  try {
    // ... transaction logic
    logger.info('Sale created successfully', { receipt_number });
  } catch (error) {
    logger.error('Sale creation failed', { 
      error: error.message, 
      stack: error.stack,
      cashier_id: req.user.id 
    });
    next(error);
  }
};
```

---

## Phase 2: Frontend Migration to Next.js

### 2.1 Next.js Project Setup

#### Task 2.1.1: Initialize Next.js
**Commands:**
```bash
npx create-next-app@latest frontend-next --typescript --tailwind --app --src-dir
cd frontend-next
npm install axios react-query lucide-react recharts socket.io-client date-fns
npm install -D @types/node
```

#### Task 2.1.2: Project Structure
```
frontend-next/
├── src/
│   ├── app/
│   │   ├── (auth)/
│   │   │   └── login/page.tsx
│   │   ├── dashboard/
│   │   │   ├── layout.tsx
│   │   │   ├── manager/page.tsx
│   │   │   ├── pos/page.tsx
│   │   │   ├── inventory/
│   │   │   └── ...
│   │   ├── scan/page.tsx
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── components/
│   │   ├── ui/              # Reusable UI components
│   │   ├── pos/             # POS-specific components
│   │   ├── inventory/       # Inventory components
│   │   └── layout/          # Layout components
│   ├── lib/
│   │   ├── api.ts           # API client
│   │   ├── auth.ts          # Auth utilities
│   │   └── utils.ts         # General utilities
│   ├── hooks/
│   │   ├── useAuth.ts
│   │   ├── useSettings.ts
│   │   └── ...
│   ├── types/
│   │   ├── api.ts
│   │   ├── models.ts
│   │   └── ...
│   └── middleware.ts        # Auth middleware
├── public/
├── next.config.js
├── tailwind.config.ts
└── tsconfig.json
```

#### Task 2.1.3: API Client Setup
**File:** `src/lib/api.ts`

```typescript
import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1';

class APIClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      headers: { 'Content-Type': 'application/json' },
      withCredentials: true, // For httpOnly cookies
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    this.client.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (error.response?.status === 401) {
          // Token expired - try refresh
          // If refresh fails, redirect to login
        }
        return Promise.reject(error);
      }
    );
  }

  // Auth API
  auth = {
    login: (email: string, password: string) =>
      this.client.post('/auth/login', { email, password }),
    logout: () => this.client.post('/auth/logout'),
    me: () => this.client.get('/auth/me'),
  };

  // Products API
  products = {
    getAll: (params?: Record<string, any>) =>
      this.client.get('/products', { params }),
    getOne: (id: number) => this.client.get(`/products/${id}`),
    create: (data: CreateProductInput) =>
      this.client.post('/products', data),
    // ... more methods
  };

  // ... more API modules
}

export const api = new APIClient();
```

#### Task 2.1.4: TypeScript Type Definitions
**File:** `src/types/models.ts`

```typescript
export interface User {
  id: number;
  name: string;
  email: string;
  role: 'admin' | 'manager' | 'cashier' | 'stock';
  is_active: boolean;
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
}

export interface Inventory {
  id: number;
  product_id: number;
  quantity_on_hand: number;
  last_restocked_at?: string;
  product?: Product;
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

// ... more types
```

### 2.2 Authentication Migration

#### Task 2.2.1: Middleware for Route Protection
**File:** `src/middleware.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from './lib/auth';

export async function middleware(request: NextRequest) {
  const token = request.cookies.get('auth_token')?.value;

  // Public routes
  if (request.nextUrl.pathname.startsWith('/login') || 
      request.nextUrl.pathname.startsWith('/scan')) {
    return NextResponse.next();
  }

  // Protected routes
  if (!token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  try {
    const user = await verifyAuth(token);
    
    // Role-based routing
    const path = request.nextUrl.pathname;
    if (path.startsWith('/dashboard/users') && user.role !== 'manager') {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }

    return NextResponse.next();
  } catch (error) {
    return NextResponse.redirect(new URL('/login', request.url));
  }
}

export const config = {
  matcher: ['/dashboard/:path*'],
};
```

#### Task 2.2.2: Auth Context (Client-Side)
**File:** `src/contexts/AuthContext.tsx`

```typescript
'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { api } from '@/lib/api';
import { User } from '@/types/models';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Verify current session
    api.auth.me()
      .then(res => setUser(res.data.user))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  const login = async (email: string, password: string) => {
    const response = await api.auth.login(email, password);
    setUser(response.data.user);
  };

  const logout = async () => {
    await api.auth.logout();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
```

### 2.3 Page Migration Strategy

#### Priority 1: Login Page
**File:** `src/app/(auth)/login/page.tsx`

```typescript
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">
          RSTMS Login
        </h1>
        
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>
      </div>
    </div>
  );
}
```

#### Priority 2: POS Interface (Client Component)
**File:** `src/app/dashboard/pos/page.tsx`

```typescript
'use client';

import { useState, useEffect, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { api } from '@/lib/api';
import { Product, SalesTransaction } from '@/types/models';
import BarcodeScanner from '@/components/pos/BarcodeScanner';
import Cart from '@/components/pos/Cart';
import PaymentModal from '@/components/pos/PaymentModal';

interface CartItem extends Product {
  quantity: number;
  salePrice: number;
}

export default function POSInterface() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [socket, setSocket] = useState<Socket | null>(null);
  const [showPayment, setShowPayment] = useState(false);

  useEffect(() => {
    // Load products
    api.products.getAll({ limit: 1000 }).then(res => {
      setProducts(res.data.data);
    });

    // Setup WebSocket for scanner
    const ws = io(process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:3000');
    ws.emit('join_pos');
    ws.on('product_scanned', handleBarcodeScanned);
    setSocket(ws);

    return () => {
      ws.disconnect();
    };
  }, []);

  const handleBarcodeScanned = useCallback((data: { product: Product }) => {
    addToCart(data.product);
  }, [cart]);

  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { ...product, quantity: 1, salePrice: product.unit_price }];
    });
  };

  const handleCheckout = async (paymentData: any) => {
    try {
      const items = cart.map(item => ({
        product_id: item.id,
        quantity: item.quantity,
        unit_price: item.salePrice,
        subtotal: item.salePrice * item.quantity,
      }));

      const total = items.reduce((sum, item) => sum + item.subtotal, 0);
      
      const response = await api.transactions.create({
        items,
        subtotal: total,
        tax_amount: total * 0.18,
        total_amount: total * 1.18,
        ...paymentData,
      });

      // Success - print receipt, clear cart
      setCart([]);
      setShowPayment(false);
      // Show success notification
    } catch (error) {
      // Handle error
      console.error('Checkout failed:', error);
    }
  };

  return (
    <div className="h-screen flex">
      {/* Left: Product Search & Cart */}
      <div className="flex-1 flex flex-col">
        <div className="p-4 border-b">
          <input
            type="text"
            placeholder="Search products or scan barcode..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-3 border rounded-lg text-lg"
            autoFocus
          />
        </div>
        
        <Cart 
          items={cart}
          onUpdateQuantity={(id, qty) => {
            setCart(prev =>
              prev.map(item =>
                item.id === id ? { ...item, quantity: qty } : item
              ).filter(item => item.quantity > 0)
            );
          }}
          onRemove={(id) => setCart(prev => prev.filter(item => item.id !== id))}
          onCheckout={() => setShowPayment(true)}
        />
      </div>

      {/* Right: Product Grid */}
      <div className="w-96 bg-gray-50 p-4 overflow-y-auto">
        <h3 className="font-bold text-lg mb-4">Quick Add</h3>
        <div className="grid grid-cols-2 gap-3">
          {products
            .filter(p =>
              p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
              p.sku.includes(searchQuery) ||
              p.barcode?.includes(searchQuery)
            )
            .slice(0, 20)
            .map(product => (
              <button
                key={product.id}
                onClick={() => addToCart(product)}
                className="p-3 bg-white border rounded-lg hover:shadow-md transition text-left"
              >
                <p className="font-semibold text-sm truncate">{product.name}</p>
                <p className="text-xs text-gray-500">{product.sku}</p>
                <p className="font-bold text-blue-600 mt-1">
                  {product.unit_price.toLocaleString()} UGX
                </p>
                <p className="text-xs text-gray-500">
                  Stock: {product.inventory?.quantity_on_hand || 0}
                </p>
              </button>
            ))}
        </div>
      </div>

      {showPayment && (
        <PaymentModal
          total={cart.reduce((sum, item) => sum + item.salePrice * item.quantity, 0) * 1.18}
          onClose={() => setShowPayment(false)}
          onConfirm={handleCheckout}
        />
      )}
    </div>
  );
}
```

#### Priority 3: Manager Dashboard (Mixed RSC + Client)
**File:** `src/app/dashboard/manager/page.tsx`

```typescript
import { api } from '@/lib/api';
import { cookies } from 'next/headers';
import DashboardCharts from '@/components/dashboard/DashboardCharts'; // Client component

async function getOverviewData() {
  // Server-side data fetching
  const cookieStore = cookies();
  const token = cookieStore.get('auth_token')?.value;

  const response = await fetch(`${process.env.API_URL}/manager/overview`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store', // Always fresh data
  });

  return response.json();
}

export default async function ManagerDashboard() {
  const overview = await getOverviewData();

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Manager Dashboard</h1>
      
      {/* Server-rendered KPIs */}
      <div className="grid grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-xl shadow">
          <p className="text-gray-600 text-sm">Today's Sales</p>
          <p className="text-3xl font-bold text-blue-600">
            {overview.today.sales.toLocaleString()} UGX
          </p>
        </div>
        {/* More KPI cards */}
      </div>

      {/* Client-side interactive charts */}
      <DashboardCharts initialData={overview} />
    </div>
  );
}
```

---

## Phase 3: Core POS Enhancements

### 3.1 Transaction Idempotency

#### Task 3.1.1: Add Idempotency Middleware
**File:** `backend/src/middleware/idempotency.js` (NEW)

```javascript
const redis = require('redis');
const client = redis.createClient({ url: process.env.REDIS_URL });

exports.idempotent = (ttl = 3600) => {
  return async (req, res, next) => {
    const idempotencyKey = req.headers['idempotency-key'];
    
    if (!idempotencyKey) {
      return res.status(400).json({ error: 'Idempotency-Key header required' });
    }

    const cached = await client.get(`idem:${idempotencyKey}`);
    if (cached) {
      // Return cached response
      return res.json(JSON.parse(cached));
    }

    // Store original res.json
    const originalJson = res.json.bind(res);
    res.json = (body) => {
      // Cache this response
      client.setEx(`idem:${idempotencyKey}`, ttl, JSON.stringify(body));
      return originalJson(body);
    };

    next();
  };
};
```

**Usage:**
```javascript
// In routes/transactions.js
const { idempotent } = require('../middleware/idempotency');

router.post('/', 
  authenticate, 
  idempotent(3600), // 1 hour
  createSaleValidation,
  transactionsController.createSale
);
```

### 3.2 Optimistic Inventory Locking

#### Task 3.2.1: Implement Row-Level Locking
**File:** `backend/src/controllers/transactionsController.js`

```javascript
// Enhance createSale with SELECT FOR UPDATE
exports.createSale = async (req, res, next) => {
  const t = await sequelize.transaction();
  
  try {
    // ... validation

    // Lock inventory rows to prevent concurrent overselling
    const saleItems = [];
    for (const item of items) {
      const product = await Product.findByPk(item.product_id, { 
        transaction: t,
        lock: t.LOCK.UPDATE  // Row-level lock
      });
      
      if (!product) {
        await t.rollback();
        return res.status(404).json({ error: `Product ${item.product_id} not found` });
      }

      const inventory = await Inventory.findOne({ 
        where: { product_id: product.id }, 
        transaction: t,
        lock: t.LOCK.UPDATE  // Lock this row
      });

      if (!inventory || inventory.quantity_on_hand < item.quantity) {
        await t.rollback();
        return res.status(400).json({ 
          error: `Insufficient stock for ${product.name}`,
          available: inventory?.quantity_on_hand || 0,
          requested: item.quantity
        });
      }

      saleItems.push({
        product_id: product.id,
        quantity: item.quantity,
        unit_price: product.unit_price, // Use authoritative price from DB
        cost_price: product.cost_price,
        subtotal: product.unit_price * item.quantity
      });
    }

    // Recalculate totals server-side
    const subtotal = saleItems.reduce((sum, item) => sum + item.subtotal, 0);
    const tax = subtotal * 0.18;
    const total = subtotal + tax;

    // Validate against client submission (within 1 UGX tolerance for rounding)
    if (Math.abs(total - req.body.total_amount) > 1) {
      await t.rollback();
      return res.status(400).json({ 
        error: 'Total amount mismatch',
        calculated: total,
        submitted: req.body.total_amount
      });
    }

    // ... rest of transaction creation
    await t.commit();
    res.status(201).json({ data: transaction });
  } catch (error) {
    await t.rollback();
    next(error);
  }
};
```

### 3.3 Hardware Integration Improvements

#### Task 3.3.1: ESC/POS Receipt Printer Support
**File:** `backend/src/utils/receiptPrinter.js` (NEW)

```javascript
const escpos = require('escpos');
const device = new escpos.USB();
const printer = new escpos.Printer(device);

exports.printReceipt = async (transaction, settings) => {
  try {
    device.open(async () => {
      printer
        .font('a')
        .align('ct')
        .style('bu')
        .size(1, 1)
        .text(settings.shop_name)
        .text(settings.location)
        .style('normal')
        .text('--------------------------------')
        .align('lt')
        .text(`Receipt: ${transaction.receipt_number}`)
        .text(`Date: ${new Date().toLocaleString()}`)
        .text(`Cashier: ${transaction.cashier.name}`)
        .text('--------------------------------')
        .text('Item             Qty    Price   Total')
        .text('--------------------------------');

      for (const item of transaction.items) {
        const line = `${item.product.name.padEnd(15)} ${String(item.quantity).padStart(3)} ${formatCurrency(item.unit_price).padStart(8)} ${formatCurrency(item.subtotal).padStart(8)}`;
        printer.text(line);
      }

      printer
        .text('--------------------------------')
        .align('rt')
        .text(`Subtotal: ${formatCurrency(transaction.total_amount - transaction.tax_amount)}`)
        .text(`Tax (18%): ${formatCurrency(transaction.tax_amount)}`)
        .style('bu')
        .size(1, 1)
        .text(`TOTAL: ${formatCurrency(transaction.total_amount)}`)
        .style('normal')
        .size(0, 0)
        .text(`Payment: ${transaction.payment_method}`)
        .text(`Tendered: ${formatCurrency(transaction.amount_tendered)}`)
        .text(`Change: ${formatCurrency(transaction.change_given)}`)
        .text('--------------------------------')
        .align('ct')
        .text(settings.receipt_footer)
        .text('Thank you for shopping with us!')
        .feed(3)
        .cut()
        .close();
    });

    return { success: true };
  } catch (error) {
    console.error('Print failed:', error);
    return { success: false, error: error.message };
  }
};
```

---

## Phase 4: Offline Capability

### 4.1 Progressive Web App Setup

#### Task 4.1.1: Service Worker Configuration
**File:** `frontend-next/public/sw.js` (NEW)

```javascript
const CACHE_NAME = 'rstms-v1';
const OFFLINE_URLS = [
  '/dashboard/pos',
  '/offline.html',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(OFFLINE_URLS);
    })
  );
});

self.addEventListener('fetch', (event) => {
  // Cache-first for static assets
  if (event.request.destination === 'image' || event.request.destination === 'style') {
    event.respondWith(
      caches.match(event.request).then((response) => {
        return response || fetch(event.request);
      })
    );
    return;
  }

  // Network-first for API calls with offline fallback
  if (event.request.url.includes('/api/')) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          // Clone and cache successful responses
          if (response.status === 200) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseClone);
            });
          }
          return response;
        })
        .catch(() => {
          // Try cached response if offline
          return caches.match(event.request);
        })
    );
  }
});
```

#### Task 4.1.2: IndexedDB for Offline Transactions
**File:** `src/lib/offlineDB.ts` (NEW)

```typescript
import Dexie, { Table } from 'dexie';

interface OfflineTransaction {
  id?: number;
  tempId: string;
  items: any[];
  total_amount: number;
  payment_method: string;
  timestamp: number;
  synced: boolean;
}

class OfflineDB extends Dexie {
  pendingTransactions!: Table<OfflineTransaction>;

  constructor() {
    super('RSTMS_Offline');
    this.version(1).stores({
      pendingTransactions: '++id, tempId, timestamp, synced',
      products: 'id, sku, barcode',
    });
  }

  async queueTransaction(transaction: Omit<OfflineTransaction, 'id' | 'synced'>) {
    await this.pendingTransactions.add({
      ...transaction,
      synced: false,
    });
  }

  async getPendingTransactions() {
    return await this.pendingTransactions
      .where('synced')
      .equals(false)
      .toArray();
  }

  async markAsSynced(tempId: string) {
    await this.pendingTransactions
      .where('tempId')
      .equals(tempId)
      .modify({ synced: true });
  }
}

export const offlineDB = new OfflineDB();
```

### 4.2 Offline POS Mode

#### Task 4.2.1: Connectivity Detection
**File:** `src/hooks/useOnlineStatus.ts` (NEW)

```typescript
import { useState, useEffect } from 'react';

export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    const updateOnlineStatus = () => setIsOnline(navigator.onLine);

    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);

    // Ping server to verify actual connectivity
    const interval = setInterval(async () => {
      try {
        await fetch('/api/v1/health', { method: 'HEAD' });
        setIsOnline(true);
      } catch {
        setIsOnline(false);
      }
    }, 30000); // Every 30 seconds

    return () => {
      window.removeEventListener('online', updateOnlineStatus);
      window.removeEventListener('offline', updateOnlineStatus);
      clearInterval(interval);
    };
  }, []);

  return isOnline;
}
```

#### Task 4.2.2: Offline Transaction Queue
**File:** `src/lib/offlineSync.ts` (NEW)

```typescript
import { offlineDB } from './offlineDB';
import { api } from './api';

export async function syncPendingTransactions() {
  const pending = await offlineDB.getPendingTransactions();
  
  for (const transaction of pending) {
    try {
      // Attempt to sync with server
      await api.transactions.create({
        ...transaction,
        offline_sync: true,
        temp_id: transaction.tempId,
      });

      // Mark as synced
      await offlineDB.markAsSynced(transaction.tempId);
    } catch (error) {
      console.error(`Failed to sync transaction ${transaction.tempId}:`, error);
      // Will retry on next sync attempt
    }
  }
}

// Auto-sync when coming back online
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    setTimeout(() => syncPendingTransactions(), 1000);
  });
}
```

---

## Continued in IMPLEMENTATION_PLAN_PART2.md...

This implementation plan will continue with:
- Phase 5: Enterprise Features (Audit, Monitoring)
- Phase 6: Scalability
- Phase 7: Testing
- Phase 8: Documentation
- Migration checklists
- Rollback procedures
- Go-live checklist

The plan is intentionally detailed and incremental to ensure a safe, verifiable migration without breaking existing functionality.
