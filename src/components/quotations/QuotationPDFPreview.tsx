import React from "react";
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
  Globe
} from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

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
  if (!quotation) return null;

  const parsedItems = (quotation.items || []).map((i: any) => typeof i === "string" ? JSON.parse(i) : i);
  
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat(quotation.currency === "CLP" ? "es-CL" : "en-US", {
      style: "currency",
      currency: quotation.currency || "CLP",
      minimumFractionDigits: 0,
    }).format(amount || 0);
  };

  const handlePrint = () => {
    const content = document.getElementById('quotation-print-area')?.innerHTML;
    const printWindow = window.open('', '_blank', 'width=900,height=700');
    
    if (!printWindow) return;

    printWindow.document.write(`<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <title>Cotización ${quotation.quotationNumber}</title>
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
    .ade-header {
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
    .quotation-label-box {
      text-align: right;
    }
    .quotation-title {
      font-size: 28px;
      font-weight: 800;
      color: #C9A84C;
      margin-bottom: 5px;
    }
    .quotation-number {
      font-size: 14px;
      font-weight: 700;
      color: #0F1E3C;
      margin-bottom: 10px;
    }
    .date-row {
      font-size: 10px;
      color: #64748b;
    }
    .date-row span {
      color: #0F1E3C;
      font-weight: 600;
    }
    .ade-divider {
      height: 2px;
      background-color: #C9A84C;
      margin-bottom: 30px;
    }
    .info-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 40px;
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
    .info-card {
      background-color: #f8fafc;
      padding: 15px;
      border-radius: 8px;
    }
    .info-name {
      font-size: 13px;
      font-weight: 700;
      color: #0F1E3C;
      margin-bottom: 4px;
    }
    .info-detail {
      color: #64748b;
      font-size: 10px;
      margin-bottom: 2px;
    }
    .ade-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 30px;
    }
    .ade-table th {
      background-color: #0F1E3C;
      color: white;
      text-align: left;
      padding: 12px 15px;
      font-size: 9px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .ade-table td {
      padding: 12px 15px;
      border-bottom: 1px solid #f1f5f9;
      vertical-align: top;
    }
    .ade-table tr:nth-child(even) {
      background-color: #fcfcfc;
    }
    .service-name {
      font-weight: 700;
      color: #0F1E3C;
      margin-bottom: 2px;
    }
    .service-desc {
      font-size: 9px;
      color: #64748b;
    }
    .text-right { text-align: right; }
    .text-center { text-align: center; }
    
    .summary-container {
      display: flex;
      justify-content: flex-end;
      margin-bottom: 40px;
    }
    .ade-totals {
      width: 250px;
      background-color: #f8fafc;
      padding: 20px;
      border-radius: 12px;
      border: 1px solid #f1f5f9;
    }
    .total-row {
      display: flex;
      justify-content: space-between;
      margin-bottom: 8px;
      color: #64748b;
    }
    .total-row.discount { color: #e11d48; }
    .total-row.final {
      margin-top: 15px;
      padding-top: 15px;
      border-top: 2px solid #C9A84C;
      color: #0F1E3C;
      font-weight: 800;
      font-size: 16px;
    }
    .terms-section {
      margin-bottom: 40px;
    }
    .terms-content {
      font-size: 10px;
      color: #64748b;
      font-style: italic;
      background: #f8fafc;
      padding: 15px;
      border-radius: 8px;
      line-height: 1.6;
    }
    .ade-footer {
      margin-top: 50px;
      padding-top: 20px;
      border-top: 1px solid #f1f5f9;
      text-align: center;
      color: #94a3b8;
      font-size: 9px;
    }
    @media print {
      body { padding: 0; }
      .no-print { display: none; }
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
            <DialogTitle className="text-xl font-playfair font-bold text-navy">Vista Previa de Cotización</DialogTitle>
            <p className="text-sm text-muted-foreground mt-1">Revisa el documento antes de enviarlo al cliente.</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={handlePrint} className="bg-navy hover:bg-navy-light text-white gap-2">
              <Printer className="w-4 h-4" /> Imprimir / PDF
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
