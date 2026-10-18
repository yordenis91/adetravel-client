import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ClientsTable } from "../ClientsTable";

const client = {
  id: "c1",
  firstName: "Lucía",
  lastName: "Navarro",
  nationality: "Peruana",
  rut: "12.345.678-9",
  passportNumber: "P1234567",
  email: "lucia@example.test",
  phone: "+56 9 5555 7777",
  referralSource: "WEBSITE",
  isActive: true,
};

function renderTable(onEdit = vi.fn()) {
  render(
    <MemoryRouter>
      <TooltipProvider>
        <ClientsTable
          clients={[client]}
          isLoading={false}
          onEdit={onEdit}
          onToggleActive={() => {}}
          onDelete={() => {}}
          selectedIds={new Set()}
          onSelectOne={() => {}}
          onSelectAll={() => {}}
        />
      </TooltipProvider>
    </MemoryRouter>,
  );
}

describe("ClientsTable: ficha del cliente (la de móvil deja solo lo importante)", () => {
  it("muestra nombre, estado, correo, teléfono y las acciones", () => {
    renderTable();
    expect(screen.getByText("Lucía Navarro")).toBeInTheDocument();
    expect(screen.getByText("Activo")).toBeInTheDocument();
    expect(screen.getByText("lucia@example.test")).toBeInTheDocument();
    expect(screen.getByText("+56 9 5555 7777")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Escribir por WhatsApp" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Ver ficha del cliente" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Editar" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Más acciones" })).toBeInTheDocument();
  });

  it("en móvil oculta las celdas secundarias (RUT/pasaporte y fuente)", () => {
    renderTable();
    expect(screen.getByText("12.345.678-9").closest("td")).toHaveClass("max-md:!hidden");
    expect(screen.getByText("WEBSITE").closest("td")).toHaveClass("max-md:!hidden");
    // Lo importante nunca se oculta.
    expect(screen.getByText("lucia@example.test").closest("td")?.className).not.toContain("max-md:!hidden");
    expect(screen.getByText("Activo").closest("td")?.className).not.toContain("max-md:!hidden");
  });

  it("los botones de acción tienen área táctil de 40 px en móvil", () => {
    renderTable();
    for (const name of ["Ver ficha del cliente", "Editar", "Más acciones"]) {
      expect(screen.getByRole("button", { name })).toHaveClass("max-md:h-10", "max-md:w-10");
    }
  });

  it("Editar llama al callback con el cliente", () => {
    const onEdit = vi.fn();
    renderTable(onEdit);
    fireEvent.click(screen.getByRole("button", { name: "Editar" }));
    expect(onEdit).toHaveBeenCalledWith(client);
  });
});
