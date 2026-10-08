import React from "react";
import { Control } from "react-hook-form";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";

export function SeguroFields({ control }: { control: Control<any> }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <FormField control={control} name="details.fullName" render={({ field }) => (
        <FormItem className="sm:col-span-2">
          <FormLabel className="text-xs font-bold text-navy">Nombre y apellidos *</FormLabel>
          <FormControl><Input {...field} className="bg-white" /></FormControl>
          <FormMessage className="text-[10px]" />
        </FormItem>
      )} />
      <FormField control={control} name="details.address" render={({ field }) => (
        <FormItem>
          <FormLabel className="text-xs font-bold text-navy">Dirección *</FormLabel>
          <FormControl><Input {...field} className="bg-white" /></FormControl>
          <FormMessage className="text-[10px]" />
        </FormItem>
      )} />
      <FormField control={control} name="details.phone" render={({ field }) => (
        <FormItem>
          <FormLabel className="text-xs font-bold text-navy">Teléfono *</FormLabel>
          <FormControl><Input {...field} className="bg-white" /></FormControl>
          <FormMessage className="text-[10px]" />
        </FormItem>
      )} />
      <FormField control={control} name="details.birthDate" render={({ field }) => (
        <FormItem>
          <FormLabel className="text-xs font-bold text-navy">Fecha de nacimiento *</FormLabel>
          <FormControl><Input type="date" {...field} className="bg-white" /></FormControl>
          <FormMessage className="text-[10px]" />
        </FormItem>
      )} />
      <FormField control={control} name="details.email" render={({ field }) => (
        <FormItem>
          <FormLabel className="text-xs font-bold text-navy">Correo electrónico</FormLabel>
          <FormControl><Input type="email" {...field} className="bg-white" /></FormControl>
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
          <FormLabel className="text-xs font-bold text-navy">RUT o carnet de identidad</FormLabel>
          <FormControl><Input {...field} className="bg-white" /></FormControl>
          <FormMessage className="text-[10px]" />
        </FormItem>
      )} />
      <FormField control={control} name="details.tripStartDate" render={({ field }) => (
        <FormItem>
          <FormLabel className="text-xs font-bold text-navy">Inicio del viaje *</FormLabel>
          <FormControl><Input type="date" {...field} className="bg-white" /></FormControl>
          <FormMessage className="text-[10px]" />
        </FormItem>
      )} />
      <FormField control={control} name="details.tripEndDate" render={({ field }) => (
        <FormItem>
          <FormLabel className="text-xs font-bold text-navy">Fin del viaje *</FormLabel>
          <FormControl><Input type="date" {...field} className="bg-white" /></FormControl>
          <FormMessage className="text-[10px]" />
        </FormItem>
      )} />
      <FormField control={control} name="details.planType" render={({ field }) => (
        <FormItem>
          <FormLabel className="text-xs font-bold text-navy">Tipo de plan *</FormLabel>
          <FormControl><Input {...field} placeholder="Ej: Plan Oro" className="bg-white" /></FormControl>
          <FormMessage className="text-[10px]" />
        </FormItem>
      )} />
      <FormField control={control} name="details.emergencyContactName" render={({ field }) => (
        <FormItem>
          <FormLabel className="text-xs font-bold text-navy">Contacto de emergencia *</FormLabel>
          <FormControl><Input {...field} className="bg-white" /></FormControl>
          <FormMessage className="text-[10px]" />
        </FormItem>
      )} />
      <FormField control={control} name="details.emergencyContactPhone" render={({ field }) => (
        <FormItem>
          <FormLabel className="text-xs font-bold text-navy">Teléfono de emergencia</FormLabel>
          <FormControl><Input {...field} className="bg-white" /></FormControl>
          <FormMessage className="text-[10px]" />
        </FormItem>
      )} />
    </div>
  );
}
