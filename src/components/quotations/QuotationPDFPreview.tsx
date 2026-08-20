import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  FileDown,
  Printer,
  X,
  MapPin,
  Phone,
  Mail,
  Globe,
  Loader2
} from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

interface QuotationPDFPreviewProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  quotation: any;
  client: any;
  request: any;
}

export function QuotationPDFPreview({
  open,
  onOpenChange,
  quotation,
  client,
  request,
}: QuotationPDFPreviewProps) {
  const { toast } = useToast();
  const [isDownloading, setIsDownloading] = useState(false);

  if (!quotation) return null;

  const parsedItems = (quotation.items || []).map((i: any) => typeof i === "string" ? JSON.parse(i) : i);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat(quotation.currency === "CLP" ? "es-CL" : "en-US", {
      style: "currency",
      currency: quotation.currency || "CLP",
      minimumFractionDigits: 0,
    }).format(amount || 0);
  };

  // Descarga el PDF real generado en el backend (@react-pdf/renderer, ver
  // GET /quotations/:id/pdf) y lo abre en una pestaña nueva: desde el visor de PDF nativo del
  // navegador el usuario puede imprimirlo (Ctrl+P) o descargarlo, ya sobre el binario real —
  // no sobre el HTML de la vista previa. La pestaña se abre de forma síncrona (antes del
  // fetch) para que el navegador no la bloquee como popup.
  const handleDownloadPdf = async () => {
    const previewWindow = window.open("", "_blank");
    setIsDownloading(true);
    try {
      const blob = await api.getBlob(`/quotations/${quotation.id}/pdf`);
      const url = URL.createObjectURL(blob);
      if (previewWindow) {
        previewWindow.location.href = url;
        previewWindow.addEventListener("load", () => {
          try { previewWindow.print(); } catch { /* el visor nativo de PDF no siempre expone print() */ }
        });
      } else {
        const link = document.createElement("a");
        link.href = url;
        link.download = `${quotation.quotationNumber}.pdf`;
        link.click();
      }
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch (error) {
      previewWindow?.close();
      toast({
        variant: "destructive",
        title: "Error al generar el PDF",
        description: error instanceof Error ? error.message : "Intenta nuevamente.",
      });
    } finally {
      setIsDownloading(false);
    }
  };


  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] p-0 overflow-hidden flex flex-col">
        <DialogHeader className="p-6 border-b bg-slate-50 flex flex-row items-center justify-between">
          <div>
            <DialogTitle className="text-xl font-playfair font-bold text-navy">Vista Previa de Cotización</DialogTitle>
            <p className="text-sm text-muted-foreground mt-1">Revisa el documento antes de enviarlo al cliente.</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={handleDownloadPdf} disabled={isDownloading} className="bg-navy hover:bg-navy-light text-white gap-2">
              {isDownloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Printer className="w-4 h-4" />}
              Imprimir / Descargar PDF
            </Button>
            <Button variant="outline" size="icon" onClick={() => onOpenChange(false)}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-8 bg-slate-200/50">
          <div 
            id="quotation-print-area" 
            className="bg-white mx-auto shadow-2xl p-12 min-h-[1123px] w-[794px]"
            style={{ fontFamily: "'Manrope', sans-serif" }}
          >
            {/* Header */}
            <div className="ade-header flex justify-between items-start mb-10">
              <div className="agency-info">
                <h1 className="text-3xl font-extrabold text-[#0F1E3C] tracking-tighter">ADE TRAVEL</h1>
                <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Agencia de Viajes & Turismo</p>
                <div className="mt-4 space-y-1">
                  <div className="flex items-center gap-2 text-[10px] text-slate-500">
                    <MapPin className="w-3 h-3 text-[#C9A84C]" /> Av. Providencia 1234, Oficina 502, Santiago
                  </div>
                  <div className="flex items-center gap-2 text-[10px] text-slate-500">
                    <Phone className="w-3 h-3 text-[#C9A84C]" /> +56 2 2345 6789
                  </div>
                  <div className="flex items-center gap-2 text-[10px] text-slate-500">
                    <Mail className="w-3 h-3 text-[#C9A84C]" /> contacto@adetravel.cl
                  </div>
                  <div className="flex items-center gap-2 text-[10px] text-slate-500">
                    <Globe className="w-3 h-3 text-[#C9A84C]" /> www.adetravel.cl
                  </div>
                </div>
              </div>
              
              <div className="quotation-label-box text-right">
                <div className="text-[#C9A84C] text-4xl font-black mb-1">COTIZACIÓN</div>
                <div className="text-[#0F1E3C] text-lg font-bold mb-4">{quotation.quotationNumber}</div>
                <div className="space-y-1 text-[10px] text-slate-500">
                  <div>Fecha Emisión: <span className="font-bold text-[#0F1E3C]">{format(new Date(quotation.created_at || new Date()), "dd/MM/yyyy")}</span></div>
                  <div>Válida Hasta: <span className="font-bold text-[#0F1E3C]">{quotation.validUntil ? format(new Date(quotation.validUntil), "dd/MM/yyyy") : "N/A"}</span></div>
                </div>
              </div>
            </div>

            <div className="ade-divider h-0.5 bg-[#C9A84C] mb-8"></div>

            {/* Info Grid */}
            <div className="grid grid-cols-2 gap-10 mb-10">
              <div>
                <div className="text-[9px] font-extrabold uppercase tracking-widest text-slate-400 mb-2 border-b pb-1">CLIENTE</div>
                <div className="bg-slate-50 p-4 rounded-lg">
                  <div className="text-sm font-bold text-[#0F1E3C] mb-1">{client?.firstName} {client?.lastName}</div>
                  <div className="text-[10px] text-slate-500">RUT: {client?.rut || "N/A"}</div>
                  <div className="text-[10px] text-slate-500">Email: {client?.email}</div>
                  <div className="text-[10px] text-slate-500">Teléfono: {client?.phone}</div>
                </div>
              </div>
              <div>
                <div className="text-[9px] font-extrabold uppercase tracking-widest text-slate-400 mb-2 border-b pb-1">DETALLES DEL VIAJE</div>
                <div className="bg-slate-50 p-4 rounded-lg">
                  <div className="text-sm font-bold text-[#0F1E3C] mb-1">{request?.destinationCity || "Múltiples Destinos"}, {request?.destinationCountry || ""}</div>
                  <div className="text-[10px] text-slate-500">Solicitud: {request?.requestNumber}</div>
                  <div className="text-[10px] text-slate-500">Pasajeros: {request?.passengers || 1}</div>
                  <div className="text-[10px] text-slate-500">Duración: {request?.durationDays ? `${request.durationDays} días` : "N/A"}</div>
                </div>
              </div>
            </div>

            {/* Services Table */}
            <div className="mb-10">
              <div className="text-[9px] font-extrabold uppercase tracking-widest text-slate-400 mb-2">DETALLE DE SERVICIOS</div>
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-[#0F1E3C] text-white">
                    <th className="text-left py-3 px-4 text-[9px] font-bold uppercase tracking-wider rounded-tl-lg">SERVICIO / DESCRIPCIÓN</th>
                    <th className="text-center py-3 px-2 text-[9px] font-bold uppercase tracking-wider w-16">CANT.</th>
                    <th className="text-right py-3 px-4 text-[9px] font-bold uppercase tracking-wider w-32">P. UNITARIO</th>
                    <th className="text-right py-3 px-4 text-[9px] font-bold uppercase tracking-wider w-32 rounded-tr-lg">TOTAL</th>
                  </tr>
                </thead>
                <tbody className="text-[11px]">
                  {parsedItems.map((item: any, idx: number) => (
                    <tr key={idx} className={idx % 2 === 0 ? "bg-white" : "bg-slate-50"}>
                      <td className="py-4 px-4 border-b border-slate-100">
                        <div className="font-bold text-[#0F1E3C]">{item.service}</div>
                        <div className="text-[10px] text-slate-500 mt-1">{item.description}</div>
                      </td>
                      <td className="py-4 px-2 border-b border-slate-100 text-center font-medium">{item.quantity}</td>
                      <td className="py-4 px-4 border-b border-slate-100 text-right">{formatCurrency(item.unitPrice)}</td>
                      <td className="py-4 px-4 border-b border-slate-100 text-right font-bold">{formatCurrency(item.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Totals */}
            <div className="flex justify-end mb-10">
              <div className="w-64 bg-slate-50 p-5 rounded-xl border border-slate-100">
                <div className="flex justify-between text-[10px] mb-2">
                  <span className="text-slate-500">Subtotal</span>
                  <span className="font-semibold text-[#0F1E3C]">{formatCurrency(quotation.subtotal)}</span>
                </div>
                {quotation.discount > 0 && (
                  <div className="flex justify-between text-[10px] mb-2 text-rose-600">
                    <span>Descuento</span>
                    <span>- {formatCurrency(quotation.discount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-[10px] mb-2">
                  <span className="text-slate-500">IVA ({quotation.taxPercentage || 19}%)</span>
                  <span className="font-semibold text-[#0F1E3C]">{formatCurrency(quotation.taxAmount)}</span>
                </div>
                <div className="h-px bg-[#C9A84C] my-3"></div>
                <div className="flex justify-between items-center text-[#0F1E3C] font-extrabold">
                  <span className="text-[10px] uppercase">TOTAL {quotation.currency}</span>
                  <span className="text-xl">{formatCurrency(quotation.total)}</span>
                </div>
              </div>
            </div>

            {/* Terms */}
            <div className="mb-10">
              <div className="text-[9px] font-extrabold uppercase tracking-widest text-slate-400 mb-2 border-b pb-1">TÉRMINOS Y CONDICIONES</div>
              <div className="text-[10px] text-slate-500 leading-relaxed italic bg-slate-50 p-4 rounded-lg">
                {quotation.termsAndConditions || "Esta cotización está sujeta a disponibilidad al momento de la reserva. Los precios pueden variar sin previo aviso hasta que se confirme el pago total de los servicios."}
              </div>
            </div>

            {/* Footer */}
            <div className="mt-auto pt-10 border-t border-slate-100 text-center text-[9px] text-slate-400">
              <p className="mb-1 font-bold uppercase tracking-widest text-slate-500">ADE TRAVEL - AGENCIA DE VIAJES</p>
              <p>Este documento es una propuesta comercial. La validez de la misma se especifica en la parte superior.</p>
              <p className="mt-2">Gracias por preferirnos para sus sueños de viaje.</p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
