import React from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { BookOpen } from "lucide-react";
import { CatalogTab } from "./CatalogTab";

export default function NomencladoresPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-playfair font-bold text-navy mb-1 flex items-center gap-2">
          <BookOpen className="w-7 h-7 text-primary" />
          Nomencladores
        </h1>
        <p className="text-muted-foreground text-sm">
          Catálogos administrables que alimentan los combobox de país, ciudad, región, nacionalidad y auto en los formularios del sistema.
        </p>
      </div>

      <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
        <Tabs defaultValue="countries">
          <TabsList className="bg-muted/50 p-1 h-auto flex-wrap mb-6">
            <TabsTrigger value="countries" className="text-[10px] font-bold uppercase tracking-wider px-3 h-8">Países</TabsTrigger>
            <TabsTrigger value="cities" className="text-[10px] font-bold uppercase tracking-wider px-3 h-8">Ciudades</TabsTrigger>
            <TabsTrigger value="regions" className="text-[10px] font-bold uppercase tracking-wider px-3 h-8">Regiones</TabsTrigger>
            <TabsTrigger value="nationalities" className="text-[10px] font-bold uppercase tracking-wider px-3 h-8">Nacionalidades</TabsTrigger>
            <TabsTrigger value="car-types" className="text-[10px] font-bold uppercase tracking-wider px-3 h-8">Tipo de Auto</TabsTrigger>
            <TabsTrigger value="car-brands" className="text-[10px] font-bold uppercase tracking-wider px-3 h-8">Marca de Auto</TabsTrigger>
            <TabsTrigger value="car-models" className="text-[10px] font-bold uppercase tracking-wider px-3 h-8">Modelo de Auto</TabsTrigger>
          </TabsList>

          <TabsContent value="countries"><CatalogTab resource="countries" label="País" /></TabsContent>
          <TabsContent value="cities"><CatalogTab resource="cities" label="Ciudad" parent={{ resource: "countries", field: "countryId", label: "País" }} /></TabsContent>
          <TabsContent value="regions"><CatalogTab resource="regions" label="Región" parent={{ resource: "countries", field: "countryId", label: "País" }} /></TabsContent>
          <TabsContent value="nationalities"><CatalogTab resource="nationalities" label="Nacionalidad" /></TabsContent>
          <TabsContent value="car-types"><CatalogTab resource="car-types" label="Tipo de Auto" /></TabsContent>
          <TabsContent value="car-brands"><CatalogTab resource="car-brands" label="Marca de Auto" /></TabsContent>
          <TabsContent value="car-models"><CatalogTab resource="car-models" label="Modelo de Auto" parent={{ resource: "car-brands", field: "carBrandId", label: "Marca" }} /></TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
