import { describe, it, expect, vi, afterEach } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { ApiError, api } from "@/lib/api";
import type { PublicQuotationData } from "@/lib/quotationOnline";

// Página pública de la cotización (la ve el cliente final): estados, aceptar (solo avisa), consultas, renovar y PDF.
import PublicQuotationPage from "../PublicQuotation";

const AGENCY = { name: "Viajes Sur", email: "hola@viajessur.cl", phone: "+56 9 1234 5678", website: "viajessur.cl", logoUrl: null };
const OPEN: PublicQuotationData = {
  state: "open", quotationNumber: "COTIZ-7", clientFirstName: "Ana", agentName: "Camila Rojas", validUntil: "2099-12-31", agency: AGENCY,
  destination: "Cancún, México", currency: "CLP",
  items: [{ service: "Hotel", description: "3 noches", quantity: 1, unitPrice: 100000, total: 100000 }, { service: "Traslado", description: "", quantity: 2, unitPrice: 20000, total: 40000 }],
  subtotal: 140000, discount: 10000, taxPercentage: 19, taxAmount: 24700, total: 154700,
  notes: "Incluye desayuno", termsAndConditions: "No reembolsable", createdAt: "2026-10-01T00:00:00Z", canAccept: true, acceptanceRequested: false,
};

function mockGet(data: PublicQuotationData | Error) {
  return vi.spyOn(api, "get").mockImplementation(async () => { if (data instanceof Error) throw data; return { data }; });
}

function setup() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  render(
    <HelmetProvider>
      <QueryClientProvider client={qc}>
        <MemoryRouter initialEntries={["/c/CODIGO123"]}>
          <Routes><Route path="/c/:code" element={<PublicQuotationPage />} /></Routes>
        </MemoryRouter>
      </QueryClientProvider>
    </HelmetProvider>
  );
}

afterEach(() => vi.restoreAllMocks());

describe("PublicQuotation", () => {
  it("muestra la cotización: saludo, agente, servicios, descuento, IVA, total, notas y términos; pide los datos del enlace", async () => {
    const get = mockGet(OPEN);
    setup();
    expect(await screen.findByRole("heading", { name: "Camila Rojas te preparó esta cotización" })).toBeInTheDocument();
    expect(get).toHaveBeenCalledWith("/public/quotations/CODIGO123");
    expect(screen.getByText("Hola Ana,")).toBeInTheDocument();
    expect(screen.getByText("COTIZ-7")).toBeInTheDocument();
    expect(screen.getByText("Cancún, México")).toBeInTheDocument();
    expect(screen.getByText("31/12/2099")).toBeInTheDocument();
    expect(screen.getAllByText("Hotel").length).toBeGreaterThan(0);
    expect(screen.getByLabelText("Totales")).toHaveTextContent("$154.700");
    expect(screen.getByLabelText("Totales")).toHaveTextContent("Descuento");
    expect(screen.getByText("Incluye desayuno")).toBeInTheDocument();
    expect(screen.getByText("No reembolsable")).toBeInTheDocument();
    expect(screen.getByText(/No guardamos tu dirección IP/)).toBeInTheDocument();
    expect(screen.getAllByText("Viajes Sur").length).toBeGreaterThan(0);
  });

  it("aceptar: pide confirmación, explica que no hay cobro y avisa; después muestra que se recibió", async () => {
    mockGet(OPEN);
    const post = vi.spyOn(api, "post").mockResolvedValue({ data: { requested: true } });
    setup();
    fireEvent.click(await screen.findByRole("button", { name: /Quiero aceptar esta cotización/ }));
    expect(screen.getByText(/Todavía no se hace ningún cobro/)).toBeInTheDocument();
    expect(post).not.toHaveBeenCalled();
    fireEvent.change(screen.getByLabelText(/Tu nombre/), { target: { value: " Ana P. " } });
    fireEvent.click(screen.getByRole("button", { name: "Sí, quiero aceptar" }));
    await waitFor(() => expect(post).toHaveBeenCalledWith("/public/quotations/CODIGO123/accept", { contactName: "Ana P." }));
    expect(await screen.findByText("¡Recibimos tu solicitud!")).toBeInTheDocument();
  });

  it("si ya pidió aceptar, no vuelve a ofrecer el botón y lo dice", async () => {
    mockGet({ ...OPEN, canAccept: false, acceptanceRequested: true });
    setup();
    expect(await screen.findByText(/Recibimos tu solicitud de aceptar/)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Quiero aceptar/ })).not.toBeInTheDocument();
  });

  it("una consulta es obligatoria de escribir y se envía con el nombre", async () => {
    mockGet(OPEN);
    const post = vi.spyOn(api, "post").mockResolvedValue({ data: { sent: true } });
    setup();
    fireEvent.click(await screen.findByRole("button", { name: /Tengo una consulta/ }));
    const send = screen.getByRole("button", { name: "Enviar" });
    expect(send).toBeDisabled();
    fireEvent.change(screen.getByLabelText("Tu consulta"), { target: { value: "  ¿Incluye traslados?  " } });
    fireEvent.change(screen.getByLabelText(/Tu nombre/), { target: { value: "Ana" } });
    expect(send).toBeEnabled();
    fireEvent.click(send);
    await waitFor(() => expect(post).toHaveBeenCalledWith("/public/quotations/CODIGO123/question", { message: "¿Incluye traslados?", contactName: "Ana" }));
    expect(await screen.findByText("Consulta enviada")).toBeInTheDocument();
  });

  it("si el envío falla muestra el motivo y deja reintentar sin cerrar", async () => {
    mockGet(OPEN);
    vi.spyOn(api, "post").mockRejectedValue(new Error(JSON.stringify({ error: "Ya enviaste varios mensajes hoy." })));
    setup();
    fireEvent.click(await screen.findByRole("button", { name: /Tengo una consulta/ }));
    fireEvent.change(screen.getByLabelText("Tu consulta"), { target: { value: "hola" } });
    fireEvent.click(screen.getByRole("button", { name: "Enviar" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Ya enviaste varios mensajes hoy.");
    expect(screen.getByLabelText("Tu consulta")).toBeInTheDocument();
  });

  it("cotización vencida: no muestra precios, ofrece pedir una actualizada y WhatsApp", async () => {
    mockGet({ state: "expired", quotationNumber: "COTIZ-7", clientFirstName: "Ana", agentName: "Camila Rojas", validUntil: "2020-01-31", agency: AGENCY });
    const post = vi.spyOn(api, "post").mockResolvedValue({ data: { sent: true } });
    setup();
    expect(await screen.findByRole("heading", { name: "La cotización COTIZ-7 venció" })).toBeInTheDocument();
    expect(screen.getByText(/hasta el 31\/01\/2020/)).toBeInTheDocument();
    expect(screen.queryByText(/\$/)).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: /WhatsApp/ })).toHaveAttribute("href", expect.stringContaining("https://wa.me/56912345678"));
    fireEvent.click(screen.getByRole("button", { name: "Pedir una cotización actualizada" }));
    fireEvent.change(screen.getByLabelText(/Mensaje/), { target: { value: "Sigo interesada" } });
    fireEvent.click(screen.getByRole("button", { name: "Enviar" }));
    await waitFor(() => expect(post).toHaveBeenCalledWith("/public/quotations/CODIGO123/renew", { message: "Sigo interesada", contactName: undefined }));
    expect(await screen.findByText("Solicitud enviada")).toBeInTheDocument();
  });

  it("cotización cerrada (rechazada): no hay precios ni acciones, solo cómo contactar", async () => {
    mockGet({ state: "closed", quotationNumber: "COTIZ-7", clientFirstName: "Ana", agentName: null, validUntil: null, agency: AGENCY });
    setup();
    expect(await screen.findByRole("heading", { name: "Esta cotización ya no está disponible" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /hola@viajessur\.cl/ })).toHaveAttribute("href", "mailto:hola@viajessur.cl");
    expect(screen.queryByRole("button", { name: /aceptar/i })).not.toBeInTheDocument();
  });

  it("cotización aceptada: se ve completa, con aviso, sin botón de aceptar", async () => {
    mockGet({ ...OPEN, state: "accepted", canAccept: false });
    setup();
    expect(await screen.findByText(/Esta cotización fue aceptada/)).toBeInTheDocument();
    expect(screen.getByLabelText("Totales")).toHaveTextContent("$154.700");
    expect(screen.queryByRole("button", { name: /Quiero aceptar/ })).not.toBeInTheDocument();
  });

  it("enlace desconocido, vencido o revocado: mensaje amable sin revelar el motivo, y sin botón de reintento", async () => {
    mockGet(new ApiError(404, JSON.stringify({ code: "LINK_NOT_FOUND" })));
    setup();
    expect(await screen.findByRole("heading", { name: "Este enlace no está disponible" })).toBeInTheDocument();
    expect(screen.getByText(/Pídele que te envíe uno nuevo/)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Reintentar" })).not.toBeInTheDocument();
  });

  it("un fallo de red o del servidor ofrece reintentar", async () => {
    const get = mockGet(new ApiError(500, "{}"));
    setup();
    expect(await screen.findByRole("heading", { name: "No pudimos cargar la cotización" })).toBeInTheDocument();
    get.mockResolvedValue({ data: OPEN });
    fireEvent.click(screen.getByRole("button", { name: "Reintentar" }));
    expect(await screen.findByRole("heading", { name: /te preparó esta cotización/ })).toBeInTheDocument();
  });

  it("descargar el PDF pide el archivo al enlace público", async () => {
    mockGet(OPEN);
    const blob = vi.spyOn(api, "getBlob").mockResolvedValue(new Blob(["%PDF"], { type: "application/pdf" }));
    Object.assign(URL, { createObjectURL: vi.fn(() => "blob:x"), revokeObjectURL: vi.fn() });
    const click = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
    setup();
    fireEvent.click(await screen.findByRole("button", { name: /Descargar PDF/ }));
    await waitFor(() => expect(blob).toHaveBeenCalledWith("/public/quotations/CODIGO123/pdf"));
    await waitFor(() => expect(click).toHaveBeenCalled());
  });
});
