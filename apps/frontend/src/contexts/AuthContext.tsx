import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import { useQueryClient } from "@tanstack/react-query";
import { getMe, logoutSession } from "../lib/api";
import type { UserProfile } from "../lib/types";
import {
  clearSessionHint,
  readInitialSessionHint,
  setSessionHint,
} from "../lib/session";

type AuthStatus = "unknown" | "authenticated" | "unauthenticated";

interface AuthState {
  status: AuthStatus;
  hasSession: boolean;
  isAuthenticated: boolean;
  isLoading: boolean;
  user: UserProfile | null;
}

interface AuthContextType extends AuthState {
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [state, setState] = useState<AuthState>(() => {
    const hasSession = readInitialSessionHint();

    return {
      status: "unknown",
      hasSession,
      isAuthenticated: false,
      isLoading: true,
      user: null,
    };
  });

  // GET /auth/me is both the session check and the profile request, so one
  // call does the job of the old /auth/health + /auth/me pair.
  const checkAuth = useCallback(async () => {
    try {
      const user = await getMe();
      setSessionHint();

      setState({
        status: "authenticated",
        hasSession: true,
        isAuthenticated: true,
        isLoading: false,
        user,
      });
    } catch {
      clearSessionHint();
      setState({
        status: "unauthenticated",
        hasSession: false,
        isAuthenticated: false,
        isLoading: false,
        user: null,
      });
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await logoutSession();
    } catch {
      // Best-effort logout; continue even if the network fails.
    } finally {
      clearSessionHint();
      // Drop cached project and deployment data, it belongs to the old user.
      queryClient.clear();
      setState({
        status: "unauthenticated",
        hasSession: false,
        isAuthenticated: false,
        isLoading: false,
        user: null,
      });
      window.location.href = "/";
    }
  }, [queryClient]);

  useEffect(() => {
    void checkAuth();
  }, [checkAuth]);

  // The API client reports an expired session with this event instead of
  // redirecting, so the router stays in charge of where the user lands.
  useEffect(() => {
    const handleUnauthorized = () => {
      queryClient.clear();
      setState({
        status: "unauthenticated",
        hasSession: false,
        isAuthenticated: false,
        isLoading: false,
        user: null,
      });
    };

    window.addEventListener("auth:unauthorized", handleUnauthorized);
    return () =>
      window.removeEventListener("auth:unauthorized", handleUnauthorized);
  }, [queryClient]);

  return (
    <AuthContext.Provider value={{ ...state, logout, checkAuth }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
