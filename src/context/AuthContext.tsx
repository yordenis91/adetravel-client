import React, { createContext, useContext, useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { auth, AuthUser } from "@/lib/auth";
import { ApiError, setApiEventHandlers } from "@/lib/api";

interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (fullName: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  /** Vuelve a pedir el usuario y sus permisos al servidor (p.ej. tras un 403 inesperado). */
  refreshUser: () => Promise<void>;
  /** Sustituye el token de sesión (p.ej. el nuevo que devuelve la API al cambiar la contraseña). */
  replaceToken: (token: string) => void;

  // Verificación de permisos granulares (ver src/config/permissions.ts en el backend)
  hasPermission: (permission: string) => boolean;
  hasAnyPermission: (permissions: string[]) => boolean;
  hasAllPermissions: (permissions: string[]) => boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

const TOKEN_KEY = "ade_token";

/** Fallos que se arreglan solos esperando: límite de peticiones (429), error del servidor o de red. */
export function isTransient(error: unknown): boolean {
  if (!(error instanceof ApiError)) return true;
  return error.status === 429 || error.status >= 500;
}

/**
 * Reintenta `fn` ante fallos transitorios. Al recargar la página, un 429 en /auth/me dejaba al
 * usuario sin sesión cargada y la ruta protegida lo mandaba al login (fase 3, defecto D2).
 */
export async function withRetry<T>(fn: () => Promise<T>, delays: number[] = [1000, 3000, 7000]): Promise<T> {
  for (let attempt = 0; ; attempt++) {
    try {
      return await fn();
    } catch (error) {
      if (attempt >= delays.length || !isTransient(error)) throw error;
      await new Promise((resolve) => setTimeout(resolve, delays[attempt]));
    }
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const queryClient = useQueryClient();

  // Respuestas de la API que afectan a la sesión, venga la petición de donde venga:
  //  - 401 (token vencido/inválido, usuario borrado): cerrar sesión.
  //  - 403 USER_INACTIVE (cuenta desactivada con la sesión abierta): cerrar sesión.
  //  - 403 FORBIDDEN (falta un permiso): avisar y resincronizar los permisos, por si
  //    un administrador los cambió mientras la sesión seguía abierta. Con antirrebote
  //    para que varias peticiones fallidas a la vez no llenen la pantalla de avisos.
  useEffect(() => {
    let lastForbiddenAt = 0;
    let lastRateLimitedAt = 0;
    setApiEventHandlers({
      onRateLimited: () => {
        const now = Date.now();
        if (now - lastRateLimitedAt < 30_000) return;
        lastRateLimitedAt = now;
        toast.warning("Demasiadas peticiones seguidas", {
          description: "Espera unos segundos y vuelve a intentarlo. Tu sesión sigue abierta.",
        });
      },
      onUnauthorized: () => {
        if (!localStorage.getItem(TOKEN_KEY)) return;
        logout();
        toast.error("Tu sesión ha expirado", { description: "Inicia sesión nuevamente para continuar." });
      },
      onForbidden: (error) => {
        if (error.code === "USER_INACTIVE") {
          logout();
          toast.error("Tu cuenta fue desactivada", { description: "Contacta al administrador." });
          return;
        }
        const now = Date.now();
        if (now - lastForbiddenAt < 10_000) return;
        lastForbiddenAt = now;
        toast.error("No tienes permiso para esta acción", {
          description: "Si tus permisos cambiaron recientemente, se actualizarán ahora.",
        });
        void refreshUser();
      },
    });
    return () => setApiEventHandlers({});
  }, []);

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
      const currentUser = await withRetry(() => auth.me());
      setUser(currentUser);
    } catch (error) {
      // 401/403 ya cerraron la sesión en el handler de la API. Cualquier otro fallo
      // (red caída, 5xx, 429 tras los reintentos) NO debe borrar el token: el usuario sigue
      // teniendo sesión válida y un simple reintento la recupera.
      setUser(null);
      if (!(error instanceof ApiError) || isTransient(error)) {
        toast.error("No pudimos verificar tu sesión", { description: "Revisa tu conexión e intenta recargar la página." });
      }
    } finally {
      setIsLoading(false);
    }
  }

  async function refreshUser() {
    try {
      setUser(await auth.me());
    } catch {
      /* 401/403 los atiende el handler de la API; un fallo de red deja los permisos actuales */
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

  function replaceToken(newToken: string) {
    localStorage.setItem(TOKEN_KEY, newToken);
    setToken(newToken);
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
        refreshUser,
        replaceToken,
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
