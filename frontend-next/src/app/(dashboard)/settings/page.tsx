'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuthStore } from '@/store/authStore';
import { Settings as SettingsIcon, User, Lock, Building, DollarSign } from 'lucide-react';

export default function SettingsPage() {
  const { user } = useAuthStore();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600 mt-1">Manage your account and system preferences</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Profile Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              Profile Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Full Name</label>
              <Input defaultValue={user?.name} />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Email Address</label>
              <Input defaultValue={user?.email} disabled />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Phone Number</label>
              <Input defaultValue={user?.phone || ''} placeholder="Enter phone number" />
            </div>
            <Button className="w-full">Update Profile</Button>
          </CardContent>
        </Card>

        {/* Password Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="w-5 h-5" />
              Change Password
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Current Password</label>
              <Input type="password" placeholder="Enter current password" />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">New Password</label>
              <Input type="password" placeholder="Enter new password" />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Confirm New Password</label>
              <Input type="password" placeholder="Confirm new password" />
            </div>
            <Button className="w-full">Change Password</Button>
          </CardContent>
        </Card>

        {/* Business Settings - Manager/Admin only */}
        {(user?.role === 'manager' || user?.role === 'admin') && (
          <>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building className="w-5 h-5" />
                  Business Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Business Name</label>
                  <Input defaultValue="SM-RetailCore" />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Business Address</label>
                  <Input placeholder="Enter business address" />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Business Phone</label>
                  <Input placeholder="Enter business phone" />
                </div>
                <Button className="w-full">Update Business Info</Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="w-5 h-5" />
                  Tax & Currency Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">VAT Rate (%)</label>
                  <Input type="number" defaultValue="18" step="0.01" />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Currency</label>
                  <Input defaultValue="UGX" disabled />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Low Stock Alert Level</label>
                  <Input type="number" defaultValue="10" />
                </div>
                <Button className="w-full">Save Settings</Button>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}
