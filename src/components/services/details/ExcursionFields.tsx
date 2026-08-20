import React from "react";
import { Control } from "react-hook-form";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";

export function ExcursionFields({ control }: { control: Control<any> }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <FormField control={control} name="details.clientName" render={({ field }) => (
        <FormItem className="md:col-span-2">
          <FormLabel className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Cliente *</FormLabel>
          <FormControl><Input {...field} className="bg-slate-50 border-slate-100" /></FormControl>
          <FormMessage className="text-[10px]" />
        </FormItem>
      )} />
      <FormField control={control} name="details.excursionName" render={({ field }) => (
        <FormItem className="md:col-span-2">
          <FormLabel className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Nombre de la excursión *</FormLabel>
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
          <FormLabel className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Adultos (+12 años) *</FormLabel>
          <FormControl><Input type="number" min={1} {...field} onChange={(e) => field.onChange(e.target.valueAsNumber)} className="bg-slate-50 border-slate-100" /></FormControl>
          <FormMessage className="text-[10px]" />
        </FormItem>
      )} />
      <FormField control={control} name="details.childrenCount" render={({ field }) => (
        <FormItem>
          <FormLabel className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Niños (0-12 años)</FormLabel>
          <FormControl><Input type="number" min={0} {...field} onChange={(e) => field.onChange(e.target.valueAsNumber)} className="bg-slate-50 border-slate-100" /></FormControl>
          <FormMessage className="text-[10px]" />
        </FormItem>
      )} />
    </div>
  );
}
