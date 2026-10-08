import { useState } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { api } from "../lib/api";
import { useDebouncedValue } from "./useDebouncedValue";
import type { ComboboxOption } from "@/components/ui/combobox";

/**
 * Opciones de un selector buscadas en el servidor (clientes, solicitudes, cotizaciones...).
 * Antes los formularios pedían el listado sin paginar y solo veían los 20 registros más
 * recientes. Devuelve las props que espera `Combobox` (`options`, `onSearchChange`, `loading`).
 */
export function useRemoteOptions<T = any>(
  key: string,
  path: string,
  toOption: (row: T) => ComboboxOption,
  { enabled = true, params = {} as Record<string, string | undefined> } = {}
) {
  const [search, setSearch] = useState("");
  const debounced = useDebouncedValue(search.trim());
  const query = new URLSearchParams({ limit: "50" });
  if (debounced) query.set("search", debounced);
  Object.entries(params).forEach(([k, v]) => v && query.set(k, v));
  const qs = query.toString();

  const result = useQuery({
    queryKey: [key, "options", qs],
    queryFn: () => api.get(`${path}?${qs}`),
    enabled,
    placeholderData: keepPreviousData,
    staleTime: 30_000,
  });
  const body = result.data as any;
  const rows: T[] = Array.isArray(body) ? body : body?.data ?? [];
  return { rows, options: rows.map(toOption), onSearchChange: setSearch, loading: result.isFetching };
}
