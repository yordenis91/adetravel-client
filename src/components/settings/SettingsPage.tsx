import React from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Settings, Building2, Mail, FileText, Monitor, TrendingUp } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { SystemConfig } from "@/lib/api";
import AgencyTab from "./AgencyTab";
import EmailTab from "./EmailTab";
import DocumentsTab from "./DocumentsTab";
import SystemTab from "./SystemTab";
import ExchangeTab from "./ExchangeTab";

export default function SettingsPage() {
  const { data: configs, isLoading } = useQuery({
    queryKey: ["systemConfig"],
    queryFn: () => SystemConfig.list(),
  });

  const config = configs?.[0];
  const configId = config?.id;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
          <Settings className="w-6 h-6 text-primary" />
        </div>
        <div>
          <h1 className="text-3xl font-playfair font-bold text-navy">Configuración del Sistema</h1>
          <p className="text-muted-foreground">Gestiona los parámetros globales de ADE Travel.</p>
        </div>
      </div>

      <Tabs defaultValue="agencia" className="w-full">
        <TabsList className="bg-navy/5 p-1 mb-8">
          <TabsTrigger 
            value="agencia" 
            className="data-[state=active]:bg-white data-[state=active]:text-navy data-[state=active]:shadow-sm transition-all flex items-center gap-2 px-6 py-2"
          >
            <Building2 className="w-4 h-4" />
            Agencia
          </TabsTrigger>
          <TabsTrigger 
            value="email" 
            className="data-[state=active]:bg-white data-[state=active]:text-navy data-[state=active]:shadow-sm transition-all flex items-center gap-2 px-6 py-2"
          >
            <Mail className="w-4 h-4" />
            Correo & SMTP
          </TabsTrigger>
          <TabsTrigger 
            value="documentos" 
            className="data-[state=active]:bg-white data-[state=active]:text-navy data-[state=active]:shadow-sm transition-all flex items-center gap-2 px-6 py-2"
          >
            <FileText className="w-4 h-4" />
            Documentos
          </TabsTrigger>
          <TabsTrigger 
          value="divisas" 
            className="data-[state=active]:bg-white data-[state=active]:text-navy data-[state=active]:shadow-sm transition-all flex items-center gap-2 px-6 py-2"
          >
            <TrendingUp className="w-4 h-4" />
            Divisas
          </TabsTrigger>
          <TabsTrigger 
            value="sistema" 
            className="data-[state=active]:bg-white data-[state=active]:text-navy data-[state=active]:shadow-sm transition-all flex items-center gap-2 px-6 py-2"
          >
            <Monitor className="w-4 h-4" />
            Sistema
          </TabsTrigger>
        </TabsList>

        <div className="mt-6">
          <TabsContent value="agencia" className="outline-none">
            <AgencyTab config={config} configId={configId} />
          </TabsContent>
          <TabsContent value="email" className="outline-none">
            <EmailTab config={config} configId={configId} />
          </TabsContent>
          <TabsContent value="documentos" className="outline-none">
            <DocumentsTab config={config} configId={configId} />
            </TabsContent>
          <TabsContent value="divisas" className="outline-none">
            <ExchangeTab config={config} configId={configId} />
          </TabsContent>
          <TabsContent value="sistema" className="outline-none">
            <SystemTab config={config} configId={configId} />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
