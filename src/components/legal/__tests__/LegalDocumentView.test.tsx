import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { LegalDocumentView } from "../LegalDocumentView";

// get devuelve el resultado (o lanza); el mock lo envuelve para que un rechazo lo maneje react-query y no el spy.
const get = vi.fn();
vi.mock("@/lib/api", () => ({
  PublicLegal: { get: async (...a: unknown[]) => { const r = get(...a); return r instanceof Error ? Promise.reject(r) : r; } },
}));

function renderView() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <LegalDocumentView doc="terms" title="Términos de Servicio" defaultLastUpdated="[COMPLETAR]">
          <p>Texto base</p>
        </LegalDocumentView>
      </MemoryRouter>
    </QueryClientProvider>
  );
}

describe("LegalDocumentView", () => {
  beforeEach(() => get.mockReset());

  it("muestra el texto base con el cartel de borrador cuando la agencia no publicó el suyo", async () => {
    get.mockResolvedValue({ html: null, updatedAt: null });
    renderView();
    expect(await screen.findByText("Texto base")).toBeInTheDocument();
    expect(screen.getByText(/Borrador — pendiente de revisión legal/)).toBeInTheDocument();
  });

  it("muestra el texto de la agencia, sin cartel de borrador y sin scripts", async () => {
    get.mockResolvedValue({
      html: `<h2>Mi política</h2><p>Contenido propio</p><img src=x onerror="window.__pwned=1">`,
      updatedAt: "2026-10-09T12:00:00.000Z",
    });
    const { container } = renderView();
    expect(await screen.findByText("Contenido propio")).toBeInTheDocument();
    expect(screen.queryByText("Texto base")).not.toBeInTheDocument();
    expect(screen.queryByText(/Borrador/)).not.toBeInTheDocument();
    expect(container.querySelector("img")?.getAttribute("onerror")).toBeNull();
  });

  it("si la lectura falla, cae al texto base", async () => {
    get.mockReturnValue(new Error("boom"));
    renderView();
    expect(await screen.findByText("Texto base")).toBeInTheDocument();
  });
});
