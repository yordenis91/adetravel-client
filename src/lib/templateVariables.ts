export const TEMPLATE_TYPES = [
    { value: 'QUOTATION_SENT', label: 'Cotización Enviada', color: 'blue' },
    { value: 'PAYMENT_CONFIRMED', label: 'Pago Confirmado', color: 'green' },
    { value: 'VOUCHER_ISSUED', label: 'Voucher Emitido', color: 'purple' },
    { value: 'REQUEST_CREATED', label: 'Nueva Solicitud', color: 'amber' },
    { value: 'CUSTOM', label: 'Personalizada', color: 'gray' },
  ]
  
  export const TEMPLATE_VARIABLES: Record<string, { name: string; description: string; sample: string }[]> = {
    QUOTATION_SENT: [
      { name: 'client_name', description: 'Nombre del cliente', sample: 'María González' },
      { name: 'quotation_number', description: 'Número de cotización', sample: 'COTIZ-2024-05-0001' },
      { name: 'valid_until', description: 'Fecha de vencimiento', sample: '30 de mayo, 2024' },
      { name: 'destination', description: 'Destino del viaje', sample: 'Santiago → París' },
      { name: 'total', description: 'Total de la cotización', sample: '$2.450.000' },
      { name: 'currency', description: 'Moneda', sample: 'CLP' },
      { name: 'agency_name', description: 'Nombre de la agencia', sample: 'ADE Travel' },
      { name: 'agency_email', description: 'Email de la agencia', sample: 'contacto@adetravel.cl' },
      { name: 'agency_phone', description: 'Teléfono de la agencia', sample: '+56 9 1234 5678' },
    ],
    PAYMENT_CONFIRMED: [
      { name: 'client_name', description: 'Nombre del cliente', sample: 'María González' },
      { name: 'payment_number', description: 'Número de pago', sample: 'PAG-2024-05-0001' },
      { name: 'amount', description: 'Monto del pago', sample: '$850.000' },
      { name: 'currency', description: 'Moneda', sample: 'CLP' },
      { name: 'payment_date', description: 'Fecha del pago', sample: '15 de mayo, 2024' },
      { name: 'payment_method', description: 'Método de pago', sample: 'Transferencia Bancaria' },
      { name: 'reference', description: 'Referencia/comprobante', sample: 'REF-123456' },
      { name: 'agency_name', description: 'Nombre de la agencia', sample: 'ADE Travel' },
      { name: 'agency_email', description: 'Email de la agencia', sample: 'contacto@adetravel.cl' },
    ],
    VOUCHER_ISSUED: [
      { name: 'client_name', description: 'Nombre del cliente', sample: 'María González' },
      { name: 'voucher_number', description: 'Número de voucher', sample: 'VCH-2024-05-0001' },
      { name: 'service_name', description: 'Nombre del servicio', sample: 'Hotel Grand Palace' },
      { name: 'service_type', description: 'Tipo de servicio', sample: 'Hotel' },
      { name: 'destination', description: 'Destino', sample: 'París, Francia' },
      { name: 'check_in', description: 'Fecha de entrada', sample: '01 de junio, 2024' },
      { name: 'check_out', description: 'Fecha de salida', sample: '08 de junio, 2024' },
      { name: 'confirmation_code', description: 'Código de confirmación', sample: 'CONF-789ABC' },
      { name: 'passengers', description: 'Lista de pasajeros', sample: 'María González, Juan González' },
      { name: 'agency_name', description: 'Nombre de la agencia', sample: 'ADE Travel' },
    ],
    REQUEST_CREATED: [
      { name: 'client_name', description: 'Nombre del cliente', sample: 'María González' },
      { name: 'request_number', description: 'Número de solicitud', sample: 'ADET-2024-05-0001' },
      { name: 'destination', description: 'Destino del viaje', sample: 'Santiago → París' },
      { name: 'request_date', description: 'Fecha de la solicitud', sample: '10 de mayo, 2024' },
      { name: 'agency_name', description: 'Nombre de la agencia', sample: 'ADE Travel' },
      { name: 'agency_email', description: 'Email de la agencia', sample: 'contacto@adetravel.cl' },
    ],
    CUSTOM: [
      { name: 'client_name', description: 'Nombre del cliente', sample: 'María González' },
      { name: 'agency_name', description: 'Nombre de la agencia', sample: 'ADE Travel' },
      { name: 'agency_email', description: 'Email de la agencia', sample: 'contacto@adetravel.cl' },
    ],
  }
  
  /** Replace {{variable}} placeholders in a string with sample data for preview */
  export function renderWithSampleData(text: string, type: string): string {
    if (!text) return '';
    const vars = TEMPLATE_VARIABLES[type] || TEMPLATE_VARIABLES.CUSTOM
    let result = text
    vars.forEach(v => {
      result = result.replaceAll(`{{${v.name}}}`, v.sample)
    })
    return result
  }
  
  /** Replace {{variable}} placeholders with real data for actual sending */
  export function renderTemplate(text: string, data: Record<string, string>): string {
    if (!text) return '';
    let result = text
    Object.entries(data).forEach(([key, value]) => {
      result = result.replaceAll(`{{${key}}}`, value || '')
    })
    return result
  }