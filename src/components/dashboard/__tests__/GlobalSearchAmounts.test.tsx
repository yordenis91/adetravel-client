import React from "react";
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import { api } from "@/lib/api";

import { GlobalSearch } from "../GlobalSearch";

type ApiResult = Awaited<ReturnType<typeof api.get>>;

const RESULTS = {
  clients: [],
  requests: [],
  quotations: [{ id: "q1", quotationNumber: "COT-1", total: 458150, currency: "CLP", status: "ACEPTADA" }],
  payments: [
    { id: "p1", paymentNumber: "PAG-1", amount: 1166200, currency: "CLP", status: "COMPLETADO" },
    { id: "p2", paymentNumber: "PAG-2", amount: 1543.19, currency: "USD", status: "COMPLETADO" },
  ],
  vouchers: [],
};

afterEach(() => vi.restoreAllMocks());

describe("buscador global: importes y término", () => {
  it("muestra los importes con separador de miles y la moneda", async () => {
    const get = vi.spyOn(api, "get").mockResolvedValue({ data: RESULTS } as unknown as ApiResult);
    render(
      <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
        <MemoryRouter>
          <GlobalSearch />
        </MemoryRouter>
      </QueryClientProvider>
    );
    await userEvent.type(screen.getByRole("textbox", { name: /Buscar clientes/ }), "pag");

    expect(await screen.findByText(/\$\s?1\.166\.200 CLP/)).toBeInTheDocument();
    expect(screen.getByText("$1,543.19 USD")).toBeInTheDocument();
    expect(screen.getByText(/· \$\s?458\.150 CLP/)).toBeInTheDocument();
    expect(document.body.textContent).not.toContain("$1166200");
    expect(get).toHaveBeenCalledWith("/search?q=pag");
  });

  it("codifica el término: tildes y símbolos no rompen la URL", async () => {
    const get = vi.spyOn(api, "get").mockResolvedValue({ data: RESULTS } as unknown as ApiResult);
    render(
      <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
        <MemoryRouter>
          <GlobalSearch />
        </MemoryRouter>
      </QueryClientProvider>
    );
    await userEvent.type(screen.getByRole("textbox", { name: /Buscar clientes/ }), "a&b#ñ");
    await screen.findByText(/PAG-1/);
    expect(get).toHaveBeenCalledWith(`/search?q=${encodeURIComponent("a&b#ñ")}`);
  });
});
