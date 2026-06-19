// src/hooks/useClients.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

// ── Listar Clientes ───────────────────────────────────────────────────
export function useClients(params?: {
  search?: string;
  isActive?: boolean;
  sort?: string;
}) {
  const query = new URLSearchParams();
  if (params?.search) query.set("search", params.search);
  if (params?.isActive !== undefined) query.set("isActive", String(params.isActive));
  
  // Por defecto, ordenamos por los más recientes
  query.set("sort", params?.sort || "-createdAt");

  return useQuery({
    queryKey: ["clients", params],
    queryFn: async () => {
      const responseData = await api.get(`/clients?${query.toString()}`);
      // Extraemos el array directamente aquí. Las páginas ya no tendrán que hacerlo.
      return Array.isArray(responseData) ? responseData : (responseData as any)?.data || [];
    },
  });
}

// ── Obtener un Cliente ────────────────────────────────────────────────
export function useClient(id?: string) {
  return useQuery({
    queryKey: ["clients", id],
    queryFn: async () => {
      const responseData = await api.get(`/clients/${id}`);
      return (responseData as any)?.data || responseData;
    },
    enabled: !!id, // Solo se ejecuta si hay un ID
  });
}

// ── Historial del Cliente ─────────────────────────────────────────────
export function useClientHistory(id?: string) {
  return useQuery({
    queryKey: ["clients", id, "history"],
    queryFn: async () => {
      const responseData = await api.get(`/clients/${id}/history`);
      return (responseData as any)?.data || responseData;
    },
    enabled: !!id,
  });
}

// ── Crear Cliente ─────────────────────────────────────────────────────
export function useCreateClient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: any) => api.post("/clients", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clients"] });
    },
  });
}

// ── Actualizar Cliente ────────────────────────────────────────────────
export function useUpdateClient(id?: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: any) => api.patch(`/clients/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      if (id) queryClient.invalidateQueries({ queryKey: ["clients", id] });
    },
  });
}

// ── Desactivar / Activar Cliente ──────────────────────────────────────
export function useToggleClientStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) => 
      api.patch(`/clients/${id}`, { isActive: !isActive }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clients"] });
    },
  });
}