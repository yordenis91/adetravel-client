import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter } from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { api, extractArrayFromResponse } from "@/lib/api";
import { toast } from "sonner";
import { Combobox } from "@/components/ui/combobox";
import { useRemoteOptions } from "@/hooks/useRemoteOptions";
import { Loader2, Trash2 } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useAuth } from "@/context/AuthContext";

import { FormSheet, FormSheetBody, FormSheetFooter, FormSection } from "@/components/ui/form-sheet";
import { CalendarClock, ClipboardList, Link2 } from "lucide-react";
const taskSchema = z.object({
  title: z.string().min(1, "El título es requerido"),
  description: z.string().optional(),
  dueDate: z.string().min(1, "La fecha de vencimiento es requerida"),
  priority: z.enum(["ALTA", "MEDIA", "BAJA"]),
  status: z.enum(["PENDIENTE", "COMPLETADA"]).default("PENDIENTE"),
  relatedEntityType: z.string().optional().nullable(),
  relatedEntityId: z.string().optional().nullable(),
  relatedEntityLabel: z.string().optional().nullable(),
  assigneeId: z.string().optional().nullable(),
});

type TaskFormValues = z.infer<typeof taskSchema>;

interface TaskFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task?: any;
  onSuccess?: () => void;
}

const RELATED_ENTITY_SOURCES: Record<string, { key: string; path: string; label: (row: any) => string }> = {
  CLIENTE: { key: "clients", path: "/clients", label: (i) => `${i.firstName} ${i.lastName}` },
  COTIZACION: { key: "quotations", path: "/quotations", label: (i) => i.quotationNumber },
  PAGO: { key: "payments", path: "/payments", label: (i) => i.paymentNumber },
  SOLICITUD: { key: "requests", path: "/requests", label: (i) => `${i.requestNumber} — ${i.destinationCity ?? ""}` },
  VOUCHER: { key: "vouchers", path: "/vouchers", label: (i) => `${i.voucherNumber} — ${i.destination ?? ""}` },
};

export function TaskFormDialog({
  open,
  onOpenChange,
  task,
  onSuccess,
}: TaskFormDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const queryClient = useQueryClient();
  const { user: currentUser } = useAuth();

  const { data: usersResponse } = useQuery({
    queryKey: ["users-assignable"],
    queryFn: () => api.get("/users?limit=100&isActive=true"),
  });
  const assignableUsers = extractArrayFromResponse(usersResponse as any);

  const form = useForm<TaskFormValues>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      title: "",
      description: "",
      dueDate: new Date().toISOString().split("T")[0],
      priority: "MEDIA",
      status: "PENDIENTE",
      relatedEntityType: null,
      relatedEntityId: null,
      relatedEntityLabel: null,
      assigneeId: currentUser?.id,
    },
  });

  const relatedEntityType = form.watch("relatedEntityType");

  useEffect(() => {
    if (task) {
      form.reset({
        title: task.title,
        description: task.description || "",
        dueDate: task.dueDate,
        priority: task.priority,
        status: task.status,
        relatedEntityType: task.relatedEntityType || null,
        relatedEntityId: task.relatedEntityId || null,
        relatedEntityLabel: task.relatedEntityLabel || null,
        assigneeId: task.userId,
      });
    } else {
      form.reset({
        title: "",
        description: "",
        dueDate: new Date().toISOString().split("T")[0],
        priority: "MEDIA",
        status: "PENDIENTE",
        relatedEntityType: null,
        relatedEntityId: null,
        relatedEntityLabel: null,
        assigneeId: currentUser?.id,
      });
    }
  }, [task, open, form, currentUser?.id]);

  // Registros enlazables buscados en el servidor según el tipo (antes se pedía cada lista sin
  // paginar y solo aparecían los 20 más recientes).
  const entitySource = RELATED_ENTITY_SOURCES[relatedEntityType ?? ""];
  const entityOptions = useRemoteOptions(
    entitySource?.key ?? "none",
    entitySource?.path ?? "/requests",
    (row: any) => ({ value: row.id, label: entitySource ? entitySource.label(row) : row.id }),
    { enabled: open && !!entitySource }
  );

  async function onSubmit(values: TaskFormValues) {
    setIsLoading(true);
    try {
      if (task) {
        await api.patch(`/tasks/${task.id}`, values);
        toast.success("Tarea actualizada correctamente");
      } else {
        await api.post("/tasks", values);
        toast.success("Tarea creada correctamente");
      }
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      onSuccess?.();
      onOpenChange(false);
    } catch (error) {
      console.error("Error saving task:", error);
      toast.error("Error al guardar la tarea");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleDelete() {
    if (!task) return;
    setIsLoading(true);
    try {
      await api.delete(`/tasks/${task.id}`);
      toast.success("Tarea eliminada");
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      onSuccess?.();
      onOpenChange(false);
    } catch (error) {
      console.error("Error deleting task:", error);
      toast.error("Error al eliminar la tarea");
    } finally {
      setIsLoading(false);
      setShowDeleteConfirm(false);
    }
  }

  return (
    <>
      <FormSheet open={open} onOpenChange={onOpenChange} title={task ? "Editar Tarea" : "Nueva Tarea"} description="Registra un pendiente, asígnalo y vincúlalo a un registro si corresponde." widthClassName="sm:max-w-[500px]">

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="flex min-h-0 flex-1 flex-col">
              <FormSheetBody>
              <FormSection tone="blue" icon={ClipboardList} title="Qué hay que hacer">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-bold text-navy">
                      Título
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="Ej. Llamar a proveedor de hotel" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-bold text-navy">
                      Descripción
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Detalles adicionales..."
                        className="resize-none"
                        {...field}
                        value={field.value || ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              </FormSection>

              <FormSection tone="emerald" icon={CalendarClock} title="Responsable y plazo">
              <FormField
                control={form.control}
                name="assigneeId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-bold text-navy">
                      Asignar a
                    </FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || currentUser?.id}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar responsable" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {assignableUsers.map((u: any) => (
                          <SelectItem key={u.id} value={u.id}>
                            {u.fullName}{u.id === currentUser?.id ? " (Tú)" : ""}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {task?.createdByName && task.createdBy !== currentUser?.id && (
                      <p className="text-[11px] text-muted-foreground">Asignada por {task.createdByName}</p>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="dueDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-bold text-navy">
                        Vencimiento
                      </FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="priority"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-bold text-navy">
                        Prioridad
                      </FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccionar" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="ALTA">
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 rounded-full bg-rose-500" />
                              <span>Alta</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="MEDIA">
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 rounded-full bg-amber-500" />
                              <span>Media</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="BAJA">
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 rounded-full bg-slate-400" />
                              <span>Baja</span>
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              </FormSection>

              <FormSection tone="amber" icon={Link2} title="Vincular a un registro (opcional)">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="relatedEntityType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-bold text-navy">
                        Vincular a...
                      </FormLabel>
                      <Select
                        onValueChange={(val) => {
                          field.onChange(val === "NONE" ? null : val);
                          form.setValue("relatedEntityId", null);
                          form.setValue("relatedEntityLabel", null);
                        }}
                        value={field.value || "NONE"}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Tipo de entidad" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="NONE">Ninguna</SelectItem>
                          <SelectItem value="CLIENTE">Cliente</SelectItem>
                          <SelectItem value="COTIZACION">Cotización</SelectItem>
                          <SelectItem value="PAGO">Pago</SelectItem>
                          <SelectItem value="SOLICITUD">Solicitud</SelectItem>
                          <SelectItem value="VOUCHER">Voucher</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="relatedEntityId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-bold text-navy">
                        Registro
                      </FormLabel>
                      <Combobox
                        options={entityOptions.options}
                        onSearchChange={entityOptions.onSearchChange}
                        loading={entityOptions.loading}
                        disabled={!entitySource}
                        selectedLabel={form.watch("relatedEntityLabel") ?? undefined}
                        value={field.value}
                        onChange={(val) => {
                          field.onChange(val);
                          const selected = entityOptions.options.find((o) => o.value === val);
                          form.setValue("relatedEntityLabel", selected?.label || null);
                        }}
                        placeholder="Seleccionar registro"
                        searchPlaceholder="Buscar..."
                        emptyText="Sin resultados."
                      />
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              </FormSection>
              </FormSheetBody>
              <FormSheetFooter>
                {task ? (
                  <Button
                    type="button"
                    variant="ghost"
                                        className="text-rose-500 hover:text-rose-600 hover:bg-rose-50 sm:mr-auto"
                    onClick={() => setShowDeleteConfirm(true)}
                  >
                    <Trash2 className="w-4 h-4 sm:mr-2" />
                    <span className="sr-only sm:not-sr-only">Eliminar</span>
                  </Button>
                ) : null}
                <Button
                    type="button"
                    variant="outline"
                    onClick={() => onOpenChange(false)}
                  >
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={isLoading} className="bg-navy">
                    {isLoading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                    {task ? "Guardar cambios" : "Crear Tarea"}
                  </Button>
              </FormSheetFooter>
            </form>
          </Form>
        </FormSheet>

      <ConfirmDialog
        open={showDeleteConfirm}
        onOpenChange={setShowDeleteConfirm}
        title="¿Eliminar tarea?"
        description="Esta acción no se puede deshacer. La tarea será eliminada permanentemente."
        onConfirm={handleDelete}
        confirmLabel="Eliminar"
        variant="danger"
      />
    </>
  );
}