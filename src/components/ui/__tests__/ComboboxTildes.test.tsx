import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Combobox } from "@/components/ui/combobox";
import { normalizeSearch } from "@/lib/normalize-search";

// "Peru" no encontraba "Perú": el campo acababa guardando "Peru" como texto libre (hallazgo de la
// prueba en navegador, 2026-10-11). La búsqueda ignora tildes y mayúsculas en las dos variantes.

const OPTIONS = ["Perú", "Panamá", "España", "República Dominicana", "Chile"].map((n) => ({ value: n, label: n }));

async function buscar(texto: string, allowCustomValue: boolean) {
  const onChange = vi.fn();
  render(<Combobox options={OPTIONS} value="" onChange={onChange} allowCustomValue={allowCustomValue} searchPlaceholder="Buscar..." />);
  const user = userEvent.setup();
  await user.click(screen.getByRole("combobox"));
  await user.type(screen.getByPlaceholderText("Buscar..."), texto);
  return { user, onChange, items: () => screen.queryAllByRole("option").map((o) => o.textContent) };
}

describe("normalizeSearch", () => {
  it("quita tildes y diéresis y pasa a minúsculas", () => {
    expect(normalizeSearch("Perú")).toBe("peru");
    expect(normalizeSearch("ESPAÑA")).toBe("espana");
    expect(normalizeSearch("Zürich")).toBe("zurich");
  });
});

describe.each([["con valor libre", true], ["sin valor libre", false]])("Combobox %s", (_n, allowCustomValue) => {
  it("'peru' encuentra 'Perú'", async () => {
    const { items } = await buscar("peru", allowCustomValue as boolean);
    expect(items()).toEqual(["Perú"]);
  });

  it("'ESPANA' encuentra 'España' (mayúsculas y ñ)", async () => {
    expect((await buscar("ESPANA", allowCustomValue as boolean)).items()).toEqual(["España"]);
  });

  it("'republica' encuentra 'República Dominicana'", async () => {
    expect((await buscar("republica", allowCustomValue as boolean)).items()).toEqual(["República Dominicana"]);
  });

  it("escribir con tilde también funciona ('Panamá')", async () => {
    const { items } = await buscar("Panamá", allowCustomValue as boolean);
    expect(items()).toEqual(["Panamá"]);
  });
});

describe("Combobox con valor libre", () => {
  it("elegir la sugerencia guarda el nombre con tilde, no lo escrito", async () => {
    const { user, onChange } = await buscar("peru", true);
    await user.click(screen.getByRole("option", { name: "Perú" }));
    expect(onChange).toHaveBeenCalledWith("Perú");
  });

  it("un texto sin coincidencias sigue ofreciendo guardarlo tal cual", async () => {
    await buscar("Atlantida", true);
    expect(screen.getByRole("button", { name: 'Usar "Atlantida"' })).toBeTruthy();
  });
});
