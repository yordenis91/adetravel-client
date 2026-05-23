import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

export function useQuotations(params?: {
  requestId?: string;
  clientId?:  string;
  status?:    string;
  search?:    string;
  page?:      number;
  limit?:     number;
}) {
  const query = new URLSearchParams();
  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== "") query.set(k, String(v));
    });
  }

  return useQuery({
    queryKey: ["quotations", params],
    queryFn:  () => api.get(`/quotations?${query.toString()}`),
  });
}

export function useQuotation(id: string) {
  return useQuery({
    queryKey: ["quotations", id],
    queryFn:  () => api.get(`/quotations/${id}`),
    enabled:  !!id,
  });
}

export function useCreateQuotation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => api.post("/quotations", data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["quotations"] });
      qc.invalidateQueries({ queryKey: ["requests"] }); // Sincroniza el estado de la solicitud padre
    },
  });
}

export function useUpdateQuotation(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => api.patch(`/quotations/${id}`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["quotations"] });
      qc.invalidateQueries({ queryKey: ["quotations", id] });
    },
  });
}

export function useChangeQuotationStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status, notes }: { id: string; status: string; notes?: string }) =>
      api.patch(`/quotations/${id}/status`, { status, notes }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["quotations"] });
      qc.invalidateQueries({ queryKey: ["requests"] }); 
    },
  });
}

export function useDuplicateQuotation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.post(`/quotations/${id}/duplicate`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["quotations"] });
    },
  });
}

export function useDeleteQuotation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/quotations/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["quotations"] });
    },
  });
}

// Abrir vista previa HTML en nueva pestaña para imprimir
export function openQuotationPreview(id: string) {
  window.open(`${import.meta.env.VITE_API_URL}/quotations/${id}/preview`, "_blank");
}