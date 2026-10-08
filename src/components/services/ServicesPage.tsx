import React, { useState } from "react";
import { usePagedList } from "@/hooks/usePagedList";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { ListPagination } from "@/components/shared/ListPagination";
import { ListError } from "@/components/shared/ListError";
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

  // Paginado, filtros y búsqueda (N° de servicio o de solicitud) en el servidor. Antes se pedían
  // todas las solicitudes con limit=1000 (la API responde 400 por encima de 100) solo para
  // mostrar su número, que ya viene en cada servicio.
  const search = useDebouncedValue(searchTerm.trim());
  const list = usePagedList("services", "/services", { type: typeFilter, status: statusFilter, search });

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
              placeholder="Buscar por N° servicio o solicitud..." aria-label="Buscar por N° servicio o solicitud"
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
            data={list.rows.map((s: any) => ({
              numero: s.serviceNumber,
              tipo: SERVICE_TYPE_LABELS[s.type as keyof typeof SERVICE_TYPE_LABELS] || s.type,
              solicitud: s.request?.requestNumber || "",
              proveedor: s.provider?.fantasyName || s.provider?.name || "",
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

        {list.isError ? (
          <ListError error={list.error} onRetry={() => list.refetch()} what="los servicios" />
        ) : (
          <>
            <ServicesTable services={list.rows} isLoading={list.isLoading} />
            <ListPagination page={list.page} limit={list.limit} total={list.total} onPageChange={list.setPage} isFetching={list.isFetching} />
          </>
        )}
      </div>
    </div>
  );
}
