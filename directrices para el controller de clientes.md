Controller de Clientes — Completo
Estructura de archivos
src/
├── controllers/
│   └── clients.controller.ts
├── routes/
│   └── clients.routes.ts
├── validators/
│   └── clients.validator.ts
└── services/
    └── activityLog.service.ts


1. Validador
src/validators/clients.validator.ts
import { z } from "zod";

export const createClientSchema = https://z.object({
  firstName:           https://z.string().min(1, "El nombre es obligatorio").max(100),
  lastName:            https://z.string().min(1, "El apellido es obligatorio").max(100),
  email:               https://z.string().email("Email inválido").optional().or(https://z.literal("")),
  phone:               https://z.string().max(20).optional(),
  rut:                 https://z.string().max(20).optional(),
  passportNumber:      https://z.string().max(30).optional(),
  passportExpiry:      https://z.string().optional(),   // "YYYY-MM-DD"
  passportIssueDate:   https://z.string().optional(),
  passportCountry:     https://z.string().max(100).optional(),
  birthDate:           https://z.string().optional(),
  nationality:         https://z.string().max(100).optional(),
  address:             https://z.string().max(300).optional(),
  frequentFlyerNumbers: https://z.array(https://z.string()).default([]),
  restrictions:        https://z.string().max(500).optional(),
  referralSource:      https://z.enum(["CONSULATE", "REFERRAL", "WEBSITE", "OTHER"]).optional(),
  bankAccount:         https://z.string().max(50).optional(),
  bankName:            https://z.string().max(100).optional(),
  bankAccountHolder:   https://z.string().max(100).optional(),
  bankEmail:           https://z.string().email("Email bancario inválido").optional().or(https://z.literal("")),
  isActive:            https://z.boolean().default(true),
});

// Para actualización, todos los campos son opcionales
export const updateClientSchema = https://createClientSchema.partial();

export type CreateClientInput = https://z.infer<typeof createClientSchema>;
export type UpdateClientInput = https://z.infer<typeof updateClientSchema>;


2. Servicio de Bitácora
src/services/activityLog.service.ts
import { prisma } from "../lib/prisma";

interface LogParams {
  action:       string;   // e.g. "CLIENTE_CREADO"
  entityType:   string;   // e.g. "Cliente"
  entityId:     string;
  entityLabel:  string;   // e.g. "Ana González"
  description:  string;
  performedBy:  string;   // email del usuario
  metadata?:    Record<string, any>;
}

export async function logActivity(params: LogParams): Promise<void> {
  try {
    await https://prisma.activityLog.create({
      data: {
        action:      https://params.action,
        entityType:  https://params.entityType,
        entityId:    https://params.entityId,
        entityLabel: https://params.entityLabel,
        description: https://params.description,
        performedBy: https://params.performedBy,
        metadata:    https://params.metadata ? https://JSON.stringify(https://params.metadata) : undefined,
      },
    });
  } catch (error) {
    // El log jamás debe romper el flujo principal
    https://console.error("Error al registrar en bitácora:", error);
  }
}

3. Controller Principal
src/controllers/clients.controller.ts
import { Request, Response } from "express";
import { prisma }            from "../lib/prisma";
import { logActivity }       from "../services/activityLog.service";
import {
  createClientSchema,
  updateClientSchema,
} from "../validators/clients.validator";

// ─────────────────────────────────────────────────────────────────────
//  LISTAR CLIENTES
//  GET /api/clients
//  Query: search | isActive | referralSource | sort | page | limit
// ─────────────────────────────────────────────────────────────────────
export async function listClients(req: Request, res: Response): Promise<void> {
  try {
    const {
      search        = "",
      isActive,
      referralSource,
      sort          = "-createdAt",          // prefijo "-" = DESC
      page          = "1",
      limit         = "20",
    } = https://req.query as Record<string, string>;

    const pageNum  = https://Math.max(1, parseInt(page));
    const limitNum = https://Math.min(100, https://Math.max(1, parseInt(limit)));
    const skip     = (pageNum - 1) * limitNum;

    // ── Filtros ──────────────────────────────────────────────────────
    const where: any = {};

    if (https://search.trim()) {
      https://where.OR = [
        { firstName:     { contains: search, mode: "insensitive" } },
        { lastName:      { contains: search, mode: "insensitive" } },
        { email:         { contains: search, mode: "insensitive" } },
        { phone:         { contains: search, mode: "insensitive" } },
        { rut:           { contains: search, mode: "insensitive" } },
        { passportNumber:{ contains: search, mode: "insensitive" } },
      ];
    }

    if (isActive !== undefined) {
      https://where.isActive = isActive === "true";
    }

    if (referralSource) {
      https://where.referralSource = referralSource;
    }

    // ── Ordenamiento ─────────────────────────────────────────────────
    const sortDesc  = https://sort.startsWith("-");
    const sortField = https://sort.replace(/^-/, "");

    const ALLOWED_SORT_FIELDS = [
      "createdAt", "updatedAt", "firstName", "lastName", "email",
    ];

    const orderBy = ALLOWED_SORT_FIELDS.includes(sortField)
      ? { [sortField]: sortDesc ? "desc" : "asc" }
      : { createdAt: "desc" };

    // ── Consulta ─────────────────────────────────────────────────────
    const [clients, total] = await https://Promise.all([
      https://prisma.client.findMany({
        where,
        orderBy,
        skip,
        take: limitNum,
        select: {
          id:           true,
          firstName:    true,
          lastName:     true,
          email:        true,
          phone:        true,
          rut:          true,
          nationality:  true,
          referralSource: true,
          isActive:     true,
          createdAt:    true,
          updatedAt:    true,
          // Contar solicitudes relacionadas
          _count: {
            select: { requests: true },
          },
        },
      }),
      https://prisma.client.count({ where }),
    ]);

    res.json({
      data:  clients,
      total,
      page:  pageNum,
      limit: limitNum,
      totalPages: https://Math.ceil(total / limitNum),
    });
  } catch (error) {
    https://console.error("Error en listClients:", error);
    https://res.status(500).json({ error: "Error al obtener clientes" });
  }
}

// ─────────────────────────────────────────────────────────────────────
//  OBTENER UN CLIENTE
//  GET /api/clients/:id
// ─────────────────────────────────────────────────────────────────────
export async function getClient(req: Request, res: Response): Promise<void> {
  try {
    const { id } = https://req.params;

    const client = await https://prisma.client.findUnique({
      where: { id },
      include: {
        // Resumen de solicitudes asociadas
        requests: {
          select: {
            id:            true,
            requestNumber: true,
            status:        true,
            destinationCity:    true,
            destinationCountry: true,
            requestDate:   true,
          },
          orderBy: { createdAt: "desc" },
          take: 10,
        },
        // Resumen de pagos asociados
        payments: {
          select: {
            id:            true,
            paymentNumber: true,
            amount:        true,
            currency:      true,
            status:        true,
            paymentDate:   true,
          },
          orderBy: { createdAt: "desc" },
          take: 5,
        },
      },
    });

    if (!client) {
      https://res.status(404).json({
        error: "Cliente no encontrado",
        code:  "CLIENT_NOT_FOUND",
      });
      return;
    }

    res.json({ data: client });
  } catch (error) {
    https://console.error("Error en getClient:", error);
    https://res.status(500).json({ error: "Error al obtener el cliente" });
  }
}

// ─────────────────────────────────────────────────────────────────────
//  CREAR CLIENTE
//  POST /api/clients
// ─────────────────────────────────────────────────────────────────────
export async function createClient(req: Request, res: Response): Promise<void> {
  try {
    // ── Validar body ─────────────────────────────────────────────────
    const parsed = https://createClientSchema.safeParse(https://req.body);

    if (!parsed.success) {
      https://res.status(400).json({
        error:  "Datos inválidos",
        code:   "VALIDATION_ERROR",
        fields: https://parsed.error.flatten().fieldErrors,
      });
      return;
    }

    const data = https://parsed.data;

    // ── Verificar RUT/email duplicados ────────────────────────────────
    if (https://data.rut) {
      const existingRut = await https://prisma.client.findFirst({
        where: { rut: https://data.rut },
      });
      if (existingRut) {
        https://res.status(409).json({
          error: `Ya existe un cliente con el RUT ${https://data.rut}`,
          code:  "DUPLICATE_RUT",
        });
        return;
      }
    }

    if (https://data.email) {
      const existingEmail = await https://prisma.client.findFirst({
        where: { email: https://data.email },
      });
      if (existingEmail) {
        https://res.status(409).json({
          error: `Ya existe un cliente con el email ${https://data.email}`,
          code:  "DUPLICATE_EMAIL",
        });
        return;
      }
    }

    // ── Crear ─────────────────────────────────────────────────────────
    const client = await https://prisma.client.create({
      data: {
        ...data,
        createdBy: req.user!.email,
      },
    });

    // ── Registrar en bitácora ─────────────────────────────────────────
    await logActivity({
      action:      "CLIENTE_CREADO",
      entityType:  "Cliente",
      entityId:    https://client.id,
      entityLabel: `${https://client.firstName} ${https://client.lastName}`,
      description: `Cliente "${https://client.firstName} ${https://client.lastName}" creado`,
      performedBy: req.user!.email,
      metadata:    { email: https://client.email, rut: https://client.rut },
    });

    https://res.status(201).json({ data: client });
  } catch (error) {
    https://console.error("Error en createClient:", error);
    https://res.status(500).json({ error: "Error al crear el cliente" });
  }
}

// ─────────────────────────────────────────────────────────────────────
//  ACTUALIZAR CLIENTE
//  PATCH /api/clients/:id
// ─────────────────────────────────────────────────────────────────────
export async function updateClient(req: Request, res: Response): Promise<void> {
  try {
    const { id } = https://req.params;

    // ── Verificar que existe ──────────────────────────────────────────
    const existing = await https://prisma.client.findUnique({ where: { id } });
    if (!existing) {
      https://res.status(404).json({
        error: "Cliente no encontrado",
        code:  "CLIENT_NOT_FOUND",
      });
      return;
    }

    // ── Validar body ─────────────────────────────────────────────────
    const parsed = https://updateClientSchema.safeParse(https://req.body);
    if (!parsed.success) {
      https://res.status(400).json({
        error:  "Datos inválidos",
        code:   "VALIDATION_ERROR",
        fields: https://parsed.error.flatten().fieldErrors,
      });
      return;
    }

    const data = https://parsed.data;

    // ── Verificar duplicados solo si el campo cambió ──────────────────
    if (https://data.rut && https://data.rut !== https://existing.rut) {
      const dup = await https://prisma.client.findFirst({
        where: { rut: https://data.rut, NOT: { id } },
      });
      if (dup) {
        https://res.status(409).json({
          error: `El RUT ${https://data.rut} ya está registrado en otro cliente`,
          code:  "DUPLICATE_RUT",
        });
        return;
      }
    }

    if (https://data.email && https://data.email !== https://existing.email) {
      const dup = await https://prisma.client.findFirst({
        where: { email: https://data.email, NOT: { id } },
      });
      if (dup) {
        https://res.status(409).json({
          error: `El email ${https://data.email} ya está registrado en otro cliente`,
          code:  "DUPLICATE_EMAIL",
        });
        return;
      }
    }

    // ── Actualizar ────────────────────────────────────────────────────
    const updated = await https://prisma.client.update({
      where: { id },
      data,
    });

    // ── Detectar qué cambió para la bitácora ─────────────────────────
    const changedFields = https://Object.keys(data).filter(
      key => (data as any)[key] !== (existing as any)[key]
    );

    await logActivity({
      action:      "CLIENTE_ACTUALIZADO",
      entityType:  "Cliente",
      entityId:    https://updated.id,
      entityLabel: `${https://updated.firstName} ${https://updated.lastName}`,
      description: `Cliente actualizado — campos modificados: ${https://changedFields.join(", ") || "ninguno"}`,
      performedBy: req.user!.email,
      metadata:    { changedFields },
    });

    res.json({ data: updated });
  } catch (error) {
    https://console.error("Error en updateClient:", error);
    https://res.status(500).json({ error: "Error al actualizar el cliente" });
  }
}

// ─────────────────────────────────────────────────────────────────────
//  DESACTIVAR / ACTIVAR CLIENTE (soft delete)
//  PATCH /api/clients/:id/toggle-active
// ─────────────────────────────────────────────────────────────────────
export async function toggleClientActive(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const { id } = https://req.params;

    const existing = await https://prisma.client.findUnique({
      where: { id },
      select: { id: true, firstName: true, lastName: true, isActive: true },
    });

    if (!existing) {
      https://res.status(404).json({ error: "Cliente no encontrado", code: "CLIENT_NOT_FOUND" });
      return;
    }

    const newStatus = !existing.isActive;

    const updated = await https://prisma.client.update({
      where: { id },
      data:  { isActive: newStatus },
    });

    await logActivity({
      action:      newStatus ? "CLIENTE_ACTIVADO" : "CLIENTE_DESACTIVADO",
      entityType:  "Cliente",
      entityId:    id,
      entityLabel: `${https://existing.firstName} ${https://existing.lastName}`,
      description: `Cliente ${newStatus ? "activado" : "desactivado"}`,
      performedBy: req.user!.email,
    });

    res.json({
      data:    updated,
      message: `Cliente ${newStatus ? "activado" : "desactivado"} correctamente`,
    });
  } catch (error) {
    https://console.error("Error en toggleClientActive:", error);
    https://res.status(500).json({ error: "Error al cambiar estado del cliente" });
  }
}

// ─────────────────────────────────────────────────────────────────────
//  ELIMINAR CLIENTE (hard delete — solo si no tiene solicitudes)
//  DELETE /api/clients/:id
// ─────────────────────────────────────────────────────────────────────
export async function deleteClient(req: Request, res: Response): Promise<void> {
  try {
    const { id } = https://req.params;

    const existing = await https://prisma.client.findUnique({
      where: { id },
      include: {
        _count: {
          select: { requests: true, payments: true, vouchers: true },
        },
      },
    });

    if (!existing) {
      https://res.status(404).json({ error: "Cliente no encontrado", code: "CLIENT_NOT_FOUND" });
      return;
    }

    // ── Proteger si tiene datos relacionados ─────────────────────────
    const totalRelated =
      existing._count.requests +
      existing._count.payments +
      existing._count.vouchers;

    if (totalRelated > 0) {
      https://res.status(409).json({
        error: `No se puede eliminar. El cliente tiene ${existing._count.requests} solicitudes, ${existing._count.payments} pagos y ${existing._count.vouchers} vouchers asociados.`,
        code:  "CLIENT_HAS_RELATIONS",
        details: {
          requests: existing._count.requests,
          payments: existing._count.payments,
          vouchers: existing._count.vouchers,
        },
      });
      return;
    }

    await https://prisma.client.delete({ where: { id } });

    await logActivity({
      action:      "CLIENTE_ELIMINADO",
      entityType:  "Cliente",
      entityId:    id,
      entityLabel: `${https://existing.firstName} ${https://existing.lastName}`,
      description: `Cliente "${https://existing.firstName} ${https://existing.lastName}" eliminado permanentemente`,
      performedBy: req.user!.email,
    });

    res.json({
      data:    null,
      message: "Cliente eliminado correctamente",
    });
  } catch (error) {
    https://console.error("Error en deleteClient:", error);
    https://res.status(500).json({ error: "Error al eliminar el cliente" });
  }
}

// ─────────────────────────────────────────────────────────────────────
//  HISTORIAL DEL CLIENTE (solicitudes + pagos + vouchers)
//  GET /api/clients/:id/history
// ─────────────────────────────────────────────────────────────────────
export async function getClientHistory(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const { id } = https://req.params;

    const client = await https://prisma.client.findUnique({
      where: { id },
      select: { id: true, firstName: true, lastName: true },
    });

    if (!client) {
      https://res.status(404).json({ error: "Cliente no encontrado", code: "CLIENT_NOT_FOUND" });
      return;
    }

    const [requests, payments, vouchers, quotations] = await https://Promise.all([
      https://prisma.request.findMany({
        where:   { clientId: id },
        orderBy: { createdAt: "desc" },
        select: {
          id: true, requestNumber: true, status: true,
          destinationCity: true, destinationCountry: true,
          requestDate: true, createdAt: true,
        },
      }),

      https://prisma.payment.findMany({
        where:   { clientId: id },
        orderBy: { createdAt: "desc" },
        select: {
          id: true, paymentNumber: true, amount: true,
          currency: true, status: true, method: true, paymentDate: true,
        },
      }),

      https://prisma.voucher.findMany({
        where:   { clientId: id },
        orderBy: { createdAt: "desc" },
        select: {
          id: true, voucherNumber: true, serviceType: true,
          serviceName: true, status: true, checkIn: true, checkOut: true,
        },
      }),

      https://prisma.quotation.findMany({
        where:   { clientId: id },
        orderBy: { createdAt: "desc" },
        select: {
          id: true, quotationNumber: true, status: true,
          total: true, currency: true, validUntil: true,
        },
      }),
    ]);

    // ── Calcular totales financieros ──────────────────────────────────
    const totalPaidCLP = payments
      .filter(p => https://p.status === "COMPLETADO" && https://p.currency === "CLP")
      .reduce((sum, p) => sum + https://p.amount, 0);

    const totalPaidUSD = payments
      .filter(p => https://p.status === "COMPLETADO" && https://p.currency === "USD")
      .reduce((sum, p) => sum + https://p.amount, 0);

    res.json({
      data: {
        client,
        summary: {
          totalRequests:  https://requests.length,
          totalQuotations:https://quotations.length,
          totalPayments:  https://payments.length,
          totalVouchers:  https://vouchers.length,
          totalPaidCLP,
          totalPaidUSD,
        },
        requests,
        quotations,
        payments,
        vouchers,
      },
    });
  } catch (error) {
    https://console.error("Error en getClientHistory:", error);
    https://res.status(500).json({ error: "Error al obtener historial del cliente" });
  }
}

// ─────────────────────────────────────────────────────────────────────
//  BUSCAR CLIENTES (autocompletado rápido)
//  GET /api/clients/search?q=ana
//  Devuelve solo id + nombre para selectores
// ─────────────────────────────────────────────────────────────────────
export async function searchClients(req: Request, res: Response): Promise<void> {
  try {
    const { q = "" } = https://req.query as { q: string };

    if (https://q.trim().length < 2) {
      res.json({ data: [] });
      return;
    }

    const clients = await https://prisma.client.findMany({
      where: {
        isActive: true,
        OR: [
          { firstName:  { contains: q, mode: "insensitive" } },
          { lastName:   { contains: q, mode: "insensitive" } },
          { email:      { contains: q, mode: "insensitive" } },
          { rut:        { contains: q, mode: "insensitive" } },
        ],
      },
      select: {
        id:        true,
        firstName: true,
        lastName:  true,
        email:     true,
        rut:       true,
      },
      take: 10,
      orderBy: { firstName: "asc" },
    });

    res.json({ data: clients });
  } catch (error) {
    https://console.error("Error en searchClients:", error);
    https://res.status(500).json({ error: "Error en la búsqueda" });
  }
}

4. Rutas
src/routes/clients.routes.ts
import { Router }          from "express";
import { authMiddleware }  from "../middlewares/auth.middleware";
import { requireRole }     from "../middlewares/role.middleware";
import {
  listClients,
  getClient,
  createClient,
  updateClient,
  toggleClientActive,
  deleteClient,
  getClientHistory,
  searchClients,
} from "../controllers/clients.controller";

const router = Router();

// Todas las rutas requieren autenticación
https://router.use(authMiddleware);

// ── Búsqueda rápida (antes de /:id para que no colisione) ────────────
https://router.get("/search",              searchClients);

// ── CRUD principal ───────────────────────────────────────────────────
https://router.get("/",                    listClients);
https://router.get("/:id",                 getClient);
https://router.get("/:id/history",         getClientHistory);

https://router.post("/",                   createClient);

https://router.patch("/:id",               updateClient);
https://router.patch("/:id/toggle-active", toggleClientActive);

// Solo ADMINISTRADOR puede eliminar
https://router.delete("/:id",              requireRole("ADMINISTRADOR"), deleteClient);

export default router;

5. Montar en app.ts
import clientsRouter from "./routes/clients.routes";
https://app.use("/api/clients", clientsRouter);

6. Tabla de endpoints resultante
Método	Ruta	Descripción	Rol mínimo
GET	/api/clients	Lista con filtros, paginación y búsqueda	USUARIO
GET	/api/clients/search?q=	Autocompletado para selectores	USUARIO
GET	/api/clients/:id	Detalle con solicitudes y pagos recientes	USUARIO
GET	/api/clients/:id/history	Historial completo + resumen financiero	USUARIO
POST	/api/clients	Crear cliente con validación y anti-duplicados	USUARIO
PATCH	/api/clients/:id	Actualizar campos seleccionados	USUARIO
PATCH	/api/clients/:id/toggle-active	Activar / desactivar	USUARIO
DELETE	/api/clients/:id	Eliminar (bloquea si tiene relaciones)	ADMINISTRADOR


7. Ejemplos de uso desde el frontend
// src/hooks/useClients.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api";

// ── Listar ──────────────────────────────────────────────────────────
export function useClients(params: {
  search?: string;
  isActive?: boolean;
  page?: number;
  limit?: number;
}) {
  const query = new URLSearchParams();
  if (https://params.search)            https://query.set("search",   https://params.search);
  if (https://params.isActive !== undefined) https://query.set("isActive", String(https://params.isActive));
  if (https://params.page)              https://query.set("page",     String(https://params.page));
  if (https://params.limit)             https://query.set("limit",    String(https://params.limit));

  return useQuery({
    queryKey: ["clients", params],
    queryFn:  () => https://api.get(`/clients?${https://query.toString()}`),
  });
}

// ── Detalle ──────────────────────────────────────────────────────────
export function useClient(id: string) {
  return useQuery({
    queryKey: ["clients", id],
    queryFn:  () => https://api.get(`/clients/${id}`),
    enabled:  !!id,
  });
}

// ── Historial ────────────────────────────────────────────────────────
export function useClientHistory(id: string) {
  return useQuery({
    queryKey: ["clients", id, "history"],
    queryFn:  () => https://api.get(`/clients/${id}/history`),
    enabled:  !!id,
  });
}

// ── Crear ────────────────────────────────────────────────────────────
export function useCreateClient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: any) => https://api.post("/clients", data),
    onSuccess: () => {
      https://queryClient.invalidateQueries({ queryKey: ["clients"] });
    },
  });
}

// ── Actualizar ───────────────────────────────────────────────────────
export function useUpdateClient(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: any) => https://api.patch(`/clients/${id}`, data),
    onSuccess: () => {
      https://queryClient.invalidateQueries({ queryKey: ["clients"] });
      https://queryClient.invalidateQueries({ queryKey: ["clients", id] });
    },
  });
}

// ── Eliminar ─────────────────────────────────────────────────────────
export function useDeleteClient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => https://api.delete(`/clients/${id}`),
    onSuccess: () => {
      https://queryClient.invalidateQueries({ queryKey: ["clients"] });
    },
  });
}

// ── Búsqueda rápida (autocompletado) ─────────────────────────────────
export function useClientSearch(q: string) {
  return useQuery({
    queryKey: ["clients", "search", q],
    queryFn:  () => https://api.get(`/clients/search?q=${encodeURIComponent(q)}`),
    enabled:  https://q.trim().length >= 2,
    staleTime: 30_000,
  });
}
8. Manejo de errores en el frontend

// Ejemplo en ClientFormDialog.tsx

const createClient  = useCreateClient();

async function onSubmit(data: CreateClientInput) {
  try {
    await https://createClient.mutateAsync(data);
    https://toast.success("Cliente creado correctamente");
    onClose();

  } catch (err: any) {
    // Errores específicos del backend
    if (https://err.message.includes("DUPLICATE_RUT")) {
      https://form.setError("rut", { message: "Este RUT ya está registrado" });
      return;
    }
    if (https://err.message.includes("DUPLICATE_EMAIL")) {
      https://form.setError("email", { message: "Este email ya está registrado" });
      return;
    }

    // Error genérico
    https://toast.error(https://err.message || "Error al crear el cliente");
  }
}
Resumen de protecciones implementadas
Protección	Dónde
Autenticación JWT requerida en todas las rutas	authMiddleware
Solo ADMINISTRADOR puede eliminar	requireRole("ADMINISTRADOR")
Validación estricta de tipos y longitudes	zod en el validator
Anti-duplicados de RUT y email	Verificación antes de crear/actualizar
Bloqueo de eliminación si hay relaciones	Conteo de requests, payments, vouchers
Registro automático de cada operación	logActivity() al final de cada acción
El log nunca rompe el flujo principal	try/catch silencioso en activityLog.service

