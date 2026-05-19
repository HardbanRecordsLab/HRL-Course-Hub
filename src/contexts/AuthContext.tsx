import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';

export type UserRole = 'admin' | 'student' | 'manager' | 'viewer' | string;

interface User {
  id: string;
  userId: string;
  email: string;
  name: string;
  full_name: string;
  avatar?: string;
  role: UserRole;
  plan: 'free' | 'starter' | 'pro' | 'label';
  tier: string;
  credits: number;
  is_premium: boolean;
  pmp_level?: string;
  expiresAt?: string;
}

interface Session {
  user: User;
  token: string;
}

interface AuthContextValue {
  user: User | null;
  session: Session | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  loading: boolean;
  error: string | null;
  login: (token?: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshCredits: () => Promise<void>;
}

const API_URL = import.meta.env.VITE_HRL_API_URL || 'https://course-hub.hardbanrecordslab.online';
const ACCESS_MANAGER_URL = import.meta.env.VITE_ACCESS_MANAGER_URL || 'https://hrl-access.hardbanrecordslab.online';
const WP_LOGIN_URL = import.meta.env.VITE_WP_LOGIN_URL || 'https://hardbanrecordslab.online/login';

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function getTokenFromUrl(): string | null {
  const params = new URLSearchParams(window.location.search);
  const token = params.get('token');
  if (token) {
    localStorage.setItem('hrl_jwt_token', token);
    const url = new URL(window.location.href);
    url.searchParams.delete('token');
    window.history.replaceState({}, '', url.toString());
    return token;
  }
  return null;
}

function getStoredToken(): string | null {
  return localStorage.getItem('hrl_jwt_token');
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(getStoredToken());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUserProfile = useCallback(async (authToken: string): Promise<User | null> => {
    try {
      const resp = await fetch(`${ACCESS_MANAGER_URL}/api/auth/verify`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${authToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: authToken }),
      });
      if (resp.ok) {
        const data = await resp.json();
        const profileResp = await fetch(`${API_URL}/api/auth/profile?email=${encodeURIComponent(data.email || data.user_email || '')}`, {
          headers: { 'Authorization': `Bearer ${authToken}` },
        });
        if (profileResp.ok) {
          const profile = await profileResp.json();
          return {
            id: profile.id || 'local-admin',
            userId: profile.id || 'local-admin',
            email: profile.email || 'local@hardbanrecordslab.online',
            name: profile.name || profile.email?.split('@')[0] || 'Admin',
            full_name: profile.name || profile.email?.split('@')[0] || 'Admin',
            role: profile.role || (profile.is_superuser ? 'admin' : 'student'),
            plan: profile.tier || 'label',
            tier: profile.tier || 'label',
            credits: profile.credits || 0,
            is_premium: profile.is_premium || false,
          };
        }
      }
    } catch {
      // Fall through to local fallback
    }
    return null;
  }, []);

  useEffect(() => {
    const init = async () => {
      const urlToken = getTokenFromUrl();
      const storedToken = urlToken || getStoredToken();

      if (!storedToken) {
        setIsLoading(false);
        return;
      }

      setToken(storedToken);
      const userData = await fetchUserProfile(storedToken);
      if (userData) {
        setUser(userData);
      }
      setIsLoading(false);
    };
    init();
  }, [fetchUserProfile]);

  const login = async (loginToken?: string) => {
    const authToken = loginToken || getTokenFromUrl() || getStoredToken();
    if (authToken) {
      setToken(authToken);
      localStorage.setItem('hrl_jwt_token', authToken);
      const userData = await fetchUserProfile(authToken);
      if (userData) {
        setUser(userData);
        return;
      }
    }
    window.location.href = WP_LOGIN_URL;
  };

  const logout = async () => {
    localStorage.removeItem('hrl_jwt_token');
    setToken(null);
    setUser(null);
    setError(null);
    try {
      await fetch(`${ACCESS_MANAGER_URL}/api/auth/logout`, { method: 'POST' });
    } catch {
      // ignore
    }
  };

  const refreshCredits = async () => {
    if (!token) return;
    const userData = await fetchUserProfile(token);
    if (userData) setUser(userData);
  };

  const session = token && user ? { user, token } : null;
  const isAuthenticated = Boolean(session);

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        token,
        isAuthenticated,
        isLoading,
        loading: isLoading,
        error,
        login,
        logout,
        refreshCredits,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextValue => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
