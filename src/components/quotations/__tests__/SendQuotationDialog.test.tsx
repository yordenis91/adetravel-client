import { describe, it, expect, vi, afterEach } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { api } from "@/lib/api";

// Enviar la cotización por correo: borrador editable, destinatarios, envío y errores honestos.
const toast = vi.fn();
vi.mock("@/hooks/use-toast", () => ({ useToast: () => ({ toast }) }));

import { SendQuotationDialog } from "../SendQuotationDialog";

const QUOTATION = { id: "q1", quotationNumber: "COTIZ-1" };
const DRAFT = {
  data: {
    recipients: { primary: "ana@x.cl", additional: ["conta@x.cl"] },
    subject: "Cotización COTIZ-1 — ADE Travel",
    message: "Hola Ana,\n\nTe enviamos la cotización.",
    attachmentName: "COTIZ-1.pdf",
    deliveryMode: "live",
    status: "BORRADOR",
  },
};

function setup(overrides: Record<string, unknown> = {}) {
  vi.spyOn(api, "get").mockResolvedValue({ data: { ...DRAFT.data, ...overrides } });
  const onSent = vi.fn();
  const onOpenChange = vi.fn();
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  render(
    <QueryClientProvider client={qc}>
      <SendQuotationDialog open onOpenChange={onOpenChange} quotation={QUOTATION} onSent={onSent} />
    </QueryClientProvider>
  );
  return { onSent, onOpenChange };
}

const sendButton = () => screen.getByRole("button", { name: /^(Enviar|Reenviar)$/ });

afterEach(() => { vi.restoreAllMocks(); toast.mockClear(); });

describe("SendQuotationDialog", () => {
  it("prepara el correo: principal marcado, adicionales sin marcar, asunto y mensaje editables y el PDF adjunto", async () => {
    setup();
    expect(screen.getByText("Preparando el correo…")).toBeInTheDocument();
    expect(await screen.findByLabelText("Asunto")).toHaveValue("Cotización COTIZ-1 — ADE Travel");
    expect(screen.getByLabelText("Mensaje")).toHaveValue("Hola Ana,\n\nTe enviamos la cotización.");
    expect(screen.getByRole("checkbox", { name: /ana@x\.cl/ })).toBeChecked();
    expect(screen.getByRole("checkbox", { name: /conta@x\.cl/ })).not.toBeChecked();
    expect(screen.getByText("Principal")).toBeInTheDocument();
    expect(screen.getByText("COTIZ-1.pdf")).toBeInTheDocument();
    expect(api.get).toHaveBeenCalledWith("/quotations/q1/email-draft");
  });

  it("envía lo que la persona editó a los destinatarios elegidos, avisa y cierra", async () => {
    const post = vi.spyOn(api, "post").mockResolvedValue({ data: { sent: true, recipients: 2, statusChanged: true } });
    const { onSent, onOpenChange } = setup();
    await screen.findByLabelText("Asunto");
    fireEvent.click(screen.getByRole("checkbox", { name: /conta@x\.cl/ }));
    fireEvent.change(screen.getByLabelText("Asunto"), { target: { value: "  Propuesta de viaje  " } });
    fireEvent.change(screen.getByLabelText("Mensaje"), { target: { value: "Hola, aquí va la propuesta." } });
    fireEvent.click(sendButton());

    await waitFor(() => expect(onSent).toHaveBeenCalledWith({ sent: true, recipients: 2, statusChanged: true, quotationId: "q1" }));
    expect(post).toHaveBeenCalledWith("/quotations/q1/send", {
      to: ["ana@x.cl", "conta@x.cl"], subject: "Propuesta de viaje", message: "Hola, aquí va la propuesta.",
    });
    expect(toast).toHaveBeenCalledWith(expect.objectContaining({ title: "Cotización enviada", description: expect.stringContaining("Enviada") }));
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("permite agregar otro correo, lo valida y lo incluye en el envío", async () => {
    const post = vi.spyOn(api, "post").mockResolvedValue({ data: { sent: true, recipients: 2, statusChanged: false } });
    setup();
    await screen.findByLabelText("Asunto");
    const input = screen.getByLabelText("Agregar otro destinatario");
    fireEvent.change(input, { target: { value: "no-es-correo" } });
    fireEvent.click(screen.getByRole("button", { name: /Agregar/ }));
    expect(screen.getByText("Correo inválido")).toBeInTheDocument();

    fireEvent.change(input, { target: { value: "ANA@x.cl" } });
    fireEvent.click(screen.getByRole("button", { name: /Agregar/ }));
    expect(screen.getByText("Ese correo ya está en la lista")).toBeInTheDocument();

    fireEvent.change(input, { target: { value: "socio@y.cl" } });
    fireEvent.keyDown(input, { key: "Enter" });
    expect(screen.getByRole("checkbox", { name: /socio@y\.cl/ })).toBeChecked();
    fireEvent.click(sendButton());
    await waitFor(() => expect(post).toHaveBeenCalled());
    expect((post.mock.calls[0][1] as { to: string[] }).to).toEqual(["ana@x.cl", "socio@y.cl"]);
  });

  it("sin destinatarios, o con asunto o mensaje vacíos, no se puede enviar", async () => {
    setup();
    await screen.findByLabelText("Asunto");
    expect(sendButton()).toBeEnabled();
    fireEvent.click(screen.getByRole("checkbox", { name: /ana@x\.cl/ }));
    expect(sendButton()).toBeDisabled();
    fireEvent.click(screen.getByRole("checkbox", { name: /ana@x\.cl/ }));
    fireEvent.change(screen.getByLabelText("Asunto"), { target: { value: "   " } });
    expect(sendButton()).toBeDisabled();
    fireEvent.change(screen.getByLabelText("Asunto"), { target: { value: "ok" } });
    fireEvent.change(screen.getByLabelText("Mensaje"), { target: { value: "" } });
    expect(sendButton()).toBeDisabled();
  });

  it("si el API rechaza el envío muestra el motivo, deja el diálogo abierto y permite reintentar", async () => {
    const post = vi.spyOn(api, "post")
      .mockRejectedValueOnce(new Error(JSON.stringify({ error: "El correo (SMTP) no está configurado: ve a Configuración > Email. No se envió nada." })))
      .mockResolvedValueOnce({ data: { sent: true, recipients: 1, statusChanged: true } });
    const { onSent, onOpenChange } = setup();
    await screen.findByLabelText("Asunto");
    fireEvent.click(sendButton());
    expect(await screen.findByRole("alert")).toHaveTextContent("SMTP) no está configurado");
    expect(onSent).not.toHaveBeenCalled();
    expect(onOpenChange).not.toHaveBeenCalledWith(false);
    fireEvent.click(sendButton());
    await waitFor(() => expect(onSent).toHaveBeenCalled());
    expect(post).toHaveBeenCalledTimes(2);
  });

  it("con el envío desactivado en el entorno lo avisa y no deja enviar", async () => {
    setup({ deliveryMode: "off" });
    expect(await screen.findByText(/desactivado en este entorno/)).toBeInTheDocument();
    expect(sendButton()).toBeDisabled();
  });

  it("en modo demostración avisa que el correo no llegará al cliente, pero deja enviar", async () => {
    setup({ deliveryMode: "redirect" });
    expect(await screen.findByText(/Modo demostración/)).toBeInTheDocument();
    expect(sendButton()).toBeEnabled();
  });

  it("si ya fue enviada es un reenvío: lo explica y el botón dice Reenviar", async () => {
    setup({ status: "ENVIADA" });
    expect(await screen.findByText(/es un reenvío y el estado no cambia/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Reenviar" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Reenviar cotización" })).toBeInTheDocument();
  });

  it("si el cliente no tiene correo, lo dice y obliga a agregar uno", async () => {
    setup({ recipients: { primary: null, additional: [] } });
    expect(await screen.findByText(/no tiene un correo principal/)).toBeInTheDocument();
    expect(sendButton()).toBeDisabled();
  });

  it("'Restablecer' devuelve el asunto y el mensaje originales", async () => {
    setup();
    await screen.findByLabelText("Asunto");
    fireEvent.change(screen.getByLabelText("Mensaje"), { target: { value: "otra cosa" } });
    fireEvent.click(screen.getByRole("button", { name: /Restablecer/ }));
    expect(screen.getByLabelText("Mensaje")).toHaveValue("Hola Ana,\n\nTe enviamos la cotización.");
  });

  it("si no se puede preparar el correo, muestra el error", async () => {
    vi.spyOn(api, "get").mockRejectedValue(new Error(JSON.stringify({ error: "Cotización no encontrada" })));
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <QueryClientProvider client={qc}>
        <SendQuotationDialog open onOpenChange={() => {}} quotation={QUOTATION} onSent={() => {}} />
      </QueryClientProvider>
    );
    expect(await screen.findByRole("alert")).toHaveTextContent("Cotización no encontrada");
  });
});
