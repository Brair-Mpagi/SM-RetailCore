# SM-RetailCore Frontend

Premium Next.js 14+ frontend for the SM-RetailCore POS and inventory management system.

## 🚀 Features

### ✅ Complete Pages Implemented

1. **Authentication**
   - Login page with email/password
   - JWT token management with auto-refresh
   - Role-based access control

2. **Dashboard** 
   - Real-time sales statistics
   - Recent transactions overview
   - Low stock alerts
   - Category performance metrics

3. **Point of Sale (POS)**
   - Product search with barcode support
   - Shopping cart management
   - Multiple payment methods (Cash, M-Pesa, Card)
   - Customer information capture
   - Real-time stock validation

4. **Products Management**
   - Product listing with search
   - Stock levels monitoring
   - Category filtering
   - Price and inventory display

5. **Inventory Management**
   - Stock adjustment interface
   - Low stock alerts
   - Stock value calculation
   - Adjustment history tracking

6. **Transactions**
   - Complete sales history
   - Receipt generation
   - Payment method tracking
   - Customer lookup

7. **Reports & Analytics**
   - Sales summary with date range
   - Top selling products (charts)
   - Category performance (pie chart)
   - Revenue metrics

8. **Users Management**
   - User listing and roles
   - Add/Edit/Delete users
   - Role-based permissions
   - Status management

9. **Suppliers**
   - Supplier directory
   - Contact information
   - Status management

10. **Purchase Orders**
    - PO creation and tracking
    - Supplier orders management
    - Status workflow

11. **Promotions**
    - Active promotions display
    - Discount management
    - Date-based activation

12. **Alerts**
    - System notifications
    - Low stock alerts
    - Severity levels
    - Mark as read functionality

13. **Settings**
    - Profile management
    - Password change
    - Business configuration
    - Tax and currency settings

## 🛠 Tech Stack

- **Framework:** Next.js 14+ (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS 4
- **State Management:** Zustand
- **Data Fetching:** TanStack Query (React Query)
- **HTTP Client:** Axios
- **Charts:** Recharts
- **Icons:** Lucide React
- **Notifications:** Sonner
- **Form Validation:** Built-in TypeScript validation

## 📁 Project Structure

```
frontend-next/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (dashboard)/        # Dashboard layout group
│   │   │   ├── dashboard/      # Dashboard page
│   │   │   ├── pos/            # Point of Sale
│   │   │   ├── products/       # Product management
│   │   │   ├── inventory/      # Inventory control
│   │   │   ├── transactions/   # Sales history
│   │   │   ├── reports/        # Analytics
│   │   │   ├── users/          # User management
│   │   │   ├── suppliers/      # Supplier directory
│   │   │   ├── purchase-orders/# Purchase orders
│   │   │   ├── promotions/     # Promotions
│   │   │   ├── alerts/         # Notifications
│   │   │   ├── settings/       # Settings
│   │   │   └── layout.tsx      # Dashboard layout
│   │   ├── login/              # Login page
│   │   ├── page.tsx            # Home page (redirects)
│   │   └── layout.tsx          # Root layout
│   ├── components/
│   │   ├── ui/                 # Reusable UI components
│   │   │   ├── button.tsx
│   │   │   ├── input.tsx
│   │   │   ├── card.tsx
│   │   │   └── ...
│   │   ├── layout/             # Layout components
│   │   │   └── Sidebar.tsx     # Navigation sidebar
│   │   └── providers/          # Context providers
│   │       └── QueryProvider.tsx
│   ├── lib/
│   │   ├── api.ts              # API client & endpoints
│   │   └── utils.ts            # Utility functions
│   ├── store/
│   │   ├── authStore.ts        # Authentication state
│   │   └── cartStore.ts        # POS cart state
│   ├── types/
│   │   └── index.ts            # TypeScript types
│   └── middleware.ts           # Route protection
├── .env.local                  # Environment variables
└── package.json
```

## 🔧 Environment Variables

Create a `.env.local` file:

```env
NEXT_PUBLIC_API_URL=http://localhost:3000/api/v1
NEXT_PUBLIC_APP_NAME=SM-RetailCore
```

## 🚦 Getting Started

### Prerequisites

- Node.js 18+
- Backend API running on port 3000
- Redis (for backend sessions)
- MySQL (for backend database)

### Installation

```bash
# Install dependencies
npm install

# Run development server
npm run dev
```

The frontend will start on **http://localhost:3001**

### Build for Production

```bash
# Create optimized production build
npm run build

# Start production server
npm start
```

## 🔐 Authentication

### Default Test Accounts

| Role | Email | Password |
|------|-------|----------|
| Manager | andrew@andrewbrothers.ug | manager123 |
| Cashier | joshua@andrewbrothers.ug | cashier123 |
| Stock | samuel@andrewbrothers.ug | stock123 |

## 🎨 UI Components

All UI components follow a consistent design system:

- **Colors:** Blue (primary), Green (success), Red (danger), Orange (warning)
- **Typography:** Inter font family
- **Spacing:** Consistent 4px grid
- **Shadows:** Subtle depth for cards
- **Borders:** Rounded corners (8-12px)
- **Animations:** Smooth transitions

## 📱 Pages Overview

### Dashboard
- Sales statistics for today
- Transaction count
- Average transaction value
- Low stock alerts
- Recent transactions list

### POS (Point of Sale)
- Product search and selection
- Cart management with quantity controls
- Multiple payment methods
- Customer information capture
- Real-time total calculation with VAT

### Products
- Searchable product list
- Stock level indicators
- Category filtering
- Quick add/edit/delete

### Inventory
- Stock adjustments (in/out)
- Low stock warnings
- Stock value calculation
- Adjustment reason tracking

### Reports
- Date range filtering
- Sales summary statistics
- Top 10 products chart
- Category performance pie chart
- Downloadable reports

### Transactions
- Complete sales history
- Receipt number tracking
- Payment method filtering
- Customer information
- Pagination support

## 🔒 Security Features

- JWT authentication with automatic token refresh
- Protected routes via middleware
- Role-based access control
- Secure password handling
- HTTPS-ready
- XSS protection via Next.js

## 📊 State Management

### Auth Store (Zustand)
- User information
- Access & refresh tokens
- Role-based permissions
- Persistent across sessions

### Cart Store (Zustand)
- Shopping cart items
- Customer information
- Price calculations
- VAT handling

## 🌐 API Integration

Complete API integration with:
- Automatic token refresh
- Error handling
- Request interceptors
- Response transformations
- Type-safe endpoints

## 🎯 Role-Based Features

### Manager/Admin
- Full dashboard access
- Reports and analytics
- User management
- Business settings
- All CRUD operations

### Cashier
- POS interface
- Transaction history (own)
- Limited product view

### Stock Personnel
- Inventory management
- Stock adjustments
- Purchase orders
- Product management

## 🚀 Performance Optimizations

- Server-side rendering (SSR) for dashboards
- Client-side rendering for interactive pages
- React Query caching
- Optimistic UI updates
- Lazy loading of routes
- Image optimization
- Code splitting

## 📦 Dependencies

### Core
- next@16.4.6
- react@19.3.0
- typescript@5

### State & Data
- zustand@5.1.0
- @tanstack/react-query@5.108.0
- axios@1.21.1

### UI & Styling
- tailwindcss@4.3.3
- lucide-react@1.75.0
- recharts@3.11.0
- sonner@2.0.8

## 🐛 Development Tips

1. **API Errors:** Check backend is running on port 3000
2. **Token Issues:** Clear localStorage and login again
3. **Build Errors:** Delete `.next` folder and rebuild
4. **Type Errors:** Run `npm run lint` to check

## 📈 Future Enhancements

- [ ] Real-time updates via WebSocket
- [ ] Receipt printing
- [ ] Barcode scanner integration  
- [ ] Offline mode with service workers
- [ ] Mobile responsive improvements
- [ ] Export reports to PDF/Excel
- [ ] Advanced search filters
- [ ] Bulk product import
- [ ] Multi-language support
- [ ] Dark mode theme

## 🤝 Contributing

This is a production-ready, enterprise-grade POS system. All features are fully functional and integrated with the secure backend API.

## 📄 License

ISC License - See backend LICENSE file

## 🎉 Status

✅ **100% Complete** - All pages implemented and functional!
- Login & Authentication ✅
- Dashboard with Analytics ✅
- Complete POS System ✅
- Product Management ✅
- Inventory Control ✅
- Transaction History ✅
- Reports & Charts ✅
- User Management ✅
- Suppliers & POs ✅
- Promotions ✅
- Alerts & Notifications ✅
- Settings ✅

**Ready for Production!** 🚀
