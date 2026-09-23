import React, { useEffect, useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { STATUS_LABELS, WorkflowStatus } from "@/lib/workflow-status";

interface StatusChangeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  targetStatus: WorkflowStatus | null;
  onConfirm: (note?: string) => void;
}

/**
 * Diálogo compartido para confirmar cualquier transición del flujo de 17 estados (Solicitud
 * y Servicio), con una nota de contexto — obligatoria solo al cancelar, opcional en el resto.
 * Antes, cada cambio de estado pasaba con un solo clic sin dejar ningún rastro humano de
 * cómo/por qué pasó (más allá del "Cambio de estado: X -> Y" automático de la Bitácora) — el
 * contexto real (ej. "proveedor confirmó por teléfono, código ABC123") quedaba en WhatsApp o
 * en la cabeza de quien lo hizo, invisible para el resto del equipo.
 */
export function StatusChangeDialog({ open, onOpenChange, targetStatus, onConfirm }: StatusChangeDialogProps) {
  const [note, setNote] = useState("");
  const isCancel = targetStatus === "CANCELADA";

  useEffect(() => {
    if (!open) setNote("");
  }, [open]);

  const handleConfirm = () => {
    if (isCancel && !note.trim()) return;
    onConfirm(note.trim() || undefined);
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {isCancel
              ? "¿Cancelar esta solicitud/servicio?"
              : `Cambiar estado a "${targetStatus ? STATUS_LABELS[targetStatus] : ""}"`}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {isCancel
              ? "Esta acción no se puede deshacer. Indicá el motivo de la cancelación (obligatorio)."
              : "Dejá una nota para el equipo sobre este cambio (opcional) — por ejemplo, cómo se confirmó, o cualquier detalle que necesite saber quien siga con esta solicitud."}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <Textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder={
            isCancel
              ? "Ej: El cliente desistió del viaje por motivos personales"
              : "Ej: Proveedor confirmó por teléfono, código ABC123 (opcional)"
          }
          className="min-h-[80px]"
          maxLength={isCancel ? 1000 : 500}
        />
        <AlertDialogFooter>
          <AlertDialogCancel>Volver</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={isCancel && !note.trim()}
            className={isCancel ? "bg-rose-600 hover:bg-rose-700" : ""}
          >
            {isCancel ? "Confirmar cancelación" : "Confirmar cambio"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
