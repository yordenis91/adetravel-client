import { formatDistance, parseISO, format } from "date-fns";
import { es } from "date-fns/locale";
import { api } from "@/lib/api";

/** Resumen de seguimiento que el API agrega a cada cotización (lista y detalle). */
export interface QuotationTracking {
  hasLink: boolean;
  viewCount: number;
  firstViewedAt: string | null;
  lastViewedAt: string | null;
  acceptanceRequestedAt: string | null;
  sentAt: string | null;
  expiresAt: string | null;
}

export interface QuotationLinkEvent {
  id: string;
  type: "VIEW" | "DOWNLOAD" | "ACCEPT_REQUEST" | "QUESTION" | "RENEW_REQUEST";
  device: "mobile" | "tablet" | "desktop" | null;
  contactName: string | null;
  message: string | null;
  createdAt: string;
}

export interface QuotationLinkInfo {
  url: string;
  createdAt: string;
  expiresAt: string;
  firstViewedAt: string | null;
  lastViewedAt: string | null;
  viewCount: number;
  acceptanceRequestedAt: string | null;
  events: QuotationLinkEvent[];
}

export interface ScheduledSend {
  id: string;
  sendAt: string;
  status: "PENDIENTE" | "PROCESANDO" | "FALLIDO";
  attempts: number;
  lastError: string | null;
}

/** Fecha «solo día» del API (YYYY-MM-DD) sin el desfase de zona horaria de `new Date("2026-12-31")`. */
export function formatDateOnly(value: string | null | undefined, pattern = "dd/MM/yyyy"): string {
  if (!value) return "---";
  const parsed = parseISO(value);
  return Number.isNaN(parsed.getTime()) ? value : format(parsed, pattern, { locale: es });
}

const agoFrom = (iso: string, now: Date) => formatDistance(new Date(iso), now, { addSuffix: true, locale: es });

export type TrackingTone = "neutral" | "warning" | "info" | "success";
export interface TrackingBadge { label: string; tone: TrackingTone; title?: string }

/**
 * Etiqueta corta para la lista: lo que el agente necesita saber de un vistazo.
 * «Sin abrir» solo se muestra si pasó al menos un día (recién enviada no es una alerta).
 */
export function trackingBadge(status: string, tracking: QuotationTracking | null | undefined, now: Date = new Date()): TrackingBadge | null {
  if (!tracking?.hasLink || status !== "Enviada") return null;
  if (tracking.acceptanceRequestedAt) {
    return { label: "Quiere aceptar", tone: "success", title: `Pidió aceptar ${agoFrom(tracking.acceptanceRequestedAt, now)}` };
  }
  if (tracking.viewCount > 0 && tracking.lastViewedAt) {
    const times = tracking.viewCount === 1 ? "1 vez" : `${tracking.viewCount} veces`;
    return { label: `Vista ${agoFrom(tracking.lastViewedAt, now)}`, tone: "info", title: `Abierta ${times}` };
  }
  const sentDaysAgo = tracking.sentAt ? (now.getTime() - new Date(tracking.sentAt).getTime()) / 86_400_000 : 0;
  return sentDaysAgo >= 1
    ? { label: "Sin abrir", tone: "warning", title: tracking.sentAt ? `Enviada ${agoFrom(tracking.sentAt, now)} y nadie la ha abierto` : undefined }
    : { label: "Sin abrir aún", tone: "neutral", title: tracking.sentAt ? `Enviada ${agoFrom(tracking.sentAt, now)}` : undefined };
}

const DEVICES: Record<string, string> = { mobile: "desde el celular", tablet: "desde una tableta", desktop: "desde un computador" };

/** Línea de tiempo: texto legible de cada evento del enlace. */
export function describeEvent(event: QuotationLinkEvent): string {
  const device = event.device ? ` ${DEVICES[event.device] ?? ""}`.trimEnd() : "";
  const who = event.contactName ? ` (${event.contactName})` : "";
  switch (event.type) {
    case "VIEW": return `Abrió la cotización${device}`;
    case "DOWNLOAD": return "Descargó el PDF";
    case "ACCEPT_REQUEST": return `Pidió aceptar la cotización${who}`;
    case "QUESTION": return `Dejó una consulta${who}: «${event.message ?? ""}»`;
    case "RENEW_REQUEST": return `Pidió actualizar la cotización vencida${who}${event.message ? `: «${event.message}»` : ""}`;
  }
}

// ── Página pública (sin sesión) ────────────────────────────────────────────────────────────────
export interface PublicQuotationData {
  state: "open" | "accepted" | "expired" | "closed";
  quotationNumber: string;
  clientFirstName: string;
  agentName: string | null;
  validUntil: string | null;
  agency: { name: string; email: string | null; phone: string | null; website: string | null; logoUrl: string | null };
  // Solo en open/accepted:
  destination?: string | null;
  currency?: string;
  items?: { service: string; description: string; quantity: number; unitPrice: number; total: number }[];
  subtotal?: number;
  discount?: number;
  taxPercentage?: number;
  taxAmount?: number;
  total?: number;
  notes?: string | null;
  termsAndConditions?: string | null;
  createdAt?: string;
  canAccept?: boolean;
  acceptanceRequested?: boolean;
}

export const PublicQuotation = {
  get: async (code: string): Promise<PublicQuotationData> =>
    ((await api.get(`/public/quotations/${encodeURIComponent(code)}`)) as { data: PublicQuotationData }).data,
  accept: (code: string, contactName?: string) => api.post(`/public/quotations/${encodeURIComponent(code)}/accept`, { contactName: contactName || undefined }),
  question: (code: string, message: string, contactName?: string) =>
    api.post(`/public/quotations/${encodeURIComponent(code)}/question`, { message, contactName: contactName || undefined }),
  renew: (code: string, message?: string, contactName?: string) =>
    api.post(`/public/quotations/${encodeURIComponent(code)}/renew`, { message: message || undefined, contactName: contactName || undefined }),
  pdf: (code: string) => api.getBlob(`/public/quotations/${encodeURIComponent(code)}/pdf`),
};
