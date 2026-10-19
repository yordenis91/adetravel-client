import React from "react";
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { api } from "@/lib/api";

vi.mock("framer-motion", () => ({
  motion: { div: ({ children }: { children?: React.ReactNode }) => <div>{children}</div> },
  AnimatePresence: ({ children }: { children?: React.ReactNode }) => <>{children}</>,
}));
const toast = vi.fn();
vi.mock("@/hooks/use-toast", () => ({ useToast: () => ({ toast }) }));

import { BirthdayReminder } from "../BirthdayReminder";

const today = new Date();
const birthDate = `1990-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
const ana = { id: "11111111-1111-4111-8111-111111111111", firstName: "Ana", lastName: "Pérez", email: "ana@example.com", birthDate, lastBirthdayEmailYear: null };

const previewOf = (message?: string) => ({
  data: { subject: "¡Feliz cumpleaños, Ana! 🎂", html: `<p>${message ?? "Saludo de la plantilla"}</p>`, message: message ?? "Saludo de la plantilla" },
});

function setup(sendResponse: object = { sent: 1, skipped: 0, failed: 0 }) {
  vi.spyOn(api, "get").mockResolvedValue({ data: [ana] } as never);
  const post = vi.spyOn(api, "post").mockImplementation(async (path: string, body?: { message?: string }) => {
    if (path === "/clients/birthday/preview") return previewOf(body?.message) as never;
    return sendResponse as never;
  });
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(<QueryClientProvider client={client}><BirthdayReminder /></QueryClientProvider>);
  return post;
}

afterEach(() => { vi.restoreAllMocks(); toast.mockClear(); });

const openPreview = async () => {
  fireEvent.click(await screen.findByRole("button", { name: "Vista previa del saludo" }));
  await screen.findByLabelText(/Mensaje para Ana/);
};

describe("BirthdayReminder: felicitación con la plantilla de Configuración", () => {
  it("la vista previa viene del servidor (plantilla activa) y muestra su asunto y saludo", async () => {
    const post = setup();
    await openPreview();
    await waitFor(() => expect((screen.getByLabelText(/Mensaje para Ana/) as HTMLTextAreaElement).value).toBe("Saludo de la plantilla"));
    expect(screen.getByText("¡Feliz cumpleaños, Ana! 🎂")).toBeInTheDocument();
    expect(post).toHaveBeenCalledWith("/clients/birthday/preview", { clientId: ana.id });
    const frame = screen.getByTitle("Vista previa del correo") as HTMLIFrameElement;
    expect(frame.getAttribute("sandbox")).toBe("");
    expect(frame.getAttribute("srcdoc")).toContain("Saludo de la plantilla");
  });

  it("sin editar no manda mensaje propio: se usa el de la plantilla", async () => {
    const post = setup();
    await openPreview();
    await waitFor(() => expect((screen.getByLabelText(/Mensaje para Ana/) as HTMLTextAreaElement).value).not.toBe(""));
    fireEvent.click(screen.getByRole("button", { name: /Enviar Ahora/ }));
    await waitFor(() => expect(post).toHaveBeenCalledWith("/clients/birthday", { clientIds: [ana.id] }));
  });

  it("el saludo editado actualiza la vista previa y se envía solo para ese cliente", async () => {
    const post = setup();
    await openPreview();
    await waitFor(() => expect((screen.getByLabelText(/Mensaje para Ana/) as HTMLTextAreaElement).value).not.toBe(""));
    fireEvent.change(screen.getByLabelText(/Mensaje para Ana/), { target: { value: "Ana, ¡a Cusco!" } });
    await waitFor(() => expect(post).toHaveBeenCalledWith("/clients/birthday/preview", { clientId: ana.id, message: "Ana, ¡a Cusco!" }));
    await waitFor(() => expect(screen.getByTitle("Vista previa del correo").getAttribute("srcdoc")).toContain("Ana, ¡a Cusco!"));
    fireEvent.click(screen.getByRole("button", { name: /Enviar Ahora/ }));
    await waitFor(() => expect(post).toHaveBeenCalledWith("/clients/birthday", { clientIds: [ana.id], messages: { [ana.id]: "Ana, ¡a Cusco!" } }));
    await waitFor(() => expect(toast).toHaveBeenCalledWith(expect.objectContaining({ title: "¡Correo enviado!" })));
  });

  it("'Restablecer' vuelve al saludo de la plantilla", async () => {
    setup();
    await openPreview();
    await waitFor(() => expect((screen.getByLabelText(/Mensaje para Ana/) as HTMLTextAreaElement).value).toBe("Saludo de la plantilla"));
    fireEvent.change(screen.getByLabelText(/Mensaje para Ana/), { target: { value: "Otro" } });
    fireEvent.click(screen.getByRole("button", { name: /Restablecer/ }));
    expect((screen.getByLabelText(/Mensaje para Ana/) as HTMLTextAreaElement).value).toBe("Saludo de la plantilla");
  });

  it("si el correo no salió lo dice, en vez de anunciar éxito", async () => {
    setup({ sent: 0, skipped: 0, failed: 1 });
    fireEvent.click(await screen.findByRole("button", { name: "Enviar saludo de cumpleaños" }));
    await waitFor(() => expect(toast).toHaveBeenCalledWith(expect.objectContaining({ variant: "destructive", title: "El correo no salió" })));
  });
});
