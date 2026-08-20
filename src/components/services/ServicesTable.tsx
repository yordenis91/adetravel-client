import React from "react";
import { useNavigate } from "react-router-dom";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { RequestStatusBadge } from "@/components/requests/RequestStatusBadge";
import { SERVICE_TYPE_LABELS } from "@/types/service";
import { Eye, Package2 } from "lucide-react";

interface ServicesTableProps {
  services: any[];
  requests: any[];
  providers: any[];
  isLoading: boolean;
}

export function ServicesTable({ services, requests, providers, isLoading }: ServicesTableProps) {
  const navigate = useNavigate();

  const getRequestNumber = (requestId: string) => requests.find((r) => r.id === requestId)?.requestNumber || requestId?.substring(0, 8);
  const getProviderName = (providerId?: string | null) => {
    if (!providerId) return "—";
    const p = providers.find((pv) => pv.id === providerId);
    return p ? (p.fantasyName || p.name) : "—";
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-14 w-full rounded-xl" />)}
      </div>
    );
  }

  if (services.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
        <div className="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center mb-4">
          <Package2 className="w-8 h-8 text-slate-300" />
        </div>
        <h3 className="text-lg font-playfair font-bold text-navy">Sin servicios</h3>
        <p className="text-sm text-muted-foreground max-w-xs text-center mt-1">
          No se encontraron servicios que coincidan con los filtros actuales.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-slate-100">
      <Table>
        <TableHeader className="bg-slate-50/50">
          <TableRow>
            <TableHead className="text-xs font-bold uppercase tracking-wider">N° Servicio</TableHead>
            <TableHead className="text-xs font-bold uppercase tracking-wider">Tipo</TableHead>
            <TableHead className="text-xs font-bold uppercase tracking-wider">Solicitud</TableHead>
            <TableHead className="text-xs font-bold uppercase tracking-wider">Proveedor</TableHead>
            <TableHead className="text-xs font-bold uppercase tracking-wider">Precio</TableHead>
            <TableHead className="text-xs font-bold uppercase tracking-wider">Estado</TableHead>
            <TableHead className="text-right text-xs font-bold uppercase tracking-wider">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {services.map((service) => (
            <TableRow key={service.id} className="hover:bg-slate-50/50 transition-colors">
              <TableCell className="font-mono text-xs font-bold text-primary">{service.serviceNumber}</TableCell>
              <TableCell className="text-sm font-medium">{SERVICE_TYPE_LABELS[service.type as keyof typeof SERVICE_TYPE_LABELS] || service.type}</TableCell>
              <TableCell className="font-mono text-xs">{getRequestNumber(service.requestId)}</TableCell>
              <TableCell className="text-sm">{getProviderName(service.providerId)}</TableCell>
              <TableCell className="text-xs font-bold text-navy">
                {service.price != null ? `${service.currency} ${Number(service.price).toLocaleString("es-CL")}` : "—"}
              </TableCell>
              <TableCell><RequestStatusBadge status={service.status} /></TableCell>
              <TableCell className="text-right">
                <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50" onClick={() => navigate(`/solicitudes?view=${service.requestId}`)}>
                  <Eye className="w-4 h-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
