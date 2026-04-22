import React, { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { SystemConfig } from "@/lib/api";
import { Save, FileText, Hash } from "lucide-react";

interface DocumentsTabProps {
  config: any;
  configId: string | undefined;
}

export default function DocumentsTab({ config, configId }: DocumentsTabProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { register, handleSubmit, reset, control, watch } = useForm({
    defaultValues: config || {
      defaultCurrency: "CLP",
      defaultTaxPercentage: 19,
      defaultQuotationValidityDays: 15,
      defaultTermsAndConditions: "",
      defaultQuotationNotes: "",
      requestNumberPrefix: "ADET",
      quotationNumberPrefix: "COTIZ",
      paymentNumberPrefix: "PAG",
      voucherNumberPrefix: "VCH",
    },
  });

  const prefixes = watch();

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
        description: "Los parámetros de documentos han sido actualizados.",
      });
      queryClient.invalidateQueries({ queryKey: ["systemConfig"] });
    } catch (error) {
      console.error("Error saving documents config", error);
      toast({
        variant: "destructive",
        title: "Error al guardar",
        description: "No se pudieron guardar los cambios.",
      });
    }
  };

  const getPreview = (prefix: string) => `${prefix || '---'}-2024-05-0001`;

  return (
    <div className="space-y-8">
      <Card className="border-navy/10 shadow-lg">
        <CardHeader className="bg-navy/[0.02] border-b border-navy/5">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            <div>
              <CardTitle className="text-xl font-playfair">Parámetros de Cotización</CardTitle>
              <CardDescription>Configuración base para generar cotizaciones.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <Label htmlFor="defaultTaxPercentage">IVA por Defecto %</Label>
                <Input id="defaultTaxPercentage" type="number" {...register("defaultTaxPercentage", { valueAsNumber: true })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="defaultCurrency">Moneda por Defecto</Label>
                <Controller
                  name="defaultCurrency"
                  control={control}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccione moneda" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="CLP">CLP - Peso Chileno</SelectItem>
                        <SelectItem value="USD">USD - Dólar Americano</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="defaultQuotationValidityDays">Días de Validez</Label>
                <Input id="defaultQuotationValidityDays" type="number" {...register("defaultQuotationValidityDays", { valueAsNumber: true })} />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="defaultTermsAndConditions">Términos y Condiciones por Defecto</Label>
              <Textarea 
                id="defaultTermsAndConditions" 
                rows={5} 
                {...register("defaultTermsAndConditions")} 
                placeholder="Escriba los términos y condiciones generales..."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="defaultQuotationNotes">Notas de Pie de Cotización</Label>
              <Textarea 
                id="defaultQuotationNotes" 
                rows={3} 
                {...register("defaultQuotationNotes")} 
                placeholder="Notas adicionales al final del documento..."
              />
            </div>

            <div className="border-t pt-8">
              <div className="flex items-center gap-2 mb-4">
                <Hash className="w-5 h-5 text-primary" />
                <h3 className="text-lg font-playfair font-semibold text-navy">Prefijos de Numeración</h3>
              </div>
              <p className="text-sm text-muted-foreground mb-6">
                Estos prefijos se usan para generar los números de documentos automáticamente.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="requestNumberPrefix">Solicitudes</Label>
                    <div className="flex items-center gap-3">
                      <Input id="requestNumberPrefix" {...register("requestNumberPrefix")} placeholder="ADET" />
                      <Badge variant="secondary" className="whitespace-nowrap font-mono text-[10px]">
                        {getPreview(prefixes.requestNumberPrefix)}
                      </Badge>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="quotationNumberPrefix">Cotizaciones</Label>
                    <div className="flex items-center gap-3">
                      <Input id="quotationNumberPrefix" {...register("quotationNumberPrefix")} placeholder="COTIZ" />
                      <Badge variant="secondary" className="whitespace-nowrap font-mono text-[10px]">
                        {getPreview(prefixes.quotationNumberPrefix)}
                      </Badge>
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="paymentNumberPrefix">Pagos</Label>
                    <div className="flex items-center gap-3">
                      <Input id="paymentNumberPrefix" {...register("paymentNumberPrefix")} placeholder="PAG" />
                      <Badge variant="secondary" className="whitespace-nowrap font-mono text-[10px]">
                        {getPreview(prefixes.paymentNumberPrefix)}
                      </Badge>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="voucherNumberPrefix">Vouchers</Label>
                    <div className="flex items-center gap-3">
                      <Input id="voucherNumberPrefix" {...register("voucherNumberPrefix")} placeholder="VCH" />
                      <Badge variant="secondary" className="whitespace-nowrap font-mono text-[10px]">
                        {getPreview(prefixes.voucherNumberPrefix)}
                      </Badge>
                    </div>
                  </div>
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
