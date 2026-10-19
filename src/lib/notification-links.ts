import { AlertCircle, CheckCircle2, Clock, Eye, Info, MessageCircle, RefreshCw, type LucideIcon } from "lucide-react";

/** A dónde lleva una notificación: las de cotizaciones abren el detalle de esa cotización. */
export function notificationTarget(n: { relatedEntityType?: string | null; relatedEntityId?: string | null; [k: string]: unknown }): string | null {
  if (n.relatedEntityType === "COTIZACION" && n.relatedEntityId) return `/cotizaciones?view=${encodeURIComponent(n.relatedEntityId)}`;
  return null;
}

/** Icono y color de cada tipo de notificación. */
export function notificationIcon(type?: string): { Icon: LucideIcon; className: string } {
  switch ((type || "").toUpperCase()) {
    case "SUCCESS": return { Icon: CheckCircle2, className: "text-green-600" };
    case "WARNING": return { Icon: AlertCircle, className: "text-yellow-600" };
    case "ERROR": return { Icon: AlertCircle, className: "text-red-600" };
    case "QUOTATION_VIEWED": return { Icon: Eye, className: "text-sky-600" };
    case "QUOTATION_ACCEPT_REQUESTED": return { Icon: CheckCircle2, className: "text-emerald-600" };
    case "QUOTATION_QUESTION": return { Icon: MessageCircle, className: "text-indigo-600" };
    case "QUOTATION_RENEW_REQUESTED": return { Icon: RefreshCw, className: "text-emerald-600" };
    case "QUOTATION_UNOPENED":
    case "QUOTATION_EXPIRING": return { Icon: Clock, className: "text-amber-600" };
    case "QUOTATION_SCHEDULED_FAILED": return { Icon: AlertCircle, className: "text-red-600" };
    default: return { Icon: Info, className: "text-blue-600" };
  }
}
