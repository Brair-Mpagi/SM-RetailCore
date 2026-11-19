# SM-RetailCore

Enterprise-grade Point of Sale and Inventory Management System.

## Overview

SM-RetailCore is a professional supermarket management system built with modern technologies, featuring comprehensive POS capabilities, inventory control, sales analytics, and multi-user management.

## Tech Stack

- **Backend:** Node.js, Express, Sequelize ORM, MySQL, Redis
- **Frontend:** Next.js 14+, TypeScript, Tailwind CSS, React Query
- **Security:** JWT authentication, rate limiting, input validation
- **Testing:** Jest (31 tests passing)

## Features

- Point of Sale (POS) with multiple payment methods
- Product and inventory management
- Sales transactions and reporting
- User management with role-based access
- Supplier and purchase order management
- Promotions and alerts
- Real-time analytics dashboard

## Quick Start

### Prerequisites

- Node.js 18+
- MySQL
- Redis (optional but recommended)

### Installation

1. **Start MySQL:**
   ```bash
   sudo /opt/lampp/lampp startmysql
   ```

2. **Start Redis:**
   ```bash
   redis-server --daemonize yes
   ```

3. **Start Backend:**
   ```bash
   cd backend
   npm install  # First time only
   npm start
   ```

4. **Start Frontend:**
   ```bash
   cd frontend-next
   npm install  # First time only
   npm run dev
   ```

5. **Access Application:**
   - Frontend: http://localhost:3001
   - Backend API: http://localhost:3000/api/v1

### Default Credentials

- **Manager:** andrew@andrewbrothers.ug / manager123
- **Cashier:** joshua@andrewbrothers.ug / cashier123
- **Stock:** samuel@andrewbrothers.ug / stock123

## Project Structure

```
SM-RetailCore/
├── backend/           # Node.js/Express API
├── frontend-next/     # Next.js frontend
├── database/          # SQL schemas
└── temp/             # Documentation and scripts
```

## Documentation

Additional documentation and setup guides can be found in the `temp/documentation/` folder.

## Testing

```bash
cd backend
npm test
```

## License

ISC

## Status

✅ Production Ready - All features implemented and tested.
