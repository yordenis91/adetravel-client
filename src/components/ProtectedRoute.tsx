import { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { AlertCircle } from "lucide-react";

interface Props {
  children: ReactNode;
  allowedRoles?: string[];
  /** Permiso granular requerido (ver src/config/permissions.ts en el backend). */
  requiredPermission?: string;
}

export function ProtectedRoute({ children, allowedRoles, requiredPermission }: Props) {
  const { isAuthenticated, isLoading, user, hasPermission } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0F1E3C]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-[#C9A84C] border-t-transparent rounded-full animate-spin" />
          <p className="text-white/60 text-sm font-manrope">Verificando sesión...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth/login" replace state={{ from: location }} />;
  }

  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  if (requiredPermission && !hasPermission(requiredPermission)) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-6 text-center">
        <div className="w-16 h-16 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center mb-4">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-playfair font-bold text-navy mb-2">Acceso Denegado</h2>
        <p className="text-slate-600 max-w-md mb-6">
          No tienes permisos para acceder a esta sección. Contacta a un administrador si crees que es un error.
        </p>
        <button
          onClick={() => (window.location.href = "/dashboard")}
          className="bg-navy hover:bg-navy-dark text-white font-bold py-2 px-6 rounded-xl transition-all"
        >
          Volver al Dashboard
        </button>
      </div>
    );
  }

  return <>{children}</>;
}
