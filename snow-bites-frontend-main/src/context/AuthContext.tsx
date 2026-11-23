import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { getMe, loginRequest, registerRequest, type ApiUser } from "@/lib/api";

interface AuthContextValue {
  token: string | null;
  user: ApiUser | null;
  isReady: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  login: (email: string, password: string) => Promise<ApiUser>;
  register: (fullName: string, email: string, password: string, phone?: string) => Promise<ApiUser>;
  refreshUser: () => Promise<void>;
  setAuthenticatedUser: (user: ApiUser) => void;
  logout: () => void;
}

const STORAGE_KEY = "snow-bites-auth";
const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(STORAGE_KEY));
  const [user, setUser] = useState<ApiUser | null>(null);
  const [isReady, setIsReady] = useState(false);

  const refreshUser = async () => {
    if (!token) {
      setUser(null);
      setIsReady(true);
      return;
    }

    try {
      const data = await getMe(token);
      setUser(data.user);
    } catch {
      localStorage.removeItem(STORAGE_KEY);
      setToken(null);
      setUser(null);
    } finally {
      setIsReady(true);
    }
  };

  useEffect(() => {
    let active = true;

    async function loadUser() {
      if (!token) {
        if (active) {
          setUser(null);
          setIsReady(true);
        }
        return;
      }

      try {
        const data = await getMe(token);
        if (active) {
          setUser(data.user);
        }
      } catch {
        localStorage.removeItem(STORAGE_KEY);
        if (active) {
          setToken(null);
          setUser(null);
        }
      } finally {
        if (active) {
          setIsReady(true);
        }
      }
    }

    void loadUser();

    return () => {
      active = false;
    };
  }, [token]);

  const value = useMemo<AuthContextValue>(() => ({
    token,
    user,
    isReady,
    isAuthenticated: Boolean(token && user),
    isAdmin: user?.role === "ADMIN",
    async login(email, password) {
      const data = await loginRequest(email, password);
      localStorage.setItem(STORAGE_KEY, data.token);
      setToken(data.token);
      setUser(data.user);
      setIsReady(true);
      return data.user;
    },
    async register(fullName, email, password, phone) {
      const data = await registerRequest(fullName, email, password, phone);
      localStorage.setItem(STORAGE_KEY, data.token);
      setToken(data.token);
      setUser(data.user);
      setIsReady(true);
      return data.user;
    },
    async refreshUser() {
      await refreshUser();
    },
    setAuthenticatedUser(nextUser) {
      setUser(nextUser);
      setIsReady(true);
    },
    logout() {
      localStorage.removeItem(STORAGE_KEY);
      setToken(null);
      setUser(null);
      setIsReady(true);
    },
  }), [token, user, isReady]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);

  if (!value) {
    throw new Error("useAuth must be used inside AuthProvider");
  }

  return value;
}