// Espejo en frontend de adetravel-api/src/validators/workflow-status.ts.
// Única fuente de verdad para el flujo granular de 17 estados compartido por Solicitud y
// Servicio — todo componente que compare/renderice un estado debe importar de aquí, nunca
// redefinir su propio mapeo local (ese fue el origen del bug de casing detectado en esta fase).

export const WORKFLOW_STATUSES = [
  "RECEPCIONADA",
  "SERVICIOS_ASIGNADOS_PARA_COTIZAR",
  "ENVIADO_A_PROVEEDOR",
  "COTIZADO_POR_PROVEEDOR",
  "COTIZADO_POR_ADETRAVEL",
  "ENVIADO_AL_CLIENTE",
  "ACEPTADA_POR_CLIENTE",
  "ENVIADA_SOLICITUD_CONFIRMACION_PROVEEDOR",
  "CONFIRMADA_POR_PROVEEDOR",
  "ENVIADA_CONFIRMACION_CLIENTE",
  "ENVIADA_SOLICITUD_PAGO_CLIENTE",
  "PAGADO_POR_CLIENTE",
  "PAGADO_AL_PROVEEDOR",
  "VOUCHER_EMITIDO",
  "VOUCHER_ENTREGADO",
  "VENDIDA",
  "CANCELADA",
] as const;

export type WorkflowStatus = (typeof WORKFLOW_STATUSES)[number];

// Copia exacta del mapa de adyacencia del backend (src/validators/workflow-status.ts).
export const VALID_TRANSITIONS: Record<string, string[]> = {
  RECEPCIONADA: ["SERVICIOS_ASIGNADOS_PARA_COTIZAR", "CANCELADA"],
  SERVICIOS_ASIGNADOS_PARA_COTIZAR: ["ENVIADO_A_PROVEEDOR", "CANCELADA"],
  ENVIADO_A_PROVEEDOR: ["COTIZADO_POR_PROVEEDOR", "CANCELADA"],
  COTIZADO_POR_PROVEEDOR: ["COTIZADO_POR_ADETRAVEL", "CANCELADA"],
  COTIZADO_POR_ADETRAVEL: ["ENVIADO_AL_CLIENTE", "CANCELADA"],
  ENVIADO_AL_CLIENTE: ["ACEPTADA_POR_CLIENTE", "RECEPCIONADA", "CANCELADA"],
  ACEPTADA_POR_CLIENTE: ["ENVIADA_SOLICITUD_CONFIRMACION_PROVEEDOR", "CANCELADA"],
  ENVIADA_SOLICITUD_CONFIRMACION_PROVEEDOR: ["CONFIRMADA_POR_PROVEEDOR", "ENVIADO_AL_CLIENTE", "CANCELADA"],
  CONFIRMADA_POR_PROVEEDOR: ["ENVIADA_CONFIRMACION_CLIENTE", "CANCELADA"],
  ENVIADA_CONFIRMACION_CLIENTE: ["ENVIADA_SOLICITUD_PAGO_CLIENTE", "CANCELADA"],
  ENVIADA_SOLICITUD_PAGO_CLIENTE: ["PAGADO_POR_CLIENTE", "CANCELADA"],
  PAGADO_POR_CLIENTE: ["PAGADO_AL_PROVEEDOR"],
  PAGADO_AL_PROVEEDOR: ["VOUCHER_EMITIDO"],
  VOUCHER_EMITIDO: ["VOUCHER_ENTREGADO"],
  VOUCHER_ENTREGADO: ["VENDIDA"],
  VENDIDA: [],
  CANCELADA: ["RECEPCIONADA"],
};

export const STATUS_LABELS: Record<WorkflowStatus, string> = {
  RECEPCIONADA: "Recepcionada",
  SERVICIOS_ASIGNADOS_PARA_COTIZAR: "Asignado para cotizar",
  ENVIADO_A_PROVEEDOR: "Enviado a proveedor",
  COTIZADO_POR_PROVEEDOR: "Cotizado por proveedor",
  COTIZADO_POR_ADETRAVEL: "Cotizado por ADETravel",
  ENVIADO_AL_CLIENTE: "Enviado al cliente",
  ACEPTADA_POR_CLIENTE: "Aceptada por el cliente",
  ENVIADA_SOLICITUD_CONFIRMACION_PROVEEDOR: "Solicitud de confirmación enviada",
  CONFIRMADA_POR_PROVEEDOR: "Confirmada por proveedor",
  ENVIADA_CONFIRMACION_CLIENTE: "Confirmación enviada al cliente",
  ENVIADA_SOLICITUD_PAGO_CLIENTE: "Solicitud de pago enviada",
  PAGADO_POR_CLIENTE: "Pagado por el cliente",
  PAGADO_AL_PROVEEDOR: "Pagado al proveedor",
  VOUCHER_EMITIDO: "Voucher emitido",
  VOUCHER_ENTREGADO: "Voucher entregado",
  VENDIDA: "Vendida",
  CANCELADA: "Cancelada",
};

// Agrupación en las 4 fases del documento, usada por RequestStatusFlow (barra visual) y por
// los tabs agrupados de RequestsPage.
export const STATUS_PHASES: { label: string; statuses: WorkflowStatus[] }[] = [
  {
    label: "Cotización",
    statuses: [
      "RECEPCIONADA",
      "SERVICIOS_ASIGNADOS_PARA_COTIZAR",
      "ENVIADO_A_PROVEEDOR",
      "COTIZADO_POR_PROVEEDOR",
      "COTIZADO_POR_ADETRAVEL",
    ],
  },
  {
    label: "Cliente",
    statuses: ["ENVIADO_AL_CLIENTE", "ACEPTADA_POR_CLIENTE"],
  },
  {
    label: "Confirmación proveedor",
    statuses: ["ENVIADA_SOLICITUD_CONFIRMACION_PROVEEDOR", "CONFIRMADA_POR_PROVEEDOR", "ENVIADA_CONFIRMACION_CLIENTE"],
  },
  {
    label: "Pago y voucher",
    statuses: [
      "ENVIADA_SOLICITUD_PAGO_CLIENTE",
      "PAGADO_POR_CLIENTE",
      "PAGADO_AL_PROVEEDOR",
      "VOUCHER_EMITIDO",
      "VOUCHER_ENTREGADO",
      "VENDIDA",
    ],
  },
];

// Color por estado (clases Tailwind). Progresión: slate (inicio) -> sky/amber (en curso con
// proveedor) -> blue (cotizado) -> violet (con cliente) -> emerald (confirmado/pagado) ->
// purple (vendida). CANCELADA siempre rose.
export const STATUS_COLORS: Record<WorkflowStatus, { bg: string; text: string; border: string; dot: string }> = {
  RECEPCIONADA: { bg: "bg-slate-100", text: "text-slate-700", border: "border-slate-200", dot: "bg-slate-500" },
  SERVICIOS_ASIGNADOS_PARA_COTIZAR: { bg: "bg-sky-100", text: "text-sky-700", border: "border-sky-200", dot: "bg-sky-500" },
  ENVIADO_A_PROVEEDOR: { bg: "bg-sky-100", text: "text-sky-700", border: "border-sky-200", dot: "bg-sky-500" },
  COTIZADO_POR_PROVEEDOR: { bg: "bg-amber-100", text: "text-amber-700", border: "border-amber-200", dot: "bg-amber-500" },
  COTIZADO_POR_ADETRAVEL: { bg: "bg-amber-100", text: "text-amber-700", border: "border-amber-200", dot: "bg-amber-500" },
  ENVIADO_AL_CLIENTE: { bg: "bg-blue-100", text: "text-blue-700", border: "border-blue-200", dot: "bg-blue-500" },
  ACEPTADA_POR_CLIENTE: { bg: "bg-violet-100", text: "text-violet-700", border: "border-violet-200", dot: "bg-violet-500" },
  ENVIADA_SOLICITUD_CONFIRMACION_PROVEEDOR: { bg: "bg-violet-100", text: "text-violet-700", border: "border-violet-200", dot: "bg-violet-500" },
  CONFIRMADA_POR_PROVEEDOR: { bg: "bg-emerald-100", text: "text-emerald-700", border: "border-emerald-200", dot: "bg-emerald-500" },
  ENVIADA_CONFIRMACION_CLIENTE: { bg: "bg-emerald-100", text: "text-emerald-700", border: "border-emerald-200", dot: "bg-emerald-500" },
  ENVIADA_SOLICITUD_PAGO_CLIENTE: { bg: "bg-teal-100", text: "text-teal-700", border: "border-teal-200", dot: "bg-teal-500" },
  PAGADO_POR_CLIENTE: { bg: "bg-teal-100", text: "text-teal-700", border: "border-teal-200", dot: "bg-teal-500" },
  PAGADO_AL_PROVEEDOR: { bg: "bg-teal-100", text: "text-teal-700", border: "border-teal-200", dot: "bg-teal-500" },
  VOUCHER_EMITIDO: { bg: "bg-indigo-100", text: "text-indigo-700", border: "border-indigo-200", dot: "bg-indigo-500" },
  VOUCHER_ENTREGADO: { bg: "bg-indigo-100", text: "text-indigo-700", border: "border-indigo-200", dot: "bg-indigo-500" },
  VENDIDA: { bg: "bg-purple-100", text: "text-purple-700", border: "border-purple-200", dot: "bg-purple-500" },
  CANCELADA: { bg: "bg-rose-100", text: "text-rose-700", border: "border-rose-200", dot: "bg-rose-500" },
};

export function isWorkflowStatus(value?: string | null): value is WorkflowStatus {
  return !!value && (WORKFLOW_STATUSES as readonly string[]).includes(value);
}

export function getStatusLabel(status?: string | null): string {
  if (!status) return STATUS_LABELS.RECEPCIONADA;
  return isWorkflowStatus(status) ? STATUS_LABELS[status] : status;
}

export function getStatusColor(status?: string | null) {
  if (status && isWorkflowStatus(status)) return STATUS_COLORS[status];
  return { bg: "bg-slate-50", text: "text-slate-500", border: "border-slate-100", dot: "bg-slate-400" };
}

export function getPhaseIndex(status?: string | null): number {
  if (!status) return 0;
  const idx = STATUS_PHASES.findIndex((phase) => (phase.statuses as string[]).includes(status));
  return idx === -1 ? 0 : idx;
}

/** Índice de progreso dentro del flujo (CANCELADA queda fuera del orden lineal). */
const PROGRESS_ORDER: WorkflowStatus[] = WORKFLOW_STATUSES.filter((s) => s !== "CANCELADA");

export function isAtOrAfter(current?: string | null, target?: WorkflowStatus): boolean {
  if (!current || !target) return false;
  const currentIdx = PROGRESS_ORDER.indexOf(current as WorkflowStatus);
  const targetIdx = PROGRESS_ORDER.indexOf(target);
  if (currentIdx === -1 || targetIdx === -1) return false;
  return currentIdx >= targetIdx;
}
