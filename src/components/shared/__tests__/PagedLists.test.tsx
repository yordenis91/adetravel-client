import React from "react";
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import { api } from "@/lib/api";
import ServicesPage from "@/components/services/ServicesPage";
import { Combobox } from "@/components/ui/combobox";

// Listas paginadas en el servidor (fase 3, defectos D1, D3 y D12): antes se pedía una sola página
// (o limit=1000, que la API rechaza) y se filtraba en el navegador.

function renderWithClient(ui: React.ReactElement) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter>{ui}</MemoryRouter>
    </QueryClientProvider>
  );
}

const service = (i: number) => ({
  id: `s${i}`, serviceNumber: `SRV-${i}`, type: "SEGURO", status: "RECEPCIONADA", requestId: `r${i}`,
  request: { requestNumber: `REQ-${i}` }, provider: { name: `Proveedor ${i}` },
});

afterEach(() => vi.restoreAllMocks());

describe("ServicesPage paginada en el servidor", () => {
  it("pide páginas de 20 con la búsqueda en la API y muestra el total", async () => {
    const spy = vi.spyOn(api, "get").mockImplementation(async (path: string) => {
      const page = Number(new URLSearchParams(path.split("?")[1]).get("page"));
      const rows = Array.from({ length: page === 3 ? 5 : 20 }, (_, i) => service((page - 1) * 20 + i));
      return { data: rows, total: 45, page, limit: 20 } as any;
    });
    const user = userEvent.setup();
    renderWithClient(<ServicesPage />);

    expect(await screen.findByText("1–20 de 45")).toBeTruthy();
    // La solicitud y el proveedor salen de la fila: no se pide la lista de solicitudes.
    expect(screen.getByText("REQ-0")).toBeTruthy();
    expect(spy.mock.calls.every(([p]) => (p as string).startsWith("/services?"))).toBe(true);
    expect(spy.mock.calls.some(([p]) => (p as string).includes("limit=1000"))).toBe(false);

    await user.click(screen.getByRole("button", { name: "Página siguiente" }));
    expect(await screen.findByText("21–40 de 45")).toBeTruthy();

    await user.type(screen.getByPlaceholderText(/Buscar por N° servicio/), "REQ-7");
    await waitFor(() => expect(spy.mock.calls.some(([p]) => (p as string).includes("search=REQ-7") && (p as string).includes("page=1"))).toBe(true));
  });

  it("si la API falla muestra el error con Reintentar, no una lista vacía", async () => {
    const spy = vi.spyOn(api, "get").mockRejectedValue(new Error(JSON.stringify({ error: "fallo simulado", code: "INTERNAL" })));
    const user = userEvent.setup();
    renderWithClient(<ServicesPage />);

    expect(await screen.findByText("No se pudieron cargar los servicios.")).toBeTruthy();
    expect(screen.getByText("fallo simulado")).toBeTruthy();
    expect(screen.queryByText(/No se encontraron/)).toBeNull();

    spy.mockResolvedValue({ data: [service(1)], total: 1, page: 1, limit: 20 } as any);
    await user.click(screen.getByRole("button", { name: /Reintentar/ }));
    expect(await screen.findByText("SRV-1")).toBeTruthy();
  });
});

describe("Combobox con búsqueda remota", () => {
  it("entrega el texto a onSearchChange y conserva la etiqueta elegida aunque cambien las opciones", async () => {
    const onSearchChange = vi.fn();
    const onChange = vi.fn();
    const user = userEvent.setup();
    const { rerender } = render(
      <Combobox options={[{ value: "a", label: "REQ-A" }]} value="" onChange={onChange} onSearchChange={onSearchChange} placeholder="Elegir" />
    );
    await user.click(screen.getByRole("combobox"));
    await user.type(screen.getByPlaceholderText("Buscar..."), "REQ");
    expect(onSearchChange).toHaveBeenLastCalledWith("REQ");
    await user.click(screen.getByText("REQ-A"));
    expect(onChange).toHaveBeenCalledWith("a");

    rerender(<Combobox options={[{ value: "b", label: "REQ-B" }]} value="a" onChange={onChange} onSearchChange={onSearchChange} placeholder="Elegir" />);
    expect(screen.getByRole("combobox").textContent).toContain("REQ-A");
  });
});
