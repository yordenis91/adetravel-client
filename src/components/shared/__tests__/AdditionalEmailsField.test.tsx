import { useState } from "react";
import { describe, expect, it } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { AdditionalEmailsField } from "../AdditionalEmailsField";
import { MAX_ADDITIONAL_EMAILS } from "@/lib/mailto";

function Harness({ initial = [] as string[], error }: { initial?: string[]; error?: unknown }) {
  const [value, setValue] = useState<string[]>(initial);
  return (
    <>
      <AdditionalEmailsField value={value} onChange={setValue} error={error} />
      <output data-testid="valor">{JSON.stringify(value)}</output>
    </>
  );
}
const value = () => JSON.parse(screen.getByTestId("valor").textContent ?? "null");

describe("AdditionalEmailsField", () => {
  it("empieza sin filas y agrega una fila vacía con el botón", () => {
    render(<Harness />);
    expect(screen.queryByLabelText(/Correo adicional/)).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: /Agregar correo/ }));
    expect(screen.getByLabelText("Correo adicional 1")).toBeInTheDocument();
    expect(value()).toEqual([""]);
  });

  it("escribe en cada fila y quita la que se elige", () => {
    render(<Harness initial={["a@example.com", "b@example.com", "c@example.com"]} />);
    fireEvent.change(screen.getByLabelText("Correo adicional 2"), { target: { value: "otro@example.com" } });
    expect(value()).toEqual(["a@example.com", "otro@example.com", "c@example.com"]);
    fireEvent.click(screen.getByRole("button", { name: "Quitar correo adicional 1" }));
    expect(value()).toEqual(["otro@example.com", "c@example.com"]);
    expect(screen.queryByLabelText("Correo adicional 3")).toBeNull();
  });

  it("al llegar al máximo desactiva el botón y lo avisa", () => {
    render(<Harness initial={Array.from({ length: MAX_ADDITIONAL_EMAILS }, (_, i) => `p${i}@example.com`)} />);
    expect(screen.getByRole("button", { name: /Agregar correo/ })).toBeDisabled();
    expect(screen.getByText(`Máximo ${MAX_ADDITIONAL_EMAILS} correos adicionales`)).toBeInTheDocument();
  });

  it("muestra el error de cada fila junto a su campo", () => {
    render(<Harness initial={["bien@example.com", "mal"]} error={[undefined, { message: "Correo inválido" }]} />);
    expect(screen.getByText("Correo inválido")).toBeInTheDocument();
    expect(screen.getByLabelText("Correo adicional 2")).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByLabelText("Correo adicional 1")).not.toHaveAttribute("aria-invalid");
  });
});

describe("AdditionalEmailsField: foco", () => {
  it("al agregar una fila el foco pasa a su campo de inmediato", () => {
    render(<Harness initial={["a@example.com"]} />);
    fireEvent.click(screen.getByRole("button", { name: /Agregar correo/ }));
    expect(screen.getByLabelText("Correo adicional 2")).toHaveFocus();
  });
});
