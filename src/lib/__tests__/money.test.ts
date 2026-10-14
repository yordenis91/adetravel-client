import { describe, it, expect } from "vitest";
import { calculateQuotationTotals, formatMoney, roundMoney } from "../money";

// Mismos casos que la API (__tests__/payments-quotations.e2e.test.ts): el total que muestra el
// formulario debe ser el que guarda el servidor.
describe("calculateQuotationTotals", () => {
  it("CLP con descuento e IVA: 148.750", () => {
    expect(calculateQuotationTotals([{ quantity: 3, unitPrice: 45000 }], 19, 10000, "CLP")).toEqual({ subtotal: 135000, taxAmount: 23750, total: 148750 });
  });

  it("USD al centavo: 13,69 (antes el IVA se redondeaba a entero)", () => {
    const items = [{ quantity: 1, unitPrice: 10.5 }, { quantity: 3, unitPrice: 0.333 }];
    expect(calculateQuotationTotals(items, 19, 0, "USD")).toEqual({ subtotal: 11.5, taxAmount: 2.19, total: 13.69 });
  });

  it("el descuento no deja el subtotal en negativo", () => {
    expect(calculateQuotationTotals([{ quantity: 1, unitPrice: 100 }], 19, 500, "CLP").total).toBe(0);
  });

  it("roundMoney respeta los decimales de cada moneda", () => {
    expect(roundMoney(1.005, "USD")).toBe(1.01);
    expect(roundMoney(1499.6, "CLP")).toBe(1500);
  });
});

describe("formatMoney", () => {
  it("pesos con separador de miles y sin decimales", () => {
    expect(formatMoney(1166200, "CLP")).toMatch(/^\$\s?1\.166\.200$/);
    expect(formatMoney("239190", "CLP")).toMatch(/^\$\s?239\.190$/);
    expect(formatMoney(0, "CLP")).toMatch(/^\$\s?0$/);
  });

  it("dólares con coma de miles y dos decimales", () => {
    expect(formatMoney(1543.19, "USD")).toBe("$1,543.19");
    expect(formatMoney(2000, "USD")).toBe("$2,000.00");
  });

  it("un importe ausente o no numérico muestra un guion, no NaN", () => {
    for (const v of [null, undefined, "", "abc", NaN]) expect(formatMoney(v as never, "CLP")).toBe("—");
  });
});
