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
import { useCatalog } from "@/hooks/useCatalogs";
import { Loader2, Plus, X } from "lucide-react";

import { FormSheet, FormSheetBody, FormSheetFooter, FormSection } from "@/components/ui/form-sheet";
import { IdCard, Landmark, Phone, SlidersHorizontal, User } from "lucide-react";
const clientSchema = z.object({
  firstName: z.string().min(2, "Nombre es requerido"),
  lastName: z.string().min(2, "Apellido es requerido"),
  email: z.string().email("Email inválido").or(z.string().length(0)),
  phone: z.string().optional(),
  rut: z.string().optional(),
  passportNumber: z.string().optional(),
  passportExpiry: z.string().optional(),     // 1. NUEVO: Fecha vencimiento pasaporte
  passportIssueDate: z.string().optional(),  // 2. NUEVO: Fecha emisión pasaporte
  passportCountry: z.string().optional(),    // 3. NUEVO: País del pasaporte
  birthDate: z.string().optional(),          // 4. NUEVO: Fecha de nacimiento
  nationality: z.string().optional(),
  address: z.string().optional(),
  referralSource: z.string().optional(),
  restrictions: z.string().optional(),
  bankName: z.string().optional(),
  bankAccount: z.string().optional(),
  bankAccountHolder: z.string().optional(),
  bankEmail: z.string().email("Email bancario inválido").or(z.string().length(0)).optional(), // 5. NUEVO: Email del banco
  isActive: z.boolean().default(true),
});

type ClientFormValues = z.infer<typeof clientSchema>;

interface ClientFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  client?: any;
  onSuccess: () => void;
}

export function ClientFormDialog({ open, onOpenChange, client, onSuccess }: ClientFormDialogProps) {
  const { toast } = useToast();
  const isEditing = !!client;
  const { data: nationalities } = useCatalog("nationalities");

  const form = useForm<ClientFormValues>({
    resolver: zodResolver(clientSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      rut: "",
      passportNumber: "",
      passportExpiry: "",      // NUEVO
      passportIssueDate: "",   // NUEVO
      passportCountry: "",     // NUEVO
      birthDate: "",      // NUEVO
      nationality: "",
      address: "",
      referralSource: "OTHER",
      restrictions: "",
      bankName: "",
      bankAccount: "",
      bankAccountHolder: "",
      bankEmail: "",           // NUEVO
      isActive: true,
    },
  });

  useEffect(() => {
    if (client) {
      form.reset({
        firstName: client.firstName || "",
        lastName: client.lastName || "",
        email: client.email || "",
        phone: client.phone || "",
        rut: client.rut || "",
        passportNumber: client.passportNumber || "",
        passportExpiry: client.passportExpiry || "",      // NUEVO
        passportIssueDate: client.passportIssueDate || "",// NUEVO
        passportCountry: client.passportCountry || "",    // NUEVO
        birthDate: client.birthDate || "",                // NUEVO
        nationality: client.nationality || "",
        address: client.address || "",
        referralSource: client.referralSource || "OTHER",
        restrictions: client.restrictions || "",
        bankName: client.bankName || "",
        bankAccount: client.bankAccount || "",
        bankAccountHolder: client.bankAccountHolder || "",
        bankEmail: client.bankEmail || "",                // NUEVO
        isActive: client.isActive ?? true,
      });
    } else {
      form.reset({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        rut: "",
        passportNumber: "",
        passportExpiry: "",      // NUEVO
        passportIssueDate: "",   // NUEVO
        passportCountry: "",     // NUEVO
        birthDate: "",           // NUEVO
        nationality: "",
        address: "",
        referralSource: "OTHER",
        restrictions: "",
        bankName: "",
        bankAccount: "",
        bankAccountHolder: "",
        bankEmail: "",          // NUEVO
        isActive: true,
      });
    }
  }, [client, form, open]);

const onSubmit = async (values: ClientFormValues) => {
    try {
      // 1. Limpiamos los campos vacíos convirtiéndolos en 'undefined'.
      // Esto evita que Zod en el backend trate un espacio en blanco ("") como si fuera un RUT/Email duplicado.
      const cleanValues = {
        ...values,
        email: values.email?.trim() === "" ? undefined : values.email,
        rut: values.rut?.trim() === "" ? undefined : values.rut,
      };

      if (isEditing) {
        // Usamos cleanValues y quitamos la llamada manual a logActivity
        await api.patch(`/clients/${client.id}`, cleanValues);
        toast({ title: "Cliente actualizado", description: "Los datos se guardaron correctamente." });
      } else {
        await api.post('/clients', cleanValues);
        toast({ title: "Cliente creado", description: "El nuevo cliente ha sido registrado." });
      }
      
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      console.error(error);
      
      // 2. Extraemos el mensaje real del servidor para mostrar el aviso al usuario
      let errorMessage = "Hubo un problema al guardar los datos.";
      try {
        // Manejo por si el error viene como string JSON desde la API
        const parsedError = JSON.parse(error.message);
        if (parsedError.error) errorMessage = parsedError.error;
      } catch (e) {
        if (error.message) errorMessage = error.message;
      }

      toast({ 
        title: "No se pudo guardar", 
        description: errorMessage, // Mostrará: "Ya existe un cliente con el RUT X"
        variant: "destructive"
      });
    }
  };

  return (
    <FormSheet open={open} onOpenChange={onOpenChange} title={isEditing ? "Editar Cliente" : "Nuevo Cliente"} description="Completa la información del titular para el registro de viajes y reservas." widthClassName="sm:max-w-[600px]">

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex min-h-0 flex-1 flex-col">
            <FormSheetBody>
              <div className="space-y-5">
                {/* Datos Personales */}
                <FormSection tone="blue" icon={User} title="Datos Personales">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="firstName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs font-bold text-navy">Nombres *</FormLabel>
                          <FormControl>
                            <Input placeholder="Ej: Juan Pablo" {...field} className="bg-white" />
                          </FormControl>
                          <FormMessage className="text-[10px]" />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="lastName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs font-bold text-navy">Apellidos *</FormLabel>
                          <FormControl>
                            <Input placeholder="Ej: Pérez González" {...field} className="bg-white" />
                          </FormControl>
                          <FormMessage className="text-[10px]" />
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="nationality"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs font-bold text-navy">Nacionalidad</FormLabel>
                          <Combobox
                            options={nationalities.map((n: any) => ({ value: n.name, label: n.name }))}
                            value={field.value}
                            onChange={field.onChange}
                            allowCustomValue
                            placeholder="Ej: Chilena"
                            searchPlaceholder="Buscar o escribir nacionalidad..."
                            className="bg-white"
                          />
                          <FormMessage className="text-[10px]" />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="address"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs font-bold text-navy">Dirección</FormLabel>
                          <FormControl>
                            <Input placeholder="Ciudad, Comuna, Calle" {...field} className="bg-white" />
                          </FormControl>
                          <FormMessage className="text-[10px]" />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="birthDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs font-bold text-navy">Fecha de Nacimiento</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} className="bg-white" />
                          </FormControl>
                          <FormMessage className="text-[10px]" />
                        </FormItem>
                      )}
                    />
                  </div>
                </FormSection>


                {/* Identificación */}
                <FormSection tone="emerald" icon={IdCard} title="Identificación">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="rut"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs font-bold text-navy">RUT</FormLabel>
                          <FormControl>
                            <Input placeholder="12.345.678-9" {...field} className="bg-white" />
                          </FormControl>
                          <FormMessage className="text-[10px]" />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="passportNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs font-bold text-navy">Pasaporte</FormLabel>
                          <FormControl>
                            <Input placeholder="Número de pasaporte" {...field} className="bg-white" />
                          </FormControl>
                          <FormMessage className="text-[10px]" />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <FormField
                      control={form.control}
                      name="passportCountry"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs font-bold text-navy">País Pasaporte</FormLabel>
                          <FormControl>
                            <Input placeholder="Ej: Chile" {...field} className="bg-white" />
                          </FormControl>
                          <FormMessage className="text-[10px]" />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="passportIssueDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs font-bold text-navy">F. Emisión</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} className="bg-white" />
                          </FormControl>
                          <FormMessage className="text-[10px]" />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="passportExpiry"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs font-bold text-navy">F. Vencimiento</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} className="bg-white" />
                          </FormControl>
                          <FormMessage className="text-[10px]" />
                        </FormItem>
                      )}
                    />
                  </div>
                </FormSection>


                {/* Contacto */}
                <FormSection tone="amber" icon={Phone} title="Contacto">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs font-bold text-navy">Email</FormLabel>
                          <FormControl>
                            <Input type="email" placeholder="correo@ejemplo.com" {...field} className="bg-white" />
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
                          <FormLabel className="text-xs font-bold text-navy">Teléfono</FormLabel>
                          <FormControl>
                            <Input placeholder="+56 9 1234 5678" {...field} className="bg-white" />
                          </FormControl>
                          <FormMessage className="text-[10px]" />
                        </FormItem>
                      )}
                    />
                  </div>
                  <FormField
                    control={form.control}
                    name="referralSource"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-bold text-navy">Fuente de Referencia</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger className="bg-white">
                              <SelectValue placeholder="Selecciona una fuente" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="CONSULATE">Consulado</SelectItem>
                            <SelectItem value="REFERRAL">Referido</SelectItem>
                            <SelectItem value="WEBSITE">Sitio Web</SelectItem>
                            <SelectItem value="OTHER">Otros / Directo</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage className="text-[10px]" />
                      </FormItem>
                    )}
                  />
                </FormSection>


                {/* Información Adicional */}
                <FormSection tone="violet" icon={SlidersHorizontal} title="Preferencias">
                  <FormField
                    control={form.control}
                    name="restrictions"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-bold text-navy">Restricciones o Preferencias</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Dietas especiales, alergias, preferencias de asiento, etc." 
                            className="bg-white min-h-[100px]"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage className="text-[10px]" />
                      </FormItem>
                    )}
                  />
                </FormSection>
                

                {/* Datos Bancarios */}
                <FormSection tone="rose" icon={Landmark} title="Datos Bancarios (Reembolsos)">
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
                          <FormLabel className="text-xs font-bold text-navy">Cuenta</FormLabel>
                          <FormControl>
                            <Input placeholder="N° de Cuenta" {...field} className="bg-white" />
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
                          <FormLabel className="text-xs font-bold text-navy">Titular</FormLabel>
                          <FormControl>
                            <Input placeholder="Nombre Titular" {...field} className="bg-white" />
                          </FormControl>
                          <FormMessage className="text-[10px]" />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-1 gap-4">
                    <FormField
                      control={form.control}
                      name="bankEmail"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs font-bold text-navy">Email Avisos Bancarios</FormLabel>
                          <FormControl>
                            <Input type="email" placeholder="correo-banco@ejemplo.com" {...field} className="bg-white" />
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
                  isEditing ? "Guardar Cambios" : "Crear Cliente"
                )}
              </Button>
            </FormSheetFooter>
          </form>
        </Form>
      </FormSheet>
  );
}
