import React from "react";
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import { api } from "@/lib/api";

let currentUser: any = null;
vi.mock("@/context/AuthContext", () => ({
  useAuth: () => ({
    user: currentUser,
    logout: vi.fn(),
    hasPermission: (p: string) => !!currentUser?.permissions?.includes(p),
  }),
}));
// Widgets pesados ajenos a lo que se prueba aquí: no hacen peticiones que dependan de permisos.
vi.mock("@/components/tasks/TasksWidget", () => ({ TasksWidget: () => <div>tasks-widget</div> }));
vi.mock("../BirthdayReminder", () => ({ BirthdayReminder: () => <div>birthday-widget</div> }));

import Dashboard from "@/pages/Dashboard";

function renderDashboard(permissions: string[]) {
  currentUser = { id: "u1", email: "u@adetravel.com", permissions };
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>
    </QueryClientProvider>
  );
}

const getSpy = () =>
  vi.spyOn(api, "get").mockImplementation(async (path: string) => {
    if (path.startsWith("/reports")) {
      return { data: { summary: { totalClients: 0, totalRequests: 0, formattedRevenue: "$0" }, requestsByStatus: [] } } as any;
    }
    return { data: [] } as any;
  });
const paths = (spy: ReturnType<typeof getSpy>) => spy.mock.calls.map((c) => String(c[0]).split("?")[0]);

describe("Dashboard según permisos", () => {
  afterEach(() => vi.restoreAllMocks());

  it("sin ningún permiso muestra 'sin acceso' y no hace ninguna petición", async () => {
    const spy = getSpy();
    renderDashboard([]);
    expect(await screen.findByText(/Tu cuenta aún no tiene acceso/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Cerrar sesión/i })).toBeInTheDocument();
    expect(spy).not.toHaveBeenCalled();
  });

  it("con solo VIEW_REQUESTS consulta únicamente /requests (sin 403 en el resto)", async () => {
    const spy = getSpy();
    renderDashboard(["VIEW_REQUESTS", "VIEW_LOGS"]);
    await waitFor(() => expect(spy).toHaveBeenCalled());
    await new Promise((r) => setTimeout(r, 50));
    const called = new Set(paths(spy));
    expect([...called].every((p) => p === "/requests")).toBe(true);
    expect(screen.queryByText(/Tu cuenta aún no tiene acceso/i)).not.toBeInTheDocument();
    expect(screen.queryByText("birthday-widget")).not.toBeInTheDocument();
    expect(screen.queryByText("Nueva Solicitud")).not.toBeInTheDocument();
  });

  it("con todos los permisos consulta reportes, configuración y alertas", async () => {
    const spy = getSpy();
    renderDashboard([
      "VIEW_REPORTS", "MANAGE_SYSTEM_CONFIG", "VIEW_REQUESTS", "VIEW_PAYMENTS", "VIEW_QUOTATIONS",
      "VIEW_VOUCHERS", "VIEW_CLIENTS", "MANAGE_REQUESTS", "CREATE_CLIENT", "MANAGE_PROVIDERS",
    ]);
    await waitFor(() => {
      const called = new Set(paths(spy));
      for (const p of ["/reports", "/system-config", "/requests", "/payments", "/quotations", "/vouchers"]) {
        expect(called.has(p)).toBe(true);
      }
    });
    expect(await screen.findByText("Nueva Solicitud")).toBeInTheDocument();
    expect(screen.getByText("birthday-widget")).toBeInTheDocument();
  });
});
