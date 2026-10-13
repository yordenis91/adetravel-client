import { describe, it, expect } from "vitest";
import { buildWhatsAppUrl, normalizeWhatsAppPhone, whatsAppMessages } from "../whatsapp";

describe("normalizeWhatsAppPhone", () => {
  it.each([
    ["+56 9 1234 5678", "56912345678"],
    ["+56912345678", "56912345678"],
    ["0056912345678", "56912345678"],
    ["(+53) 5555-1234", "5355551234"],
    ["912345678", "56912345678"], // móvil chileno sin prefijo
    ["9 1234 5678", "56912345678"],
    ["56912345678", "56912345678"], // ya trae el país
    ["+1 (305) 555-0100", "13055550100"],
  ])("%s -> %s", (input, expected) => {
    expect(normalizeWhatsAppPhone(input)).toBe(expected);
  });

  it.each([[""], ["   "], [null], [undefined], ["abc"], ["55551234"], ["12345"], ["+12"], ["1234567890123456"]])(
    "%s -> null (no se adivina el país)",
    (input) => {
      expect(normalizeWhatsAppPhone(input as string | null | undefined)).toBeNull();
    }
  );
});

describe("buildWhatsAppUrl", () => {
  it("arma el enlace wa.me con el mensaje codificado", () => {
    expect(buildWhatsAppUrl("+56 9 1234 5678", "Hola María, cotización COT-1 & más")).toBe(
      "https://wa.me/56912345678?text=Hola%20Mar%C3%ADa%2C%20cotizaci%C3%B3n%20COT-1%20%26%20m%C3%A1s"
    );
  });
  it("sin mensaje no añade ?text", () => {
    expect(buildWhatsAppUrl("+56912345678")).toBe("https://wa.me/56912345678");
  });
  it("devuelve null si el teléfono no sirve", () => {
    expect(buildWhatsAppUrl("1234", "hola")).toBeNull();
  });
});

describe("whatsAppMessages", () => {
  it("incluye el nombre y el número de documento", () => {
    expect(whatsAppMessages.client("Ana")).toBe("Hola Ana, le escribo desde la agencia.");
    expect(whatsAppMessages.quotation("Ana", "COT-0012")).toContain("COT-0012");
    expect(whatsAppMessages.voucher("Ana", "VOU-7")).toContain("VOU-7");
  });
  it("sin nombre no deja espacios raros", () => {
    expect(whatsAppMessages.client(undefined)).toBe("Hola, le escribo desde la agencia.");
  });
});
