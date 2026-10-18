import { describe, it, expect, vi, afterEach } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { api } from "@/lib/api";

// Correos adicionales del cliente: se cargan al editar, se agregan y quitan, se validan y se
// envían limpios (también la lista vacía, para poder quitarlos todos).

vi.mock("@/hooks/use-toast", () => ({ useToast: () => ({ toast: vi.fn() }) }));
vi.mock("@/hooks/useCatalogs", () => ({ useCatalog: () => ({ data: [] }) }));

import { ClientFormDialog } from "../ClientFormDialog";

const CLIENT = { id: "c1", firstName: "Lucía", lastName: "Navarro", email: "lucia@example.test", additionalEmails: ["conta@example.test", "viajes@example.test"] };

function renderDialog(client?: unknown, onSuccess = vi.fn()) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={qc}>
      <ClientFormDialog open onOpenChange={() => {}} client={client} onSuccess={onSuccess} />
    </QueryClientProvider>
  );
  return onSuccess;
}

afterEach(() => vi.restoreAllMocks());

describe("ClientFormDialog: correos adicionales", () => {
  it("al editar carga los correos adicionales del cliente", async () => {
    renderDialog(CLIENT);
    expect(await screen.findByDisplayValue("conta@example.test")).toBeInTheDocument();
    expect(screen.getByDisplayValue("viajes@example.test")).toBeInTheDocument();
  });

  it("al guardar envía la lista limpia (sin filas vacías) junto con los demás datos", async () => {
    const patch = vi.spyOn(api, "patch").mockResolvedValue({ data: {} });
    const onSuccess = renderDialog(CLIENT);
    fireEvent.click(await screen.findByRole("button", { name: /Agregar correo/ })); // fila vacía que no debe viajar
    fireEvent.change(screen.getByLabelText("Correo adicional 1"), { target: { value: "  nuevo@example.test " } });
    fireEvent.click(screen.getByRole("button", { name: "Quitar correo adicional 2" }));
    fireEvent.click(screen.getByRole("button", { name: /Agregar correo/ }));
    fireEvent.click(screen.getByRole("button", { name: "Guardar Cambios" }));
    await waitFor(() => expect(patch).toHaveBeenCalled());
    const [url, body] = patch.mock.calls[0] as [string, { additionalEmails: string[]; firstName: string }];
    expect(url).toBe("/clients/c1");
    expect(body.additionalEmails).toEqual(["nuevo@example.test"]);
    expect(body.firstName).toBe("Lucía");
    await waitFor(() => expect(onSuccess).toHaveBeenCalled());
  });

  it("un correo adicional mal escrito frena el guardado y se señala en su fila", async () => {
    const patch = vi.spyOn(api, "patch").mockResolvedValue({ data: {} });
    renderDialog(CLIENT);
    fireEvent.change(await screen.findByLabelText("Correo adicional 1"), { target: { value: "no-es-correo" } });
    fireEvent.click(screen.getByRole("button", { name: "Guardar Cambios" }));
    expect(await screen.findByText("Correo inválido")).toBeInTheDocument();
    expect(patch).not.toHaveBeenCalled();
  });

  it("se pueden quitar todos y se guarda la lista vacía", async () => {
    const patch = vi.spyOn(api, "patch").mockResolvedValue({ data: {} });
    renderDialog(CLIENT);
    fireEvent.click(await screen.findByRole("button", { name: "Quitar correo adicional 2" }));
    fireEvent.click(screen.getByRole("button", { name: "Quitar correo adicional 1" }));
    fireEvent.click(screen.getByRole("button", { name: "Guardar Cambios" }));
    await waitFor(() => expect(patch).toHaveBeenCalled());
    expect((patch.mock.calls[0][1] as { additionalEmails: string[] }).additionalEmails).toEqual([]);
  });

  it("al crear un cliente nuevo parte sin correos adicionales y los envía si se agregan", async () => {
    const post = vi.spyOn(api, "post").mockResolvedValue({ data: {} });
    renderDialog(undefined);
    expect(screen.queryByLabelText(/Correo adicional/)).toBeNull();
    fireEvent.change(await screen.findByPlaceholderText("Ej: Juan Pablo"), { target: { value: "Juan" } });
    fireEvent.change(screen.getByPlaceholderText("Ej: Pérez González"), { target: { value: "Pérez" } });
    fireEvent.click(screen.getByRole("button", { name: /Agregar correo/ }));
    fireEvent.change(screen.getByLabelText("Correo adicional 1"), { target: { value: "otro@example.test" } });
    fireEvent.click(screen.getByRole("button", { name: "Crear Cliente" }));
    await waitFor(() => expect(post).toHaveBeenCalled());
    expect((post.mock.calls[0][1] as { additionalEmails: string[] }).additionalEmails).toEqual(["otro@example.test"]);
  });
});
