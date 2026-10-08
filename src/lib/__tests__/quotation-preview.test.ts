import { afterEach, describe, expect, it, vi } from "vitest";

async function loadPreview() {
  vi.resetModules();
  return (await import("@/hooks/useQuotations")).openQuotationPreview;
}

describe("openQuotationPreview", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it("usa VITE_API_URL cuando está definida", async () => {
    vi.stubEnv("VITE_API_URL", "https://api.ejemplo.cl/api");
    const open = vi.spyOn(window, "open").mockReturnValue(null);
    (await loadPreview())("q1");
    expect(open).toHaveBeenCalledWith("https://api.ejemplo.cl/api/quotations/q1/preview", "_blank");
  });

  it("sin VITE_API_URL usa el mismo respaldo que el resto del cliente, nunca 'undefined'", async () => {
    vi.stubEnv("VITE_API_URL", "");
    const open = vi.spyOn(window, "open").mockReturnValue(null);
    (await loadPreview())("q1");
    const url = open.mock.calls[0][0] as string;
    expect(url).not.toContain("undefined");
    expect(url).toMatch(/\/api\/quotations\/q1\/preview$/);
  });
});
