import React from "react";
import { Control } from "react-hook-form";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";

export function PasajeAereoFields({ control }: { control: Control<any> }) {
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
          <FormControl><Input {...field} className="bg-white" /></FormControl>
          <FormMessage className="text-[10px]" />
        </FormItem>
      )} />
      <FormField control={control} name="details.destination" render={({ field }) => (
        <FormItem>
          <FormLabel className="text-xs font-bold text-navy">Destino *</FormLabel>
          <FormControl><Input {...field} className="bg-white" /></FormControl>
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
