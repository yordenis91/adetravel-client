import { z } from "zod";

// Espejo en frontend de adetravel-api/src/validators/services.validator.ts (campo `details`).

const seguroDetailsSchema = z.object({
  type: z.literal("SEGURO"),
  fullName: z.string().min(1, "Nombre y apellidos es obligatorio"),
  passportNumber: z.string().optional(),
  passportCountry: z.string().optional(),
  rut: z.string().optional(),
  address: z.string().min(1, "La dirección es obligatoria"),
  birthDate: z.string().min(1, "La fecha de nacimiento es obligatoria"),
  phone: z.string().min(1, "El teléfono es obligatorio"),
  email: z.string().email().optional().or(z.literal("")),
  tripStartDate: z.string().min(1, "La fecha de inicio del viaje es obligatoria"),
  tripEndDate: z.string().min(1, "La fecha de fin del viaje es obligatoria"),
  emergencyContactName: z.string().min(1, "El contacto de emergencia es obligatorio"),
  emergencyContactPhone: z.string().optional(),
  emergencyContactEmail: z.string().optional(),
  planType: z.string().min(1, "El tipo de plan es obligatorio"),
});

const visaDetailsSchema = z.object({
  type: z.literal("VISA"),
  fullName: z.string().min(1, "Nombre y apellidos es obligatorio"),
  passportNumber: z.string().min(1, "El número de pasaporte es obligatorio"),
  passportExpiry: z.string().optional(),
  birthDate: z.string().min(1, "La fecha de nacimiento es obligatoria"),
  nationality: z.string().min(1, "La nacionalidad es obligatoria"),
});

const alojamientoRoomSchema = z.object({
  responsibleName: z.string().min(1, "El responsable de la habitación es obligatorio"),
  roomType: z.enum(["SINGLE", "DOBLE", "TRIPLE", "CUADRUPLE", "FAMILIAR"]),
});

const alojamientoDetailsSchema = z.object({
  type: z.literal("ALOJAMIENTO"),
  roomCount: z.coerce.number().int().min(1, "La cantidad de habitaciones es obligatoria"),
  rooms: z.array(alojamientoRoomSchema).min(1, "Debe indicar al menos una habitación"),
  checkIn: z.string().min(1, "La fecha de entrada es obligatoria"),
  checkOut: z.string().min(1, "La fecha de salida es obligatoria"),
  hotelName: z.string().min(1, "El nombre del hotel/casa es obligatorio"),
  hotelAddress: z.string().optional(),
  hotelCity: z.string().optional(),
  hotelCountry: z.string().optional(),
  hotelRegion: z.string().optional(),
  hotelChain: z.string().min(1, "La cadena hotelera es obligatoria"),
  starRating: z.coerce.number().int().min(1).max(5).optional(),
  netRate: z.coerce.number().min(0).optional(),
  commissionableRate: z.coerce.number().min(0).optional(),
  commissionPercentage: z.coerce.number().min(0).max(100).optional(),
  includesVat: z.boolean().optional(),
  vatValue: z.coerce.number().min(0).optional(),
});

const pasajeAereoDetailsSchema = z.object({
  type: z.literal("PASAJE_AEREO"),
  fullName: z.string().min(1, "Nombre y apellidos es obligatorio"),
  origin: z.string().min(1, "El origen es obligatorio"),
  destination: z.string().min(1, "El destino es obligatorio"),
  departureDate: z.string().min(1, "La fecha de ida es obligatoria"),
  returnDate: z.string().min(1, "La fecha de regreso es obligatoria"),
  passportNumber: z.string().optional(),
  rut: z.string().optional(),
  frequentFlyerNumber: z.string().optional(),
  passportIssueDate: z.string().optional(),
  passportExpiry: z.string().optional(),
});

const arriendoAutoDetailsSchema = z.object({
  type: z.literal("ARRIENDO_AUTO"),
  clientName: z.string().min(1, "El nombre del cliente principal es obligatorio"),
  pickupDate: z.string().min(1, "La fecha de recogida es obligatoria"),
  pickupTime: z.string().min(1, "La hora de recogida es obligatoria"),
  dropoffDate: z.string().min(1, "La fecha de entrega es obligatoria"),
  dropoffTime: z.string().min(1, "La hora de entrega es obligatoria"),
  pickupAddress: z.string().min(1, "La dirección de retiro es obligatoria"),
  dropoffAddress: z.string().min(1, "La dirección de entrega es obligatoria"),
  carType: z.string().min(1, "El tipo de auto es obligatorio"),
  carBrand: z.string().optional(),
  carModel: z.string().optional(),
  unlimitedMileage: z.boolean(),
  mileageLimitPerDay: z.coerce.number().min(0).optional(),
  arrivalFlightDateTime: z.string().optional(),
  departureFlightDateTime: z.string().optional(),
});

const excursionDetailsSchema = z.object({
  type: z.literal("EXCURSION"),
  clientName: z.string().min(1, "El nombre del cliente es obligatorio"),
  startDateTime: z.string().min(1, "La fecha y hora de comienzo es obligatoria"),
  endDateTime: z.string().optional(),
  excursionName: z.string().min(1, "El nombre de la excursión es obligatorio"),
  adultsCount: z.coerce.number().int().min(1, "La cantidad de adultos es obligatoria"),
  childrenCount: z.coerce.number().int().min(0).default(0),
});

const trasladoDetailsSchema = z.object({
  type: z.literal("TRASLADO"),
  clientName: z.string().min(1, "El nombre del cliente es obligatorio"),
  startDateTime: z.string().min(1, "La fecha y hora de comienzo es obligatoria"),
  endDateTime: z.string().optional(),
  originAddress: z.string().min(1, "La dirección de origen es obligatoria"),
  destinationAddress: z.string().min(1, "La dirección de destino es obligatoria"),
  infantsCount: z.coerce.number().int().min(0).default(0),
  childrenCount: z.coerce.number().int().min(0).default(0),
  adultsCount: z.coerce.number().int().min(0).default(0),
  arrivalFlightDateTime: z.string().optional(),
  departureFlightDateTime: z.string().optional(),
});

const cruceroDetailsSchema = z.object({
  type: z.literal("CRUCERO"),
  clientName: z.string().min(1, "El nombre del cliente es obligatorio"),
  cruiseName: z.string().min(1, "El nombre del crucero es obligatorio"),
  cabinType: z.enum(["INTERNA", "EXTERNA"]),
  cabinCount: z.coerce.number().int().min(1).optional(),
  passengerCount: z.coerce.number().int().min(1).optional(),
  route: z.string().optional(),
});

const circuitoDetailsSchema = z.object({
  type: z.literal("CIRCUITO"),
  clientName: z.string().min(1, "El nombre del cliente es obligatorio"),
  circuitName: z.string().min(1, "El nombre del circuito es obligatorio"),
  startDate: z.string().min(1, "La fecha de inicio es obligatoria"),
  endDate: z.string().optional(),
  passengerCount: z.coerce.number().int().min(1).optional(),
  route: z.string().optional(),
});

export const serviceDetailsSchema = z.discriminatedUnion("type", [
  seguroDetailsSchema,
  visaDetailsSchema,
  alojamientoDetailsSchema,
  pasajeAereoDetailsSchema,
  arriendoAutoDetailsSchema,
  excursionDetailsSchema,
  trasladoDetailsSchema,
  cruceroDetailsSchema,
  circuitoDetailsSchema,
]).superRefine((data, ctx) => {
  if (data.type === "PASAJE_AEREO" && !data.passportNumber && !data.rut) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Debe indicar número de pasaporte o RUT", path: ["passportNumber"] });
  }
});
