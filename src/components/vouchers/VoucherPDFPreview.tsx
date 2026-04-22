import React from "react";
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
  Info
} from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

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
  if (!voucher) return null;

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "N/A";
    try {
      return format(new Date(dateStr), "dd 'de' MMMM, yyyy", { locale: es });
    } catch (e) {
      return dateStr;
    }
  };

  const handlePrint = () => {
    const content = document.getElementById('voucher-print-area')?.innerHTML;
    const printWindow = window.open('', '_blank', 'width=900,height=700');
    
    if (!printWindow) return;

    printWindow.document.write(`<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <title>Voucher ${voucher.voucherNumber}</title>
  <link href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;600;700;800&display=swap" rel="stylesheet">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { 
      font-family: 'Manrope', sans-serif; 
      color: #0F1E3C; 
      background: white; 
      padding: 40px; 
      font-size: 11px;
      line-height: 1.5;
    }
    .voucher-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 30px;
    }
    .agency-info h1 {
      font-size: 24px;
      font-weight: 800;
      color: #0F1E3C;
      letter-spacing: -0.5px;
      margin-bottom: 4px;
    }
    .agency-info p {
      color: #64748b;
      font-size: 10px;
    }
    .voucher-label-box {
      text-align: right;
    }
    .voucher-title {
      font-size: 28px;
      font-weight: 800;
      color: #0F1E3C;
      margin-bottom: 5px;
    }
    .voucher-number {
      font-size: 14px;
      font-weight: 700;
      color: #C9A84C;
      margin-bottom: 10px;
    }
    .status-badge {
      display: inline-block;
      padding: 4px 12px;
      background: #f1f5f9;
      border-radius: 4px;
      font-size: 9px;
      font-weight: 800;
      text-transform: uppercase;
      color: #475569;
    }
    .status-emitido { background: #dcfce7; color: #166534; }
    
    .gold-divider {
      height: 2px;
      background-color: #C9A84C;
      margin-bottom: 30px;
    }
    
    .service-card {
      background-color: #f0f4f8;
      padding: 25px;
      border-radius: 12px;
      margin-bottom: 30px;
      position: relative;
    }
    .service-type-badge {
      display: inline-block;
      padding: 4px 10px;
      background: #0F1E3C;
      color: white;
      font-size: 9px;
      font-weight: 800;
      border-radius: 4px;
      margin-bottom: 10px;
    }
    .service-name {
      font-size: 20px;
      font-weight: 800;
      margin-bottom: 10px;
      color: #0F1E3C;
    }
    .service-meta {
      display: flex;
      gap: 20px;
      font-size: 11px;
      color: #64748b;
    }
    .meta-item {
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .confirmation-box {
      position: absolute;
      top: 25px;
      right: 25px;
      text-align: right;
    }
    .conf-label {
      font-size: 9px;
      font-weight: 700;
      color: #94a3b8;
      text-transform: uppercase;
      margin-bottom: 4px;
    }
    .conf-code {
      background: white;
      padding: 8px 15px;
      border: 2px solid #C9A84C;
      border-radius: 8px;
      font-size: 16px;
      font-weight: 800;
      color: #0F1E3C;
    }
    
    .info-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 30px;
      margin-bottom: 30px;
    }
    .section-title {
      font-size: 9px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 1px;
      color: #94a3b8;
      margin-bottom: 8px;
      border-bottom: 1px solid #f1f5f9;
      padding-bottom: 4px;
    }
    .info-box {
      padding: 15px;
      background: #fafbfc;
      border-radius: 8px;
    }
    .info-name {
      font-size: 13px;
      font-weight: 700;
      margin-bottom: 5px;
    }
    .info-detail {
      font-size: 10px;
      color: #64748b;
      margin-bottom: 2px;
    }
    
    .passengers-section {
      margin-bottom: 30px;
    }
    .passenger-list {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px;
    }
    .passenger-item {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 8px 12px;
      background: #f8fafc;
      border-radius: 6px;
    }
    .passenger-dot {
      width: 6px;
      height: 6px;
      background: #0F1E3C;
      border-radius: 50%;
    }
    
    .details-box {
      background: white;
      border: 1px solid #f1f5f9;
      padding: 15px;
      border-radius: 8px;
      margin-bottom: 30px;
    }
    .notes-box {
      background: #f8fafc;
      padding: 15px;
      border-radius: 8px;
      font-style: italic;
      color: #64748b;
      font-size: 10px;
    }
    
    .voucher-footer {
      margin-top: 50px;
      padding-top: 20px;
      border-top: 1px solid #f1f5f9;
      text-align: center;
      color: #94a3b8;
      font-size: 9px;
      line-height: 1.6;
    }
    
    @media print {
      body { padding: 0; }
      @page { margin: 15mm; size: A4; }
    }
  </style>
</head>
<body>
  ${content}
</body>
</html>`);
    
    printWindow.document.close();
    setTimeout(() => { 
      printWindow.focus(); 
      printWindow.print(); 
    }, 500);
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
            <Button onClick={handlePrint} className="bg-navy hover:bg-navy-light text-white gap-2">
              <Printer className="w-4 h-4" /> Imprimir / Descargar PDF
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
