import { describe, it, expect } from "vitest";
import { describeEvent, formatDateOnly, trackingBadge, type QuotationTracking } from "../quotationOnline";
import { notificationIcon, notificationTarget } from "../notification-links";

const NOW = new Date("2026-10-19T12:00:00Z");
const hoursAgo = (h: number) => new Date(NOW.getTime() - h * 3_600_000).toISOString();
const base: QuotationTracking = { hasLink: true, viewCount: 0, firstViewedAt: null, lastViewedAt: null, acceptanceRequestedAt: null, sentAt: hoursAgo(1), expiresAt: null };

describe("formatDateOnly", () => {
  it("muestra el mismo día que guarda el API, sin el desfase de zona horaria", () => {
    expect(formatDateOnly("2026-12-31")).toBe("31/12/2026");
    expect(formatDateOnly("2026-01-01", "dd MMM, yyyy")).toMatch(/^01 ene/i);
  });
  it("sin fecha o con texto raro no revienta", () => {
    expect(formatDateOnly(null)).toBe("---");
    expect(formatDateOnly("")).toBe("---");
    expect(formatDateOnly("pronto")).toBe("pronto");
  });
});

describe("trackingBadge", () => {
  it("no muestra nada si no es una cotización Enviada con enlace", () => {
    expect(trackingBadge("Borrador", base, NOW)).toBeNull();
    expect(trackingBadge("Aceptada", { ...base, viewCount: 2, lastViewedAt: hoursAgo(1) }, NOW)).toBeNull();
    expect(trackingBadge("Enviada", { ...base, hasLink: false }, NOW)).toBeNull();
    expect(trackingBadge("Enviada", null, NOW)).toBeNull();
    expect(trackingBadge("Enviada", undefined, NOW)).toBeNull();
  });
  it("recién enviada y sin abrir: neutra; con más de un día: alerta", () => {
    expect(trackingBadge("Enviada", base, NOW)).toMatchObject({ label: "Sin abrir aún", tone: "neutral" });
    expect(trackingBadge("Enviada", { ...base, sentAt: hoursAgo(30) }, NOW)).toMatchObject({ label: "Sin abrir", tone: "warning" });
  });
  it("abierta: dice cuándo fue la última vez y cuántas veces", () => {
    const b = trackingBadge("Enviada", { ...base, viewCount: 3, firstViewedAt: hoursAgo(50), lastViewedAt: hoursAgo(2) }, NOW)!;
    expect(b.label).toMatch(/^Vista hace/);
    expect(b.tone).toBe("info");
    expect(b.title).toBe("Abierta 3 veces");
    expect(trackingBadge("Enviada", { ...base, viewCount: 1, lastViewedAt: hoursAgo(2) }, NOW)!.title).toBe("Abierta 1 vez");
  });
  it("si el cliente pidió aceptar, eso manda sobre todo lo demás", () => {
    const b = trackingBadge("Enviada", { ...base, viewCount: 2, lastViewedAt: hoursAgo(2), acceptanceRequestedAt: hoursAgo(1) }, NOW)!;
    expect(b).toMatchObject({ label: "Quiere aceptar", tone: "success" });
  });
});

describe("describeEvent", () => {
  const ev = (over: object) => ({ id: "1", type: "VIEW", device: null, contactName: null, message: null, createdAt: hoursAgo(1), ...over }) as Parameters<typeof describeEvent>[0];
  it("describe cada tipo de actividad en lenguaje de agente", () => {
    expect(describeEvent(ev({ device: "mobile" }))).toBe("Abrió la cotización desde el celular");
    expect(describeEvent(ev({}))).toBe("Abrió la cotización");
    expect(describeEvent(ev({ type: "DOWNLOAD" }))).toBe("Descargó el PDF");
    expect(describeEvent(ev({ type: "ACCEPT_REQUEST", contactName: "Ana" }))).toBe("Pidió aceptar la cotización (Ana)");
    expect(describeEvent(ev({ type: "QUESTION", message: "¿Incluye traslados?" }))).toBe("Dejó una consulta: «¿Incluye traslados?»");
    expect(describeEvent(ev({ type: "RENEW_REQUEST", message: "Sigo interesada" }))).toContain("actualizar la cotización vencida");
  });
});

describe("notificaciones de cotizaciones", () => {
  it("abren el detalle de la cotización; las demás no llevan a ningún lado", () => {
    expect(notificationTarget({ relatedEntityType: "COTIZACION", relatedEntityId: "abc" })).toBe("/cotizaciones?view=abc");
    expect(notificationTarget({ relatedEntityType: "TASK", relatedEntityId: "abc" })).toBeNull();
    expect(notificationTarget({ relatedEntityType: "COTIZACION" })).toBeNull();
  });
  it("cada tipo tiene su icono y el resto cae al de información", () => {
    const types = ["QUOTATION_VIEWED", "QUOTATION_ACCEPT_REQUESTED", "QUOTATION_QUESTION", "QUOTATION_RENEW_REQUESTED", "QUOTATION_UNOPENED", "QUOTATION_EXPIRING", "QUOTATION_SCHEDULED_FAILED", "SUCCESS", "WARNING", "ERROR"];
    for (const t of types) expect(notificationIcon(t).Icon).toBeTruthy();
    expect(notificationIcon("QUOTATION_VIEWED").className).toContain("sky");
    expect(notificationIcon("QUOTATION_ACCEPT_REQUESTED").className).toContain("emerald");
    expect(notificationIcon(undefined).className).toContain("blue");
    expect(notificationIcon("COSA_RARA").className).toContain("blue");
  });
});
