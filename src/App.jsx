import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { SettingsProvider } from './contexts/SettingsContext';
import AppShell from './components/layout/AppShell';
import Login from './pages/Login';
import ManagerDashboard from './pages/manager/ManagerDashboard';
import POSInterface from './pages/pos/POSInterface';
import InventoryDashboard from './pages/inventory/InventoryDashboard';
import AddProductPage from './pages/inventory/AddProductPage';
import CategoriesPage from './pages/inventory/CategoriesPage';
import SuppliersPage from './pages/inventory/SuppliersPage';
import PurchaseRequestPage from './pages/inventory/PurchaseRequestPage';
import PurchaseOrderPage from './pages/inventory/PurchaseOrderPage';
import ShrinkagePage from './pages/inventory/ShrinkagePage';
import CycleCountPage from './pages/inventory/CycleCountPage';
import ShelfTagsPage from './pages/inventory/ShelfTagsPage';
import InventoryReports from './pages/inventory/InventoryReports';
import BarcodeLabelPage from './pages/inventory/BarcodeLabelPage';
import UserManagement from './pages/admin/UserManagement';
import Reports from './pages/reports/Reports';
import ComprehensiveReport from './pages/manager/ComprehensiveReport';
import AuditLogs from './pages/admin/AuditLogs';
import Transactions from './pages/transactions/Transactions';
import Promotions from './pages/promotions/Promotions';
import SystemSettings from './pages/admin/SystemSettings';
import AlertsCenter from './pages/alerts/AlertsCenter';
import StockDashboard from './pages/stock/StockDashboard';
import PhoneScannerPage from './pages/scan/PhoneScannerPage';

function RoleRouter() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;

  const defaultRoute = {
    manager: '/dashboard/manager',
    cashier: '/dashboard/pos',
    stock: '/dashboard/stock',
  }[user.role] || '/login';

  return <Navigate to={defaultRoute} replace />;
}

function ProtectedRoute({ children, allowedRoles }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }
  return children;
}

function AppRoutes() {
  const { user } = useAuth();

  return (
    <Routes>
      {/* Public route — no auth required */}
      <Route path="/scan" element={<PhoneScannerPage />} />
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login />} />
      <Route path="/" element={<RoleRouter />} />
      
      {/* Protected app routes — wrapped in AppShell */}
      <Route path="/dashboard" element={
        <ProtectedRoute>
          <AppShell />
        </ProtectedRoute>
      }>
        <Route path="manager" element={
          <ProtectedRoute allowedRoles={['manager']}>
            <ManagerDashboard />
          </ProtectedRoute>
        } />
        <Route path="pos" element={
          <ProtectedRoute allowedRoles={['manager', 'cashier']}>
            <POSInterface />
          </ProtectedRoute>
        } />
        <Route path="transactions" element={
          <ProtectedRoute allowedRoles={['manager', 'cashier']}>
            <Transactions />
          </ProtectedRoute>
        } />
        <Route path="stock" element={
          <ProtectedRoute allowedRoles={['manager', 'stock']}>
            <StockDashboard />
          </ProtectedRoute>
        } />
        <Route path="inventory" element={
          <ProtectedRoute allowedRoles={['manager', 'stock']}>
            <InventoryDashboard />
          </ProtectedRoute>
        } />
        <Route path="inventory/add-product" element={
          <ProtectedRoute allowedRoles={['manager', 'stock']}>
            <AddProductPage />
          </ProtectedRoute>
        } />
        <Route path="inventory/categories" element={
          <ProtectedRoute allowedRoles={['manager', 'stock']}>
            <CategoriesPage />
          </ProtectedRoute>
        } />
        <Route path="inventory/suppliers" element={
          <ProtectedRoute allowedRoles={['manager', 'stock']}>
            <SuppliersPage />
          </ProtectedRoute>
        } />
        <Route path="inventory/print-tags" element={
          <ProtectedRoute allowedRoles={['manager', 'stock']}>
            <ShelfTagsPage />
          </ProtectedRoute>
        } />
        <Route path="inventory/purchase-request" element={
          <ProtectedRoute allowedRoles={['manager', 'stock']}>
            <PurchaseRequestPage />
          </ProtectedRoute>
        } />
        <Route path="inventory/purchase-order" element={
          <ProtectedRoute allowedRoles={['manager', 'stock']}>
            <PurchaseOrderPage />
          </ProtectedRoute>
        } />
        <Route path="inventory/shrinkage" element={
          <ProtectedRoute allowedRoles={['manager', 'stock']}>
            <ShrinkagePage />
          </ProtectedRoute>
        } />
        <Route path="inventory/cycle-count" element={
          <ProtectedRoute allowedRoles={['manager', 'stock']}>
            <CycleCountPage />
          </ProtectedRoute>
        } />
        <Route path="inventory/reports" element={
          <ProtectedRoute allowedRoles={['manager', 'stock']}>
            <InventoryReports />
          </ProtectedRoute>
        } />
        <Route path="inventory/barcode-labels" element={
          <ProtectedRoute allowedRoles={['manager', 'stock']}>
            <BarcodeLabelPage />
          </ProtectedRoute>
        } />
        <Route path="users" element={
          <ProtectedRoute allowedRoles={['manager']}>
            <UserManagement />
          </ProtectedRoute>
        } />
        <Route path="reports" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <Reports />
          </ProtectedRoute>
        } />
        <Route path="comprehensive-report" element={
          <ProtectedRoute allowedRoles={['manager']}>
            <ComprehensiveReport />
          </ProtectedRoute>
        } />
        <Route path="audit-logs" element={
          <ProtectedRoute allowedRoles={['manager']}>
            <AuditLogs />
          </ProtectedRoute>
        } />
        <Route path="promotions" element={
          <ProtectedRoute allowedRoles={['manager']}>
            <Promotions />
          </ProtectedRoute>
        } />
        <Route path="settings" element={
          <ProtectedRoute allowedRoles={['manager']}>
            <SystemSettings />
          </ProtectedRoute>
        } />
        <Route path="alerts" element={
          <ProtectedRoute allowedRoles={['manager', 'stock']}>
            <AlertsCenter />
          </ProtectedRoute>
        } />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <SettingsProvider>
          <BrowserRouter>
            <AppRoutes />
          </BrowserRouter>
        </SettingsProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
