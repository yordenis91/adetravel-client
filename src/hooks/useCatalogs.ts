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
export function useCatalog(
  resource: CatalogResource,
  parentId?: string,
  parentField?: "countryId" | "carBrandId",
  includeInactive = false,
) {
  const query = new URLSearchParams();
  if (parentField && parentId) query.set(parentField, parentId);
  if (includeInactive) query.set("includeInactive", "true");

  const { data: responseData, ...rest } = useQuery({
    queryKey: ["catalog", resource, parentId, includeInactive],
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

// Desactivar/reactivar un padre (país, marca) arrastra a sus hijos, así que se invalida todo el
// árbol de catálogos y no solo el recurso editado.
const invalidateAllCatalogs = (qc: ReturnType<typeof useQueryClient>) => qc.invalidateQueries({ queryKey: ["catalog"] });

/** `cascade` aplica el cambio de estado también a los hijos (ciudades/regiones de un país, modelos de una marca). */
export function useUpdateCatalogItem(resource: CatalogResource) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, cascade, ...data }: { id: string; cascade?: boolean } & Record<string, unknown>) =>
      api.patch(`/${resource}/${id}${cascade ? "?cascade=true" : ""}`, data),
    onSuccess: () => void invalidateAllCatalogs(qc),
  });
}

/** Baja lógica. Si hay hijos activos, la API responde 409 (`CATALOG_HAS_DEPENDENTS`) salvo con `cascade`. */
export function useDeleteCatalogItem(resource: CatalogResource) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, cascade }: { id: string; cascade?: boolean }) =>
      api.delete(`/${resource}/${id}${cascade ? "?cascade=true" : ""}`),
    onSuccess: () => void invalidateAllCatalogs(qc),
  });
}

export interface CatalogDependents {
  total: number;
  items: { label: string; singular: string; count: number }[];
}

/** Hijos activos de un registro (para avisar antes de desactivarlo). */
export function useCatalogDependents(resource: CatalogResource, id: string | null) {
  const { data } = useQuery({
    queryKey: ["catalog-dependents", resource, id],
    enabled: !!id,
    staleTime: 0,
    queryFn: async () => api.get(`/${resource}/${id}/dependents`),
  });
  return ((data as any)?.data ?? data ?? null) as CatalogDependents | null;
}

const uniqueByName = (items: CatalogItem[]) => {
  const seen = new Set<string>();
  return items.filter((i) => (seen.has(i.name) ? false : (seen.add(i.name), true)));
};

/** Ciudades sugeridas según el país escrito/elegido (los campos guardan texto, no FK). Si el país
 * está vacío o no figura en el nomenclador, se ofrecen todas las ciudades (sin repetir nombres). */
export function useCitiesForCountry(countryName?: string | null) {
  const { data: countries } = useCatalog("countries");
  const country = countries.find((c) => c.name.toLowerCase() === (countryName ?? "").trim().toLowerCase());
  const { data: cities } = useCatalog("cities", country?.id, "countryId");
  return { cities: country ? cities : uniqueByName(cities), countryKnown: !!country };
}

/** Modelos sugeridos según la marca escrita/elegida; sin marca conocida se ofrecen todos los modelos. */
export function useModelsForBrand(brandName?: string | null) {
  const { data: brands } = useCatalog("car-brands");
  const brand = brands.find((b) => b.name.toLowerCase() === (brandName ?? "").trim().toLowerCase());
  const { data: models } = useCatalog("car-models", brand?.id, "carBrandId");
  return { models: brand ? models : uniqueByName(models), brandKnown: !!brand };
}
