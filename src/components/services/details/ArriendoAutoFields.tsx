import React from "react";
import { Control, useFormContext, useWatch } from "react-hook-form";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Combobox } from "@/components/ui/combobox";
import { Switch } from "@/components/ui/switch";
import { useCatalog, useModelsForBrand } from "@/hooks/useCatalogs";

export function ArriendoAutoFields({ control }: { control: Control<any> }) {
  const { data: carTypes } = useCatalog("car-types");
  const { data: carBrands } = useCatalog("car-brands");
  const { setValue } = useFormContext();
  const brand = useWatch({ control, name: "details.carBrand" });
  const { models: carModels } = useModelsForBrand(brand);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <FormField control={control} name="details.clientName" render={({ field }) => (
        <FormItem className="sm:col-span-2">
          <FormLabel className="text-xs font-bold text-navy">Cliente principal *</FormLabel>
          <FormControl><Input {...field} className="bg-white" /></FormControl>
          <FormMessage className="text-[10px]" />
        </FormItem>
      )} />
      <FormField control={control} name="details.pickupDate" render={({ field }) => (
        <FormItem>
          <FormLabel className="text-xs font-bold text-navy">Fecha de recogida *</FormLabel>
          <FormControl><Input type="date" {...field} className="bg-white" /></FormControl>
          <FormMessage className="text-[10px]" />
        </FormItem>
      )} />
      <FormField control={control} name="details.pickupTime" render={({ field }) => (
        <FormItem>
          <FormLabel className="text-xs font-bold text-navy">Hora de recogida *</FormLabel>
          <FormControl><Input type="time" {...field} className="bg-white" /></FormControl>
          <FormMessage className="text-[10px]" />
        </FormItem>
      )} />
      <FormField control={control} name="details.dropoffDate" render={({ field }) => (
        <FormItem>
          <FormLabel className="text-xs font-bold text-navy">Fecha de entrega *</FormLabel>
          <FormControl><Input type="date" {...field} className="bg-white" /></FormControl>
          <FormMessage className="text-[10px]" />
        </FormItem>
      )} />
      <FormField control={control} name="details.dropoffTime" render={({ field }) => (
        <FormItem>
          <FormLabel className="text-xs font-bold text-navy">Hora de entrega *</FormLabel>
          <FormControl><Input type="time" {...field} className="bg-white" /></FormControl>
          <FormMessage className="text-[10px]" />
        </FormItem>
      )} />
      <FormField control={control} name="details.pickupAddress" render={({ field }) => (
        <FormItem>
          <FormLabel className="text-xs font-bold text-navy">Dirección de retiro *</FormLabel>
          <FormControl><Input {...field} className="bg-white" /></FormControl>
          <FormMessage className="text-[10px]" />
        </FormItem>
      )} />
      <FormField control={control} name="details.dropoffAddress" render={({ field }) => (
        <FormItem>
          <FormLabel className="text-xs font-bold text-navy">Dirección de entrega *</FormLabel>
          <FormControl><Input {...field} className="bg-white" /></FormControl>
          <FormMessage className="text-[10px]" />
        </FormItem>
      )} />
      <FormField control={control} name="details.carType" render={({ field }) => (
        <FormItem>
          <FormLabel className="text-xs font-bold text-navy">Tipo de auto *</FormLabel>
          <Combobox
            options={carTypes.map((t: any) => ({ value: t.name, label: t.name }))}
            value={field.value}
            onChange={field.onChange}
            allowCustomValue
            placeholder="Ej: SUV"
            searchPlaceholder="Buscar o escribir tipo..."
            className="bg-white"
          />
          <FormMessage className="text-[10px]" />
        </FormItem>
      )} />
      <FormField control={control} name="details.carBrand" render={({ field }) => (
        <FormItem>
          <FormLabel className="text-xs font-bold text-navy">Marca (opcional)</FormLabel>
          <Combobox
            options={carBrands.map((b: any) => ({ value: b.name, label: b.name }))}
            value={field.value}
            onChange={(v) => {
              if (v !== field.value) setValue("details.carModel", "");
              field.onChange(v);
            }}
            allowCustomValue
            placeholder="Ej: Toyota"
            searchPlaceholder="Buscar o escribir marca..."
            className="bg-white"
          />
          <FormMessage className="text-[10px]" />
        </FormItem>
      )} />
      <FormField control={control} name="details.carModel" render={({ field }) => (
        <FormItem>
          <FormLabel className="text-xs font-bold text-navy">Modelo (opcional)</FormLabel>
          <Combobox
            options={carModels.map((m: any) => ({ value: m.name, label: m.name }))}
            value={field.value}
            onChange={field.onChange}
            allowCustomValue
            placeholder="Ej: RAV4"
            searchPlaceholder="Buscar o escribir modelo..."
            className="bg-white"
          />
          <FormMessage className="text-[10px]" />
        </FormItem>
      )} />
      <FormField control={control} name="details.mileageLimitPerDay" render={({ field }) => (
        <FormItem>
          <FormLabel className="text-xs font-bold text-navy">Límite km/día (si aplica)</FormLabel>
          <FormControl><Input type="number" {...field} onChange={(e) => field.onChange(e.target.valueAsNumber)} className="bg-white" /></FormControl>
          <FormMessage className="text-[10px]" />
        </FormItem>
      )} />
      <FormField control={control} name="details.unlimitedMileage" render={({ field }) => (
        <FormItem className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50 p-3 sm:col-span-2">
          <FormLabel className="text-xs font-bold text-navy">Kilometraje ilimitado</FormLabel>
          <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
        </FormItem>
      )} />
      <FormField control={control} name="details.arrivalFlightDateTime" render={({ field }) => (
        <FormItem>
          <FormLabel className="text-xs font-bold text-navy">Vuelo de llegada (opcional)</FormLabel>
          <FormControl><Input type="datetime-local" {...field} className="bg-white" /></FormControl>
          <FormMessage className="text-[10px]" />
        </FormItem>
      )} />
      <FormField control={control} name="details.departureFlightDateTime" render={({ field }) => (
        <FormItem>
          <FormLabel className="text-xs font-bold text-navy">Vuelo de partida (opcional)</FormLabel>
          <FormControl><Input type="datetime-local" {...field} className="bg-white" /></FormControl>
          <FormMessage className="text-[10px]" />
        </FormItem>
      )} />
    </div>
  );
}
