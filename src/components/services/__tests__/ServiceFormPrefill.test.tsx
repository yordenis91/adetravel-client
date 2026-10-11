import React from "react";
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { api } from "@/lib/api";

// Al crear un servicio se prellena desde la ficha del cliente de la solicitud; al editar o sin
// permiso para ver clientes no se toca nada ni se consulta la ficha.

const perms = { VIEW_CLIENTS: true };
vi.mock("@/hooks/use-toast", () => ({ useToast: () => ({ toast: vi.fn() }) }));
vi.mock("@/context/AuthContext", () => ({
  useAuth: () => ({ hasPermission: (p: string) => !!(perms as Record<string, boolean>)[p] }),
}));
vi.mock("@/hooks/useProviderOptions", () => ({ useProviderOptions: () => ({ optionsFor: () => [] }) }));

import { ServiceFormDialog } from "../ServiceFormDialog";

const CLIENT = { id: "c1", firstName: "Ana", lastName: "Pérez", passportNumber: "P123" };

function mockApi() {
  return vi.spyOn(api, "get").mockImplementation(async (url: string) => {
    if (url.startsWith("/clients/c1")) return { data: CLIENT };
    return { data: [] };
  });
}

function renderDialog(props: Partial<React.ComponentProps<typeof ServiceFormDialog>> = {}) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <ServiceFormDialog open onOpenChange={() => {}} requestId="r1" defaultClientId="c1" {...props} />
    </QueryClientProvider>
  );
}

const responsible = () => document.querySelector<HTMLInputElement>('input[name="details.rooms.0.responsibleName"]');

afterEach(() => { vi.restoreAllMocks(); perms.VIEW_CLIENTS = true; });

describe("ServiceFormDialog: prellenado desde el cliente", () => {
  it("al crear, el responsable de la primera habitación es el cliente de la solicitud", async () => {
    const get = mockApi();
    renderDialog();
    await waitFor(() => expect(responsible()?.value).toBe("Ana Pérez"));
    expect(get).toHaveBeenCalledWith(expect.stringContaining("/clients/c1"));
  });

  it("sin VIEW_CLIENTS no consulta la ficha y deja el campo vacío", async () => {
    perms.VIEW_CLIENTS = false;
    const get = mockApi();
    renderDialog();
    await screen.findByText(/^Datos de Alojamiento/);
    expect(responsible()?.value).toBe("");
    expect(get).not.toHaveBeenCalledWith(expect.stringContaining("/clients/c1"));
  });

  it("al editar un servicio no pisa lo guardado", async () => {
    const get = mockApi();
    renderDialog({
      service: {
        id: "s1", type: "ALOJAMIENTO", providerId: null, clientId: null, price: 10, currency: "CLP",
        details: { type: "ALOJAMIENTO", roomCount: 1, rooms: [{ responsibleName: "", roomType: "DOBLE" }], checkIn: "2026-01-01", checkOut: "2026-01-02", hotelName: "H", hotelChain: "X" },
      },
    });
    await screen.findByText(/^Datos de Alojamiento/);
    expect(responsible()?.value).toBe("");
    expect(get).not.toHaveBeenCalledWith(expect.stringContaining("/clients/c1"));
  });
});
