import React from "react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface UserRoleBadgeProps {
  role: string | null | undefined;
  type: 'system' | 'agency';
  className?: string;
}

export function UserRoleBadge({ role, type, className }: UserRoleBadgeProps) {
  if (!role) return null;

  if (type === 'system') {
    const isAdmin = role.toUpperCase() === 'ADMINISTRADOR';
    return (
      <Badge 
        variant="outline" 
        className={cn(
          "font-semibold uppercase text-[10px] tracking-wider px-2 py-0.5",
          isAdmin 
            ? "bg-navy text-white border-navy" 
            : "bg-slate-100 text-slate-600 border-slate-200",
          className
        )}
      >
        {isAdmin ? 'Administrador' : 'Usuario'}
      </Badge>
    );
  }

  // Agency roles
  const getAgencyStyles = (r: string) => {
    switch (r.toUpperCase()) {
      case 'GERENTE':
        return "bg-gold/10 text-gold-dark border-gold/20";
      case 'AGENTE_SENIOR':
        return "bg-blue-50 text-blue-600 border-blue-100";
      case 'AGENTE':
        return "bg-emerald-50 text-emerald-600 border-emerald-100";
      case 'ASISTENTE':
        return "bg-slate-50 text-slate-500 border-slate-100";
      default:
        return "bg-slate-50 text-slate-400 border-slate-100";
    }
  };

  const formatLabel = (r: string) => {
    return r.replace('_', ' ').toUpperCase();
  };

  return (
    <Badge 
      variant="outline" 
      className={cn(
        "font-bold text-[10px] px-2 py-0.5",
        getAgencyStyles(role),
        className
      )}
    >
      {formatLabel(role)}
    </Badge>
  );
}