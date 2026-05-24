import React from "react";
import { formatDistanceToNow, format } from "date-fns";
import { es } from "date-fns/locale";
import { 
  Users, 
  FileText, 
  ReceiptText, 
  CreditCard, 
  Ticket, 
  Clock,
  ArrowRight,
  Building2,
  Mail,
  ShieldCheck
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface TimelineItemProps {
  log: any;
  isLast?: boolean;
}

// 🔥 Ampliado para soportar los nombres en Inglés (Prisma) y en Español
const entityTypeConfig: Record<string, { icon: any; color: string; bgColor: string; borderColor: string; textColor: string }> = {
  // Clientes
  "Cliente": { icon: Users, color: "blue", bgColor: "bg-blue-50 dark:bg-blue-900/20", borderColor: "border-blue-100 dark:border-blue-800/30", textColor: "text-blue-600 dark:text-blue-400" },
  "Client": { icon: Users, color: "blue", bgColor: "bg-blue-50 dark:bg-blue-900/20", borderColor: "border-blue-100 dark:border-blue-800/30", textColor: "text-blue-600 dark:text-blue-400" },
  
  // Proveedores
  "Proveedor": { icon: Building2, color: "slate", bgColor: "bg-slate-50 dark:bg-slate-800/40", borderColor: "border-slate-100 dark:border-slate-700", textColor: "text-slate-600 dark:text-slate-300" },
  "Provider": { icon: Building2, color: "slate", bgColor: "bg-slate-50 dark:bg-slate-800/40", borderColor: "border-slate-100 dark:border-slate-700", textColor: "text-slate-600 dark:text-slate-300" },
  
  // Solicitudes
  "Solicitud": { icon: FileText, color: "amber", bgColor: "bg-amber-50 dark:bg-amber-900/20", borderColor: "border-amber-100 dark:border-amber-800/30", textColor: "text-amber-600 dark:text-amber-400" },
  "Request": { icon: FileText, color: "amber", bgColor: "bg-amber-50 dark:bg-amber-900/20", borderColor: "border-amber-100 dark:border-amber-800/30", textColor: "text-amber-600 dark:text-amber-400" },
  
  // Cotizaciones
  "Cotización": { icon: ReceiptText, color: "purple", bgColor: "bg-purple-50 dark:bg-purple-900/20", borderColor: "border-purple-100 dark:border-purple-800/30", textColor: "text-purple-600 dark:text-purple-400" },
  "Quotation": { icon: ReceiptText, color: "purple", bgColor: "bg-purple-50 dark:bg-purple-900/20", borderColor: "border-purple-100 dark:border-purple-800/30", textColor: "text-purple-600 dark:text-purple-400" },
  
  // Pagos
  "Pago": { icon: CreditCard, color: "emerald", bgColor: "bg-emerald-50 dark:bg-emerald-900/20", borderColor: "border-emerald-100 dark:border-emerald-800/30", textColor: "text-emerald-600 dark:text-emerald-400" },
  "Payment": { icon: CreditCard, color: "emerald", bgColor: "bg-emerald-50 dark:bg-emerald-900/20", borderColor: "border-emerald-100 dark:border-emerald-800/30", textColor: "text-emerald-600 dark:text-emerald-400" },
  
  // Vouchers
  "Voucher": { icon: Ticket, color: "navy", bgColor: "bg-navy/5 dark:bg-navy-light/10", borderColor: "border-navy/10 dark:border-navy-light/20", textColor: "text-navy dark:text-navy-light" },
  
  // Usuarios
  "User": { icon: ShieldCheck, color: "gold", bgColor: "bg-amber-50 dark:bg-amber-900/20", borderColor: "border-amber-200 dark:border-amber-800/30", textColor: "text-amber-600 dark:text-amber-400" },
  "Usuario": { icon: ShieldCheck, color: "gold", bgColor: "bg-amber-50 dark:bg-amber-900/20", borderColor: "border-amber-200 dark:border-amber-800/30", textColor: "text-amber-600 dark:text-amber-400" },

  // Plantillas de Email
  "EmailTemplate": { icon: Mail, color: "rose", bgColor: "bg-rose-50 dark:bg-rose-900/20", borderColor: "border-rose-100 dark:border-rose-800/30", textColor: "text-rose-600 dark:text-rose-400" },
};

export function TimelineItem({ log, isLast }: TimelineItemProps) {
  const config = entityTypeConfig[log.entityType] || { 
    icon: Clock, 
    color: "slate", 
    bgColor: "bg-slate-50 dark:bg-slate-800/40", 
    borderColor: "border-slate-100 dark:border-slate-700",
    textColor: "text-slate-600 dark:text-slate-300"
  };
  const Icon = config.icon;

  const createdAt = log.createdAt ? new Date(log.createdAt) : new Date();

  // Función para traducir los nombres de la base de datos a español para la etiqueta visual
  const getDisplayLabel = (type: string) => {
    const translations: Record<string, string> = {
      Client: "Cliente", Provider: "Proveedor", Request: "Solicitud",
      Quotation: "Cotización", Payment: "Pago", Voucher: "Voucher",
      User: "Usuario", EmailTemplate: "Plantilla Email"
    };
    return translations[type] || type;
  };

  return (
    <div className="relative pl-8 pb-8 group last:pb-0">
      {!isLast && (
        <div className="absolute left-[15px] top-[32px] bottom-0 w-[2px] bg-slate-100 dark:bg-slate-800 group-hover:bg-primary/30 transition-colors" />
      )}
      
      <div className={cn(
        "absolute left-0 top-0 w-8 h-8 rounded-full border-2 flex items-center justify-center bg-white dark:bg-navy-dark z-10 transition-transform group-hover:scale-110",
        config.borderColor,
        config.textColor
      )}>
        <Icon className="w-4 h-4" />
      </div>

      <div className="flex flex-col gap-1">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <h4 className="font-bold text-sm text-navy dark:text-white uppercase tracking-tight">
              {log.action?.replace(/_/g, " ")}
            </h4>
            <Badge variant="outline" className={cn("text-[10px] font-bold py-0 h-5", config.bgColor, config.borderColor, config.textColor)}>
              {getDisplayLabel(log.entityType)}
            </Badge>
          </div>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground cursor-help">
                  <Clock className="w-3 h-3" />
                  {formatDistanceToNow(createdAt, { locale: es, addSuffix: true })}
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-xs">{format(createdAt, "PPP 'a las' p", { locale: es })}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        <p className="text-sm text-muted-foreground leading-relaxed">
          {log.description}
        </p>

        {log.entityLabel && (
          <div className="flex items-center gap-2 mt-1">
            <div className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[10px] font-mono text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
              <ArrowRight className="w-3 h-3" />
              {log.entityLabel}
            </div>
            {log.entityId && (
              <span className="text-[10px] text-muted-foreground/50">ID: {log.entityId.slice(0, 8)}...</span>
            )}
          </div>
        )}

        <div className="flex items-center gap-1 text-[10px] text-muted-foreground mt-1">
          <span>Realizado por:</span>
          <span className="font-semibold text-navy dark:text-primary/80">{log.performedBy || "Sistema"}</span>
        </div>
      </div>
    </div>
  );
}