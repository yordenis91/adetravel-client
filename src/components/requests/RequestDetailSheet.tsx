import React, { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { RequestStatusBadge } from "./RequestStatusBadge";
import { RequestStatusFlow } from "./RequestStatusFlow";
import { 
  Calendar, 
  MapPin, 
  User, 
  DollarSign, 
  Briefcase, 
  FileText,
  ArrowRight,
  ArrowLeft,
  XCircle,
  Edit2,
  CheckCircle2
} from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

interface RequestDetailSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  request: any;
  clients: any[];
  onStatusChange: (id: string, newStatus: string) => void;
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

  const [itemToConfirm, setItemToConfirm] = useState<string | null>(null);

  const client = clients.find(c => c.id === request.clientId);
  const clientName = client ? `${client.firstName} ${client.lastName}` : "Cargando...";

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(amount || 0);
  };

  const handleStatusUpdate = (newStatus: string) => {
    if (newStatus === "Cancelada") {
      setItemToConfirm(request.id);
    } else {
      onStatusChange(request.id, newStatus);
    }
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
              
              <div className="mt-6 flex flex-wrap gap-2 items-center justify-center">
                {request.status === "Recepcionada" && (
                  <Button onClick={() => handleStatusUpdate("Cotizada")} className="bg-amber-500 hover:bg-amber-600 text-white gap-2 font-bold text-xs uppercase tracking-wider">
                    <ArrowRight className="w-4 h-4" />
                    Marcar como Cotizada
                  </Button>
                )}
                {request.status === "Cotizada" && (
                  <>
                    <Button onClick={() => handleStatusUpdate("Recepcionada")} variant="outline" className="gap-2 font-bold text-xs uppercase tracking-wider">
                      <ArrowLeft className="w-4 h-4" />
                      Volver a Recepcionada
                    </Button>
                    <Button onClick={() => handleStatusUpdate("Confirmada")} className="bg-emerald-500 hover:bg-emerald-600 text-white gap-2 font-bold text-xs uppercase tracking-wider">
                      <ArrowRight className="w-4 h-4" />
                      Marcar como Confirmada
                    </Button>
                  </>
                )}
                {request.status === "Confirmada" && (
                  <>
                    <Button onClick={() => handleStatusUpdate("Cotizada")} variant="outline" className="gap-2 font-bold text-xs uppercase tracking-wider">
                      <ArrowLeft className="w-4 h-4" />
                      Volver a Cotizada
                    </Button>
                    <Button onClick={() => handleStatusUpdate("Vendida")} className="bg-purple-600 hover:bg-purple-700 text-white gap-2 font-bold text-xs uppercase tracking-wider">
                      <CheckCircle2 className="w-4 h-4" />
                      Marcar como Vendida
                    </Button>
                  </>
                )}
                {request.status === "Vendida" && (
                  <div className="flex items-center gap-2 px-4 py-2 bg-purple-50 text-purple-700 rounded-full font-bold text-xs uppercase tracking-widest">
                    <CheckCircle2 className="w-4 h-4" />
                    Solicitud Completada y Vendida
                  </div>
                )}
                {request.status !== "Cancelada" && request.status !== "Vendida" && (
                  <Button onClick={() => handleStatusUpdate("Cancelada")} variant="ghost" className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 gap-2 font-bold text-xs uppercase tracking-wider ml-auto">
                    <XCircle className="w-4 h-4" />
                    Cancelar
                  </Button>
                )}
              </div>
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

            {/* Presupuesto y Servicios */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-primary">
                  <DollarSign className="w-4 h-4" />
                  <span className="text-[10px] font-bold uppercase tracking-widest">Presupuesto Estimado</span>
                </div>
                <div className="p-4 bg-white rounded-xl border border-slate-100 shadow-sm">
                  <div className="flex justify-between items-end">
                    <div>
                      <p className="text-[10px] text-muted-foreground uppercase font-bold">Rango</p>
                      <p className="text-sm font-bold text-navy">
                        {formatCurrency(request.budgetMin)} - {formatCurrency(request.budgetMax)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-primary">
                  <Briefcase className="w-4 h-4" />
                  <span className="text-[10px] font-bold uppercase tracking-widest">Servicios Incluidos</span>
                </div>
                <div className="p-4 bg-white rounded-xl border border-slate-100 shadow-sm">
                  <div className="flex flex-wrap gap-1.5">
                    {request.services?.map((s: string) => (
                      <Badge key={s} variant="secondary" className="text-[9px] px-2 py-0 bg-blue-50 text-blue-600 border-none font-bold">
                        {s}
                      </Badge>
                    ))}
                    {!request.services?.length && <p className="text-xs text-muted-foreground">Ninguno seleccionado</p>}
                  </div>
                </div>
              </div>
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
        <AlertDialog open={!!itemToConfirm} onOpenChange={(open) => !open && setItemToConfirm(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
              <AlertDialogDescription>Esta acción cancelará la solicitud y no se puede deshacer.</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={() => { if (itemToConfirm) { onStatusChange(itemToConfirm, "Cancelada"); setItemToConfirm(null); } }}>
                Confirmar
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </SheetContent>
    </Sheet>
  );
}
