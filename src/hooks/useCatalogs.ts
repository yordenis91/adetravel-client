import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api";

export type CatalogResource =
  | "countries" | "cities" | "regions" | "nationalities"
  | "car-types" | "car-brands" | "car-models";

interface CatalogItem {
  id: string;
  name: string;
  isActive: boolean;
  countryId?: string;
  carBrandId?: string;
  [key: string]: unknown;
}

/** Lista un nomenclador (activos por defecto). `parentId` filtra por catálogo padre cuando aplica
 * (p.ej. countryId para "cities"/"regions", carBrandId para "car-models"). */
export function useCatalog(resource: CatalogResource, parentId?: string, parentField?: "countryId" | "carBrandId") {
  const query = new URLSearchParams();
  if (parentField && parentId) query.set(parentField, parentId);

  const { data: responseData, ...rest } = useQuery({
    queryKey: ["catalog", resource, parentId],
    queryFn: async () => api.get(`/${resource}?${query.toString()}`),
  });

  const data: CatalogItem[] = Array.isArray(responseData) ? responseData : (responseData as any)?.data || [];
  return { data, ...rest };
}

export function useCreateCatalogItem(resource: CatalogResource) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => api.post(`/${resource}`, data),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["catalog", resource] }),
  });
}

export function useUpdateCatalogItem(resource: CatalogResource) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: { id: string } & Record<string, unknown>) => api.patch(`/${resource}/${id}`, data),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["catalog", resource] }),
  });
}

export function useDeleteCatalogItem(resource: CatalogResource) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/${resource}/${id}`),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["catalog", resource] }),
  });
}
