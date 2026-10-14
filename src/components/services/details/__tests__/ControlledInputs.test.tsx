import React from "react";
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { FieldValues, FormProvider, useForm } from "react-hook-form";
import { api } from "@/lib/api";
import { SERVICE_DETAIL_FIELDS, getDefaultDetails } from "..";
import { SERVICE_TYPES, ServiceType } from "@/types/service";

// Los valores por defecto de cada tipo no incluyen los campos opcionales (pasaporte, correo, notas…).
// Antes esos inputs nacían sin valor y React avisaba "changing an uncontrolled input to be controlled"
// al escribir o al prellenarse desde el cliente. Ahora todos los inputs son siempre controlados.

let formRef: ReturnType<typeof useForm<FieldValues>>;
function Harness({ type }: { type: ServiceType }) {
  formRef = useForm<FieldValues>({ defaultValues: { details: getDefaultDetails(type) } });
  const Fields = SERVICE_DETAIL_FIELDS[type];
  return (
    <FormProvider {...formRef}>
      <Fields control={formRef.control} />
    </FormProvider>
  );
}

const renderType = (type: ServiceType) =>
  render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      <Harness type={type} />
    </QueryClientProvider>
  );

const controlWarnings = (spy: ReturnType<typeof vi.spyOn>) =>
  spy.mock.calls.map((c: unknown[]) => String(c[0])).filter((m: string) => /controlled|uncontrolled|NaN/i.test(m));

afterEach(() => vi.restoreAllMocks());

describe.each([...SERVICE_TYPES] as ServiceType[])("%s: inputs siempre controlados", (type) => {
  it("escribir en cualquier campo de texto no dispara avisos de React", async () => {
    vi.spyOn(api, "get").mockResolvedValue({ data: [] } as never);
    const errors = vi.spyOn(console, "error").mockImplementation(() => {});
    renderType(type);

    const inputs = Array.from(document.querySelectorAll<HTMLInputElement>("input")).filter(
      (i) => ["text", "email", "tel", ""].includes(i.type) && !i.readOnly && !i.disabled && i.getAttribute("role") !== "combobox"
    );
    for (const input of inputs) await userEvent.type(input, "x");

    expect(controlWarnings(errors)).toEqual([]);
  });

  it("los campos opcionales que no están en los valores por defecto arrancan vacíos y controlados", () => {
    const errors = vi.spyOn(console, "error").mockImplementation(() => {});
    vi.spyOn(api, "get").mockResolvedValue({ data: [] } as never);
    renderType(type);
    for (const input of Array.from(document.querySelectorAll<HTMLInputElement>("input"))) {
      expect(input.value === undefined || input.value === null).toBe(false);
    }
    expect(controlWarnings(errors)).toEqual([]);
  });
});

describe("prellenado de un campo opcional (el caso del aviso)", () => {
  it("Seguro: poner el pasaporte desde la ficha del cliente no avisa", async () => {
    vi.spyOn(api, "get").mockResolvedValue({ data: [] } as never);
    const errors = vi.spyOn(console, "error").mockImplementation(() => {});
    renderType("SEGURO");
    formRef.setValue("details.passportNumber", "P123");
    formRef.setValue("details.rut", "15.345.666-K");
    formRef.setValue("details.email", "ana@example.com");
    expect(await screen.findByDisplayValue("P123")).toBeInTheDocument();
    expect(controlWarnings(errors)).toEqual([]);
  });
});
