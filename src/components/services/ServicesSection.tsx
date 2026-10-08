import React, { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { RequestStatusBadge } from "@/components/requests/RequestStatusBadge";
import { RequestStatusActions } from "@/components/requests/RequestStatusActions";
import { Plus, Edit2, Trash2, ChevronDown, ChevronUp, Package2 } from "lucide-react";
import { useRequestServices, useChangeServiceStatus, useDeleteService } from "@/hooks/useServices";
import { SERVICE_TYPE_LABELS } from "@/types/service";
import { useToast } from "@/hooks/use-toast";
import { getErrorMessage } from "@/lib/api";
import { PermissionGuard } from "@/components/PermissionGuard";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ServiceFormDialog } from "./ServiceFormDialog";

interface ServicesSectionProps {
  requestId: string;
  isPackage: boolean;
  defaultClientId?: string;
}

export function ServicesSection({ requestId, isPackage, defaultClientId }: ServicesSectionProps) {
  const { data: services, isLoading } = useRequestServices(requestId);
  const changeStatusMutation = useChangeServiceStatus();
  const deleteMutation = useDeleteService();
  const [serviceToDelete, setServiceToDelete] = useState<any>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingService, setEditingService] = useState<any>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const handleAdd = () => {
    setEditingService(null);
    setIsFormOpen(true);
  };

  const handleEdit = (service: any) => {
    setEditingService(service);
    setIsFormOpen(true);
  };

  const handleStatusChange = (serviceId: string, newStatus: string, note?: string) => {
    // Igual que en Solicitudes: cancellationReason queda en su propia columna del Servicio,
    // notes solo enriquece la Bitácora (ver changeServiceStatus en el backend).
    const payload = newStatus === "CANCELADA" ? { id: serviceId, status: newStatus, cancellationReason: note } : { id: serviceId, status: newStatus, notes: note };
    changeStatusMutation.mutate(payload, {
      onSuccess: () => {
        toast({ title: "Estado actualizado" });
        queryClient.invalidateQueries({ queryKey: ["requests", requestId] });
      },
      onError: (error) => {
        toast({ variant: "destructive", title: "No se pudo cambiar el estado", description: getErrorMessage(error, "Error al actualizar el servicio.") });
      },
    });
  };

  // Eliminar un servicio (p. ej. tras reactivar una solicitud cancelada). La API lo impide si tiene
  // cotizaciones o confirmaciones; en ese caso se muestra su motivo y se puede cancelar el servicio.
  const confirmDelete = () => {
    if (!serviceToDelete) return;
    deleteMutation.mutate(serviceToDelete.id, {
      onSuccess: () => toast({ title: "Servicio eliminado", description: serviceToDelete.serviceNumber }),
      onError: (error) => {
        toast({ variant: "destructive", title: "No se pudo eliminar el servicio", description: getErrorMessage(error, "Error al eliminar el servicio.") });
      },
      onSettled: () => setServiceToDelete(null),
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-16 w-full rounded-xl" />
        <Skeleton className="h-16 w-full rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {isPackage && (
        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-primary bg-primary/5 px-3 py-2 rounded-lg">
          <Package2 className="w-3.5 h-3.5" />
          Solicitud tipo Paquete: el estado se gestiona sobre la Solicitud y desciende automáticamente a estos servicios.
        </div>
      )}

      {services.length === 0 && (
        <div className="p-4 bg-white rounded-xl border border-dashed border-slate-200 text-center">
          <p className="text-xs text-muted-foreground">Sin servicios agregados todavía.</p>
        </div>
      )}

      {services.map((service: any) => {
        const isExpanded = expandedId === service.id;
        return (
          <div key={service.id} className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
            {/* Botones hermanos (no anidados): desplegar, editar y eliminar. */}
            <div className="w-full flex items-center justify-between p-4 hover:bg-slate-50/50 transition-colors">
              <button
                type="button"
                onClick={() => setExpandedId(isExpanded ? null : service.id)}
                aria-expanded={isExpanded}
                className="flex items-center gap-3 text-left flex-1"
              >
                <span className="text-[10px] font-mono font-bold text-primary px-2 py-1 bg-primary/10 rounded">{service.serviceNumber}</span>
                <div>
                  <p className="text-sm font-bold text-navy">{SERVICE_TYPE_LABELS[service.type as keyof typeof SERVICE_TYPE_LABELS] || service.type}</p>
                  {service.price != null && (
                    <p className="text-[10px] text-muted-foreground">{service.currency} {Number(service.price).toLocaleString("es-CL")}</p>
                  )}
                </div>
              </button>
              <div className="flex items-center gap-2">
                <RequestStatusBadge status={service.status} />
                <Button type="button" variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleEdit(service)} aria-label={`Editar servicio ${service.serviceNumber}`}>
                  <Edit2 className="w-3.5 h-3.5" aria-hidden="true" />
                </Button>
                <PermissionGuard permission="DELETE_SERVICE">
                  <Button type="button" variant="ghost" size="icon" className="h-7 w-7 text-red-600" onClick={() => setServiceToDelete(service)} aria-label={`Eliminar servicio ${service.serviceNumber}`}>
                    <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                  </Button>
                </PermissionGuard>
                <button
                  type="button"
                  onClick={() => setExpandedId(isExpanded ? null : service.id)}
                  aria-label={isExpanded ? "Ocultar acciones de estado" : "Mostrar acciones de estado"}
                  aria-expanded={isExpanded}
                >
                  {isExpanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                </button>
              </div>
            </div>

            {isExpanded && !isPackage && (
              <div className="p-4 pt-0 border-t border-slate-50">
                <RequestStatusActions
                  currentStatus={service.status}
                  onChange={(status, note) => handleStatusChange(service.id, status, note)}
                />
              </div>
            )}
          </div>
        );
      })}

      <Button type="button" variant="outline" onClick={handleAdd} className="w-full gap-2 text-xs font-bold uppercase tracking-wider border-dashed">
        <Plus className="w-4 h-4" />
        Agregar Servicio
      </Button>

      <AlertDialog open={!!serviceToDelete} onOpenChange={(open) => !open && setServiceToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar el servicio {serviceToDelete?.serviceNumber}?</AlertDialogTitle>
            <AlertDialogDescription>
              Se borra de la solicitud y no se puede deshacer. Si tiene cotizaciones o confirmaciones no se
              podrá eliminar: en ese caso cancélalo desde sus acciones de estado.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Volver</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Eliminar servicio
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <ServiceFormDialog
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        requestId={requestId}
        defaultClientId={defaultClientId}
        service={editingService}
        onSuccess={() => queryClient.invalidateQueries({ queryKey: ["requests", requestId, "services"] })}
      />
    </div>
  );
}
