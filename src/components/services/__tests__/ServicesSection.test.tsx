import React from "react";
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import { api } from "@/lib/api";
import { statusChangedToast } from "@/lib/request-status-feedback";

const toastMock = vi.fn();
vi.mock("@/hooks/use-toast", () => ({ useToast: () => ({ toast: toastMock }) }));
vi.mock("@/context/AuthContext", () => ({
  useAuth: () => ({ hasPermission: () => true, hasAnyPermission: () => true, hasAllPermissions: () => true }),
}));
vi.mock("../ServiceFormDialog", () => ({ ServiceFormDialog: () => null }));

import { ServicesSection } from "../ServicesSection";

// Fase 3, defecto D7: tras reactivar una solicitud sus servicios se pueden modificar o eliminar.

const SERVICES = [
  { id: "s1", serviceNumber: "SRV-1", type: "SEGURO", status: "RECEPCIONADA", currency: "CLP", price: 100 },
];

function renderSection() {
  vi.spyOn(api, "get").mockResolvedValue({ data: SERVICES } as any);
  const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <ServicesSection requestId="r1" isPackage={false} />
      </MemoryRouter>
    </QueryClientProvider>
  );
}

afterEach(() => {
  vi.restoreAllMocks();
  toastMock.mockClear();
});

describe("ServicesSection", () => {
  it("botones con nombre accesible y sin botones anidados", async () => {
    const { container } = renderSection();
    expect(await screen.findByRole("button", { name: "Editar servicio SRV-1" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Eliminar servicio SRV-1" })).toBeTruthy();
    expect(container.querySelector("button button")).toBeNull();
  });

  it("eliminar pide confirmación y llama a la API", async () => {
    const del = vi.spyOn(api, "delete").mockResolvedValue({ data: { ok: true } } as any);
    const user = userEvent.setup();
    renderSection();
    await user.click(await screen.findByRole("button", { name: "Eliminar servicio SRV-1" }));
    expect(del).not.toHaveBeenCalled();
    await user.click(screen.getByRole("button", { name: "Eliminar servicio" }));
    await waitFor(() => expect(del).toHaveBeenCalledWith("/services/s1"));
    expect(toastMock).toHaveBeenCalledWith(expect.objectContaining({ title: "Servicio eliminado" }));
  });

  it("si la API no deja eliminar, muestra su motivo", async () => {
    vi.spyOn(api, "delete").mockRejectedValue(
      new Error(JSON.stringify({ error: "No se puede eliminar porque tiene cotizaciones o confirmaciones asociadas.", code: "SERVICE_HAS_RELATIONS" }))
    );
    const user = userEvent.setup();
    renderSection();
    await user.click(await screen.findByRole("button", { name: "Eliminar servicio SRV-1" }));
    await user.click(screen.getByRole("button", { name: "Eliminar servicio" }));
    await waitFor(() =>
      expect(toastMock).toHaveBeenCalledWith(expect.objectContaining({
        variant: "destructive",
        description: "No se puede eliminar porque tiene cotizaciones o confirmaciones asociadas.",
      }))
    );
  });
});

describe("statusChangedToast", () => {
  it("al reactivar indica cuántos servicios vuelven y qué se puede hacer con ellos", () => {
    expect(statusChangedToast({ data: { reactivatedServices: 3 } })).toEqual({
      title: "Solicitud reactivada",
      description: '3 servicios vuelven a "Recepcionada". Revísalos: puedes modificarlos, eliminarlos o volver a cancelarlos.',
    });
    expect(statusChangedToast({ data: { status: "ENVIADO_AL_CLIENTE" } }).title).toBe("Estado actualizado");
  });
});
