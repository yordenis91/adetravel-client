import { LockKeyhole } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";

/** Pantalla para una cuenta autenticada que no tiene ningún permiso asignado. */
export function NoAccess() {
  const { user, logout } = useAuth();

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center px-6">
      <div className="w-14 h-14 rounded-full bg-amber-50 flex items-center justify-center">
        <LockKeyhole className="w-7 h-7 text-amber-600" />
      </div>
      <h1 className="text-2xl font-playfair font-bold text-navy">Tu cuenta aún no tiene acceso</h1>
      <p className="text-muted-foreground text-sm max-w-md">
        Iniciaste sesión{user?.email ? ` como ${user.email}` : ""}, pero todavía no tienes permisos asignados.
        Pide a un administrador de AdeTravel que te asigne un rol o permisos y vuelve a entrar.
      </p>
      <Button variant="outline" onClick={logout}>
        Cerrar sesión
      </Button>
    </div>
  );
}
