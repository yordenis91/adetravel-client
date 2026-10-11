import type { ServiceType } from "@/types/service";

/** Ficha del cliente tal como la devuelve GET /clients/:id (todo opcional: con permisos reducidos
 * puede venir solo id y nombre). */
export interface PrefillClient {
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
  phone?: string | null;
  rut?: string | null;
  passportNumber?: string | null;
  passportExpiry?: string | null;
  passportIssueDate?: string | null;
  passportCountry?: string | null;
  birthDate?: string | null;
  nationality?: string | null;
  address?: string | null;
  frequentFlyerNumbers?: string[] | null;
}

const clean = (v?: string | null) => (typeof v === "string" ? v.trim() : "");

export const clientFullName = (c: PrefillClient) => [clean(c.firstName), clean(c.lastName)].filter(Boolean).join(" ");

/** Datos del cliente que se pueden copiar a `details` según el tipo de servicio. Solo incluye los
 * que el cliente tiene (nunca valores vacíos) y que el formulario del servicio muestra: lo que se
 * guarda es lo que el usuario ve. */
export function getClientPrefill(type: ServiceType, c: PrefillClient): Record<string, unknown> {
  const name = clientFullName(c);
  const pick = (entries: Record<string, string>) =>
    Object.fromEntries(Object.entries(entries).filter(([, v]) => v !== ""));

  switch (type) {
    case "SEGURO":
      return pick({
        fullName: name, passportNumber: clean(c.passportNumber),
        rut: clean(c.rut), address: clean(c.address), birthDate: clean(c.birthDate),
        phone: clean(c.phone), email: clean(c.email),
      });
    case "VISA":
      return pick({
        fullName: name, passportNumber: clean(c.passportNumber), passportExpiry: clean(c.passportExpiry),
        birthDate: clean(c.birthDate), nationality: clean(c.nationality),
      });
    case "PASAJE_AEREO":
      return pick({
        fullName: name, passportNumber: clean(c.passportNumber), rut: clean(c.rut),
        passportIssueDate: clean(c.passportIssueDate), passportExpiry: clean(c.passportExpiry),
        frequentFlyerNumber: clean(c.frequentFlyerNumbers?.[0]),
      });
    case "ARRIENDO_AUTO":
    case "EXCURSION":
    case "TRASLADO":
    case "CRUCERO":
    case "CIRCUITO":
      return pick({ clientName: name });
    case "ALOJAMIENTO":
      // El responsable de la primera habitación es, por defecto, el cliente.
      return name ? { rooms: [{ responsibleName: name, roomType: "DOBLE" }] } : {};
    default:
      return {};
  }
}

const isEmpty = (v: unknown) => v === undefined || v === null || v === "";

/** Mezcla el prellenado en `current` sin pisar nada que ya tenga valor (lo que escribió el usuario
 * manda siempre). En alojamiento solo toca el responsable de la primera habitación si está vacío. */
export function applyClientPrefill(
  current: Record<string, unknown>,
  prefill: Record<string, unknown>,
): Record<string, unknown> {
  const next: Record<string, unknown> = { ...current };
  for (const [key, value] of Object.entries(prefill)) {
    if (key === "rooms") {
      const rooms = Array.isArray(current.rooms) ? [...(current.rooms as Record<string, unknown>[])] : [];
      const first = rooms[0] ?? { roomType: "DOBLE" };
      if (isEmpty(first.responsibleName)) {
        rooms[0] = { ...first, responsibleName: (value as { responsibleName: string }[])[0].responsibleName };
        next.rooms = rooms;
      }
    } else if (isEmpty(current[key])) {
      next[key] = value;
    }
  }
  return next;
}
