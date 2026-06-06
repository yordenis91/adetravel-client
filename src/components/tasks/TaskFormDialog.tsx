import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { api, extractArrayFromResponse } from "@/lib/api";
import { toast } from "sonner";
import { Loader2, Trash2 } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

const taskSchema = z.object({
  title: z.string().min(1, "El título es requerido"),
  description: z.string().optional(),
  dueDate: z.string().min(1, "La fecha de vencimiento es requerida"),
  priority: z.enum(["ALTA", "MEDIA", "BAJA"]),
  status: z.enum(["PENDIENTE", "COMPLETADA"]).default("PENDIENTE"),
  relatedEntityType: z.string().optional().nullable(),
  relatedEntityId: z.string().optional().nullable(),
  relatedEntityLabel: z.string().optional().nullable(),
});

type TaskFormValues = z.infer<typeof taskSchema>;

interface TaskFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task?: any;
  onSuccess?: () => void;
}

export function TaskFormDialog({
  open,
  onOpenChange,
  task,
  onSuccess,
}: TaskFormDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [relatedEntities, setRelatedEntities] = useState<any[]>([]);
  const [isLoadingEntities, setIsLoadingEntities] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const queryClient = useQueryClient();

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
      });
    }
  }, [task, open, form]);

  useEffect(() => {
    async function loadRelatedEntities() {
      if (!relatedEntityType || relatedEntityType === "NONE") {
        setRelatedEntities([]);
        return;
      }

      setIsLoadingEntities(true);
      try {
        let items: any[] = [];
        switch (relatedEntityType) {
          case "CLIENTE":
            items = extractArrayFromResponse(await api.get("/clients"));
            setRelatedEntities(
              items.map((i) => ({
                id: i.id,
                label: `${i.firstName} ${i.lastName}`,
              }))
            );
            break;
          case "COTIZACION":
            items = extractArrayFromResponse(await api.get("/quotations"));
            setRelatedEntities(
              items.map((i) => ({ id: i.id, label: i.quotationNumber }))
            );
            break;
          case "PAGO":
            items = extractArrayFromResponse(await api.get("/payments"));
            setRelatedEntities(
              items.map((i) => ({ id: i.id, label: i.paymentNumber }))
            );
            break;
          case "SOLICITUD":
            items = extractArrayFromResponse(await api.get("/requests"));
            setRelatedEntities(
              items.map((i) => ({
                id: i.id,
                label: `${i.requestNumber} — ${i.destinationCity}`,
              }))
            );
            break;
          case "VOUCHER":
            items = extractArrayFromResponse(await api.get("/vouchers"));
            setRelatedEntities(
              items.map((i) => ({
                id: i.id,
                label: `${i.voucherNumber} — ${i.destination}`,
              }))
            );
            break;
          default:
            setRelatedEntities([]);
        }
      } catch (error) {
        console.error("Error loading related entities:", error);
        toast.error("Error al cargar entidades relacionadas");
      } finally {
        setIsLoadingEntities(false);
      }
    }

    loadRelatedEntities();
  }, [relatedEntityType]);

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
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[500px] rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-playfair font-bold text-navy">
              {task ? "Editar Tarea" : "Nueva Tarea"}
            </DialogTitle>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
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
                    <FormLabel className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
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

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="dueDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
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
                      <FormLabel className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
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

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="relatedEntityType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
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
                      <FormLabel className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                        Registro
                      </FormLabel>
                      <Select
                        disabled={!relatedEntityType || relatedEntityType === "NONE" || isLoadingEntities}
                        onValueChange={(val) => {
                          field.onChange(val);
                          const selected = relatedEntities.find(e => e.id === val);
                          form.setValue("relatedEntityLabel", selected?.label || null);
                        }}
                        value={field.value || "NONE"}
                      >
                        <FormControl>
                          <SelectTrigger>
                            {isLoadingEntities ? (
                              <Loader2 className="w-4 h-4 animate-spin mr-2" />
                            ) : null}
                            <SelectValue placeholder="Seleccionar registro" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="NONE" disabled>Seleccionar...</SelectItem>
                          {relatedEntities.map((entity) => (
                            <SelectItem key={entity.id} value={entity.id}>
                              {entity.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <DialogFooter className="pt-4 flex items-center justify-between sm:justify-between w-full">
                {task ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-rose-500 hover:text-rose-600 hover:bg-rose-50"
                    onClick={() => setShowDeleteConfirm(true)}
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Eliminar
                  </Button>
                ) : (
                  <div />
                )}
                <div className="flex gap-2">
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
                </div>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={showDeleteConfirm}
        onOpenChange={setShowDeleteConfirm}
        title="¿Eliminar tarea?"
        description="Esta acción no se puede deshacer. La tarea será eliminada permanentemente."
        onConfirm={handleDelete}
        confirmText="Eliminar"
        variant="destructive"
      />
    </>
  );
}