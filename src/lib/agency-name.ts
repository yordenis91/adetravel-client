import type { AgencyInfo } from "@/hooks/useAgencyInfo";

/** Nombre de la agencia en mayúsculas para pies de documento; "ADE TRAVEL" mientras no carga. */
export const agencyDisplayName = (agency: AgencyInfo | null) => (agency?.name || "ADE Travel").toUpperCase();
