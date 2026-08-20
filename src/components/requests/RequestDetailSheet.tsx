import React from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { RequestStatusBadge } from "./RequestStatusBadge";
import { RequestStatusFlow } from "./RequestStatusFlow";
import { RequestStatusActions } from "./RequestStatusActions";
import { ServicesSection } from "@/components/services/ServicesSection";
import {
  Calendar,
  MapPin,
  User,
  DollarSign,
  Briefcase,
  FileText,
  ArrowRight,
  Edit2,
} from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface RequestDetailSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  request: any;
  clients: any[];
  onStatusChange: (id: string, newStatus: string, cancellationReason?: string) => void;
  onEdit: (request: any) => void;
}

export function RequestDetailSheet({
  open,
  onOpenChange,
  request,
  clients,
  onStatusChange,
  onEdit
}: RequestDetailSheetProps) {
  if (!request) return null;

  const client = clients.find(c => c.id === request.clientId);
  const clientName = client ? `${client.firstName} ${client.lastName}` : "Cargando...";

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(amount || 0);
  };

  const handleStatusUpdate = (newStatus: string, cancellationReason?: string) => {
    onStatusChange(request.id, newStatus, cancellationReason);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-[700px] p-0 flex flex-col">
        <SheetHeader className="p-8 pb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-mono font-bold text-primary px-2 py-1 bg-primary/10 rounded tracking-tighter">
              {request.requestNumber}
            </span>
            <RequestStatusBadge status={request.status} />
          </div>
          <SheetTitle className="text-3xl font-playfair font-bold text-navy">
            Detalle de Solicitud
          </SheetTitle>
          <SheetDescription>
            Visualiza y gestiona el progreso de esta oportunidad de viaje.
          </SheetDescription>
        </SheetHeader>

        <ScrollArea className="flex-1 px-8">
          <div className="space-y-8 pb-10">
            {/* Flujo de Estados */}
            <div className="bg-slate-50/50 p-6 rounded-2xl border border-slate-100">
              <h4 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-4">Progreso de la Solicitud</h4>
              <RequestStatusFlow currentStatus={request.status} />

              <div className="mt-6">
                <RequestStatusActions currentStatus={request.status} onChange={handleStatusUpdate} />
              </div>

              {request.status === "CANCELADA" && request.cancellationReason && (
                <div className="mt-4 p-3 bg-rose-50 border border-rose-100 rounded-lg">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-rose-600 mb-1">Motivo de cancelación</p>
                  <p className="text-sm text-rose-700">{request.cancellationReason}</p>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Cliente */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-primary">
                  <User className="w-4 h-4" />
                  <span className="text-[10px] font-bold uppercase tracking-widest">Información del Cliente</span>
                </div>
                <div className="p-4 bg-white rounded-xl border border-slate-100 shadow-sm">
                  <p className="text-lg font-playfair font-bold text-navy">{clientName}</p>
                  <p className="text-xs text-muted-foreground mt-1">ID Cliente: {request.clientId}</p>
                </div>
              </div>

              {/* Fecha y Duración */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-primary">
                  <Calendar className="w-4 h-4" />
                  <span className="text-[10px] font-bold uppercase tracking-widest">Fechas y Duración</span>
                </div>
                <div className="p-4 bg-white rounded-xl border border-slate-100 shadow-sm flex items-center justify-between">
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-tighter">Fecha Solicitud</p>
                    <p className="text-sm font-bold text-navy">
                      {request.requestDate ? format(new Date(request.requestDate), 'dd MMMM, yyyy', { locale: es }) : '-'}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-tighter">Duración</p>
                    <p className="text-sm font-bold text-navy">{request.durationDays} Días</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Itinerario */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-primary">
                <MapPin className="w-4 h-4" />
                <span className="text-[10px] font-bold uppercase tracking-widest">Itinerario y Destino</span>
              </div>
              <div className="p-5 bg-white rounded-xl border border-slate-100 shadow-sm">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex-1">
                    <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-tighter">Desde</p>
                    <p className="text-base font-bold text-navy">{request.originCity || "N/A"}, {request.originCountry || "N/A"}</p>
                  </div>
                  <div className="flex flex-col items-center px-4">
                    <ArrowRight className="w-5 h-5 text-primary" />
                    <span className="text-[10px] font-bold text-primary mt-1">{request.isPackage ? "PAQUETE" : "SERVICIO"}</span>
                  </div>
                  <div className="flex-1 text-right">
                    <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-tighter">Hacia</p>
                    <p className="text-base font-bold text-navy">{request.destinationCity}, {request.destinationCountry}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Presupuesto */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-primary">
                <DollarSign className="w-4 h-4" />
                <span className="text-[10px] font-bold uppercase tracking-widest">Presupuesto Estimado</span>
              </div>
              <div className="p-4 bg-white rounded-xl border border-slate-100 shadow-sm">
                <p className="text-[10px] text-muted-foreground uppercase font-bold">Rango</p>
                <p className="text-sm font-bold text-navy">
                  {formatCurrency(request.budgetMin)} - {formatCurrency(request.budgetMax)}
                </p>
              </div>
            </div>

            {/* Servicios */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-primary">
                <Briefcase className="w-4 h-4" />
                <span className="text-[10px] font-bold uppercase tracking-widest">Servicios</span>
              </div>
              <ServicesSection requestId={request.id} isPackage={!!request.isPackage} defaultClientId={request.clientId} />
            </div>

            {/* Descripción */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-primary">
                <FileText className="w-4 h-4" />
                <span className="text-[10px] font-bold uppercase tracking-widest">Descripción y Requerimientos</span>
              </div>
              <div className="p-5 bg-white rounded-xl border border-slate-100 shadow-sm min-h-[100px]">
                <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">
                  {request.description || "Sin descripción adicional proporcionada."}
                </p>
              </div>
            </div>
          </div>
        </ScrollArea>

        <SheetFooter className="p-8 border-t border-slate-100 bg-slate-50/50">
          <Button type="button" variant="outline" onClick={() => onEdit(request)} className="mr-auto gap-2 text-xs font-bold uppercase tracking-wider">
            <Edit2 className="w-4 h-4" />
            Editar Solicitud
          </Button>
          <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} className="text-xs font-bold uppercase tracking-wider">
            Cerrar
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
