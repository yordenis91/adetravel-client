import React from "react";
import { Control } from "react-hook-form";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function CruceroFields({ control }: { control: Control<any> }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <FormField control={control} name="details.clientName" render={({ field }) => (
        <FormItem className="md:col-span-2">
          <FormLabel className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Cliente *</FormLabel>
          <FormControl><Input {...field} className="bg-slate-50 border-slate-100" /></FormControl>
          <FormMessage className="text-[10px]" />
        </FormItem>
      )} />
      <FormField control={control} name="details.cruiseName" render={({ field }) => (
        <FormItem>
          <FormLabel className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Nombre del crucero *</FormLabel>
          <FormControl><Input {...field} className="bg-slate-50 border-slate-100" /></FormControl>
          <FormMessage className="text-[10px]" />
        </FormItem>
      )} />
      <FormField control={control} name="details.cabinType" render={({ field }) => (
        <FormItem>
          <FormLabel className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Tipo de cabina *</FormLabel>
          <Select onValueChange={field.onChange} value={field.value}>
            <FormControl>
              <SelectTrigger className="bg-slate-50 border-slate-100"><SelectValue placeholder="Selecciona" /></SelectTrigger>
            </FormControl>
            <SelectContent>
              <SelectItem value="INTERNA">Interna</SelectItem>
              <SelectItem value="EXTERNA">Externa</SelectItem>
            </SelectContent>
          </Select>
          <FormMessage className="text-[10px]" />
        </FormItem>
      )} />
      <FormField control={control} name="details.cabinCount" render={({ field }) => (
        <FormItem>
          <FormLabel className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Cantidad de camarotes</FormLabel>
          <FormControl><Input type="number" min={1} {...field} onChange={(e) => field.onChange(e.target.valueAsNumber)} className="bg-slate-50 border-slate-100" /></FormControl>
          <FormMessage className="text-[10px]" />
        </FormItem>
      )} />
      <FormField control={control} name="details.passengerCount" render={({ field }) => (
        <FormItem>
          <FormLabel className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Cantidad de personas</FormLabel>
          <FormControl><Input type="number" min={1} {...field} onChange={(e) => field.onChange(e.target.valueAsNumber)} className="bg-slate-50 border-slate-100" /></FormControl>
          <FormMessage className="text-[10px]" />
        </FormItem>
      )} />
      <FormField control={control} name="details.route" render={({ field }) => (
        <FormItem className="md:col-span-2">
          <FormLabel className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Ruta a seguir</FormLabel>
          <FormControl><Input {...field} className="bg-slate-50 border-slate-100" /></FormControl>
          <FormMessage className="text-[10px]" />
        </FormItem>
      )} />
    </div>
  );
}
