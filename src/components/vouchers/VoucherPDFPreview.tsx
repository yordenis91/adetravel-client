import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Printer,
  X,
  MapPin,
  Phone,
  Mail,
  Globe,
  Calendar,
  Ticket,
  User,
  Info,
  Loader2
} from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

interface VoucherPDFPreviewProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  voucher: any;
  client: any;
  provider: any;
  request: any;
}

export function VoucherPDFPreview({
  open,
  onOpenChange,
  voucher,
  client,
  provider,
  request,
}: VoucherPDFPreviewProps) {
  const { toast } = useToast();
  const [isDownloading, setIsDownloading] = useState(false);

  if (!voucher) return null;

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "N/A";
    try {
      return format(new Date(dateStr), "dd 'de' MMMM, yyyy", { locale: es });
    } catch (e) {
      return dateStr;
    }
  };

  // Descarga el PDF real generado en el backend (@react-pdf/renderer, ver
  // GET /vouchers/:id/pdf) y lo abre en una pestaña nueva: desde el visor de PDF nativo del
  // navegador el usuario puede imprimirlo (Ctrl+P) o descargarlo, ya sobre el binario real —
  // no sobre el HTML de la vista previa. La pestaña se abre de forma síncrona (antes del
  // fetch) para que el navegador no la bloquee como popup.
  const handleDownloadPdf = async () => {
    const previewWindow = window.open("", "_blank");
    setIsDownloading(true);
    try {
      const blob = await api.getBlob(`/vouchers/${voucher.id}/pdf`);
      const url = URL.createObjectURL(blob);
      if (previewWindow) {
        previewWindow.location.href = url;
        previewWindow.addEventListener("load", () => {
          try { previewWindow.print(); } catch { /* el visor nativo de PDF no siempre expone print() */ }
        });
      } else {
        // Popup bloqueado: forzamos la descarga directa del PDF real.
        const link = document.createElement("a");
        link.href = url;
        link.download = `${voucher.voucherNumber}.pdf`;
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
            <DialogTitle className="text-xl font-playfair font-bold text-navy">Voucher de Servicio</DialogTitle>
            <p className="text-sm text-muted-foreground mt-1">Comprobante oficial para {voucher.voucherNumber}</p>
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
            id="voucher-print-area" 
            className="bg-white mx-auto shadow-2xl p-12 min-h-[1123px] w-[794px] flex flex-col"
            style={{ fontFamily: "'Manrope', sans-serif" }}
          >
            {/* Header */}
            <div className="voucher-header flex justify-between items-start mb-10">
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
              
              <div className="voucher-label-box text-right">
                <div className="text-[#0F1E3C] text-4xl font-black mb-1">VOUCHER</div>
                <div className="text-[#C9A84C] text-lg font-bold mb-3">{voucher.voucherNumber}</div>
                <div className={`inline-block px-3 py-1 rounded text-[9px] font-extrabold uppercase ${voucher.status === 'EMITIDO' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                  {voucher.status}
                </div>
                <div className="mt-3 text-[10px] text-slate-500">
                  Fecha Emisión: <span className="font-bold text-[#0F1E3C]">{format(new Date(voucher.created_at || new Date()), "dd/MM/yyyy")}</span>
                </div>
              </div>
            </div>

            <div className="gold-divider h-0.5 bg-[#C9A84C] mb-8"></div>

            {/* Service Card */}
            <div className="service-card bg-[#f0f4f8] p-8 rounded-xl mb-8 relative">
              <div className="service-type-badge inline-block px-3 py-1 bg-[#0F1E3C] text-white text-[9px] font-bold rounded mb-3">
                {voucher.serviceType}
              </div>
              <h2 className="service-name text-2xl font-extrabold text-[#0F1E3C] mb-4">
                {voucher.serviceName}
              </h2>
              
              <div className="service-meta flex flex-wrap gap-8 text-[11px] text-slate-500">
                <div className="meta-item flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-[#C9A84C]" />
                  <span className="font-bold">{voucher.destination}</span>
                </div>
                <div className="meta-item flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-[#C9A84C]" />
                  <span>CHECK-IN: <span className="font-bold text-[#0F1E3C]">{formatDate(voucher.checkIn)}</span></span>
                </div>
                <div className="meta-item flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-[#C9A84C]" />
                  <span>CHECK-OUT: <span className="font-bold text-[#0F1E3C]">{formatDate(voucher.checkOut)}</span></span>
                </div>
              </div>

              {voucher.confirmationCode && (
                <div className="confirmation-box absolute top-8 right-8 text-right">
                  <div className="conf-label text-[9px] font-bold text-slate-400 uppercase mb-1">CÓDIGO CONFIRMACIÓN</div>
                  <div className="conf-code bg-white px-5 py-2 border-2 border-[#C9A84C] rounded-lg text-lg font-black text-[#0F1E3C]">
                    {voucher.confirmationCode}
                  </div>
                </div>
              )}
            </div>

            {/* Info Grid */}
            <div className="grid grid-cols-2 gap-8 mb-8">
              <div>
                <div className="text-[9px] font-extrabold uppercase tracking-widest text-slate-400 mb-2 border-b pb-1">PROVEEDOR</div>
                <div className="bg-slate-50 p-4 rounded-lg">
                  <div className="text-sm font-bold text-[#0F1E3C] mb-1">{provider?.fantasyName || provider?.name || "N/A"}</div>
                  <div className="text-[10px] text-slate-500">RUT: {provider?.rut || "N/A"}</div>
                  <div className="text-[10px] text-slate-500">Email: {provider?.email}</div>
                  <div className="text-[10px] text-slate-500">Teléfono: {provider?.phone}</div>
                </div>
              </div>
              <div>
                <div className="text-[9px] font-extrabold uppercase tracking-widest text-slate-400 mb-2 border-b pb-1">CLIENTE</div>
                <div className="bg-slate-50 p-4 rounded-lg">
                  <div className="text-sm font-bold text-[#0F1E3C] mb-1">{client?.firstName} {client?.lastName}</div>
                  <div className="text-[10px] text-slate-500">RUT: {client?.rut || "N/A"}</div>
                  <div className="text-[10px] text-slate-500">Email: {client?.email}</div>
                  <div className="text-[10px] text-slate-500">Teléfono: {client?.phone}</div>
                </div>
              </div>
            </div>

            {/* Passengers */}
            <div className="mb-8">
              <div className="text-[9px] font-extrabold uppercase tracking-widest text-slate-400 mb-2 border-b pb-1">LISTADO DE PASAJEROS</div>
              <div className="grid grid-cols-2 gap-3 mt-3">
                {voucher.passengerNames?.map((name: string, idx: number) => (
                  <div key={idx} className="flex items-center gap-3 p-2 px-4 bg-slate-50 rounded-lg border border-slate-100">
                    <div className="w-1.5 h-1.5 bg-[#0F1E3C] rounded-full"></div>
                    <span className="text-[11px] font-bold text-[#0F1E3C]">{name}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Service Details */}
            {voucher.serviceDetails && (
              <div className="mb-8">
                <div className="text-[9px] font-extrabold uppercase tracking-widest text-slate-400 mb-2 border-b pb-1">DETALLES DEL SERVICIO</div>
                <div className="mt-3 p-4 bg-white border border-slate-100 rounded-lg text-[10px] text-slate-600 leading-relaxed">
                  {voucher.serviceDetails}
                </div>
              </div>
            )}

            {/* Notes */}
            {voucher.notes && (
              <div className="mb-8">
                <div className="text-[9px] font-extrabold uppercase tracking-widest text-slate-400 mb-2 border-b pb-1">OBSERVACIONES</div>
                <div className="mt-3 p-4 bg-slate-50 rounded-lg text-[10px] text-slate-500 italic">
                  {voucher.notes}
                </div>
              </div>
            )}

            {/* Footer */}
            <div className="mt-auto pt-10 border-t border-slate-100 text-center text-[9px] text-slate-400">
              <p className="mb-2 text-[#0F1E3C] font-bold">ESTE VOUCHER ES EL COMPROBANTE OFICIAL DEL SERVICIO CONTRATADO</p>
              <p>Por favor presente este documento al momento de realizar su check-in o abordar el servicio.</p>
              <p>Ante cualquier inconveniente o duda, contacte inmediatamente a su agente de viajes ADE TRAVEL.</p>
              <p className="mt-4 font-bold uppercase tracking-widest text-slate-500">ADE TRAVEL - AGENCIA DE VIAJES</p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
