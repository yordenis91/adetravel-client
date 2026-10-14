// Mismo cálculo que la API (adetravel-api: src/utils/money.ts y src/services/quotation.calc.ts),
// para que el total que ve el usuario en el formulario sea el que se guarda.

/** Decimales de cada moneda: el peso chileno no tiene centavos, el dólar sí. */
export function currencyDecimals(currency: string | null | undefined): number {
  return currency === "USD" ? 2 : 0;
}

/** Redondea a los decimales de la moneda; el epsilon evita errores del tipo 1.005 -> 1.00. */
export function roundMoney(value: number, currency: string | null | undefined): number {
  const factor = 10 ** currencyDecimals(currency);
  return Math.round((value + Number.EPSILON) * factor) / factor;
}

/**
 * Totales de una cotización: cada línea redondeada a la moneda, descuento antes del IVA y sin
 * bajar de cero, y `subtotal - descuento + IVA = total`.
 */
export function calculateQuotationTotals(
  items: { quantity: number; unitPrice: number }[],
  taxPercentage: number,
  discount: number,
  currency: string
) {
  const subtotal = roundMoney(items.reduce((sum, i) => sum + roundMoney(i.quantity * i.unitPrice, currency), 0), currency);
  const discounted = roundMoney(Math.max(0, subtotal - (discount || 0)), currency);
  const taxAmount = roundMoney((discounted * (taxPercentage || 0)) / 100, currency);
  const total = roundMoney(discounted + taxAmount, currency);
  return { subtotal, taxAmount, total };
}

/**
 * Importe legible con separador de miles: "$1.166.200" en pesos (es-CL) y "$1,543.19" en dólares u otras
 * monedas (en-US), con los decimales de cada moneda. Sin el código de moneda: quien lo muestra lo añade.
 */
export function formatMoney(amount: number | string | null | undefined, currency: string | null | undefined): string {
  const value = Number(amount);
  if (amount === null || amount === undefined || amount === "" || !Number.isFinite(value)) return "—";
  const decimals = currencyDecimals(currency);
  return new Intl.NumberFormat(currency === "USD" ? "en-US" : "es-CL", {
    style: "currency",
    currency: currency === "USD" ? "USD" : "CLP",
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}
