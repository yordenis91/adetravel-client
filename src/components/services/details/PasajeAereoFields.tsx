import React from "react";
import { Control } from "react-hook-form";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";

export function PasajeAereoFields({ control }: { control: Control<any> }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <FormField control={control} name="details.fullName" render={({ field }) => (
        <FormItem className="md:col-span-2">
          <FormLabel className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Nombre y apellidos *</FormLabel>
          <FormControl><Input {...field} className="bg-slate-50 border-slate-100" /></FormControl>
          <FormMessage className="text-[10px]" />
        </FormItem>
      )} />
      <FormField control={control} name="details.origin" render={({ field }) => (
        <FormItem>
          <FormLabel className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Origen *</FormLabel>
          <FormControl><Input {...field} className="bg-slate-50 border-slate-100" /></FormControl>
          <FormMessage className="text-[10px]" />
        </FormItem>
      )} />
      <FormField control={control} name="details.destination" render={({ field }) => (
        <FormItem>
          <FormLabel className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Destino *</FormLabel>
          <FormControl><Input {...field} className="bg-slate-50 border-slate-100" /></FormControl>
          <FormMessage className="text-[10px]" />
        </FormItem>
      )} />
      <FormField control={control} name="details.departureDate" render={({ field }) => (
        <FormItem>
          <FormLabel className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Fecha de ida *</FormLabel>
          <FormControl><Input type="date" {...field} className="bg-slate-50 border-slate-100" /></FormControl>
          <FormMessage className="text-[10px]" />
        </FormItem>
      )} />
      <FormField control={control} name="details.returnDate" render={({ field }) => (
        <FormItem>
          <FormLabel className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Fecha de regreso *</FormLabel>
          <FormControl><Input type="date" {...field} className="bg-slate-50 border-slate-100" /></FormControl>
          <FormMessage className="text-[10px]" />
        </FormItem>
      )} />
      <FormField control={control} name="details.passportNumber" render={({ field }) => (
        <FormItem>
          <FormLabel className="text-xs font-bold uppercase tracking-wider text-muted-foreground">N° de pasaporte</FormLabel>
          <FormControl><Input {...field} className="bg-slate-50 border-slate-100" /></FormControl>
          <FormMessage className="text-[10px]" />
        </FormItem>
      )} />
      <FormField control={control} name="details.rut" render={({ field }) => (
        <FormItem>
          <FormLabel className="text-xs font-bold uppercase tracking-wider text-muted-foreground">RUT (si no hay pasaporte)</FormLabel>
          <FormControl><Input {...field} className="bg-slate-50 border-slate-100" /></FormControl>
          <FormMessage className="text-[10px]" />
        </FormItem>
      )} />
      <FormField control={control} name="details.frequentFlyerNumber" render={({ field }) => (
        <FormItem>
          <FormLabel className="text-xs font-bold uppercase tracking-wider text-muted-foreground">N° pasajero frecuente</FormLabel>
          <FormControl><Input {...field} className="bg-slate-50 border-slate-100" /></FormControl>
          <FormMessage className="text-[10px]" />
        </FormItem>
      )} />
    </div>
  );
}
