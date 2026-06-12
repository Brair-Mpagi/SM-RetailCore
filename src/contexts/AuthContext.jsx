import React, { createContext, useContext, useState, useCallback } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('rstms_user');
    if (!saved) return null;
    
    let parsedUser = JSON.parse(saved);
    // Legacy mapping: map old explicit 'admin' sessions to the consolidated 'manager' role
    if (parsedUser && parsedUser.role === 'admin') {
      parsedUser.role = 'manager';
      localStorage.setItem('rstms_user', JSON.stringify(parsedUser));
    }
    return parsedUser;
  });

  const login = useCallback(async (email, password) => {
    try {
      const response = await authAPI.login(email, password);
      // Backend returns { data: { user, token, refreshToken } }
      // Axios extracts the response.data, so we need response.data.data
      const { user: userData, token, refreshToken } = response.data.data || response.data;
      
      localStorage.setItem('rstms_user', JSON.stringify(userData));
      localStorage.setItem('rstms_token', token);
      if (refreshToken) {
        localStorage.setItem('rstms_refresh_token', refreshToken);
      }
      
      setUser(userData);
      return { success: true };
    } catch (error) {
      console.error('Login failed:', error);
      return { 
        success: false, 
        error: error.response?.data?.error || 'Login failed' 
      };
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await authAPI.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('rstms_user');
      localStorage.removeItem('rstms_token');
      localStorage.removeItem('rstms_refresh_token');
      setUser(null);
    }
  }, []);

  const hasPermission = useCallback((action) => {
    if (!user) return false;
    const permissions = {
      manager: ['*'], // Merged admin + manager privileges
      cashier: ['record_sale', 'view_own_shift', 'manage_own_session'],
      stock: ['adjust_inventory', 'view_alerts', 'stocktake', 'receive_po'],
    };
    const perms = permissions[user.role] || [];
    return perms.includes('*') || perms.includes(action);
  }, [user]);

  return (
    <AuthContext.Provider value={{ user, login, logout, hasPermission }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
