/**
 * Tipos del detalle de Servicio por tipo (9 variantes), copiados exactamente de
 * adetravel-api/src/validators/services.validator.ts para que el formulario del frontend
 * valide y envíe los mismos nombres de campo que espera el backend.
 */

export const SERVICE_TYPES = [
  "SEGURO",
  "VISA",
  "ALOJAMIENTO",
  "PASAJE_AEREO",
  "ARRIENDO_AUTO",
  "EXCURSION",
  "TRASLADO",
  "CRUCERO",
  "CIRCUITO",
] as const;

export type ServiceType = (typeof SERVICE_TYPES)[number];

export const SERVICE_TYPE_LABELS: Record<ServiceType, string> = {
  SEGURO: "Seguro de asistencia en viajes",
  VISA: "Visa",
  ALOJAMIENTO: "Alojamiento (Hotel, Casa Privada u Otros)",
  PASAJE_AEREO: "Pasaje aéreo",
  ARRIENDO_AUTO: "Arriendo de auto",
  EXCURSION: "Excursión",
  TRASLADO: "Traslado",
  CRUCERO: "Crucero",
  CIRCUITO: "Circuito",
};

export interface SeguroDetails {
  type: "SEGURO";
  fullName: string;
  passportNumber?: string;
  passportCountry?: string;
  rut?: string;
  address: string;
  birthDate: string;
  phone: string;
  email?: string;
  tripStartDate: string;
  tripEndDate: string;
  emergencyContactName: string;
  emergencyContactPhone?: string;
  emergencyContactEmail?: string;
  planType: string;
}

export interface VisaDetails {
  type: "VISA";
  fullName: string;
  passportNumber: string;
  passportExpiry?: string;
  birthDate: string;
  nationality: string;
}

export type RoomType = "SINGLE" | "DOBLE" | "TRIPLE" | "CUADRUPLE" | "FAMILIAR";

export interface AlojamientoRoom {
  responsibleName: string;
  roomType: RoomType;
}

export interface AlojamientoDetails {
  type: "ALOJAMIENTO";
  roomCount: number;
  rooms: AlojamientoRoom[];
  checkIn: string;
  checkOut: string;
  hotelName: string;
  hotelAddress?: string;
  hotelCity?: string;
  hotelCountry?: string;
  hotelRegion?: string;
  hotelChain: string;
  starRating?: number;
  netRate?: number;
  commissionableRate?: number;
  commissionPercentage?: number;
  includesVat?: boolean;
  vatValue?: number;
}

export interface PasajeAereoDetails {
  type: "PASAJE_AEREO";
  fullName: string;
  origin: string;
  destination: string;
  departureDate: string;
  returnDate: string;
  passportNumber?: string;
  rut?: string;
  frequentFlyerNumber?: string;
  passportIssueDate?: string;
  passportExpiry?: string;
}

export interface ArriendoAutoDetails {
  type: "ARRIENDO_AUTO";
  clientName: string;
  pickupDate: string;
  pickupTime: string;
  dropoffDate: string;
  dropoffTime: string;
  pickupAddress: string;
  dropoffAddress: string;
  carType: string;
  carBrand?: string;
  carModel?: string;
  unlimitedMileage: boolean;
  mileageLimitPerDay?: number;
  arrivalFlightDateTime?: string;
  departureFlightDateTime?: string;
}

export interface ExcursionDetails {
  type: "EXCURSION";
  clientName: string;
  startDateTime: string;
  endDateTime?: string;
  excursionName: string;
  adultsCount: number;
  childrenCount: number;
}

export interface TrasladoDetails {
  type: "TRASLADO";
  clientName: string;
  startDateTime: string;
  endDateTime?: string;
  originAddress: string;
  destinationAddress: string;
  infantsCount: number;
  childrenCount: number;
  adultsCount: number;
  arrivalFlightDateTime?: string;
  departureFlightDateTime?: string;
}

export type CabinType = "INTERNA" | "EXTERNA";

export interface CruceroDetails {
  type: "CRUCERO";
  clientName: string;
  cruiseName: string;
  cabinType: CabinType;
  cabinCount?: number;
  passengerCount?: number;
  route?: string;
}

export interface CircuitoDetails {
  type: "CIRCUITO";
  clientName: string;
  circuitName: string;
  startDate: string;
  endDate?: string;
  passengerCount?: number;
  route?: string;
}

export type ServiceDetails =
  | SeguroDetails
  | VisaDetails
  | AlojamientoDetails
  | PasajeAereoDetails
  | ArriendoAutoDetails
  | ExcursionDetails
  | TrasladoDetails
  | CruceroDetails
  | CircuitoDetails;
