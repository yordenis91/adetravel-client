// Filtrado de datos personales para Sentry en el navegador (misma regla que la API, ver
// adetravel-api/src/utils/pii-scrub.ts): sin correos, RUT, tokens ni cuerpos de peticiones; las
// URL sin query (los buscadores pueden llevar nombres o correos) y del usuario solo el id.
import type { Breadcrumb, Event } from "@sentry/react";

export const REDACTED = "[filtrado]";

const SENSITIVE_KEYS = new Set(
  [
    "password", "newPassword", "currentPassword", "token", "accessToken", "authorization", "cookie",
    "email", "to", "phone", "mobile", "rut", "passport", "passportNumber", "address", "birthDate",
    "bankAccount", "bankAccountNumber", "firstName", "lastName", "fullName", "passengerNames",
  ].map((k) => k.toLowerCase().replace(/[-_]/g, ""))
);

const EMAIL_RE = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g;
const RUT_RE = /\b\d{1,2}\.?\d{3}\.?\d{3}-[\dkK]\b/g;
const BEARER_RE = /Bearer\s+[A-Za-z0-9._~+/=-]+/g;

export function maskText(text: string): string {
  return text.replace(EMAIL_RE, "[correo]").replace(RUT_RE, "[rut]").replace(BEARER_RE, "Bearer [token]");
}

export function stripQuery(url: string): string {
  const i = url.search(/[?#]/);
  return i === -1 ? url : url.slice(0, i);
}

export function scrub<T>(value: T, depth = 0): T {
  if (typeof value === "string") return maskText(value) as unknown as T;
  if (value === null || typeof value !== "object") return value;
  if (depth > 6) return "[profundidad]" as unknown as T;
  if (Array.isArray(value)) return value.map((v) => scrub(v, depth + 1)) as unknown as T;
  const out: Record<string, unknown> = {};
  for (const [key, v] of Object.entries(value as Record<string, unknown>)) {
    out[key] = SENSITIVE_KEYS.has(key.toLowerCase().replace(/[-_]/g, "")) ? REDACTED : scrub(v, depth + 1);
  }
  return out as T;
}

export function scrubEvent<E extends Event>(event: E): E {
  if (event.request) {
    event.request = {
      ...(event.request.url ? { url: stripQuery(event.request.url) } : {}),
      ...(event.request.method ? { method: event.request.method } : {}),
    };
  }
  if (event.user) event.user = event.user.id ? { id: event.user.id } : {};
  if (event.message) event.message = maskText(event.message);
  if (event.transaction) event.transaction = maskText(stripQuery(event.transaction));
  for (const ex of event.exception?.values ?? []) {
    if (ex.value) ex.value = maskText(ex.value);
  }
  if (event.extra) event.extra = scrub(event.extra);
  if (event.contexts) event.contexts = scrub(event.contexts);
  if (event.breadcrumbs) event.breadcrumbs = event.breadcrumbs.map(scrubBreadcrumb);
  return event;
}

export function scrubBreadcrumb(breadcrumb: Breadcrumb): Breadcrumb {
  const data: Record<string, unknown> | undefined = breadcrumb.data
    ? scrub({
        ...breadcrumb.data,
        ...(typeof breadcrumb.data.url === "string" ? { url: stripQuery(breadcrumb.data.url) } : {}),
      })
    : undefined;
  // Las migas de navegación usan from/to como rutas, no como destinatarios: se conservan sin query.
  if (data && breadcrumb.category === "navigation") {
    if (typeof breadcrumb.data?.from === "string") data.from = stripQuery(breadcrumb.data.from);
    if (typeof breadcrumb.data?.to === "string") data.to = stripQuery(breadcrumb.data.to);
  }
  return {
    ...breadcrumb,
    ...(breadcrumb.message ? { message: maskText(breadcrumb.message) } : {}),
    ...(data ? { data } : {}),
  };
}
