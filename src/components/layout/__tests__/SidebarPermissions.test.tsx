import React from "react";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import { api } from "@/lib/api";

let perms: string[] = [];
vi.mock("@/context/AuthContext", () => ({
  useAuth: () => ({ logout: vi.fn(), hasPermission: (p: string) => perms.includes(p) }),
}));

import { Sidebar } from "../Sidebar";

function renderSidebar(permissions: string[]) {
  perms = permissions;
  vi.spyOn(api, "get").mockResolvedValue({ data: {} } as any);
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <Sidebar isOpen={true} onClose={() => {}} />
      </MemoryRouter>
    </QueryClientProvider>
  );
}

// Cada ítem del menú y la ruta correspondiente de App.tsx exigen el mismo permiso.
const ITEMS: Array<[string, string]> = [
  ["Clientes", "VIEW_CLIENTS"],
  ["Solicitudes", "VIEW_REQUESTS"],
  ["Servicios", "VIEW_SERVICES"],
  ["Cotizaciones", "VIEW_QUOTATIONS"],
  ["Confirmaciones", "VIEW_CONFIRMATIONS"],
  ["Pagos", "VIEW_PAYMENTS"],
  ["Vouchers", "VIEW_VOUCHERS"],
  ["Nomencladores", "VIEW_CATALOGS"],
];

describe("menú lateral según permisos", () => {
  afterEach(() => vi.restoreAllMocks());

  it("sin permisos solo quedan los ítems que no exigen ninguno", () => {
    renderSidebar([]);
    for (const [name] of ITEMS) expect(screen.queryByText(name)).not.toBeInTheDocument();
    expect(screen.getByText("Panel Principal")).toBeInTheDocument();
    expect(screen.getByText("Tareas")).toBeInTheDocument();
  });

  it.each(ITEMS)("%s aparece solo con %s", (name, permission) => {
    const { unmount } = renderSidebar([permission]);
    expect(screen.getByText(name)).toBeInTheDocument();
    for (const [other] of ITEMS.filter(([n]) => n !== name)) {
      expect(screen.queryByText(other)).not.toBeInTheDocument();
    }
    unmount();
  });

  // Comprobación estática de App.tsx: la ruta de cada ítem debe estar envuelta en ProtectedRoute con
  // el mismo permiso que el menú; si no, quien escriba la URL a mano entraría igualmente.
  it.each([
    ["/clientes", "VIEW_CLIENTS"],
    ["/clientes/:clientId/timeline", "VIEW_CLIENTS"],
    ["/solicitudes", "VIEW_REQUESTS"],
    ["/solicitudes/:requestId", "VIEW_REQUESTS"],
    ["/servicios", "VIEW_SERVICES"],
    ["/cotizaciones", "VIEW_QUOTATIONS"],
    ["/confirmaciones", "VIEW_CONFIRMATIONS"],
    ["/pagos", "VIEW_PAYMENTS"],
    ["/vouchers", "VIEW_VOUCHERS"],
    ["/nomencladores", "VIEW_CATALOGS"],
  ])("la ruta %s exige %s en App.tsx", (path, permission) => {
    const app = readFileSync(resolve(__dirname, "../../../App.tsx"), "utf8");
    const at = app.indexOf(`path="${path}"`);
    expect(at).toBeGreaterThan(-1);
    const block = app.slice(at, at + 220);
    expect(block).toContain(`<ProtectedRoute requiredPermission="${permission}">`);
  });
});
