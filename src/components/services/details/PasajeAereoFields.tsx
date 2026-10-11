import React from "react";
import { Control } from "react-hook-form";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Combobox } from "@/components/ui/combobox";
import { useCitiesForCountry } from "@/hooks/useCatalogs";

export function PasajeAereoFields({ control }: { control: Control<any> }) {
  // Sin país elegido se ofrecen todas las ciudades del nomenclador (sin repetir nombres).
  const { cities } = useCitiesForCountry(null);
  const cityOptions = cities.map((c) => ({ value: c.name, label: c.name }));
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <FormField control={control} name="details.fullName" render={({ field }) => (
        <FormItem className="sm:col-span-2">
          <FormLabel className="text-xs font-bold text-navy">Nombre y apellidos *</FormLabel>
          <FormControl><Input {...field} className="bg-white" /></FormControl>
          <FormMessage className="text-[10px]" />
        </FormItem>
      )} />
      <FormField control={control} name="details.origin" render={({ field }) => (
        <FormItem>
          <FormLabel className="text-xs font-bold text-navy">Origen *</FormLabel>
          <Combobox
            options={cityOptions}
            value={field.value}
            onChange={field.onChange}
            allowCustomValue
            placeholder="Ej: Santiago"
            searchPlaceholder="Buscar ciudad o escribir código..."
            className="bg-white"
          />
          <FormMessage className="text-[10px]" />
        </FormItem>
      )} />
      <FormField control={control} name="details.destination" render={({ field }) => (
        <FormItem>
          <FormLabel className="text-xs font-bold text-navy">Destino *</FormLabel>
          <Combobox
            options={cityOptions}
            value={field.value}
            onChange={field.onChange}
            allowCustomValue
            placeholder="Ej: Madrid"
            searchPlaceholder="Buscar ciudad o escribir código..."
            className="bg-white"
          />
          <FormMessage className="text-[10px]" />
        </FormItem>
      )} />
      <FormField control={control} name="details.departureDate" render={({ field }) => (
        <FormItem>
          <FormLabel className="text-xs font-bold text-navy">Fecha de ida *</FormLabel>
          <FormControl><Input type="date" {...field} className="bg-white" /></FormControl>
          <FormMessage className="text-[10px]" />
        </FormItem>
      )} />
      <FormField control={control} name="details.returnDate" render={({ field }) => (
        <FormItem>
          <FormLabel className="text-xs font-bold text-navy">Fecha de regreso *</FormLabel>
          <FormControl><Input type="date" {...field} className="bg-white" /></FormControl>
          <FormMessage className="text-[10px]" />
        </FormItem>
      )} />
      <FormField control={control} name="details.passportNumber" render={({ field }) => (
        <FormItem>
          <FormLabel className="text-xs font-bold text-navy">N° de pasaporte</FormLabel>
          <FormControl><Input {...field} className="bg-white" /></FormControl>
          <FormMessage className="text-[10px]" />
        </FormItem>
      )} />
      <FormField control={control} name="details.rut" render={({ field }) => (
        <FormItem>
          <FormLabel className="text-xs font-bold text-navy">RUT (si no hay pasaporte)</FormLabel>
          <FormControl><Input {...field} className="bg-white" /></FormControl>
          <FormMessage className="text-[10px]" />
        </FormItem>
      )} />
      <FormField control={control} name="details.frequentFlyerNumber" render={({ field }) => (
        <FormItem>
          <FormLabel className="text-xs font-bold text-navy">N° pasajero frecuente</FormLabel>
          <FormControl><Input {...field} className="bg-white" /></FormControl>
          <FormMessage className="text-[10px]" />
        </FormItem>
      )} />
    </div>
  );
}
