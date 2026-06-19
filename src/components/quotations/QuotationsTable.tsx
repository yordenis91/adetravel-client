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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { QuotationStatusBadge } from "./QuotationStatusBadge";
import { 
  Eye, 
  Edit2, 
  MoreHorizontal, 
  FileText, 
  Send, 
  CheckCircle2, 
  XCircle,
  FileDown,
  Copy,
  ArrowLeft,
  RefreshCw,
  Calendar
} from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface QuotationsTableProps {
  quotations: any[];
  requests: any[];
  clients: any[];
  isLoading: boolean;
  onEdit: (quotation: any) => void;
  onView: (quotation: any) => void;
  onStatusChange: (id: string, newStatus: string) => void;
  onPreviewPDF: (quotation: any) => void;
  onDuplicate: (id: string) => void;
}

export function QuotationsTable({
  quotations,
  requests,
  clients,
  isLoading,
  onEdit,
  onView,
  onStatusChange,
  onPreviewPDF,
  onDuplicate,
}: QuotationsTableProps) {
  
  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat(currency === "CLP" ? "es-CL" : "en-US", {
      style: "currency",
      currency: currency || "CLP",
      minimumFractionDigits: 0,
    }).format(amount || 0);
  };

  const getClientDetails = (clientId: string) => {
    const client = clients.find((c) => c.id === clientId);
    return client ? { name: `${client.firstName} ${client.lastName}`, id: client.id } : { name: "Desconocido", id: null };
  };

  const getRequestNumber = (requestId: string) => {
    const request = requests.find((r) => r.id === requestId);
    return request ? request.requestNumber : "---";
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

  if (quotations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
        <div className="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center mb-4">
          <FileText className="w-8 h-8 text-slate-300" />
        </div>
        <h3 className="text-lg font-playfair font-bold text-navy">Sin cotizaciones</h3>
        <p className="text-sm text-muted-foreground max-w-xs text-center mt-1">
          No se encontraron documentos que coincidan con la búsqueda.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-slate-100 bg-white">
      <Table>
        <TableHeader className="bg-slate-50/50">
          <TableRow>
            <TableHead className="text-xs font-bold uppercase tracking-wider">N° Cotización</TableHead>
            <TableHead className="text-xs font-bold uppercase tracking-wider">Cliente</TableHead>
            <TableHead className="text-xs font-bold uppercase tracking-wider">Solicitud</TableHead>
            <TableHead className="text-xs font-bold uppercase tracking-wider">Válida Hasta</TableHead>
            <TableHead className="text-xs font-bold uppercase tracking-wider">Total</TableHead>
            <TableHead className="text-xs font-bold uppercase tracking-wider">Estado</TableHead>
            <TableHead className="text-right text-xs font-bold uppercase tracking-wider">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {quotations.map((quotation) => {
            const clientDetails = getClientDetails(quotation.clientId);
            return (
              <TableRow key={quotation.id} className="group hover:bg-slate-50/50 transition-colors">
                <TableCell className="font-mono text-xs font-bold text-primary">
                  {quotation.quotationNumber}
                </TableCell>
                <TableCell>
                  <p className="text-sm font-bold text-navy">{clientDetails.name}</p>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-tight">ID: {clientDetails.id?.substring(0, 8) ?? 'N/A'}</p>
                </TableCell>
                <TableCell>
                  <span className="font-mono text-xs text-muted-foreground font-medium">
                    {getRequestNumber(quotation.requestId)}
                  </span>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <Calendar className="w-3 h-3" />
                    <span className="text-xs">
                      {quotation.validUntil ? format(new Date(quotation.validUntil), "dd MMM, yyyy", { locale: es }) : "---"}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <p className="text-xs font-bold text-navy">
                    {formatCurrency(quotation.total, quotation.currency)}
                  </p>
                </TableCell>
                <TableCell>
                  <QuotationStatusBadge status={quotation.status} />
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50" onClick={() => onPreviewPDF(quotation)} title="Ver/Descargar PDF">
                      <FileDown className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50" onClick={() => onView(quotation)} title="Vista Previa">
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-primary hover:bg-primary/5" onClick={() => onEdit(quotation)} title="Editar Cotización">
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56">
                          <DropdownMenuLabel className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">Gestionar Estado</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                        
                          {/* Desde Borrador */}
                          {quotation.status === "Borrador" && (
                            <>
                              <DropdownMenuItem onClick={() => onStatusChange(quotation.id, "Enviada")}>
                                <Send className="mr-2 h-4 w-4 text-blue-500" /> 
                                Marcar como Enviada
                              </DropdownMenuItem>
                              <DropdownMenuItem className="text-destructive" onClick={() => onStatusChange(quotation.id, "Rechazada")}>
                                <XCircle className="mr-2 h-4 w-4" /> 
                                Marcar como Rechazada
                              </DropdownMenuItem>
                            </>
                          )}
                        
                          {/* Desde Enviada */}
                          {quotation.status === "Enviada" && (
                            <>
                              <DropdownMenuItem onClick={() => onStatusChange(quotation.id, "Aceptada")}>
                                <CheckCircle2 className="mr-2 h-4 w-4 text-emerald-500" /> 
                                Aceptar Cotización
                              </DropdownMenuItem>
                              <DropdownMenuItem className="text-destructive" onClick={() => onStatusChange(quotation.id, "Rechazada")}>
                                <XCircle className="mr-2 h-4 w-4" /> 
                                Rechazar Cotización
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => onStatusChange(quotation.id, "Borrador")}>
                                <ArrowLeft className="mr-2 h-4 w-4 text-amber-500" /> 
                                Volver a Borrador
                              </DropdownMenuItem>
                            </>
                          )}

                          {/* Desde Fue Rechazada */}
                          {quotation.status === "Rechazada" && (
                            <DropdownMenuItem onClick={() => onStatusChange(quotation.id, "Borrador")}>
                              <RefreshCw className="mr-2 h-4 w-4 text-blue-500" /> 
                              Reabrir a Borrador
                            </DropdownMenuItem>
                          )}

                          {/* Desde Fue Aceptada */}
                          {quotation.status === "Aceptada" && (
                            <DropdownMenuItem disabled className="text-slate-400">
                              Cotización Aceptada (Cerrada)
                            </DropdownMenuItem>
                          )}

                          {/* ACCIONES GENERALES */}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => onDuplicate(quotation.id)}>
                            <Copy className="mr-2 h-4 w-4 text-slate-500" />
                            Duplicar / Nueva Versión
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}