import React, { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { RequestStatusBadge } from "@/components/requests/RequestStatusBadge";
import { RequestStatusActions } from "@/components/requests/RequestStatusActions";
import { Plus, Edit2, ChevronDown, ChevronUp, Package2 } from "lucide-react";
import { useRequestServices, useChangeServiceStatus } from "@/hooks/useServices";
import { SERVICE_TYPE_LABELS } from "@/types/service";
import { useToast } from "@/hooks/use-toast";
import { ServiceFormDialog } from "./ServiceFormDialog";

interface ServicesSectionProps {
  requestId: string;
  isPackage: boolean;
  defaultClientId?: string;
}

export function ServicesSection({ requestId, isPackage, defaultClientId }: ServicesSectionProps) {
  const { data: services, isLoading } = useRequestServices(requestId);
  const changeStatusMutation = useChangeServiceStatus();
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

  const handleStatusChange = (serviceId: string, newStatus: string, cancellationReason?: string) => {
    changeStatusMutation.mutate({ id: serviceId, status: newStatus, cancellationReason }, {
      onSuccess: () => {
        toast({ title: "Estado actualizado" });
        queryClient.invalidateQueries({ queryKey: ["requests", requestId] });
      }
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
            <button
              type="button"
              onClick={() => setExpandedId(isExpanded ? null : service.id)}
              className="w-full flex items-center justify-between p-4 text-left hover:bg-slate-50/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className="text-[10px] font-mono font-bold text-primary px-2 py-1 bg-primary/10 rounded">{service.serviceNumber}</span>
                <div>
                  <p className="text-sm font-bold text-navy">{SERVICE_TYPE_LABELS[service.type as keyof typeof SERVICE_TYPE_LABELS] || service.type}</p>
                  {service.price != null && (
                    <p className="text-[10px] text-muted-foreground">{service.currency} {Number(service.price).toLocaleString("es-CL")}</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <RequestStatusBadge status={service.status} />
                <Button type="button" variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); handleEdit(service); }}>
                  <Edit2 className="w-3.5 h-3.5" />
                </Button>
                {isExpanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
              </div>
            </button>

            {isExpanded && !isPackage && (
              <div className="p-4 pt-0 border-t border-slate-50">
                <RequestStatusActions
                  currentStatus={service.status}
                  onChange={(status, reason) => handleStatusChange(service.id, status, reason)}
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
