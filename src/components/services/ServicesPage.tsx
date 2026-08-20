import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useServices } from "@/hooks/useServices";
import { ServicesTable } from "./ServicesTable";
import { Input } from "@/components/ui/input";
import { Search, Package2 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SERVICE_TYPES, SERVICE_TYPE_LABELS } from "@/types/service";
import { WORKFLOW_STATUSES, STATUS_LABELS, getStatusLabel } from "@/lib/workflow-status";
import { ExportMenu } from "@/components/shared/ExportMenu";

export default function ServicesPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const { data: services, isLoading } = useServices({
    type: typeFilter === "all" ? undefined : typeFilter,
    status: statusFilter === "all" ? undefined : statusFilter,
  });

  const { data: requestsData } = useQuery({ queryKey: ["requests-all"], queryFn: () => api.get("/requests?limit=1000") });
  const requests = Array.isArray(requestsData) ? requestsData : (requestsData as any)?.data || [];

  const { data: providersData } = useQuery({ queryKey: ["providers-all"], queryFn: () => api.get("/providers") });
  const providers = Array.isArray(providersData) ? providersData : (providersData as any)?.data || [];

  const filteredServices = services.filter((s: any) => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    const requestNumber = requests.find((r: any) => r.id === s.requestId)?.requestNumber || "";
    return s.serviceNumber?.toLowerCase().includes(search) || requestNumber.toLowerCase().includes(search);
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-playfair font-bold text-navy mb-1 flex items-center gap-2">
          <Package2 className="w-7 h-7 text-primary" />
          Servicios
        </h1>
        <p className="text-muted-foreground text-sm">Todos los servicios (seguro, visa, alojamiento, pasajes, etc.) de todas las solicitudes.</p>
      </div>

      <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex flex-col md:flex-row md:items-center gap-3 flex-1">
          <div className="relative flex-1 md:max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por N° servicio o solicitud..."
              className="pl-10 bg-slate-50 border-slate-100 h-10 text-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-full md:w-48 h-10 bg-slate-50 border-slate-100 text-xs"><SelectValue placeholder="Tipo" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los tipos</SelectItem>
              {SERVICE_TYPES.map((t) => <SelectItem key={t} value={t}>{SERVICE_TYPE_LABELS[t]}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full md:w-56 h-10 bg-slate-50 border-slate-100 text-xs"><SelectValue placeholder="Estado" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los estados</SelectItem>
              {WORKFLOW_STATUSES.map((s) => <SelectItem key={s} value={s}>{STATUS_LABELS[s]}</SelectItem>)}
            </SelectContent>
          </Select>
          </div>
          <ExportMenu
            filename="servicios_adetravel"
            data={filteredServices.map((s: any) => ({
              numero: s.serviceNumber,
              tipo: SERVICE_TYPE_LABELS[s.type as keyof typeof SERVICE_TYPE_LABELS] || s.type,
              solicitud: requests.find((r: any) => r.id === s.requestId)?.requestNumber || "",
              proveedor: providers.find((p: any) => p.id === s.providerId)?.fantasyName || providers.find((p: any) => p.id === s.providerId)?.name || "",
              estado: getStatusLabel(s.status),
              precio: s.price,
            }))}
            columns={[
              { key: "numero", label: "N° Servicio" },
              { key: "tipo", label: "Tipo" },
              { key: "solicitud", label: "Solicitud" },
              { key: "proveedor", label: "Proveedor" },
              { key: "estado", label: "Estado" },
              { key: "precio", label: "Precio" },
            ]}
          />
        </div>

        <ServicesTable services={filteredServices} requests={requests} providers={providers} isLoading={isLoading} />
      </div>
    </div>
  );
}
