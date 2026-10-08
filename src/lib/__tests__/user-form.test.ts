import { describe, it, expect } from "vitest";
import { validateUserForm, passwordPolicyIssue } from "../user-form";

describe("validateUserForm", () => {
  it("exige nombre, correo válido y contraseña con la política de la API al crear", () => {
    expect(validateUserForm({ fullName: " ", email: "ana", password: "corta" })).toEqual({
      fullName: "El nombre es obligatorio",
      email: "Introduce un correo válido",
      password: "La contraseña debe tener al menos 8 caracteres",
    });
    expect(validateUserForm({ fullName: "Ana", email: "ana@example.com", password: "Segura#2026" })).toEqual({});
  });

  it("en edición la contraseña vacía es válida, pero una escrita debe cumplir la política", () => {
    const base = { fullName: "Ana", email: "ana@example.com" };
    expect(validateUserForm({ ...base, password: "" }, { passwordOptional: true })).toEqual({});
    expect(validateUserForm({ ...base, password: "sinmayuscula1!" }, { passwordOptional: true })).toEqual({
      password: "La contraseña debe incluir al menos una letra mayúscula",
    });
  });

  it("devuelve el primer requisito que falla, en el mismo orden que la API", () => {
    expect(passwordPolicyIssue("Abcdefgh")).toBe("La contraseña debe incluir al menos un número");
    expect(passwordPolicyIssue("Abcdefg1")).toBe("La contraseña debe incluir al menos un carácter especial (!@#$%^&*)");
    expect(passwordPolicyIssue("Abcdef1!")).toBeNull();
  });
});
