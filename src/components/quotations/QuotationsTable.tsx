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
  RefreshCw
} from "lucide-react";
import { cn } from "@/lib/utils";
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

  const getClientName = (clientId: string) => {
    const client = clients.find((c) => c.id === clientId);
    return client ? `${client.firstName} ${client.lastName}` : "Desconocido";
  };

  const getRequestNumber = (requestId: string) => {
    const request = requests.find((r) => r.id === requestId);
    return request ? request.requestNumber : "---";
  };

  if (isLoading) {
    return (
      <div className="rounded-xl border border-slate-100 bg-white overflow-hidden">
        <Table>
          <TableHeader className="bg-slate-50/50">
            <TableRow>
              <TableHead className="w-[150px]">N° Cotización</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>Solicitud</TableHead>
              <TableHead>Válida Hasta</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {[1, 2, 3, 4, 5].map((i) => (
              <TableRow key={i}>
                {[1, 2, 3, 4, 5, 6, 7].map((j) => (
                  <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  }

  if (quotations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 bg-white rounded-xl border border-dashed border-slate-200">
        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
          <FileText className="w-8 h-8 text-slate-300" />
        </div>
        <h3 className="text-lg font-playfair font-bold text-navy">Sin cotizaciones</h3>
        <p className="text-sm text-muted-foreground mt-1">No se encontraron documentos que coincidan con la búsqueda.</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-slate-100 bg-white overflow-hidden shadow-sm">
      <Table>
        <TableHeader className="bg-slate-50/50">
          <TableRow className="hover:bg-transparent border-slate-100">
            <TableHead className="text-xs font-bold uppercase tracking-wider text-navy h-12">N° Cotización</TableHead>
            <TableHead className="text-xs font-bold uppercase tracking-wider text-navy h-12">Cliente</TableHead>
            <TableHead className="text-xs font-bold uppercase tracking-wider text-navy h-12">Solicitud</TableHead>
            <TableHead className="text-xs font-bold uppercase tracking-wider text-navy h-12">Válida Hasta</TableHead>
            <TableHead className="text-xs font-bold uppercase tracking-wider text-navy h-12">Total</TableHead>
            <TableHead className="text-xs font-bold uppercase tracking-wider text-navy h-12">Estado</TableHead>
            <TableHead className="text-right text-xs font-bold uppercase tracking-wider text-navy h-12">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {quotations.map((quotation) => (
            <TableRow key={quotation.id} className="hover:bg-slate-50/50 border-slate-50 transition-colors group">
              <TableCell className="font-mono text-xs font-medium text-navy">
                {quotation.quotationNumber}
              </TableCell>
              <TableCell>
                <div className="flex flex-col">
                  <span className="text-sm font-semibold text-navy">{getClientName(quotation.clientId)}</span>
                </div>
              </TableCell>
              <TableCell>
                <span className="text-xs text-muted-foreground font-medium">
                  {getRequestNumber(quotation.requestId)}
                </span>
              </TableCell>
              <TableCell className="text-xs text-slate-600">
                {quotation.validUntil ? format(new Date(quotation.validUntil), "dd MMM, yyyy", { locale: es }) : "---"}
              </TableCell>
              <TableCell className="font-bold text-navy text-sm">
                {formatCurrency(quotation.total, quotation.currency)}
              </TableCell>
              <TableCell>
                <QuotationStatusBadge status={quotation.status} />
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-1">
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50" onClick={() => onPreviewPDF(quotation)} title="Ver/Descargar PDF">
                    <FileDown className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50" onClick={() => onView(quotation)} title="Vista Previa">
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-amber-600 hover:text-amber-700 hover:bg-amber-50" onClick={() => onEdit(quotation)} title="Editar Cotización">
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
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

                        {/* 🌟 ACCIONES GENERALES: Disponible para cualquier estado */}
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
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
