import { beforeEach, describe, expect, it } from "vitest";
import { isChunkLoadError, shouldReloadForChunkError } from "../chunk-reload";

describe("isChunkLoadError", () => {
  it("reconoce los mensajes de módulo dinámico que no cargó (Firefox y Chrome)", () => {
    expect(isChunkLoadError(new TypeError("error loading dynamically imported module: https://x/assets/Dashboard-abc.js"))).toBe(true);
    expect(isChunkLoadError(new TypeError("Failed to fetch dynamically imported module: https://x/a.js"))).toBe(true);
    expect(isChunkLoadError(new Error("Importing a module script failed."))).toBe(true);
  });

  it("no confunde un error normal de la app con uno de chunk", () => {
    expect(isChunkLoadError(new Error("Cannot read properties of undefined"))).toBe(false);
    expect(isChunkLoadError(undefined)).toBe(false);
  });
});

describe("shouldReloadForChunkError", () => {
  beforeEach(() => sessionStorage.clear());

  it("permite una recarga y bloquea la siguiente dentro del enfriamiento (evita bucles)", () => {
    expect(shouldReloadForChunkError(1_000_000)).toBe(true);
    expect(shouldReloadForChunkError(1_005_000)).toBe(false);
  });

  it("vuelve a permitirla pasado el enfriamiento", () => {
    expect(shouldReloadForChunkError(1_000_000)).toBe(true);
    expect(shouldReloadForChunkError(1_031_000)).toBe(true);
  });
});
