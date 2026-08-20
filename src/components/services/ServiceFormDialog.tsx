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
import { Separator } from "@/components/ui/separator";
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Combobox } from "@/components/ui/combobox";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useCreateService, useUpdateService } from "@/hooks/useServices";
import { SERVICE_TYPES, SERVICE_TYPE_LABELS, ServiceType } from "@/types/service";
import { serviceDetailsSchema } from "@/lib/serviceDetailsSchema";
import { SERVICE_DETAIL_FIELDS, getDefaultDetails } from "./details";

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

  const { data: providersData } = useQuery({
    queryKey: ["providers-all"],
    queryFn: () => api.get("/providers"),
    enabled: open,
  });
  const providers = Array.isArray(providersData) ? providersData : (providersData as any)?.data || [];

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
      toast({ variant: "destructive", title: "Error al guardar", description: err?.message || "Intenta nuevamente." });
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-[680px] p-0 flex flex-col">
        <SheetHeader className="p-8 pb-4">
          <SheetTitle className="text-2xl font-playfair font-bold text-navy">
            {isEditing ? "Editar Servicio" : "Agregar Servicio"}
          </SheetTitle>
          <SheetDescription>Completa los datos específicos según el tipo de servicio.</SheetDescription>
        </SheetHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex-1 flex flex-col overflow-hidden">
            <ScrollArea className="flex-1 px-8">
              <div className="space-y-6 pb-10">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">1. Tipo de Servicio</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FormField control={form.control} name="type" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Tipo *</FormLabel>
                        <Select onValueChange={(v) => handleTypeChange(v as ServiceType)} value={field.value} disabled={isEditing}>
                          <FormControl>
                            <SelectTrigger className="bg-slate-50 border-slate-100"><SelectValue /></SelectTrigger>
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
                        <FormLabel className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Proveedor</FormLabel>
                        <Combobox
                          options={providers.map((p: any) => ({ value: p.id, label: p.fantasyName || p.name }))}
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
                        <FormLabel className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Precio</FormLabel>
                        <FormControl>
                          <Input type="number" min={0} step="0.01" {...field} value={field.value ?? ""} onChange={(e) => field.onChange(e.target.value === "" ? null : e.target.valueAsNumber)} className="bg-slate-50 border-slate-100" />
                        </FormControl>
                        <FormMessage className="text-[10px]" />
                      </FormItem>
                    )} />
                  </div>
                </div>

                <Separator />

                <div>
                  <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">2. Datos de {SERVICE_TYPE_LABELS[selectedType]}</h3>
                  {DetailFields && <DetailFields control={form.control} />}
                </div>
              </div>
            </ScrollArea>

            <SheetFooter className="p-8 border-t border-slate-100 bg-slate-50/50">
              <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} className="text-xs font-bold uppercase tracking-wider">
                Cancelar
              </Button>
              <Button type="submit" disabled={form.formState.isSubmitting} className="text-xs font-bold uppercase tracking-wider gap-2">
                {form.formState.isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                {isEditing ? "Guardar Cambios" : "Agregar Servicio"}
              </Button>
            </SheetFooter>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}
