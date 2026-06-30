import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import {
  auth,
  login as apiLogin,
  isTokenExpired,
  tokenExpiry,
  AUTH_EXPIRED_EVENT,
  type AuthUser,
} from "../lib/api";

interface AuthState {
  user: AuthUser | null;
  ready: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const Ctx = createContext<AuthState | null>(null);

const USER_KEY = "sg_admin_user";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [ready, setReady] = useState(false);
  const expiryTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const logout = () => {
    if (expiryTimer.current) clearTimeout(expiryTimer.current);
    auth.clear();
    localStorage.removeItem(USER_KEY);
    setUser(null);
  };

  // Schedule a client-side logout the moment the JWT's `exp` passes, so an
  // idle tab kicks the user back to /login instead of silently 401-ing.
  const scheduleExpiry = () => {
    if (expiryTimer.current) clearTimeout(expiryTimer.current);
    const t = auth.get();
    const exp = t ? tokenExpiry(t) : null;
    if (exp == null) return;
    const ms = exp * 1000 - Date.now();
    if (ms <= 0) {
      logout();
      return;
    }
    // setTimeout caps at ~24.8 days; tokens are far shorter so this is safe.
    expiryTimer.current = setTimeout(logout, ms);
  };

  useEffect(() => {
    // Restore session only if a non-expired token is present.
    const raw = localStorage.getItem(USER_KEY);
    if (auth.get() && raw && !isTokenExpired()) {
      try {
        setUser(JSON.parse(raw));
        scheduleExpiry();
      } catch {
        /* ignore */
      }
    } else if (isTokenExpired()) {
      // Stale token left in storage — clear it so we don't flash a logged-in shell.
      auth.clear();
      localStorage.removeItem(USER_KEY);
    }
    setReady(true);

    // A 401 (or a pre-flight expiry check) anywhere in the app drops the session.
    const onExpired = () => logout();
    window.addEventListener(AUTH_EXPIRED_EVENT, onExpired);
    return () => {
      window.removeEventListener(AUTH_EXPIRED_EVENT, onExpired);
      if (expiryTimer.current) clearTimeout(expiryTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const login = async (email: string, password: string) => {
    const u = await apiLogin(email, password);
    localStorage.setItem(USER_KEY, JSON.stringify(u));
    setUser(u);
    scheduleExpiry();
  };

  return <Ctx.Provider value={{ user, ready, login, logout }}>{children}</Ctx.Provider>;
}

export function useAuth() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useAuth must be used within AuthProvider");
  return v;
}
