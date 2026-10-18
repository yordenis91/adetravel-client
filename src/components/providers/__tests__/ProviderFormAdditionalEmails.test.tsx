import { describe, it, expect, vi, afterEach } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { api } from "@/lib/api";

vi.mock("@/hooks/use-toast", () => ({ useToast: () => ({ toast: vi.fn() }) }));
vi.mock("@/hooks/useCatalogs", () => ({ useCatalog: () => ({ data: [] }), useCitiesForCountry: () => ({ cities: [], countryKnown: false }) }));

import { ProviderFormDialog } from "../ProviderFormDialog";

const PROVIDER = { id: "p1", name: "Hotel Andes", email: "central@andes.test", additionalEmails: ["pagos@andes.test"] };

function renderDialog(provider?: unknown) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={qc}>
      <ProviderFormDialog open onOpenChange={() => {}} provider={provider} onSuccess={() => {}} />
    </QueryClientProvider>
  );
}

afterEach(() => vi.restoreAllMocks());

describe("ProviderFormDialog: correos adicionales", () => {
  it("carga los del proveedor, permite agregar y quitar, y envía la lista limpia", async () => {
    const patch = vi.spyOn(api, "patch").mockResolvedValue({ data: {} });
    renderDialog(PROVIDER);
    expect(await screen.findByDisplayValue("pagos@andes.test")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Agregar correo/ }));
    fireEvent.change(screen.getByLabelText("Correo adicional 2"), { target: { value: " gerencia@andes.test " } });
    fireEvent.click(screen.getByRole("button", { name: /Agregar correo/ })); // fila vacía: no viaja
    fireEvent.click(screen.getByRole("button", { name: "Guardar Cambios" }));
    await waitFor(() => expect(patch).toHaveBeenCalled());
    const [url, body] = patch.mock.calls[0] as [string, { additionalEmails: string[]; name: string }];
    expect(url).toBe("/providers/p1");
    expect(body.additionalEmails).toEqual(["pagos@andes.test", "gerencia@andes.test"]);
    expect(body.name).toBe("Hotel Andes");
  });

  it("un correo adicional mal escrito frena el guardado", async () => {
    const patch = vi.spyOn(api, "patch").mockResolvedValue({ data: {} });
    renderDialog(PROVIDER);
    fireEvent.change(await screen.findByLabelText("Correo adicional 1"), { target: { value: "malo" } });
    fireEvent.click(screen.getByRole("button", { name: "Guardar Cambios" }));
    expect(await screen.findByText("Correo inválido")).toBeInTheDocument();
    expect(patch).not.toHaveBeenCalled();
  });

  it("quitar todos guarda la lista vacía", async () => {
    const patch = vi.spyOn(api, "patch").mockResolvedValue({ data: {} });
    renderDialog(PROVIDER);
    fireEvent.click(await screen.findByRole("button", { name: "Quitar correo adicional 1" }));
    fireEvent.click(screen.getByRole("button", { name: "Guardar Cambios" }));
    await waitFor(() => expect(patch).toHaveBeenCalled());
    expect((patch.mock.calls[0][1] as { additionalEmails: string[] }).additionalEmails).toEqual([]);
  });
});
