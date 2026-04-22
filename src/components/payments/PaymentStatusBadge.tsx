import React from "react";
import { cn } from "@/lib/utils";

export const PAYMENT_STATUS_CONFIG: Record<string, { label: string; color: string; dot: string }> = {
  PENDIENTE:  { label: "Pendiente",  color: "bg-amber-100 text-amber-700", dot: "bg-amber-500" },
  COMPLETADO: { label: "Completado", color: "bg-emerald-100 text-emerald-700", dot: "bg-emerald-500" },
  CANCELADO:  { label: "Cancelado",  color: "bg-rose-100 text-rose-700", dot: "bg-rose-500" },
};

interface PaymentStatusBadgeProps {
  status: string;
  className?: string;
}

export function PaymentStatusBadge({ status, className }: PaymentStatusBadgeProps) {
  const config = PAYMENT_STATUS_CONFIG[status] || { 
    label: status, 
    color: "bg-slate-100 text-slate-700", 
    dot: "bg-slate-500" 
  };

  return (
    <span className={cn(
      "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider",
      config.color,
      className
    )}>
      <span className={cn("w-1.5 h-1.5 rounded-full", config.dot)} />
      {config.label}
    </span>
  );
}
