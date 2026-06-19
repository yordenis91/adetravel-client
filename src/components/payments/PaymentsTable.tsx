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
  Edit, 
  Trash2, 
  Banknote, 
  CreditCard, 
  Building2, 
  FileText, 
  Globe,
  Calendar,
  MoreHorizontal,
  ExternalLink,
  CheckCircle2,
  ArrowRight,
  XCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { PaymentStatusBadge } from "./PaymentStatusBadge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface PaymentsTableProps {
  payments: any[];
  requests: any[];
  clients: any[];
  isLoading: boolean;
  onEdit: (payment: any) => void;
  onDelete: (paymentId: string) => void;
  onStatusChange: (id: string, newStatus: string) => void;
}

const methodIcons: Record<string, any> = {
  EFECTIVO: Banknote,
  TARJETA: CreditCard,
  TRANSFERENCIA: Building2,
  CHEQUE: FileText,
  WEBPAY: Globe,
};

const methodLabels: Record<string, string> = {
  EFECTIVO: "Efectivo",
  TARJETA: "Tarjeta",
  TRANSFERENCIA: "Transf.",
  CHEQUE: "Cheque",
  WEBPAY: "Webpay",
};

export function PaymentsTable({ 
  payments, 
  requests, 
  clients, 
  isLoading, 
  onEdit, 
  onDelete,
  onStatusChange
}: PaymentsTableProps) {
  
  const formatCurrency = (amount: number, currency: string) => {
    if (currency === "CLP") {
      return new Intl.NumberFormat("es-CL", {
        style: "currency",
        currency: "CLP",
        maximumFractionDigits: 0,
      }).format(amount);
    }
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
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

  if (payments.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
        <div className="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center mb-4">
          <Banknote className="w-8 h-8 text-slate-300" />
        </div>
        <h3 className="text-lg font-playfair font-bold text-navy">Sin pagos registrados</h3>
        <p className="text-sm text-muted-foreground max-w-xs text-center mt-1">
          No se encontraron pagos que coincidan con la búsqueda.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-slate-100 bg-white">
      <Table>
        <TableHeader className="bg-slate-50/50">
          <TableRow>
            <TableHead className="text-xs font-bold uppercase tracking-wider">N° Pago</TableHead>
            <TableHead className="text-xs font-bold uppercase tracking-wider">Cliente</TableHead>
            <TableHead className="text-xs font-bold uppercase tracking-wider">Solicitud</TableHead>
            <TableHead className="text-xs font-bold uppercase tracking-wider">Fecha</TableHead>
            <TableHead className="text-xs font-bold uppercase tracking-wider">Monto</TableHead>
            <TableHead className="text-xs font-bold uppercase tracking-wider">Método</TableHead>
            <TableHead className="text-xs font-bold uppercase tracking-wider">Estado</TableHead>
            <TableHead className="text-right text-xs font-bold uppercase tracking-wider">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {payments.map((payment) => {
            const client = clients.find((c) => c.id === payment.clientId);
            const request = requests.find((r) => r.id === payment.requestId);
            const MethodIcon = methodIcons[payment.method] || Banknote;

            return (
              <TableRow key={payment.id} className="group hover:bg-slate-50/50 transition-colors">
                <TableCell>
                  <div className="flex flex-col">
                    <span className="font-mono text-xs font-bold text-primary">
                      {payment.paymentNumber}
                    </span>
                    {payment.reference && (
                      <span className="text-[10px] text-muted-foreground truncate max-w-[120px]">
                        Ref: {payment.reference}
                      </span>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <p className="text-sm font-bold text-navy">
                    {client ? `${client.firstName} ${client.lastName}` : "Cliente no encontrado"}
                  </p>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-tight">
                    ID: {client?.id?.substring(0, 8) ?? 'N/A'}
                  </p>
                </TableCell>
                <TableCell>
                  <div className="flex flex-col">
                    <span className="font-mono text-xs text-muted-foreground font-medium">
                      {request?.requestNumber || "---"}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <Calendar className="w-3 h-3" />
                    <span className="text-xs">
                      {payment.paymentDate 
                        ? format(new Date(payment.paymentDate), "dd MMM, yyyy", { locale: es })
                        : "---"}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <p className="text-xs font-bold text-navy">
                    {formatCurrency(payment.amount, payment.currency)}
                  </p>
                </TableCell>
                <TableCell>
                  <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-slate-50 border border-slate-100">
                    <MethodIcon className="w-3 h-3 text-slate-500" />
                    <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">
                      {methodLabels[payment.method] || payment.method}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <PaymentStatusBadge status={payment.status} />
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-primary hover:bg-primary/5" onClick={() => onEdit(payment)} title="Editar Pago">
                      <Edit className="w-4 h-4" />
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuLabel className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">
                          Gestionar Estado
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        
                        {payment.status !== 'COMPLETADO' && (
                          <DropdownMenuItem onClick={() => onStatusChange(payment.id, 'COMPLETADO')} className="cursor-pointer">
                            <CheckCircle2 className="mr-2 h-4 w-4 text-emerald-500" /> Marcar Completado
                          </DropdownMenuItem>
                        )}
                        {payment.status !== 'PENDIENTE' && (
                          <DropdownMenuItem onClick={() => onStatusChange(payment.id, 'PENDIENTE')} className="cursor-pointer">
                            <ArrowRight className="mr-2 h-4 w-4 text-amber-500" /> Marcar Pendiente
                          </DropdownMenuItem>
                        )}
                        {payment.status !== 'CANCELADO' && (
                          <DropdownMenuItem onClick={() => onStatusChange(payment.id, 'CANCELADO')} className="cursor-pointer text-destructive">
                            <XCircle className="mr-2 h-4 w-4" /> Cancelar pago
                          </DropdownMenuItem>
                        )}

                        {payment.requestId && (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="cursor-pointer text-blue-600">
                              <ExternalLink className="mr-2 h-4 w-4" /> Ver solicitud
                            </DropdownMenuItem>
                          </>
                        )}

                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => onDelete(payment.id)} className="cursor-pointer text-destructive focus:bg-destructive/10 focus:text-destructive">
                          <Trash2 className="mr-2 h-4 w-4" /> Eliminar registro
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