"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";

const TOKEN_KEY = "candor_access_token";

type AuthContextValue = {
  token: string | null;
  isLoading: boolean;
  login: (token: string) => void;
  logout: () => void;
  isAuthenticated: boolean;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setTokenState] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    try {
      const stored = typeof window !== "undefined" ? localStorage.getItem(TOKEN_KEY) : null;
      setTokenState(stored);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const login = useCallback((newToken: string) => {
    setTokenState(newToken);
    if (typeof window !== "undefined") {
      localStorage.setItem(TOKEN_KEY, newToken);
    }
  }, []);

  const logout = useCallback(() => {
    setTokenState(null);
    if (typeof window !== "undefined") {
      localStorage.removeItem(TOKEN_KEY);
    }
  }, []);

  const value: AuthContextValue = {
    token,
    isLoading,
    login,
    logout,
    isAuthenticated: !!token,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
}
