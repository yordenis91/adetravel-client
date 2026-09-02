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

/**
 * Para endpoints que devuelven un binario (p.ej. PDF real de Voucher/Cotización) en vez de JSON.
 * No pasa por `request()` porque ese helper siempre hace `.json()` sobre la respuesta.
 */
async function requestBlob(path: string): Promise<Blob> {
  const token = localStorage.getItem("ade_token");
  const res = await fetch(`${BASE}${path}`, {
    headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
  });

  if (!res.ok) {
    throw new Error(await res.text());
  }

  return res.blob();
}

export const api = {
  get: (path: string) => request(path),
  getBlob: (path: string) => requestBlob(path),
  post: (path: string, body: unknown) =>
    request(path, { method: "POST", body: JSON.stringify(body) }),
  put: (path: string, body: unknown) =>
    request(path, { method: "PUT", body: JSON.stringify(body) }),
  patch: (path: string, body: unknown) =>
    request(path, { method: "PATCH", body: JSON.stringify(body) }),
  delete: (path: string) => request(path, { method: "DELETE" }),
};

/**
 * Extrae el mensaje de error real del backend a partir de un error lanzado por
 * `request()` (arriba). Ese error es un `Error` normal cuyo `.message` es el
 * cuerpo crudo de la respuesta JSON — la mayoría de endpoints usan `sendError`
 * ({error, code}), pero algunos (p.ej. la sincronización de tipo de cambio)
 * responden {message: "..."} directamente, así que se revisan ambas claves.
 * Este cliente usa `fetch`, no axios — un `error.response?.data?.message` nunca
 * existe aquí y siempre cae al fallback, ocultando el error real.
 */
export function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error) {
    try {
      const parsed = JSON.parse(error.message);
      if (parsed?.error) return parsed.error;
      if (parsed?.message) return parsed.message;
    } catch {
      if (error.message) return error.message;
    }
  }
  return fallback;
}

export const SystemConfig = {
  list: async () => {
    const response = await api.get("/system-config");
    const item = (response as any)?.data;
    return item ? [item] : [];
  },
  create: (body: unknown) => api.put("/system-config", body),
  update: (_id: string, body: unknown) => api.put("/system-config", body),
};
