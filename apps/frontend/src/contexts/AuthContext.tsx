import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { checkAuthHealth, logoutSession } from '../lib/api';

interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
}

interface AuthContextType extends AuthState {
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    isAuthenticated: false,
    isLoading: true,
  });

  const checkAuth = useCallback(async () => {
    try {
      await checkAuthHealth();
      setState({ isAuthenticated: true, isLoading: false });
    } catch {
      setState({ isAuthenticated: false, isLoading: false });
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await logoutSession();
    } catch {
      // Best-effort logout; continue even if the network fails.
    } finally {
      setState({ isAuthenticated: false, isLoading: false });
      window.location.href = '/login';
    }
  }, []);

  useEffect(() => {
    void checkAuth();
  }, [checkAuth]);

  return (
    <AuthContext.Provider value={{ ...state, logout, checkAuth }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
