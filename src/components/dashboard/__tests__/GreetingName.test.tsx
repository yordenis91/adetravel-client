import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render } from "@testing-library/react";

let currentUser: any = null;
vi.mock("@/context/AuthContext", () => ({ useAuth: () => ({ user: currentUser }) }));

import { GreetingName, firstName } from "../GreetingName";

describe("saludo del panel", () => {
  it("firstName toma solo el primer nombre y tolera vacíos", () => {
    expect(firstName("Ana María Pérez")).toBe("Ana");
    expect(firstName("  Luis  ")).toBe("Luis");
    expect(firstName("")).toBe("");
    expect(firstName(undefined)).toBe("");
    expect(firstName(null)).toBe("");
  });

  it("muestra ', Nombre' de la persona autenticada, no un nombre fijo", () => {
    currentUser = { fullName: "Ana María Pérez" };
    const { container } = render(<h1>Hola<GreetingName /></h1>);
    expect(container.textContent).toBe("Hola, Ana");
    expect(container.textContent).not.toContain("Admin");
  });

  it("sin nombre no añade nada", () => {
    currentUser = { fullName: "" };
    const { container } = render(<h1>Hola<GreetingName /></h1>);
    expect(container.textContent).toBe("Hola");
  });
});
