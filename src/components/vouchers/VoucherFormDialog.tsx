import React, { useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue } from "@/components/ui/select";
import { Combobox } from "@/components/ui/combobox";
import { useProviderOptions } from "@/hooks/useProviderOptions";
import { useRemoteOptions } from "@/hooks/useRemoteOptions";
import { Textarea } from "@/components/ui/textarea";
import {
  Ticket, 
  User, 
  Calendar, 
  MapPin, 
  Building2, 
  Plus, 
  Trash2,
  Loader2,
  Hash
} from "lucide-react";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { normalizeServiceType, SERVICE_TYPE_SHORT_LABELS, UNIFIED_SERVICE_TYPES } from "@/lib/service-types";

import { StickyNote } from "lucide-react";
import { FormSheet, FormSheetBody, FormSheetFooter, FormSection } from "@/components/ui/form-sheet";
const formSchema = z.object({
  requestId: z.string().min(1, "La solicitud es requerida"),
  clientId: z.string().min(1, "El cliente es requerido"),
  providerId: z.string().min(1, "El proveedor es requerido"),
  voucherNumber: z.string(),
  serviceType: z.string().min(1, "El tipo de servicio es requerido"),
  serviceName: z.string().min(1, "El nombre del servicio es requerido"),
  serviceDetails: z.string().optional(),
  checkIn: z.string().min(1, "La fecha de inicio es requerida"),
  checkOut: z.string().min(1, "La fecha de fin es requerida"),
  destination: z.string().min(1, "El destino es requerido"),
  passengerNames: z.array(z.string()).min(1, "Debe agregar al menos un pasajero"),
  confirmationCode: z.string().optional(),
  status: z.string().min(1, "El estado es requerido"),
  amount: z.coerce.number().optional(),
  currency: z.string().optional(),
  notes: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface VoucherFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  voucher?: any;
}


export function VoucherFormDialog({ open, onOpenChange, voucher }: VoucherFormDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isEditing = !!voucher;

  // Solicitudes buscadas en el servidor (antes solo las 20 más recientes); la elegida se pide por id.
  const requestOptions = useRemoteOptions(
    "requests",
    "/requests",
    (req: any) => ({ value: req.id, label: `${req.requestNumber} | ${req.destinationCity || ""}` }),
    { enabled: open }
  );

  const providerOptions = useProviderOptions(open);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      requestId: "",
      clientId: "",
      providerId: "",
      voucherNumber: "",
      serviceType: "ALOJAMIENTO",
      serviceName: "",
      serviceDetails: "",
      checkIn: format(new Date(), "yyyy-MM-dd"),
      checkOut: format(new Date(), "yyyy-MM-dd"),
      destination: "",
      passengerNames: [""],
      confirmationCode: "",
      status: "BORRADOR",
      amount: 0,
      currency: "CLP",
      notes: "",
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control as any,
    name: "passengerNames" as any
  });

  useEffect(() => {
    if (voucher) {
      form.reset({
        requestId: voucher.requestId || "",
        clientId: voucher.clientId || "",
        providerId: voucher.providerId || "",
        voucherNumber: voucher.voucherNumber || "",
        serviceType: voucher.serviceType ? normalizeServiceType(voucher.serviceType) : "ALOJAMIENTO",
        serviceName: voucher.serviceName || "",
        serviceDetails: voucher.serviceDetails || "",
        checkIn: voucher.checkIn || format(new Date(), "yyyy-MM-dd"),
        checkOut: voucher.checkOut || format(new Date(), "yyyy-MM-dd"),
        destination: voucher.destination || "",
        passengerNames: voucher.passengerNames || [""],
        confirmationCode: voucher.confirmationCode || "",
        status: voucher.status || "BORRADOR",
        amount: voucher.amount || 0,
        currency: voucher.currency || "CLP",
        notes: voucher.notes || "",
      });
    } else {
      form.reset({
        requestId: "",
        clientId: "",
        providerId: "",
        voucherNumber: "Se asigna al guardar", // lo genera la API (numeración correlativa)
        serviceType: "ALOJAMIENTO",
        serviceName: "",
        serviceDetails: "",
        checkIn: format(new Date(), "yyyy-MM-dd"),
        checkOut: format(new Date(), "yyyy-MM-dd"),
        destination: "",
        passengerNames: [""],
        confirmationCode: "",
        status: "BORRADOR",
        amount: 0,
        currency: "CLP",
        notes: "",
      });
    }
  }, [voucher, open, form]);

  const onSubmit = async (values: FormValues) => {
    try {
      if (isEditing) {
        await api.patch(`/vouchers/${voucher.id}`, values);
        toast({ title: "Voucher actualizado", description: "El registro del voucher se ha actualizado correctamente." });
      } else {
        await api.post('/vouchers', values);
        toast({ title: "Voucher creado", description: "El nuevo voucher se ha registrado correctamente." });
      }
      queryClient.invalidateQueries({ queryKey: ["vouchers"] });
      onOpenChange(false);
    } catch (error) {
      console.error("Error saving voucher:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo guardar el voucher. Por favor, intente nuevamente.",
      });
    }
  };

  const selectedRequestId = form.watch("requestId");
  const { data: selectedRequestResponse } = useQuery({
    queryKey: ["requests", selectedRequestId],
    queryFn: () => api.get(`/requests/${selectedRequestId}`),
    enabled: open && !!selectedRequestId,
  });
  const selectedRequest = (selectedRequestResponse as any)?.data;

  // Cliente y destino salen de la solicitud, pero solo al elegir otra: al editar no se pisa el
  // destino ya guardado en el voucher.
  useEffect(() => {
    if (selectedRequest && (!isEditing || selectedRequest.id !== voucher?.requestId)) {
      form.setValue("clientId", selectedRequest.clientId);
      form.setValue("destination", selectedRequest.destinationCity || "");
    }
  }, [selectedRequest, form, isEditing, voucher?.requestId]);

  const clientLabel = (() => {
    const c = selectedRequest?.client ?? voucher?.client;
    return c ? `${c.firstName} ${c.lastName ?? ""}`.trim() : "";
  })();

  return (
    <FormSheet open={open} onOpenChange={onOpenChange} title={isEditing ? "Editar Voucher" : "Generar Nuevo Voucher"} description="Complete los detalles del servicio para emitir el voucher de confirmación." widthClassName="sm:max-w-[700px]">

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex min-h-0 flex-1 flex-col">
          <FormSheetBody>
            {/* Section 1: Vinculación */}
            <FormSection tone="slate" icon={Hash} title="Vinculación de Servicio">
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="requestId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-bold text-navy">Solicitud *</FormLabel>
                      <Combobox
                        options={requestOptions.options}
                        onSearchChange={requestOptions.onSearchChange}
                        loading={requestOptions.loading}
                        selectedLabel={(selectedRequest ?? voucher?.request)?.requestNumber}
                        value={field.value}
                        onChange={field.onChange}
                        placeholder="Seleccione solicitud"
                        searchPlaceholder="Buscar solicitud..."
                        emptyText="Sin solicitudes."
                      />
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="clientId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-bold text-navy">Cliente</FormLabel>
                      <FormControl>
                        <Input disabled value={clientLabel} placeholder="Asignado automáticamente" className="bg-muted" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="providerId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-bold text-navy">Proveedor del Servicio *</FormLabel>
                    <Combobox
                      options={providerOptions.optionsFor(field.value)}
                      value={field.value}
                      onChange={field.onChange}
                      placeholder="Seleccione el proveedor / hotel / operador"
                      searchPlaceholder="Buscar proveedor..."
                      emptyText="Sin proveedores."
                    />
                    <FormMessage />
                  </FormItem>
                )}
              />
            </FormSection>

            {/* Section 2: Detalles del Servicio */}
            <FormSection tone="amber" icon={Ticket} title="Detalles del Servicio">
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="serviceType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-bold text-navy">Tipo *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Tipo" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {UNIFIED_SERVICE_TYPES.map((type) => (
                            <SelectItem key={type} value={type}>{SERVICE_TYPE_SHORT_LABELS[type]}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="serviceName"
                  render={({ field }) => (
                    <FormItem className="col-span-2">
                      <FormLabel className="text-xs font-bold text-navy">Nombre del Servicio / Hotel *</FormLabel>
                      <FormControl>
                        <Input placeholder="Ej: Hotel Hyatt Centric Las Condes" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="checkIn"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-bold text-navy">Fecha Inicio / Check-in *</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="checkOut"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-bold text-navy">Fecha Fin / Check-out *</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="destination"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-bold text-navy">Destino *</FormLabel>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" />
                      <FormControl>
                        <Input className="pl-10" placeholder="Ciudad, País" {...field} />
                      </FormControl>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="serviceDetails"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-bold text-navy">Descripción / Detalles</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Ej: Habitación King Superior, Desayuno incluido..." 
                        className="resize-none h-20"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </FormSection>

            {/* Section 3: Pasajeros */}
            <FormSection tone="blue" icon={User} title="Pasajeros" action={<Button 
                  type="button" 
                  variant="outline" 
                  size="sm" 
                  className="h-9 gap-1 bg-white text-xs font-bold"
                  onClick={() => append("")}
                >
                  <Plus className="w-3 h-3" /> Añadir Pasajero
                </Button>}>
              
              <div className="space-y-3">
                {fields.map((field, index) => (
                  <div key={field.id} className="flex items-center gap-2">
                    <FormField
                      control={form.control}
                      name={`passengerNames.${index}` as any}
                      render={({ field }) => (
                        <FormItem className="flex-1">
                          <FormControl>
                            <Input placeholder="Nombre Completo del Pasajero" aria-label={`Pasajero ${index + 1}`} {...field} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    {fields.length > 1 && (
                      <Button 
                        type="button" 
                        variant="ghost" 
                        size="icon" aria-label="Quitar pasajero" 
                        className="h-10 w-10 text-muted-foreground hover:text-destructive"
                        onClick={() => remove(index)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                ))}
                {form.formState.errors.passengerNames && (
                  <p className="text-xs font-medium text-destructive">
                    {form.formState.errors.passengerNames.message as string}
                  </p>
                )}
              </div>
            </FormSection>

            <FormSection tone="violet" icon={StickyNote} title="Código y notas">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="confirmationCode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-bold text-navy">Código de Confirmación / Localizador</FormLabel>
                      <FormControl>
                        <Input placeholder="Ej: ABC123XYZ" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-bold text-navy">Estado del Voucher *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value} disabled={isEditing}>
                        <FormControl>
                          <SelectTrigger className={isEditing ? "bg-slate-100" : "bg-white"}>
                            <SelectValue placeholder="Seleccione estado" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="BORRADOR">BORRADOR</SelectItem>
                          <SelectItem value="EMITIDO">EMITIDO</SelectItem>
                          <SelectItem value="CANCELADO">CANCELADO</SelectItem>
                        </SelectContent>
                      </Select>
                      {isEditing && <p className="text-[10px] text-muted-foreground mt-1">Usa la tabla para cambiar el estado</p>}
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-bold text-navy">Notas Internas</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Observaciones adicionales..." 
                        className="resize-none h-full min-h-[110px]"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            </FormSection>

          </FormSheetBody>
            <FormSheetFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button 
                type="submit" 
                className="bg-navy hover:bg-navy-light text-white font-bold"
                disabled={form.formState.isSubmitting}
              >
                {form.formState.isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Procesando...
                  </>
                ) : (
                  <>
                    {isEditing ? "Actualizar Voucher" : "Generar y Guardar Voucher"}
                  </>
                )}
              </Button>
            </FormSheetFooter>
          </form>
        </Form>
      </FormSheet>
  );
}
