import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery } from "@tanstack/react-query";
import { api, getErrorMessage } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Combobox } from "@/components/ui/combobox";
import { useProviderOptions } from "@/hooks/useProviderOptions";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useCreateService, useUpdateService } from "@/hooks/useServices";
import { SERVICE_TYPES, SERVICE_TYPE_LABELS, ServiceType } from "@/types/service";
import { serviceDetailsSchema } from "@/lib/serviceDetailsSchema";
import { SERVICE_DETAIL_FIELDS, getDefaultDetails } from "./details";

import { FormSheet, FormSheetBody, FormSheetFooter, FormSection } from "@/components/ui/form-sheet";
import { ClipboardList, Layers } from "lucide-react";
const serviceSchema = z.object({
  type: z.enum(SERVICE_TYPES),
  providerId: z.string().optional().nullable(),
  clientId: z.string().optional().nullable(),
  price: z.coerce.number().min(0).optional().nullable(),
  currency: z.enum(["CLP", "USD"]).default("CLP"),
  details: serviceDetailsSchema,
}).refine((data) => data.type === data.details.type, {
  message: "El tipo del servicio no coincide con los datos ingresados",
  path: ["details"],
});

type ServiceFormValues = z.infer<typeof serviceSchema>;

interface ServiceFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  requestId: string;
  defaultClientId?: string;
  service?: any;
  onSuccess?: () => void;
}

export function ServiceFormDialog({ open, onOpenChange, requestId, defaultClientId, service, onSuccess }: ServiceFormDialogProps) {
  const { toast } = useToast();
  const createMutation = useCreateService();
  const updateMutation = useUpdateService();
  const isEditing = !!service;

  const providerOptions = useProviderOptions(open);

  const form = useForm<ServiceFormValues>({
    resolver: zodResolver(serviceSchema),
    defaultValues: {
      type: "ALOJAMIENTO",
      providerId: null,
      clientId: defaultClientId ?? null,
      price: null,
      currency: "CLP",
      details: getDefaultDetails("ALOJAMIENTO") as any,
    },
  });

  useEffect(() => {
    if (!open) return;
    if (service) {
      form.reset({
        type: service.type,
        providerId: service.providerId ?? null,
        clientId: service.clientId ?? null,
        price: service.price ?? null,
        currency: service.currency ?? "CLP",
        details: service.details,
      });
    } else {
      form.reset({
        type: "ALOJAMIENTO",
        providerId: null,
        clientId: defaultClientId ?? null,
        price: null,
        currency: "CLP",
        details: getDefaultDetails("ALOJAMIENTO") as any,
      });
    }
  }, [service, open, defaultClientId, form]);

  const selectedType = form.watch("type") as ServiceType;
  const DetailFields = SERVICE_DETAIL_FIELDS[selectedType];

  const handleTypeChange = (newType: ServiceType) => {
    form.setValue("type", newType);
    form.setValue("details", getDefaultDetails(newType) as any);
  };

  const onSubmit = async (values: ServiceFormValues) => {
    try {
      let details: any = { ...values.details, type: values.type };
      if (values.type === "ALOJAMIENTO") {
        details = { ...details, roomCount: (details.rooms || []).length };
      }
      const payload = { ...values, details, requestId };

      if (isEditing) {
        await updateMutation.mutateAsync({ id: service.id, ...payload });
        toast({ title: "Servicio actualizado" });
      } else {
        await createMutation.mutateAsync(payload);
        toast({ title: "Servicio agregado", description: "El servicio fue creado correctamente." });
      }
      onOpenChange(false);
      onSuccess?.();
    } catch (err: any) {
      toast({ variant: "destructive", title: "Error al guardar", description: getErrorMessage(err, "Intenta nuevamente.") });
    }
  };

  return (
    <FormSheet open={open} onOpenChange={onOpenChange} title={isEditing ? "Editar Servicio" : "Agregar Servicio"} description="Completa los datos específicos según el tipo de servicio." widthClassName="sm:max-w-[680px]">

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex min-h-0 flex-1 flex-col">
            <FormSheetBody>
              <div className="space-y-5">
                <FormSection tone="blue" icon={Layers} title="Tipo de servicio">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <FormField control={form.control} name="type" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-bold text-navy">Tipo *</FormLabel>
                        <Select onValueChange={(v) => handleTypeChange(v as ServiceType)} value={field.value} disabled={isEditing}>
                          <FormControl>
                            <SelectTrigger className="bg-white"><SelectValue /></SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {SERVICE_TYPES.map((t) => <SelectItem key={t} value={t}>{SERVICE_TYPE_LABELS[t]}</SelectItem>)}
                          </SelectContent>
                        </Select>
                        <FormMessage className="text-[10px]" />
                      </FormItem>
                    )} />

                    <FormField control={form.control} name="providerId" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-bold text-navy">Proveedor</FormLabel>
                        <Combobox
                          options={providerOptions.optionsFor(field.value)}
                          value={field.value}
                          onChange={field.onChange}
                          placeholder="Sin asignar"
                          searchPlaceholder="Buscar proveedor..."
                          emptyText="Sin proveedores."
                        />
                        <FormMessage className="text-[10px]" />
                      </FormItem>
                    )} />

                    <FormField control={form.control} name="price" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-bold text-navy">Precio</FormLabel>
                        <FormControl>
                          <Input type="number" min={0} step="0.01" {...field} value={field.value ?? ""} onChange={(e) => field.onChange(e.target.value === "" ? null : e.target.valueAsNumber)} className="bg-white" />
                        </FormControl>
                        <FormMessage className="text-[10px]" />
                      </FormItem>
                    )} />
                  </div>
                </FormSection>

                <FormSection tone="emerald" icon={ClipboardList} title={`Datos de ${SERVICE_TYPE_LABELS[selectedType]}`}>
                  {DetailFields && <DetailFields control={form.control} />}
                </FormSection>
              </div>
            </FormSheetBody>

            <FormSheetFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={form.formState.isSubmitting} className="gap-2">
                {form.formState.isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                {isEditing ? "Guardar Cambios" : "Agregar Servicio"}
              </Button>
            </FormSheetFooter>
          </form>
        </Form>
      </FormSheet>
  );
}
