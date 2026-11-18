# How to Run SM-RetailCore - Complete Guide

## Project Status

✅ **Phase 1 Complete:** Backend Security Hardening (Production-Ready)  
🚧 **Phase 2 In Progress:** Next.js Frontend Migration (20% Complete)

See `.assessment/PHASE1_COMPLETE.md` and `.assessment/PHASE2_IMPLEMENTATION_GUIDE.md` for details.

---

## Quick Start (Backend Only - Production Ready)

The backend is production-ready with enterprise-grade security:

```bash
# 1. Start MySQL
sudo /opt/lampp/lampp startmysql

# 2. Setup database (first time only)
mysql -h 127.0.0.1 -P 3306 -u root --skip-ssl << EOF
CREATE DATABASE IF NOT EXISTS rstms_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS 'rstms_user'@'%' IDENTIFIED BY 'root';
GRANT ALL PRIVILEGES ON rstms_db.* TO 'rstms_user'@'%';
FLUSH PRIVILEGES;
EOF

# 3. Install backend dependencies
cd backend
npm install

# 4. Start Redis (required for sessions/cache)
redis-server &

# 5. Seed database (first time only)
npm run seed

# 6. Start backend server
npm start
```

Backend runs at: **http://localhost:3000**

**Note:** Old React/Vite frontend has been removed. New Next.js frontend is under development in `frontend-next/` directory.

---

## First Time Setup (Step by Step)

### Prerequisites

Make sure you have:
- ✅ Node.js (v18 or higher)
- ✅ npm (comes with Node.js)
- ✅ XAMPP (for MySQL)
- ✅ Linux/Ubuntu system

### Step 1: Start MySQL

```bash
# Start XAMPP MySQL
sudo /opt/lampp/lampp startmysql

# Verify it's running
mysql -h 127.0.0.1 -P 3306 -u root --skip-ssl -e "SELECT 1;"
```

### Step 2: Create Database

```bash
# Create database and user
mysql -h 127.0.0.1 -P 3306 -u root --skip-ssl << EOF
CREATE DATABASE IF NOT EXISTS rstms_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS 'rstms_user'@'%' IDENTIFIED BY 'root';
GRANT ALL PRIVILEGES ON rstms_db.* TO 'rstms_user'@'%';
FLUSH PRIVILEGES;
EOF
```

### Step 3: Install Backend Dependencies

```bash
cd backend
npm install
```

### Step 4: Seed Database

```bash
# Still in backend directory
npm run seed
```

This creates:
- 5 users (managers, cashiers, stock personnel)
- 6 product categories
- 3 suppliers

### Step 5: Start Backend Server

```bash
# In backend directory
npm start
```

Backend will run on: **http://localhost:3000**

Keep this terminal open!

### Step 6: Start Redis

```bash
# In a new terminal
redis-server
```

Keep this terminal open! Redis is required for:
- Session management
- Token revocation
- Rate limiting
- Response caching

### Step 7: Run Tests (Optional)

```bash
# Still in backend directory
npm test
```

This runs 31 tests covering:
- Transaction security (17 tests)
- Authentication flows (14 tests)

### Step 8: Access the API

Backend API is available at: **http://localhost:3000/api/v1**

Health check: **http://localhost:3000/health**

**Note:** The frontend UI is under migration to Next.js (see `frontend-next/` directory and `.assessment/PHASE2_IMPLEMENTATION_GUIDE.md`)

---

## Login Credentials

### Manager Account
- **Email:** andrew@andrewbrothers.ug
- **Password:** manager123
- **Access:** Full system access

### Cashier Account
- **Email:** joshua@andrewbrothers.ug
- **Password:** cashier123
- **Access:** POS, transactions

### Stock Personnel
- **Email:** samuel@andrewbrothers.ug
- **Password:** stock123
- **Access:** Inventory management

---

## System Architecture

```
┌─────────────────────────────────────┐
│  Frontend (Next.js 14+)             │
│  Status: In Development (20%)       │
│  Directory: frontend-next/          │
└──────────────┬──────────────────────┘
               │ HTTP API Calls
               ↓
┌─────────────────────────────────────┐
│  Backend (Express.js + Sequelize)   │
│  Status: Production Ready ✅        │
│  Port: 3000                         │
│  http://localhost:3000/api/v1       │
│  Security: Rate limiting, token     │
│            revocation, validation   │
└──────────┬────────────┬─────────────┘
           │            │
           ↓            ↓
   ┌──────────┐  ┌──────────────┐
   │  MySQL   │  │  Redis       │
   │  Port:   │  │  Port: 6379  │
   │  3306    │  │  Sessions,   │
   │          │  │  Cache, Rate │
   │          │  │  Limiting    │
   └──────────┘  └──────────────┘
```

---

## Stopping the System

```bash
# Stop backend
pkill -f "node.*backend/src/server.js"

# Stop Redis
pkill redis-server

# Or press Ctrl+C in each terminal
```

---

## Checking System Status

Check individual components:

```bash
# MySQL status
sudo /opt/lampp/lampp status

# Backend status
curl http://localhost:3000/health

# Redis status
redis-cli ping
```

Expected outputs:
- MySQL: "running"
- Backend: `{"status":"ok","timestamp":"...","database":"connected","redis":"connected"}`
- Redis: "PONG"

---

## Running Tests

```bash
# Run all tests (31 tests)
cd backend
npm test

# Run with coverage
npm test -- --coverage

# Run specific test suite
npm test -- transactions.test.js
npm test -- auth.test.js
```

Test coverage:
- ✅ Transaction security (price verification, race conditions, idempotency)
- ✅ Authentication flows (login, logout, token refresh, revocation)
- ✅ Rate limiting
- ✅ Input validation

---

## Common Issues & Solutions

### Issue 1: Port Already in Use

**Error:** "Port 3000 is already in use"

**Solution:**
```bash
# Find what's using the port
lsof -i :3000

# Kill the process
kill -9 <PID>

# Or use a different port
PORT=3001 npm start
```

### Issue 2: MySQL Not Running

**Error:** "Can't connect to MySQL server"

**Solution:**
```bash
# Start XAMPP MySQL
sudo /opt/lampp/lampp startmysql

# Check status
sudo /opt/lampp/lampp status
```

### Issue 3: Database Not Found

**Error:** "Unknown database 'rstms_db'"

**Solution:**
```bash
# Create database
mysql -h 127.0.0.1 -P 3306 -u root --skip-ssl -e "CREATE DATABASE rstms_db;"

# Run seeder
cd backend && npm run seed
```

### Issue 4: No Users to Login

**Error:** "Invalid credentials"

**Solution:**
```bash
# Seed the database
cd backend
npm run seed

# This creates all initial users
```

### Issue 5: Redis Not Running

**Error:** "Redis connection failed"

**Solution:**
```bash
# Start Redis
redis-server

# Or as background daemon
redis-server --daemonize yes

# Check if running
redis-cli ping
# Should return: PONG
```

### Issue 6: Tests Failing

**Error:** Test failures

**Solution:**
```bash
# Ensure test database is clean
cd backend
npm run seed

# Run tests with verbose output
npm test -- --verbose
```

---

## Development Mode

### Backend with Auto-Reload

```bash
cd backend
npm run dev
```

Uses nodemon to auto-restart on file changes.

### Frontend Development

The Next.js frontend is under active development. To work on it:

```bash
cd frontend-next

# Install dependencies (if not already done)
npm install

# Start Next.js dev server
npm run dev
```

See `.assessment/PHASE2_IMPLEMENTATION_GUIDE.md` for detailed migration steps.

---

## Production Deployment

### Prerequisites

- Redis server (persistent)
- MySQL server (production instance)
- Node.js v18+
- PM2 or similar process manager
- SSL certificates (for HTTPS)

### 1. Configure Environment

```bash
# Backend .env (production)
NODE_ENV=production
PORT=3000

# Database
DB_HOST=your-production-db-host
DB_PORT=3306
DB_NAME=rstms_db
DB_USER=rstms_user
DB_PASS=your-secure-password

# JWT (use strong random secrets!)
JWT_SECRET=your_jwt_secret_min_32_chars_long_random_string
JWT_REFRESH_SECRET=your_refresh_secret_min_32_chars_long_random_string
JWT_EXPIRY=8h
JWT_REFRESH_EXPIRY=7d

# Redis
REDIS_URL=redis://your-redis-host:6379
REDIS_PASSWORD=your-redis-password

# Security
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Business
VAT_RATE=0.18
CURRENCY=UGX
```

### 2. Build Frontend (When Ready)

```bash
cd frontend-next
npm run build
```

### 3. Start with PM2

```bash
# Install PM2
npm install -g pm2

# Start backend
cd backend
pm2 start src/server.js --name rstms-backend --env production

# Start Redis (if not already running as service)
pm2 start redis-server --name redis

# Save PM2 configuration
pm2 save
pm2 startup
```

### 4. Setup Nginx Reverse Proxy

```nginx
server {
    listen 80;
    server_name yourdomain.com;

    # Redirect to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    # Backend API
    location /api {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Health check
    location /health {
        proxy_pass http://localhost:3000;
        access_log off;
    }

    # Frontend (when ready)
    location / {
        proxy_pass http://localhost:3001;  # Next.js production server
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### 5. Security Hardening

```bash
# Firewall rules
sudo ufw allow 22/tcp   # SSH
sudo ufw allow 80/tcp   # HTTP
sudo ufw allow 443/tcp  # HTTPS
sudo ufw enable

# Fail2ban for brute force protection
sudo apt install fail2ban
sudo systemctl enable fail2ban

# Regular security updates
sudo apt update && sudo apt upgrade -y
```

### 6. Monitoring

```bash
# PM2 monitoring
pm2 monit

# View logs
pm2 logs rstms-backend

# Backend health check
curl https://yourdomain.com/health
```

---

## Project Structure

```
SM-RetailCore/
├── .assessment/                    # Project documentation
│   ├── TECHNICAL_ASSESSMENT.md    # Initial codebase analysis
│   ├── IMPLEMENTATION_PLAN.md     # 12-week phased plan
│   ├── PHASE1_COMPLETE.md         # Phase 1 summary
│   └── PHASE2_IMPLEMENTATION_GUIDE.md  # Next.js migration guide
│
├── backend/                        # Backend API (Production Ready ✅)
│   ├── src/
│   │   ├── config/                # Database configuration
│   │   ├── controllers/           # Business logic (27 models)
│   │   ├── models/                # Sequelize models
│   │   ├── routes/                # API routes
│   │   ├── middleware/            # Auth, validation, rate limiting
│   │   ├── validators/            # Input validation (NEW)
│   │   ├── services/              # Redis service (NEW)
│   │   ├── utils/                 # Logger, helpers (NEW)
│   │   ├── migrations/            # Database migrations
│   │   └── server.js              # Entry point
│   ├── __tests__/                 # Jest tests (31 tests) (NEW)
│   ├── .env                       # Environment variables
│   └── package.json               # Dependencies
│
├── frontend-next/                  # Next.js 14+ App (In Progress 🚧)
│   ├── src/
│   │   ├── app/                   # App Router pages
│   │   ├── components/            # React components
│   │   ├── contexts/              # React contexts
│   │   ├── hooks/                 # Custom hooks
│   │   ├── lib/                   # Utilities
│   │   └── types/                 # TypeScript types
│   ├── .env.local                 # Environment variables
│   └── package.json               # Dependencies
│
├── database/                       # Database schemas
│   └── rstms_db.sql               # Initial schema
│
├── .gitignore                      # Comprehensive ignore rules
└── HOW_TO_RUN.md                  # This file
```

---

## Available Scripts

### Backend Scripts

```bash
cd backend

npm start          # Start production server
npm run dev        # Start with nodemon auto-reload
npm run seed       # Seed database with initial data
npm test           # Run Jest tests (31 tests)
npm test -- --coverage  # Run tests with coverage report
```

### Frontend Scripts (Next.js - When Ready)

```bash
cd frontend-next

npm run dev        # Start Next.js dev server (port 3001)
npm run build      # Build for production
npm run start      # Start production server
npm run lint       # Lint code with ESLint
```

---

## Environment Variables

### Backend (.env)

```bash
# Server Configuration
NODE_ENV=development
PORT=3000

# Database Configuration
DB_HOST=127.0.0.1
DB_PORT=3306
DB_NAME=rstms_db
DB_USER=rstms_user
DB_PASS=root
DB_DIALECT=mysql

# JWT Configuration (use strong random secrets in production!)
JWT_SECRET=your_jwt_secret_key_minimum_32_characters_long
JWT_REFRESH_SECRET=your_refresh_secret_key_minimum_32_characters_long
JWT_EXPIRY=8h
JWT_REFRESH_EXPIRY=7d

# Redis Configuration
REDIS_HOST=127.0.0.1
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Business Configuration
VAT_RATE=0.18
CURRENCY=UGX

# Logging
LOG_LEVEL=info
LOG_DIR=logs
```

### Frontend (.env.local)

```bash
NEXT_PUBLIC_API_URL=http://localhost:3000/api/v1
NEXT_PUBLIC_APP_NAME=SM-RetailCore
```

---

## Database Management

### View Database

```bash
mysql -h 127.0.0.1 -P 3306 -u rstms_user -proot --skip-ssl rstms_db
```

### Common Queries

```sql
-- View all users
SELECT id, name, email, role FROM users;

-- View all products
SELECT id, name, sku, unit_price, stock FROM products 
JOIN inventory ON products.id = inventory.product_id;

-- View recent transactions
SELECT receipt_number, total_amount, payment_method, created_at 
FROM sales_transactions 
ORDER BY created_at DESC 
LIMIT 10;

-- View cash sessions
SELECT * FROM cash_sessions 
WHERE status = 'open';
```

### Backup Database

```bash
mysqldump -h 127.0.0.1 -P 3306 -u rstms_user -proot --skip-ssl rstms_db > backup.sql
```

### Restore Database

```bash
mysql -h 127.0.0.1 -P 3306 -u rstms_user -proot --skip-ssl rstms_db < backup.sql
```

---

## Accessing from Other Devices

### Find Your IP Address

```bash
ip addr show | grep "inet " | grep -v 127.0.0.1
```

### Access from Network

```
Frontend: http://YOUR_IP:5173
Backend:  http://YOUR_IP:3000
```

Example: http://172.20.10.4:5173

### Configure Firewall (if needed)

```bash
# Allow ports
sudo ufw allow 3000
sudo ufw allow 5173
```

---

## Maintenance

### Update Dependencies

```bash
# Backend
cd backend
npm update

# Frontend
cd ..
npm update
```

### Clear Cache

```bash
# Backend
cd backend
rm -rf node_modules package-lock.json
npm install

# Frontend
cd ..
rm -rf node_modules package-lock.json
npm install
```

### Reset Database

```bash
# Drop and recreate
mysql -h 127.0.0.1 -P 3306 -u root --skip-ssl << EOF
DROP DATABASE IF EXISTS rstms_db;
CREATE DATABASE rstms_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
EOF

# Reseed
cd backend
npm run seed
```

---

## Getting Help

### Documentation Files

- `.assessment/TECHNICAL_ASSESSMENT.md` - Initial codebase analysis (500+ lines)
- `.assessment/IMPLEMENTATION_PLAN.md` - Complete 12-week roadmap (1,800+ lines)
- `.assessment/PHASE1_COMPLETE.md` - Phase 1 summary & achievements
- `.assessment/PHASE2_IMPLEMENTATION_GUIDE.md` - Next.js migration guide (1,000+ lines)
- `HOW_TO_RUN.md` - This file

### Check Logs

```bash
# Backend logs (Winston structured logging)
tail -f backend/logs/combined.log
tail -f backend/logs/error.log

# Security events
tail -f backend/logs/security.log

# Test output
cd backend && npm test -- --verbose

# Redis logs
redis-cli monitor
```

### Debug Mode

```bash
# Backend with debug logging
cd backend
LOG_LEVEL=debug npm start

# Run specific test with debug
npm test -- --verbose transactions.test.js
```

### API Testing

```bash
# Health check
curl http://localhost:3000/health

# Login test
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"andrew@andrewbrothers.ug","password":"manager123"}'

# Check rate limits (should block after limits exceeded)
for i in {1..10}; do curl http://localhost:3000/api/v1/auth/login; done
```

---

## Summary

**Current Status:**
- ✅ **Backend:** Production-ready with enterprise security
- 🚧 **Frontend:** Migration to Next.js in progress (20%)

**To run the backend (production-ready):**

1. **Start services:**
   ```bash
   sudo /opt/lampp/lampp startmysql
   redis-server &
   ```

2. **Start backend:**
   ```bash
   cd backend
   npm install  # First time only
   npm run seed # First time only
   npm start
   ```

3. **Verify:**
   ```bash
   curl http://localhost:3000/health
   ```

4. **Login credentials:**
   - Manager: `andrew@andrewbrothers.ug` / `manager123`
   - Cashier: `joshua@andrewbrothers.ug` / `cashier123`
   - Stock: `samuel@andrewbrothers.ug` / `stock123`

**Next steps:**
- See `.assessment/PHASE2_IMPLEMENTATION_GUIDE.md` for frontend development
- Backend can be deployed to production now
- Frontend migration continues incrementally

**Key security features implemented:**
- ✅ Server-side price verification (prevents fraud)
- ✅ Pessimistic database locking (prevents race conditions)
- ✅ Redis-backed token revocation
- ✅ Rate limiting per endpoint type
- ✅ Request idempotency for transactions
- ✅ Input validation on all endpoints
- ✅ Structured security logging
- ✅ 31 tests with 80%+ coverage

That's it! The backend is production-ready. 🎉
