import React, { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useChangeRequestStatus, useRequestStats } from "@/hooks/useRequests";
import { usePagedList } from "@/hooks/usePagedList";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { ListPagination } from "@/components/shared/ListPagination";
import { ListError } from "@/components/shared/ListError";
import { RequestsTable } from "./RequestsTable";
import { RequestFormDialog } from "./RequestFormDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Plus,
  Search,
  FileText,
  Inbox,
  Calculator,
  CheckCircle,
  Trophy
} from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { PermissionGuard } from "@/components/PermissionGuard";
import { useNavigate, useSearchParams } from "react-router-dom";
import { STATUS_PHASES, getStatusLabel } from "@/lib/workflow-status";
import { ExportMenu } from "@/components/shared/ExportMenu";

export default function RequestsPage() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    if (searchParams.get("action") === "new") {
      setIsFormOpen(true);
      searchParams.delete("action");
      setSearchParams(searchParams, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  const queryClient = useQueryClient();
  const { toast } = useToast();


  // Paginado, búsqueda y pestañas en el servidor: cada pestaña agrupa los estados de su fase
  // (STATUS_PHASES) y la API acepta varios separados por comas. El cliente incrustado en cada
  // solicitud basta para la tabla (sin pedir la lista de clientes).
  const tabStatuses = (() => {
    if (activeTab === "all") return undefined;
    if (activeTab === "VENDIDA" || activeTab === "CANCELADA") return activeTab;
    const phase = STATUS_PHASES.find((p) => p.label === activeTab);
    return phase ? (phase.statuses as string[]).join(",") : undefined;
  })();
  const search = useDebouncedValue(searchTerm.trim());
  const list = usePagedList("requests", "/requests", { status: tabStatuses, search });
  const filteredRequests = list.rows;

  // Contadores sobre todas las solicitudes (antes se contaban solo las 20 de la primera página).
  const { data: statsData } = useRequestStats();
  const stats: Record<string, number> = (statsData as any)?.stats ?? {};

  const updateStatusMutation = useChangeRequestStatus();

  const handleEdit = (request: any) => {
    setSelectedRequest(request);
    setIsFormOpen(true);
  };

  const handleView = (request: any) => {
    navigate(`/solicitudes/${request.id}`);
  };

  const handleAdd = () => {
    setSelectedRequest(null);
    setIsFormOpen(true);
  };

  const handleStatusChange = (id: string, newStatus: string, note?: string) => {
    // La nota se guarda en un campo u otro según el destino: cancellationReason queda además
    // en su propia columna de la Solicitud, mientras que notes solo enriquece la Bitácora
    // (ver changeRequestStatus en el backend).
    const payload = newStatus === "CANCELADA" ? { id, status: newStatus, cancellationReason: note } : { id, status: newStatus, notes: note };
    updateStatusMutation.mutate(payload, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["requests"] });
        toast({ title: "Estado actualizado", description: "El estado de la solicitud ha sido cambiado." });
      }
    });
  };

  const getStats = (status: string) => stats[status] ?? 0;
  const getPhaseStats = (phaseLabel: string) => {
    const phase = STATUS_PHASES.find((p) => p.label === phaseLabel);
    if (!phase) return 0;
    return (phase.statuses as string[]).reduce((sum, st) => sum + (stats[st] ?? 0), 0);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-playfair font-bold text-navy mb-1">Solicitudes</h1>
          <p className="text-muted-foreground text-sm">Gestiona el flujo completo de solicitudes de viaje.</p>
        </div>
        <div className="flex gap-2">
          <ExportMenu
            filename="solicitudes_adetravel"
            data={filteredRequests.map((r: any) => ({
              numero: r.requestNumber,
              cliente: r.client ? `${r.client.firstName} ${r.client.lastName || ""}`.trim() : "",
              destino: [r.destinationCity, r.destinationCountry].filter(Boolean).join(", "),
              estado: getStatusLabel(r.status),
              fecha: r.requestDate,
            }))}
            columns={[
              { key: "numero", label: "N° Solicitud" },
              { key: "cliente", label: "Cliente" },
              { key: "destino", label: "Destino" },
              { key: "estado", label: "Estado" },
              { key: "fecha", label: "Fecha" },
            ]}
          />
          <PermissionGuard permission="MANAGE_REQUESTS">
          <Button onClick={handleAdd} className="gap-2 text-xs font-bold uppercase tracking-wider shadow-lg shadow-primary/20">
            <Plus className="w-4 h-4" />
            Nueva Solicitud
          </Button>
          </PermissionGuard>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-gray-100 flex items-center gap-3 shadow-sm">
          <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Total</p>
            <p className="text-xl font-playfair font-bold text-navy">{(statsData as any)?.total ?? list.total}</p>
          </div>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-gray-100 flex items-center gap-3 shadow-sm">
          <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-500">
            <Inbox className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Recibidas</p>
            <p className="text-xl font-playfair font-bold text-navy">{getStats("RECEPCIONADA")}</p>
          </div>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-gray-100 flex items-center gap-3 shadow-sm">
          <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-500">
            <Calculator className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">En Cotización</p>
            <p className="text-xl font-playfair font-bold text-navy">{getPhaseStats("Cotización")}</p>
          </div>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-gray-100 flex items-center gap-3 shadow-sm">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-500">
            <CheckCircle className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Con Proveedor</p>
            <p className="text-xl font-playfair font-bold text-navy">{getPhaseStats("Confirmación proveedor")}</p>
          </div>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-gray-100 flex items-center gap-3 shadow-sm">
          <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600">
            <Trophy className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Vendidas</p>
            <p className="text-xl font-playfair font-bold text-navy">{getStats("VENDIDA")}</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full lg:w-auto overflow-x-auto">
            <TabsList className="bg-muted/50 p-1 h-auto flex-wrap sm:flex-nowrap">
              <TabsTrigger value="all" className="text-[10px] font-bold uppercase tracking-wider px-3 h-8">Todas</TabsTrigger>
              {STATUS_PHASES.map((phase) => (
                <TabsTrigger key={phase.label} value={phase.label} className="text-[10px] font-bold uppercase tracking-wider px-3 h-8">
                  {phase.label}
                </TabsTrigger>
              ))}
              <TabsTrigger value="VENDIDA" className="text-[10px] font-bold uppercase tracking-wider px-3 h-8">Vendidas</TabsTrigger>
              <TabsTrigger value="CANCELADA" className="text-[10px] font-bold uppercase tracking-wider px-3 h-8">Canceladas</TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="flex items-center gap-2 flex-1 md:max-w-sm">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input 
                placeholder="Buscar solicitud o destino..." aria-label="Buscar solicitud o destino" 
                className="pl-10 bg-slate-50 border-slate-100 focus:bg-white transition-all text-sm h-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </div>

        {list.isError ? (
          <ListError error={list.error} onRetry={() => list.refetch()} what="las solicitudes" />
        ) : (
          <>
            <RequestsTable
              requests={filteredRequests}
              isLoading={list.isLoading}
              onEdit={handleEdit}
              onView={handleView}
              onStatusChange={handleStatusChange}
            />
            <ListPagination page={list.page} limit={list.limit} total={list.total} onPageChange={list.setPage} isFetching={list.isFetching} />
          </>
        )}
      </div>

      <RequestFormDialog
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        request={selectedRequest}
        onSuccess={(savedRequest, wasCreated) => {
          queryClient.invalidateQueries({ queryKey: ["requests"] });
          if (wasCreated && savedRequest) {
            navigate(`/solicitudes/${savedRequest.id}`);
          }
        }}
      />
    </div>
  );
}
