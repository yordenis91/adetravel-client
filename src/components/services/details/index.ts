import type { ComponentType } from "react";
import { ServiceType } from "@/types/service";
import { SeguroFields } from "./SeguroFields";
import { VisaFields } from "./VisaFields";
import { AlojamientoFields } from "./AlojamientoFields";
import { PasajeAereoFields } from "./PasajeAereoFields";
import { ArriendoAutoFields } from "./ArriendoAutoFields";
import { ExcursionFields } from "./ExcursionFields";
import { TrasladoFields } from "./TrasladoFields";
import { CruceroFields } from "./CruceroFields";
import { CircuitoFields } from "./CircuitoFields";

export {
  SeguroFields, VisaFields, AlojamientoFields, PasajeAereoFields, ArriendoAutoFields,
  ExcursionFields, TrasladoFields, CruceroFields, CircuitoFields,
};

export const SERVICE_DETAIL_FIELDS: Record<ServiceType, ComponentType<{ control: any }>> = {
  SEGURO: SeguroFields,
  VISA: VisaFields,
  ALOJAMIENTO: AlojamientoFields,
  PASAJE_AEREO: PasajeAereoFields,
  ARRIENDO_AUTO: ArriendoAutoFields,
  EXCURSION: ExcursionFields,
  TRASLADO: TrasladoFields,
  CRUCERO: CruceroFields,
  CIRCUITO: CircuitoFields,
};

/** Valores por defecto de `details` al crear un Servicio o cambiar de tipo en el formulario. */
export function getDefaultDetails(type: ServiceType): Record<string, unknown> {
  switch (type) {
    case "SEGURO":
      return { type, fullName: "", address: "", birthDate: "", phone: "", tripStartDate: "", tripEndDate: "", emergencyContactName: "", planType: "" };
    case "VISA":
      return { type, fullName: "", passportNumber: "", birthDate: "", nationality: "" };
    case "ALOJAMIENTO":
      return { type, roomCount: 1, rooms: [{ responsibleName: "", roomType: "DOBLE" }], checkIn: "", checkOut: "", hotelName: "", hotelChain: "" };
    case "PASAJE_AEREO":
      return { type, fullName: "", origin: "", destination: "", departureDate: "", returnDate: "" };
    case "ARRIENDO_AUTO":
      return { type, clientName: "", pickupDate: "", pickupTime: "", dropoffDate: "", dropoffTime: "", pickupAddress: "", dropoffAddress: "", carType: "", unlimitedMileage: true };
    case "EXCURSION":
      return { type, clientName: "", startDateTime: "", excursionName: "", adultsCount: 1, childrenCount: 0 };
    case "TRASLADO":
      return { type, clientName: "", startDateTime: "", originAddress: "", destinationAddress: "", infantsCount: 0, childrenCount: 0, adultsCount: 1 };
    case "CRUCERO":
      return { type, clientName: "", cruiseName: "", cabinType: "INTERNA" };
    case "CIRCUITO":
      return { type, clientName: "", circuitName: "", startDate: "" };
    default:
      return { type };
  }
}
