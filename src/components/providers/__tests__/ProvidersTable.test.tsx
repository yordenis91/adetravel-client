import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { ProvidersTable } from "../ProvidersTable";

const provider = {
  id: "p1",
  name: "Hotel Andes SpA",
  fantasyName: "Hotel Andes",
  rut: "76.123.456-7",
  businessType: "HOTEL",
  email: "reservas@andes.test",
  phone: "+56 2 2222 3333",
  city: "Cusco",
  country: "Perú",
  paymentMethod: "TRANSFER",
  isActive: true,
};

function renderTable() {
  render(
    <MemoryRouter>
      <ProvidersTable
        providers={[provider]}
        isLoading={false}
        onEdit={() => {}}
        onDelete={() => {}}
        selectedIds={new Set()}
        onSelectOne={() => {}}
        onSelectAll={() => {}}
      />
    </MemoryRouter>,
  );
}

describe("ProvidersTable: ficha del proveedor (la de móvil deja solo lo importante)", () => {
  it("muestra nombre, estado, correo, teléfono y las acciones", () => {
    renderTable();
    expect(screen.getByText("Hotel Andes SpA")).toBeInTheDocument();
    expect(screen.getByText("Activo")).toBeInTheDocument();
    expect(screen.getByText("reservas@andes.test")).toBeInTheDocument();
    expect(screen.getByText("+56 2 2222 3333")).toBeInTheDocument();
    for (const name of ["Ver ficha del proveedor", "Editar", "Más acciones"]) {
      expect(screen.getByRole("button", { name })).toHaveClass("max-md:h-10", "max-md:w-10");
    }
  });

  it("en móvil oculta tipo, país/ciudad y método de pago", () => {
    renderTable();
    expect(screen.getByText("Cusco, Perú").closest("td")).toHaveClass("max-md:!hidden");
    expect(screen.getByText("Transferencia").closest("td")).toHaveClass("max-md:!hidden");
    expect(screen.getByText("reservas@andes.test").closest("td")?.className).not.toContain("max-md:!hidden");
  });
});
