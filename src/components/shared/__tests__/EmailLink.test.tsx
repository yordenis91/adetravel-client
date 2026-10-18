import { describe, expect, it } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { buildMailtoUrl } from "@/lib/mailto";
import { EmailLink } from "../EmailLink";

describe("buildMailtoUrl", () => {
  it("arma el enlace mailto con el correo limpio", () => {
    expect(buildMailtoUrl("  ana@example.com ")).toBe("mailto:ana@example.com");
    expect(buildMailtoUrl("ana+viajes@example.com")).toBe("mailto:ana%2Bviajes@example.com");
  });

  it("no arma enlaces rotos con valores que no son un correo", () => {
    for (const bad of [undefined, null, "", "   ", "sin-arroba", "a@b", "a b@c.com", "a@b.com, c@d.com", "<x@y.com>"]) {
      expect(buildMailtoUrl(bad)).toBeNull();
    }
  });
});

describe("EmailLink", () => {
  it("es un enlace mailto con el correo como texto", () => {
    render(<EmailLink email="lucia@example.test" />);
    const link = screen.getByRole("link", { name: "lucia@example.test" });
    expect(link).toHaveAttribute("href", "mailto:lucia@example.test");
    expect(link).toHaveAttribute("title", "Escribir a lucia@example.test");
  });

  it("sin correo muestra el texto alternativo y sin enlace", () => {
    render(<EmailLink email="" fallback="Sin correo" />);
    expect(screen.getByText("Sin correo")).toBeInTheDocument();
    expect(screen.queryByRole("link")).toBeNull();
  });

  it("si el valor no parece correo se muestra como texto, sin enlace", () => {
    render(<EmailLink email="correo-mal-escrito" />);
    expect(screen.getByText("correo-mal-escrito")).toBeInTheDocument();
    expect(screen.queryByRole("link")).toBeNull();
  });

  it("el clic no se propaga a la fila o tarjeta que lo contiene", () => {
    let rowClicks = 0;
    render(
      <div onClick={() => rowClicks++}>
        <EmailLink email="ana@example.com" />
      </div>,
    );
    fireEvent.click(screen.getByRole("link"));
    expect(rowClicks).toBe(0);
  });
});
