import { describe, it, expect } from "vitest";
import { describeTrend } from "../trend";

describe("describeTrend: conteos (diferencia absoluta)", () => {
  it.each([
    [{ current: 5, previous: 3 }, "up", "+2"],
    [{ current: 1, previous: 4 }, "down", "-3"],
    [{ current: 4, previous: 4 }, "neutral", "sin cambios"],
    [{ current: 0, previous: 0 }, "neutral", "sin cambios"],
    [{ current: 3, previous: 0 }, "up", "+3"],
    [{ current: 0, previous: 2 }, "down", "-2"],
  ])("%j -> %s %s", (pair, trend, label) => {
    expect(describeTrend(pair, "count")).toMatchObject({ trend, label });
  });
});

describe("describeTrend: importes (porcentaje)", () => {
  it.each([
    [{ current: 1500, previous: 1000 }, "up", "+50%"],
    [{ current: 750, previous: 1000 }, "down", "-25%"],
    [{ current: 1000, previous: 1000 }, "neutral", "sin cambios"],
    [{ current: 1004, previous: 1000 }, "neutral", "sin cambios"], // 0,4 % se redondea a 0
    [{ current: 500, previous: 0 }, "up", "nuevo"], // no se divide por cero
    [{ current: 0, previous: 800 }, "down", "-100%"],
    [{ current: 0, previous: 0 }, "neutral", "sin cambios"],
  ])("%j -> %s %s", (pair, trend, label) => {
    expect(describeTrend(pair, "amount")).toMatchObject({ trend, label });
  });
});

describe("describeTrend: aviso y datos no válidos", () => {
  it("el aviso incluye los dos valores comparados y los días", () => {
    const t = describeTrend({ current: 5, previous: 3 }, "count", 30)!;
    expect(t.hint).toBe("Últimos 30 días: 5. 30 días anteriores: 3.");
  });

  it("usa el formato dado para los importes", () => {
    const t = describeTrend({ current: 2000, previous: 1000 }, "amount", 30, (n) => `$${n}`)!;
    expect(t.hint).toContain("$2000");
    expect(t.hint).toContain("$1000");
  });

  it("sin datos (API antigua) devuelve null en vez de inventar una tendencia", () => {
    expect(describeTrend(undefined, "count")).toBeNull();
    expect(describeTrend(null, "amount")).toBeNull();
    expect(describeTrend({ current: NaN, previous: 1 }, "count")).toBeNull();
  });
});
