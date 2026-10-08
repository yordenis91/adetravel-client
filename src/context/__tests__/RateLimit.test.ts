import { describe, it, expect, vi, afterEach } from "vitest";
import { ApiError, api, setApiEventHandlers } from "@/lib/api";
import { isTransient, withRetry } from "@/context/AuthContext";

// Fase 3, defecto D2: un 429 (límite de peticiones) no debe cerrar la sesión.

afterEach(() => {
  setApiEventHandlers({});
  vi.restoreAllMocks();
});

describe("withRetry", () => {
  it("reintenta ante 429, 5xx y fallos de red, y devuelve el primer éxito", async () => {
    const fn = vi.fn()
      .mockRejectedValueOnce(new ApiError(429, '{"code":"RATE_LIMIT"}'))
      .mockRejectedValueOnce(new ApiError(502, "Bad Gateway"))
      .mockRejectedValueOnce(new TypeError("Failed to fetch"))
      .mockResolvedValue({ id: "u1" });
    await expect(withRetry(fn, [0, 0, 0])).resolves.toEqual({ id: "u1" });
    expect(fn).toHaveBeenCalledTimes(4);
  });

  it("no reintenta una sesión inválida (401) ni un permiso denegado (403)", async () => {
    for (const status of [401, 403]) {
      const fn = vi.fn().mockRejectedValue(new ApiError(status, "{}"));
      await expect(withRetry(fn, [0, 0])).rejects.toBeInstanceOf(ApiError);
      expect(fn).toHaveBeenCalledTimes(1);
    }
  });

  it("se rinde tras agotar los reintentos", async () => {
    const fn = vi.fn().mockRejectedValue(new ApiError(429, "{}"));
    await expect(withRetry(fn, [0, 0])).rejects.toBeInstanceOf(ApiError);
    expect(fn).toHaveBeenCalledTimes(3);
    expect(isTransient(new ApiError(429, "{}"))).toBe(true);
  });
});

describe("respuesta 429 de la API", () => {
  it("avisa con onRateLimited y no llama a onUnauthorized", async () => {
    const onUnauthorized = vi.fn();
    const onRateLimited = vi.fn();
    setApiEventHandlers({ onUnauthorized, onRateLimited });
    vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response('{"error":"Demasiadas peticiones"}', { status: 429 }));

    await expect(api.get("/auth/me")).rejects.toMatchObject({ status: 429 });
    expect(onRateLimited).toHaveBeenCalledTimes(1);
    expect(onUnauthorized).not.toHaveBeenCalled();
  });
});
