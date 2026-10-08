import React from "react";
import { Control } from "react-hook-form";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";

export function CircuitoFields({ control }: { control: Control<any> }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <FormField control={control} name="details.clientName" render={({ field }) => (
        <FormItem className="sm:col-span-2">
          <FormLabel className="text-xs font-bold text-navy">Cliente *</FormLabel>
          <FormControl><Input {...field} className="bg-white" /></FormControl>
          <FormMessage className="text-[10px]" />
        </FormItem>
      )} />
      <FormField control={control} name="details.circuitName" render={({ field }) => (
        <FormItem className="sm:col-span-2">
          <FormLabel className="text-xs font-bold text-navy">Nombre del circuito *</FormLabel>
          <FormControl><Input {...field} className="bg-white" /></FormControl>
          <FormMessage className="text-[10px]" />
        </FormItem>
      )} />
      <FormField control={control} name="details.startDate" render={({ field }) => (
        <FormItem>
          <FormLabel className="text-xs font-bold text-navy">Fecha de inicio *</FormLabel>
          <FormControl><Input type="date" {...field} className="bg-white" /></FormControl>
          <FormMessage className="text-[10px]" />
        </FormItem>
      )} />
      <FormField control={control} name="details.endDate" render={({ field }) => (
        <FormItem>
          <FormLabel className="text-xs font-bold text-navy">Fecha de término</FormLabel>
          <FormControl><Input type="date" {...field} className="bg-white" /></FormControl>
          <FormMessage className="text-[10px]" />
        </FormItem>
      )} />
      <FormField control={control} name="details.passengerCount" render={({ field }) => (
        <FormItem>
          <FormLabel className="text-xs font-bold text-navy">Cantidad de personas</FormLabel>
          <FormControl><Input type="number" min={1} {...field} onChange={(e) => field.onChange(e.target.valueAsNumber)} className="bg-white" /></FormControl>
          <FormMessage className="text-[10px]" />
        </FormItem>
      )} />
      <FormField control={control} name="details.route" render={({ field }) => (
        <FormItem className="sm:col-span-2">
          <FormLabel className="text-xs font-bold text-navy">Ruta a seguir</FormLabel>
          <FormControl><Input {...field} className="bg-white" /></FormControl>
          <FormMessage className="text-[10px]" />
        </FormItem>
      )} />
    </div>
  );
}
