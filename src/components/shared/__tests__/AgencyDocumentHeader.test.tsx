import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { AgencyDocumentHeader } from "../AgencyDocumentHeader";
import { agencyDisplayName } from "@/lib/agency-name";

const FULL = {
  name: "Viajes Sur", rut: "76.123.456-7", address: "Av. Libertad 55, Viña del Mar",
  phone: "+56 32 222 3344", email: "hola@viajessur.cl", website: "www.viajessur.cl",
};

describe("AgencyDocumentHeader", () => {
  it("muestra el nombre y los datos configurados de la agencia", () => {
    render(<AgencyDocumentHeader agency={FULL} />);
    expect(screen.getByRole("heading", { name: "VIAJES SUR" })).toBeInTheDocument();
    for (const text of ["RUT: 76.123.456-7", FULL.address, FULL.phone, FULL.email, FULL.website]) {
      expect(screen.getByText(text)).toBeInTheDocument();
    }
  });

  it("solo muestra lo que está configurado: no inventa datos", () => {
    render(<AgencyDocumentHeader agency={{ ...FULL, rut: null, address: null, website: null }} />);
    expect(screen.queryByText(/RUT/)).toBeNull();
    expect(screen.queryByText(/Providencia/)).toBeNull();
    expect(screen.queryByText(/adetravel\.cl/)).toBeNull();
    expect(screen.getByText(FULL.phone)).toBeInTheDocument();
  });

  it("sin datos (aún cargando) muestra solo el nombre por defecto, sin teléfonos ni direcciones de relleno", () => {
    const { container } = render(<AgencyDocumentHeader agency={null} />);
    expect(screen.getByRole("heading", { name: "ADE TRAVEL" })).toBeInTheDocument();
    expect(container.textContent).not.toMatch(/\+56 2 2345 6789|Providencia|contacto@adetravel/);
  });

  it("agencyDisplayName pasa a mayúsculas y usa el nombre por defecto", () => {
    expect(agencyDisplayName(FULL)).toBe("VIAJES SUR");
    expect(agencyDisplayName(null)).toBe("ADE TRAVEL");
  });
});
