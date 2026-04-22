import React from "react";
import { cn } from "@/lib/utils";

export const QUOTATION_STATUS_CONFIG: Record<string, { label: string; color: string; dot: string }> = {
  Borrador:  { label: "Borrador",  color: "bg-slate-100 text-slate-600", dot: "bg-slate-400" },
  Enviada:   { label: "Enviada",   color: "bg-blue-100 text-blue-700",  dot: "bg-blue-500" },
  Aceptada:  { label: "Aceptada",  color: "bg-emerald-100 text-emerald-700", dot: "bg-emerald-500" },
  Rechazada: { label: "Rechazada", color: "bg-rose-100 text-rose-700", dot: "bg-rose-500" },
};

interface QuotationStatusBadgeProps {
  status: string;
  className?: string;
}

export function QuotationStatusBadge({ status, className }: QuotationStatusBadgeProps) {
  const config = QUOTATION_STATUS_CONFIG[status] || { 
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
