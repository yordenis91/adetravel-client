import React from "react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { STATUS_LABELS, STATUS_PHASES, WORKFLOW_STATUSES, WorkflowStatus } from "@/lib/workflow-status";

interface RequestStatusFlowProps {
  currentStatus: string;
}

// Los 16 estados "en progreso" (todo WORKFLOW_STATUSES salvo CANCELADA, que se muestra como
// overlay en vez de un paso más) agrupados por fase para la cabecera de grupos.
const steps: { id: WorkflowStatus; label: string }[] = WORKFLOW_STATUSES
  .filter((s) => s !== "CANCELADA")
  .map((id) => ({ id, label: STATUS_LABELS[id] }));

export function RequestStatusFlow({ currentStatus }: RequestStatusFlowProps) {
  const isCancelled = currentStatus === "CANCELADA";
  const currentIndex = steps.findIndex((s) => s.id === currentStatus);

  return (
    <div className="relative w-full py-6">
      {isCancelled && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/60 backdrop-blur-[1px]">
          <div className="px-6 py-2 bg-rose-600 text-white font-bold rounded-full shadow-lg shadow-rose-200 rotate-[-5deg] border-2 border-white text-xs uppercase tracking-widest">
            SOLICITUD CANCELADA
          </div>
        </div>
      )}

      <div className={cn("overflow-x-auto pb-1", isCancelled && "opacity-40 grayscale")}>
        {/* Cabecera de fases, alineada por cantidad de pasos de cada grupo */}
        <div className="flex min-w-max mb-2">
          {STATUS_PHASES.map((phase) => (
            <div
              key={phase.label}
              className="flex-shrink-0 text-center text-[9px] font-bold uppercase tracking-widest text-muted-foreground/70 border-b-2 border-slate-100 pb-1"
              style={{ width: `${phase.statuses.length * 88}px` }}
            >
              {phase.label}
            </div>
          ))}
        </div>

        <div className="flex items-center relative min-w-max px-1">
          {/* Connector Line */}
          <div className="absolute top-5 left-0 h-0.5 bg-slate-100 z-0" style={{ width: `${steps.length * 88}px` }} />
          <div
            className="absolute top-5 left-0 h-0.5 bg-primary transition-all duration-500 z-0"
            style={{ width: currentIndex >= 0 ? `${(currentIndex / (steps.length - 1)) * (steps.length * 88)}px` : "0px" }}
          />

          {steps.map((step, index) => {
            const isPast = currentIndex >= 0 && index < currentIndex;
            const isCurrent = index === currentIndex;

            return (
              <div key={step.id} className="relative z-10 flex flex-col items-center gap-2 flex-shrink-0" style={{ width: "88px" }}>
                <div className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all duration-300 bg-white",
                  isPast ? "bg-primary border-primary text-white" :
                  isCurrent ? "border-primary text-primary shadow-lg shadow-primary/20" :
                  "border-slate-200 text-slate-300"
                )}>
                  {isPast ? (
                    <Check className="w-4 h-4 stroke-[3px]" />
                  ) : isCurrent ? (
                    <motion.div
                      animate={{ scale: [1, 1.1, 1] }}
                      transition={{ repeat: Infinity, duration: 2 }}
                      className="flex items-center justify-center"
                    >
                      <span className="text-[10px] font-bold">{index + 1}</span>
                    </motion.div>
                  ) : (
                    <span className="text-[10px] font-bold">{index + 1}</span>
                  )}
                </div>
                <span className={cn(
                  "text-[9px] font-bold uppercase tracking-wide text-center leading-tight px-1 transition-colors duration-300",
                  isCurrent ? "text-navy" : "text-muted-foreground"
                )}>
                  {step.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
