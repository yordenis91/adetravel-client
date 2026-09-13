import React from "react";
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { PaymentFormDialog } from "../PaymentFormDialog";

function createQueryClient() {
  return new QueryClient({ defaultOptions: { queries: { retry: false } } });
}

function renderDialog(payment?: any) {
  const client = createQueryClient();
  render(
    <QueryClientProvider client={client}>
      <PaymentFormDialog open={true} onOpenChange={() => {}} payment={payment} />
    </QueryClientProvider>
  );
}

const EXISTING_PAYMENT = {
  id: "pay-1",
  requestId: "req-1",
  quotationId: "quo-1",
  clientId: "client-1",
  paymentNumber: "PAG-2026-01-0001",
  amount: 1500,
  currency: "CLP",
  paymentDate: "2026-01-15",
  method: "TRANSFERENCIA",
  status: "PENDIENTE",
  reference: "Ref-1",
  notes: "",
};

describe("PaymentFormDialog", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  function mockListEndpoints() {
    vi.spyOn(api, "get").mockImplementation((path: string) => {
      if (path === "/payments") return Promise.resolve([EXISTING_PAYMENT]) as any;
      if (path === "/requests") {
        return Promise.resolve([
          { id: "req-1", requestNumber: "REQ-0001", destinationCity: "Santiago", clientId: "client-1" },
        ]) as any;
      }
      if (path === "/quotations") {
        return Promise.resolve([
          { id: "quo-1", requestId: "req-1", quotationNumber: "COT-0001", status: "Aceptada", total: 1500, currency: "CLP" },
        ]) as any;
      }
      if (path === "/clients") {
        return Promise.resolve([{ id: "client-1", firstName: "Ana", lastName: "Pérez" }]) as any;
      }
      return Promise.reject(new Error(`Unexpected path: ${path}`));
    });
  }

  // Regresión: PaymentFormDialog usaba api.put() para editar un pago existente,
  // pero el backend nunca expuso una ruta PUT /payments/:id (solo PATCH), así
  // que "Editar Pago" daba 404 silencioso. Se corrigió a api.patch(); este
  // test evita que alguien lo revierta sin darse cuenta.
  it("usa api.patch (no api.put) al guardar la edición de un pago existente", async () => {
    mockListEndpoints();
    const patchSpy = vi.spyOn(api, "patch").mockResolvedValue({ data: EXISTING_PAYMENT } as any);
    const putSpy = vi.spyOn(api, "put");

    renderDialog(EXISTING_PAYMENT);

    const submitButton = await screen.findByRole("button", { name: /Actualizar Registro/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(patchSpy).toHaveBeenCalledWith(`/payments/${EXISTING_PAYMENT.id}`, expect.any(Object));
    });
    expect(putSpy).not.toHaveBeenCalled();
  });

  it("usa api.post al registrar un pago nuevo", async () => {
    mockListEndpoints();
    const postSpy = vi.spyOn(api, "post").mockResolvedValue({ data: {} } as any);

    renderDialog(undefined);

    // En modo creación el formulario arranca vacío; completamos los campos
    // requeridos que no dependen de interactuar con un Select/Combobox de Radix.
    // (El input de Monto va envuelto en un <div> decorativo para el símbolo de
    // moneda, así que no queda asociado a su <FormLabel> vía aria-labelledby.)
    const amountInput = await screen.findByRole("spinbutton");
    fireEvent.change(amountInput, { target: { value: "500" } });

    // requestId/clientId son obligatorios mediante Combobox/Select — sin
    // completarlos, la validación de zod debe bloquear el envío.
    const submitButton = screen.getByRole("button", { name: /Registrar Pago/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(postSpy).not.toHaveBeenCalled();
    });
  });
});
