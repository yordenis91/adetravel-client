import { format } from "date-fns";
import { es } from "date-fns/locale";

const NAVY = "#0F1E3C";
const GOLD = "#C9A84C";
const LIGHT_BG = "#f8fafc";

const formatCurrency = (amount: number, currency: string) => {
  return new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: currency || "CLP",
  }).format(amount);
};

const formatDate = (dateString: string) => {
  if (!dateString) return "N/A";
  try {
    return format(new Date(dateString), "dd 'de' MMMM, yyyy", { locale: es });
  } catch (e) {
    return dateString;
  }
};

const headerHtml = `
  <div style="background-color: ${NAVY}; padding: 30px; text-align: center; border-bottom: 4px solid ${GOLD};">
    <h1 style="color: white; margin: 0; font-family: Arial, sans-serif; letter-spacing: 2px;">ADE TRAVEL</h1>
  </div>
`;

const footerHtml = `
  <div style="padding: 30px; text-align: center; color: #64748b; font-family: Arial, sans-serif; font-size: 12px;">
    <p style="margin: 5px 0;">ADE Travel — Expertos en Viajes</p>
    <p style="margin: 5px 0;">Contacto: <a href="mailto:contacto@adetravel.cl" style="color: ${NAVY}; text-decoration: none;">contacto@adetravel.cl</a></p>
    <p style="margin: 20px 0 0; font-style: italic; color: #94a3b8;">Este email fue generado automáticamente por nuestro sistema de gestión.</p>
  </div>
`;

const containerStyle = `max-width: 600px; margin: 0 auto; background-color: white; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;`;

export function buildQuotationEmail(quotation: any, client: any, request: any): { subject: string; body_html: string } {
  const items = (quotation.items || []).map((item: string) => {
    try {
      return JSON.parse(item);
    } catch (e) {
      return null;
    }
  }).filter(Boolean);

  const destination = request ? `${request.originCity || 'N/A'} → ${request.destinationCity || 'N/A'}` : 'N/A';

  const body_html = `
    <div style="background-color: ${LIGHT_BG}; padding: 20px; font-family: Arial, sans-serif;">
      <div style="${containerStyle}">
        ${headerHtml}
        <div style="padding: 30px; color: ${NAVY};">
          <h2 style="margin-top: 0;">Estimado/a ${client?.firstName || 'Cliente'},</h2>
          <p style="line-height: 1.6;">Nos complace presentarle la siguiente cotización de servicios de viaje, diseñada especialmente según sus requerimientos.</p>
          
          <div style="background-color: #f1f5f9; padding: 20px; border-radius: 6px; margin: 25px 0;">
            <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
              <tr><td style="padding: 4px 0; color: #64748b;">Cotización N°:</td><td style="padding: 4px 0; font-weight: bold; text-align: right;">${quotation.quotationNumber}</td></tr>
              <tr><td style="padding: 4px 0; color: #64748b;">Fecha Emisión:</td><td style="padding: 4px 0; font-weight: bold; text-align: right;">${formatDate(quotation.created_at)}</td></tr>
              <tr><td style="padding: 4px 0; color: #64748b;">Válida Hasta:</td><td style="padding: 4px 0; font-weight: bold; text-align: right;">${formatDate(quotation.validUntil)}</td></tr>
              <tr><td style="padding: 4px 0; color: #64748b;">Destino:</td><td style="padding: 4px 0; font-weight: bold; text-align: right;">${destination}</td></tr>
            </table>
          </div>

          <table style="width: 100%; border-collapse: collapse; margin: 25px 0; font-size: 14px;">
            <thead>
              <tr style="border-bottom: 2px solid #e2e8f0;">
                <th style="text-align: left; padding: 12px 8px; color: #64748b;">Servicio</th>
                <th style="text-align: center; padding: 12px 8px; color: #64748b;">Cant.</th>
                <th style="text-align: right; padding: 12px 8px; color: #64748b;">Total</th>
              </tr>
            </thead>
            <tbody>
              ${items.map((item: any) => `
                <tr style="border-bottom: 1px solid #f1f5f9;">
                  <td style="padding: 12px 8px;">
                    <div style="font-weight: bold;">${item.service}</div>
                    <div style="font-size: 12px; color: #64748b;">${item.description}</div>
                  </td>
                  <td style="padding: 12px 8px; text-align: center;">${item.quantity}</td>
                  <td style="padding: 12px 8px; text-align: right;">${formatCurrency(item.total, quotation.currency)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <div style="margin-left: auto; width: 250px; background-color: #f8fafc; padding: 15px; border-radius: 6px;">
            <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
              <tr><td style="padding: 4px 0; color: #64748b;">Subtotal:</td><td style="padding: 4px 0; text-align: right;">${formatCurrency(quotation.subtotal, quotation.currency)}</td></tr>
              ${quotation.discount ? `<tr><td style="padding: 4px 0; color: #64748b;">Descuento:</td><td style="padding: 4px 0; text-align: right; color: #ef4444;">-${formatCurrency(quotation.discount, quotation.currency)}</td></tr>` : ''}
              <tr><td style="padding: 4px 0; color: #64748b;">IVA (${quotation.taxPercentage || 19}%):</td><td style="padding: 4px 0; text-align: right;">${formatCurrency(quotation.taxAmount, quotation.currency)}</td></tr>
              <tr style="font-size: 18px; font-weight: bold; color: ${NAVY};"><td style="padding: 12px 0 4px;">TOTAL:</td><td style="padding: 12px 0 4px; text-align: right;">${formatCurrency(quotation.total, quotation.currency)}</td></tr>
            </table>
          </div>

          <div style="text-align: center; margin: 40px 0;">
            <a href="mailto:contacto@adetravel.cl?subject=Confirmación Cotización ${quotation.quotationNumber}" style="background-color: ${GOLD}; color: white; padding: 16px 32px; text-decoration: none; border-radius: 6px; font-weight: bold; font-family: Arial, sans-serif; display: inline-block;">Contáctenos para confirmar</a>
          </div>

          ${quotation.termsAndConditions ? `
            <div style="margin-top: 40px; border-top: 1px solid #e2e8f0; padding-top: 20px;">
              <p style="font-size: 11px; color: #94a3b8; font-style: italic; margin: 0;">
                <strong>Términos y Condiciones:</strong> ${quotation.termsAndConditions.substring(0, 300)}${quotation.termsAndConditions.length > 300 ? '...' : ''}
              </p>
            </div>
          ` : ''}
        </div>
        ${footerHtml}
      </div>
    </div>
  `;

  return { subject: `Cotización ${quotation.quotationNumber} — ADE Travel`, body_html };
}

export function buildPaymentEmail(payment: any, client: any, request: any): { subject: string; body_html: string } {
  const body_html = `
    <div style="background-color: ${LIGHT_BG}; padding: 20px; font-family: Arial, sans-serif;">
      <div style="${containerStyle}">
        ${headerHtml}
        <div style="padding: 30px; color: ${NAVY};">
          <h2 style="margin-top: 0;">Estimado/a ${client?.firstName || 'Cliente'},</h2>
          <p style="line-height: 1.6;">Confirmamos que hemos recibido su pago correctamente. Adjunto encontrará el comprobante correspondiente.</p>
          
          <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; padding: 25px; border-radius: 8px; margin: 30px 0;">
            <h3 style="margin-top: 0; color: #166534; font-size: 16px; border-bottom: 1px solid #bbf7d0; padding-bottom: 10px;">Detalles del Pago</h3>
            <table style="width: 100%; border-collapse: collapse; font-size: 14px; margin-top: 10px;">
              <tr><td style="padding: 6px 0; color: #166534;">Pago N°:</td><td style="padding: 6px 0; font-weight: bold; text-align: right;">${payment.paymentNumber}</td></tr>
              <tr><td style="padding: 6px 0; color: #166534;">Fecha:</td><td style="padding: 6px 0; font-weight: bold; text-align: right;">${formatDate(payment.paymentDate)}</td></tr>
              <tr><td style="padding: 6px 0; color: #166534;">Monto:</td><td style="padding: 6px 0; font-weight: bold; text-align: right; font-size: 18px;">${formatCurrency(payment.amount, payment.currency)}</td></tr>
              <tr><td style="padding: 6px 0; color: #166534;">Método:</td><td style="padding: 6px 0; font-weight: bold; text-align: right;">${payment.method}</td></tr>
              ${payment.reference ? `<tr><td style="padding: 6px 0; color: #166534;">Referencia:</td><td style="padding: 6px 0; font-weight: bold; text-align: right;">${payment.reference}</td></tr>` : ''}
            </table>
          </div>

          <p style="line-height: 1.6;">Gracias por su confianza en ADE Travel. Seguimos trabajando para brindarle la mejor experiencia en su viaje.</p>
        </div>
        ${footerHtml}
      </div>
    </div>
  `;

  return { subject: `Confirmación de Pago ${payment.paymentNumber} — ADE Travel`, body_html };
}

export function buildVoucherEmail(voucher: any, client: any, provider: any): { subject: string; body_html: string } {
  const body_html = `
    <div style="background-color: ${LIGHT_BG}; padding: 20px; font-family: Arial, sans-serif;">
      <div style="${containerStyle}">
        ${headerHtml}
        <div style="padding: 30px; color: ${NAVY};">
          <h2 style="margin-top: 0;">Estimado/a ${client?.firstName || 'Cliente'},</h2>
          <p style="line-height: 1.6;">Adjunto encontrará su voucher de servicio confirmado para su próximo viaje.</p>
          
          <div style="background-color: #f0f9ff; border: 1px solid #bae6fd; padding: 25px; border-radius: 8px; margin: 30px 0;">
            <div style="display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 1px solid #bae6fd; padding-bottom: 15px; margin-bottom: 15px;">
              <div>
                <span style="background-color: ${NAVY}; color: white; padding: 4px 10px; border-radius: 4px; font-size: 10px; font-weight: bold; text-transform: uppercase;">${voucher.serviceType}</span>
                <h3 style="margin: 10px 0 5px; color: ${NAVY}; font-size: 18px;">${voucher.serviceName}</h3>
              </div>
              <div style="text-align: right;">
                <div style="font-size: 11px; color: #64748b;">Código Confirmación</div>
                <div style="font-size: 18px; font-weight: bold; color: ${GOLD};">${voucher.confirmationCode || 'PENDIENTE'}</div>
              </div>
            </div>

            <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
              <tr>
                <td style="padding: 8px 0; width: 50%;">
                  <div style="color: #64748b; font-size: 12px;">Destino</div>
                  <div style="font-weight: bold;">${voucher.destination || 'N/A'}</div>
                </td>
                <td style="padding: 8px 0; width: 50%;">
                  <div style="color: #64748b; font-size: 12px;">Voucher N°</div>
                  <div style="font-weight: bold;">${voucher.voucherNumber}</div>
                </td>
              </tr>
              <tr>
                <td style="padding: 8px 0;">
                  <div style="color: #64748b; font-size: 12px;">Check-in / Inicio</div>
                  <div style="font-weight: bold;">${formatDate(voucher.checkIn)}</div>
                </td>
                <td style="padding: 8px 0;">
                  <div style="color: #64748b; font-size: 12px;">Check-out / Fin</div>
                  <div style="font-weight: bold;">${formatDate(voucher.checkOut)}</div>
                </td>
              </tr>
              ${provider ? `
              <tr>
                <td colspan="2" style="padding: 8px 0;">
                  <div style="color: #64748b; font-size: 12px;">Operador</div>
                  <div style="font-weight: bold;">${provider.fantasyName || provider.name}</div>
                </td>
              </tr>
              ` : ''}
            </table>
          </div>

          ${voucher.passengerNames && voucher.passengerNames.length > 0 ? `
            <div style="margin: 25px 0;">
              <h4 style="margin: 0 0 10px; font-size: 14px; color: #64748b;">Pasajeros:</h4>
              <ul style="margin: 0; padding-left: 20px; font-size: 14px;">
                ${voucher.passengerNames.map((name: string) => `<li style="padding: 2px 0;">${name}</li>`).join('')}
              </ul>
            </div>
          ` : ''}

          ${voucher.notes ? `
            <div style="background-color: #fffbeb; border: 1px solid #fef3c7; padding: 15px; border-radius: 6px; margin: 25px 0; font-size: 13px;">
              <strong style="color: #92400e;">Notas Importantes:</strong><br/>
              <span style="color: #92400e;">${voucher.notes}</span>
            </div>
          ` : ''}

          <p style="font-size: 14px; text-align: center; color: #64748b; margin-top: 30px;">
            <strong>Presente este voucher al momento de utilizar el servicio.</strong>
          </p>
        </div>
        ${footerHtml}
      </div>
    </div>
  `;

  return { subject: `Voucher ${voucher.voucherNumber} — ${voucher.serviceName} — ADE Travel`, body_html };
}
