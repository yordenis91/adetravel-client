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
  Banknote, 
  CreditCard, 
  Building2, 
  FileText, 
  Globe,
  Loader2,
} from "lucide-react";
import { api } from "@/lib/api";
import { logActivity } from "@/lib/activityLogger";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";

const formSchema = z.object({
  requestId: z.string().min(1, "La solicitud es requerida"),
  quotationId: z.string().optional(),
  clientId: z.string().min(1, "El cliente es requerido"),
  paymentNumber: z.string(),
  amount: z.coerce.number().positive("El monto debe ser mayor a 0"),
  currency: z.string().min(1, "La moneda es requerida"),
  paymentDate: z.string().min(1, "La fecha es requerida"),
  method: z.string().min(1, "El método es requerido"),
  status: z.string().min(1, "El estado es requerido"),
  reference: z.string().optional(),
  notes: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface PaymentFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  payment?: any;
}

const PAYMENT_METHODS = [
  { value: "EFECTIVO", label: "Efectivo", icon: Banknote },
  { value: "TARJETA", label: "Tarjeta", icon: CreditCard },
  { value: "TRANSFERENCIA", label: "Transferencia", icon: Building2 },
  { value: "CHEQUE", label: "Cheque", icon: FileText },
  { value: "WEBPAY", label: "Webpay", icon: Globe },
];

export function PaymentFormDialog({ open, onOpenChange, payment }: PaymentFormDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isEditing = !!payment;

  const { data: requestsResponseData = [] } = useQuery({
    queryKey: ["requests"],
    queryFn: () => api.get('/requests'), // Cambiado de Request.list() a api.get para mantener consistencia con la otra página
  });

  const { data: quotationsResponseData = [] } = useQuery({
    queryKey: ["quotations"],
    queryFn: () => api.get('/quotations'),
  });

  const { data: clientsResponseData = [] } = useQuery({
    queryKey: ["clients"],
    queryFn: () => api.get('/clients'),
  });

  const requests = Array.isArray(requestsResponseData) ? requestsResponseData : (requestsResponseData as any)?.data || [];
  const quotations = Array.isArray(quotationsResponseData) ? quotationsResponseData : (quotationsResponseData as any)?.data || [];
  const clients = Array.isArray(clientsResponseData) ? clientsResponseData : (clientsResponseData as any)?.data || [];

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      requestId: "",
      quotationId: "",
      clientId: "",
      paymentNumber: "",
      amount: 0,
      currency: "CLP",
      paymentDate: format(new Date(), "yyyy-MM-dd"),
      method: "TRANSFERENCIA",
      status: "COMPLETADO",
      reference: "",
      notes: "",
    },
  });

  useEffect(() => {
    if (payment) {
      form.reset({
        requestId: payment.requestId || "",
        quotationId: payment.quotationId || "",
        clientId: payment.clientId || "",
        paymentNumber: payment.paymentNumber || "",
        amount: payment.amount || 0,
        currency: payment.currency || "CLP",
        paymentDate: payment.paymentDate || format(new Date(), "yyyy-MM-dd"),
        method: payment.method || "TRANSFERENCIA",
        status: payment.status || "COMPLETADO",
        reference: payment.reference || "",
        notes: payment.notes || "",
      });
    } else {
      const year = new Date().getFullYear();
      const month = String(new Date().getMonth() + 1).padStart(2, '0');
      const random = Math.floor(1000 + Math.random() * 9000);
      form.reset({
        requestId: "",
        quotationId: "",
        clientId: "",
        paymentNumber: `PAG-${year}-${month}-${random}`,
        amount: 0,
        currency: "CLP",
        paymentDate: format(new Date(), "yyyy-MM-dd"),
        method: "TRANSFERENCIA",
        status: "COMPLETADO",
        reference: "",
        notes: "",
      });
    }
  }, [payment, open, form]);

  const onSubmit = async (values: FormValues) => {
    try {
      if (isEditing) {
        await api.patch(`/payments/${payment.id}`, values);
        await logActivity({
          action: "PAGO_ACTUALIZADO",
          entityType: "Pago",
          entityId: payment.id,
          entityLabel: values.paymentNumber,
          description: `Se actualizó el registro de pago ${values.paymentNumber} por un monto de ${values.currency} ${values.amount}.`,
        });
        toast({ title: "Pago actualizado", description: "El registro de pago se ha actualizado correctamente." });
      } else {
        const newPayment = await api.post('/payments', values);
        await logActivity({
          action: "PAGO_REGISTRADO",
          entityType: "Pago",
          entityId: (newPayment as any).id,
          entityLabel: values.paymentNumber,
          description: `Se registró un nuevo pago (${values.paymentNumber}) de ${values.currency} ${values.amount}.`,
        });
        toast({ title: "Pago registrado", description: "El nuevo pago se ha registrado correctamente." });
      }
      queryClient.invalidateQueries({ queryKey: ["payments"] });
      onOpenChange(false);
    } catch (error) {
      console.error("Error saving payment:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo guardar el pago. Por favor, intente nuevamente.",
      });
    }
  };

  const selectedRequestId = form.watch("requestId");
  useEffect(() => {
    if (selectedRequestId) {
      const request = requests.find((r: any) => r.id === selectedRequestId);
      if (request) {
        form.setValue("clientId", request.clientId);
      }
    }
  }, [selectedRequestId, requests, form]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-[600px] overflow-y-auto">
        <SheetHeader className="mb-6">
          <SheetTitle className="text-2xl font-playfair font-bold">
            {isEditing ? "Editar Pago" : "Registrar Nuevo Pago"}
          </SheetTitle>
          <SheetDescription>
            Complete los detalles del pago recibido para la solicitud seleccionada.
          </SheetDescription>
        </SheetHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 pb-8">
            {/* Section 1: Vinculación */}
            <div className="space-y-4 p-4 rounded-xl bg-blue-50/50 border border-blue-100 dark:bg-blue-900/10 dark:border-blue-800/20">
              <h3 className="text-sm font-bold text-blue-700 dark:text-blue-400 uppercase tracking-wider flex items-center gap-2">
                <FileText className="w-4 h-4" /> Vinculación de Solicitud
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
                  name="quotationId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cotización (Opcional)</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccione cotización" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="none">Ninguna</SelectItem>
                          {quotations
                            .filter((q: any) => q.requestId === selectedRequestId)
                            .map((q: any) => (
                              <SelectItem key={q.id} value={q.id}>
                                {q.quotationNumber}
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
                name="clientId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cliente</FormLabel>
                    <Select disabled value={field.value}>
                      <FormControl>
                        <SelectTrigger className="bg-muted">
                          <SelectValue placeholder="El cliente se asignará automáticamente" />
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

            {/* Section 2: Monto y Método */}
            <div className="space-y-4 p-4 rounded-xl bg-emerald-50/50 border border-emerald-100 dark:bg-emerald-900/10 dark:border-emerald-800/20">
              <h3 className="text-sm font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider flex items-center gap-2">
                <Banknote className="w-4 h-4" /> Monto y Método
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Monto *</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-bold">
                            {form.watch("currency") === "CLP" ? "$" : "US$"}
                          </span>
                          <Input type="number" className="pl-10 text-lg font-bold" {...field} />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="currency"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Moneda *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccione moneda" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="CLP">CLP - Peso Chileno</SelectItem>
                          <SelectItem value="USD">USD - Dólar Americano</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="paymentDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Fecha de Pago *</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="method"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Método de Pago *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccione método" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {PAYMENT_METHODS.map((method) => {
                            const Icon = method.icon;
                            return (
                              <SelectItem key={method.value} value={method.value}>
                                <div className="flex items-center gap-2">
                                  <Icon className="w-4 h-4 text-muted-foreground" />
                                  <span>{method.label}</span>
                                </div>
                              </SelectItem>
                            );
                          })}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Section 3: Estado y Referencia */}
            <div className="space-y-4 p-4 rounded-xl bg-amber-50/50 border border-amber-100 dark:bg-amber-900/10 dark:border-amber-800/20">
              <h3 className="text-sm font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider flex items-center gap-2">
                <Globe className="w-4 h-4" /> Estado y Referencia
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Estado *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccione estado" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="PENDIENTE">PENDIENTE</SelectItem>
                          <SelectItem value="COMPLETADO">COMPLETADO</SelectItem>
                          <SelectItem value="CANCELADO">CANCELADO</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="reference"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Referencia / N° Transacción</FormLabel>
                      <FormControl>
                        <Input placeholder="Ej: Transf #123456" {...field} />
                      </FormControl>
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
                    <FormLabel>Notas adicionales</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Observaciones internas sobre el pago..." 
                        className="resize-none"
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
                    {isEditing ? "Actualizar Registro" : "Registrar Pago"}
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
