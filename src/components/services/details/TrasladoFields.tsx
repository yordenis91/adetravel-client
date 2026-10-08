import React from "react";
import { Control } from "react-hook-form";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";

export function TrasladoFields({ control }: { control: Control<any> }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <FormField control={control} name="details.clientName" render={({ field }) => (
        <FormItem className="sm:col-span-2">
          <FormLabel className="text-xs font-bold text-navy">Cliente *</FormLabel>
          <FormControl><Input {...field} className="bg-white" /></FormControl>
          <FormMessage className="text-[10px]" />
        </FormItem>
      )} />
      <FormField control={control} name="details.originAddress" render={({ field }) => (
        <FormItem>
          <FormLabel className="text-xs font-bold text-navy">Dirección de origen *</FormLabel>
          <FormControl><Input {...field} className="bg-white" /></FormControl>
          <FormMessage className="text-[10px]" />
        </FormItem>
      )} />
      <FormField control={control} name="details.destinationAddress" render={({ field }) => (
        <FormItem>
          <FormLabel className="text-xs font-bold text-navy">Dirección de destino *</FormLabel>
          <FormControl><Input {...field} className="bg-white" /></FormControl>
          <FormMessage className="text-[10px]" />
        </FormItem>
      )} />
      <FormField control={control} name="details.startDateTime" render={({ field }) => (
        <FormItem>
          <FormLabel className="text-xs font-bold text-navy">Fecha y hora de comienzo *</FormLabel>
          <FormControl><Input type="datetime-local" {...field} className="bg-white" /></FormControl>
          <FormMessage className="text-[10px]" />
        </FormItem>
      )} />
      <FormField control={control} name="details.endDateTime" render={({ field }) => (
        <FormItem>
          <FormLabel className="text-xs font-bold text-navy">Fecha y hora de término</FormLabel>
          <FormControl><Input type="datetime-local" {...field} className="bg-white" /></FormControl>
          <FormMessage className="text-[10px]" />
        </FormItem>
      )} />
      <FormField control={control} name="details.adultsCount" render={({ field }) => (
        <FormItem>
          <FormLabel className="text-xs font-bold text-navy">Adultos (+12 años)</FormLabel>
          <FormControl><Input type="number" min={0} {...field} onChange={(e) => field.onChange(e.target.valueAsNumber)} className="bg-white" /></FormControl>
          <FormMessage className="text-[10px]" />
        </FormItem>
      )} />
      <FormField control={control} name="details.childrenCount" render={({ field }) => (
        <FormItem>
          <FormLabel className="text-xs font-bold text-navy">Niños (2-12 años)</FormLabel>
          <FormControl><Input type="number" min={0} {...field} onChange={(e) => field.onChange(e.target.valueAsNumber)} className="bg-white" /></FormControl>
          <FormMessage className="text-[10px]" />
        </FormItem>
      )} />
      <FormField control={control} name="details.infantsCount" render={({ field }) => (
        <FormItem>
          <FormLabel className="text-xs font-bold text-navy">Infantes (0-2 años)</FormLabel>
          <FormControl><Input type="number" min={0} {...field} onChange={(e) => field.onChange(e.target.valueAsNumber)} className="bg-white" /></FormControl>
          <FormMessage className="text-[10px]" />
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
