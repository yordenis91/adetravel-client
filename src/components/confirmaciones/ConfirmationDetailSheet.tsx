import React from "react";
import { useNavigate } from "react-router-dom";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Edit2, ExternalLink } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface ConfirmationDetailSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  confirmation: any;
  requests: any[];
  providers: any[];
  onEdit: (c: any) => void;
}

export function ConfirmationDetailSheet({ open, onOpenChange, confirmation, requests, providers, onEdit }: ConfirmationDetailSheetProps) {
  const navigate = useNavigate();
  if (!confirmation) return null;

  const request = requests.find((r: any) => r.id === confirmation.requestId);
  const provider = providers.find((p: any) => p.id === confirmation.providerId);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-[560px] p-0 flex flex-col">
        <SheetHeader className="p-8 pb-4">
          <span className="text-[10px] font-mono font-bold text-primary px-2 py-1 bg-primary/10 rounded tracking-tighter w-fit">
            {confirmation.confirmationNumber}
          </span>
          <SheetTitle className="text-2xl font-playfair font-bold text-navy">Detalle de Confirmación</SheetTitle>
          <SheetDescription>Confirmación de reserva emitida por el proveedor.</SheetDescription>
        </SheetHeader>

        <ScrollArea className="flex-1 px-8">
          <div className="space-y-4 pb-10">
            <div className="p-4 bg-white rounded-xl border border-slate-100 shadow-sm space-y-1">
              <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-tighter">Solicitud</p>
              <button onClick={() => navigate(`/solicitudes?view=${confirmation.requestId}`)} className="text-sm font-bold text-primary flex items-center gap-1 hover:underline">
                {request?.requestNumber || confirmation.requestId} <ExternalLink className="w-3 h-3" />
              </button>
            </div>

            <div className="p-4 bg-white rounded-xl border border-slate-100 shadow-sm space-y-1">
              <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-tighter">Proveedor</p>
              <p className="text-sm font-bold text-navy">{provider ? (provider.fantasyName || provider.name) : "—"}</p>
              {confirmation.providerConfirmationNumber && (
                <p className="text-xs text-muted-foreground">N° confirmación proveedor: {confirmation.providerConfirmationNumber}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-white rounded-xl border border-slate-100 shadow-sm">
                <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-tighter">Precio</p>
                <p className="text-sm font-bold text-navy">{Number(confirmation.price).toLocaleString("es-CL")}</p>
              </div>
              <div className="p-4 bg-white rounded-xl border border-slate-100 shadow-sm">
                <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-tighter">Vigencia</p>
                <p className="text-sm font-bold text-navy">
                  {confirmation.validUntil ? format(new Date(confirmation.validUntil), "dd MMMM yyyy", { locale: es }) : "—"}
                </p>
              </div>
            </div>

            {confirmation.exchangeRate != null && (
              <div className="p-4 bg-white rounded-xl border border-slate-100 shadow-sm">
                <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-tighter">Tipo de cambio</p>
                <p className="text-sm font-bold text-navy">{confirmation.exchangeRate}</p>
              </div>
            )}

            {confirmation.notes && (
              <div className="p-4 bg-white rounded-xl border border-slate-100 shadow-sm">
                <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-tighter mb-1">Observaciones</p>
                <p className="text-sm text-slate-600 whitespace-pre-wrap">{confirmation.notes}</p>
              </div>
            )}
          </div>
        </ScrollArea>

        <SheetFooter className="p-8 border-t border-slate-100 bg-slate-50/50">
          <Button type="button" variant="outline" onClick={() => onEdit(confirmation)} className="mr-auto gap-2 text-xs font-bold uppercase tracking-wider">
            <Edit2 className="w-4 h-4" />
            Editar
          </Button>
          <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} className="text-xs font-bold uppercase tracking-wider">
            Cerrar
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
