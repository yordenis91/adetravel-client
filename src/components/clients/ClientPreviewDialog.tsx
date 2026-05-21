// filename: ClientPreviewDialog.tsx
import React from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { 
  User, 
  Fingerprint, 
  Phone, 
  Mail, 
  Globe, 
  MapPin, 
  Compass, 
  HeartCrack, 
  CreditCard,
  Building
} from "lucide-react";

interface ClientPreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  client: any;
}

export function ClientPreviewDialog({ open, onOpenChange, client }: ClientPreviewDialogProps) {
  if (!client) return null;

  // Mapa de etiquetas legibles para las fuentes de referencia
  const REFERRAL_LABELS: Record<string, string> = {
    CONSULATE: "Consulado",
    REFERRAL: "Referido",
    WEBSITE: "Sitio Web",
    OTHER: "Otros / Directo",
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-[550px] p-0 flex flex-col border-l border-slate-100">
        
        {/* Cabecera del Perfil con Identificación Rápida */}
        <SheetHeader className="p-8 pb-6 bg-gradient-to-b from-slate-50/80 to-transparent">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-navy text-white flex items-center justify-center font-playfair font-bold text-xl shadow-md border-2 border-white">
                {client.firstName?.[0]}{client.lastName?.[0]}
              </div>
              <div>
                <SheetTitle className="text-2xl font-playfair font-bold text-navy leading-tight">
                  {client.firstName} {client.lastName}
                </SheetTitle>
                <SheetDescription className="text-xs text-muted-foreground mt-1 flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-slate-400" />
                  {client.nationality || "Nacionalidad no especificada"}
                </SheetDescription>
              </div>
            </div>
            
            <Badge 
              variant="outline" 
              className={cn(
                "text-[10px] font-bold uppercase tracking-widest px-3 py-1 border-none rounded-full shadow-sm",
                client.isActive ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-500"
              )}
            >
              {client.isActive ? "Activo" : "Inactivo"}
            </Badge>
          </div>
        </SheetHeader>

        <Separator className="bg-slate-100" />

        {/* Contenido Desplazable y Estructurado */}
        <ScrollArea className="flex-1 px-8">
          <div className="space-y-6 py-6 pb-12">
            
            {/* Sección 1: Documentación e Identidad */}
            <div className="bg-slate-50/50 rounded-2xl p-5 border border-slate-100/80 space-y-4">
              <h4 className="text-[11px] font-bold uppercase tracking-widest text-primary flex items-center gap-2">
                <Fingerprint className="w-4 h-4 text-primary/70" /> Identificación Oficial
              </h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">RUT / ID</p>
                  <p className="text-sm font-medium text-navy mt-0.5">{client.rut || "—"}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Pasaporte</p>
                  <p className="text-sm font-medium text-navy mt-0.5">{client.passportNumber || "—"}</p>
                </div>
              </div>
              <div className="pt-2 border-t border-slate-100">
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-slate-400" /> Dirección Residencial
                </p>
                <p className="text-sm font-medium text-navy mt-1">{client.address || "Dirección no registrada"}</p>
              </div>
            </div>

            {/* Sección 2: Información de Contacto */}
            <div className="bg-slate-50/50 rounded-2xl p-5 border border-slate-100/80 space-y-4">
              <h4 className="text-[11px] font-bold uppercase tracking-widest text-blue-600 flex items-center gap-2">
                <Phone className="w-4 h-4 text-blue-500/70" /> Canales de Contacto
              </h4>
              <div className="space-y-3">
                <div className="flex items-center gap-3 bg-white p-2.5 rounded-xl border border-slate-100">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
                    <Mail className="w-4 h-4" />
                  </div>
                  <div className="overflow-hidden">
                    <p className="text-[9px] font-bold uppercase text-muted-foreground">Correo Electrónico</p>
                    <p className="text-sm font-medium text-navy truncate">{client.email || "Sin correo"}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 bg-white p-2.5 rounded-xl border border-slate-100">
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
                    <Phone className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-[9px] font-bold uppercase text-muted-foreground">Teléfono de Contacto</p>
                    <p className="text-sm font-medium text-navy">{client.phone || "Sin teléfono"}</p>
                  </div>
                </div>
              </div>
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                  <Compass className="w-3.5 h-3.5 text-slate-400" /> Origen de Captación:
                </span>
                <Badge variant="secondary" className="text-[10px] font-medium bg-slate-100 text-slate-700 hover:bg-slate-100">
                  {REFERRAL_LABELS[client.referralSource || "OTHER"]}
                </Badge>
              </div>
            </div>

            {/* Sección 3: Preferencias y Restricciones Médicas/Alimentarias */}
            <div className="bg-amber-50/30 rounded-2xl p-5 border border-amber-100/50 space-y-3">
              <h4 className="text-[11px] font-bold uppercase tracking-widest text-amber-700 flex items-center gap-2">
                <HeartCrack className="w-4 h-4 text-amber-600/70" /> Preferencias y Restricciones
              </h4>
              <div className="bg-white/80 p-3.5 rounded-xl border border-amber-100/40 text-sm text-navy whitespace-pre-line leading-relaxed min-h-[60px]">
                {client.restrictions || "El cliente no presenta restricciones de viaje, requerimientos alimentarios especiales ni alergias declaradas."}
              </div>
            </div>

            {/* Sección 4: Información Financiera de Respaldo */}
            <div className="bg-purple-50/30 rounded-2xl p-5 border border-purple-100/50 space-y-4">
              <h4 className="text-[11px] font-bold uppercase tracking-widest text-purple-700 flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-purple-600/70" /> Datos Bancarios (Reembolsos)
              </h4>
              {client.bankName || client.bankAccount ? (
                <div className="grid grid-cols-1 gap-3">
                  <div className="flex justify-between items-center bg-white/60 px-3 py-2 rounded-lg border border-purple-100/30">
                    <span className="text-[10px] font-bold uppercase text-muted-foreground flex items-center gap-1">
                      <Building className="w-3 h-3 text-purple-400" /> Banco
                    </span>
                    <span className="text-xs font-semibold text-navy">{client.bankName}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-white/60 p-2.5 rounded-lg border border-purple-100/30">
                      <span className="text-[9px] font-bold uppercase text-muted-foreground block">N° de Cuenta</span>
                      <span className="text-xs font-semibold text-navy mt-0.5 block truncate">{client.bankAccount || "—"}</span>
                    </div>
                    <div className="bg-white/60 p-2.5 rounded-lg border border-purple-100/30">
                      <span className="text-[9px] font-bold uppercase text-muted-foreground block">Titular</span>
                      <span className="text-xs font-semibold text-navy mt-0.5 block truncate">{client.bankAccountHolder || "—"}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-muted-foreground italic pl-1">No se han ingresado datos bancarios de respaldo.</p>
              )}
            </div>

          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}