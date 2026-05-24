import React from "react";
import { cn } from "@/lib/utils";
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle,
  SheetDescription
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { RequestStatusBadge } from "@/components/requests/RequestStatusBadge";
import { PaymentStatusBadge } from "@/components/payments/PaymentStatusBadge";
import { VoucherStatusBadge } from "@/components/vouchers/VoucherStatusBadge";
import { Plane, Calendar, MapPin, DollarSign, Ticket, ArrowRight, CheckCircle2, X } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { toast } from "sonner";

interface ConfirmacionDetailSheetProps {
  request: any;
  client: any;
  payments: any[];
  vouchers: any[];
  quotation: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ConfirmacionDetailSheet({
  request,
  client,
  payments,
  vouchers,
  quotation,
  open,
  onOpenChange
}: ConfirmacionDetailSheetProps) {
  const queryClient = useQueryClient();

  const updateStatusMutation = useMutation({
    mutationFn: (newStatus: string) => api.patch(`/requests/${request.id}`, { status: newStatus }),
    onSuccess: (_, newStatus) => {
      queryClient.invalidateQueries({ queryKey: ["requests"] });
      toast.success(`Solicitud marcada como ${newStatus}`);
      onOpenChange(false);
    },
    onError: () => {
      toast.error("Error al actualizar el estado");
    }
  });

  const formatCurrency = (amount: number, currency = "CLP") => {
    return new Intl.NumberFormat("es-CL", {
      style: "currency",
      currency: currency,
    }).format(amount || 0);
  };

  const totalPaid = payments
    .filter(p => p.status === "COMPLETADO" && p.currency === (quotation?.currency || "CLP"))
    .reduce((acc, p) => acc + (p.amount || 0), 0);

  const totalQuoted = quotation?.total || 0;
  const balance = totalQuoted - totalPaid;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-[760px] p-0 overflow-hidden flex flex-col">
        <div className="bg-navy p-8 text-white relative">
          <Button 
            variant="ghost" 
            size="icon" 
            className="absolute right-4 top-4 text-white/60 hover:text-white hover:bg-white/10"
            onClick={() => onOpenChange(false)}
          >
            <X className="w-5 h-5" />
          </Button>

          <div className="flex flex-wrap items-center gap-3 mb-4">
            <Badge variant="outline" className="bg-white/10 text-white border-white/20 font-mono">
              {request.requestNumber}
            </Badge>
            <RequestStatusBadge status={request.status} />
          </div>

          <h2 className="text-3xl font-playfair font-bold mb-1">
            {client ? `${client.firstName} ${client.lastName}` : "Cliente"}
          </h2>
          <div className="flex items-center gap-2 text-white/60 text-sm">
            <MapPin className="w-4 h-4" />
            <span>{request.destinationCity}, {request.destinationCountry}</span>
          </div>
        </div>

        <ScrollArea className="flex-1 p-8">
          <div className="space-y-8">
            {/* Itinerario */}
            <section>
              <div className="flex items-center gap-2 mb-4">
                <Plane className="w-5 h-5 text-primary" />
                <h3 className="text-sm font-bold uppercase tracking-widest text-navy">Itinerario y Servicios</h3>
              </div>
              <div className="bg-gray-50 rounded-xl p-6 border border-gray-100">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex flex-col">
                    <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Origen</span>
                    <span className="text-lg font-bold text-navy">{request.originCity || "S/I"}</span>
                    <span className="text-xs text-muted-foreground">{request.originCountry}</span>
                  </div>
                  <ArrowRight className="w-6 h-6 text-gray-300" />
                  <div className="flex flex-col text-right">
                    <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Destino</span>
                    <span className="text-lg font-bold text-navy">{request.destinationCity}</span>
                    <span className="text-xs text-muted-foreground">{request.destinationCountry}</span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-primary" />
                    <span className="text-sm text-navy">{request.durationDays} días de viaje</span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {request.services?.map((service: string, i: number) => (
                      <Badge key={i} variant="secondary" className="bg-white text-[10px] font-bold uppercase tracking-tight">
                        {service}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </section>

            {/* Resumen Financiero */}
            <section>
              <div className="flex items-center gap-2 mb-4">
                <DollarSign className="w-5 h-5 text-primary" />
                <h3 className="text-sm font-bold uppercase tracking-widest text-navy">Resumen Financiero</h3>
              </div>
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="p-4 rounded-xl border border-gray-100 bg-white shadow-sm">
                  <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold mb-1">Total Cotizado</p>
                  <p className="text-lg font-bold text-navy">{formatCurrency(totalQuoted, quotation?.currency)}</p>
                </div>
                <div className="p-4 rounded-xl border border-emerald-100 bg-emerald-50/30">
                  <p className="text-[10px] uppercase tracking-widest text-emerald-700/60 font-bold mb-1">Total Pagado</p>
                  <p className="text-lg font-bold text-emerald-700">{formatCurrency(totalPaid, quotation?.currency)}</p>
                </div>
                <div className="p-4 rounded-xl border border-amber-100 bg-amber-50/30">
                  <p className="text-[10px] uppercase tracking-widest text-amber-700/60 font-bold mb-1">Saldo Pendiente</p>
                  <p className="text-lg font-bold text-amber-700">{formatCurrency(balance, quotation?.currency)}</p>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Historial de Pagos</p>
                {payments.length > 0 ? (
                  <div className="border border-gray-100 rounded-xl overflow-hidden">
                    {payments.map((payment, i) => (
                      <div key={payment.id} className={cn(
                        "flex items-center justify-between p-3 text-sm",
                        i % 2 === 0 ? "bg-white" : "bg-gray-50/50"
                      )}>
                        <div className="flex flex-col">
                          <span className="font-bold text-navy">{payment.paymentDate}</span>
                          <span className="text-[10px] text-muted-foreground uppercase">{payment.method}</span>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="font-bold text-navy">{formatCurrency(payment.amount, payment.currency)}</span>
                          <PaymentStatusBadge status={payment.status} />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground italic bg-gray-50 p-4 rounded-xl border border-dashed border-gray-200 text-center">
                    No hay pagos registrados
                  </p>
                )}
              </div>
            </section>

            {/* Vouchers */}
            <section>
              <div className="flex items-center gap-2 mb-4">
                <Ticket className="w-5 h-5 text-primary" />
                <h3 className="text-sm font-bold uppercase tracking-widest text-navy">Vouchers Emitidos</h3>
              </div>
              <div className="space-y-3">
                {vouchers.length > 0 ? (
                  vouchers.map((voucher) => (
                    <div key={voucher.id} className="p-4 rounded-xl border border-gray-100 bg-white shadow-sm flex flex-col gap-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 text-[10px] font-bold">
                            {voucher.serviceType}
                          </Badge>
                          <h4 className="font-bold text-navy">{voucher.serviceName}</h4>
                        </div>
                        <VoucherStatusBadge status={voucher.status} />
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-xs">
                        <div className="flex flex-col gap-1">
                          <span className="text-muted-foreground font-medium uppercase tracking-tighter">Confirmación</span>
                          <span className="font-mono font-bold text-navy">{voucher.confirmationCode || "---"}</span>
                        </div>
                        <div className="flex flex-col gap-1">
                          <span className="text-muted-foreground font-medium uppercase tracking-tighter">Periodo</span>
                          <span className="font-bold text-navy">{voucher.checkIn} — {voucher.checkOut}</span>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground italic bg-gray-50 p-4 rounded-xl border border-dashed border-gray-200 text-center">
                    No se han emitido vouchers para esta reserva
                  </p>
                )}
              </div>
            </section>
          </div>
        </ScrollArea>

        <div className="p-8 border-t border-gray-100 flex items-center justify-end gap-3 bg-white">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cerrar
          </Button>
          {request.status === "CONFIRMADA" && (
            <Button 
              className="bg-purple-600 hover:bg-purple-700 text-white gap-2"
              onClick={() => updateStatusMutation.mutate("VENDIDA")}
              disabled={updateStatusMutation.isPending}
            >
              <CheckCircle2 className="w-4 h-4" />
              Marcar como Vendida
            </Button>
          )}
          {request.status !== "CANCELADA" && (
             <Button 
              variant="destructive"
              className="gap-2"
              onClick={() => updateStatusMutation.mutate("CANCELADA")}
              disabled={updateStatusMutation.isPending}
            >
              <X className="w-4 h-4" />
              Cancelar Reserva
            </Button>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
