import React, { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useRequests, useChangeRequestStatus } from "@/hooks/useRequests";
import { RequestsTable } from "./RequestsTable";
import { RequestFormDialog } from "./RequestFormDialog";
import { RequestDetailSheet } from "./RequestDetailSheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Plus,
  Search,
  FileText,
  Inbox,
  Calculator,
  CheckCircle,
  Trophy,
  Filter
} from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useSearchParams } from "react-router-dom";
import { STATUS_PHASES, getStatusLabel } from "@/lib/workflow-status";
import { ExportMenu } from "@/components/shared/ExportMenu";

export default function RequestsPage() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => {
    if (searchParams.get("action") === "new") {
      setIsFormOpen(true);
      searchParams.delete("action");
      setSearchParams(searchParams, { replace: true });
    }
  }, [searchParams, setSearchParams]);
  
  const queryClient = useQueryClient();
  const { toast } = useToast();


  // El filtrado por estado se hace en el cliente (ver `filteredRequests`) porque los tabs
  // agrupan varios estados por fase (STATUS_PHASES) y el backend solo soporta un único valor
  // de `status` por consulta. Los datos fluyen crudos (MAYÚSCULAS) desde la API, sin transformar.
  const { data: requestsResponseData, isLoading: isRequestsLoading } = useRequests({});
  const requests = Array.isArray(requestsResponseData) ? requestsResponseData : (requestsResponseData as any)?.data || [];

  const { data: clientsResponseData = [], isLoading: isClientsLoading } = useQuery({
    queryKey: ["clients-all"],
    queryFn: async () => await api.get('/clients')
  });

  const clients = Array.isArray(clientsResponseData) ? clientsResponseData : (clientsResponseData as any)?.data || [];

  // Deep-link desde otras pantallas (p.ej. /servicios) para abrir directamente el detalle de
  // una Solicitud: /solicitudes?view=<requestId>.
  useEffect(() => {
    const viewId = searchParams.get("view");
    if (viewId && requests.length > 0) {
      const found = requests.find((r: any) => r.id === viewId);
      if (found) {
        setSelectedRequest(found);
        setIsDetailOpen(true);
      }
      searchParams.delete("view");
      setSearchParams(searchParams, { replace: true });
    }
  }, [searchParams, setSearchParams, requests]);

  const matchesTab = (status: string) => {
    if (activeTab === "all") return true;
    if (activeTab === "VENDIDA" || activeTab === "CANCELADA") return status === activeTab;
    const phase = STATUS_PHASES.find((p) => p.label === activeTab);
    return phase ? (phase.statuses as string[]).includes(status) : true;
  };

  const filteredRequests = requests.filter((req: any) => {
    if (!matchesTab(req.status)) return false;
    const searchLower = searchTerm.toLowerCase();
    return (
      req.requestNumber?.toLowerCase().includes(searchLower) ||
      req.destinationCity?.toLowerCase().includes(searchLower) ||
      req.destinationCountry?.toLowerCase().includes(searchLower)
    );
  });

  const updateStatusMutation = useChangeRequestStatus();

  const handleEdit = (request: any) => {
    setSelectedRequest(request);
    setIsFormOpen(true);
    setIsDetailOpen(false);
  };

  const handleView = (request: any) => {
    setSelectedRequest(request);
    setIsDetailOpen(true);
  };

  const handleAdd = () => {
    setSelectedRequest(null);
    setIsFormOpen(true);
  };

  const handleStatusChange = (id: string, newStatus: string, cancellationReason?: string) => {
    updateStatusMutation.mutate({ id, status: newStatus, cancellationReason }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["requests"] });
        toast({ title: "Estado actualizado", description: "El estado de la solicitud ha sido cambiado." });
        if (selectedRequest) {
          const updated = requests.find((r: any) => r.id === selectedRequest.id);
          if (updated) setSelectedRequest(updated);
        }
      }
    });
  };

  const getStats = (status: string) => {
    return requests.filter((r: any) => r.status === status).length;
  };
  const getPhaseStats = (phaseLabel: string) => {
    const phase = STATUS_PHASES.find((p) => p.label === phaseLabel);
    if (!phase) return 0;
    return requests.filter((r: any) => (phase.statuses as string[]).includes(r.status)).length;
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
              cliente: clients.find((c: any) => c.id === r.clientId)?.firstName + " " + (clients.find((c: any) => c.id === r.clientId)?.lastName || ""),
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
          <Button onClick={handleAdd} className="gap-2 text-xs font-bold uppercase tracking-wider shadow-lg shadow-primary/20">
            <Plus className="w-4 h-4" />
            Nueva Solicitud
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-gray-100 flex items-center gap-3 shadow-sm">
          <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Total</p>
            <p className="text-xl font-playfair font-bold text-navy">{requests.length}</p>
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
                placeholder="Buscar solicitud o destino..." 
                className="pl-10 bg-slate-50 border-slate-100 focus:bg-white transition-all text-sm h-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button variant="outline" size="icon" className="shrink-0 h-10 w-10">
              <Filter className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <RequestsTable 
          requests={filteredRequests} 
          isLoading={isRequestsLoading || isClientsLoading} 
          clients={clients}
          onEdit={handleEdit}
          onView={handleView}
          onStatusChange={handleStatusChange}
        />
      </div>

      <RequestFormDialog
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        request={selectedRequest}
        clients={clients}
        onSuccess={(savedRequest, wasCreated) => {
          queryClient.invalidateQueries({ queryKey: ["requests"] });
          if (wasCreated && savedRequest) {
            setSelectedRequest(savedRequest);
            setIsDetailOpen(true);
          }
        }}
      />

      <RequestDetailSheet 
        open={isDetailOpen}
        onOpenChange={setIsDetailOpen}
        request={selectedRequest}
        clients={clients}
        onStatusChange={handleStatusChange}
        onEdit={handleEdit}
      />
    </div>
  );
}
