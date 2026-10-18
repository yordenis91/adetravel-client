/** Máximo de correos adicionales que acepta el API por cliente o proveedor (adetravel-api: MAX_ADDITIONAL_EMAILS). */
export const MAX_ADDITIONAL_EMAILS = 10;

const LOOKS_LIKE_EMAIL = /^[^\s@,;<>]+@[^\s@,;<>]+\.[^\s@,;<>]+$/;

/** URL `mailto:` para un correo, o `null` si el texto no parece un correo (no se arma un enlace roto). */
export function buildMailtoUrl(email?: string | null): string | null {
  const value = email?.trim();
  if (!value || !LOOKS_LIKE_EMAIL.test(value)) return null;
  return `mailto:${encodeURIComponent(value).replace(/%40/g, "@")}`;
}
