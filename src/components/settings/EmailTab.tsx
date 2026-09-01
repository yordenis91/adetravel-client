import React, { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { SystemConfig } from "@/lib/api";
import { Save, Mail, Info, Eye, EyeOff } from "lucide-react";

interface EmailTabProps {
  config: any;
  configId: string | undefined;
}

export default function EmailTab({ config, configId }: EmailTabProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showPassword, setShowPassword] = useState(false);
  
  const { register, handleSubmit, reset, control } = useForm({
    defaultValues: config || {
      smtpHost: "",
      smtpPort: 587,
      smtpUser: "",
      smtpPassword: "",
      smtpFromName: "",
      smtpFromEmail: "",
      smtpEncryption: "TLS",
      notifyOnQuotationSent: true,
      notifyOnPaymentCompleted: true,
      notifyOnVoucherIssued: true,
      notifyOnRequestCreated: true,
    },
  });

  useEffect(() => {
    if (config) {
      reset(config);
    }
  }, [config, reset]);

  const onSubmit = async (data: any) => {
    try {
      if (configId) {
        await SystemConfig.update(configId, data);
      } else {
        await SystemConfig.create(data);
      }
      toast({
        title: "Configuración guardada",
        description: "Los ajustes de correo han sido actualizados.",
      });
      queryClient.invalidateQueries({ queryKey: ["systemConfig"] });
    } catch (error) {
      console.error("Error saving email config", error);
      toast({
        variant: "destructive",
        title: "Error al guardar",
        description: "No se pudieron guardar los cambios.",
      });
    }
  };

  return (
    <div className="space-y-8">
      <Card className="border-navy/10 shadow-lg">
        <CardHeader className="bg-navy/[0.02] border-b border-navy/5">
          <div className="flex items-center gap-2">
            <Mail className="w-5 h-5 text-primary" />
            <div>
              <CardTitle className="text-xl font-playfair">Configuración SMTP</CardTitle>
              <CardDescription>Parámetros del servidor de salida de correo.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="mb-6 p-4 bg-blue-50 border border-blue-100 rounded-lg flex gap-3 text-sm text-blue-800">
            <Info className="w-5 h-5 flex-shrink-0" />
            <p>
              Estos son los datos reales del servidor SMTP que el sistema usa para enviar los correos a tus clientes (cotizaciones, pagos, vouchers, etc.). Guarda los cambios para que apliquen de inmediato.
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="smtpHost">Servidor SMTP</Label>
                <Input id="smtpHost" {...register("smtpHost")} placeholder="smtp.gmail.com" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="smtpPort">Puerto</Label>
                <Input id="smtpPort" type="number" {...register("smtpPort", { valueAsNumber: true })} placeholder="587" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="smtpUser">Usuario SMTP</Label>
                <Input id="smtpUser" {...register("smtpUser")} placeholder="usuario@gmail.com" />
              </div>
              <div className="space-y-2 relative">
                <Label htmlFor="smtpPassword">Contraseña</Label>
                <div className="relative">
                  <Input 
                    id="smtpPassword" 
                    type={showPassword ? "text" : "password"} 
                    {...register("smtpPassword")} 
                    className="pr-10"
                  />
                  <button 
                    type="button" 
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="smtpFromName">Nombre del Remitente</Label>
                <Input id="smtpFromName" {...register("smtpFromName")} placeholder="ADE Travel" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="smtpFromEmail">Email del Remitente</Label>
                <Input id="smtpFromEmail" type="email" {...register("smtpFromEmail")} placeholder="no-reply@adetravel.cl" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="smtpEncryption">Cifrado</Label>
                <Controller
                  name="smtpEncryption"
                  control={control}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccione cifrado" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="TLS">TLS</SelectItem>
                        <SelectItem value="SSL">SSL</SelectItem>
                        <SelectItem value="Ninguno">Ninguno</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
            </div>

            <div className="border-t pt-8">
              <h3 className="text-lg font-playfair font-semibold text-navy mb-4">Notificaciones por Email</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-slate-50 transition-colors">
                  <div className="space-y-0.5">
                    <Label className="text-base">Cotización enviada</Label>
                    <p className="text-sm text-muted-foreground">Enviar email al cliente cuando una cotización cambia a estado Enviada</p>
                  </div>
                  <Controller
                    name="notifyOnQuotationSent"
                    control={control}
                    render={({ field }) => (
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    )}
                  />
                </div>
                <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-slate-50 transition-colors">
                  <div className="space-y-0.5">
                    <Label className="text-base">Pago confirmado</Label>
                    <p className="text-sm text-muted-foreground">Enviar confirmación al cliente cuando un pago queda en estado Completado</p>
                  </div>
                  <Controller
                    name="notifyOnPaymentCompleted"
                    control={control}
                    render={({ field }) => (
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    )}
                  />
                </div>
                <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-slate-50 transition-colors">
                  <div className="space-y-0.5">
                    <Label className="text-base">Voucher emitido</Label>
                    <p className="text-sm text-muted-foreground">Enviar voucher al cliente cuando se emite un voucher</p>
                  </div>
                  <Controller
                    name="notifyOnVoucherIssued"
                    control={control}
                    render={({ field }) => (
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    )}
                  />
                </div>
                <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-slate-50 transition-colors">
                  <div className="space-y-0.5">
                    <Label className="text-base">Nueva solicitud</Label>
                    <p className="text-sm text-muted-foreground">Notificación interna cuando se registra una nueva solicitud</p>
                  </div>
                  <Controller
                    name="notifyOnRequestCreated"
                    control={control}
                    render={({ field }) => (
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    )}
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <Button type="submit" className="gap-2 bg-navy hover:bg-navy-dark text-white">
                <Save className="w-4 h-4" />
                Guardar Cambios
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
