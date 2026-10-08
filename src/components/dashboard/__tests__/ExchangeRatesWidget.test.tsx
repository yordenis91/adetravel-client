import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { ExchangeRatesWidget, formatInterval } from "../ExchangeRatesWidget";

describe("ExchangeRatesWidget", () => {
  it("el engranaje lleva directo a la pestaña Divisas", () => {
    render(<MemoryRouter><ExchangeRatesWidget exchangeRates={[]} autoSync intervalMinutes={480} /></MemoryRouter>);
    expect(screen.getByLabelText("Configurar tipos de cambio").closest("a")?.getAttribute("href")).toBe("/configuracion?tab=divisas");
    expect(screen.getByText("Actualización automática cada 8 h")).toBeTruthy();
  });

  it("formatea intervalos", () => {
    expect(formatInterval(30)).toBe("cada 30 min");
    expect(formatInterval(60)).toBe("cada hora");
    expect(formatInterval(1440)).toBe("cada día");
  });
});
