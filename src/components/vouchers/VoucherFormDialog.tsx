import React, { useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle, 
  SheetDescription,
  SheetFooter
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { logActivity } from "@/lib/activityLogger";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";

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

const SERVICE_TYPES = [
  "HOTEL", "AÉREO", "TOUR", "TRANSFER", "SEGURO", "RESTAURANT", "OTRO"
];

export function VoucherFormDialog({ open, onOpenChange, voucher }: VoucherFormDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isEditing = !!voucher;

  const { data: requestsResponseData = [] } = useQuery({
    queryKey: ["requests"],
    queryFn: () => api.get('/requests'),
  });

  const { data: clientsResponseData = [] } = useQuery({
    queryKey: ["clients"],
    queryFn: () => api.get('/clients'),
  });

  const { data: providersResponseData = [] } = useQuery({
    queryKey: ["providers"],
    queryFn: () => api.get('/providers'),
  });

  const requests = Array.isArray(requestsResponseData) ? requestsResponseData : (requestsResponseData as any)?.data || [];
  const clients = Array.isArray(clientsResponseData) ? clientsResponseData : (clientsResponseData as any)?.data || [];
  const providers = Array.isArray(providersResponseData) ? providersResponseData : (providersResponseData as any)?.data || [];

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      requestId: "",
      clientId: "",
      providerId: "",
      voucherNumber: "",
      serviceType: "HOTEL",
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
    control: form.control,
    name: "passengerNames" as any
  });

  useEffect(() => {
    if (voucher) {
      form.reset({
        requestId: voucher.requestId || "",
        clientId: voucher.clientId || "",
        providerId: voucher.providerId || "",
        voucherNumber: voucher.voucherNumber || "",
        serviceType: voucher.serviceType || "HOTEL",
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
      const year = new Date().getFullYear();
      const month = String(new Date().getMonth() + 1).padStart(2, '0');
      const random = Math.floor(1000 + Math.random() * 9000);
      form.reset({
        requestId: "",
        clientId: "",
        providerId: "",
        voucherNumber: `VCH-${year}-${month}-${random}`,
        serviceType: "HOTEL",
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
        await logActivity({
          action: "VOUCHER_ACTUALIZADO",
          entityType: "Voucher",
          entityId: voucher.id,
          entityLabel: values.voucherNumber,
          description: `Se actualizó el voucher ${values.voucherNumber} para el servicio ${values.serviceName}.`,
        });
        toast({ title: "Voucher actualizado", description: "El registro del voucher se ha actualizado correctamente." });
      } else {
        const newVoucher = await api.post('/vouchers', values);
        await logActivity({
          action: "VOUCHER_EMITIDO",
          entityType: "Voucher",
          entityId: (newVoucher as any).id,
          entityLabel: values.voucherNumber,
          description: `Se emitió un nuevo voucher (${values.voucherNumber}) para ${values.serviceName}.`,
        });
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
  useEffect(() => {
    if (selectedRequestId) {
      const request = requests.find((r: any) => r.id === selectedRequestId);
      if (request) {
        form.setValue("clientId", request.clientId);
        form.setValue("destination", request.destinationCity || "");
      }
    }
  }, [selectedRequestId, requests, form]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-[700px] overflow-y-auto">
        <SheetHeader className="mb-6">
          <SheetTitle className="text-2xl font-playfair font-bold">
            {isEditing ? "Editar Voucher" : "Generar Nuevo Voucher"}
          </SheetTitle>
          <SheetDescription>
            Complete los detalles del servicio para emitir el voucher de confirmación.
          </SheetDescription>
        </SheetHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 pb-8">
            {/* Section 1: Vinculación */}
            <div className="space-y-4 p-4 rounded-xl bg-navy/5 border border-navy/10">
              <h3 className="text-sm font-bold text-navy uppercase tracking-wider flex items-center gap-2">
                <Hash className="w-4 h-4" /> Vinculación de Servicio
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="requestId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Solicitud *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccione solicitud" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {requests.map((req: any) => (
                            <SelectItem key={req.id} value={req.id}>
                              {req.requestNumber} | {req.destinationCity}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="clientId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cliente</FormLabel>
                      <Select disabled value={field.value}>
                        <FormControl>
                          <SelectTrigger className="bg-muted">
                            <SelectValue placeholder="Asignado automáticamente" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {clients.map((client: any) => (
                            <SelectItem key={client.id} value={client.id}>
                              {client.firstName} {client.lastName}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
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
                    <FormLabel>Proveedor del Servicio *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccione el proveedor / hotel / operador" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {providers.map((provider: any) => (
                          <SelectItem key={provider.id} value={provider.id}>
                            {provider.fantasyName || provider.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Section 2: Detalles del Servicio */}
            <div className="space-y-4 p-4 rounded-xl bg-gold/5 border border-gold/10">
              <h3 className="text-sm font-bold text-gold-dark uppercase tracking-wider flex items-center gap-2">
                <Ticket className="w-4 h-4" /> Detalles del Servicio
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="serviceType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipo *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Tipo" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {SERVICE_TYPES.map((type) => (
                            <SelectItem key={type} value={type}>{type}</SelectItem>
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
                      <FormLabel>Nombre del Servicio / Hotel *</FormLabel>
                      <FormControl>
                        <Input placeholder="Ej: Hotel Hyatt Centric Las Condes" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="checkIn"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Fecha Inicio / Check-in *</FormLabel>
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
                      <FormLabel>Fecha Fin / Check-out *</FormLabel>
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
                    <FormLabel>Destino *</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input className="pl-10" placeholder="Ciudad, País" {...field} />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="serviceDetails"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descripción / Detalles</FormLabel>
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
            </div>

            {/* Section 3: Pasajeros */}
            <div className="space-y-4 p-4 rounded-xl bg-blue-50/50 border border-blue-100 dark:bg-blue-900/10 dark:border-blue-800/20">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-blue-700 dark:text-blue-400 uppercase tracking-wider flex items-center gap-2">
                  <User className="w-4 h-4" /> Pasajeros
                </h3>
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm" 
                  className="h-8 text-[10px] font-bold uppercase gap-1"
                  onClick={() => append("")}
                >
                  <Plus className="w-3 h-3" /> Añadir Pasajero
                </Button>
              </div>
              
              <div className="space-y-3">
                {fields.map((field, index) => (
                  <div key={field.id} className="flex items-center gap-2">
                    <FormField
                      control={form.control}
                      name={`passengerNames.${index}` as any}
                      render={({ field }) => (
                        <FormItem className="flex-1">
                          <FormControl>
                            <Input placeholder="Nombre Completo del Pasajero" {...field} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    {fields.length > 1 && (
                      <Button 
                        type="button" 
                        variant="ghost" 
                        size="icon" 
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
            </div>

            {/* Section 4: Otros Detalles */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="confirmationCode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Código de Confirmación / Localizador</FormLabel>
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
                      <FormLabel>Estado del Voucher *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccione estado" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="BORRADOR">BORRADOR</SelectItem>
                          <SelectItem value="EMITIDO">EMITIDO</SelectItem>
                          <SelectItem value="CANCELADO">CANCELADO</SelectItem>
                        </SelectContent>
                      </Select>
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
                    <FormLabel>Notas Internas</FormLabel>
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

            <SheetFooter className="pt-4">
              <Button 
                type="submit" 
                className="w-full bg-navy hover:bg-navy-light text-white font-bold h-12"
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
            </SheetFooter>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}
