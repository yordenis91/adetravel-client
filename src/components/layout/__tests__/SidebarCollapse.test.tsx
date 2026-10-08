import React from "react";
import { describe, it, expect, vi, afterEach, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import { api } from "@/lib/api";

let perms: string[] = [];
vi.mock("@/context/AuthContext", () => ({
  useAuth: () => ({ logout: vi.fn(), hasPermission: (p: string) => perms.includes(p) }),
}));

import { Sidebar } from "../Sidebar";

const ADMIN = ["VIEW_CLIENTS", "VIEW_PROVIDERS", "VIEW_REQUESTS", "VIEW_SERVICES", "VIEW_QUOTATIONS", "VIEW_CONFIRMATIONS",
  "VIEW_PAYMENTS", "VIEW_VOUCHERS", "MANAGE_USERS", "MANAGE_SYSTEM_CONFIG", "MANAGE_TEMPLATES", "MANAGE_PERMISSIONS",
  "VIEW_CATALOGS", "VIEW_REPORTS", "VIEW_LOGS"];

function renderSidebar(permissions: string[], path = "/dashboard") {
  perms = permissions;
  vi.spyOn(api, "get").mockResolvedValue({ data: {} } as any);
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={[path]}>
        <Sidebar isOpen={true} onClose={() => {}} />
      </MemoryRouter>
    </QueryClientProvider>
  );
}

// Menú plegable (2026-10-08): con 16 opciones no cabía en pantallas de 900 px de alto.
describe("menú lateral plegable", () => {
  beforeEach(() => localStorage.clear());
  afterEach(() => vi.restoreAllMocks());

  it("pliega y despliega una sección, y lo recuerda", async () => {
    const user = userEvent.setup();
    const { unmount } = renderSidebar(ADMIN);
    const gestion = screen.getByRole("button", { name: /Gestión/ });
    expect(gestion).toHaveAttribute("aria-expanded", "true");
    await user.click(gestion);
    expect(gestion).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByRole("link", { name: /Clientes/ })).toBeNull();
    unmount();

    renderSidebar(ADMIN);
    expect(screen.getByRole("button", { name: /Gestión/ })).toHaveAttribute("aria-expanded", "false");
  });

  it("en pantallas bajas Administración empieza plegada, salvo que contenga la pantalla actual", () => {
    window.innerHeight = 800;
    const { unmount } = renderSidebar(ADMIN);
    expect(screen.getByRole("button", { name: /Administración/ })).toHaveAttribute("aria-expanded", "false");
    unmount();

    renderSidebar(ADMIN, "/usuarios");
    expect(screen.getByRole("button", { name: /Administración/ })).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByRole("link", { name: /Usuarios/ })).toBeTruthy();
  });

  it("no muestra secciones sin opciones para el usuario", () => {
    renderSidebar(["VIEW_CLIENTS"]);
    expect(screen.queryByText("Administración")).toBeNull();
    expect(screen.queryByText("Reportes")).toBeNull();
  });
});
