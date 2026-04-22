import React from "react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { Check } from "lucide-react";

interface RequestStatusFlowProps {
  currentStatus: string;
}

const steps = [
  { id: "Recepcionada", label: "Recepcionada" },
  { id: "Cotizada", label: "Cotizada" },
  { id: "Confirmada", label: "Confirmada" },
  { id: "Vendida", label: "Vendida" },
];

export function RequestStatusFlow({ currentStatus }: RequestStatusFlowProps) {
  const isCancelled = currentStatus === "Cancelada";
  const currentIndex = steps.findIndex((s) => s.id === currentStatus);

  return (
    <div className="relative w-full py-8">
      {isCancelled && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/60 backdrop-blur-[1px]">
          <div className="px-6 py-2 bg-rose-600 text-white font-bold rounded-full shadow-lg shadow-rose-200 rotate-[-5deg] border-2 border-white text-xs uppercase tracking-widest">
            SOLICITUD CANCELADA
          </div>
        </div>
      )}

      <div className={cn("flex justify-between items-center relative", isCancelled && "opacity-40 grayscale")}>
        {/* Connector Line */}
        <div className="absolute top-1/2 left-0 w-full h-0.5 bg-slate-100 -translate-y-1/2 z-0" />
        <div 
          className="absolute top-1/2 left-0 h-0.5 bg-primary transition-all duration-500 -translate-y-1/2 z-0"
          style={{ width: currentIndex >= 0 ? `${(currentIndex / (steps.length - 1)) * 100}%` : '0%' }}
        />

        {steps.map((step, index) => {
          const isPast = currentIndex >= 0 && index < currentIndex;
          const isCurrent = index === currentIndex;
          const isFuture = index > currentIndex || currentIndex === -1;

          return (
            <div key={step.id} className="relative z-10 flex flex-col items-center gap-2">
              <div className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300",
                isPast ? "bg-primary border-primary text-white" : 
                isCurrent ? "bg-white border-primary text-primary shadow-lg shadow-primary/20" : 
                "bg-white border-slate-200 text-slate-300"
              )}>
                {isPast ? (
                  <Check className="w-5 h-5 stroke-[3px]" />
                ) : isCurrent ? (
                  <motion.div
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ repeat: Infinity, duration: 2 }}
                    className="flex items-center justify-center"
                  >
                    <span className="text-xs font-bold">{index + 1}</span>
                  </motion.div>
                ) : (
                  <span className="text-xs font-bold">{index + 1}</span>
                )}
              </div>
              <span className={cn(
                "text-[10px] font-bold uppercase tracking-widest text-center transition-colors duration-300",
                isCurrent ? "text-navy" : "text-muted-foreground"
              )}>
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
