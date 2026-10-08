// Tipos de servicio unificados para solicitudes, servicios y vouchers (D9, api#54): el catálogo de
// servicios más OTRO. Los valores antiguos (HOTEL, AEREO, AÉREO, TOUR…) se muestran con la etiqueta
// del tipo al que la API los convierte, por si quedan datos sin migrar.
import { SERVICE_TYPES } from "@/types/service";

export const UNIFIED_SERVICE_TYPES = [...SERVICE_TYPES, "OTRO"] as const;
export type UnifiedServiceType = (typeof UNIFIED_SERVICE_TYPES)[number];

export const SERVICE_TYPE_SHORT_LABELS: Record<UnifiedServiceType, string> = {
  SEGURO: "Seguro",
  VISA: "Visa",
  ALOJAMIENTO: "Alojamiento",
  PASAJE_AEREO: "Pasaje aéreo",
  ARRIENDO_AUTO: "Arriendo de auto",
  EXCURSION: "Excursión",
  TRASLADO: "Traslado",
  CRUCERO: "Crucero",
  CIRCUITO: "Circuito",
  OTRO: "Otro",
};

/** Mismo mapa que LEGACY_SERVICE_TYPE_ALIASES de la API. */
const LEGACY_ALIASES: Record<string, UnifiedServiceType> = {
  HOTEL: "ALOJAMIENTO",
  AEREO: "PASAJE_AEREO",
  "AÉREO": "PASAJE_AEREO",
  TOUR: "EXCURSION",
  TRANSFER: "TRASLADO",
  RENT_A_CAR: "ARRIENDO_AUTO",
  RESTAURANT: "OTRO",
  PAQUETE: "OTRO",
};

export function normalizeServiceType(value: string): string {
  return LEGACY_ALIASES[value] ?? value;
}

/** Etiqueta corta en español; un valor desconocido se muestra tal cual y uno vacío como "". */
export function serviceTypeLabel(value?: string | null): string {
  if (!value) return "";
  return SERVICE_TYPE_SHORT_LABELS[normalizeServiceType(value) as UnifiedServiceType] ?? value;
}
