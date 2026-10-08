import React from "react";
import { describe, it, expect } from "vitest";
import { render, screen, within } from "@testing-library/react";
import { RequestStatusFlow } from "../RequestStatusFlow";

describe("RequestStatusFlow", () => {
  it("muestra las 16 etapas en una rejilla que reparte el ancho y marca la actual", () => {
    render(<RequestStatusFlow currentStatus="PAGADO_POR_CLIENTE" />);
    const list = screen.getByRole("list", { name: "Etapas de la solicitud" });
    const steps = within(list).getAllByRole("listitem");
    expect(steps).toHaveLength(16);
    expect(list.style.gridTemplateColumns).toBe("repeat(16, minmax(56px, 1fr))");
    expect(steps.findIndex((s) => s.getAttribute("aria-current") === "step")).toBe(11);
  });

  it("una solicitud cancelada no marca ninguna etapa", () => {
    render(<RequestStatusFlow currentStatus="CANCELADA" />);
    expect(screen.getByText("SOLICITUD CANCELADA")).toBeInTheDocument();
    expect(screen.getAllByRole("listitem").some((s) => s.hasAttribute("aria-current"))).toBe(false);
  });
});
