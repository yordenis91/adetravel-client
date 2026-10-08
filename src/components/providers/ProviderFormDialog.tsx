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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue } from "@/components/ui/select";
import { Combobox } from "@/components/ui/combobox";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { useCatalog, useCitiesForCountry } from "@/hooks/useCatalogs";
import { Loader2, Plus, X, Building2, MapPin, Phone, User, Settings, CreditCard } from "lucide-react";

import { FormSheet, FormSheetBody, FormSheetFooter, FormSection } from "@/components/ui/form-sheet";
import { Headset, Landmark, UserCog } from "lucide-react";
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
  const { cities } = useCitiesForCountry(form.watch("country"));

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
    <FormSheet open={open} onOpenChange={onOpenChange} title={isEditing ? "Editar Proveedor" : "Nuevo Proveedor"} description="Registra la información completa del proveedor para operaciones y pagos." widthClassName="sm:max-w-[700px]">

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex min-h-0 flex-1 flex-col">
            <FormSheetBody>
              <div className="space-y-5">
                {/* 1. Datos del Proveedor */}
                <FormSection tone="blue" icon={Building2} title="Datos del Proveedor">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem className="col-span-2">
                          <FormLabel className="text-xs font-bold text-navy">Razón Social *</FormLabel>
                          <FormControl>
                            <Input placeholder="Ej: Transportes y Turismo SpA" {...field} className="bg-white" />
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
                          <FormLabel className="text-xs font-bold text-navy">Nombre Fantasía</FormLabel>
                          <FormControl>
                            <Input placeholder="Ej: Viajes Express" {...field} className="bg-white" />
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
                          <FormLabel className="text-xs font-bold text-navy">RUT Empresa</FormLabel>
                          <FormControl>
                            <Input placeholder="76.123.456-K" {...field} className="bg-white" />
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
                        <FormLabel className="text-xs font-bold text-navy">Tipo de Servicio</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger className="bg-white">
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
                </FormSection>


                {/* 2. Ubicación */}
                <FormSection tone="emerald" icon={MapPin} title="Ubicación">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="country"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs font-bold text-navy">País</FormLabel>
                          <Combobox
                            options={countries.map((c: any) => ({ value: c.name, label: c.name }))}
                            value={field.value}
                            onChange={(v) => {
                              if (v !== field.value) form.setValue("city", "");
                              field.onChange(v);
                            }}
                            allowCustomValue
                            placeholder="Ej: Chile"
                            searchPlaceholder="Buscar o escribir país..."
                            className="bg-white"
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
                          <FormLabel className="text-xs font-bold text-navy">Ciudad</FormLabel>
                          <Combobox
                            options={cities.map((c: any) => ({ value: c.name, label: c.name }))}
                            value={field.value}
                            onChange={field.onChange}
                            allowCustomValue
                            placeholder="Ej: Santiago"
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
                    name="address"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-bold text-navy">Dirección Física</FormLabel>
                        <FormControl>
                          <Input placeholder="Calle, Número, Oficina" {...field} className="bg-white" />
                        </FormControl>
                        <FormMessage className="text-[10px]" />
                      </FormItem>
                    )}
                  />
                </FormSection>


                {/* 3. Contacto General */}
                <FormSection tone="amber" icon={Phone} title="Contacto General">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs font-bold text-navy">Email Central</FormLabel>
                          <FormControl>
                            <Input type="email" placeholder="central@proveedor.com" {...field} className="bg-white" />
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
                          <FormLabel className="text-xs font-bold text-navy">Teléfono Central</FormLabel>
                          <FormControl>
                            <Input placeholder="+56 2 1234 5678" {...field} className="bg-white" />
                          </FormControl>
                          <FormMessage className="text-[10px]" />
                        </FormItem>
                      )}
                    />
                  </div>
                </FormSection>


                {/* 4. Contacto Ejecutivo */}
                <FormSection tone="violet" icon={UserCog} title="Contacto Ejecutivo">
                  <FormField
                    control={form.control}
                    name="executiveName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-bold text-navy">Nombre Ejecutivo</FormLabel>
                        <FormControl>
                          <Input placeholder="Nombre del responsable comercial" {...field} className="bg-white" />
                        </FormControl>
                        <FormMessage className="text-[10px]" />
                      </FormItem>
                    )}
                  />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="executiveEmail"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs font-bold text-navy">Email Ejecutivo</FormLabel>
                          <FormControl>
                            <Input type="email" placeholder="ejecutivo@proveedor.com" {...field} className="bg-white" />
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
                          <FormLabel className="text-xs font-bold text-navy">Teléfono Ejecutivo</FormLabel>
                          <FormControl>
                            <Input placeholder="+56 9 1234 5678" {...field} className="bg-white" />
                          </FormControl>
                          <FormMessage className="text-[10px]" />
                        </FormItem>
                      )}
                    />
                  </div>
                </FormSection>


                {/* 5. Contacto Operativo */}
                <FormSection tone="rose" icon={Headset} title="Contacto Operativo">
                  <FormField
                    control={form.control}
                    name="contactName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-bold text-navy">Nombre Operativo</FormLabel>
                        <FormControl>
                          <Input placeholder="Nombre del responsable de reservas/operaciones" {...field} className="bg-white" />
                        </FormControl>
                        <FormMessage className="text-[10px]" />
                      </FormItem>
                    )}
                  />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="contactEmail"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs font-bold text-navy">Email Operativo</FormLabel>
                          <FormControl>
                            <Input type="email" placeholder="operaciones@proveedor.com" {...field} className="bg-white" />
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
                          <FormLabel className="text-xs font-bold text-navy">Teléfono Operativo</FormLabel>
                          <FormControl>
                            <Input placeholder="+56 9 8765 4321" {...field} className="bg-white" />
                          </FormControl>
                          <FormMessage className="text-[10px]" />
                        </FormItem>
                      )}
                    />
                  </div>
                </FormSection>


                {/* 6. Datos Bancarios y Pagos */}
                <FormSection tone="blue" icon={Landmark} title="Datos Bancarios y Pagos">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="paymentMethod"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs font-bold text-navy">Método de Pago Preferido</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger className="bg-white">
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
                          <FormLabel className="text-xs font-bold text-navy">IVA / VAT (%)</FormLabel>
                          <FormControl>
                            <Input type="number" {...field} className="bg-white" />
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
                        <FormLabel className="text-xs font-bold text-navy">Banco</FormLabel>
                        <FormControl>
                          <Input placeholder="Nombre del Banco" {...field} className="bg-white" />
                        </FormControl>
                        <FormMessage className="text-[10px]" />
                      </FormItem>
                    )}
                  />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="bankAccount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs font-bold text-navy">N° Cuenta</FormLabel>
                          <FormControl>
                            <Input placeholder="Ej: 123456789" {...field} className="bg-white" />
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
                          <FormLabel className="text-xs font-bold text-navy">Titular de Cuenta</FormLabel>
                          <FormControl>
                            <Input placeholder="Razón Social o Nombre" {...field} className="bg-white" />
                          </FormControl>
                          <FormMessage className="text-[10px]" />
                        </FormItem>
                      )}
                    />
                  </div>
                </FormSection>
              </div>
            </FormSheetBody>

            <FormSheetFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
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
            </FormSheetFooter>
          </form>
        </Form>
      </FormSheet>
  );
}
