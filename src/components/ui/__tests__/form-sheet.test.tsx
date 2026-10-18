import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { FormSheet, FormSheetBody } from "../form-sheet";

function Harness({ onOpenChange = () => {}, restoreKey }: { onOpenChange?: (o: boolean) => void; restoreKey?: unknown }) {
  const [text, setText] = useState("");
  return (
    <FormSheet open onOpenChange={onOpenChange} title="Editar Cliente" restoreKey={restoreKey}>
      <FormSheetBody>
        <input aria-label="nombre" value={text} onChange={(e) => setText(e.target.value)} />
      </FormSheetBody>
    </FormSheet>
  );
}

describe("FormSheet: minimizar y maximizar", () => {
  it("minimiza a una barra y conserva lo escrito al restaurar", () => {
    render(<Harness />);
    fireEvent.change(screen.getByLabelText("nombre"), { target: { value: "Lucía" } });

    fireEvent.click(screen.getByRole("button", { name: "Minimizar formulario" }));
    expect(screen.queryByLabelText("nombre")).toBeNull();
    const bar = screen.getByRole("region", { name: "Formulario minimizado" });
    expect(bar).toHaveTextContent("Editar Cliente");

    fireEvent.click(screen.getByRole("button", { name: "Restaurar formulario" }));
    expect(screen.queryByRole("region", { name: "Formulario minimizado" })).toBeNull();
    expect((screen.getByLabelText("nombre") as HTMLInputElement).value).toBe("Lucía");
  });

  it("cerrar desde la barra avisa al padre", () => {
    const onOpenChange = vi.fn();
    render(<Harness onOpenChange={onOpenChange} />);
    fireEvent.click(screen.getByRole("button", { name: "Minimizar formulario" }));
    fireEvent.click(screen.getByRole("button", { name: "Cerrar formulario" }));
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("alterna maximizar y restaurar el tamaño", () => {
    render(<Harness />);
    const dialog = screen.getByRole("dialog");
    expect(dialog.className).not.toContain("min(1100px,100vw)");
    fireEvent.click(screen.getByRole("button", { name: "Maximizar formulario" }));
    expect(screen.getByRole("dialog").className).toContain("min(1100px,100vw)");
    fireEvent.click(screen.getByRole("button", { name: "Restaurar tamaño" }));
    expect(screen.getByRole("dialog").className).not.toContain("min(1100px,100vw)");
  });

  it("se vuelve a mostrar si el padre carga otro registro mientras estaba minimizado", () => {
    const { rerender } = render(<Harness restoreKey="a" />);
    fireEvent.click(screen.getByRole("button", { name: "Minimizar formulario" }));
    expect(screen.queryByRole("dialog")).toBeNull();
    rerender(<Harness restoreKey="b" />);
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("al cerrarse el formulario no queda barra ni estado de ventana", () => {
    function Wrapper() {
      const [open, setOpen] = useState(true);
      return (
        <>
          <button onClick={() => setOpen((o) => !o)}>alternar</button>
          <FormSheet open={open} onOpenChange={setOpen} title="Nuevo">
            <FormSheetBody>contenido</FormSheetBody>
          </FormSheet>
        </>
      );
    }
    render(<Wrapper />);
    fireEvent.click(screen.getByRole("button", { name: "Minimizar formulario" }));
    expect(screen.getByRole("region", { name: "Formulario minimizado" })).toBeInTheDocument();
    fireEvent.click(screen.getByText("alternar")); // cierra
    expect(screen.queryByRole("region", { name: "Formulario minimizado" })).toBeNull();
    fireEvent.click(screen.getByText("alternar")); // abre de nuevo: debe verse el formulario, no la barra
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("dos formularios minimizados se apilan sin taparse", () => {
    render(
      <>
        <FormSheet open onOpenChange={() => {}} title="Primero">
          <FormSheetBody>a</FormSheetBody>
        </FormSheet>
        <FormSheet open onOpenChange={() => {}} title="Segundo">
          <FormSheetBody>b</FormSheetBody>
        </FormSheet>
      </>,
    );
    // Radix deja el segundo panel como el único accesible; minimizamos uno por uno.
    fireEvent.click(screen.getAllByRole("button", { name: "Minimizar formulario", hidden: true })[0]);
    fireEvent.click(screen.getAllByRole("button", { name: "Minimizar formulario", hidden: true })[0]);
    const slots = screen
      .getAllByRole("region", { name: "Formulario minimizado" })
      .map((el) => (el as HTMLElement).style.getPropertyValue("--dock-slot"));
    expect(slots.sort()).toEqual(["0", "1"]);
  });
});
