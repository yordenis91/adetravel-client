import { describe, it, expect, vi, afterEach } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { api } from "@/lib/api";

// Seguimiento en línea del agente: aperturas, aceptación pedida, enlace (copiar/regenerar/revocar) y envíos programados.
const toast = vi.fn();
vi.mock("@/hooks/use-toast", () => ({ useToast: () => ({ toast }) }));
let permissions = ["MANAGE_QUOTATIONS"];
vi.mock("@/context/AuthContext", () => ({ useAuth: () => ({ hasPermission: (p: string) => permissions.includes(p) }) }));

import { QuotationOnlinePanel } from "../QuotationOnlinePanel";

const hoursAgo = (h: number) => new Date(Date.now() - h * 3_600_000).toISOString();
const LINK = {
  url: "https://app.ejemplo.cl/c/abc123", createdAt: hoursAgo(72), expiresAt: new Date(Date.now() + 20 * 86_400_000).toISOString(),
  firstViewedAt: hoursAgo(48), lastViewedAt: hoursAgo(2), viewCount: 3, acceptanceRequestedAt: null,
  events: [
    { id: "e2", type: "QUESTION", device: "mobile", contactName: "Ana", message: "¿Incluye traslados?", createdAt: hoursAgo(2) },
    { id: "e1", type: "VIEW", device: "desktop", contactName: null, message: null, createdAt: hoursAgo(48) },
  ],
};

function mockApi({ link = LINK as typeof LINK | null, scheduled = [] as unknown[] } = {}) {
  const get = vi.spyOn(api, "get").mockImplementation(async (path: string) => {
    if (path.endsWith("/link")) return { data: { link } };
    if (path.endsWith("/scheduled")) return { data: scheduled };
    throw new Error(`GET inesperado ${path}`);
  });
  return get;
}

function setup(status = "Enviada", props: Partial<{ onConfirmAcceptance: () => void }> = {}) {
  const onConfirmAcceptance = props.onConfirmAcceptance ?? vi.fn();
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  render(
    <QueryClientProvider client={qc}>
      <QuotationOnlinePanel quotationId="q1" status={status} onConfirmAcceptance={onConfirmAcceptance} />
    </QueryClientProvider>
  );
  return { onConfirmAcceptance };
}

afterEach(() => { vi.restoreAllMocks(); toast.mockClear(); permissions = ["MANAGE_QUOTATIONS"]; });

describe("QuotationOnlinePanel", () => {
  it("muestra aperturas, primera y última vez, el enlace y la línea de actividad", async () => {
    mockApi();
    setup();
    expect(await screen.findByText("https://app.ejemplo.cl/c/abc123")).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();
    expect(screen.getAllByText(/hace 2 días/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/hace alrededor de 2 horas|hace 2 horas/).length).toBeGreaterThan(0);
    expect(screen.getByText("Dejó una consulta (Ana): «¿Incluye traslados?»")).toBeInTheDocument();
    expect(screen.getByText("Abrió la cotización desde un computador")).toBeInTheDocument();
    expect(screen.getByText(/no cuentan como visitas/)).toBeInTheDocument();
  });

  it("no se muestra en una cotización en Borrador", () => {
    const get = mockApi();
    setup("Borrador");
    expect(screen.queryByLabelText("Seguimiento en línea")).not.toBeInTheDocument();
    expect(get).not.toHaveBeenCalledWith("/quotations/q1/link");
  });

  it("sin abrir: lo dice con claridad", async () => {
    mockApi({ link: { ...LINK, viewCount: 0, firstViewedAt: null, lastViewedAt: null, events: [] } });
    setup();
    expect(await screen.findByText("Aún sin abrir")).toBeInTheDocument();
  });

  it("copiar el enlace lo pone en el portapapeles y avisa", async () => {
    mockApi();
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", { value: { writeText }, configurable: true });
    setup();
    fireEvent.click(await screen.findByRole("button", { name: "Copiar enlace" }));
    await waitFor(() => expect(writeText).toHaveBeenCalledWith("https://app.ejemplo.cl/c/abc123"));
    expect(toast).toHaveBeenCalledWith(expect.objectContaining({ title: "Enlace copiado" }));
  });

  it("si el cliente pidió aceptar lo destaca y el agente puede confirmar", async () => {
    mockApi({ link: { ...LINK, acceptanceRequestedAt: hoursAgo(1) } });
    const { onConfirmAcceptance } = setup();
    expect(await screen.findByText(/El cliente pidió aceptar esta cotización/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Confirmar aceptación" }));
    expect(onConfirmAcceptance).toHaveBeenCalled();
  });

  it("si la cotización ya está Aceptada no ofrece confirmar de nuevo", async () => {
    mockApi({ link: { ...LINK, acceptanceRequestedAt: hoursAgo(1) } });
    setup("Aceptada");
    await screen.findByText("https://app.ejemplo.cl/c/abc123");
    expect(screen.queryByRole("button", { name: "Confirmar aceptación" })).not.toBeInTheDocument();
  });

  it("regenerar pide confirmación y avisa que el enlace anterior deja de funcionar", async () => {
    mockApi();
    const post = vi.spyOn(api, "post").mockResolvedValue({ data: { link: LINK } });
    setup();
    fireEvent.click(await screen.findByRole("button", { name: /Regenerar enlace/ }));
    expect(screen.getByText(/dejará de funcionar/)).toBeInTheDocument();
    expect(post).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Regenerar" }));
    await waitFor(() => expect(post).toHaveBeenCalledWith("/quotations/q1/link/regenerate"));
    await waitFor(() => expect(toast).toHaveBeenCalledWith(expect.objectContaining({ title: "Enlace nuevo creado" })));
  });

  it("revocar pide confirmación y llama al API", async () => {
    mockApi();
    const del = vi.spyOn(api, "delete").mockResolvedValue({ data: { revoked: 1 } });
    setup();
    fireEvent.click(await screen.findByRole("button", { name: /Revocar/ }));
    fireEvent.click(screen.getAllByRole("button", { name: "Revocar" }).at(-1)!);
    await waitFor(() => expect(del).toHaveBeenCalledWith("/quotations/q1/link"));
  });

  it("enviada sin enlace (p. ej. por WhatsApp): permite crear uno para compartir", async () => {
    mockApi({ link: null });
    const post = vi.spyOn(api, "post").mockResolvedValue({ data: { link: LINK } });
    setup();
    expect(await screen.findByText(/se envió sin enlace en línea/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Crear enlace para compartir/ }));
    await waitFor(() => expect(post).toHaveBeenCalledWith("/quotations/q1/link"));
  });

  it("sin permiso de gestionar solo se mira: no hay crear, regenerar, revocar ni cancelar", async () => {
    permissions = [];
    mockApi();
    setup();
    await screen.findByText("https://app.ejemplo.cl/c/abc123");
    expect(screen.queryByRole("button", { name: /Regenerar/ })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Revocar/ })).not.toBeInTheDocument();
  });

  it("muestra los envíos programados y permite cancelarlos", async () => {
    mockApi({ link: null, scheduled: [{ id: "s1", sendAt: new Date(Date.now() + 86_400_000).toISOString(), status: "PENDIENTE", attempts: 0, lastError: null }] });
    const del = vi.spyOn(api, "delete").mockResolvedValue({ data: { ok: true } });
    setup("Borrador");
    expect(await screen.findByText(/Envío programado para el/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Cancelar envío" }));
    await waitFor(() => expect(del).toHaveBeenCalledWith("/quotations/q1/scheduled/s1"));
  });

  it("un envío programado que falló lo explica", async () => {
    mockApi({ link: null, scheduled: [{ id: "s1", sendAt: hoursAgo(1), status: "FALLIDO", attempts: 3, lastError: "La cotización venció" }] });
    setup("Borrador");
    expect(await screen.findByText(/no salió: La cotización venció/)).toBeInTheDocument();
  });

  it("si el seguimiento no carga muestra el error", async () => {
    vi.spyOn(api, "get").mockRejectedValue(new Error(JSON.stringify({ error: "Cotización no encontrada" })));
    setup();
    expect(await screen.findByRole("alert")).toHaveTextContent("Cotización no encontrada");
  });
});
