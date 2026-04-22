import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { SystemConfig } from "@/lib/api";
import { Save, Building2 } from "lucide-react";

interface AgencyTabProps {
  config: any;
  configId: string | undefined;
}

export default function AgencyTab({ config, configId }: AgencyTabProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { register, handleSubmit, reset, watch } = useForm({
    defaultValues: config || {
      agencyName: "",
      agencyFantasyName: "",
      agencyRut: "",
      agencyPhone: "",
      agencyEmail: "",
      agencyWebsite: "",
      agencyAddress: "",
      agencyLogoUrl: "",
    },
  });

  const logoUrl = watch("agencyLogoUrl");

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
        description: "Los datos de la agencia han sido actualizados correctamente.",
      });
      queryClient.invalidateQueries({ queryKey: ["systemConfig"] });
    } catch (error) {
      console.error("Error saving agency config", error);
      toast({
        variant: "destructive",
        title: "Error al guardar",
        description: "No se pudieron guardar los cambios. Intente nuevamente.",
      });
    }
  };

  return (
    <Card className="border-navy/10 shadow-lg">
      <CardHeader className="bg-navy/[0.02] border-b border-navy/5">
        <div className="flex items-center gap-2">
          <Building2 className="w-5 h-5 text-primary" />
          <div>
            <CardTitle className="text-xl font-playfair">Información de la Agencia</CardTitle>
            <CardDescription>Detalles legales y de contacto de la empresa.</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="agencyName">Nombre Legal</Label>
              <Input id="agencyName" {...register("agencyName")} placeholder="ADE Travel SpA" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="agencyFantasyName">Nombre Comercial</Label>
              <Input id="agencyFantasyName" {...register("agencyFantasyName")} placeholder="ADE Travel" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="agencyRut">RUT</Label>
              <Input id="agencyRut" {...register("agencyRut")} placeholder="76.123.456-K" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="agencyPhone">Teléfono</Label>
              <Input id="agencyPhone" {...register("agencyPhone")} placeholder="+56 9 1234 5678" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="agencyEmail">Email de Contacto</Label>
              <Input id="agencyEmail" type="email" {...register("agencyEmail")} placeholder="contacto@adetravel.cl" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="agencyWebsite">Sitio Web</Label>
              <Input id="agencyWebsite" {...register("agencyWebsite")} placeholder="https://www.adetravel.cl" />
            </div>
            <div className="md:col-span-2 space-y-2">
              <Label htmlFor="agencyAddress">Dirección</Label>
              <Input id="agencyAddress" {...register("agencyAddress")} placeholder="Av. Providencia 1234, Oficina 56, Santiago" />
            </div>
            <div className="md:col-span-2 space-y-4">
              <Label htmlFor="agencyLogoUrl">URL del Logo</Label>
              <Input id="agencyLogoUrl" {...register("agencyLogoUrl")} placeholder="https://ejemplo.com/logo.png" />
              {logoUrl && (
                <div className="p-4 border rounded-lg bg-slate-50 flex items-center justify-center">
                  <img src={logoUrl} alt="Logo Preview" className="max-h-16 object-contain" />
                </div>
              )}
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
  );
}
