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
import { Loader2, Plus, X } from "lucide-react";

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
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-[600px] p-0 flex flex-col">
        <SheetHeader className="p-8 pb-4">
          <SheetTitle className="text-2xl font-playfair font-bold text-navy">
            {isEditing ? "Editar Cliente" : "Nuevo Cliente"}
          </SheetTitle>
          <SheetDescription>
            Completa la información del titular para el registro de viajes y reservas.
          </SheetDescription>
        </SheetHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex-1 flex flex-col overflow-hidden">
            <ScrollArea className="flex-1 px-8">
              <div className="space-y-8 pb-10">
                {/* Datos Personales */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">1</span>
                    <h3 className="text-sm font-bold uppercase tracking-widest text-navy">Datos Personales</h3>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="firstName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Nombres *</FormLabel>
                          <FormControl>
                            <Input placeholder="Ej: Juan Pablo" {...field} className="bg-slate-50 border-slate-100" />
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
                          <FormLabel className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Apellidos *</FormLabel>
                          <FormControl>
                            <Input placeholder="Ej: Pérez González" {...field} className="bg-slate-50 border-slate-100" />
                          </FormControl>
                          <FormMessage className="text-[10px]" />
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="nationality"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Nacionalidad</FormLabel>
                          <Combobox
                            options={nationalities.map((n: any) => ({ value: n.name, label: n.name }))}
                            value={field.value}
                            onChange={field.onChange}
                            allowCustomValue
                            placeholder="Ej: Chilena"
                            searchPlaceholder="Buscar o escribir nacionalidad..."
                            className="bg-slate-50 border-slate-100"
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
                          <FormLabel className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Dirección</FormLabel>
                          <FormControl>
                            <Input placeholder="Ciudad, Comuna, Calle" {...field} className="bg-slate-50 border-slate-100" />
                          </FormControl>
                          <FormMessage className="text-[10px]" />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="birthDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Fecha de Nacimiento</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} className="bg-slate-50 border-slate-100" />
                          </FormControl>
                          <FormMessage className="text-[10px]" />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                <Separator className="bg-slate-100" />

                {/* Identificación */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-xs">2</span>
                    <h3 className="text-sm font-bold uppercase tracking-widest text-navy">Identificación</h3>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="rut"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs font-bold uppercase tracking-wider text-muted-foreground">RUT</FormLabel>
                          <FormControl>
                            <Input placeholder="12.345.678-9" {...field} className="bg-slate-50 border-slate-100" />
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
                          <FormLabel className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Pasaporte</FormLabel>
                          <FormControl>
                            <Input placeholder="Número de pasaporte" {...field} className="bg-slate-50 border-slate-100" />
                          </FormControl>
                          <FormMessage className="text-[10px]" />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4">
                    <FormField
                      control={form.control}
                      name="passportCountry"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs font-bold uppercase tracking-wider text-muted-foreground">País Pasaporte</FormLabel>
                          <FormControl>
                            <Input placeholder="Ej: Chile" {...field} className="bg-slate-50 border-slate-100" />
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
                          <FormLabel className="text-xs font-bold uppercase tracking-wider text-muted-foreground">F. Emisión</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} className="bg-slate-50 border-slate-100" />
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
                          <FormLabel className="text-xs font-bold uppercase tracking-wider text-muted-foreground">F. Vencimiento</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} className="bg-slate-50 border-slate-100" />
                          </FormControl>
                          <FormMessage className="text-[10px]" />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                <Separator className="bg-slate-100" />

                {/* Contacto */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xs">3</span>
                    <h3 className="text-sm font-bold uppercase tracking-widest text-navy">Contacto</h3>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Email</FormLabel>
                          <FormControl>
                            <Input type="email" placeholder="correo@ejemplo.com" {...field} className="bg-slate-50 border-slate-100" />
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
                          <FormLabel className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Teléfono</FormLabel>
                          <FormControl>
                            <Input placeholder="+56 9 1234 5678" {...field} className="bg-slate-50 border-slate-100" />
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
                        <FormLabel className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Fuente de Referencia</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger className="bg-slate-50 border-slate-100">
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
                </div>

                <Separator className="bg-slate-100" />

                {/* Información Adicional */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center font-bold text-xs">4</span>
                    <h3 className="text-sm font-bold uppercase tracking-widest text-navy">Preferencias</h3>
                  </div>
                  <FormField
                    control={form.control}
                    name="restrictions"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Restricciones o Preferencias</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Dietas especiales, alergias, preferencias de asiento, etc." 
                            className="bg-slate-50 border-slate-100 min-h-[100px]"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage className="text-[10px]" />
                      </FormItem>
                    )}
                  />
                </div>
                
                <Separator className="bg-slate-100" />

                {/* Datos Bancarios */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center font-bold text-xs">5</span>
                    <h3 className="text-sm font-bold uppercase tracking-widest text-navy">Datos Bancarios (Reembolsos)</h3>
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
                          <FormLabel className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Cuenta</FormLabel>
                          <FormControl>
                            <Input placeholder="N° de Cuenta" {...field} className="bg-slate-50 border-slate-100" />
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
                          <FormLabel className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Titular</FormLabel>
                          <FormControl>
                            <Input placeholder="Nombre Titular" {...field} className="bg-slate-50 border-slate-100" />
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
                          <FormLabel className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Email Avisos Bancarios</FormLabel>
                          <FormControl>
                            <Input type="email" placeholder="correo-banco@ejemplo.com" {...field} className="bg-slate-50 border-slate-100" />
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
                  isEditing ? "Guardar Cambios" : "Crear Cliente"
                )}
              </Button>
            </SheetFooter>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}
