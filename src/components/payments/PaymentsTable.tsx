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
  MoreVertical,
  ExternalLink,
  CheckCircle,
  Clock,
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
import { cn } from "@/lib/utils";
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
      <div className="flex flex-col items-center justify-center py-20 bg-white/50 dark:bg-navy-dark/20 rounded-2xl border border-dashed border-muted-foreground/20">
        <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
          <Banknote className="w-8 h-8 text-muted-foreground/40" />
        </div>
        <h3 className="text-lg font-bold font-playfair">No hay pagos registrados</h3>
        <p className="text-sm text-muted-foreground">Comienza registrando el primer pago recibido.</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border bg-card overflow-hidden shadow-sm">
      <Table>
        <TableHeader className="bg-muted/50">
          <TableRow>
            <TableHead className="font-bold">N° Pago</TableHead>
            <TableHead className="font-bold">Cliente</TableHead>
            <TableHead className="font-bold">Solicitud</TableHead>
            <TableHead className="font-bold">Fecha</TableHead>
            <TableHead className="font-bold">Monto</TableHead>
            <TableHead className="font-bold">Método</TableHead>
            <TableHead className="font-bold">Estado</TableHead>
            <TableHead className="text-right font-bold">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {payments.map((payment) => {
            const client = clients.find((c) => c.id === payment.clientId);
            const request = requests.find((r) => r.id === payment.requestId);
            const MethodIcon = methodIcons[payment.method] || Banknote;

            return (
              <TableRow key={payment.id} className="hover:bg-muted/20 transition-colors group">
                <TableCell>
                  <div className="flex flex-col">
                    <span className="font-bold text-sm text-navy dark:text-white">
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
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary">
                      {client?.firstName?.charAt(0)}{client?.lastName?.charAt(0)}
                    </div>
                    <span className="text-sm font-medium">
                      {client ? `${client.firstName} ${client.lastName}` : "Cliente no encontrado"}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-primary">
                      {request?.requestNumber || "S/N"}
                    </span>
                    <span className="text-[10px] text-muted-foreground italic">
                      {request?.destinationCity || "Sin destino"}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Calendar className="w-3 h-3" />
                    {payment.paymentDate 
                      ? format(new Date(payment.paymentDate), "dd MMM, yyyy", { locale: es })
                      : "S/F"}
                  </div>
                </TableCell>
                <TableCell>
                  <span className={cn(
                    "font-bold text-sm",
                    payment.status === "COMPLETADO" ? "text-emerald-600 dark:text-emerald-400" :
                    payment.status === "PENDIENTE" ? "text-amber-600 dark:text-amber-400" :
                    "text-slate-500"
                  )}>
                    {formatCurrency(payment.amount, payment.currency)}
                  </span>
                </TableCell>
                <TableCell>
                  <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-muted/50 border border-muted-foreground/10">
                    <MethodIcon className="w-3 h-3 text-muted-foreground" />
                    <span className="text-[10px] font-medium text-muted-foreground">
                      {methodLabels[payment.method] || payment.method}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <PaymentStatusBadge status={payment.status} />
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreVertical className="w-4 h-4 text-muted-foreground" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      <DropdownMenuLabel className="text-[10px] uppercase text-muted-foreground font-bold">
                        Opciones de Pago
                      </DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => onEdit(payment)} className="gap-2 cursor-pointer">
                        <Edit className="w-4 h-4 text-blue-500" />
                        <span>Editar registro</span>
                      </DropdownMenuItem>
                      
                      {payment.status !== 'COMPLETADO' && (
                        <DropdownMenuItem onClick={() => onStatusChange(payment.id, 'COMPLETADO')} className="gap-2 cursor-pointer text-emerald-600">
                          <CheckCircle className="w-4 h-4" /> Marcar como Completado
                        </DropdownMenuItem>
                      )}
                      {payment.status !== 'PENDIENTE' && (
                        <DropdownMenuItem onClick={() => onStatusChange(payment.id, 'PENDIENTE')} className="gap-2 cursor-pointer text-amber-600">
                          <Clock className="w-4 h-4" /> Marcar como Pendiente
                        </DropdownMenuItem>
                      )}
                      {payment.status !== 'CANCELADO' && (
                        <DropdownMenuItem onClick={() => onStatusChange(payment.id, 'CANCELADO')} className="gap-2 cursor-pointer text-destructive">
                          <XCircle className="w-4 h-4" /> Cancelar pago
                        </DropdownMenuItem>
                      )}

                      {payment.requestId && (
                        <DropdownMenuItem className="gap-2 cursor-pointer">
                          <ExternalLink className="w-4 h-4 text-primary" />
                          <span>Ver solicitud</span>
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        onClick={() => onDelete(payment.id)} 
                        className="gap-2 text-destructive cursor-pointer focus:bg-destructive/10 focus:text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                        <span>Eliminar registro</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
