import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api";

type RequestsQueryParams = {
  search?: string;
  status?: string;
  clientId?: string;
  page?: number;
  limit?: number;
};

type ChangeStatusPayload = {
  status: string;
  notes?: string;
};

type RequestMutationPayload = Record<string, unknown>;

export function useRequests(params: RequestsQueryParams) {
  const query = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== "") {
      query.set(key, String(value));
    }
  });

  const { data: responseData, ...rest } = useQuery({
    queryKey: ["requests", params],
    queryFn: async () => api.get(`/requests?${query.toString()}`)
  });

  const data = Array.isArray(responseData) ? responseData : (responseData as any)?.data || [];
  return { data, ...rest };
}

export function useRequest(id: string) {
  const { data: responseData, ...rest } = useQuery({
    queryKey: ["requests", id],
    queryFn: async () => api.get(`/requests/${id}`),
    enabled: Boolean(id)
  });

  const data = responseData && !Array.isArray(responseData) ? responseData : (responseData as any)?.data || null;
  return { data, ...rest };
}

export function useRequestStats() {
  const { data: responseData, ...rest } = useQuery({
    queryKey: ["requests", "stats"],
    queryFn: async () => api.get("/requests/stats"),
    staleTime: 60_000
  });

  const data = responseData && !Array.isArray(responseData) ? responseData : (responseData as any)?.data || {};
  return { data, ...rest };
}

export function useCreateRequest() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (data: RequestMutationPayload) => api.post("/requests", data),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["requests"] });
    }
  });
}

export function useChangeRequestStatus(id: string) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (payload: ChangeStatusPayload) => api.patch(`/requests/${id}/status`, payload),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["requests"] });
      void qc.invalidateQueries({ queryKey: ["requests", id] });
    }
  });
}

export function useDuplicateRequest() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => api.post(`/requests/${id}/duplicate`, {}),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["requests"] });
    }
  });
}

export function useDeleteRequest() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => api.delete(`/requests/${id}`),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["requests"] });
    }
  });
}
