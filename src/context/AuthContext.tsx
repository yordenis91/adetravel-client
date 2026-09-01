import React, { createContext, useContext, useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { auth, AuthUser } from "@/lib/auth";

interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (fullName: string, email: string, password: string) => Promise<void>;
  logout: () => void;

  // Verificación de permisos granulares (ver src/config/permissions.ts en el backend)
  hasPermission: (permission: string) => boolean;
  hasAnyPermission: (permissions: string[]) => boolean;
  hasAllPermissions: (permissions: string[]) => boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

const TOKEN_KEY = "ade_token";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const queryClient = useQueryClient();

  useEffect(() => {
    const savedToken = localStorage.getItem(TOKEN_KEY);
    if (savedToken) {
      setToken(savedToken);
      fetchMe();
    } else {
      setIsLoading(false);
    }
  }, []);

  async function fetchMe() {
    try {
      const currentUser = await auth.me();
      setUser(currentUser);
    } catch {
      localStorage.removeItem(TOKEN_KEY);
      setToken(null);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }

  async function login(email: string, password: string) {
    setIsLoading(true);
    try {
      const { token: newToken, user: newUser } = await auth.login({ email, password });
      setToken(newToken);
      setUser(newUser);
    } finally {
      setIsLoading(false);
    }
  }

  async function register(fullName: string, email: string, password: string) {
    setIsLoading(true);
    try {
      const { token: newToken, user: newUser } = await auth.register({ fullName, email, password });
      setToken(newToken);
      setUser(newUser);
    } finally {
      setIsLoading(false);
    }
  }

  function logout() {
    // 1) remove token from storage
    auth.logout();

    // 2) reset local React state immediately
    setToken(null);
    setUser(null);
    setIsLoading(false);

    // 3) clear/react-query cache to avoid stale authenticated data
    try {
      queryClient.cancelQueries();
      queryClient.clear();
    } catch (e) {
      // noop - safe best-effort
    }
  }

  function hasPermission(permission: string): boolean {
    return !!user?.permissions?.includes(permission);
  }

  function hasAnyPermission(permissions: string[]): boolean {
    return permissions.some((p) => hasPermission(p));
  }

  function hasAllPermissions(permissions: string[]): boolean {
    return permissions.every((p) => hasPermission(p));
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        isAuthenticated: !!user,
        login,
        register,
        logout,
        hasPermission,
        hasAnyPermission,
        hasAllPermissions,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth debe usarse dentro de AuthProvider");
  return ctx;
}
