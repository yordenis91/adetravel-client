import React from "react";
import { cn } from "@/lib/utils";

export const STATUS_CONFIG: Record<string, { label: string; color: string; dot: string }> = {
  Recepcionada: { label: "Recepcionada", color: "bg-blue-100 text-blue-700", dot: "bg-blue-500" },
  Cotizada:     { label: "Cotizada",     color: "bg-amber-100 text-amber-700", dot: "bg-amber-500" },
  Confirmada:   { label: "Confirmada",   color: "bg-emerald-100 text-emerald-700", dot: "bg-emerald-500" },
  Vendida:      { label: "Vendida",      color: "bg-purple-100 text-purple-700", dot: "bg-purple-500" },
  Cancelada:    { label: "Cancelada",    color: "bg-rose-100 text-rose-700", dot: "bg-rose-500" },
};

interface RequestStatusBadgeProps {
  status: string;
  className?: string;
}

export function RequestStatusBadge({ status, className }: RequestStatusBadgeProps) {
  const config = STATUS_CONFIG[status] || { 
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
