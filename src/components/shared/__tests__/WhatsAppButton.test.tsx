import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { TooltipProvider } from "@/components/ui/tooltip";
import { WhatsAppButton } from "../WhatsAppButton";

const renderButton = (ui: React.ReactElement) => render(<TooltipProvider>{ui}</TooltipProvider>);

describe("WhatsAppButton", () => {
  it("con teléfono válido es un enlace que abre wa.me en otra pestaña, de forma segura", () => {
    renderButton(<WhatsAppButton phone="+56 9 1234 5678" message="Hola Ana" />);
    const link = screen.getByRole("link", { name: "Escribir por WhatsApp" });
    expect(link).toHaveAttribute("href", "https://wa.me/56912345678?text=Hola%20Ana");
    expect(link).toHaveAttribute("target", "_blank");
    expect(link.getAttribute("rel")).toContain("noopener");
    expect(link.getAttribute("rel")).toContain("noreferrer");
  });

  it("la variante icono mantiene el nombre accesible", () => {
    renderButton(<WhatsAppButton variant="icon" phone="+56912345678" label="Escribir a Ana" />);
    expect(screen.getByRole("link", { name: "Escribir a Ana" })).toBeInTheDocument();
  });

  it("sin teléfono queda desactivado y no es un enlace", () => {
    renderButton(<WhatsAppButton phone="" />);
    expect(screen.queryByRole("link")).toBeNull();
    expect(screen.getByRole("button", { name: /no disponible/i })).toBeDisabled();
  });

  it("con teléfono sin código de país también queda desactivado", () => {
    renderButton(<WhatsAppButton phone="5555 1234" />);
    expect(screen.queryByRole("link")).toBeNull();
    expect(screen.getByRole("button", { name: /no disponible/i })).toBeDisabled();
  });
});
