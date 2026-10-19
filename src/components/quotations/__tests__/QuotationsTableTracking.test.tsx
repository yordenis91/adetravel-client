import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { QuotationsTable } from "../QuotationsTable";

// La lista muestra de un vistazo si el cliente abrió la cotización o quiere aceptarla.
const hoursAgo = (h: number) => new Date(Date.now() - h * 3_600_000).toISOString();
const row = (id: string, status: string, tracking: object | null, extra: object = {}) => ({
  id, quotationNumber: `COTIZ-${id}`, status, currency: "CLP", total: 119000, validUntil: "2099-12-31",
  client: { firstName: "Ana", lastName: "Soto" }, clientId: "c1", request: { requestNumber: "R-1" }, tracking, ...extra,
});
const track = (over: object = {}) => ({ hasLink: true, viewCount: 0, firstViewedAt: null, lastViewedAt: null, acceptanceRequestedAt: null, sentAt: hoursAgo(1), expiresAt: null, ...over });

function setup(quotations: ReturnType<typeof row>[]) {
  render(
    <QuotationsTable quotations={quotations} isLoading={false} onEdit={vi.fn()} onView={vi.fn()} onStatusChange={vi.fn()} onSend={vi.fn()} onPreviewPDF={vi.fn()} onDuplicate={vi.fn()} />
  );
}

describe("QuotationsTable: seguimiento", () => {
  it("marca las enviadas sin abrir (con más de un día), las vistas y las que quieren aceptar", () => {
    setup([
      row("1", "Enviada", track({ sentAt: hoursAgo(50) })),
      row("2", "Enviada", track({ viewCount: 2, lastViewedAt: hoursAgo(3) })),
      row("3", "Enviada", track({ viewCount: 2, lastViewedAt: hoursAgo(3), acceptanceRequestedAt: hoursAgo(1) })),
      row("4", "Enviada", track()),
    ]);
    expect(screen.getByText("Sin abrir")).toBeInTheDocument();
    expect(screen.getByText(/^Vista hace/)).toBeInTheDocument();
    expect(screen.getByText("Quiere aceptar")).toBeInTheDocument();
    expect(screen.getByText("Sin abrir aún")).toBeInTheDocument();
  });

  it("no pone etiqueta a borradores, aceptadas ni cotizaciones sin enlace", () => {
    setup([
      row("5", "Borrador", null),
      row("6", "Aceptada", track({ viewCount: 3, lastViewedAt: hoursAgo(1) })),
      row("7", "Enviada", track({ hasLink: false })),
    ]);
    expect(screen.queryByText(/Sin abrir|Vista hace|Quiere aceptar/)).not.toBeInTheDocument();
  });

  it("la vigencia se muestra con el día correcto (sin desfase de zona horaria)", () => {
    setup([row("8", "Borrador", null, { validUntil: "2026-12-31" })]);
    expect(screen.getByText(/31 dic, 2026/i)).toBeInTheDocument();
  });
});
