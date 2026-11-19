'use client';

import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { reportsAPI, transactionsAPI, productsAPI, alertsAPI } from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/utils';
import {
  DollarSign,
  ShoppingCart,
  Package,
  TrendingUp,
  AlertTriangle,
} from 'lucide-react';

export default function DashboardPage() {
  const today = new Date().toISOString().split('T')[0];

  const { data: salesSummary } = useQuery({
    queryKey: ['sales-summary', today],
    queryFn: () => reportsAPI.salesSummary({ startDate: today, endDate: today }),
  });

  const { data: recentTransactions } = useQuery({
    queryKey: ['recent-transactions'],
    queryFn: () => transactionsAPI.getAll({ limit: 5 }),
  });

  const { data: lowStockProducts } = useQuery({
    queryKey: ['low-stock'],
    queryFn: () => productsAPI.lowStock(),
  });

  const { data: alerts } = useQuery({
    queryKey: ['alerts'],
    queryFn: () => alertsAPI.getAll({ limit: 5 }),
  });

  const stats = [
    {
      name: 'Today\'s Sales',
      value: formatCurrency(salesSummary?.data?.total_sales || 0),
      icon: DollarSign,
      color: 'bg-green-500',
    },
    {
      name: 'Transactions',
      value: salesSummary?.data?.total_transactions || 0,
      icon: ShoppingCart,
      color: 'bg-blue-500',
    },
    {
      name: 'Low Stock Items',
      value: lowStockProducts?.data?.length || 0,
      icon: Package,
      color: 'bg-orange-500',
    },
    {
      name: 'Avg. Transaction',
      value: formatCurrency(salesSummary?.data?.average_transaction || 0),
      icon: TrendingUp,
      color: 'bg-purple-500',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-1">Welcome back! Here's what's happening today.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.name}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">{stat.name}</p>
                    <p className="text-2xl font-bold text-gray-900 mt-2">{stat.value}</p>
                  </div>
                  <div className={`w-12 h-12 rounded-xl ${stat.color} flex items-center justify-center`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Transactions */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Transactions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentTransactions?.data?.data?.map((transaction: any) => (
                <div key={transaction.id} className="flex items-center justify-between py-3 border-b last:border-0">
                  <div>
                    <p className="font-medium text-gray-900">{transaction.receipt_number}</p>
                    <p className="text-sm text-gray-600">{formatDate(transaction.created_at)}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">
                      {formatCurrency(transaction.total_amount)}
                    </p>
                    <p className="text-sm text-gray-600 capitalize">{transaction.payment_method}</p>
                  </div>
                </div>
              ))}
              {(!recentTransactions?.data?.data || recentTransactions.data.data.length === 0) && (
                <p className="text-center text-gray-500 py-8">No recent transactions</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Alerts */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-orange-500" />
              Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {lowStockProducts?.data?.slice(0, 5).map((product: any) => (
                <div key={product.id} className="flex items-start gap-3 py-3 border-b last:border-0">
                  <div className="w-2 h-2 bg-orange-500 rounded-full mt-2"></div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{product.name}</p>
                    <p className="text-sm text-gray-600">
                      Low stock: {product.inventory?.quantity || 0} units remaining
                    </p>
                  </div>
                </div>
              ))}
              {(!lowStockProducts?.data || lowStockProducts.data.length === 0) && (
                <p className="text-center text-gray-500 py-8">No alerts</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
