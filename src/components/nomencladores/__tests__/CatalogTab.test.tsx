import React from "react";
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { CatalogTab } from "../CatalogTab";

const chile = { id: "c1", name: "Chile", isActive: true };
const peru = { id: "c2", name: "Perú", isActive: false };

function setup() {
  const get = vi.spyOn(api, "get").mockImplementation(async (path: string) => {
    if (path.includes("/dependents")) return { data: { total: 3, items: [{ label: "ciudades", singular: "ciudad", count: 2 }, { label: "regiones", singular: "región", count: 1 }] } } as any;
    return { data: [chile, peru] } as any;
  });
  const del = vi.spyOn(api, "delete").mockResolvedValue({} as any);
  const patch = vi.spyOn(api, "patch").mockResolvedValue({} as any);
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={client}>
      <CatalogTab resource="countries" label="País" childrenLabel="ciudades y regiones" />
    </QueryClientProvider>,
  );
  return { get, del, patch };
}

afterEach(() => vi.restoreAllMocks());

describe("CatalogTab: baja y reactivación", () => {
  it("lista también los inactivos para poder reactivarlos", async () => {
    const { get } = setup();
    expect(await screen.findByText("Perú")).toBeTruthy();
    expect(get.mock.calls.some(([p]) => String(p).includes("includeInactive=true"))).toBe(true);
  });

  it("desactivar pide confirmación, avisa de los dependientes y no llama a la API hasta confirmar", async () => {
    const { del } = setup();
    await userEvent.click((await screen.findAllByLabelText("Desactivar"))[0]);
    expect(await screen.findByText(/¿Desactivar país "Chile"\?/)).toBeTruthy();
    expect(await screen.findByText(/2 ciudades y 1 región activas asociadas/)).toBeTruthy();
    expect(del).not.toHaveBeenCalled();

    await userEvent.click(screen.getByRole("button", { name: "Desactivar" }));
    await waitFor(() => expect(del).toHaveBeenCalledWith("/countries/c1?cascade=true"));
  });

  it("cancelar no desactiva nada", async () => {
    const { del } = setup();
    await userEvent.click((await screen.findAllByLabelText("Desactivar"))[0]);
    await userEvent.click(await screen.findByRole("button", { name: "Cancelar" }));
    expect(del).not.toHaveBeenCalled();
  });

  it("reactivar un país confirma y reactiva también sus hijos", async () => {
    const { patch } = setup();
    await userEvent.click(await screen.findByLabelText("Activar"));
    await userEvent.click(await screen.findByRole("button", { name: "Reactivar" }));
    await waitFor(() => expect(patch).toHaveBeenCalledWith("/countries/c2?cascade=true", { isActive: true }));
  });
});
