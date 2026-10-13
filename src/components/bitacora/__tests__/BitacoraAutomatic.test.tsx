import React from "react";
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { api } from "@/lib/api";

// La bitácora oculta por defecto los eventos automáticos y los muestra con el interruptor.

import BitacoraPage from "../BitacoraPage";

type ApiResult = Awaited<ReturnType<typeof api.get>>;

function mockApi() {
  return vi.spyOn(api, "get").mockImplementation(async (path: string) => {
    if (path.startsWith("/activity-logs/stats")) return { data: { total: 10, today: 1, recent: 5 } } as unknown as ApiResult;
    return { data: [] } as unknown as ApiResult;
  });
}

const renderPage = () =>
  render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      <BitacoraPage />
    </QueryClientProvider>
  );

const paths = (spy: ReturnType<typeof mockApi>) => spy.mock.calls.map((c) => String(c[0]));

afterEach(() => vi.restoreAllMocks());

describe("Bitácora: eventos automáticos", () => {
  it("por defecto no pide los automáticos, ni en el listado ni en las estadísticas", async () => {
    const spy = mockApi();
    renderPage();
    await waitFor(() => expect(paths(spy).some((p) => p.startsWith("/activity-logs?"))).toBe(true));
    expect(paths(spy).every((p) => !p.includes("includeAutomatic"))).toBe(true);
    expect(screen.getByRole("switch", { name: "Ver eventos automáticos" })).not.toBeChecked();
  });

  it("al activar el interruptor los pide en el listado y en las estadísticas", async () => {
    const spy = mockApi();
    renderPage();
    await userEvent.click(await screen.findByRole("switch", { name: "Ver eventos automáticos" }));
    await waitFor(() => {
      expect(paths(spy).some((p) => p.startsWith("/activity-logs?") && p.includes("includeAutomatic=true"))).toBe(true);
      expect(paths(spy).some((p) => p.startsWith("/activity-logs/stats") && p.includes("includeAutomatic=true"))).toBe(true);
    });
  });
});
