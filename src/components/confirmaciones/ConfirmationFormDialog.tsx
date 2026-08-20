import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Combobox } from "@/components/ui/combobox";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useCreateConfirmation, useUpdateConfirmation } from "@/hooks/useConfirmations";
import { SERVICE_TYPE_LABELS } from "@/types/service";

const confirmationSchema = z.object({
  requestId: z.string().min(1, "La solicitud es obligatoria"),
  serviceId: z.string().optional().nullable(),
  providerId: z.string().min(1, "El proveedor es obligatorio"),
  providerConfirmationNumber: z.string().optional(),
  price: z.coerce.number().min(0, "El precio no puede ser negativo"),
  validUntil: z.string().optional(),
  exchangeRate: z.coerce.number().optional(),
  notes: z.string().optional(),
});

type ConfirmationFormValues = z.infer<typeof confirmationSchema>;

interface ConfirmationFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  requestId?: string;
  confirmation?: any;
  onSuccess?: () => void;
}

export function ConfirmationFormDialog({ open, onOpenChange, requestId, confirmation, onSuccess }: ConfirmationFormDialogProps) {
  const { toast } = useToast();
  const createMutation = useCreateConfirmation();
  const updateMutation = useUpdateConfirmation();
  const isEditing = !!confirmation;

  const { data: requestsData } = useQuery({ queryKey: ["requests-all"], queryFn: () => api.get("/requests?limit=1000"), enabled: open && !requestId });
  const requests = Array.isArray(requestsData) ? requestsData : (requestsData as any)?.data || [];

  const { data: providersData } = useQuery({ queryKey: ["providers-all"], queryFn: () => api.get("/providers"), enabled: open });
  const providers = Array.isArray(providersData) ? providersData : (providersData as any)?.data || [];

  const form = useForm<ConfirmationFormValues>({
    resolver: zodResolver(confirmationSchema),
    defaultValues: {
      requestId: requestId || "",
      serviceId: null,
      providerId: "",
      providerConfirmationNumber: "",
      price: 0,
      validUntil: "",
      exchangeRate: undefined,
      notes: "",
    },
  });

  const selectedRequestId = form.watch("requestId");
  const { data: servicesData } = useQuery({
    queryKey: ["requests", selectedRequestId, "services"],
    queryFn: () => api.get(`/requests/${selectedRequestId}/services`),
    enabled: open && !!selectedRequestId,
  });
  const services = Array.isArray(servicesData) ? servicesData : (servicesData as any)?.data || [];

  const selectedRequest = requests.find((r: any) => r.id === selectedRequestId);
  const isPackage = selectedRequest?.isPackage;

  useEffect(() => {
    if (!open) return;
    if (confirmation) {
      form.reset({
        requestId: confirmation.requestId,
        serviceId: confirmation.serviceId ?? null,
        providerId: confirmation.providerId,
        providerConfirmationNumber: confirmation.providerConfirmationNumber || "",
        price: confirmation.price,
        validUntil: confirmation.validUntil || "",
        exchangeRate: confirmation.exchangeRate ?? undefined,
        notes: confirmation.notes || "",
      });
    } else {
      form.reset({
        requestId: requestId || "",
        serviceId: null,
        providerId: "",
        providerConfirmationNumber: "",
        price: 0,
        validUntil: "",
        exchangeRate: undefined,
        notes: "",
      });
    }
  }, [confirmation, open, requestId, form]);

  const onSubmit = async (values: ConfirmationFormValues) => {
    try {
      const payload = { ...values, serviceId: isPackage ? null : values.serviceId };
      if (isEditing) {
        await updateMutation.mutateAsync({ id: confirmation.id, ...payload });
        toast({ title: "Confirmación actualizada" });
      } else {
        await createMutation.mutateAsync(payload);
        toast({ title: "Confirmación creada" });
      }
      onOpenChange(false);
      onSuccess?.();
    } catch (err: any) {
      toast({ variant: "destructive", title: "Error al guardar", description: err?.message || "Intenta nuevamente." });
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-[600px] p-0 flex flex-col">
        <SheetHeader className="p-8 pb-4">
          <SheetTitle className="text-2xl font-playfair font-bold text-navy">
            {isEditing ? "Editar Confirmación" : "Nueva Confirmación"}
          </SheetTitle>
          <SheetDescription>Registra la confirmación de reserva emitida por el proveedor.</SheetDescription>
        </SheetHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex-1 flex flex-col overflow-hidden">
            <ScrollArea className="flex-1 px-8">
              <div className="space-y-4 pb-10">
                {!requestId && (
                  <FormField control={form.control} name="requestId" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Solicitud *</FormLabel>
                      <Combobox
                        options={requests.map((r: any) => ({ value: r.id, label: r.requestNumber }))}
                        value={field.value}
                        onChange={field.onChange}
                        disabled={isEditing}
                        placeholder="Selecciona una solicitud"
                        searchPlaceholder="Buscar solicitud..."
                        emptyText="Sin solicitudes."
                      />
                      <FormMessage className="text-[10px]" />
                    </FormItem>
                  )} />
                )}

                {!isPackage && (
                  <FormField control={form.control} name="serviceId" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Servicio (opcional)</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value ?? undefined} disabled={!selectedRequestId}>
                        <FormControl>
                          <SelectTrigger className="bg-slate-50 border-slate-100"><SelectValue placeholder="Toda la solicitud" /></SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {services.map((s: any) => (
                            <SelectItem key={s.id} value={s.id}>
                              {s.serviceNumber} — {SERVICE_TYPE_LABELS[s.type as keyof typeof SERVICE_TYPE_LABELS] || s.type}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage className="text-[10px]" />
                    </FormItem>
                  )} />
                )}

                <FormField control={form.control} name="providerId" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Proveedor *</FormLabel>
                    <Combobox
                      options={providers.map((p: any) => ({ value: p.id, label: p.fantasyName || p.name }))}
                      value={field.value}
                      onChange={field.onChange}
                      placeholder="Selecciona un proveedor"
                      searchPlaceholder="Buscar proveedor..."
                      emptyText="Sin proveedores."
                    />
                    <FormMessage className="text-[10px]" />
                  </FormItem>
                )} />

                <FormField control={form.control} name="providerConfirmationNumber" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-bold uppercase tracking-wider text-muted-foreground">N° de confirmación del proveedor</FormLabel>
                    <FormControl><Input {...field} className="bg-slate-50 border-slate-100" /></FormControl>
                    <FormMessage className="text-[10px]" />
                  </FormItem>
                )} />

                <div className="grid grid-cols-2 gap-4">
                  <FormField control={form.control} name="price" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Precio *</FormLabel>
                      <FormControl><Input type="number" min={0} step="0.01" {...field} className="bg-slate-50 border-slate-100" /></FormControl>
                      <FormMessage className="text-[10px]" />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="exchangeRate" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Tipo de cambio</FormLabel>
                      <FormControl><Input type="number" min={0} step="0.01" {...field} value={field.value ?? ""} className="bg-slate-50 border-slate-100" /></FormControl>
                      <FormMessage className="text-[10px]" />
                    </FormItem>
                  )} />
                </div>

                <FormField control={form.control} name="validUntil" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Fecha de vigencia</FormLabel>
                    <FormControl><Input type="date" {...field} className="bg-slate-50 border-slate-100" /></FormControl>
                    <FormMessage className="text-[10px]" />
                  </FormItem>
                )} />

                <FormField control={form.control} name="notes" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Observaciones</FormLabel>
                    <FormControl><Textarea {...field} className="bg-slate-50 border-slate-100 min-h-[80px]" /></FormControl>
                    <FormMessage className="text-[10px]" />
                  </FormItem>
                )} />
              </div>
            </ScrollArea>

            <SheetFooter className="p-8 border-t border-slate-100 bg-slate-50/50">
              <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} className="text-xs font-bold uppercase tracking-wider">
                Cancelar
              </Button>
              <Button type="submit" disabled={form.formState.isSubmitting} className="text-xs font-bold uppercase tracking-wider gap-2">
                {form.formState.isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                {isEditing ? "Guardar Cambios" : "Crear Confirmación"}
              </Button>
            </SheetFooter>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}
