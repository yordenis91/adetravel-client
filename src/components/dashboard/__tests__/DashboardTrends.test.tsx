import React from "react";
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import { api } from "@/lib/api";

// Las etiquetas de tendencia del panel salen de los datos del API, no de textos fijos.

vi.mock("@/context/AuthContext", () => ({
  useAuth: () => ({
    user: { id: "u1", email: "u@adetravel.com", permissions: ["VIEW_REPORTS"] },
    logout: vi.fn(),
    hasPermission: (p: string) => p === "VIEW_REPORTS",
  }),
}));
vi.mock("@/components/tasks/TasksWidget", () => ({ TasksWidget: () => <div>tasks-widget</div> }));
vi.mock("../BirthdayReminder", () => ({ BirthdayReminder: () => <div>birthday-widget</div> }));

import Dashboard from "@/pages/Dashboard";

const REPORT = {
  summary: { totalClients: 17, totalRequests: 17, formattedRevenue: "$3.590.022" },
  requestsByStatus: [{ status: "RECEPCIONADA", count: 3 }, { status: "VOUCHER_EMITIDO", count: 5 }],
};

function renderDashboard(report: object) {
  type ApiResult = Awaited<ReturnType<typeof api.get>>;
  vi.spyOn(api, "get").mockImplementation(async (path: string) => ((path.startsWith("/reports") ? { data: report } : { data: [] }) as unknown as ApiResult));
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>
    </QueryClientProvider>
  );
}

afterEach(() => vi.restoreAllMocks());

describe("tendencias del panel", () => {
  it("muestra la tendencia real de cada tarjeta, con su aviso", async () => {
    renderDashboard({
      ...REPORT,
      trends: {
        windowDays: 30,
        clients: { current: 4, previous: 2 },
        requests: { current: 6, previous: 6 },
        confirmedTrips: { current: 1, previous: 4 },
        revenue: { current: 1500000, previous: 1000000 },
      },
    });
    expect(await screen.findByText("+2")).toBeInTheDocument(); // clientes
    expect(screen.getByText("sin cambios")).toBeInTheDocument(); // solicitudes
    expect(screen.getByText("-3")).toBeInTheDocument(); // viajes
    expect(screen.getByText("+50%")).toBeInTheDocument(); // ingresos
    expect(screen.getByTitle("Últimos 30 días: 4. 30 días anteriores: 2.")).toBeInTheDocument();
  });

  it("ya no queda ninguna tendencia escrita a mano", async () => {
    renderDashboard({
      ...REPORT,
      trends: {
        windowDays: 30,
        clients: { current: 0, previous: 0 },
        requests: { current: 0, previous: 0 },
        confirmedTrips: { current: 0, previous: 0 },
        revenue: { current: 0, previous: 0 },
      },
    });
    await screen.findByText("Total Clientes");
    expect(screen.queryByText("+12%")).toBeNull();
    expect(screen.queryByText("+5")).toBeNull();
    expect(screen.queryByText("estable")).toBeNull();
    expect(screen.getAllByText("sin cambios")).toHaveLength(4);
  });

  it("si el API aún no envía tendencias, las tarjetas se muestran sin etiqueta (no inventa)", async () => {
    renderDashboard(REPORT);
    await screen.findByText("Total Clientes");
    await waitFor(() => expect(screen.getByText("17")).toBeInTheDocument());
    for (const text of ["+12%", "+5", "estable", "sin cambios"]) expect(screen.queryByText(text)).toBeNull();
  });
});
