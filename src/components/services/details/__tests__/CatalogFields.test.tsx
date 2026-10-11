import React from "react";
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Control, FieldValues, FormProvider, useForm } from "react-hook-form";
import { api } from "@/lib/api";
import { AlojamientoFields } from "../AlojamientoFields";
import { PasajeAereoFields } from "../PasajeAereoFields";

// Los campos que antes eran texto libre ahora sugieren desde los nomencladores, pero siguen
// guardando texto: lo ya guardado ("SCL", "Republica Doominicana") no se rompe.

const COUNTRIES = [
  { id: "c-es", name: "España", isActive: true },
  { id: "c-cl", name: "Chile", isActive: true },
];
const CITIES = [
  { id: "ci-1", name: "Madrid", countryId: "c-es", isActive: true },
  { id: "ci-2", name: "Santiago", countryId: "c-cl", isActive: true },
];

function mockCatalogs() {
  vi.spyOn(api, "get").mockImplementation(async (url: string) => {
    if (url.startsWith("/countries")) return { data: COUNTRIES };
    if (url.startsWith("/cities")) {
      const m = /countryId=([^&]+)/.exec(url);
      return { data: m ? CITIES.filter((c) => c.countryId === m[1]) : CITIES };
    }
    return { data: [] };
  });
}

let formRef: ReturnType<typeof useForm<FieldValues>>;
function Harness({ children, defaults }: { children: React.ReactNode; defaults?: FieldValues }) {
  formRef = useForm<FieldValues>({ defaultValues: defaults });
  return <FormProvider {...formRef}>{children}</FormProvider>;
}

function renderWith(ui: (control: Control<FieldValues>) => React.ReactNode, defaults?: FieldValues) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const Inner = () => ui(formRef.control);
  return render(
    <QueryClientProvider client={client}>
      <Harness defaults={defaults}><Inner /></Harness>
    </QueryClientProvider>
  );
}

afterEach(() => vi.restoreAllMocks());

describe("campos con nomencladores en servicios", () => {
  it("alojamiento: al cambiar el país se limpia la ciudad y el país elegido queda guardado", async () => {
    mockCatalogs();
    renderWith((control) => <AlojamientoFields control={control} />, {
      details: { rooms: [{ responsibleName: "", roomType: "DOBLE" }], hotelCountry: "Chile", hotelCity: "Santiago" },
    });
    const user = userEvent.setup();

    await user.click(screen.getByRole("combobox", { name: /^País/ }));
    await user.click(await screen.findByText("España"));

    await waitFor(() => expect(formRef.getValues("details.hotelCountry")).toBe("España"));
    expect(formRef.getValues("details.hotelCity")).toBe("");
  });

  it("alojamiento: acepta un país que no está en el catálogo (valor libre)", async () => {
    mockCatalogs();
    renderWith((control) => <AlojamientoFields control={control} />, {
      details: { rooms: [{ responsibleName: "", roomType: "DOBLE" }], hotelCountry: "Republica Doominicana" },
    });
    expect(await screen.findByRole("combobox", { name: /^País/ })).toHaveTextContent("Republica Doominicana");
  });

  it("pasaje aéreo: sugiere ciudades y conserva un código escrito a mano", async () => {
    mockCatalogs();
    renderWith((control) => <PasajeAereoFields control={control} />, { details: { origin: "SCL" } });
    const user = userEvent.setup();

    expect(screen.getByRole("combobox", { name: /^Origen/ })).toHaveTextContent("SCL");

    await user.click(screen.getByRole("combobox", { name: /^Destino/ }));
    await user.click(await screen.findByText("Madrid"));
    await waitFor(() => expect(formRef.getValues("details.destination")).toBe("Madrid"));
    expect(formRef.getValues("details.origin")).toBe("SCL");
  });
});
