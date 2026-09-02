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
import { Combobox } from "@/components/ui/combobox";
import { Textarea } from "@/components/ui/textarea";
import {
  Banknote, 
  CreditCard, 
  Building2, 
  FileText, 
  Globe,
  Loader2,
} from "lucide-react";
import { api, getErrorMessage } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";

const formSchema = z.object({
  requestId: z.string().min(1, "La solicitud es requerida"),
  quotationId: z.string().optional().nullable(),
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

  const { data: paymentsResponse = [] } = useQuery({
    queryKey: ["payments"],
    queryFn: () => api.get('/payments'),
    enabled: open,
  });

  const { data: requestsResponse = [] } = useQuery({
    queryKey: ["requests"],
    queryFn: () => api.get('/requests'),
    enabled: open,
  });

  const { data: quotationsResponse = [] } = useQuery({
    queryKey: ["quotations"],
    queryFn: () => api.get('/quotations'),
    enabled: open,
  });

  const { data: clientsResponse = [] } = useQuery({
    queryKey: ["clients"],
    queryFn: () => api.get('/clients'),
    enabled: open,
  });

  const allPayments = Array.isArray(paymentsResponse) ? paymentsResponse : (paymentsResponse as any)?.data || [];
  const requests = Array.isArray(requestsResponse) ? requestsResponse : (requestsResponse as any)?.data || [];
  const quotations = Array.isArray(quotationsResponse) ? quotationsResponse : (quotationsResponse as any)?.data || [];
  const clients = Array.isArray(clientsResponse) ? clientsResponse : (clientsResponse as any)?.data || [];

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
        quotationId: payment.quotationId || "none",
        clientId: payment.clientId || "",
        paymentNumber: payment.paymentNumber || "",
        amount: payment.amount || 0,
        currency: payment.currency || "CLP",
        paymentDate: payment.paymentDate ? payment.paymentDate.split("T")[0] : format(new Date(), "yyyy-MM-dd"),
        method: payment.method || "TRANSFERENCIA",
        status: payment.status || "COMPLETADO",
        reference: payment.reference || "",
        notes: payment.notes || "",
      });
    } else if (open && allPayments) {
      const year = new Date().getFullYear();
      const month = String(new Date().getMonth() + 1).padStart(2, '0');
      const nextNumber = (allPayments.length + 1).toString().padStart(4, '0');
      
      form.reset({
        requestId: "",
        quotationId: "",
        clientId: "",
        paymentNumber: `PAG-${year}-${month}-${nextNumber}`, // El backend igual lo recalcula seguro
        amount: 0,
        currency: "CLP",
        paymentDate: format(new Date(), "yyyy-MM-dd"),
        method: "TRANSFERENCIA",
        status: "PENDIENTE",
        reference: "",
        notes: "",
      });
    }
  }, [payment, open, allPayments, form]);

  const onSubmit = async (values: FormValues) => {
    try {
      // Limpieza de payload para Prisma (UUID validación)
      const payload: any = { ...values };
      if (payload.quotationId === "none" || payload.quotationId === "") {
        payload.quotationId = null;
      }

      if (isEditing) {
        await api.patch(`/payments/${payment.id}`, payload);
        toast({ title: "Pago actualizado", description: "El registro de pago se ha actualizado correctamente." });
      } else {
        await api.post('/payments', payload);
        toast({ title: "Pago registrado", description: "El nuevo pago se ha registrado correctamente." });
      }
      queryClient.invalidateQueries({ queryKey: ["payments"] });
      onOpenChange(false);
    } catch (error) {
      console.error("Error saving payment:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: getErrorMessage(error, "No se pudo guardar el pago. Asegúrese de que los datos sean correctos."),
      });
    }
  };

  const selectedRequestId = form.watch("requestId");
  
  useEffect(() => {
    if (selectedRequestId && !isEditing) {
      const request = requests.find((r: any) => r.id === selectedRequestId);
      if (request) {
        form.setValue("clientId", request.clientId);
        
        // Auto-select accepted quotation (Soporta mayúsculas y capitalizado)
        const acceptedQuotation = quotations.find(
          (q: any) => q.requestId === selectedRequestId && (q.status === "Aceptada" || q.status === "ACEPTADA")
        );
        
        if (acceptedQuotation) {
          form.setValue("quotationId", acceptedQuotation.id);
          form.setValue("amount", acceptedQuotation.total || 0);
          form.setValue("currency", acceptedQuotation.currency || "CLP");
          
          toast({
            title: "Cotización vinculada",
            description: `Se seleccionó la cotización ${acceptedQuotation.quotationNumber} y se cargó el monto total.`,
          });
        } else {
          form.setValue("quotationId", "none");
        }
      }
    }
  }, [selectedRequestId, requests, quotations, form, isEditing, toast]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-[600px] overflow-y-auto">
        <SheetHeader className="mb-6 mt-4">
          <SheetTitle className="text-2xl font-playfair font-bold text-navy">
            {isEditing ? "Editar Pago" : "Registrar Nuevo Pago"}
          </SheetTitle>
          <SheetDescription>
            Complete los detalles del pago recibido para la solicitud seleccionada.
          </SheetDescription>
        </SheetHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 pb-8">
            {/* Section 1: Vinculación */}
            <div className="space-y-4 p-5 rounded-xl bg-blue-50/50 border border-blue-100">
              <h3 className="text-xs font-bold text-blue-700 uppercase tracking-wider flex items-center gap-2">
                <FileText className="w-4 h-4" /> Vinculación de Solicitud
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="requestId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-bold text-navy">Solicitud *</FormLabel>
                      <Combobox
                        options={requests.map((req: any) => ({ value: req.id, label: `${req.requestNumber} | ${req.destinationCity || ""}` }))}
                        value={field.value}
                        onChange={field.onChange}
                        disabled={isEditing}
                        placeholder="Seleccione solicitud"
                        searchPlaceholder="Buscar solicitud..."
                        emptyText="Sin solicitudes."
                        className="bg-white"
                      />
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="quotationId"
                  render={({ field }) => {
                    const selectedQuo = quotations.find((q: any) => q.id === field.value);
                    return (
                      <FormItem>
                        <FormLabel className="text-xs font-bold text-navy">Cotización (Opcional)</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value || "none"}>
                          <FormControl>
                            <SelectTrigger className="bg-white">
                              <SelectValue placeholder="Seleccione cotización" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="none">Ninguna</SelectItem>
                            {quotations
                              .filter((q: any) => q.requestId === selectedRequestId)
                              .map((q: any) => (
                                <SelectItem key={q.id} value={q.id}>
                                  {q.quotationNumber} {["Aceptada", "ACEPTADA"].includes(q.status) ? "✓" : ""}
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                        {selectedQuo && (
                          <div className="mt-1 flex items-center justify-between text-[10px] font-bold px-2 py-1 bg-white rounded-md border border-blue-100">
                            <span className="text-blue-700">{selectedQuo.quotationNumber}</span>
                            <span className="text-emerald-600">
                              {new Intl.NumberFormat("es-CL", { style: "currency", currency: selectedQuo.currency || "CLP" }).format(selectedQuo.total || 0)}
                            </span>
                          </div>
                        )}
                        <FormMessage />
                      </FormItem>
                    );
                  }}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="clientId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-bold text-navy">Cliente</FormLabel>
                      <Select disabled value={field.value}>
                        <FormControl>
                          <SelectTrigger className="bg-slate-100">
                            <SelectValue placeholder="Automático" />
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

                <FormField
                  control={form.control}
                  name="paymentNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-bold text-navy">N° de Pago</FormLabel>
                      <FormControl>
                        <Input {...field} disabled className="bg-slate-100 font-mono text-xs" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Section 2: Monto y Método */}
            <div className="space-y-4 p-5 rounded-xl bg-emerald-50/50 border border-emerald-100">
              <h3 className="text-xs font-bold text-emerald-700 uppercase tracking-wider flex items-center gap-2">
                <Banknote className="w-4 h-4" /> Monto y Método
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-bold text-navy">Monto *</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-bold">
                            {form.watch("currency") === "CLP" ? "$" : "US$"}
                          </span>
                          <Input type="number" className="pl-10 text-lg font-bold bg-white" {...field} />
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
                      <FormLabel className="text-xs font-bold text-navy">Moneda *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="bg-white">
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
                      <FormLabel className="text-xs font-bold text-navy">Fecha de Pago *</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} className="bg-white" />
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
                      <FormLabel className="text-xs font-bold text-navy">Método de Pago *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="bg-white">
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
            <div className="space-y-4 p-5 rounded-xl bg-amber-50/50 border border-amber-100">
              <h3 className="text-xs font-bold text-amber-700 uppercase tracking-wider flex items-center gap-2">
                <Globe className="w-4 h-4" /> Estado y Referencia
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-bold text-navy">Estado *</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        value={field.value}
                        disabled={isEditing} // 🛡️ Bloqueamos el cambio de estado en edición directa
                      >
                        <FormControl>
                          <SelectTrigger className={isEditing ? "bg-slate-100" : "bg-white"}>
                            <SelectValue placeholder="Seleccione estado" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="PENDIENTE">PENDIENTE</SelectItem>
                          <SelectItem value="COMPLETADO">COMPLETADO</SelectItem>
                          <SelectItem value="CANCELADO">CANCELADO</SelectItem>
                        </SelectContent>
                      </Select>
                      {isEditing && <p className="text-[10px] text-muted-foreground">Usa la tabla para cambiar el estado</p>}
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="reference"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-bold text-navy">Ref / Transacción</FormLabel>
                      <FormControl>
                        <Input placeholder="Ej: Transf #123456" {...field} className="bg-white" />
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
                    <FormLabel className="text-xs font-bold text-navy">Notas adicionales</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Observaciones internas sobre el pago..." 
                        className="resize-none bg-white min-h-[80px]"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <SheetFooter className="pt-2">
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