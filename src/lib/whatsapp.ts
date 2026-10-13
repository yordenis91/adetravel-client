/**
 * Enlaces "click to chat" de WhatsApp (wa.me). No usa la API de WhatsApp Business: abre el chat
 * en WhatsApp Web o en la app del usuario con el mensaje ya escrito, y es el empleado quien lo envía.
 */

/** Código de país que se asume para un móvil chileno de 9 dígitos sin prefijo (la agencia opera en Chile). */
const CHILE_COUNTRY_CODE = "56";

/**
 * Devuelve el teléfono en formato internacional solo con dígitos (lo que pide wa.me), o null si no
 * se puede saber el país con seguridad.
 *
 * - "+56 9 1234 5678" y "0056912345678" se respetan tal cual (el prefijo + o 00 indica país).
 * - Un móvil chileno de 9 dígitos que empieza por 9 se completa con 56.
 * - Un número de 10 a 15 dígitos sin prefijo se asume que ya trae el código de país.
 * - Cualquier otro caso (por ejemplo 8 dígitos) es ambiguo y devuelve null, para no escribirle a un número equivocado.
 */
export function normalizeWhatsAppPhone(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const trimmed = raw.trim();
  const explicitInternational = trimmed.startsWith("+") || trimmed.startsWith("00");
  let digits = trimmed.replace(/\D/g, "");
  if (trimmed.startsWith("00")) digits = digits.slice(2);
  if (!digits) return null;

  if (explicitInternational) return digits.length >= 8 && digits.length <= 15 ? digits : null;
  if (digits.length === 9 && digits.startsWith("9")) return CHILE_COUNTRY_CODE + digits;
  if (digits.length >= 10 && digits.length <= 15) return digits;
  return null;
}

export function buildWhatsAppUrl(phone: string | null | undefined, message?: string): string | null {
  const normalized = normalizeWhatsAppPhone(phone);
  if (!normalized) return null;
  const text = message?.trim();
  return `https://wa.me/${normalized}${text ? `?text=${encodeURIComponent(text)}` : ""}`;
}

export const whatsAppMessages = {
  client: (firstName?: string | null) => `Hola ${firstName?.trim() || ""}`.trim() + ", le escribo desde la agencia.",
  quotation: (firstName: string | null | undefined, quotationNumber: string) =>
    `Hola ${firstName?.trim() || ""}`.trim() + `, le escribo por su cotización ${quotationNumber}. Quedo atento a sus comentarios.`,
  voucher: (firstName: string | null | undefined, voucherNumber: string) =>
    `Hola ${firstName?.trim() || ""}`.trim() + `, le escribo por su voucher ${voucherNumber}.`,
};
