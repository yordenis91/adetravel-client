import { describe, it, expect, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QuotationDetailSheet } from "../QuotationDetailSheet";

// Acciones de envío del panel de detalle: enviar por correo (editable) o marcar como enviada sin correo.
const base = {
  id: "q1", quotationNumber: "COTIZ-1", currency: "CLP", items: [], subtotal: 0, taxAmount: 0, total: 0,
  validUntil: "2099-12-31", client: { firstName: "Ana", lastName: "Soto", email: "ana@x.cl" },
};

function setup(status: string) {
  const onSend = vi.fn();
  const onStatusChange = vi.fn();
  render(
    <TooltipProvider>
    <QuotationDetailSheet
      open onOpenChange={() => {}} quotation={{ ...base, status }} request={null} client={base.client}
      onEdit={() => {}} onStatusChange={onStatusChange} onSend={onSend}
    />
    </TooltipProvider>
  );
  return { onSend, onStatusChange };
}

describe("QuotationDetailSheet: envío", () => {
  it("en Borrador: 'Enviar por correo' abre el diálogo y NO cambia el estado por su cuenta", () => {
    const { onSend, onStatusChange } = setup("Borrador");
    fireEvent.click(screen.getByRole("button", { name: /Enviar por correo/ }));
    expect(onSend).toHaveBeenCalledWith(expect.objectContaining({ id: "q1" }));
    expect(onStatusChange).not.toHaveBeenCalled();
  });

  it("en Borrador: 'Marcar como Enviada (sin correo)' cambia el estado sin el correo automático", () => {
    const { onSend, onStatusChange } = setup("Borrador");
    fireEvent.click(screen.getByRole("button", { name: /sin correo/ }));
    expect(onStatusChange).toHaveBeenCalledWith("q1", "Enviada", { sendEmail: false });
    expect(onSend).not.toHaveBeenCalled();
  });

  it("en Enviada: ofrece reenviar, además de aceptar y rechazar", () => {
    const { onSend } = setup("Enviada");
    fireEvent.click(screen.getByRole("button", { name: /Reenviar por correo/ }));
    expect(onSend).toHaveBeenCalled();
    expect(screen.getByRole("button", { name: /Aceptar Cotización/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Rechazar/ })).toBeInTheDocument();
  });

  it("en Aceptada no se ofrece enviar", () => {
    setup("Aceptada");
    expect(screen.queryByRole("button", { name: /correo/ })).not.toBeInTheDocument();
  });
});
