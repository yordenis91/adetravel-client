import { ReactNode } from "react";
import { useAuth } from "@/context/AuthContext";

interface PermissionGuardProps {
  children: ReactNode;
  permission?: string | string[];
  /** "all" (por defecto) exige todos los permisos listados; "any" con al menos uno alcanza. */
  require?: "all" | "any";
  fallback?: ReactNode;
}

/** Renderiza `children` solo si el usuario tiene el/los permiso(s) indicado(s). */
export function PermissionGuard({ children, permission, require = "all", fallback = null }: PermissionGuardProps) {
  const { hasAllPermissions, hasAnyPermission } = useAuth();

  if (!permission) return <>{children}</>;

  const list = Array.isArray(permission) ? permission : [permission];
  const hasAccess = require === "any" ? hasAnyPermission(list) : hasAllPermissions(list);

  return hasAccess ? <>{children}</> : <>{fallback}</>;
}
