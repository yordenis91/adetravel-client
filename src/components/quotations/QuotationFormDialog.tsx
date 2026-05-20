import React, { useEffect, useState, useMemo } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/lib/api";
import { logActivity } from "@/lib/activityLogger";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Plus, Trash2, X, Calculator, ReceiptText } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { cn } from "@/lib/utils";

const quotationSchema = z.object({
  requestId: z.string().min(1, "Solicitud es requerida"),
  clientId: z.string().min(1, "Cliente es requerido"),
  quotationNumber: z.string().min(1),
  validUntil: z.string().min(1, "Fecha de validez es requerida"),
  status: z.string().default("Borrador"),
  currency: z.string().default("CLP"),
  taxPercentage: z.number().default(19),
  discount: z.number().default(0),
  notes: z.string().optional(),
  termsAndConditions: z.string().optional(),
});

type QuotationFormValues = z.infer<typeof quotationSchema>;

interface LineItem {
  id: string;
  service: string;
  description: string;
  quantity: number;
  unitPrice: number;
}

interface QuotationFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  quotation?: any;
  onSuccess: () => void;
}

export function QuotationFormDialog({ open, onOpenChange, quotation, onSuccess }: QuotationFormDialogProps) {
  const { toast } = useToast();
  const isEditing = !!quotation;
  const [items, setItems] = useState<LineItem[]>([]);

  const { data: requestsResponseData = [] } = useQuery({
    queryKey: ["requests"],
    queryFn: () => api.get('/requests'),
    enabled: open,
  });

  const { data: clientsResponseData = [] } = useQuery({
    queryKey: ["clients"],
    queryFn: () => api.get('/clients'),
    enabled: open,
  });

  const requests = Array.isArray(requestsResponseData) ? requestsResponseData : (requestsResponseData as any)?.data || [];
  const clients = Array.isArray(clientsResponseData) ? clientsResponseData : (clientsResponseData as any)?.data || [];

  const form = useForm<QuotationFormValues>({
    resolver: zodResolver(quotationSchema),
    defaultValues: {
      requestId: "",
      clientId: "",
      quotationNumber: "",
      validUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      status: "Borrador",
      currency: "CLP",
      taxPercentage: 19,
      discount: 0,
      notes: "",
      termsAndConditions: "Esta cotización tiene una validez de 7 días. Precios sujetos a cambios según disponibilidad al momento de la reserva.",
    },
  });

  const selectedRequestId = form.watch("requestId");
  const currency = form.watch("currency");
  const discount = form.watch("discount");
  const taxPercentage = form.watch("taxPercentage");

  useEffect(() => {
    if (selectedRequestId && !isEditing) {
      const request = requests.find(r => r.id === selectedRequestId);
      if (request) {
        form.setValue("clientId", request.clientId);
      }
    }
  }, [selectedRequestId, requests, form, isEditing]);

  useEffect(() => {
    if (quotation) {
      form.reset({
        requestId: quotation.requestId,
        clientId: quotation.clientId,
        quotationNumber: quotation.quotationNumber,
        validUntil: quotation.validUntil,
        status: quotation.status,
        currency: quotation.currency,
        taxPercentage: quotation.taxPercentage || 19,
        discount: quotation.discount || 0,
        notes: quotation.notes || "",
        termsAndConditions: quotation.termsAndConditions || "",
      });
      
      try {
        const parsedItems = quotation.items.map((i: string) => JSON.parse(i));
        setItems(parsedItems);
      } catch (e) {
        console.error("Error parsing items", e);
        setItems([]);
      }
    } else {
      const date = new Date();
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const random = Math.floor(1000 + Math.random() * 9000);
      const qNum = `COTIZ-${year}-${month}-${random}`;
      
      form.reset({
        requestId: "",
        clientId: "",
        quotationNumber: qNum,
        validUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
        status: "Borrador",
        currency: "CLP",
        taxPercentage: 19,
        discount: 0,
        notes: "",
        termsAndConditions: "Esta cotización tiene una validez de 7 días. Precios sujetos a cambios según disponibilidad al momento de la reserva.",
      });
      setItems([{ id: crypto.randomUUID(), service: "", description: "", quantity: 1, unitPrice: 0 }]);
    }
  }, [quotation, form, open]);

  const addItem = () => {
    setItems([...items, { id: crypto.randomUUID(), service: "", description: "", quantity: 1, unitPrice: 0 }]);
  };

  const removeItem = (id: string) => {
    if (items.length > 1) {
      setItems(items.filter(i => i.id !== id));
    }
  };

  const updateItem = (id: string, field: keyof LineItem, value: any) => {
    setItems(items.map(i => i.id === id ? { ...i, [field]: value } : i));
  };

  const totals = useMemo(() => {
    const subtotal = items.reduce((acc, item) => acc + (item.quantity * item.unitPrice), 0);
    const taxAmount = Math.round((subtotal - discount) * (taxPercentage / 100));
    const total = subtotal - discount + taxAmount;
    return { subtotal, taxAmount, total };
  }, [items, discount, taxPercentage]);

  const onSubmit = async (values: QuotationFormValues) => {
    try {
      const payload = {
        ...values,
        items: items.map(i => JSON.stringify({ ...i, total: i.quantity * i.unitPrice })),
        subtotal: totals.subtotal,
        taxAmount: totals.taxAmount,
        total: totals.total,
      };

      if (isEditing) {
        await api.patch(`/quotations/${quotation.id}`, payload);
        await logActivity({
          action: "COTIZACION_ACTUALIZADA",
          entityType: "Cotización",
          entityId: quotation.id,
          entityLabel: values.quotationNumber,
          description: `Se actualizó la cotización ${values.quotationNumber} con estado ${values.status}.`,
        });
        toast({ title: "Cotización actualizada", description: "El documento ha sido guardado." });
      } else {
        const newQuotation = await api.post('/quotations', payload);
        await logActivity({
          action: "COTIZACION_CREADA",
          entityType: "Cotización",
          entityId: (newQuotation as any).id,
          entityLabel: values.quotationNumber,
          description: `Se generó una nueva cotización: ${values.quotationNumber}.`,
        });
        toast({ title: "Cotización creada", description: "El documento ha sido generado." });
      }
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error(error);
      toast({ title: "Error", description: "No se pudo guardar la cotización.", variant: "destructive" });
    }
  };

  const selectedClient = clients.find(c => c.id === form.watch("clientId"));

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-[800px] p-0 flex flex-col">
        <SheetHeader className="p-8 pb-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-navy flex items-center justify-center text-white">
              <ReceiptText className="w-5 h-5" />
            </div>
            <div>
              <SheetTitle className="text-2xl font-playfair font-bold text-navy">
                {isEditing ? "Editar Cotización" : "Nueva Cotización"}
              </SheetTitle>
              <SheetDescription>
                Genera un documento formal de propuesta para el cliente.
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex-1 flex flex-col overflow-hidden">
            <ScrollArea className="flex-1 px-8">
              <div className="space-y-8 pb-10">
                {/* 1. Datos Generales */}
                <div className="space-y-6">
                  <div className="flex items-center gap-2">
                    <span className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xs">1</span>
                    <h3 className="text-sm font-bold uppercase tracking-widest text-navy">Datos de la Cotización</h3>
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="quotationNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs font-bold uppercase tracking-wider text-muted-foreground">N° Cotización</FormLabel>
                          <FormControl>
                            <Input {...field} readOnly className="bg-slate-50 border-slate-200 font-mono font-bold text-navy" />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="validUntil"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Válida Hasta *</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} className="bg-white border-slate-200" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="requestId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Vincular Solicitud *</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger className="bg-white border-slate-200">
                                <SelectValue placeholder="Selecciona una solicitud" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {requests.map(r => (
                                <SelectItem key={r.id} value={r.id}>
                                  {r.requestNumber} - {r.destinationCity || r.destinationCountry}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="space-y-2">
                      <FormLabel className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Cliente</FormLabel>
                      <div className="p-2.5 bg-slate-50 border border-slate-100 rounded-lg flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-500">
                          {selectedClient ? `${selectedClient.firstName[0]}${selectedClient.lastName[0]}` : "?"}
                        </div>
                        <span className="text-sm font-semibold text-navy">
                          {selectedClient ? `${selectedClient.firstName} ${selectedClient.lastName}` : "Seleccione una solicitud"}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="currency"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Moneda</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger className="bg-white border-slate-200">
                                <SelectValue placeholder="Moneda" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="CLP">CLP (Peso Chileno)</SelectItem>
                              <SelectItem value="USD">USD (Dólar Americano)</SelectItem>
                            </SelectContent>
                          </Select>
                        </FormItem>
                      )}
                    />
                    {isEditing && (
                      <FormField
                        control={form.control}
                        name="status"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Estado</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger className="bg-white border-slate-200">
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="Borrador">Borrador</SelectItem>
                                <SelectItem value="Enviada">Enviada</SelectItem>
                                <SelectItem value="Aceptada">Aceptada</SelectItem>
                                <SelectItem value="Rechazada">Rechazada</SelectItem>
                              </SelectContent>
                            </Select>
                          </FormItem>
                        )}
                      />
                    )}
                  </div>
                </div>

                <Separator className="bg-slate-100" />

                {/* 2. Partidas / Servicios */}
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center font-bold text-xs">2</span>
                      <h3 className="text-sm font-bold uppercase tracking-widest text-navy">Servicios / Partidas</h3>
                    </div>
                    <Button type="button" variant="outline" size="sm" onClick={addItem} className="h-8 gap-1.5 border-dashed">
                      <Plus className="w-3.5 h-3.5" /> Agregar Servicio
                    </Button>
                  </div>

                  <div className="space-y-4">
                    {items.map((item, index) => (
                      <div key={item.id} className="group relative bg-slate-50/50 p-4 rounded-xl border border-slate-100 space-y-4">
                        <div className="grid grid-cols-12 gap-4">
                          <div className="col-span-5 space-y-1.5">
                            <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Servicio / Producto</label>
                            <Input 
                              placeholder="Ej: Pasaje Aéreo, Hotel, Tour" 
                              value={item.service} 
                              onChange={(e) => updateItem(item.id, "service", e.target.value)}
                              className="bg-white"
                            />
                          </div>
                          <div className="col-span-2 space-y-1.5">
                            <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Cantidad</label>
                            <Input 
                              type="number" 
                              value={item.quantity} 
                              onChange={(e) => updateItem(item.id, "quantity", Number(e.target.value))}
                              className="bg-white text-center"
                            />
                          </div>
                          <div className="col-span-3 space-y-1.5">
                            <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Precio Unitario ({currency})</label>
                            <Input 
                              type="number" 
                              value={item.unitPrice} 
                              onChange={(e) => updateItem(item.id, "unitPrice", Number(e.target.value))}
                              className="bg-white text-right font-medium"
                            />
                          </div>
                          <div className="col-span-2 space-y-1.5 text-right">
                            <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Subtotal</label>
                            <div className="h-10 flex items-center justify-end px-3 font-bold text-navy text-sm">
                              {new Intl.NumberFormat(currency === "CLP" ? "es-CL" : "en-US").format(item.quantity * item.unitPrice)}
                            </div>
                          </div>
                        </div>
                        <div className="grid grid-cols-12 gap-4">
                          <div className="col-span-11 space-y-1.5">
                            <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Descripción (opcional)</label>
                            <Input 
                              placeholder="Detalles adicionales, fechas, especificaciones..." 
                              value={item.description} 
                              onChange={(e) => updateItem(item.id, "description", e.target.value)}
                              className="bg-white text-xs"
                            />
                          </div>
                          <div className="col-span-1 flex items-end justify-end pb-0.5">
                            <Button 
                              type="button" 
                              variant="ghost" 
                              size="icon" 
                              className="h-9 w-9 text-rose-400 hover:text-rose-600 hover:bg-rose-50"
                              onClick={() => removeItem(item.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="flex justify-end pt-4">
                    <div className="w-[300px] bg-navy/5 p-6 rounded-2xl border border-navy/10 space-y-3">
                      <div className="flex justify-between text-xs font-medium text-muted-foreground">
                        <span>Subtotal</span>
                        <span className="font-bold text-navy">{new Intl.NumberFormat(currency === "CLP" ? "es-CL" : "en-US").format(totals.subtotal)}</span>
                      </div>
                      
                      <div className="flex items-center justify-between gap-4">
                        <label className="text-xs font-medium text-muted-foreground">Descuento ({currency})</label>
                        <Input 
                          type="number" 
                          className="h-7 w-24 text-right bg-white border-navy/10" 
                          value={discount} 
                          onChange={(e) => form.setValue("discount", Number(e.target.value))}
                        />
                      </div>

                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-1">
                          <label className="text-xs font-medium text-muted-foreground">IVA (19%)</label>
                        </div>
                        <span className="text-xs font-bold text-navy">{new Intl.NumberFormat(currency === "CLP" ? "es-CL" : "en-US").format(totals.taxAmount)}</span>
                      </div>

                      <Separator className="bg-navy/10 my-2" />
                      
                      <div className="flex justify-between items-center pt-1">
                        <span className="text-sm font-bold uppercase tracking-wider text-navy">Total Final</span>
                        <span className="text-xl font-bold text-navy font-playfair underline decoration-gold/50 underline-offset-4">
                          {new Intl.NumberFormat(currency === "CLP" ? "es-CL" : "en-US", { style: "currency", currency }).format(totals.total)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <Separator className="bg-slate-100" />

                {/* 3. Notas */}
                <div className="space-y-6">
                  <div className="flex items-center gap-2">
                    <span className="w-7 h-7 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center font-bold text-xs">3</span>
                    <h3 className="text-sm font-bold uppercase tracking-widest text-navy">Notas y Condiciones</h3>
                  </div>

                  <div className="grid gap-6">
                    <FormField
                      control={form.control}
                      name="notes"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Observaciones Internas</FormLabel>
                          <FormControl>
                            <Textarea {...field} className="bg-white border-slate-200 min-h-[100px]" placeholder="Solo visible para el equipo..." />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="termsAndConditions"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Términos y Condiciones</FormLabel>
                          <FormControl>
                            <Textarea {...field} className="bg-white border-slate-200 min-h-[100px]" placeholder="Información sobre pagos, anulaciones, etc." />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              </div>
            </ScrollArea>

            <SheetFooter className="p-8 border-t border-slate-100 bg-slate-50/50">
              <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} className="text-muted-foreground">
                Cancelar
              </Button>
              <Button type="submit" disabled={form.formState.isSubmitting} className="min-w-[160px] bg-navy hover:bg-navy-light text-white font-bold shadow-lg shadow-navy/20">
                {form.formState.isSubmitting ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Guardando...</>
                ) : (
                  <><ReceiptText className="mr-2 h-4 w-4" /> {isEditing ? "Guardar Cambios" : "Generar Cotización"}</>
                )}
              </Button>
            </SheetFooter>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}
