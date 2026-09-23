import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight, CheckCircle2, XCircle } from "lucide-react";
import { STATUS_LABELS, VALID_TRANSITIONS, WORKFLOW_STATUSES, WorkflowStatus, getPhaseIndex } from "@/lib/workflow-status";
import { StatusChangeDialog } from "./StatusChangeDialog";

interface RequestStatusActionsProps {
  currentStatus: string;
  /** Se llama con (nuevoEstado, nota?) tras confirmar la transición en el diálogo. */
  onChange: (status: string, note?: string) => void;
}

/**
 * Botones de transición de estado, genéricos sobre el mapa VALID_TRANSITIONS de 17 estados.
 * Compartido por RequestDetailSheet/RequestsTable y ServiceFormDialog/ServicesSection, ya que
 * Solicitud y Servicio comparten exactamente el mismo flujo (WorkflowStatus).
 */
export function RequestStatusActions({ currentStatus, onChange }: RequestStatusActionsProps) {
  const [pendingStatus, setPendingStatus] = useState<WorkflowStatus | null>(null);

  const allowed = (VALID_TRANSITIONS[currentStatus] ?? []).filter((s) => s !== "CANCELADA") as WorkflowStatus[];
  const isTerminal = currentStatus === "VENDIDA";
  const isCancelled = currentStatus === "CANCELADA";
  const currentPhase = getPhaseIndex(currentStatus);

  const handleConfirm = (note?: string) => {
    if (!pendingStatus) return;
    onChange(pendingStatus, note);
    setPendingStatus(null);
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
            onClick={() => setPendingStatus(nextStatus)}
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
          onClick={() => setPendingStatus("CANCELADA")}
          variant="ghost"
          className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 gap-2 font-bold text-xs uppercase tracking-wider ml-auto"
        >
          <XCircle className="w-4 h-4" />
          Cancelar
        </Button>
      )}

      <StatusChangeDialog
        open={!!pendingStatus}
        onOpenChange={(open) => { if (!open) setPendingStatus(null); }}
        targetStatus={pendingStatus}
        onConfirm={handleConfirm}
      />
    </div>
  );
}
