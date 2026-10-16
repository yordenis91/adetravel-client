import React from "react";
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TooltipProvider } from "@/components/ui/tooltip";
import { api } from "@/lib/api";

vi.mock("@/hooks/use-toast", () => ({ useToast: () => ({ toast: vi.fn() }) }));

import { QuotationPDFPreview } from "../QuotationPDFPreview";

const AGENCY = { name: "Viajes Sur", rut: null, address: null, phone: null, email: null, website: null };
const quotation = { id: "q1", quotationNumber: "COT-1", status: "ENVIADA", currency: "CLP", items: [], total: 0, validUntil: "2026-12-31" };

afterEach(() => vi.restoreAllMocks());

function renderPreview(quotationOverride: Record<string, unknown>) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <TooltipProvider>
        <QuotationPDFPreview open onOpenChange={() => {}} quotation={{ ...quotation, ...quotationOverride }} client={{ firstName: "Ana", lastName: "Pérez" }} request={{}} />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

describe("QuotationPDFPreview: fecha de emisión", () => {
  it("muestra la fecha de creación de la cotización (createdAt), no la de hoy", async () => {
    vi.spyOn(api, "get").mockResolvedValue({ data: AGENCY });
    renderPreview({ createdAt: "2026-03-15T15:00:00.000Z" });
    await waitFor(() => expect(screen.getByText("15/03/2026")).toBeInTheDocument());
  });
});
