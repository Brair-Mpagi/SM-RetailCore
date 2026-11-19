import { create } from 'zustand';
import { User } from '@/types';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  setUser: (user: User | null) => void;
  setTokens: (accessToken: string, refreshToken: string) => void;
  logout: () => void;
  isAuthenticated: () => boolean;
  hasRole: (roles: string | string[]) => boolean;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  accessToken: null,
  refreshToken: null,

  setUser: (user) => {
    console.log('Setting user in store:', user?.name);
    set({ user });
    if (typeof window !== 'undefined' && user) {
      localStorage.setItem('user', JSON.stringify(user));
    }
  },

  setTokens: (accessToken, refreshToken) => {
    console.log('Setting tokens in store...');
    set({ accessToken, refreshToken });
    if (typeof window !== 'undefined') {
      localStorage.setItem('access_token', accessToken);
      localStorage.setItem('refresh_token', refreshToken);
      console.log('Tokens saved to localStorage');
    }
  },

  logout: () => {
    set({ user: null, accessToken: null, refreshToken: null });
    if (typeof window !== 'undefined') {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('user');
    }
  },

  isAuthenticated: () => {
    const state = get();
    return !!state.user && !!state.accessToken;
  },

  hasRole: (roles) => {
    const state = get();
    if (!state.user) return false;
    const roleArray = Array.isArray(roles) ? roles : [roles];
    return roleArray.includes(state.user.role);
  },
}));
