// Detectamos si estamos en producción (Vite inyecta esta variable automáticamente)
const isProd = import.meta.env.PROD;

// En producción, si no hay variable, usamos '/api' (asumiendo que frontend y backend comparten dominio)
// En desarrollo local, usamos localhost.
const BASE = import.meta.env.VITE_API_URL || (isProd ? "/api" : "http://localhost:3000/api");

if (isProd && !import.meta.env.VITE_API_URL) {
  console.warn("⚠️ ALERTA ENTERPRISE: VITE_API_URL no está definido en el build de producción. Usando fallback '/api'.");
}

type RequestMethod = "POST" | "PATCH" | "DELETE" | "PUT";

/**
 * Estructura estándar de respuesta paginada del backend
 * El backend SIEMPRE devuelve este formato para endpoints de listas
 */
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

/**
 * Estructura que puede venir del servidor - puede ser directamente un array
 * o un objeto paginado, dependiendo del endpoint
 */
export type ApiResponse<T> = T[] | PaginatedResponse<T> | T | null;

/**
 * Helper para extraer array de cualquier formato de respuesta
 */
export function extractArrayFromResponse<T>(response: ApiResponse<T>): T[] {
  if (Array.isArray(response)) {
    return response;
  }
  if (response && typeof response === 'object' && 'data' in response) {
    return (response as any).data || [];
  }
  return [];
}

/**
 * Helper para extraer total de un response paginado
 */
export function extractTotalFromResponse<T>(response: ApiResponse<T>): number {
  if ('total' in (response as any)) {
    return (response as any).total;
  }
  if (Array.isArray(response)) {
    return response.length;
  }
  return 0;
}

async function request(path: string, options?: RequestInit) {
  const token = localStorage.getItem("ade_token");
  const res = await fetch(`${BASE}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...options,
  });

  if (!res.ok) {
    throw new Error(await res.text());
  }

  return res.json();
}

export const api = {
  get: (path: string) => request(path),
  post: (path: string, body: unknown) =>
    request(path, { method: "POST", body: JSON.stringify(body) }),
  put: (path: string, body: unknown) =>
    request(path, { method: "PUT", body: JSON.stringify(body) }),
  patch: (path: string, body: unknown) =>
    request(path, { method: "PATCH", body: JSON.stringify(body) }),
  delete: (path: string) => request(path, { method: "DELETE" }),
};

export const SystemConfig = {
  list: async () => {
    const response = await api.get("/system-config");
    const item = (response as any)?.data;
    return item ? [item] : [];
  },
  create: (body: unknown) => api.put("/system-config", body),
  update: (_id: string, body: unknown) => api.put("/system-config", body),
};
