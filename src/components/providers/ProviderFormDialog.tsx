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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Combobox } from "@/components/ui/combobox";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { useCatalog } from "@/hooks/useCatalogs";
import { Loader2, Plus, X, Building2, MapPin, Phone, User, Settings, CreditCard } from "lucide-react";

const providerSchema = z.object({
  name: z.string().min(2, "Razón social es requerida"),
  fantasyName: z.string().optional(),
  rut: z.string().optional(),
  country: z.string().optional(),
  city: z.string().optional(),
  address: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email("Email inválido").or(z.string().length(0)),
  businessType: z.string().default("OTHER"),
  executiveName: z.string().optional(),
  executivePhone: z.string().optional(),
  executiveEmail: z.string().email("Email inválido").or(z.string().length(0)),
  contactName: z.string().optional(),
  contactPhone: z.string().optional(),
  contactEmail: z.string().email("Email inválido").or(z.string().length(0)),
  bankName: z.string().optional(),
  bankAccount: z.string().optional(),
  bankAccountHolder: z.string().optional(),
  paymentMethod: z.string().optional(),
  vatPercentage: z.coerce.number().optional(),
  isActive: z.boolean().default(true),
});

type ProviderFormValues = z.infer<typeof providerSchema>;

interface ProviderFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  provider?: any;
  onSuccess: () => void;
}

export function ProviderFormDialog({ open, onOpenChange, provider, onSuccess }: ProviderFormDialogProps) {
  const { toast } = useToast();
  const { data: countries } = useCatalog("countries");
  const { data: cities } = useCatalog("cities");
  const isEditing = !!provider;

  const form = useForm<ProviderFormValues>({
    resolver: zodResolver(providerSchema),
    defaultValues: {
      name: "",
      fantasyName: "",
      rut: "",
      country: "Chile",
      city: "",
      address: "",
      phone: "",
      email: "",
      businessType: "OTHER",
      executiveName: "",
      executivePhone: "",
      executiveEmail: "",
      contactName: "",
      contactPhone: "",
      contactEmail: "",
      bankName: "",
      bankAccount: "",
      bankAccountHolder: "",
      paymentMethod: "TRANSFER",
      vatPercentage: 19,
      isActive: true,
    },
  });

  useEffect(() => {
    if (provider) {
      form.reset({
        name: provider.name || "",
        fantasyName: provider.fantasyName || "",
        rut: provider.rut || "",
        country: provider.country || "Chile",
        city: provider.city || "",
        address: provider.address || "",
        phone: provider.phone || "",
        email: provider.email || "",
        businessType: provider.businessType || "OTHER",
        executiveName: provider.executiveName || "",
        executivePhone: provider.executivePhone || "",
        executiveEmail: provider.executiveEmail || "",
        contactName: provider.contactName || "",
        contactPhone: provider.contactPhone || "",
        contactEmail: provider.contactEmail || "",
        bankName: provider.bankName || "",
        bankAccount: provider.bankAccount || "",
        bankAccountHolder: provider.bankAccountHolder || "",
        paymentMethod: provider.paymentMethod || "TRANSFER",
        vatPercentage: provider.vatPercentage ?? 19,
        isActive: provider.isActive ?? true,
      });
    } else {
      form.reset({
        name: "",
        fantasyName: "",
        rut: "",
        country: "Chile",
        city: "",
        address: "",
        phone: "",
        email: "",
        businessType: "OTHER",
        executiveName: "",
        executivePhone: "",
        executiveEmail: "",
        contactName: "",
        contactPhone: "",
        contactEmail: "",
        bankName: "",
        bankAccount: "",
        bankAccountHolder: "",
        paymentMethod: "TRANSFER",
        vatPercentage: 19,
        isActive: true,
      });
    }
  }, [provider, form, open]);

  const onSubmit = async (values: ProviderFormValues) => {
    try {
      if (isEditing) {
        await api.patch(`/providers/${provider.id}`, values);
        toast({ title: "Proveedor actualizado", description: "Los datos se guardaron correctamente." });
      } else {
        await api.post('/providers', values);
        toast({ title: "Proveedor creado", description: "El nuevo proveedor ha sido registrado." });
      }
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error(error);
      toast({ 
        title: "Error", 
        description: "Hubo un problema al guardar los datos.",
        variant: "destructive"
      });
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-[700px] p-0 flex flex-col">
        <SheetHeader className="p-8 pb-4">
          <SheetTitle className="text-2xl font-playfair font-bold text-navy">
            {isEditing ? "Editar Proveedor" : "Nuevo Proveedor"}
          </SheetTitle>
          <SheetDescription>
            Registra la información completa del proveedor para operaciones y pagos.
          </SheetDescription>
        </SheetHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex-1 flex flex-col overflow-hidden">
            <ScrollArea className="flex-1 px-8">
              <div className="space-y-8 pb-10">
                {/* 1. Datos del Proveedor */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">1</span>
                    <h3 className="text-sm font-bold uppercase tracking-widest text-navy">Datos del Proveedor</h3>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem className="col-span-2">
                          <FormLabel className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Razón Social *</FormLabel>
                          <FormControl>
                            <Input placeholder="Ej: Transportes y Turismo SpA" {...field} className="bg-slate-50 border-slate-100" />
                          </FormControl>
                          <FormMessage className="text-[10px]" />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="fantasyName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Nombre Fantasía</FormLabel>
                          <FormControl>
                            <Input placeholder="Ej: Viajes Express" {...field} className="bg-slate-50 border-slate-100" />
                          </FormControl>
                          <FormMessage className="text-[10px]" />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="rut"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs font-bold uppercase tracking-wider text-muted-foreground">RUT Empresa</FormLabel>
                          <FormControl>
                            <Input placeholder="76.123.456-K" {...field} className="bg-slate-50 border-slate-100" />
                          </FormControl>
                          <FormMessage className="text-[10px]" />
                        </FormItem>
                      )}
                    />
                  </div>
                  <FormField
                    control={form.control}
                    name="businessType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Tipo de Servicio</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger className="bg-slate-50 border-slate-100">
                              <SelectValue placeholder="Selecciona tipo" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="RENT_A_CAR">Arriendo de Autos</SelectItem>
                            <SelectItem value="TOUR_OPERATOR">Operador de Turismo</SelectItem>
                            <SelectItem value="INSURANCE">Seguros</SelectItem>
                            <SelectItem value="AIRLINE">Aerolínea</SelectItem>
                            <SelectItem value="HOTEL">Hotel</SelectItem>
                            <SelectItem value="PRIVATE_HOUSE">Casa Particular</SelectItem>
                            <SelectItem value="PRIVATE_CAR">Auto Particular</SelectItem>
                            <SelectItem value="TOURIST_SERVICES">Servicios Turísticos</SelectItem>
                            <SelectItem value="RESTAURANT">Restaurante</SelectItem>
                            <SelectItem value="OTHER">Otro</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage className="text-[10px]" />
                      </FormItem>
                    )}
                  />
                </div>

                <Separator className="bg-slate-100" />

                {/* 2. Ubicación */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-xs">2</span>
                    <h3 className="text-sm font-bold uppercase tracking-widest text-navy">Ubicación</h3>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="country"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs font-bold uppercase tracking-wider text-muted-foreground">País</FormLabel>
                          <Combobox
                            options={countries.map((c: any) => ({ value: c.name, label: c.name }))}
                            value={field.value}
                            onChange={field.onChange}
                            allowCustomValue
                            placeholder="Ej: Chile"
                            searchPlaceholder="Buscar o escribir país..."
                            className="bg-slate-50 border-slate-100"
                          />
                          <FormMessage className="text-[10px]" />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="city"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Ciudad</FormLabel>
                          <Combobox
                            options={cities.map((c: any) => ({ value: c.name, label: c.name }))}
                            value={field.value}
                            onChange={field.onChange}
                            allowCustomValue
                            placeholder="Ej: Santiago"
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
                    name="address"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Dirección Física</FormLabel>
                        <FormControl>
                          <Input placeholder="Calle, Número, Oficina" {...field} className="bg-slate-50 border-slate-100" />
                        </FormControl>
                        <FormMessage className="text-[10px]" />
                      </FormItem>
                    )}
                  />
                </div>

                <Separator className="bg-slate-100" />

                {/* 3. Contacto General */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xs">3</span>
                    <h3 className="text-sm font-bold uppercase tracking-widest text-navy">Contacto General</h3>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Email Central</FormLabel>
                          <FormControl>
                            <Input type="email" placeholder="central@proveedor.com" {...field} className="bg-slate-50 border-slate-100" />
                          </FormControl>
                          <FormMessage className="text-[10px]" />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Teléfono Central</FormLabel>
                          <FormControl>
                            <Input placeholder="+56 2 1234 5678" {...field} className="bg-slate-50 border-slate-100" />
                          </FormControl>
                          <FormMessage className="text-[10px]" />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                <Separator className="bg-slate-100" />

                {/* 4. Contacto Ejecutivo */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="w-8 h-8 rounded-lg bg-violet-50 text-violet-600 flex items-center justify-center font-bold text-xs">4</span>
                    <h3 className="text-sm font-bold uppercase tracking-widest text-navy">Contacto Ejecutivo</h3>
                  </div>
                  <FormField
                    control={form.control}
                    name="executiveName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Nombre Ejecutivo</FormLabel>
                        <FormControl>
                          <Input placeholder="Nombre del responsable comercial" {...field} className="bg-slate-50 border-slate-100" />
                        </FormControl>
                        <FormMessage className="text-[10px]" />
                      </FormItem>
                    )}
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="executiveEmail"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Email Ejecutivo</FormLabel>
                          <FormControl>
                            <Input type="email" placeholder="ejecutivo@proveedor.com" {...field} className="bg-slate-50 border-slate-100" />
                          </FormControl>
                          <FormMessage className="text-[10px]" />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="executivePhone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Teléfono Ejecutivo</FormLabel>
                          <FormControl>
                            <Input placeholder="+56 9 1234 5678" {...field} className="bg-slate-50 border-slate-100" />
                          </FormControl>
                          <FormMessage className="text-[10px]" />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                <Separator className="bg-slate-100" />

                {/* 5. Contacto Operativo */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center font-bold text-xs">5</span>
                    <h3 className="text-sm font-bold uppercase tracking-widest text-navy">Contacto Operativo</h3>
                  </div>
                  <FormField
                    control={form.control}
                    name="contactName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Nombre Operativo</FormLabel>
                        <FormControl>
                          <Input placeholder="Nombre del responsable de reservas/operaciones" {...field} className="bg-slate-50 border-slate-100" />
                        </FormControl>
                        <FormMessage className="text-[10px]" />
                      </FormItem>
                    )}
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="contactEmail"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Email Operativo</FormLabel>
                          <FormControl>
                            <Input type="email" placeholder="operaciones@proveedor.com" {...field} className="bg-slate-50 border-slate-100" />
                          </FormControl>
                          <FormMessage className="text-[10px]" />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="contactPhone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Teléfono Operativo</FormLabel>
                          <FormControl>
                            <Input placeholder="+56 9 8765 4321" {...field} className="bg-slate-50 border-slate-100" />
                          </FormControl>
                          <FormMessage className="text-[10px]" />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                <Separator className="bg-slate-100" />

                {/* 6. Datos Bancarios y Pagos */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center font-bold text-xs">6</span>
                    <h3 className="text-sm font-bold uppercase tracking-widest text-navy">Datos Bancarios y Pagos</h3>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="paymentMethod"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Método de Pago Preferido</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger className="bg-slate-50 border-slate-100">
                                <SelectValue placeholder="Selecciona" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="CREDIT_CARD">Tarjeta de Crédito</SelectItem>
                              <SelectItem value="DEBIT_CARD">Tarjeta de Débito</SelectItem>
                              <SelectItem value="WEBPAY">WebPay</SelectItem>
                              <SelectItem value="TRANSFER">Transferencia</SelectItem>
                              <SelectItem value="CASH">Efectivo</SelectItem>
                              <SelectItem value="CHECK">Cheque</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage className="text-[10px]" />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="vatPercentage"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs font-bold uppercase tracking-wider text-muted-foreground">IVA / VAT (%)</FormLabel>
                          <FormControl>
                            <Input type="number" {...field} className="bg-slate-50 border-slate-100" />
                          </FormControl>
                          <FormMessage className="text-[10px]" />
                        </FormItem>
                      )}
                    />
                  </div>
                  <FormField
                    control={form.control}
                    name="bankName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Banco</FormLabel>
                        <FormControl>
                          <Input placeholder="Nombre del Banco" {...field} className="bg-slate-50 border-slate-100" />
                        </FormControl>
                        <FormMessage className="text-[10px]" />
                      </FormItem>
                    )}
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="bankAccount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs font-bold uppercase tracking-wider text-muted-foreground">N° Cuenta</FormLabel>
                          <FormControl>
                            <Input placeholder="Ej: 123456789" {...field} className="bg-slate-50 border-slate-100" />
                          </FormControl>
                          <FormMessage className="text-[10px]" />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="bankAccountHolder"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Titular de Cuenta</FormLabel>
                          <FormControl>
                            <Input placeholder="Razón Social o Nombre" {...field} className="bg-slate-50 border-slate-100" />
                          </FormControl>
                          <FormMessage className="text-[10px]" />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              </div>
            </ScrollArea>

            <SheetFooter className="p-8 border-t border-slate-100 bg-slate-50/50">
              <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={form.formState.isSubmitting} className="min-w-[120px]">
                {form.formState.isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  isEditing ? "Guardar Cambios" : "Crear Proveedor"
                )}
              </Button>
            </SheetFooter>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}
