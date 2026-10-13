import React from "react";
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TooltipProvider } from "@/components/ui/tooltip";
import { api } from "@/lib/api";

// El encabezado y el pie de la vista previa del voucher salen de Configuración > Agencia, no de textos fijos.

vi.mock("@/hooks/use-toast", () => ({ useToast: () => ({ toast: vi.fn() }) }));

import { VoucherPDFPreview } from "../VoucherPDFPreview";

const AGENCY = { name: "Viajes Sur", rut: null, address: "Av. Libertad 55", phone: "+56 32 222 3344", email: "hola@viajessur.cl", website: null };
const voucher = { id: "v1", voucherNumber: "VCH-1", status: "EMITIDO", serviceName: "Vuelo", destination: "Madrid" };

afterEach(() => vi.restoreAllMocks());

function renderPreview() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <TooltipProvider>
        <VoucherPDFPreview open onOpenChange={() => {}} voucher={voucher} client={{ firstName: "Ana", lastName: "Pérez" }} provider={{}} request={{}} />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

describe("VoucherPDFPreview: datos de la agencia", () => {
  it("usa los datos configurados y no los de relleno", async () => {
    const get = vi.spyOn(api, "get").mockResolvedValue({ data: AGENCY });
    renderPreview();
    await waitFor(() => expect(screen.getByRole("heading", { name: "VIAJES SUR" })).toBeInTheDocument());
    expect(get).toHaveBeenCalledWith("/system-config/agency");
    expect(screen.getByText("Av. Libertad 55")).toBeInTheDocument();
    expect(screen.getByText("+56 32 222 3344")).toBeInTheDocument();
    expect(screen.getByText(/su agente de viajes VIAJES SUR\./)).toBeInTheDocument();
    expect(document.body.textContent).not.toMatch(/Providencia|2345 6789|contacto@adetravel/);
  });
});
