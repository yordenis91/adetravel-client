import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api";

type ServicesQueryParams = {
  search?: string;
  status?: string;
  type?: string;
  requestId?: string;
  providerId?: string;
  page?: number;
  limit?: number;
};

type ChangeStatusWithIdPayload = {
  id: string;
  status: string;
  notes?: string;
  cancellationReason?: string;
};

type ServiceMutationPayload = Record<string, unknown>;

export function useServices(params: ServicesQueryParams) {
  const query = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== "" && value !== "all") {
      query.set(key, String(value));
    }
  });

  const { data: responseData, ...rest } = useQuery({
    queryKey: ["services", params],
    queryFn: async () => api.get(`/services?${query.toString()}`)
  });

  const data = Array.isArray(responseData) ? responseData : (responseData as any)?.data || [];
  return { data, ...rest };
}

export function useRequestServices(requestId: string) {
  const { data: responseData, ...rest } = useQuery({
    queryKey: ["requests", requestId, "services"],
    queryFn: async () => api.get(`/requests/${requestId}/services`),
    enabled: Boolean(requestId)
  });

  const data = Array.isArray(responseData) ? responseData : (responseData as any)?.data || [];
  return { data, ...rest };
}

export function useCreateService() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (data: ServiceMutationPayload) => api.post("/services", data),
    onSuccess: (_res, variables) => {
      void qc.invalidateQueries({ queryKey: ["services"] });
      if (variables?.requestId) void qc.invalidateQueries({ queryKey: ["requests", variables.requestId] });
    }
  });
}

export function useUpdateService() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({ id, ...data }: { id: string } & ServiceMutationPayload) => api.patch(`/services/${id}`, data),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["services"] });
      void qc.invalidateQueries({ queryKey: ["requests"] });
    }
  });
}

export function useChangeServiceStatus() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (payload: ChangeStatusWithIdPayload) => api.patch(`/services/${payload.id}/status`, payload),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["services"] });
      void qc.invalidateQueries({ queryKey: ["requests"] });
    }
  });
}

export function useDeleteService() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => api.delete(`/services/${id}`),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["services"] });
      void qc.invalidateQueries({ queryKey: ["requests"] });
    }
  });
}
