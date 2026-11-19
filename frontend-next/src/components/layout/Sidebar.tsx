'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/authStore';
import { Button } from '@/components/ui/button';
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Users,
  FileText,
  Settings,
  LogOut,
  TrendingUp,
  Bell,
  ClipboardList,
  Truck,
  Tag,
  Archive,
} from 'lucide-react';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, roles: ['manager', 'admin'] },
  { name: 'POS', href: '/pos', icon: ShoppingCart, roles: ['cashier', 'manager', 'admin'] },
  { name: 'Products', href: '/products', icon: Package, roles: ['manager', 'stock', 'admin'] },
  { name: 'Inventory', href: '/inventory', icon: Archive, roles: ['manager', 'stock', 'admin'] },
  { name: 'Transactions', href: '/transactions', icon: FileText, roles: ['manager', 'admin'] },
  { name: 'Reports', href: '/reports', icon: TrendingUp, roles: ['manager', 'admin'] },
  { name: 'Suppliers', href: '/suppliers', icon: Truck, roles: ['manager', 'admin'] },
  { name: 'Purchase Orders', href: '/purchase-orders', icon: ClipboardList, roles: ['manager', 'stock', 'admin'] },
  { name: 'Promotions', href: '/promotions', icon: Tag, roles: ['manager', 'admin'] },
  { name: 'Users', href: '/users', icon: Users, roles: ['manager', 'admin'] },
  { name: 'Alerts', href: '/alerts', icon: Bell, roles: ['manager', 'stock', 'admin'] },
  { name: 'Settings', href: '/settings', icon: Settings, roles: ['manager', 'admin'] },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuthStore();

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const filteredNavigation = navigation.filter((item) =>
    user?.role ? item.roles.includes(user.role) : false
  );

  return (
    <div className="flex flex-col h-full bg-gray-900 text-white w-64">
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-5 border-b border-gray-800">
        <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
          <ShoppingCart className="w-6 h-6" />
        </div>
        <div>
          <h1 className="font-bold text-lg">SM-RetailCore</h1>
          <p className="text-xs text-gray-400">POS System</p>
        </div>
      </div>

      {/* User Info */}
      <div className="px-6 py-4 border-b border-gray-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center font-semibold">
            {user?.name.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm truncate">{user?.name}</p>
            <p className="text-xs text-gray-400 capitalize">{user?.role}</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {filteredNavigation.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
          const Icon = item.icon;

          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                isActive
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-300 hover:bg-gray-800 hover:text-white'
              )}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="p-3 border-t border-gray-800">
        <Button
          onClick={handleLogout}
          variant="ghost"
          className="w-full justify-start text-gray-300 hover:text-white hover:bg-gray-800"
        >
          <LogOut className="w-5 h-5 mr-3" />
          Logout
        </Button>
      </div>
    </div>
  );
}
