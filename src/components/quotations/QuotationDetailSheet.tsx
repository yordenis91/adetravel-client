import React from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { QuotationStatusBadge } from "./QuotationStatusBadge";
import { 
  ReceiptText, 
  Calendar, 
  User, 
  Edit2, 
  Send, 
  CheckCircle2, 
  XCircle,
  Clock,
  Briefcase
} from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface QuotationDetailSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  quotation: any;
  request: any;
  client: any;
  onEdit: (quotation: any) => void;
  onStatusChange: (id: string, newStatus: string) => void;
}

export function QuotationDetailSheet({
  open,
  onOpenChange,
  quotation,
  request,
  client,
  onEdit,
  onStatusChange,
}: QuotationDetailSheetProps) {
  if (!quotation) return null;

  const items = quotation.items.map((i: string) => JSON.parse(i));
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat(quotation.currency === "CLP" ? "es-CL" : "en-US", {
      style: "currency",
      currency: quotation.currency || "CLP",
      minimumFractionDigits: 0,
    }).format(amount || 0);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-[750px] p-0 flex flex-col">
        <SheetHeader className="p-8 pb-4 border-b border-slate-100 bg-slate-50/30">
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-navy flex items-center justify-center text-white shadow-lg shadow-navy/20">
                <ReceiptText className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-mono font-bold text-navy/40">{quotation.quotationNumber}</span>
                  <QuotationStatusBadge status={quotation.status} />
                </div>
                <SheetTitle className="text-2xl font-playfair font-bold text-navy">
                  Cotización de Viaje
                </SheetTitle>
              </div>
            </div>
            <div className="text-right">
              <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground block mb-1">Válida Hasta</span>
              <div className="flex items-center gap-2 text-navy font-bold">
                <Calendar className="w-4 h-4 text-gold" />
                {quotation.validUntil ? format(new Date(quotation.validUntil), "dd MMMM, yyyy", { locale: es }) : "N/A"}
              </div>
            </div>
          </div>
        </SheetHeader>

        {/* Barra de Acciones de Estado */}
        <div className="px-8 py-3 bg-slate-50 flex items-center justify-between gap-4 border-b border-slate-100">
          <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground italic">
            <Clock className="w-3.5 h-3.5" />
            Acciones recomendadas según estado actual
          </div>
          <div className="flex items-center gap-2">
            {quotation.status === "Borrador" && (
              <Button size="sm" onClick={() => onStatusChange(quotation.id, "Enviada")} className="gap-2 bg-blue-600 hover:bg-blue-700">
                <Send className="w-3.5 h-3.5" /> Marcar como Enviada
              </Button>
            )}
            {quotation.status === "Enviada" && (
              <>
                <Button size="sm" onClick={() => onStatusChange(quotation.id, "Aceptada")} className="gap-2 bg-emerald-600 hover:bg-emerald-700">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Aceptar Cotización
                </Button>
                <Button size="sm" variant="outline" onClick={() => onStatusChange(quotation.id, "Rechazada")} className="gap-2 text-rose-600 border-rose-200 hover:bg-rose-50">
                  <XCircle className="w-3.5 h-3.5" /> Rechazar
                </Button>
              </>
            )}
          </div>
        </div>

        <ScrollArea className="flex-1 px-8 py-8">
          <div className="space-y-10">
            {/* 1. Información de Partes */}
            <div className="grid grid-cols-2 gap-8">
              <div className="space-y-3">
                <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Cliente / Titular</h3>
                <div className="flex items-start gap-3 p-4 rounded-2xl bg-slate-50 border border-slate-100">
                  <div className="w-10 h-10 rounded-full bg-navy/10 text-navy flex items-center justify-center font-bold">
                    {client?.firstName[0]}{client?.lastName[0]}
                  </div>
                  <div>
                    <div className="text-sm font-bold text-navy">{client?.firstName} {client?.lastName}</div>
                    <div className="text-xs text-muted-foreground">{client?.email || "Sin email registrado"}</div>
                    <div className="text-xs text-muted-foreground mt-1">{client?.phone || "Sin teléfono"}</div>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Solicitud Asociada</h3>
                <div className="flex items-start gap-3 p-4 rounded-2xl bg-slate-50 border border-slate-100">
                  <div className="w-10 h-10 rounded-xl bg-gold/10 text-gold-dark flex items-center justify-center font-bold">
                    <Briefcase className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-navy">{request?.requestNumber}</div>
                    <div className="text-xs text-muted-foreground">{request?.destinationCity}, {request?.destinationCountry}</div>
                    <div className="text-xs text-muted-foreground mt-1 italic line-clamp-1">{request?.description || "Inquiry simple"}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* 2. Detalle de Servicios */}
            <div className="space-y-4">
              <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Servicios y Tarifas</h3>
              <div className="rounded-2xl border border-slate-100 overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50/50 border-b border-slate-100">
                      <th className="text-left py-4 px-6 font-bold text-navy/60 uppercase text-[10px]">Servicio</th>
                      <th className="text-center py-4 px-4 font-bold text-navy/60 uppercase text-[10px]">Cant.</th>
                      <th className="text-right py-4 px-4 font-bold text-navy/60 uppercase text-[10px]">P. Unitario</th>
                      <th className="text-right py-4 px-6 font-bold text-navy/60 uppercase text-[10px]">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {items.map((item: any, idx: number) => (
                      <tr key={idx} className="hover:bg-slate-50/30 transition-colors">
                        <td className="py-4 px-6">
                          <div className="font-bold text-navy">{item.service}</div>
                          {item.description && <div className="text-xs text-muted-foreground mt-0.5">{item.description}</div>}
                        </td>
                        <td className="py-4 px-4 text-center text-navy font-medium">{item.quantity}</td>
                        <td className="py-4 px-4 text-right text-navy/70">{formatCurrency(item.unitPrice)}</td>
                        <td className="py-4 px-6 text-right font-bold text-navy">{formatCurrency(item.total)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* 3. Totales */}
            <div className="flex justify-end">
              <div className="w-[320px] space-y-3 bg-navy/[0.02] p-6 rounded-2xl border border-navy/5">
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>Subtotal</span>
                  <span className="font-semibold text-navy">{formatCurrency(quotation.subtotal)}</span>
                </div>
                {quotation.discount > 0 && (
                  <div className="flex justify-between text-sm text-rose-600 font-medium">
                    <span>Descuento</span>
                    <span>- {formatCurrency(quotation.discount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>IVA ({quotation.taxPercentage || 19}%)</span>
                  <span className="font-semibold text-navy">{formatCurrency(quotation.taxAmount)}</span>
                </div>
                <Separator className="bg-navy/10 my-2" />
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold uppercase tracking-widest text-navy">Total Documento</span>
                  <span className="text-2xl font-bold text-navy font-playfair underline decoration-gold/40 decoration-4 underline-offset-8">
                    {formatCurrency(quotation.total)}
                  </span>
                </div>
                <div className="text-[10px] text-right text-muted-foreground mt-2 italic">
                  Expresado en {quotation.currency}
                </div>
              </div>
            </div>

            {/* 4. Notas y Términos */}
            <div className="grid grid-cols-2 gap-8 pt-4">
              <div className="space-y-2">
                <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Términos y Condiciones</h3>
                <div className="text-xs text-slate-500 leading-relaxed bg-slate-50 p-4 rounded-xl italic">
                  {quotation.termsAndConditions || "No se han especificado términos particulares."}
                </div>
              </div>
              <div className="space-y-2">
                <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Observaciones</h3>
                <div className="text-xs text-slate-500 leading-relaxed bg-slate-50 p-4 rounded-xl">
                  {quotation.notes || "Sin observaciones adicionales."}
                </div>
              </div>
            </div>
          </div>
        </ScrollArea>

        <SheetFooter className="p-8 border-t border-slate-100 bg-white">
          <div className="flex w-full justify-between items-center">
            <Button variant="ghost" className="text-muted-foreground" onClick={() => onOpenChange(false)}>
              Cerrar Vista
            </Button>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => onEdit(quotation)} className="gap-2 text-navy border-slate-200">
                <Edit2 className="w-4 h-4" /> Editar Cotización
              </Button>
            </div>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
