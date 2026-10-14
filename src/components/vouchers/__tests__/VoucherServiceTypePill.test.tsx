import React from "react";
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TooltipProvider } from "@/components/ui/tooltip";
import { api } from "@/lib/api";

// Vouchers antiguos sin tipo de servicio guardado: no se dibuja una pastilla vacía.

vi.mock("@/hooks/use-toast", () => ({ useToast: () => ({ toast: vi.fn() }) }));

import { VoucherPDFPreview } from "../VoucherPDFPreview";
import { VouchersTable } from "../VouchersTable";

type ApiResult = Awaited<ReturnType<typeof api.get>>;
const base = { id: "v1", voucherNumber: "VCH-1", status: "EMITIDO", serviceName: "Vuelo SCL-MAD-SCL", destination: "Madrid", client: { firstName: "Ana", lastName: "Pérez" } };

afterEach(() => vi.restoreAllMocks());

function renderPreview(voucher: object) {
  vi.spyOn(api, "get").mockResolvedValue({ data: {} } as unknown as ApiResult);
  return render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      <TooltipProvider>
        <VoucherPDFPreview open onOpenChange={() => {}} voucher={voucher} client={base.client} provider={{}} request={{}} />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

const renderTable = (voucher: object) =>
  render(
    <VouchersTable vouchers={[voucher]} isLoading={false} onEdit={() => {}} onDelete={() => {}} onPreviewPDF={() => {}} onStatusChange={() => {}} />
  );

describe("VoucherPDFPreview: pastilla del tipo de servicio", () => {
  it("con tipo guardado la muestra", () => {
    renderPreview({ ...base, serviceType: "ALOJAMIENTO" });
    expect(document.querySelector(".service-type-badge")?.textContent).toBe("Alojamiento");
  });

  it("sin tipo guardado no dibuja la pastilla vacía", () => {
    renderPreview({ ...base, serviceType: null });
    expect(document.querySelector(".service-type-badge")).toBeNull();
    expect(screen.getByText("Vuelo SCL-MAD-SCL")).toBeInTheDocument();
  });
});

describe("VouchersTable: pastilla del tipo de servicio", () => {
  it("con tipo guardado la muestra", () => {
    renderTable({ ...base, serviceType: "PASAJE_AEREO" });
    expect(screen.getByText("Pasaje aéreo")).toBeInTheDocument();
  });

  it("sin tipo guardado no deja una pastilla vacía y sigue mostrando el nombre del servicio", () => {
    renderTable({ ...base, serviceType: null });
    expect(screen.getByText("Vuelo SCL-MAD-SCL")).toBeInTheDocument();
    expect(document.querySelectorAll("span.bg-blue-50")).toHaveLength(0);
  });
});
