import React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  Eye, 
  Edit2, 
  Trash2, 
  MapPin, 
  Calendar,
  MoreVertical,
  Printer,
  CheckCircle,
  FileEdit,
  XCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { VoucherStatusBadge } from "./VoucherStatusBadge";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface VouchersTableProps {
  vouchers: any[];
  clients: any[];
  requests: any[];
  isLoading: boolean;
  onEdit: (voucher: any) => void;
  onDelete: (id: string) => void;
  onPreviewPDF: (voucher: any) => void;
  onStatusChange: (id: string, newStatus: string) => void;
}

export function VouchersTable({ 
  vouchers, 
  clients, 
  requests, 
  isLoading, 
  onEdit, 
  onDelete,
  onPreviewPDF,
  onStatusChange
}: VouchersTableProps) {
  if (isLoading) {
    return (
      <div className="p-8 space-y-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <Skeleton key={i} className="h-16 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  if (vouchers.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-4">
          <Calendar className="w-10 h-10 text-muted-foreground/40" />
        </div>
        <h3 className="text-xl font-playfair font-bold text-navy">No se encontraron vouchers</h3>
        <p className="text-muted-foreground max-w-xs mx-auto mt-2">
          No hay registros que coincidan con su búsqueda o filtros actuales.
        </p>
      </div>
    );
  }

  const getClientName = (clientId: string) => {
    const client = clients.find((c) => c.id === clientId);
    return client ? `${client.firstName} ${client.lastName}` : "Cliente no encontrado";
  };

  const getRequestNumber = (requestId: string) => {
    const request = requests.find((r) => r.id === requestId);
    return request ? request.requestNumber : "N/A";
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "-";
    try {
      return format(new Date(dateStr), "dd MMM yyyy", { locale: es });
    } catch (e) {
      return dateStr;
    }
  };

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent border-b-muted/50">
            <TableHead className="w-[150px] font-bold text-navy uppercase tracking-wider text-[11px]">N° Voucher</TableHead>
            <TableHead className="font-bold text-navy uppercase tracking-wider text-[11px]">Cliente / Solicitud</TableHead>
            <TableHead className="font-bold text-navy uppercase tracking-wider text-[11px]">Servicio</TableHead>
            <TableHead className="font-bold text-navy uppercase tracking-wider text-[11px]">Destino</TableHead>
            <TableHead className="font-bold text-navy uppercase tracking-wider text-[11px]">Fechas</TableHead>
            <TableHead className="font-bold text-navy uppercase tracking-wider text-[11px]">Estado</TableHead>
            <TableHead className="text-right font-bold text-navy uppercase tracking-wider text-[11px]">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {vouchers.map((voucher) => (
            <TableRow key={voucher.id} className="group hover:bg-muted/30 transition-colors">
              <TableCell className="font-medium">
                <span className="text-xs font-bold text-navy bg-navy/5 px-2 py-1 rounded">
                  {voucher.voucherNumber}
                </span>
              </TableCell>
              <TableCell>
                <div className="flex flex-col">
                  <span className="font-bold text-sm text-navy">{getClientName(voucher.clientId)}</span>
                  <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-tighter italic">
                    REF: {getRequestNumber(voucher.requestId)}
                  </span>
                </div>
              </TableCell>
              <TableCell>
                <div className="flex flex-col">
                  <span className="font-bold text-[11px] text-primary uppercase tracking-wider">{voucher.serviceType}</span>
                  <span className="text-sm font-medium text-navy">{voucher.serviceName}</span>
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-3 h-3 text-muted-foreground" />
                  <span className="text-sm font-medium">{voucher.destination}</span>
                </div>
              </TableCell>
              <TableCell>
                <div className="flex flex-col gap-0.5">
                  <div className="flex items-center gap-1.5 text-[11px] font-bold">
                    <span className="text-muted-foreground w-6">IN:</span>
                    <span>{formatDate(voucher.checkIn)}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[11px] font-bold">
                    <span className="text-muted-foreground w-6">OUT:</span>
                    <span>{formatDate(voucher.checkOut)}</span>
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <VoucherStatusBadge status={voucher.status} />
              </TableCell>
              <TableCell className="text-right">
                <div className="flex items-center justify-end gap-1">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8 rounded-lg text-muted-foreground hover:text-navy hover:bg-navy/5"
                    onClick={() => onPreviewPDF(voucher)}
                    title="Ver PDF"
                  >
                    <Printer className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-muted-foreground hover:text-navy hover:bg-navy/5">
                    <Eye className="w-4 h-4" />
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-muted-foreground">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-40">
                      <DropdownMenuItem onClick={() => onEdit(voucher)} className="gap-2 cursor-pointer">
                        <Edit2 className="w-4 h-4" /> Editar
                      </DropdownMenuItem>

                      {voucher.status !== 'EMITIDO' && (
                        <DropdownMenuItem onClick={() => onStatusChange(voucher.id, 'EMITIDO')} className="gap-2 cursor-pointer text-emerald-600">
                          <CheckCircle className="w-4 h-4" /> Emitir Voucher
                        </DropdownMenuItem>
                      )}
                      {voucher.status !== 'BORRADOR' && (
                        <DropdownMenuItem onClick={() => onStatusChange(voucher.id, 'BORRADOR')} className="gap-2 cursor-pointer text-slate-500">
                          <FileEdit className="w-4 h-4" /> Volver a Borrador
                        </DropdownMenuItem>
                      )}
                      {voucher.status !== 'CANCELADO' && (
                        <DropdownMenuItem onClick={() => onStatusChange(voucher.id, 'CANCELADO')} className="gap-2 cursor-pointer text-destructive">
                          <XCircle className="w-4 h-4" /> Cancelar Voucher
                        </DropdownMenuItem>
                      )}

                      <DropdownMenuItem onClick={() => onDelete(voucher.id)} className="gap-2 cursor-pointer text-destructive focus:text-destructive">
                        <Trash2 className="w-4 h-4" /> Eliminar
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
