import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api";

export interface AgencyInfo {
  name: string;
  rut: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
}

export const AGENCY_INFO_KEY = ["agency-info"] as const;

/**
 * Datos de la agencia (Configuración > Agencia) para el encabezado de cotizaciones y vouchers.
 * Usa GET /system-config/agency, que puede leer cualquier usuario: /system-config exige permiso de
 * administración y quien genera documentos no lo tiene.
 */
export function useAgencyInfo(enabled = true) {
  const result = useQuery({
    queryKey: AGENCY_INFO_KEY,
    queryFn: () => api.get("/system-config/agency"),
    enabled,
    staleTime: 5 * 60_000,
  });
  const body = result.data as { data?: AgencyInfo } | undefined;
  return { agency: body?.data ?? null, isLoading: result.isLoading };
}
