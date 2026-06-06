import React from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api, extractArrayFromResponse } from "@/lib/api";
import { Checkbox } from "@/components/ui/checkbox";
import { Link } from "react-router-dom";
import { format, isToday, isTomorrow, isPast, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

export function TasksWidget() {
  const queryClient = useQueryClient();
  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ["tasks", "widget"],
    queryFn: async () => {
      const allTasks = extractArrayFromResponse(await api.get("/tasks"));
      return allTasks
        .filter((t: any) => t.status === "PENDIENTE")
        .sort((a: any, b: any) => a.dueDate.localeCompare(b.dueDate))
        .slice(0, 5);
    },
  });

  const handleComplete = async (taskId: string) => {
    try {
      await api.patch(`/tasks/${taskId}`, { status: "COMPLETADA" });
      toast.success("Tarea completada");
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    } catch (error) {
      console.error("Error completing task:", error);
      toast.error("Error al completar la tarea");
    }
  };

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">
          Mis Tareas
        </h3>
        <Link
          to="/tareas"
          className="text-[10px] font-bold text-primary hover:underline"
        >
          Ver todas
        </Link>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex gap-3">
              <Skeleton className="w-4 h-4 rounded" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-3 w-3/4" />
                <Skeleton className="h-2 w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : tasks.length === 0 ? (
        <p className="text-xs text-muted-foreground text-center py-4">
          No tienes tareas pendientes
        </p>
      ) : (
        <div className="space-y-3">
          {tasks.map((task: any) => (
            <div
              key={task.id}
              className="flex items-start gap-3 p-2 -mx-2 rounded-lg hover:bg-slate-50 transition-colors group"
            >
              <Checkbox
                checked={false}
                onCheckedChange={() => handleComplete(task.id)}
                className="mt-0.5 border-slate-300"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <div
                    className={cn(
                      "w-1.5 h-1.5 rounded-full shrink-0",
                      task.priority === "ALTA"
                        ? "bg-rose-500"
                        : task.priority === "MEDIA"
                        ? "bg-amber-500"
                        : "bg-slate-400"
                    )}
                  />
                  <p className="text-xs font-medium text-navy leading-tight truncate">
                    {task.title}
                  </p>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <DueDateBadge dueDate={task.dueDate} />
                  {task.relatedEntityLabel && (
                    <span className="text-[9px] font-bold text-muted-foreground bg-slate-100 px-1.5 py-0.5 rounded truncate max-w-[120px]">
                      {task.relatedEntityLabel}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function DueDateBadge({ dueDate }: { dueDate: string }) {
  const date = parseISO(dueDate);
  let text = format(date, "d MMM", { locale: es });
  let className = "bg-slate-50 text-slate-500 border-slate-100";

  if (isPast(date) && !isToday(date)) {
    text = "Vencida";
    className = "bg-rose-50 text-rose-600 border-rose-100";
  } else if (isToday(date)) {
    text = "Hoy";
    className = "bg-amber-50 text-amber-600 border-amber-100";
  } else if (isTomorrow(date)) {
    text = "Mañana";
    className = "bg-blue-50 text-blue-600 border-blue-100";
  }

  return (
    <span
      className={cn(
        "text-[9px] font-bold px-1.5 py-0.5 rounded border leading-none uppercase tracking-tighter",
        className
      )}
    >
      {text}
    </span>
  );
}