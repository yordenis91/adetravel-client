// Validación del formulario de usuarios con los mismos mensajes que la API, mostrada bajo cada campo
// como en el resto de formularios (en lugar de los avisos nativos del navegador).

export type UserFormErrors = Partial<Record<"fullName" | "email" | "password", string>>;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Misma política que la API (src/utils/password-policy.ts): primer requisito que falla o null. */
export function passwordPolicyIssue(password: string): string | null {
  if (password.length < 8) return "La contraseña debe tener al menos 8 caracteres";
  if (!/[A-Z]/.test(password)) return "La contraseña debe incluir al menos una letra mayúscula";
  if (!/[0-9]/.test(password)) return "La contraseña debe incluir al menos un número";
  if (!/[!@#$%^&*]/.test(password)) return "La contraseña debe incluir al menos un carácter especial (!@#$%^&*)";
  return null;
}

/**
 * Valida nombre, correo y contraseña. Con `passwordOptional` (edición) una contraseña vacía es válida,
 * pero si se escribe una debe cumplir la política.
 */
export function validateUserForm(
  values: { fullName: string; email: string; password: string },
  { passwordOptional = false } = {}
): UserFormErrors {
  const errors: UserFormErrors = {};
  if (!values.fullName.trim()) errors.fullName = "El nombre es obligatorio";
  if (!values.email.trim()) errors.email = "El correo es obligatorio";
  else if (!EMAIL_RE.test(values.email.trim())) errors.email = "Introduce un correo válido";
  if (!(passwordOptional && values.password === "")) {
    const issue = passwordPolicyIssue(values.password);
    if (issue) errors.password = issue;
  }
  return errors;
}
