import React, { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api, extractArrayFromResponse } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Plus,
  Search,
  MoreHorizontal,
  LayoutGrid,
  List as ListIcon,
  ClipboardList,
  Clock,
  CheckCircle2,
  AlertCircle,
  ArrowDownWideNarrow,
  CalendarArrowDown,
  CalendarArrowUp,
} from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { format, isToday, isPast, parseISO, isTomorrow } from "date-fns";
import { es } from "date-fns/locale";
import { TaskFormDialog } from "./TaskFormDialog";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

export default function TasksPage() {
  const [activeTab, setActiveTab] = useState("pendientes");
  const [viewMode, setViewMode] = useState<"list" | "kanban">("list");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("dateAsc");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<any>(null);
  const queryClient = useQueryClient();

  const { data: allTasks = [], isLoading } = useQuery({
    queryKey: ["tasks"],
    queryFn: async () => extractArrayFromResponse(await api.get("/tasks")),
  });

  const PRIORITY_WEIGHT: Record<string, number> = { ALTA: 1, MEDIA: 2, BAJA: 3 };

  const filteredTasks = allTasks.filter((task: any) => {
    const matchesSearch =
      task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (task.description?.toLowerCase() || "").includes(searchQuery.toLowerCase()) ||
      (task.relatedEntityLabel?.toLowerCase() || "").includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    const taskDate = parseISO(task.dueDate);
    const isVencida = task.status === "PENDIENTE" && isPast(taskDate) && !isToday(taskDate);

    if (activeTab === "pendientes") return task.status === "PENDIENTE" && !isVencida;
    if (activeTab === "completadas") return task.status === "COMPLETADA";
    if (activeTab === "vencidas") return isVencida;

    return true;
  }).sort((a: any, b: any) => {
    if (sortBy === "priority") {
      const pa = PRIORITY_WEIGHT[a.priority] ?? 99;
      const pb = PRIORITY_WEIGHT[b.priority] ?? 99;
      if (pa !== pb) return pa - pb;
      const ta = parseISO(a.dueDate).getTime();
      const tb = parseISO(b.dueDate).getTime();
      return ta - tb;
    }

    const ta = parseISO(a.dueDate).getTime();
    const tb = parseISO(b.dueDate).getTime();

    if (sortBy === "dateDesc") return tb - ta;
    // default dateAsc
    return ta - tb;
  });

  const pendingCount = allTasks.filter((t: any) => {
    const d = parseISO(t.dueDate);
    return t.status === "PENDIENTE" && (!isPast(d) || isToday(d));
  }).length;

  const completedCount = allTasks.filter((t: any) => t.status === "COMPLETADA").length;

  const overdueCount = allTasks.filter((t: any) => {
    const d = parseISO(t.dueDate);
    return t.status === "PENDIENTE" && isPast(d) && !isToday(d);
  }).length;

  const toggleStatus = async (task: any) => {
    try {
      const newStatus = task.status === "PENDIENTE" ? "COMPLETADA" : "PENDIENTE";
      await api.patch(`/tasks/${task.id}`, { status: newStatus });
      toast.success(newStatus === "COMPLETADA" ? "Tarea completada" : "Tarea pendiente");
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    } catch (error) {
      console.error("Error updating status:", error);
      toast.error("Error al actualizar la tarea");
    }
  };

  const openCreate = () => {
    setEditingTask(null);
    setIsDialogOpen(true);
  };

  const openEdit = (task: any) => {
    setEditingTask(task);
    setIsDialogOpen(true);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-playfair font-bold text-navy">Mis Tareas</h1>
          <p className="text-muted-foreground text-sm">Gestiona tus tareas y recordatorios diarios</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar tareas..."
              className="pl-10 bg-white"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Button onClick={openCreate} className="bg-navy">
            <Plus className="w-4 h-4 mr-2" /> Nueva Tarea
          </Button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-white/50 p-2 rounded-2xl backdrop-blur-sm border border-slate-100">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full md:w-auto">
          <TabsList className="bg-transparent gap-1">
            <TabsTrigger
              value="pendientes"
              className="data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-lg px-4"
            >
              Pendientes <span className="ml-2 text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-slate-100">{pendingCount}</span>
            </TabsTrigger>
            <TabsTrigger
              value="completadas"
              className="data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-lg px-4"
            >
              Completadas <span className="ml-2 text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-slate-100">{completedCount}</span>
            </TabsTrigger>
            <TabsTrigger
              value="vencidas"
              className="data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-lg px-4"
            >
              Vencidas <span className="ml-2 text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-rose-100 text-rose-600">{overdueCount}</span>
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="flex items-center gap-1 bg-slate-100/50 p-1 rounded-xl">
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-44">
              <SelectValue placeholder="Ordenar por..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="dateAsc">
                <CalendarArrowUp className="w-4 h-4 mr-2 inline" /> Fecha (Próximas)
              </SelectItem>
              <SelectItem value="dateDesc">
                <CalendarArrowDown className="w-4 h-4 mr-2 inline" /> Fecha (Lejanas)
              </SelectItem>
              <SelectItem value="priority">
                <ArrowDownWideNarrow className="w-4 h-4 mr-2 inline" /> Prioridad (Alta a Baja)
              </SelectItem>
            </SelectContent>
          </Select>

          <div className="w-px h-6 bg-slate-200 mx-1"></div>

          <Button
            variant={viewMode === "list" ? "white" : "ghost"}
            size="sm"
            onClick={() => setViewMode("list")}
            className={cn("px-3 rounded-lg", viewMode === "list" && "bg-white shadow-sm")}
          >
            <ListIcon className="w-4 h-4 mr-2" /> Lista
          </Button>
          <Button
            variant={viewMode === "kanban" ? "white" : "ghost"}
            size="sm"
            onClick={() => setViewMode("kanban")}
            className={cn("px-3 rounded-lg", viewMode === "kanban" && "bg-white shadow-sm")}
          >
            <LayoutGrid className="w-4 h-4 mr-2" /> Kanban
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="grid gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-20 bg-white rounded-xl animate-pulse" />
          ))}
        </div>
      ) : filteredTasks.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-dashed border-slate-200">
          <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
            <ClipboardList className="w-8 h-8 text-slate-300" />
          </div>
          <h3 className="text-lg font-medium text-navy">No hay tareas</h3>
          <p className="text-muted-foreground text-sm max-w-xs text-center mt-1">
            {searchQuery
              ? "No encontramos tareas que coincidan con tu búsqueda."
              : "No tienes tareas en esta categoría. ¡Buen trabajo!"}
          </p>
          {!searchQuery && (
            <Button onClick={openCreate} variant="outline" className="mt-6">
              Crear mi primera tarea
            </Button>
          )}
        </div>
      ) : viewMode === "list" ? (
        <div className="space-y-3">
          <AnimatePresence mode="popLayout">
            {filteredTasks.map((task: any) => (
              <motion.div
                key={task.id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="flex items-center gap-4 p-4 bg-white rounded-xl border border-slate-100 hover:border-slate-200 hover:shadow-sm transition-all group"
              >
                <Checkbox
                  checked={task.status === "COMPLETADA"}
                  onCheckedChange={() => toggleStatus(task)}
                  className="w-5 h-5"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className={cn(
                      "text-sm font-semibold text-navy truncate",
                      task.status === "COMPLETADA" && "line-through text-muted-foreground"
                    )}>
                      {task.title}
                    </p>
                    <PriorityBadge priority={task.priority} />
                  </div>
                  {task.description && (
                    <p className="text-xs text-muted-foreground truncate mt-0.5">
                      {task.description}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-6 shrink-0">
                  <DueDateBadge dueDate={task.dueDate} status={task.status} />
                  {task.relatedEntityLabel && (
                    <div className="hidden md:flex items-center gap-1 bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full text-[10px] font-bold">
                      <Clock className="w-3 h-3" />
                      {task.relatedEntityLabel}
                    </div>
                  )}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="rounded-full">
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="rounded-xl">
                      <DropdownMenuItem onClick={() => openEdit(task)}>
                        Editar
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-rose-500 focus:text-rose-500"
                        onClick={() => {
                          setEditingTask(task);
                          // We'll use the delete inside the dialog
                          setIsDialogOpen(true);
                        }}
                      >
                        Eliminar
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <KanbanColumn
            title="Pendientes"
            icon={<Clock className="w-4 h-4 text-blue-500" />}
            tasks={filteredTasks.filter(t => t.status === "PENDIENTE" && (!isPast(parseISO(t.dueDate)) || isToday(parseISO(t.dueDate))))}
            onEdit={openEdit}
            onToggle={toggleStatus}
            color="blue"
          />
          <KanbanColumn
            title="Completadas"
            icon={<CheckCircle2 className="w-4 h-4 text-emerald-500" />}
            tasks={filteredTasks.filter(t => t.status === "COMPLETADA")}
            onEdit={openEdit}
            onToggle={toggleStatus}
            color="emerald"
          />
          <KanbanColumn
            title="Vencidas"
            icon={<AlertCircle className="w-4 h-4 text-rose-500" />}
            tasks={filteredTasks.filter(t => t.status === "PENDIENTE" && isPast(parseISO(t.dueDate)) && !isToday(parseISO(t.dueDate)))}
            onEdit={openEdit}
            onToggle={toggleStatus}
            color="rose"
          />
        </div>
      )}

      <TaskFormDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        task={editingTask}
      />
    </div>
  );
}

function KanbanColumn({ title, icon, tasks, onEdit, onToggle, color }: any) {
  const bgColors: any = {
    blue: "bg-blue-50/50",
    emerald: "bg-emerald-50/50",
    rose: "bg-rose-50/50",
  };

  const borderColors: any = {
    blue: "border-blue-100",
    emerald: "border-emerald-100",
    rose: "border-rose-100",
  };

  return (
    <div className={cn("flex flex-col gap-4 p-4 rounded-2xl border", bgColors[color], borderColors[color])}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          {icon}
          <h3 className="text-sm font-bold text-navy">{title}</h3>
        </div>
        <span className="text-[10px] font-bold bg-white px-2 py-0.5 rounded-full shadow-sm border border-slate-100">
          {tasks.length}
        </span>
      </div>
      <div className="space-y-3 min-h-[100px]">
        {tasks.map((task: any) => (
          <motion.div
            key={task.id}
            layout
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl p-4 shadow-sm border border-slate-100 hover:shadow-md transition-shadow group relative cursor-pointer"
            onClick={() => onEdit(task)}
          >
            <div className="flex items-start justify-between gap-2 mb-2">
              <p className={cn(
                "text-sm font-semibold text-navy leading-tight",
                task.status === "COMPLETADA" && "line-through text-muted-foreground"
              )}>
                {task.title}
              </p>
              <div onClick={(e) => e.stopPropagation()}>
                <Checkbox
                  checked={task.status === "COMPLETADA"}
                  onCheckedChange={() => onToggle(task)}
                  className="rounded-full"
                />
              </div>
            </div>
            {task.description && (
              <p className="text-[11px] text-muted-foreground mb-3 line-clamp-2">
                {task.description}
              </p>
            )}
            <div className="flex flex-wrap items-center gap-2 mt-auto">
              <DueDateBadge dueDate={task.dueDate} status={task.status} />
              <PriorityBadge priority={task.priority} />
            </div>
          </motion.div>
        ))}
        {tasks.length === 0 && (
          <div className="flex items-center justify-center py-10 border-2 border-dashed border-slate-200/50 rounded-xl">
            <p className="text-[10px] font-medium text-slate-400">Sin tareas</p>
          </div>
        )}
      </div>
    </div>
  );
}

function DueDateBadge({ dueDate, status }: { dueDate: string; status: string }) {
  const date = parseISO(dueDate);
  let text = format(date, "d MMM", { locale: es });
  let className = "bg-slate-50 text-slate-500 border-slate-100";

  if (status === "COMPLETADA") {
    className = "bg-emerald-50 text-emerald-600 border-emerald-100";
  } else if (isPast(date) && !isToday(date)) {
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
    <span className={cn(
      "text-[9px] font-bold px-2 py-0.5 rounded-full border leading-none uppercase tracking-tighter shrink-0",
      className
    )}>
      {text}
    </span>
  );
}

function PriorityBadge({ priority }: { priority: string }) {
  const styles: any = {
    ALTA: "bg-rose-50 text-rose-700 border-rose-100",
    MEDIA: "bg-amber-50 text-amber-700 border-amber-100",
    BAJA: "bg-slate-50 text-slate-600 border-slate-100",
  };

  return (
    <span className={cn(
      "text-[9px] font-bold px-2 py-0.5 rounded-full border leading-none uppercase tracking-tighter shrink-0",
      styles[priority]
    )}>
      {priority}
    </span>
  );
}