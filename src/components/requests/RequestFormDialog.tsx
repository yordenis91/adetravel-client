import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Combobox } from "@/components/ui/combobox";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { api, getErrorMessage } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { useCatalog, useCitiesForCountry } from "@/hooks/useCatalogs";
import { useRemoteOptions } from "@/hooks/useRemoteOptions";
import { Loader2 } from "lucide-react";

import { FormSheet, FormSheetBody, FormSheetFooter, FormSection } from "@/components/ui/form-sheet";
import { FileText, Plane, StickyNote, Wallet } from "lucide-react";
const requestSchema = z.object({
  clientId: z.string().min(1, "Cliente es requerido"),
  isPackage: z.boolean().default(false),
  requestDate: z.string().min(1, "Fecha es requerida"),
  originCountry: z.string().optional(),
  originCity: z.string().optional(),
  destinationCountry: z.string().min(1, "País destino es requerido"),
  destinationCity: z.string().min(1, "Ciudad destino es requerida"),
  durationDays: z.coerce.number().min(1, "Mínimo 1 día"),
  budgetMin: z.coerce.number().optional(),
  budgetMax: z.coerce.number().optional(),
  status: z.string().default("RECEPCIONADA"),
  description: z.string().optional(),
}).refine(data => {
  // Validar solo si ambos tienen valor y el máximo es mayor a cero
  if (data.budgetMin !== undefined && data.budgetMax !== undefined && data.budgetMax > 0) {
    return data.budgetMax >= data.budgetMin;
  }
  return true;
}, {
  message: "Debe ser mayor o igual al mínimo",
  path: ["budgetMax"]
});

type RequestFormValues = z.infer<typeof requestSchema>;

interface RequestFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  request?: any;
  onSuccess: (savedRequest: any, wasCreated: boolean) => void;
}

export function RequestFormDialog({ open, onOpenChange, request, onSuccess }: RequestFormDialogProps) {
  const { toast } = useToast();
  const isEditing = !!request;
  const clientName = (c: any) => `${c.firstName} ${c.lastName ?? ""}`.trim();
  const clientOptions = useRemoteOptions("clients", "/clients", (c: any) => ({ value: c.id, label: clientName(c) }), {
    enabled: open,
    params: { isActive: "true" },
  });
  const { data: countries } = useCatalog("countries");

  const form = useForm<RequestFormValues>({
    resolver: zodResolver(requestSchema),
    defaultValues: {
      clientId: "",
      isPackage: false,
      requestDate: new Date().toISOString().split('T')[0],
      originCountry: "Chile",
      originCity: "Santiago",
      destinationCountry: "",
      destinationCity: "",
      durationDays: 7,
      budgetMin: 0,
      budgetMax: 0,
      status: "RECEPCIONADA",
      description: "",
    },
  });
  const { cities: originCities } = useCitiesForCountry(form.watch("originCountry"));
  const { cities: destinationCities } = useCitiesForCountry(form.watch("destinationCountry"));

  useEffect(() => {
    if (request && open) {
      form.reset({
        clientId: request.clientId || "",
        isPackage: request.isPackage || false,
        requestDate: request.requestDate || new Date().toISOString().split('T')[0],
        originCountry: request.originCountry || "",
        originCity: request.originCity || "",
        destinationCountry: request.destinationCountry || "",
        destinationCity: request.destinationCity || "",
        durationDays: request.durationDays || 1,
        budgetMin: request.budgetMin || 0,
        budgetMax: request.budgetMax || 0,
        status: request.status || "RECEPCIONADA",
        description: request.description || "",
      });
    } else if (open) {
      form.reset({
        clientId: "",
        isPackage: false,
        requestDate: new Date().toISOString().split('T')[0],
        originCountry: "Chile",
        originCity: "Santiago",
        destinationCountry: "",
        destinationCity: "",
        durationDays: 7,
        budgetMin: 0,
        budgetMax: 0,
        status: "RECEPCIONADA",
        description: "",
      });
    }
  }, [request, form, open]);

   const onSubmit = async (values: RequestFormValues) => {
    try {
      let saved: any;
      if (isEditing) {
        const res: any = await api.patch(`/requests/${request.id}`, values);
        saved = res?.data ?? res;
        toast({ title: "Solicitud actualizada", description: "Los cambios se guardaron correctamente." });
      } else {
        const res: any = await api.post('/requests', values);
        saved = res?.data ?? res;
        toast({ title: "Solicitud creada", description: `Ahora agrega los servicios de esta solicitud.` });
      }
      onOpenChange(false);
      onSuccess(saved, !isEditing);
    } catch (error: any) {
      console.error(error);
      toast({
        title: "Error",
        description: getErrorMessage(error, "Hubo un problema al procesar la solicitud."),
        variant: "destructive"
      });
    }
  };

  return (
    <FormSheet open={open} onOpenChange={onOpenChange} title={isEditing ? "Editar Solicitud" : "Nueva Solicitud"} description="Registra los datos generales del viaje. Los servicios específicos (alojamiento, pasajes, etc.) se agregan luego desde el detalle de la solicitud." widthClassName="sm:max-w-[600px]">

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex min-h-0 flex-1 flex-col">
            <FormSheetBody>
              <div className="space-y-5">
                {/* Sección 1: Datos Generales */}
                <FormSection tone="blue" icon={FileText} title="Datos Generales">

                  <FormField
                    control={form.control}
                    name="clientId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-bold text-navy">Cliente Titular *</FormLabel>
                        <Combobox
                          options={clientOptions.options}
                          onSearchChange={clientOptions.onSearchChange}
                          loading={clientOptions.loading}
                          selectedLabel={request?.client ? clientName(request.client) : undefined}
                          value={field.value}
                          onChange={field.onChange}
                          placeholder="Selecciona un cliente"
                          searchPlaceholder="Buscar cliente..."
                          emptyText="Sin clientes."
                        />
                        <FormMessage className="text-[10px]" />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="requestDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs font-bold text-navy">Fecha Solicitud *</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} className="bg-white" />
                          </FormControl>
                          <FormMessage className="text-[10px]" />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="isPackage"
                      render={({ field }) => (
                        <FormItem className="flex flex-col justify-center gap-2">
                          <FormLabel className="text-xs font-bold text-navy">¿Es Paquete Completo?</FormLabel>
                          <div className="flex items-center gap-2">
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                            <span className="text-xs font-medium text-navy">{field.value ? "Sí" : "No"}</span>
                          </div>
                        </FormItem>
                      )}
                    />
                  </div>
                </FormSection>


                {/* Sección 2: Itinerario */}
                <FormSection tone="emerald" icon={Plane} title="Itinerario">

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="originCountry"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs font-bold text-navy">País Origen</FormLabel>
                          <Combobox
                            options={countries.map((c: any) => ({ value: c.name, label: c.name }))}
                            value={field.value}
                            onChange={(v) => {
                              if (v !== field.value) form.setValue("originCity", "");
                              field.onChange(v);
                            }}
                            allowCustomValue
                            placeholder="Ej: Chile"
                            searchPlaceholder="Buscar o escribir país..."
                            className="bg-white"
                          />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="originCity"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs font-bold text-navy">Ciudad Origen</FormLabel>
                          <Combobox
                            options={originCities.map((c: any) => ({ value: c.name, label: c.name }))}
                            value={field.value}
                            onChange={field.onChange}
                            allowCustomValue
                            placeholder="Ej: Santiago"
                            searchPlaceholder="Buscar o escribir ciudad..."
                            className="bg-white"
                          />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="destinationCountry"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs font-bold text-navy">País Destino *</FormLabel>
                          <Combobox
                            options={countries.map((c: any) => ({ value: c.name, label: c.name }))}
                            value={field.value}
                            onChange={(v) => {
                              if (v !== field.value) form.setValue("destinationCity", "");
                              field.onChange(v);
                            }}
                            allowCustomValue
                            placeholder="Ej: Francia"
                            searchPlaceholder="Buscar o escribir país..."
                            className="bg-white"
                          />
                          <FormMessage className="text-[10px]" />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="destinationCity"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs font-bold text-navy">Ciudad Destino *</FormLabel>
                          <Combobox
                            options={destinationCities.map((c: any) => ({ value: c.name, label: c.name }))}
                            value={field.value}
                            onChange={field.onChange}
                            allowCustomValue
                            placeholder="Ej: París"
                            searchPlaceholder="Buscar o escribir ciudad..."
                            className="bg-white"
                          />
                          <FormMessage className="text-[10px]" />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="durationDays"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-bold text-navy">Duración (Días)</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} className="bg-white" />
                        </FormControl>
                        <FormMessage className="text-[10px]" />
                      </FormItem>
                    )}
                  />
                </FormSection>


                {/* Sección 3: Presupuesto */}
                <FormSection tone="amber" icon={Wallet} title="Presupuesto Estimado">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="budgetMin"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs font-bold text-navy">Mínimo ($)</FormLabel>
                          <FormControl>
                            <Input type="number" {...field} className="bg-white" />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="budgetMax"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs font-bold text-navy">Máximo ($)</FormLabel>
                          <FormControl>
                            <Input type="number" {...field} className="bg-white" />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                </FormSection>


                {/* Sección 4: Descripción */}
                <FormSection tone="violet" icon={StickyNote} title="Descripción y Notas">
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Textarea
                            placeholder="Detalles adicionales, requerimientos especiales, etc."
                            aria-label="Descripción de la solicitud"
                            className="bg-white min-h-[120px]"
                            {...field}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </FormSection>
              </div>
            </FormSheetBody>

            <FormSheetFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={form.formState.isSubmitting} className="min-w-[140px]">
                {form.formState.isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Procesando...
                  </>
                ) : (
                  isEditing ? "Guardar Cambios" : "Crear Solicitud"
                )}
              </Button>
            </FormSheetFooter>
          </form>
        </Form>
      </FormSheet>
  );
}
