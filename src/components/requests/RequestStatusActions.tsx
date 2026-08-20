import React, { useState } from "react";
import { Button } from "@/components/ui/button";
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
import { ArrowLeft, ArrowRight, CheckCircle2, XCircle } from "lucide-react";
import { STATUS_LABELS, VALID_TRANSITIONS, WORKFLOW_STATUSES, WorkflowStatus, getPhaseIndex } from "@/lib/workflow-status";

interface RequestStatusActionsProps {
  currentStatus: string;
  /** Se llama con (nuevoEstado, motivoCancelacion?) tras confirmar la acción. */
  onChange: (status: string, cancellationReason?: string) => void;
}

/**
 * Botones de transición de estado, genéricos sobre el mapa VALID_TRANSITIONS de 17 estados.
 * Compartido por RequestDetailSheet/RequestsTable y ServiceFormDialog/ServicesSection, ya que
 * Solicitud y Servicio comparten exactamente el mismo flujo (WorkflowStatus).
 */
export function RequestStatusActions({ currentStatus, onChange }: RequestStatusActionsProps) {
  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancellationReason, setCancellationReason] = useState("");

  const allowed = (VALID_TRANSITIONS[currentStatus] ?? []).filter((s) => s !== "CANCELADA") as WorkflowStatus[];
  const isTerminal = currentStatus === "VENDIDA";
  const isCancelled = currentStatus === "CANCELADA";
  const currentPhase = getPhaseIndex(currentStatus);

  const handleConfirmCancel = () => {
    if (!cancellationReason.trim()) return;
    onChange("CANCELADA", cancellationReason.trim());
    setCancelOpen(false);
    setCancellationReason("");
  };

  if (isTerminal) {
    return (
      <div className="flex items-center gap-2 px-4 py-2 bg-purple-50 text-purple-700 rounded-full font-bold text-xs uppercase tracking-widest w-fit">
        <CheckCircle2 className="w-4 h-4" />
        Vendida
      </div>
    );
  }

  return (
    <div className="flex flex-wrap gap-2 items-center">
      {allowed.map((nextStatus) => {
        const nextPhase = getPhaseIndex(nextStatus);
        const isBackward = nextPhase < currentPhase || (nextPhase === currentPhase && WORKFLOW_STATUSES.indexOf(nextStatus) < WORKFLOW_STATUSES.indexOf(currentStatus as WorkflowStatus));
        const isFinal = nextStatus === "VOUCHER_ENTREGADO" || nextStatus === "VENDIDA";

        return (
          <Button
            key={nextStatus}
            type="button"
            onClick={() => onChange(nextStatus)}
            variant={isBackward ? "outline" : "default"}
            className={
              isBackward
                ? "gap-2 font-bold text-xs uppercase tracking-wider"
                : "bg-emerald-500 hover:bg-emerald-600 text-white gap-2 font-bold text-xs uppercase tracking-wider"
            }
          >
            {isBackward ? <ArrowLeft className="w-4 h-4" /> : isFinal ? <CheckCircle2 className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
            {STATUS_LABELS[nextStatus]}
          </Button>
        );
      })}

      {!isCancelled && (
        <Button
          type="button"
          onClick={() => setCancelOpen(true)}
          variant="ghost"
          className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 gap-2 font-bold text-xs uppercase tracking-wider ml-auto"
        >
          <XCircle className="w-4 h-4" />
          Cancelar
        </Button>
      )}

      <AlertDialog open={cancelOpen} onOpenChange={(open) => { setCancelOpen(open); if (!open) setCancellationReason(""); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Cancelar esta solicitud/servicio?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Indica el motivo de la cancelación (obligatorio).
            </AlertDialogDescription>
          </AlertDialogHeader>
          <Textarea
            value={cancellationReason}
            onChange={(e) => setCancellationReason(e.target.value)}
            placeholder="Ej: El cliente desistió del viaje por motivos personales"
            className="min-h-[80px]"
          />
          <AlertDialogFooter>
            <AlertDialogCancel>Volver</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmCancel}
              disabled={!cancellationReason.trim()}
              className="bg-rose-600 hover:bg-rose-700"
            >
              Confirmar cancelación
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
