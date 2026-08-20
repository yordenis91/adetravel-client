import React, { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Eye,
  Edit2,
  MoreHorizontal,
  FileText,
  ArrowRight,
  ArrowLeft,
  XCircle,
  MapPin,
  Calendar
} from "lucide-react";
import { RequestStatusBadge } from "./RequestStatusBadge";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { STATUS_LABELS, VALID_TRANSITIONS, WorkflowStatus } from "@/lib/workflow-status";

interface RequestsTableProps {
  requests: any[];
  isLoading: boolean;
  clients: any[];
  onEdit: (request: any) => void;
  onView: (request: any) => void;
  onStatusChange: (id: string, newStatus: string, cancellationReason?: string) => void;
}

export function RequestsTable({
  requests,
  isLoading,
  clients,
  onEdit,
  onView,
  onStatusChange
}: RequestsTableProps) {
  const [cancelTargetId, setCancelTargetId] = useState<string | null>(null);
  const [cancellationReason, setCancellationReason] = useState("");

  const handleConfirmCancel = () => {
    if (!cancelTargetId || !cancellationReason.trim()) return;
    onStatusChange(cancelTargetId, "CANCELADA", cancellationReason.trim());
    setCancelTargetId(null);
    setCancellationReason("");
  };

  const getClientName = (clientId: string) => {
    if (!clientId) return "Sin cliente asignado";
    const client = clients.find(c => c.id === clientId);
    return client ? `${client.firstName} ${client.lastName}` : "Cargando...";
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(amount);
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3, 4, 5].map((i) => (
          <Skeleton key={i} className="h-16 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  if (requests.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
        <div className="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center mb-4">
          <FileText className="w-8 h-8 text-slate-300" />
        </div>
        <h3 className="text-lg font-playfair font-bold text-navy">Sin solicitudes</h3>
        <p className="text-sm text-muted-foreground max-w-xs text-center mt-1">
          No se encontraron solicitudes que coincidan con los filtros actuales.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-slate-100">
      <Table>
        <TableHeader className="bg-slate-50/50">
          <TableRow>
            <TableHead className="text-xs font-bold uppercase tracking-wider">ID</TableHead>
            <TableHead className="text-xs font-bold uppercase tracking-wider">Cliente</TableHead>
            <TableHead className="text-xs font-bold uppercase tracking-wider">Destino</TableHead>
            <TableHead className="text-xs font-bold uppercase tracking-wider">Servicios</TableHead>
            <TableHead className="text-xs font-bold uppercase tracking-wider">Presupuesto</TableHead>
            <TableHead className="text-xs font-bold uppercase tracking-wider">Estado</TableHead>
            <TableHead className="text-xs font-bold uppercase tracking-wider">Fecha</TableHead>
            <TableHead className="text-right text-xs font-bold uppercase tracking-wider">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {requests.map((request) => (
            <TableRow key={request.id} className="group hover:bg-slate-50/50 transition-colors">
              <TableCell className="font-mono text-xs font-bold text-primary">
                {request.requestNumber}
              </TableCell>
              <TableCell>
                <p className="text-sm font-bold text-navy">{getClientName(request.clientId)}</p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-tight">ID: {request.clientId?.substring(0, 8) ?? 'N/A'}</p>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-3 h-3 text-primary" />
                  <span className="text-sm font-medium">{request.destinationCity}, {request.destinationCountry}</span>
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-1">
                  {request.services?.slice(0, 2).map((s: string) => (
                    <Badge key={s} variant="secondary" className="text-[9px] px-1.5 py-0 bg-blue-50 text-blue-600 border-none">
                      {s}
                    </Badge>
                  ))}
                  {request.services?.length > 2 && (
                    <span className="text-[10px] text-muted-foreground font-bold">+{request.services.length - 2}</span>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <p className="text-xs font-bold text-navy">
                  {formatCurrency(request.budgetMin || 0)} - {formatCurrency(request.budgetMax || 0)}
                </p>
              </TableCell>
              <TableCell>
                <RequestStatusBadge status={request.status} />
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <Calendar className="w-3 h-3" />
                  <span className="text-xs">
                    {request.requestDate ? format(new Date(request.requestDate), 'dd MMM', { locale: es }) : '-'}
                  </span>
                </div>
              </TableCell>
              <TableCell className="text-right">
                <div className="flex items-center justify-end gap-1 ">
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50" onClick={() => onView(request)}>
                    <Eye className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-primary hover:bg-primary/5" onClick={() => onEdit(request)}>
                    <Edit2 className="w-4 h-4" />
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-64">
                      <DropdownMenuLabel className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">Gestionar Estado</DropdownMenuLabel>

                      {(VALID_TRANSITIONS[request.status] ?? [])
                        .filter((s) => s !== "CANCELADA")
                        .map((nextStatus) => (
                          <DropdownMenuItem key={nextStatus} onClick={() => onStatusChange(request.id, nextStatus)}>
                            {nextStatus === "RECEPCIONADA" ? (
                              <ArrowLeft className="mr-2 h-4 w-4 text-blue-500" />
                            ) : (
                              <ArrowRight className="mr-2 h-4 w-4 text-emerald-500" />
                            )}
                            {STATUS_LABELS[nextStatus as WorkflowStatus]}
                          </DropdownMenuItem>
                        ))}

                      {request.status !== "CANCELADA" && request.status !== "VENDIDA" && (
                        <>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-destructive" onClick={() => setCancelTargetId(request.id)}>
                            <XCircle className="mr-2 h-4 w-4" />
                            Cancelar Solicitud
                          </DropdownMenuItem>
                        </>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <AlertDialog open={!!cancelTargetId} onOpenChange={(open) => { if (!open) { setCancelTargetId(null); setCancellationReason(""); } }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Cancelar esta solicitud?</AlertDialogTitle>
            <AlertDialogDescription>Esta acción no se puede deshacer. Indica el motivo de la cancelación (obligatorio).</AlertDialogDescription>
          </AlertDialogHeader>
          <Textarea
            value={cancellationReason}
            onChange={(e) => setCancellationReason(e.target.value)}
            placeholder="Ej: El cliente desistió del viaje por motivos personales"
            className="min-h-[80px]"
          />
          <AlertDialogFooter>
            <AlertDialogCancel>Volver</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmCancel} disabled={!cancellationReason.trim()} className="bg-rose-600 hover:bg-rose-700">
              Confirmar cancelación
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
