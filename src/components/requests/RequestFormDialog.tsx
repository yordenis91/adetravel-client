import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Combobox } from "@/components/ui/combobox";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { useCatalog } from "@/hooks/useCatalogs";
import { Loader2 } from "lucide-react";

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
  clients: any[];
  onSuccess: (savedRequest: any, wasCreated: boolean) => void;
}

export function RequestFormDialog({ open, onOpenChange, request, clients, onSuccess }: RequestFormDialogProps) {
  const { toast } = useToast();
  const isEditing = !!request;
  const { data: countries } = useCatalog("countries");
  const { data: cities } = useCatalog("cities");

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
        description: error.message || "Hubo un problema al procesar la solicitud.",
        variant: "destructive"
      });
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-[600px] p-0 flex flex-col">
        <SheetHeader className="p-8 pb-4">
          <SheetTitle className="text-2xl font-playfair font-bold text-navy">
            {isEditing ? "Editar Solicitud" : "Nueva Solicitud"}
          </SheetTitle>
          <SheetDescription>
            Registra los datos generales del viaje. Los servicios específicos (alojamiento, pasajes, etc.) se agregan luego desde el detalle de la solicitud.
          </SheetDescription>
        </SheetHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex-1 flex flex-col overflow-hidden">
            <ScrollArea className="flex-1 px-8">
              <div className="space-y-8 pb-10">
                {/* Sección 1: Datos Generales */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xs">1</span>
                    <h3 className="text-sm font-bold uppercase tracking-widest text-navy">Datos Generales</h3>
                  </div>

                  <FormField
                    control={form.control}
                    name="clientId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Cliente Titular *</FormLabel>
                        <Combobox
                          options={clients.map((client: any) => ({ value: client.id, label: `${client.firstName} ${client.lastName}` }))}
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

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="requestDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Fecha Solicitud *</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} className="bg-slate-50 border-slate-100" />
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
                          <FormLabel className="text-xs font-bold uppercase tracking-wider text-muted-foreground">¿Es Paquete Completo?</FormLabel>
                          <FormControl>
                            <div className="flex items-center gap-2">
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                              <span className="text-xs font-medium text-navy">{field.value ? "Sí" : "No"}</span>
                            </div>
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                <Separator className="bg-slate-100" />

                {/* Sección 2: Itinerario */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-xs">2</span>
                    <h3 className="text-sm font-bold uppercase tracking-widest text-navy">Itinerario</h3>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="originCountry"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs font-bold uppercase tracking-wider text-muted-foreground">País Origen</FormLabel>
                          <Combobox
                            options={countries.map((c: any) => ({ value: c.name, label: c.name }))}
                            value={field.value}
                            onChange={field.onChange}
                            allowCustomValue
                            placeholder="Ej: Chile"
                            searchPlaceholder="Buscar o escribir país..."
                            className="bg-slate-50 border-slate-100"
                          />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="originCity"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Ciudad Origen</FormLabel>
                          <Combobox
                            options={cities.map((c: any) => ({ value: c.name, label: c.name }))}
                            value={field.value}
                            onChange={field.onChange}
                            allowCustomValue
                            placeholder="Ej: Santiago"
                            searchPlaceholder="Buscar o escribir ciudad..."
                            className="bg-slate-50 border-slate-100"
                          />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="destinationCountry"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs font-bold uppercase tracking-wider text-muted-foreground">País Destino *</FormLabel>
                          <Combobox
                            options={countries.map((c: any) => ({ value: c.name, label: c.name }))}
                            value={field.value}
                            onChange={field.onChange}
                            allowCustomValue
                            placeholder="Ej: Francia"
                            searchPlaceholder="Buscar o escribir país..."
                            className="bg-slate-50 border-slate-100"
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
                          <FormLabel className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Ciudad Destino *</FormLabel>
                          <Combobox
                            options={cities.map((c: any) => ({ value: c.name, label: c.name }))}
                            value={field.value}
                            onChange={field.onChange}
                            allowCustomValue
                            placeholder="Ej: París"
                            searchPlaceholder="Buscar o escribir ciudad..."
                            className="bg-slate-50 border-slate-100"
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
                        <FormLabel className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Duración (Días)</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} className="bg-slate-50 border-slate-100" />
                        </FormControl>
                        <FormMessage className="text-[10px]" />
                      </FormItem>
                    )}
                  />
                </div>

                <Separator className="bg-slate-100" />

                {/* Sección 3: Presupuesto */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center font-bold text-xs">3</span>
                    <h3 className="text-sm font-bold uppercase tracking-widest text-navy">Presupuesto Estimado</h3>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="budgetMin"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Mínimo ($)</FormLabel>
                          <FormControl>
                            <Input type="number" {...field} className="bg-slate-50 border-slate-100" />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="budgetMax"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Máximo ($)</FormLabel>
                          <FormControl>
                            <Input type="number" {...field} className="bg-slate-50 border-slate-100" />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                <Separator className="bg-slate-100" />

                {/* Sección 4: Descripción */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="w-8 h-8 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center font-bold text-xs">4</span>
                    <h3 className="text-sm font-bold uppercase tracking-widest text-navy">Descripción y Notas</h3>
                  </div>
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Textarea
                            placeholder="Detalles adicionales, requerimientos especiales, etc."
                            className="bg-slate-50 border-slate-100 min-h-[120px]"
                            {...field}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            </ScrollArea>

            <SheetFooter className="p-8 border-t border-slate-100 bg-slate-50/50">
              <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
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
            </SheetFooter>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}
