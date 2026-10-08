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

// Ancho mínimo de cada paso: en escritorio las 16 etapas reparten el ancho disponible y caben sin
// desplazamiento; en pantallas estrechas se desplaza en horizontal y se centra la etapa actual.
const MIN_STEP_PX = 56;
const gridColumns = `repeat(${steps.length}, minmax(${MIN_STEP_PX}px, 1fr))`;

export function RequestStatusFlow({ currentStatus }: RequestStatusFlowProps) {
  const isCancelled = currentStatus === "CANCELADA";
  const currentIndex = steps.findIndex((s) => s.id === currentStatus);
  const scrollRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const container = scrollRef.current;
    if (!container || currentIndex < 0 || container.scrollWidth <= container.clientWidth) return;
    const stepWidth = container.scrollWidth / steps.length;
    container.scrollLeft = Math.max(0, stepWidth * (currentIndex + 0.5) - container.clientWidth / 2);
  }, [currentIndex]);

  // La línea va del centro del primer paso al centro del último.
  const half = `(100% / ${steps.length * 2})`;
  const progress = currentIndex > 0 ? currentIndex / (steps.length - 1) : 0;

  return (
    <div className="relative w-full py-6">
      {isCancelled && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/60 backdrop-blur-[1px]">
          <div className="px-6 py-2 bg-rose-600 text-white font-bold rounded-full shadow-lg shadow-rose-200 rotate-[-5deg] border-2 border-white text-xs uppercase tracking-widest">
            SOLICITUD CANCELADA
          </div>
        </div>
      )}

      <div
        ref={scrollRef}
        data-testid="status-flow-scroll"
        className={cn("overflow-x-auto pb-1 sidebar-scroll", isCancelled && "opacity-40 grayscale")}
      >
        <div className="min-w-full" style={{ width: "max-content", minWidth: "100%" }}>
          {/* Cabecera de fases, alineada con las columnas de sus pasos */}
          <div className="grid mb-2" style={{ gridTemplateColumns: gridColumns }}>
            {STATUS_PHASES.map((phase) => (
              <div
                key={phase.label}
                className="text-center text-[9px] font-bold uppercase tracking-widest text-muted-foreground/70 border-b-2 border-slate-100 pb-1 mx-0.5"
                style={{ gridColumn: `span ${phase.statuses.length}` }}
              >
                {phase.label}
              </div>
            ))}
          </div>

          <div className="relative">
            {/* Línea de conexión y avance */}
            <div aria-hidden className="absolute top-4 h-0.5 bg-slate-100 z-0" style={{ left: `calc${half}`, right: `calc${half}` }} />
            <div
              aria-hidden
              className="absolute top-4 h-0.5 bg-primary transition-all duration-500 z-0"
              style={{ left: `calc${half}`, width: `calc((100% - 2 * ${half}) * ${progress})` }}
            />

            <ol className="grid relative" style={{ gridTemplateColumns: gridColumns }} aria-label="Etapas de la solicitud">
              {steps.map((step, index) => {
                const isPast = currentIndex >= 0 && index < currentIndex;
                const isCurrent = index === currentIndex;

                return (
                  <li
                    key={step.id}
                    className="relative z-10 flex flex-col items-center gap-2"
                    aria-current={isCurrent ? "step" : undefined}
                  >
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
                      "text-[9px] font-bold uppercase tracking-wide text-center leading-tight px-0.5 transition-colors duration-300 hyphens-auto",
                      isCurrent ? "text-navy" : "text-muted-foreground"
                    )}>
                      {step.label}
                    </span>
                  </li>
                );
              })}
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}
