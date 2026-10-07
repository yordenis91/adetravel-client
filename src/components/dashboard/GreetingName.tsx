import { useAuth } from "@/context/AuthContext";

/** Primer nombre para el saludo del panel ("Ana María Pérez" → "Ana"); vacío si no hay nombre. */
export function firstName(fullName?: string | null): string {
  return (fullName ?? "").trim().split(/\s+/)[0] ?? "";
}

/** Texto de saludo con el nombre de la persona autenticada: ", Ana" o nada si no hay nombre. */
export function GreetingName() {
  const { user } = useAuth();
  const name = firstName(user?.fullName);
  return <>{name ? `, ${name}` : ""}</>;
}
