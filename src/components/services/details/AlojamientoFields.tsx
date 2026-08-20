import React from "react";
import { Control, useFieldArray, useFormContext } from "react-hook-form";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2 } from "lucide-react";

const ROOM_TYPES = ["SINGLE", "DOBLE", "TRIPLE", "CUADRUPLE", "FAMILIAR"];

export function AlojamientoFields({ control }: { control: Control<any> }) {
  const { formState } = useFormContext();
  const { fields, append, remove } = useFieldArray({ control, name: "details.rooms" as any });

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField control={control} name="details.hotelName" render={({ field }) => (
          <FormItem>
            <FormLabel className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Nombre de Hotel/Casa *</FormLabel>
            <FormControl><Input {...field} className="bg-slate-50 border-slate-100" /></FormControl>
            <FormMessage className="text-[10px]" />
          </FormItem>
        )} />
        <FormField control={control} name="details.hotelChain" render={({ field }) => (
          <FormItem>
            <FormLabel className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Cadena hotelera *</FormLabel>
            <FormControl><Input {...field} placeholder="Ej: Independiente" className="bg-slate-50 border-slate-100" /></FormControl>
            <FormMessage className="text-[10px]" />
          </FormItem>
        )} />
        <FormField control={control} name="details.checkIn" render={({ field }) => (
          <FormItem>
            <FormLabel className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Fecha In *</FormLabel>
            <FormControl><Input type="date" {...field} className="bg-slate-50 border-slate-100" /></FormControl>
            <FormMessage className="text-[10px]" />
          </FormItem>
        )} />
        <FormField control={control} name="details.checkOut" render={({ field }) => (
          <FormItem>
            <FormLabel className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Fecha Out *</FormLabel>
            <FormControl><Input type="date" {...field} className="bg-slate-50 border-slate-100" /></FormControl>
            <FormMessage className="text-[10px]" />
          </FormItem>
        )} />
        <FormField control={control} name="details.hotelCity" render={({ field }) => (
          <FormItem>
            <FormLabel className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Ciudad</FormLabel>
            <FormControl><Input {...field} className="bg-slate-50 border-slate-100" /></FormControl>
            <FormMessage className="text-[10px]" />
          </FormItem>
        )} />
        <FormField control={control} name="details.hotelCountry" render={({ field }) => (
          <FormItem>
            <FormLabel className="text-xs font-bold uppercase tracking-wider text-muted-foreground">País</FormLabel>
            <FormControl><Input {...field} className="bg-slate-50 border-slate-100" /></FormControl>
            <FormMessage className="text-[10px]" />
          </FormItem>
        )} />
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <FormLabel className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Habitaciones *</FormLabel>
          <Button type="button" variant="outline" size="sm" onClick={() => append({ responsibleName: "", roomType: "DOBLE" })}>
            <Plus className="w-3 h-3 mr-1" /> Añadir habitación
          </Button>
        </div>
        {fields.map((field, index) => (
          <div key={field.id} className="flex items-center gap-2">
            <FormField control={control} name={`details.rooms.${index}.responsibleName` as any} render={({ field }) => (
              <FormItem className="flex-1">
                <FormControl><Input placeholder="Responsable de la habitación" {...field} className="bg-slate-50 border-slate-100" /></FormControl>
              </FormItem>
            )} />
            <FormField control={control} name={`details.rooms.${index}.roomType` as any} render={({ field }) => (
              <FormItem className="w-40">
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger className="bg-slate-50 border-slate-100"><SelectValue /></SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {ROOM_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </FormItem>
            )} />
            {fields.length > 1 && (
              <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)}>
                <Trash2 className="w-4 h-4 text-destructive" />
              </Button>
            )}
          </div>
        ))}
        {(formState.errors as any)?.details?.rooms && (
          <p className="text-[10px] font-medium text-destructive">{(formState.errors as any).details.rooms.message}</p>
        )}
      </div>
    </div>
  );
}
