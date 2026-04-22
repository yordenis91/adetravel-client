import React from "react";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Eye, Plane } from "lucide-react";
import { RequestStatusBadge } from "@/components/requests/RequestStatusBadge";
import { Skeleton } from "@/components/ui/skeleton";

interface ConfirmacionesTableProps {
  requests: any[];
  clients: any[];
  payments: any[];
  vouchers: any[];
  isLoading: boolean;
  onView: (request: any) => void;
}

export function ConfirmacionesTable({ 
  requests, 
  clients, 
  payments, 
  vouchers, 
  isLoading, 
  onView 
}: ConfirmacionesTableProps) {
  
  const getClientName = (clientId: string) => {
    const client = clients.find(c => c.id === clientId);
    return client ? `${client.firstName} ${client.lastName}` : "Cliente Desconocido";
  };

  const getCompletedPaymentsTotal = (requestId: string) => {
    const requestPayments = payments.filter(p => p.requestId === requestId && p.status === "COMPLETADO");
    // For simplicity, summing CLP. If USD exists, we might need a separate total or conversion.
    const clpTotal = requestPayments
      .filter(p => p.currency === "CLP")
      .reduce((acc, p) => acc + (p.amount || 0), 0);
    
    return new Intl.NumberFormat("es-CL", {
      style: "currency",
      currency: "CLP",
    }).format(clpTotal);
  };

  const getEmittedVouchersCount = (requestId: string) => {
    return vouchers.filter(v => v.requestId === requestId && v.status === "EMITIDO").length;
  };

  if (isLoading) {
    return (
      <div className="p-4 space-y-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    );
  }

  if (requests.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center text-gray-300 mb-4">
          <Plane className="w-8 h-8" />
        </div>
        <h3 className="text-lg font-bold text-navy mb-1">No hay confirmaciones</h3>
        <p className="text-sm text-muted-foreground">No se encontraron reservas que coincidan con los criterios.</p>
      </div>
    );
  }

  return (
    <Table>
      <TableHeader className="bg-gray-50/50">
        <TableRow>
          <TableHead className="text-[10px] uppercase tracking-widest font-bold">N° Solicitud</TableHead>
          <TableHead className="text-[10px] uppercase tracking-widest font-bold">Cliente</TableHead>
          <TableHead className="text-[10px] uppercase tracking-widest font-bold">Destino</TableHead>
          <TableHead className="text-[10px] uppercase tracking-widest font-bold text-center">Pagos (CLP)</TableHead>
          <TableHead className="text-[10px] uppercase tracking-widest font-bold text-center">Vouchers</TableHead>
          <TableHead className="text-[10px] uppercase tracking-widest font-bold">Estado</TableHead>
          <TableHead className="text-right"></TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {requests.map((request) => (
          <TableRow key={request.id} className="group hover:bg-gray-50/50 transition-colors">
            <TableCell className="font-mono text-xs font-bold text-navy">
              {request.requestNumber || "S/N"}
            </TableCell>
            <TableCell>
              <span className="text-sm font-medium text-navy">{getClientName(request.clientId)}</span>
            </TableCell>
            <TableCell>
              <div className="flex flex-col">
                <span className="text-sm text-navy">{request.destinationCity}</span>
                <span className="text-[10px] text-muted-foreground uppercase">{request.destinationCountry}</span>
              </div>
            </TableCell>
            <TableCell className="text-center">
              <span className="text-xs font-bold text-emerald-600">
                {getCompletedPaymentsTotal(request.id)}
              </span>
            </TableCell>
            <TableCell className="text-center">
              <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-amber-50 text-amber-600 text-[10px] font-bold">
                {getEmittedVouchersCount(request.id)}
              </span>
            </TableCell>
            <TableCell>
              <RequestStatusBadge status={request.status} />
            </TableCell>
            <TableCell className="text-right">
              <Button 
                variant="ghost" 
                size="icon" 
                className="opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => onView(request)}
              >
                <Eye className="w-4 h-4 text-navy" />
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
