import React from "react";
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { UserPermissionsPanel } from "../PermisosPage";

const CATALOG = [
  { name: "VIEW_REQUESTS", module: "Solicitudes", description: "Ver solicitudes" },
  { name: "MANAGE_SERVICES", module: "Servicios", description: "Crear y editar servicios" },
  { name: "VIEW_PAYMENTS", module: "Pagos", description: "Ver pagos" },
];

const USER = { id: "u1", fullName: "Ana Pérez", email: "ana@example.com", role: "USUARIO", agencyRole: "OPERACIONES" };

function detail(overrides: Record<string, unknown> = {}) {
  return {
    data: {
      userId: "u1",
      systemRole: "USUARIO",
      agencyRole: "OPERACIONES",
      rolePermissions: ["VIEW_REQUESTS", "MANAGE_SERVICES"],
      directGrants: [],
      deniedPermissions: [],
      effectivePermissions: ["VIEW_REQUESTS", "MANAGE_SERVICES"],
      ...overrides,
    },
  };
}

async function openUser(detailResponse: unknown) {
  vi.spyOn(api, "get").mockImplementation((path: string) => {
    if (path.startsWith("/users")) return Promise.resolve({ data: [USER] }) as any;
    if (path === "/permissions/users/u1") return Promise.resolve(detailResponse) as any;
    return Promise.reject(new Error(`ruta inesperada ${path}`)) as any;
  });
  const post = vi.spyOn(api, "post").mockResolvedValue({ data: {} } as any);
  const del = vi.spyOn(api, "delete").mockResolvedValue({ data: { ok: true } } as any);

  render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      <UserPermissionsPanel catalog={CATALOG} />
    </QueryClientProvider>
  );
  fireEvent.change(screen.getByPlaceholderText("Nombre o correo..."), { target: { value: "ana" } });
  fireEvent.click(await screen.findByText("Ana Pérez"));
  return { post, del };
}

describe("UserPermissionsPanel: quitar y restaurar permisos del rol", () => {
  afterEach(() => vi.restoreAllMocks());

  it("quita un permiso heredado del rol solo tras confirmar y envía effect DENY", async () => {
    const { post } = await openUser(detail());

    fireEvent.click(await screen.findByLabelText("Quitar MANAGE_SERVICES a este usuario"));
    expect(post).not.toHaveBeenCalled();
    expect(await screen.findByText(/¿Quitar MANAGE_SERVICES a Ana Pérez\?/)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Quitar permiso" }));
    await waitFor(() =>
      expect(post).toHaveBeenCalledWith("/permissions/users/u1", { permission: "MANAGE_SERVICES", effect: "DENY" })
    );
  });

  it("cancelar el diálogo no cambia nada", async () => {
    const { post } = await openUser(detail());
    fireEvent.click(await screen.findByLabelText("Quitar VIEW_REQUESTS a este usuario"));
    fireEvent.click(await screen.findByRole("button", { name: "Cancelar" }));
    await waitFor(() => expect(screen.queryByText(/¿Quitar VIEW_REQUESTS/)).not.toBeInTheDocument());
    expect(post).not.toHaveBeenCalled();
  });

  it("muestra lo quitado aparte, lo saca de los permisos del rol y permite restaurarlo", async () => {
    const { del } = await openUser(
      detail({
        deniedPermissions: [{ permission: "MANAGE_SERVICES", grantedAt: "2026-10-07T12:00:00.000Z", expiresAt: null }],
        effectivePermissions: ["VIEW_REQUESTS"],
      })
    );

    expect(await screen.findByText("Permisos quitados a este usuario (1)")).toBeInTheDocument();
    expect(screen.getByText("Permisos del rol (1)")).toBeInTheDocument();
    expect(screen.queryByLabelText("Quitar MANAGE_SERVICES a este usuario")).not.toBeInTheDocument();

    fireEvent.click(screen.getByLabelText("Restaurar MANAGE_SERVICES"));
    await waitFor(() => expect(del).toHaveBeenCalledWith("/permissions/users/u1/MANAGE_SERVICES"));
  });

  it("una denegación vencida se lista como vencida y no cuenta como quitada", async () => {
    await openUser(
      detail({
        deniedPermissions: [{ permission: "MANAGE_SERVICES", grantedAt: "2026-01-01T00:00:00.000Z", expiresAt: "2026-02-01T00:00:00.000Z" }],
      })
    );
    expect(await screen.findByText("Permisos quitados a este usuario (0)")).toBeInTheDocument();
    expect(screen.getByText(/vencida, ya no aplica/)).toBeInTheDocument();
    expect(screen.getByLabelText("Quitar MANAGE_SERVICES a este usuario")).toBeInTheDocument();
  });

  it("no ofrece quitar permisos a un administrador", async () => {
    await openUser(detail({ systemRole: "ADMINISTRADOR", rolePermissions: [], effectivePermissions: ["VIEW_REQUESTS"] }));
    expect(await screen.findByText(/acceso total/)).toBeInTheDocument();
    expect(screen.queryByText(/Permisos del rol/)).not.toBeInTheDocument();
  });

  it("tolera una API anterior que aún no devuelve deniedPermissions", async () => {
    await openUser({ data: { ...detail().data, deniedPermissions: undefined } });
    expect(await screen.findByText("Permisos quitados a este usuario (0)")).toBeInTheDocument();
    expect(screen.getByText("A este usuario no se le ha quitado ningún permiso.")).toBeInTheDocument();
  });
});
