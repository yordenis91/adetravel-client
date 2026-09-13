import React from "react";
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { PaymentsTable } from "../PaymentsTable";

const navigateMock = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<typeof import("react-router-dom")>("react-router-dom");
  return { ...actual, useNavigate: () => navigateMock };
});

const PAYMENT = {
  id: "pay-1",
  paymentNumber: "PAG-0001",
  requestId: "req-1",
  clientId: "client-1",
  amount: 1000,
  currency: "CLP",
  method: "TRANSFERENCIA",
  status: "PENDIENTE",
  paymentDate: "2026-01-15",
};

const CLIENT = { id: "client-1", firstName: "Ana", lastName: "Pérez" };
const REQUEST = { id: "req-1", requestNumber: "REQ-0001" };

function renderTable() {
  return render(
    <MemoryRouter>
      <PaymentsTable
        payments={[PAYMENT]}
        requests={[REQUEST]}
        clients={[CLIENT]}
        isLoading={false}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
        onStatusChange={vi.fn()}
      />
    </MemoryRouter>
  );
}

describe("PaymentsTable", () => {
  afterEach(() => {
    navigateMock.mockClear();
  });

  // Regresión: "Ver solicitud" apuntaba a /solicitudes/:id, una ruta que no
  // existe (la página de Solicitudes usa el patrón ?view=<id> para abrir el
  // detalle), así que el botón caía siempre en el catch-all 404.
  it("el botón 'Ver solicitud' navega a /solicitudes?view=<requestId>", async () => {
    const user = userEvent.setup();
    renderTable();

    const trigger = screen.getAllByRole("button").find((btn) => btn.getAttribute("aria-haspopup") === "menu");
    expect(trigger).toBeTruthy();
    await user.click(trigger!);

    const verSolicitud = await screen.findByText(/Ver solicitud/i);
    await user.click(verSolicitud);

    await waitFor(() => {
      expect(navigateMock).toHaveBeenCalledWith(`/solicitudes?view=${PAYMENT.requestId}`);
    });
  });

  it("muestra los datos principales del pago en la fila", () => {
    renderTable();

    expect(screen.getByText("PAG-0001")).toBeInTheDocument();
    expect(screen.getByText(/Ana Pérez/)).toBeInTheDocument();
    expect(screen.getByText("REQ-0001")).toBeInTheDocument();
  });
});
