import { describe, it, expect, vi, afterEach } from "vitest";
import {
  getErrorMessage,
  extractArrayFromResponse,
  extractTotalFromResponse,
  api,
} from "../api";

describe("getErrorMessage", () => {
  // Este cliente usa fetch, no axios: un error.response?.data?.message nunca
  // existe aquí. getErrorMessage existe precisamente para reemplazar ese
  // anti-patrón (ver UsuariosPage/ExchangeTab, que lo usaban antes del fix).
  it("extrae el campo 'error' de un cuerpo JSON {error, code} del backend", () => {
    const err = new Error(JSON.stringify({ error: "RUT duplicado", code: "DUPLICATE_RUT" }));
    expect(getErrorMessage(err, "fallback")).toBe("RUT duplicado");
  });

  it("extrae el campo 'message' cuando el backend responde {message} en vez de {error}", () => {
    const err = new Error(JSON.stringify({ message: "Algo falló" }));
    expect(getErrorMessage(err, "fallback")).toBe("Algo falló");
  });

  it("devuelve el mensaje crudo si no es JSON pero es un Error con mensaje", () => {
    const err = new Error("texto plano de error");
    expect(getErrorMessage(err, "fallback")).toBe("texto plano de error");
  });

  it("devuelve el fallback si el error no es una instancia de Error", () => {
    expect(getErrorMessage("string cualquiera", "fallback")).toBe("fallback");
    expect(getErrorMessage(null, "fallback")).toBe("fallback");
    expect(getErrorMessage(undefined, "fallback")).toBe("fallback");
  });

  it("devuelve el fallback si el Error no tiene mensaje", () => {
    const err = new Error("");
    expect(getErrorMessage(err, "fallback")).toBe("fallback");
  });
});

describe("extractArrayFromResponse", () => {
  it("devuelve el array tal cual si la respuesta ya es un array", () => {
    expect(extractArrayFromResponse([1, 2, 3])).toEqual([1, 2, 3]);
  });

  it("extrae .data de una respuesta paginada { data, total, page, limit }", () => {
    expect(extractArrayFromResponse({ data: [1, 2], total: 2, page: 1, limit: 20 })).toEqual([1, 2]);
  });

  it("devuelve [] si la respuesta es null/undefined", () => {
    expect(extractArrayFromResponse(null as any)).toEqual([]);
    expect(extractArrayFromResponse(undefined as any)).toEqual([]);
  });
});

describe("extractTotalFromResponse", () => {
  it("devuelve .total cuando existe", () => {
    expect(extractTotalFromResponse({ data: [1], total: 42, page: 1, limit: 20 })).toBe(42);
  });

  it("devuelve el largo del array cuando la respuesta es un array plano", () => {
    expect(extractTotalFromResponse([1, 2, 3])).toBe(3);
  });
});

describe("api client (fetch wrapper)", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    localStorage.clear();
  });

  it("adjunta el Authorization header con el token de localStorage", async () => {
    localStorage.setItem("ade_token", "token-123");
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ data: { ok: true } }),
    });
    vi.stubGlobal("fetch", fetchMock);

    await api.get("/payments");

    const [, options] = fetchMock.mock.calls[0];
    expect(options.headers.Authorization).toBe("Bearer token-123");
  });

  it("usa el método PATCH para api.patch (regresión: editar pagos usaba PUT y siempre daba 404)", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ data: {} }) });
    vi.stubGlobal("fetch", fetchMock);

    await api.patch("/payments/p1", { amount: 100 });

    const [, options] = fetchMock.mock.calls[0];
    expect(options.method).toBe("PATCH");
  });

  it("lanza un Error con el cuerpo de la respuesta cuando el request falla", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      text: async () => JSON.stringify({ error: "No autorizado", code: "UNAUTHORIZED" }),
    });
    vi.stubGlobal("fetch", fetchMock);

    await expect(api.get("/payments")).rejects.toThrow(/No autorizado/);
  });
});
