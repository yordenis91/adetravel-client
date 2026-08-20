import React from "react";
import { Control } from "react-hook-form";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";

export function TrasladoFields({ control }: { control: Control<any> }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <FormField control={control} name="details.clientName" render={({ field }) => (
        <FormItem className="md:col-span-2">
          <FormLabel className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Cliente *</FormLabel>
          <FormControl><Input {...field} className="bg-slate-50 border-slate-100" /></FormControl>
          <FormMessage className="text-[10px]" />
        </FormItem>
      )} />
      <FormField control={control} name="details.originAddress" render={({ field }) => (
        <FormItem>
          <FormLabel className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Dirección de origen *</FormLabel>
          <FormControl><Input {...field} className="bg-slate-50 border-slate-100" /></FormControl>
          <FormMessage className="text-[10px]" />
        </FormItem>
      )} />
      <FormField control={control} name="details.destinationAddress" render={({ field }) => (
        <FormItem>
          <FormLabel className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Dirección de destino *</FormLabel>
          <FormControl><Input {...field} className="bg-slate-50 border-slate-100" /></FormControl>
          <FormMessage className="text-[10px]" />
        </FormItem>
      )} />
      <FormField control={control} name="details.startDateTime" render={({ field }) => (
        <FormItem>
          <FormLabel className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Fecha y hora de comienzo *</FormLabel>
          <FormControl><Input type="datetime-local" {...field} className="bg-slate-50 border-slate-100" /></FormControl>
          <FormMessage className="text-[10px]" />
        </FormItem>
      )} />
      <FormField control={control} name="details.endDateTime" render={({ field }) => (
        <FormItem>
          <FormLabel className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Fecha y hora de término</FormLabel>
          <FormControl><Input type="datetime-local" {...field} className="bg-slate-50 border-slate-100" /></FormControl>
          <FormMessage className="text-[10px]" />
        </FormItem>
      )} />
      <FormField control={control} name="details.adultsCount" render={({ field }) => (
        <FormItem>
          <FormLabel className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Adultos (+12 años)</FormLabel>
          <FormControl><Input type="number" min={0} {...field} onChange={(e) => field.onChange(e.target.valueAsNumber)} className="bg-slate-50 border-slate-100" /></FormControl>
          <FormMessage className="text-[10px]" />
        </FormItem>
      )} />
      <FormField control={control} name="details.childrenCount" render={({ field }) => (
        <FormItem>
          <FormLabel className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Niños (2-12 años)</FormLabel>
          <FormControl><Input type="number" min={0} {...field} onChange={(e) => field.onChange(e.target.valueAsNumber)} className="bg-slate-50 border-slate-100" /></FormControl>
          <FormMessage className="text-[10px]" />
        </FormItem>
      )} />
      <FormField control={control} name="details.infantsCount" render={({ field }) => (
        <FormItem>
          <FormLabel className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Infantes (0-2 años)</FormLabel>
          <FormControl><Input type="number" min={0} {...field} onChange={(e) => field.onChange(e.target.valueAsNumber)} className="bg-slate-50 border-slate-100" /></FormControl>
          <FormMessage className="text-[10px]" />
        </FormItem>
      )} />
      <FormField control={control} name="details.arrivalFlightDateTime" render={({ field }) => (
        <FormItem>
          <FormLabel className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Vuelo de llegada (opcional)</FormLabel>
          <FormControl><Input type="datetime-local" {...field} className="bg-slate-50 border-slate-100" /></FormControl>
          <FormMessage className="text-[10px]" />
        </FormItem>
      )} />
      <FormField control={control} name="details.departureFlightDateTime" render={({ field }) => (
        <FormItem>
          <FormLabel className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Vuelo de partida (opcional)</FormLabel>
          <FormControl><Input type="datetime-local" {...field} className="bg-slate-50 border-slate-100" /></FormControl>
          <FormMessage className="text-[10px]" />
        </FormItem>
      )} />
    </div>
  );
}
