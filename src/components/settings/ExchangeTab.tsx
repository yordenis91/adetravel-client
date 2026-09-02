import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription 
} from "@/components/ui/card";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle, 
  SheetDescription,
  SheetFooter
} from "@/components/ui/sheet";
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from "@/components/ui/form";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { api, getErrorMessage } from "@/lib/api";
import { cn } from "@/lib/utils";
import { TrendingUp, Plus, Edit2, Trash2, Save, Loader2, DollarSign, RefreshCw } from "lucide-react";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

const rateSchema = z.object({
  fromCurrency: z.string().min(1, "Moneda origen es requerida"),
  toCurrency: z.string().min(1, "Moneda destino es requerida"),
  label: z.string().min(1, "Etiqueta es requerida"),
  rate: z.coerce.number().positive("La tasa debe ser mayor a 0"),
  isActive: z.boolean().default(true),
}).refine(data => data.fromCurrency !== data.toCurrency, {
  message: "La moneda de origen y destino deben ser diferentes",
  path: ["toCurrency"]
});

type RateFormValues = z.infer<typeof rateSchema>;

interface ExchangeTabProps {
  config: any;
  configId: string | undefined;
}

const CURRENCIES = [
  { value: "CLP", label: "Peso Chileno (CLP)" },
  { value: "USD", label: "Dólar Estadounidense (USD)" },
  { value: "EUR", label: "Euro (EUR)" },
  { value: "ARS", label: "Peso Argentino (ARS)" },
  { value: "BRL", label: "Real Brasileño (BRL)" },
  { value: "PEN", label: "Sol Peruano (PEN)" },
  { value: "COP", label: "Peso Colombiano (COP)" },
  { value: "MXN", label: "Peso Mexicano (MXN)" },
];

export default function ExchangeTab({ config, configId }: ExchangeTabProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [editingRate, setEditingRate] = useState<any>(null);
  const [rates, setRates] = useState<any[]>([]);
  const [rateToDelete, setRateToDelete] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  useEffect(() => {
    if (config && config.exchangeRates) {
      try {
        setRates(JSON.parse(config.exchangeRates));
      } catch (e) {
        console.error("Error parsing exchange rates", e);
        setRates([]);
      }
    } else {
      // Cargamos el estado visual por defecto, pero NO enviamos a la BD automáticamente
      const defaultRate = [{
        id: "default-clp-usd",
        fromCurrency: "USD",
        toCurrency: "CLP",
        rate: 920,
        label: "Dólar Observado",
        isActive: true,
        lastUpdated: new Date().toISOString()
      }];
      setRates(defaultRate);
    }
  }, [config]);

  const form = useForm<RateFormValues>({
    resolver: zodResolver(rateSchema),
    defaultValues: {
      fromCurrency: "USD",
      toCurrency: "CLP",
      label: "Dólar USA",
      rate: 1,
      isActive: true,
    },
  });

  // 2. 🧹 Guardado Seguro: Limpiando la basura antes de enviar a Prisma
  const saveRates = async (newRates: any[], showToast = true) => {
    try {
      // Creamos una copia de la configuración
      const payload = { ...config, exchangeRates: JSON.stringify(newRates) };
      
      // 🔥 ELIMINAMOS los campos protegidos de Prisma para evitar el Error 500
      delete payload.id;
      delete payload.createdAt;
      delete payload.updatedAt;

      // Enviamos el paquete limpio
      await api.put('/system-config', payload);
      
      if (showToast) {
        toast({
          title: "Configuración actualizada",
          description: "Las tasas de cambio se han guardado correctamente.",
        });
      }
      queryClient.invalidateQueries({ queryKey: ["system-config"] });
    } catch (error) {
      console.error("Error saving rates", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudieron guardar los cambios.",
      });
    }
  };

const handleSyncApi = async () => {
    try {
      setIsSyncing(true);
      // Llamamos a nuestra nueva ruta del backend
      await api.post('/system-config/sync');
      
      toast({
        title: "¡Sincronización Exitosa!",
        description: "Todas las tasas han sido actualizadas con el mercado en tiempo real.",
        className: "bg-emerald-50 border-emerald-200 text-emerald-800",
      });
      // Refrescamos los datos en pantalla
      queryClient.invalidateQueries({ queryKey: ["system-config"] });
   } catch (error) {
      // Leemos el mensaje específico que enviamos desde el backend
      const errorMessage = getErrorMessage(error, "No se pudo conectar con el proveedor de divisas.");

      toast({
        variant: "destructive", // O "default" si prefieres que no sea rojo
        title: "Sincronización Protegida",
        description: errorMessage,
      });
    } finally {
      setIsSyncing(false);
    }
  };

  const handleAddRate = () => {
    setEditingRate(null);
    form.reset({
      fromCurrency: "USD",
      toCurrency: "CLP",
      label: "Dólar USA",
      rate: 920,
      isActive: true,
    });
    setIsSheetOpen(true);
  };

  const handleEditRate = (rate: any) => {
    setEditingRate(rate);
    form.reset({
      fromCurrency: rate.fromCurrency,
      toCurrency: rate.toCurrency,
      label: rate.label,
      rate: rate.rate,
      isActive: rate.isActive,
    });
    setIsSheetOpen(true);
  };

  const handleDeleteRate = (id: string) => {
    const updatedRates = rates.filter(r => r.id !== id);
    setRates(updatedRates);
    saveRates(updatedRates);
    setRateToDelete(null);
  };

  const onToggleActive = (id: string, checked: boolean) => {
    const updatedRates = rates.map(r => r.id === id ? { ...r, isActive: checked, lastUpdated: new Date().toISOString() } : r);
    setRates(updatedRates);
    saveRates(updatedRates, false);
  };

  const onSubmit = (values: RateFormValues) => {
    let updatedRates;
    const now = new Date().toISOString();
    
    if (editingRate) {
      updatedRates = rates.map(r => r.id === editingRate.id ? { ...values, id: r.id, lastUpdated: now } : r);
    } else {
      updatedRates = [...rates, { ...values, id: Date.now().toString(), lastUpdated: now }];
    }
    
    setRates(updatedRates);
    saveRates(updatedRates);
    setIsSheetOpen(false);
  };

  return (
    <div className="space-y-6">
      <Card className="border-navy/10 shadow-lg">
        <CardHeader className="bg-navy/[0.02] border-b border-navy/5">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              <div>
                <CardTitle className="text-xl font-playfair font-bold text-navy">Tasas de Cambio</CardTitle>
                <CardDescription>Configura las divisas y valores que se mostrarán en el Dashboard.</CardDescription>
              </div>
            </div>
           <div className="flex items-center gap-2">
              <Button 
                onClick={handleSyncApi} 
                disabled={isSyncing || rates.length === 0}
                variant="outline"
                className="bg-white border-emerald-200 text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800 gap-2 font-bold"
              >
                <RefreshCw className={cn("w-4 h-4", isSyncing && "animate-spin")} />
                {isSyncing ? "Sincronizando..." : "Sincronizar API"}
              </Button>
              
              <Button onClick={handleAddRate} className="bg-navy hover:bg-navy-dark text-white gap-2">
                <Plus className="w-4 h-4" />
                Agregar Tasa
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="border rounded-xl overflow-hidden">
            <Table>
              <TableHeader className="bg-slate-50/50">
                <TableRow>
                  <TableHead className="text-xs font-bold uppercase tracking-wider">Etiqueta</TableHead>
                  <TableHead className="text-xs font-bold uppercase tracking-wider text-center">Conversión</TableHead>
                  <TableHead className="text-xs font-bold uppercase tracking-wider text-center">Tasa</TableHead>
                  <TableHead className="text-xs font-bold uppercase tracking-wider text-center">Última Act.</TableHead>
                  <TableHead className="text-xs font-bold uppercase tracking-wider text-center">Estado</TableHead>
                  <TableHead className="text-xs font-bold uppercase tracking-wider text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rates.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-32 text-center text-muted-foreground italic">
                      No hay tasas configuradas. Agrega la primera para comenzar.
                    </TableCell>
                  </TableRow>
                ) : (
                  rates.map((rate) => (
                    <TableRow key={rate.id} className="hover:bg-slate-50/50 transition-colors">
                      <TableCell className="font-bold text-navy">{rate.label}</TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-2 text-xs font-medium">
                          <span className="px-2 py-1 bg-slate-100 rounded-md">{rate.fromCurrency}</span>
                          <span className="text-muted-foreground text-[10px]">→</span>
                          <span className="px-2 py-1 bg-slate-100 rounded-md">{rate.toCurrency}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-center font-manrope font-bold text-emerald-600">
                        {rate.rate.toLocaleString("es-CL", { maximumFractionDigits: 4 })}
                      </TableCell>
                      <TableCell className="text-center text-[10px] text-muted-foreground">
                        {new Date(rate.lastUpdated).toLocaleDateString("es-CL")}
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex justify-center">
                          <Switch 
                            checked={rate.isActive} 
                            onCheckedChange={(checked) => onToggleActive(rate.id, checked)}
                          />
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 rounded-full hover:bg-blue-50 text-blue-600"
                            onClick={() => handleEditRate(rate)}
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 rounded-full hover:bg-rose-50 text-rose-600"
                            onClick={() => setRateToDelete(rate.id)}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent className="sm:max-w-[450px] p-0 flex flex-col">
          <SheetHeader className="p-8 pb-4">
            <SheetTitle className="text-2xl font-playfair font-bold text-navy">
              {editingRate ? "Editar Tasa" : "Nueva Tasa"}
            </SheetTitle>
            <SheetDescription>
              Define las monedas y el valor de conversión manual.
            </SheetDescription>
          </SheetHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="flex-1 flex flex-col overflow-hidden">
              <div className="flex-1 px-8 space-y-6 pt-4">
                <FormField
                  control={form.control}
                  name="label"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Etiqueta de visualización</FormLabel>
                      <FormControl>
                        <Input placeholder="Ej: Dólar Observado, Euro Turista" {...field} className="bg-slate-50 border-slate-100" />
                      </FormControl>
                      <FormMessage className="text-[10px]" />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="fromCurrency"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-bold uppercase tracking-wider text-muted-foreground">De (Origen)</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="bg-slate-50 border-slate-100">
                              <SelectValue placeholder="Selecciona" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {CURRENCIES.map(curr => (
                              <SelectItem key={curr.value} value={curr.value}>{curr.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage className="text-[10px]" />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="toCurrency"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-bold uppercase tracking-wider text-muted-foreground">A (Destino)</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="bg-slate-50 border-slate-100">
                              <SelectValue placeholder="Selecciona" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {CURRENCIES.map(curr => (
                              <SelectItem key={curr.value} value={curr.value}>{curr.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage className="text-[10px]" />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="rate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Tasa de cambio (1 {form.watch("fromCurrency")} = X {form.watch("toCurrency")})</FormLabel>
                      <div className="relative">
                        <DollarSign className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                        <FormControl>
                          <Input 
                            type="number" 
                            step="0.0001" 
                            placeholder="0.0000" 
                            {...field} 
                            className="pl-9 bg-slate-50 border-slate-100" 
                          />
                        </FormControl>
                      </div>
                      <FormMessage className="text-[10px]" />
                      <p className="text-[10px] text-amber-600 font-medium italic mt-1">
                        Nota: Ingresa cuántas unidades de {form.watch("toCurrency")} equivalen a 1 {form.watch("fromCurrency")}.
                      </p>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="isActive"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between rounded-lg border p-4 bg-slate-50/50">
                      <div className="space-y-0.5">
                        <FormLabel className="text-sm font-bold text-navy">Mostrar en Dashboard</FormLabel>
                        <p className="text-xs text-muted-foreground">Habilita esta tasa para verla en el inicio.</p>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>

              <SheetFooter className="p-8 border-t border-slate-100 bg-slate-50/50">
                <Button type="button" variant="ghost" onClick={() => setIsSheetOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" className="min-w-[120px] bg-navy hover:bg-navy-dark text-white gap-2">
                  <Save className="w-4 h-4" />
                  Guardar Tasa
                </Button>
              </SheetFooter>
            </form>
          </Form>
        </SheetContent>
      </Sheet>

      <ConfirmDialog
        open={!!rateToDelete}
        onOpenChange={(open) => !open && setRateToDelete(null)}
        title="¿Eliminar tasa de cambio?"
        description="Esta acción no se puede deshacer y la tasa dejará de mostrarse en el Dashboard."
        onConfirm={() => rateToDelete && handleDeleteRate(rateToDelete)}
        variant="destructive"
      />
    </div>
  );
}