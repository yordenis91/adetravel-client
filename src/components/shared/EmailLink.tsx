import { cn } from "@/lib/utils";
import { buildMailtoUrl } from "@/lib/mailto";

interface EmailLinkProps {
  email?: string | null;
  className?: string;
  /** Texto alternativo cuando no hay correo (por defecto no se pinta nada). */
  fallback?: React.ReactNode;
}

/**
 * Correo electrónico que abre el programa de correo del usuario (`mailto:`). Si el valor no parece
 * un correo se muestra como texto, sin enlace. No dispara el clic de la fila o tarjeta que lo contiene.
 */
export function EmailLink({ email, className, fallback = null }: EmailLinkProps) {
  const value = email?.trim();
  if (!value) return <>{fallback}</>;
  const href = buildMailtoUrl(value);
  if (!href) return <span className={className}>{value}</span>;
  return (
    <a
      href={href}
      title={`Escribir a ${value}`}
      onClick={(e) => e.stopPropagation()}
      className={cn("break-all underline-offset-2 transition-colors hover:text-primary hover:underline focus-visible:rounded-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary", className)}
    >
      {value}
    </a>
  );
}
