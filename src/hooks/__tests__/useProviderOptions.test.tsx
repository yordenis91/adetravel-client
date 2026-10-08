import React from "react";
import { describe, it, expect, vi, afterEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { api } from "@/lib/api";

let permissions: string[] = [];
vi.mock("@/context/AuthContext", () => ({
  useAuth: () => ({ hasPermission: (p: string) => permissions.includes(p) }),
}));

import { useProviderOptions } from "../useProviderOptions";

// Fase 3, defecto D4: ventas gestiona servicios y confirmaciones sin VIEW_PROVIDERS; los selectores
// usan la lista mínima /providers/options en vez de /providers (que le daba 403).

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>{children}</QueryClientProvider>
);

afterEach(() => vi.restoreAllMocks());

describe("useProviderOptions", () => {
  it("pide /providers/options y ofrece los activos más el ya elegido aunque esté inactivo", async () => {
    permissions = ["VIEW_SERVICES"];
    const spy = vi.spyOn(api, "get").mockResolvedValue({
      data: [
        { id: "p1", name: "Hotel Uno", fantasyName: null, isActive: true },
        { id: "p2", name: "Viejo SA", fantasyName: "Viejo", isActive: false },
      ],
    } as any);
    const { result } = renderHook(() => useProviderOptions(), { wrapper });
    await waitFor(() => expect(result.current.providers).toHaveLength(2));

    expect(spy).toHaveBeenCalledWith("/providers/options");
    expect(result.current.optionsFor(null)).toEqual([{ value: "p1", label: "Hotel Uno" }]);
    expect(result.current.optionsFor("p2")).toEqual([
      { value: "p1", label: "Hotel Uno" },
      { value: "p2", label: "Viejo (inactivo)" },
    ]);
    expect(result.current.nameOf("p2")).toBe("Viejo");
  });

  it("sin permisos de los módulos que usan proveedores no pide nada", () => {
    permissions = ["VIEW_CLIENTS"];
    const spy = vi.spyOn(api, "get");
    renderHook(() => useProviderOptions(), { wrapper });
    expect(spy).not.toHaveBeenCalled();
  });
});
