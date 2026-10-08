import { describe, it, expect } from "vitest";
import { scrubEvent, scrubBreadcrumb, REDACTED } from "../sentry-scrub";

describe("filtrado de Sentry en el navegador", () => {
  it("deja de la petición solo la URL sin query y el método, y del usuario solo el id", () => {
    const event: any = scrubEvent({
      message: "Falló el envío a ana@b.cl",
      request: { url: "https://app/clientes?search=ana@b.cl", method: "GET", headers: { Authorization: "Bearer x" }, data: { email: "a@b.cl" } },
      user: { id: "u1", email: "ana@b.cl", ip_address: "1.2.3.4" },
      exception: { values: [{ value: "RUT 12.345.678-9 inválido" }] },
      extra: { form: { rut: "12345678-9", amount: 10 } },
    } as any);
    expect(event.request).toEqual({ url: "https://app/clientes", method: "GET" });
    expect(event.user).toEqual({ id: "u1" });
    expect(event.message).toBe("Falló el envío a [correo]");
    expect(event.exception.values[0].value).toBe("RUT [rut] inválido");
    expect(event.extra).toEqual({ form: { rut: REDACTED, amount: 10 } });
  });

  it("las migas de fetch y navegación van sin query, y las de consola enmascaradas", () => {
    expect(scrubBreadcrumb({ category: "fetch", data: { url: "https://api/x/clients?search=ana", method: "GET", status_code: 200 } })).toEqual({
      category: "fetch", data: { url: "https://api/x/clients", method: "GET", status_code: 200 },
    });
    expect(scrubBreadcrumb({ category: "navigation", data: { from: "/clientes?q=ana", to: "/solicitudes/1?tab=x" } }).data).toEqual({
      from: "/clientes", to: "/solicitudes/1",
    });
    expect(scrubBreadcrumb({ category: "console", message: "token Bearer abc.def para a@b.cl" }).message).toBe(
      "token Bearer [token] para [correo]"
    );
  });
});
