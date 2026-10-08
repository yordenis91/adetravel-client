import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api";
import { useAuth } from "@/context/AuthContext";
import type { ComboboxOption } from "@/components/ui/combobox";

type ProviderOption = { id: string; name: string; fantasyName?: string | null; isActive: boolean };

/**
 * Proveedores para selectores y nombres (GET /providers/options: todos, solo id y nombre).
 * La usan también quienes no ven la ficha de proveedores (p. ej. AGENTE_VENTAS, que gestiona
 * servicios y confirmaciones): antes pedían /providers, recibían 403 y no podían elegir proveedor.
 */
export function useProviderOptions(enabled = true) {
  const { hasPermission } = useAuth();
  const allowed = ["VIEW_PROVIDERS", "VIEW_SERVICES", "VIEW_CONFIRMATIONS", "VIEW_VOUCHERS"].some((p) => hasPermission(p));

  const result = useQuery({
    queryKey: ["providers", "options"],
    queryFn: () => api.get("/providers/options"),
    enabled: enabled && allowed,
    staleTime: 60_000,
  });
  const providers: ProviderOption[] = (result.data as any)?.data ?? [];
  const labelOf = (p: ProviderOption) => p.fantasyName || p.name;

  /** Activos, más el ya elegido aunque esté inactivo (para no perderlo al editar). */
  const optionsFor = (currentId?: string | null): ComboboxOption[] =>
    providers
      .filter((p) => p.isActive || p.id === currentId)
      .map((p) => ({ value: p.id, label: p.isActive ? labelOf(p) : `${labelOf(p)} (inactivo)` }));

  const nameOf = (id?: string | null) => {
    const p = id ? providers.find((x) => x.id === id) : undefined;
    return p ? labelOf(p) : null;
  };

  return { ...result, providers, optionsFor, nameOf };
}
