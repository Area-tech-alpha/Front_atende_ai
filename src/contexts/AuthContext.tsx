import React, { createContext, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { API_URL } from '@/config/api';
import { setupHttpClients } from '@/lib/httpClient';

interface User {
  id: string;
  email: string;
  nome_da_instancia: string;
  apikey: string;
  id_instancia: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
}

interface StoredAuthData {
  user: User;
  token: string;
  expiresAt: number | null;
}

type BackendUser = {
  id: number | string;
  email: string;
  nome_da_instancia: string;
  apikey: string;
  id_instancia: string;
};

const AUTH_STORAGE_KEY = 'alpha-auth';
const isBrowser = typeof window !== 'undefined';

const normalizeUser = (data: BackendUser): User => ({
  id: data.id ? data.id.toString() : '',
  email: data.email,
  nome_da_instancia: data.nome_da_instancia,
  apikey: data.apikey,
  id_instancia: data.id_instancia
});

const readStoredAuth = (): StoredAuthData | null => {
  if (!isBrowser) return null;
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as StoredAuthData) : null;
  } catch {
    return null;
  }
};

const writeStoredAuth = (payload: StoredAuthData) => {
  if (!isBrowser) return;
  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(payload));
};

const clearStoredAuth = () => {
  if (!isBrowser) return;
  localStorage.removeItem(AUTH_STORAGE_KEY);
};

const decodeTokenExpiry = (token: string): number | null => {
  try {
    const [, payload] = token.split('.');
    if (!payload) return null;
    const normalized = payload.replace(/-/g, '+').replace(/_/g, '/');
    const decoded = JSON.parse(atob(normalized));
    if (!decoded?.exp) return null;
    return decoded.exp * 1000;
  } catch {
    return null;
  }
};

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const logoutTimerRef = useRef<number | null>(null);

  const clearLogoutTimer = useCallback(() => {
    if (logoutTimerRef.current) {
      window.clearTimeout(logoutTimerRef.current);
      logoutTimerRef.current = null;
    }
  }, []);

  const invalidateSession = useCallback(() => {
    clearLogoutTimer();
    clearStoredAuth();
    setUser(null);
    setToken(null);
  }, [clearLogoutTimer]);

  const scheduleTokenExpiry = useCallback(
    (expiresAt: number | null) => {
      clearLogoutTimer();
      if (!expiresAt || !isBrowser) {
        return;
      }

      const timeout = expiresAt - Date.now();
      if (timeout <= 0) {
        invalidateSession();
        setLoading(false);
        return;
      }

      logoutTimerRef.current = window.setTimeout(() => {
        invalidateSession();
        setLoading(false);
      }, timeout);
    },
    [clearLogoutTimer, invalidateSession]
  );

  const persistSession = useCallback(
    (nextUser: User, authToken: string) => {
      const expiresAt = decodeTokenExpiry(authToken);
      writeStoredAuth({ user: nextUser, token: authToken, expiresAt });
      setUser(nextUser);
      setToken(authToken);
      scheduleTokenExpiry(expiresAt);
    },
    [scheduleTokenExpiry]
  );

  const fetchCurrentUser = useCallback(
    async (authToken: string): Promise<User | null> => {
      try {
        const response = await fetch(`${API_URL}/auth/me`, {
          headers: {
            Authorization: `Bearer ${authToken}`
          }
        });

        if (!response.ok) {
          throw new Error('Token invalid');
        }

        const data = await response.json();
        return normalizeUser(data.user);
      } catch (error) {
        console.error('Failed to validate session:', error);
        return null;
      }
    },
    []
  );

  useEffect(() => {
    const bootstrap = async () => {
      const stored = readStoredAuth();
      if (!stored?.token) {
        setLoading(false);
        return;
      }

      const expiresAt = stored.expiresAt ?? decodeTokenExpiry(stored.token);
      if (!expiresAt || expiresAt <= Date.now()) {
        invalidateSession();
        setLoading(false);
        return;
      }

      const currentUser = await fetchCurrentUser(stored.token);
      if (currentUser) {
        persistSession(currentUser, stored.token);
      } else {
        invalidateSession();
      }
      setLoading(false);
    };

    bootstrap();
  }, [fetchCurrentUser, invalidateSession, persistSession]);

  useEffect(() => {
    setupHttpClients({
      getToken: () => token,
      onUnauthorized: () => {
        invalidateSession();
        setLoading(false);
      }
    });
  }, [invalidateSession, token]);

  const login = useCallback(
    async (email: string, password: string) => {
      setLoading(true);
      try {
        const response = await fetch(`${API_URL}/auth/login`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ email, password })
        });

        const data = await response.json().catch(() => null);
        if (!response.ok || !data?.token || !data?.user) {
          throw new Error(data?.error || 'Credenciais inválidas.');
        }

        persistSession(normalizeUser(data.user), data.token);
      } catch (error) {
        console.error('Login error:', error);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [persistSession]
  );

  const signup = useCallback(
    async (name: string, email: string, password: string) => {
      setLoading(true);
      try {
        const response = await fetch(`${API_URL}/auth/register`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ name, email, password })
        });

        const data = await response.json().catch(() => null);
        if (!response.ok) {
          throw new Error(data?.error || 'Erro ao criar a conta.');
        }

        await login(email, password);
      } catch (error) {
        console.error('Signup error:', error);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [login]
  );

  const logout = useCallback(() => {
    invalidateSession();
    setLoading(false);
  }, [invalidateSession]);

  const value = useMemo(
    () => ({
      user,
      token,
      loading,
      login,
      signup,
      logout
    }),
    [loading, login, logout, signup, token, user]
  );

  return <AuthContext.Provider value={value}>{!loading && children}</AuthContext.Provider>;
};
