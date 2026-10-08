import { describe, it, expect } from "vitest";
import { SERVICE_TYPES } from "@/types/service";
import { UNIFIED_SERVICE_TYPES, SERVICE_TYPE_SHORT_LABELS, normalizeServiceType, serviceTypeLabel } from "../service-types";

describe("tipos de servicio unificados", () => {
  it("son los del catálogo de servicios más OTRO, todos con etiqueta", () => {
    expect(UNIFIED_SERVICE_TYPES).toEqual([...SERVICE_TYPES, "OTRO"]);
    for (const t of UNIFIED_SERVICE_TYPES) expect(SERVICE_TYPE_SHORT_LABELS[t]).toBeTruthy();
  });

  it("muestran los valores antiguos con la etiqueta del tipo unificado", () => {
    expect(["HOTEL", "AEREO", "AÉREO", "TOUR", "TRANSFER", "RENT_A_CAR", "RESTAURANT", "PAQUETE"].map(serviceTypeLabel)).toEqual([
      "Alojamiento", "Pasaje aéreo", "Pasaje aéreo", "Excursión", "Traslado", "Arriendo de auto", "Otro", "Otro",
    ]);
    expect(normalizeServiceType("HOTEL")).toBe("ALOJAMIENTO");
  });

  it("deja tal cual lo desconocido y vacío lo vacío", () => {
    expect([serviceTypeLabel("SPA"), serviceTypeLabel(null), serviceTypeLabel("")]).toEqual(["SPA", "", ""]);
  });
});
