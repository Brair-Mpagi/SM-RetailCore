import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import {
  LayoutDashboard, ShoppingCart, Package, BarChart2, Users,
  FileText, Bell, Settings, LogOut, Tag, Activity,
  ChevronLeft, ChevronRight, Sun, Moon, AlertCircle,
  CreditCard, TrendingUp, Menu, X, ShoppingBag,
  Plus, Truck, ClipboardList, TrendingDown, RotateCcw, BarChart3, Tags, Barcode
} from 'lucide-react';
import { alertsAPI } from '../../services/api';

const ROLE_COLORS = {
  admin:   'bg-red-500/15 text-red-500 dark:text-red-400 border-red-500/30',
  manager: 'bg-purple-500/15 text-purple-600 dark:text-purple-400 border-purple-500/30',
  cashier: 'bg-brand-500/15 text-brand-600 dark:text-brand-400 border-brand-500/30',
  stock:   'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30',
};

function NavItem({ to, icon: Icon, label, collapsed, onClick, subItems, state }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!collapsed && (location.pathname === to || location.pathname.startsWith(to + '/') || (subItems && subItems.some(item => location.pathname === item.to || location.pathname.startsWith(item.to + '/'))))) {
      setIsOpen(true);
    }
  }, [location.pathname, collapsed, to, subItems]);

  const isActive = location.pathname === to || (subItems ? false : location.pathname.startsWith(to + '/'));

  const handleClick = (e) => {
    if (subItems && !collapsed) {
      setIsOpen(true);
    }
    if (onClick) onClick();
    if (to) navigate(to, { state });
  };

  const handleToggle = (e) => {
    e.stopPropagation();
    setIsOpen(!isOpen);
  };

  return (
    <div className="w-full">
      <div
        onClick={handleClick}
        title={collapsed ? label : undefined}
        className={`w-full text-left flex items-center cursor-pointer ${isActive ? 'nav-item-active' : 'nav-item'} ${collapsed ? 'justify-center px-0 py-2.5' : ''}`}
      >
        <Icon size={18} className="flex-shrink-0" />
        {!collapsed && <span className="flex-1">{label}</span>}
        {!collapsed && subItems && (
          <div 
            onClick={handleToggle} 
            className="p-1 -mr-1 rounded-md hover:bg-black/5 dark:hover:bg-white/10 transition-colors flex items-center justify-center"
          >
            <ChevronRight size={14} className={`transition-transform text-muted ${isOpen ? 'rotate-90' : ''}`} />
          </div>
        )}
      </div>
      {!collapsed && subItems && isOpen && (
        <div className="pl-9 pr-2 py-1 space-y-0.5">
          {subItems.map(subItem => {
            const SubIcon = subItem.icon;
            // For subitems with state (like the Products tab), checking path alone isn't enough, but it's okay for styling
            const isSubActive = location.pathname === subItem.to || location.pathname.startsWith(subItem.to + '/');
            return (
              <button
                key={subItem.label + subItem.to}
                onClick={() => {
                  if (onClick) onClick();
                  if (subItem.to) navigate(subItem.to, { state: subItem.state });
                }}
                className={`w-full text-left flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm transition-colors ${isSubActive ? 'bg-brand-500/10 text-brand-600 dark:text-brand-400 font-medium' : 'text-muted hover:text-primary hover:bg-surface-2'}`}
              >
                {SubIcon && <SubIcon size={14} />}
                <span>{subItem.label}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function AppShell() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme, isDark } = useTheme();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [time, setTime] = useState(new Date());
  const [alerts, setAlerts] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        const response = await alertsAPI.getAll({ is_read: 0 });
        setAlerts(response.data.data || []);
      } catch (error) {
        console.error('Failed to fetch alerts:', error);
      }
    };
    fetchAlerts();
    const interval = setInterval(fetchAlerts, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, []);

  const unreadAlerts = alerts.length;
  const criticalAlerts = alerts.filter(a => a.severity === 'critical').length;

  const timeStr = time.toLocaleTimeString('en-GB', {
    hour: '2-digit', minute: '2-digit', second: '2-digit',
    timeZone: 'Africa/Nairobi'
  });

  // Role-based nav items
  const navSections = [];

  if (user?.role === 'admin' || user?.role === 'manager') {
    navSections.push({
      label: 'Dashboards',
      items: [
        ...(user.role === 'admin' ? [{ to: '/dashboard/admin', icon: LayoutDashboard, label: 'Admin Dashboard' }] : []),
        { to: '/dashboard/manager', icon: TrendingUp, label: 'Analytics' },
      ]
    });
  }

  navSections.push({
    label: 'Operations',
    items: [
      ...(['admin','manager','cashier'].includes(user?.role) ? [{ to: '/dashboard/pos', icon: ShoppingCart, label: 'Point of Sale' }] : []),
      ...(['admin','manager','cashier'].includes(user?.role) ? [{ to: '/dashboard/transactions', icon: ShoppingBag, label: 'Transactions' }] : []),
      ...(user?.role === 'stock' ? [{ to: '/dashboard/stock', icon: BarChart2, label: 'Stock Analytics' }] : []),
      ...(['admin','manager','stock'].includes(user?.role) ? [{ 
        to: '/dashboard/inventory', 
        icon: Package, 
        label: 'Inventory',
        subItems: [
          { label: 'Products', icon: Package, to: '/dashboard/inventory', state: { tab: 'Products' } },
          { label: 'Categories', icon: Tags, to: '/dashboard/inventory/categories' },
          { label: 'Suppliers', icon: Truck, to: '/dashboard/inventory/suppliers' },
          { label: 'Add Product', icon: Plus, to: '/dashboard/inventory/add-product' },
          { label: 'Purchase Orders', icon: Truck, to: '/dashboard/inventory/purchase-order' },
          { label: 'Purchase Request', icon: ClipboardList, to: '/dashboard/inventory/purchase-request' },
          { label: 'Stocktake', icon: ClipboardList, to: '/dashboard/inventory/cycle-count' },
          { label: 'Shrinkage', icon: TrendingDown, to: '/dashboard/inventory/shrinkage' },
          { label: 'Shelf Tags', icon: Tags, to: '/dashboard/inventory/print-tags' },
          { label: 'Barcode Labels', icon: Barcode, to: '/dashboard/inventory/barcode-labels' }
        ]
      }] : []),
      ...(['admin','manager'].includes(user?.role) ? [{ to: '/dashboard/promotions', icon: Tag, label: 'Promotions' }] : []),
    ]
  });

  if (['admin', 'manager', 'stock'].includes(user?.role)) {
    navSections.push({
      label: 'Reporting',
      items: [
        ...(user?.role === 'manager' ? [{ to: '/dashboard/comprehensive-report', icon: FileText, label: 'Comprehensive Report' }] : []),
        ...(user?.role === 'admin' ? [{ to: '/dashboard/reports', icon: FileText, label: 'Financial Reports' }] : []),
        ...(['admin', 'stock'].includes(user?.role) ? [{ to: '/dashboard/inventory/reports', icon: FileText, label: 'Inventory Reports' }] : []),
        ...(['admin', 'manager'].includes(user?.role) ? [{ to: '/dashboard/audit-logs', icon: Activity, label: 'Audit Logs' }] : []),
      ]
    });
  }

  if (user?.role === 'manager') {
    navSections.push({
      label: 'System',
      items: [
        { to: '/dashboard/alerts', icon: Bell, label: 'Alerts', badge: unreadAlerts },
        { to: '/dashboard/users', icon: Users, label: 'Users' },
        { to: '/dashboard/settings', icon: Settings, label: 'Settings' },
      ]
    });
  }

  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Logo / Title */}
      <div className={`px-4 py-4 flex items-center gap-3 border-b border-theme flex-shrink-0 ${collapsed ? 'justify-center' : ''}`}>
        <div className="w-9 h-9 rounded-xl bg-brand-600 flex items-center justify-center flex-shrink-0 shadow-lg shadow-brand-900/40">
          <ShoppingCart size={18} className="text-white" />
        </div>
        {!collapsed && (
          <div>
            <p className="font-bold text-sm text-primary leading-tight">A&B Supermarket</p>
            <p className="text-xs text-muted">RSTMS v2.0</p>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
        {navSections.map(section => (
          <div key={section.label}>
            {!collapsed && <p className="sidebar-section-label">{section.label}</p>}
            {section.items.map(item => (
              <div key={item.to} className="relative">
                <NavItem
                  to={item.to}
                  icon={item.icon}
                  label={item.label}
                  collapsed={collapsed}
                  onClick={() => setMobileOpen(false)}
                  subItems={item.subItems}
                />
                {item.badge > 0 && (
                  <span className={`absolute top-1.5 right-2 text-[10px] font-bold px-1.5 py-0.5 rounded-full
                    ${criticalAlerts > 0 ? 'bg-red-500 text-white' : 'bg-amber-500 text-white'}`}>
                    {item.badge}
                  </span>
                )}
              </div>
            ))}
          </div>
        ))}
      </nav>

      {/* User footer */}
      <div className={`px-3 py-3 border-t border-theme flex-shrink-0 space-y-2`}>
        {/* Role badge */}
        {!collapsed && (
          <div className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl border ${ROLE_COLORS[user?.role]}`}>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold truncate">{user?.name}</p>
              <p className="text-[10px] font-medium capitalize opacity-70">{user?.role}</p>
            </div>
          </div>
        )}
        <button onClick={logout}
          className={`nav-item w-full text-red-500 dark:text-red-400 hover:bg-red-500/10 ${collapsed ? 'justify-center' : ''}`}>
          <LogOut size={16} className="flex-shrink-0" />
          {!collapsed && <span>Sign Out</span>}
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen overflow-hidden">
      {/* ── Desktop Sidebar ── */}
      <aside className={`sidebar-bg hidden md:flex flex-col flex-shrink-0 transition-all duration-300
        ${collapsed ? 'w-16' : 'w-60'}`}>
        {sidebarContent}
      </aside>

      {/* ── Mobile Sidebar Overlay ── */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-40 flex">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <aside className="sidebar-bg relative z-50 w-72 flex flex-col h-full shadow-2xl animate-slide-in">
            {sidebarContent}
          </aside>
        </div>
      )}

      {/* ── Main Area ── */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Topbar */}
        <header className="topbar flex-shrink-0">
          {/* Mobile menu */}
          <button onClick={() => setMobileOpen(true)} className="md:hidden btn-secondary p-2">
            <Menu size={18} />
          </button>

          {/* Collapse desktop sidebar */}
          <button onClick={() => setCollapsed(c => !c)}
            className="hidden md:flex btn-secondary p-2">
            {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>

          <div className="flex-1" />

          {/* EAT Clock */}
          <div className="hidden sm:block text-xs font-mono text-muted bg-surface-2
            border border-theme px-3 py-1.5 rounded-xl">
            {timeStr} EAT
          </div>

          {/* Alert bell */}
          <button onClick={() => navigate('/dashboard/alerts')}
            className="relative btn-secondary p-2">
            <Bell size={18} />
            {unreadAlerts > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[9px]
                font-bold rounded-full w-4 h-4 flex items-center justify-center">
                {unreadAlerts > 9 ? '9+' : unreadAlerts}
              </span>
            )}
          </button>

          {/* Theme toggle */}
          <button onClick={toggleTheme}
            className="btn-secondary p-2"
            title={`Switch to ${isDark ? 'light' : 'dark'} mode`}>
            {isDark ? <Sun size={18} className="text-amber-400" /> : <Moon size={18} className="text-indigo-500" />}
          </button>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
