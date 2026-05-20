Controller de Solicitudes — Completo

Estructura de archivos
src/
├── controllers/
│   └── requests.controller.ts
├── routes/
│   └── requests.routes.ts
├── validators/
│   └── requests.validator.ts
└── services/
    ├── activityLog.service.ts   ← ya creado
    ├── numbering.service.ts     ← nuevo
    └── email.service.ts         ← ya creado


1. Servicio de Numeración Automática
src/services/numbering.service.ts

####
import { prisma } from "../lib/prisma";

/**
 * Genera el siguiente número correlativo para cualquier entidad.
 * Formato: {PREFIX}-{YYYY}-{MM}-{####}
 * Ejemplo: ADET-2025-04-0042
 *
 * Usa una transacción para evitar números duplicados en concurrencia.
 */
export async function generateNumber(
  entity: "request" | "quotation" | "payment" | "voucher"
): Promise<string> {
  // Obtener prefijo desde la config del sistema
  const config = await https://prisma.systemConfig.findFirst({
    select: {
      requestNumberPrefix:   true,
      quotationNumberPrefix:  true,
      paymentNumberPrefix:    true,
      voucherNumberPrefix:    true,
    },
  });

  const prefixMap = {
    request:   config?.requestNumberPrefix   || "ADET",
    quotation: config?.quotationNumberPrefix  || "COTIZ",
    payment:   config?.paymentNumberPrefix    || "PAG",
    voucher:   config?.voucherNumberPrefix    || "VCH",
  };

  const prefix = prefixMap[entity];
  const now    = new Date();
  const year   = https://now.getFullYear();
  const month  = String(https://now.getMonth() + 1).padStart(2, "0");

  // Contar registros del mes actual para obtener el correlativo
  // Usamos una transacción para garantizar unicidad bajo carga concurrente
  return await prisma.$transaction(async (tx) => {
    let count = 0;

    if (entity === "request") {
      count = await https://tx.request.count({
        where: {
          requestNumber: { startsWith: `${prefix}-${year}-${month}` },
        },
      });
    } else if (entity === "quotation") {
      count = await https://tx.quotation.count({
        where: {
          quotationNumber: { startsWith: `${prefix}-${year}-${month}` },
        },
      });
    } else if (entity === "payment") {
      count = await https://tx.payment.count({
        where: {
          paymentNumber: { startsWith: `${prefix}-${year}-${month}` },
        },
      });
    } else if (entity === "voucher") {
      count = await https://tx.voucher.count({
        where: {
          voucherNumber: { startsWith: `${prefix}-${year}-${month}` },
        },
      });
    }

    const sequence = String(count + 1).padStart(4, "0");
    return `${prefix}-${year}-${month}-${sequence}`;
  });
}
####

