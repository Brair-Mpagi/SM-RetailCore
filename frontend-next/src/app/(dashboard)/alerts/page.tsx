'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { alertsAPI } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import { Bell, AlertTriangle, AlertCircle, Info, CheckCircle } from 'lucide-react';

export default function AlertsPage() {
  const queryClient = useQueryClient();

  const { data: alerts, isLoading } = useQuery({
    queryKey: ['alerts'],
    queryFn: () => alertsAPI.getAll(),
  });

  const markAsRead = useMutation({
    mutationFn: (id: number) => alertsAPI.markAsRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
    },
  });

  const markAllAsRead = useMutation({
    mutationFn: () => alertsAPI.markAllAsRead(),
    onSuccess: () => {
      toast.success('All alerts marked as read');
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
    },
  });

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'border-red-500 bg-red-50';
      case 'high':
        return 'border-orange-500 bg-orange-50';
      case 'medium':
        return 'border-yellow-500 bg-yellow-50';
      case 'low':
        return 'border-blue-500 bg-blue-50';
      default:
        return 'border-gray-500 bg-gray-50';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <AlertTriangle className="w-5 h-5 text-red-600" />;
      case 'high':
        return <AlertCircle className="w-5 h-5 text-orange-600" />;
      case 'medium':
        return <Info className="w-5 h-5 text-yellow-600" />;
      case 'low':
        return <Info className="w-5 h-5 text-blue-600" />;
      default:
        return <Bell className="w-5 h-5 text-gray-600" />;
    }
  };

  const unreadCount = alerts?.data?.filter((alert: any) => !alert.is_read).length || 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Alerts & Notifications</h1>
          <p className="text-gray-600 mt-1">
            {unreadCount > 0 ? `You have ${unreadCount} unread alerts` : 'All caught up!'}
          </p>
        </div>
        {unreadCount > 0 && (
          <Button onClick={() => markAllAsRead.mutate()} variant="outline">
            <CheckCircle className="w-4 h-4 mr-2" />
            Mark All as Read
          </Button>
        )}
      </div>

      {/* Alerts List */}
      <div className="space-y-4">
        {isLoading ? (
          <Card>
            <CardContent className="p-12 text-center text-gray-500">
              Loading alerts...
            </CardContent>
          </Card>
        ) : !alerts?.data || alerts.data.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Bell className="w-16 h-16 mx-auto mb-4 text-gray-400" />
              <p className="text-gray-500">No alerts at this time</p>
            </CardContent>
          </Card>
        ) : (
          alerts.data.map((alert: any) => (
            <Card
              key={alert.id}
              className={`${getSeverityColor(alert.severity)} border-l-4 ${
                !alert.is_read ? 'shadow-md' : 'opacity-75'
              }`}
            >
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 mt-1">{getSeverityIcon(alert.severity)}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900">{alert.title}</h3>
                        <p className="text-sm text-gray-600 mt-1">{alert.message}</p>
                        <div className="flex items-center gap-4 mt-3">
                          <span className="text-xs text-gray-500">{formatDate(alert.created_at)}</span>
                          <span className="px-2 py-1 text-xs font-medium rounded-full bg-white border border-gray-200 capitalize">
                            {alert.type.replace('_', ' ')}
                          </span>
                          <span className="px-2 py-1 text-xs font-medium rounded-full bg-white border border-gray-200 capitalize">
                            {alert.severity}
                          </span>
                        </div>
                      </div>
                      {!alert.is_read && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => markAsRead.mutate(alert.id)}
                        >
                          Mark as Read
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
