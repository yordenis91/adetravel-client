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
  MoreHorizontal,
  Printer,
  Loader2,
  CheckCircle,
  FileEdit,
  XCircle,
  Ticket
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel,
  DropdownMenuSeparator,
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
  processingId?: string | null;
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
  processingId,
  onEdit, 
  onDelete,
  onPreviewPDF,
  onStatusChange
}: VouchersTableProps) {
  
  const getClientDetails = (clientId: string) => {
    const client = clients.find((c) => c.id === clientId);
    return client ? { name: `${client.firstName} ${client.lastName}`, id: client.id } : { name: "Cliente no encontrado", id: null };
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

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3, 4, 5].map((i) => (
          <Skeleton key={i} className="h-16 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  if (vouchers.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
        <div className="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center mb-4">
          <Ticket className="w-8 h-8 text-slate-300" />
        </div>
        <h3 className="text-lg font-playfair font-bold text-navy">Sin vouchers registrados</h3>
        <p className="text-sm text-muted-foreground max-w-xs text-center mt-1">
          No se encontraron comprobantes que coincidan con la búsqueda.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-slate-100 bg-white">
      <Table>
        <TableHeader className="bg-slate-50/50">
          <TableRow>
            <TableHead className="text-xs font-bold uppercase tracking-wider">N° Voucher</TableHead>
            <TableHead className="text-xs font-bold uppercase tracking-wider">Cliente / Solicitud</TableHead>
            <TableHead className="text-xs font-bold uppercase tracking-wider">Servicio</TableHead>
            <TableHead className="text-xs font-bold uppercase tracking-wider">Destino</TableHead>
            <TableHead className="text-xs font-bold uppercase tracking-wider">Fechas</TableHead>
            <TableHead className="text-xs font-bold uppercase tracking-wider">Estado</TableHead>
            <TableHead className="text-right text-xs font-bold uppercase tracking-wider">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {vouchers.map((voucher) => {
            const clientDetails = getClientDetails(voucher.clientId);
            
            return (
              <TableRow key={voucher.id} className="group hover:bg-slate-50/50 transition-colors">
                <TableCell>
                  <span className="font-mono text-xs font-bold text-primary bg-primary/5 px-2 py-1 rounded-md border border-primary/10">
                    {voucher.voucherNumber}
                  </span>
                </TableCell>
                <TableCell>
                  <p className="text-sm font-bold text-navy">{clientDetails.name}</p>
                  <div className="flex items-center gap-2 text-[10px] text-muted-foreground uppercase tracking-tight">
                    <span>ID: {clientDetails.id?.substring(0, 8) ?? 'N/A'}</span>
                    <span>•</span>
                    <span className="font-medium">REF: {getRequestNumber(voucher.requestId)}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-col">
                    <span className="font-bold text-[10px] text-blue-600 uppercase tracking-wider bg-blue-50 w-max px-1.5 py-0.5 rounded">
                      {voucher.serviceType}
                    </span>
                    <span className="text-xs font-medium text-navy mt-1">{voucher.serviceName}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-3 h-3 text-muted-foreground" />
                    <span className="text-xs font-medium">{voucher.destination}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-col gap-1 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-[9px] uppercase bg-slate-100 px-1 rounded text-slate-500">IN</span>
                      <span>{formatDate(voucher.checkIn)}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-[9px] uppercase bg-slate-100 px-1 rounded text-slate-500">OUT</span>
                      <span>{formatDate(voucher.checkOut)}</span>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <VoucherStatusBadge status={voucher.status} />
                </TableCell>
                <TableCell className="text-right">
                  {processingId === voucher.id ? (
                    <div className="flex justify-end items-center h-8 pr-4">
                      <Loader2 className="w-4 h-4 animate-spin text-primary" />
                    </div>
                  ) : (
                    <div className="flex items-center justify-end gap-1">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                        onClick={() => onPreviewPDF(voucher)}
                        title="Ver PDF"
                      >
                        <Printer className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50" title="Vista Previa">
                        <Eye className="w-4 h-4" />
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuLabel className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">
                            Gestionar Voucher
                          </DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          
                          <DropdownMenuItem onClick={() => onEdit(voucher)} className="cursor-pointer">
                            <Edit2 className="mr-2 h-4 w-4 text-blue-500" /> Editar datos
                          </DropdownMenuItem>

                          {voucher.status !== 'EMITIDO' && (
                            <DropdownMenuItem onClick={() => onStatusChange(voucher.id, 'EMITIDO')} className="cursor-pointer text-emerald-600">
                              <CheckCircle className="mr-2 h-4 w-4" /> Emitir Voucher
                            </DropdownMenuItem>
                          )}
                          {voucher.status !== 'BORRADOR' && (
                            <DropdownMenuItem onClick={() => onStatusChange(voucher.id, 'BORRADOR')} className="cursor-pointer text-amber-600">
                              <FileEdit className="mr-2 h-4 w-4" /> Volver a Borrador
                            </DropdownMenuItem>
                          )}
                          {voucher.status !== 'CANCELADO' && (
                            <DropdownMenuItem onClick={() => onStatusChange(voucher.id, 'CANCELADO')} className="cursor-pointer text-destructive">
                              <XCircle className="mr-2 h-4 w-4" /> Cancelar Voucher
                            </DropdownMenuItem>
                          )}
                          
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => onDelete(voucher.id)} className="cursor-pointer text-destructive focus:bg-destructive/10 focus:text-destructive">
                            <Trash2 className="mr-2 h-4 w-4" /> Eliminar registro
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  )}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}