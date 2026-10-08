import React from "react";
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { useForm } from "react-hook-form";
import { Form, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { Combobox } from "@/components/ui/combobox";

// En los formularios, el Combobox no estaba asociado a su FormLabel: el lector de pantalla
// anunciaba un botón sin nombre (prueba de formularios en Chromium, 2026-10-08).
function Harness() {
  const form = useForm({ defaultValues: { clientId: "" } });
  return (
    <Form {...form}>
      <FormField
        control={form.control}
        name="clientId"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Cliente</FormLabel>
            <Combobox options={[]} value={field.value} onChange={field.onChange} placeholder="Selecciona un cliente" />
          </FormItem>
        )}
      />
    </Form>
  );
}

describe("Combobox dentro de un FormItem", () => {
  it("queda asociado a su etiqueta", () => {
    render(<Harness />);
    expect(screen.getByRole("combobox", { name: "Cliente" })).toBeTruthy();
  });
});
