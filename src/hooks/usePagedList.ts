import { useEffect, useState } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { api } from "../lib/api";

export const PAGE_SIZE = 20;

type ListParams = Record<string, string | number | boolean | undefined | null>;

/**
 * Listado paginado en el servidor. La API devuelve como mucho 100 filas por página
 * (`{ data, total, page, limit }`): pedir "todo" de una vez no es posible y filtrar en el
 * navegador solo veía la primera página. Aquí la búsqueda y los filtros viajan a la API y la
 * página vuelve a 1 cuando cambian.
 *
 * `key` es la primera parte del queryKey (p. ej. "requests"), así las invalidaciones existentes
 * (`invalidateQueries({ queryKey: ["requests"] })`) siguen refrescando la lista.
 */
export function usePagedList<T = any>(key: string, path: string, params: ListParams = {}, options: { enabled?: boolean; limit?: number } = {}) {
  const limit = options.limit ?? PAGE_SIZE;
  const [page, setPage] = useState(1);
  const paramsKey = JSON.stringify(params);

  useEffect(() => setPage(1), [paramsKey]);

  const query = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== "" && v !== "all") query.set(k, String(v));
  });
  query.set("page", String(page));
  query.set("limit", String(limit));

  const result = useQuery({
    queryKey: [key, "paged", params, page, limit],
    queryFn: () => api.get(`${path}?${query.toString()}`),
    placeholderData: keepPreviousData,
    enabled: options.enabled ?? true,
  });

  const body = result.data as any;
  const rows: T[] = Array.isArray(body) ? body : body?.data ?? [];
  const total: number = typeof body?.total === "number" ? body.total : rows.length;

  return { ...result, rows, total, page, setPage, limit };
}

/** Total de registros que cumplen `params`, sin traerlos (página de 1 elemento). Para contadores. */
export function useListTotal(key: string, path: string, params: ListParams = {}, enabled = true) {
  const query = new URLSearchParams({ limit: "1" });
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== "") query.set(k, String(v));
  });
  const result = useQuery({
    queryKey: [key, "total", params],
    queryFn: () => api.get(`${path}?${query.toString()}`),
    enabled,
    staleTime: 60_000,
  });
  const body = result.data as any;
  return typeof body?.total === "number" ? body.total : undefined;
}
