import { AlertTriangle, RotateCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getErrorMessage } from "@/lib/api";

interface ListErrorProps {
  error: unknown;
  onRetry: () => void;
  what?: string;
}

/**
 * Estado de error de una lista. Sin él, una lista que no pudo cargar mostraba "No se
 * encontraron…" y el usuario creía que no había datos (fase 3, defecto D3).
 */
export function ListError({ error, onRetry, what = "los datos" }: ListErrorProps) {
  return (
    <div role="alert" className="flex flex-col items-center justify-center gap-3 rounded-xl border border-red-100 bg-red-50 p-8 text-center">
      <AlertTriangle className="w-6 h-6 text-red-600" aria-hidden="true" />
      <div>
        <p className="font-semibold text-red-800">No se pudieron cargar {what}.</p>
        <p className="text-xs text-red-700">{getErrorMessage(error, "Error de conexión con el servidor.")}</p>
      </div>
      <Button variant="outline" size="sm" onClick={onRetry} className="gap-2">
        <RotateCw className="w-4 h-4" aria-hidden="true" />
        Reintentar
      </Button>
    </div>
  );
}
