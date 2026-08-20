import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api";

type ConfirmationsQueryParams = {
  search?: string;
  requestId?: string;
  serviceId?: string;
  providerId?: string;
  page?: number;
  limit?: number;
};

type ConfirmationMutationPayload = Record<string, unknown>;

export function useConfirmations(params: ConfirmationsQueryParams) {
  const query = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== "" && value !== "all") {
      query.set(key, String(value));
    }
  });

  const { data: responseData, ...rest } = useQuery({
    queryKey: ["confirmations", params],
    queryFn: async () => api.get(`/confirmations?${query.toString()}`)
  });

  const data = Array.isArray(responseData) ? responseData : (responseData as any)?.data || [];
  return { data, ...rest };
}

export function useRequestConfirmations(requestId: string) {
  const { data: responseData, ...rest } = useQuery({
    queryKey: ["requests", requestId, "confirmations"],
    queryFn: async () => api.get(`/requests/${requestId}/confirmations`),
    enabled: Boolean(requestId)
  });

  const data = Array.isArray(responseData) ? responseData : (responseData as any)?.data || [];
  return { data, ...rest };
}

export function useCreateConfirmation() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (data: ConfirmationMutationPayload) => api.post("/confirmations", data),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["confirmations"] });
      void qc.invalidateQueries({ queryKey: ["requests"] });
      void qc.invalidateQueries({ queryKey: ["services"] });
    }
  });
}

export function useUpdateConfirmation() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({ id, ...data }: { id: string } & ConfirmationMutationPayload) => api.patch(`/confirmations/${id}`, data),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["confirmations"] });
    }
  });
}

export function useDeleteConfirmation() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => api.delete(`/confirmations/${id}`),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["confirmations"] });
    }
  });
}
