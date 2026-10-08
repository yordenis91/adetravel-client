import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery } from "@tanstack/react-query";
import { api, getErrorMessage } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useRemoteOptions } from "@/hooks/useRemoteOptions";
import { Combobox } from "@/components/ui/combobox";
import { useProviderOptions } from "@/hooks/useProviderOptions";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useCreateConfirmation, useUpdateConfirmation } from "@/hooks/useConfirmations";
import { SERVICE_TYPE_LABELS } from "@/types/service";

import { FormSheet, FormSheetBody, FormSheetFooter, FormSection } from "@/components/ui/form-sheet";
import { Link2, Wallet } from "lucide-react";
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

  // Búsqueda de solicitudes en el servidor (antes limit=1000, que la API rechaza con 400).
  const requestOptions = useRemoteOptions("requests", "/requests", (r: any) => ({ value: r.id, label: r.requestNumber }), {
    enabled: open && !requestId,
  });

  const providerOptions = useProviderOptions(open);

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

  // La solicitud elegida se pide por id: así se sabe si es paquete también cuando el formulario
  // se abre desde el detalle de la solicitud (antes, sin la lista cargada, nunca lo era).
  const { data: selectedRequestData } = useQuery({
    queryKey: ["requests", selectedRequestId],
    queryFn: () => api.get(`/requests/${selectedRequestId}`),
    enabled: open && !!selectedRequestId,
  });
  const selectedRequest = (selectedRequestData as any)?.data;
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
      toast({ variant: "destructive", title: "Error al guardar", description: getErrorMessage(err, "Intenta nuevamente.") });
    }
  };

  return (
    <FormSheet open={open} onOpenChange={onOpenChange} title={isEditing ? "Editar Confirmación" : "Nueva Confirmación"} description="Registra la confirmación de reserva emitida por el proveedor." widthClassName="sm:max-w-[600px]">

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex min-h-0 flex-1 flex-col">
            <FormSheetBody>
              <div className="space-y-5">
                <FormSection tone="blue" icon={Link2} title="Vinculación y referencia">
                {!requestId && (
                  <FormField control={form.control} name="requestId" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-bold text-navy">Solicitud *</FormLabel>
                      <Combobox
                        options={requestOptions.options}
                        onSearchChange={requestOptions.onSearchChange}
                        loading={requestOptions.loading}
                        selectedLabel={selectedRequest?.requestNumber ?? confirmation?.request?.requestNumber}
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
                      <FormLabel className="text-xs font-bold text-navy">Servicio (opcional)</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value ?? undefined} disabled={!selectedRequestId}>
                        <FormControl>
                          <SelectTrigger className="bg-white"><SelectValue placeholder="Toda la solicitud" /></SelectTrigger>
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
                    <FormLabel className="text-xs font-bold text-navy">Proveedor *</FormLabel>
                    <Combobox
                      options={providerOptions.optionsFor(field.value)}
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
                    <FormLabel className="text-xs font-bold text-navy">N° de confirmación del proveedor</FormLabel>
                    <FormControl><Input {...field} className="bg-white" /></FormControl>
                    <FormMessage className="text-[10px]" />
                  </FormItem>
                )} />

                </FormSection>

                <FormSection tone="emerald" icon={Wallet} title="Montos, vigencia y notas">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField control={form.control} name="price" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-bold text-navy">Precio *</FormLabel>
                      <FormControl><Input type="number" min={0} step="0.01" {...field} className="bg-white" /></FormControl>
                      <FormMessage className="text-[10px]" />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="exchangeRate" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-bold text-navy">Tipo de cambio</FormLabel>
                      <FormControl><Input type="number" min={0} step="0.01" {...field} value={field.value ?? ""} className="bg-white" /></FormControl>
                      <FormMessage className="text-[10px]" />
                    </FormItem>
                  )} />
                </div>

                <FormField control={form.control} name="validUntil" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-bold text-navy">Fecha de vigencia</FormLabel>
                    <FormControl><Input type="date" {...field} className="bg-white" /></FormControl>
                    <FormMessage className="text-[10px]" />
                  </FormItem>
                )} />

                <FormField control={form.control} name="notes" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-bold text-navy">Observaciones</FormLabel>
                    <FormControl><Textarea {...field} className="bg-white min-h-[80px]" /></FormControl>
                    <FormMessage className="text-[10px]" />
                  </FormItem>
                )} />
                </FormSection>
              </div>
            </FormSheetBody>

            <FormSheetFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={form.formState.isSubmitting} className="gap-2">
                {form.formState.isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                {isEditing ? "Guardar Cambios" : "Crear Confirmación"}
              </Button>
            </FormSheetFooter>
          </form>
        </Form>
      </FormSheet>
  );
}
