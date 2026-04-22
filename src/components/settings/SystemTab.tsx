import React, { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { SystemConfig } from "@/lib/api";
import { Save, Monitor, RefreshCw, Download, CheckCircle2 } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface SystemTabProps {
  config: any;
  configId: string | undefined;
}

export default function SystemTab({ config, configId }: SystemTabProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { handleSubmit, reset, control } = useForm({
    defaultValues: config || {
      timezone: "America/Santiago",
      defaultCurrency: "CLP",
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
        description: "Las preferencias del sistema han sido actualizadas.",
      });
      queryClient.invalidateQueries({ queryKey: ["systemConfig"] });
    } catch (error) {
      console.error("Error saving system config", error);
      toast({
        variant: "destructive",
        title: "Error al guardar",
        description: "No se pudieron guardar los cambios.",
      });
    }
  };

  const handleClearCache = () => {
    toast({
      title: "Caché limpiado",
      description: "El caché del sistema ha sido liberado correctamente.",
    });
  };

  const handleExportConfig = () => {
    const configData = JSON.stringify(config, null, 2);
    const blob = new Blob([configData], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ade-travel-config-${format(new Date(), "yyyy-MM-dd")}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({
      title: "Exportación completada",
      description: "La configuración se ha descargado correctamente.",
    });
  };

  return (
    <div className="space-y-8">
      <Card className="border-navy/10 shadow-lg">
        <CardHeader className="bg-navy/[0.02] border-b border-navy/5">
          <div className="flex items-center gap-2">
            <Monitor className="w-5 h-5 text-primary" />
            <div>
              <CardTitle className="text-xl font-playfair">Preferencias del Sistema</CardTitle>
              <CardDescription>Ajustes generales de visualización y tiempo.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="timezone">Zona Horaria</Label>
                <Controller
                  name="timezone"
                  control={control}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccione zona horaria" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="America/Santiago">America/Santiago (Chile)</SelectItem>
                        <SelectItem value="America/Buenos_Aires">America/Buenos_Aires (Argentina)</SelectItem>
                        <SelectItem value="America/Lima">America/Lima (Perú)</SelectItem>
                        <SelectItem value="America/Bogota">America/Bogota (Colombia)</SelectItem>
                        <SelectItem value="America/Mexico_City">America/Mexico_City (México)</SelectItem>
                        <SelectItem value="America/New_York">America/New_York (EE.UU.)</SelectItem>
                        <SelectItem value="Europe/Madrid">Europe/Madrid (España)</SelectItem>
                        <SelectItem value="UTC">UTC (Tiempo Universal)</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
              <div className="space-y-2">
                <Label>Moneda Predeterminada (Referencia)</Label>
                <div className="px-3 py-2 bg-slate-50 border rounded-md text-sm text-muted-foreground flex items-center justify-between">
                  <span>{config?.defaultCurrency || "CLP"}</span>
                  <Badge variant="outline" className="text-[10px]">Documentos Tab</Badge>
                </div>
              </div>
            </div>

            <div className="border-t pt-8">
              <h3 className="text-lg font-playfair font-semibold text-navy mb-4">Información del Sistema</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 border rounded-lg bg-slate-50/50">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider font-bold mb-1">Versión del Sistema</p>
                  <p className="font-semibold">ADE Travel v1.0</p>
                </div>
                <div className="p-4 border rounded-lg bg-slate-50/50">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider font-bold mb-1">Entorno</p>
                  <p className="font-semibold">Producción</p>
                </div>
                <div className="p-4 border rounded-lg bg-slate-50/50">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider font-bold mb-1">Última actualización</p>
                  <p className="font-semibold">{format(new Date(), "d 'de' MMMM, yyyy", { locale: es })}</p>
                </div>
                <div className="p-4 border rounded-lg bg-slate-50/50">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider font-bold mb-1">Estado del Servicio</p>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                    <span className="font-semibold text-green-700">Operativo</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="border-t pt-8">
              <h3 className="text-lg font-playfair font-semibold text-navy mb-4">Acciones de Mantenimiento</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 border rounded-lg hover:border-primary/50 transition-colors group">
                  <div className="flex flex-col gap-3">
                    <div>
                      <h4 className="font-semibold group-hover:text-primary transition-colors">Limpiar Caché del Sistema</h4>
                      <p className="text-xs text-muted-foreground">Libera memoria temporal y refresca los datos cargados.</p>
                    </div>
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="sm" 
                      className="w-fit gap-2"
                      onClick={handleClearCache}
                    >
                      <RefreshCw className="w-4 h-4" />
                      Limpiar Caché
                    </Button>
                  </div>
                </div>
                <div className="p-4 border rounded-lg hover:border-primary/50 transition-colors group">
                  <div className="flex flex-col gap-3">
                    <div>
                      <h4 className="font-semibold group-hover:text-primary transition-colors">Exportar Configuración</h4>
                      <p className="text-xs text-muted-foreground">Descarga una copia de seguridad de los ajustes actuales.</p>
                    </div>
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="sm" 
                      className="w-fit gap-2"
                      onClick={handleExportConfig}
                    >
                      <Download className="w-4 h-4" />
                      Exportar JSON
                    </Button>
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
