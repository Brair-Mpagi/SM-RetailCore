# How to Run RSTMS - Complete Guide

## Quick Start (Automated)

If everything is already set up, just run:

```bash
./setup-and-start.sh
```

This will:
1. Start XAMPP MySQL
2. Create database and user
3. Install dependencies
4. Seed initial data
5. Start backend server
6. Start frontend server

Then open: **http://localhost:5174** (or http://localhost:5173)

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

### Step 6: Install Frontend Dependencies

Open a NEW terminal:

```bash
cd /path/to/project
npm install
```

### Step 7: Start Frontend Server

```bash
# In project root directory
npm run dev
```

Frontend will run on: **http://localhost:5173** or **http://localhost:5174**

Keep this terminal open too!

### Step 8: Access the Application

Open your browser and go to:
- **http://localhost:5173** or
- **http://localhost:5174** or
- **http://172.20.10.4:5173** (network access)

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
│  Frontend (React + Vite)            │
│  Port: 5173 or 5174                 │
│  http://localhost:5173              │
└──────────────┬──────────────────────┘
               │ HTTP API Calls
               ↓
┌─────────────────────────────────────┐
│  Backend (Express.js + Sequelize)   │
│  Port: 3000                         │
│  http://localhost:3000/api/v1       │
└──────────────┬──────────────────────┘
               │ SQL Queries
               ↓
┌─────────────────────────────────────┐
│  Database (XAMPP MySQL)             │
│  Port: 3306                         │
│  Database: rstms_db                 │
└─────────────────────────────────────┘
```

---

## Stopping the System

### Option 1: Use Stop Script

```bash
./stop-system.sh
```

### Option 2: Manual Stop

```bash
# Find and kill processes
pkill -f "node.*backend/src/server.js"
pkill -f "vite"

# Or press Ctrl+C in each terminal
```

---

## Checking System Status

```bash
./check-status.sh
```

This shows:
- ✅ MySQL status
- ✅ Database status
- ✅ Backend status
- ✅ Frontend status

---

## Running Tests

```bash
# Test all features
./test-system.sh

# Test specific features
./test-features.sh
```

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

### Issue 5: Frontend Won't Start

**Error:** "Cannot find module"

**Solution:**
```bash
# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
npm run dev
```

### Issue 6: Backend Crashes

**Error:** Various backend errors

**Solution:**
```bash
# Check logs
tail -f backend.log

# Restart backend
cd backend
npm start
```

---

## Development Mode

### Backend with Auto-Reload

```bash
cd backend
npm run dev
```

Uses nodemon to auto-restart on file changes.

### Frontend with Hot Reload

```bash
npm run dev
```

Vite automatically reloads on file changes.

---

## Production Deployment

### 1. Build Frontend

```bash
npm run build
```

Creates optimized build in `dist/` folder.

### 2. Configure Environment

```bash
# Backend .env
NODE_ENV=production
PORT=3000
DB_HOST=your-db-host
DB_NAME=rstms_db
DB_USER=rstms_user
DB_PASS=your-secure-password
JWT_SECRET=your-long-random-secret-key
```

### 3. Start with PM2 (Process Manager)

```bash
# Install PM2
npm install -g pm2

# Start backend
cd backend
pm2 start src/server.js --name rstms-backend

# Start frontend (serve build)
pm2 serve dist 5173 --name rstms-frontend

# Save configuration
pm2 save
pm2 startup
```

### 4. Setup Nginx (Optional)

```nginx
server {
    listen 80;
    server_name yourdomain.com;

    # Frontend
    location / {
        root /path/to/project/dist;
        try_files $uri $uri/ /index.html;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

---

## Project Structure

```
rstms/
├── backend/                 # Backend API
│   ├── src/
│   │   ├── config/         # Database config
│   │   ├── controllers/    # Business logic
│   │   ├── models/         # Database models
│   │   ├── routes/         # API routes
│   │   ├── middleware/     # Auth, validation
│   │   ├── seeders/        # Initial data
│   │   └── server.js       # Entry point
│   ├── .env                # Environment variables
│   └── package.json        # Dependencies
│
├── src/                    # Frontend
│   ├── components/         # React components
│   ├── pages/             # Page components
│   ├── contexts/          # React contexts
│   ├── services/          # API services
│   ├── utils/             # Utilities
│   └── main.jsx           # Entry point
│
├── setup-and-start.sh     # Automated setup
├── stop-system.sh         # Stop all servers
├── check-status.sh        # Check system status
├── test-system.sh         # Run tests
└── package.json           # Frontend dependencies
```

---

## Available Scripts

### Backend Scripts

```bash
cd backend

npm start          # Start server
npm run dev        # Start with auto-reload
npm run seed       # Seed database
npm run migrate    # Run migrations
npm test           # Run tests
```

### Frontend Scripts

```bash
npm run dev        # Start dev server
npm run build      # Build for production
npm run preview    # Preview production build
npm run lint       # Lint code
```

---

## Environment Variables

### Backend (.env)

```bash
# Server
NODE_ENV=development
PORT=3000

# Database
DB_HOST=127.0.0.1
DB_PORT=3306
DB_NAME=rstms_db
DB_USER=rstms_user
DB_PASS=root

# JWT
JWT_SECRET=your_jwt_secret_key_min_32_characters_long
JWT_REFRESH_SECRET=your_refresh_secret_key_min_32_characters_long
JWT_EXPIRY=8h
JWT_REFRESH_EXPIRY=7d

# Business
VAT_RATE=0.18
CURRENCY=UGX
```

### Frontend (.env)

```bash
VITE_API_URL=http://localhost:3000/api/v1
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

- `START_HERE.md` - Quick start guide
- `SYSTEM_READY.md` - System status
- `FEATURES_FIXED.md` - Feature documentation
- `POS_FIXES_AND_USB_SCANNER.md` - POS guide
- `INVENTORY_FEATURES_COMPLETE.md` - Inventory guide

### Check Logs

```bash
# Backend logs
tail -f backend.log

# Frontend logs (in terminal where npm run dev is running)

# System logs
journalctl -u mysql
```

### Debug Mode

```bash
# Backend with debug
DEBUG=* npm start

# Frontend with verbose
npm run dev -- --debug
```

---

## Summary

**To run the project:**

1. **Start MySQL:** `sudo /opt/lampp/lampp startmysql`
2. **Run setup script:** `./setup-and-start.sh`
3. **Open browser:** http://localhost:5173
4. **Login:** andrew@andrewbrothers.ug / manager123

**To stop:**
```bash
./stop-system.sh
```

**To check status:**
```bash
./check-status.sh
```

That's it! The system is ready to use. 🎉
