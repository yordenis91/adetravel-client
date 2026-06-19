import React, { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { ClientsTable } from "./ClientsTable";
import { ClientFormDialog } from "./ClientFormDialog";
import { ClientPreviewDialog } from "./ClientPreviewDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { 
  Plus, 
  Search, 
  Users, 
  UserCheck, 
  UserX, 
  Filter,
  Download
} from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { exportToCsv } from "@/lib/exportCsv";
import { useSearchParams } from "react-router-dom";
import { useToggleClientStatus } from "@/hooks/useClients";


export default function ClientsPage() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<any>(null);
  const [itemToConfirm, setItemToConfirm] = useState<string | null>(null);
  const [actionType, setActionType] = useState<'toggle' | 'delete' | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [selectedPreviewClient, setSelectedPreviewClient] = useState<any>(null);
  const [searchParams, setSearchParams] = useSearchParams();

  // 🔥 NUEVO: Estado para manejar los checkboxes seleccionados
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (searchParams.get("action") === "new") {
      setIsFormOpen(true);
      searchParams.delete("action");
      setSearchParams(searchParams, { replace: true });
    }
  }, [searchParams, setSearchParams]);
  
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: responseData = [], isLoading } = useQuery({
    queryKey: ["clients", activeTab],
    queryFn: async () => {
      if (activeTab === "active") return await api.get('/clients?isActive=true&sortBy=-created_at');
      if (activeTab === "inactive") return await api.get('/clients?isActive=false&sortBy=-created_at');
      return await api.get('/clients?sortBy=-created_at');
    }
  });

  const clients = Array.isArray(responseData) ? responseData : (responseData as any)?.data || [];

  const filteredClients = clients.filter((client: any) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      client.firstName?.toLowerCase().includes(searchLower) ||
      client.lastName?.toLowerCase().includes(searchLower) ||
      client.rut?.toLowerCase().includes(searchLower) ||
      client.email?.toLowerCase().includes(searchLower)
    );
  });

  const toggleClientStatusMutation = useToggleClientStatus();

  // Observer para mensaje de toast después de toggle
  useEffect(() => {
    if (toggleClientStatusMutation.isSuccess) {
      const client = filteredClients.find(c => c.id === itemToConfirm);
      const statusText = client?.isActive ? "activado" : "desactivado";
      toast({ title: `Cliente ${statusText}`, description: "El estado del cliente ha sido actualizado." });
    }
  }, [toggleClientStatusMutation.isSuccess]);

  const handleEdit = (client: any) => {
    setSelectedClient(client);
    setIsFormOpen(true);
  };

  const handleAdd = () => {
    setSelectedClient(null);
    setIsFormOpen(true);
  };

  const handleToggleActive = (id: string) => {
    setItemToConfirm(id);
    setActionType('toggle');
  };

  const handleDelete = (id: string) => {
    setItemToConfirm(id);
    setActionType('delete');
  };

  const handleView = (client: any) => {
    setSelectedPreviewClient(client);
    setIsPreviewOpen(true);
  };

  // Clear selection when tab or filters change
  useEffect(() => {
    setSelectedIds(new Set());
  }, [activeTab, searchTerm]);

  // 🔥 NUEVO: Lógica de Selección
  const handleSelectOne = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSelectAll = () => {
    if (selectedIds.size === filteredClients.length) {
      setSelectedIds(new Set()); // Deseleccionar todos
    } else {
      setSelectedIds(new Set(filteredClients.map((c: any) => c.id))); // Seleccionar todos los filtrados
    }
  };

  // 🔥 NUEVO: Lógica de Exportación Dinámica
  const handleExport = () => {
    // Si hay seleccionados, exportamos esos. Si no, exportamos todos los que estén en pantalla.
    const dataToExport = selectedIds.size > 0 
      ? filteredClients.filter((c: any) => selectedIds.has(c.id))
      : filteredClients;

    if (dataToExport.length === 0) {
      toast({ title: "Sin datos", description: "No hay clientes para exportar.", variant: "destructive" });
      return;
    }

    // Aplanamos la data para que el CSV quede bonito y legible
    const csvFormattedData = dataToExport.map((c: any) => ({
      Nombre: c.firstName,
      Apellido: c.lastName,
      RUT: c.rut || "N/A",
      Pasaporte: c.passportNumber || "N/A",
      Email: c.email || "N/A",
      Telefono: c.phone || "N/A",
      Nacionalidad: c.nationality || "N/A",
      Fuente: c.referralSource || "Directo",
      Estado: c.isActive ? "Activo" : "Inactivo"
    }));

    exportToCsv('clientes_adetravel', csvFormattedData);

    toast({ title: "Exportación exitosa", description: `Se exportaron ${csvFormattedData.length} clientes.` });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-playfair font-bold text-navy mb-1">Clientes</h1>
          <p className="text-muted-foreground text-sm">Gestiona la base de datos de titulares y viajeros.</p>
        </div>
        <div className="flex gap-2">
          {/* 🔥 Se le agregó el evento onClick */}
          <Button 
            variant="outline" 
            onClick={handleExport}
            className="gap-2 bg-white text-xs font-bold uppercase tracking-wider"
          >
            <Download className="w-4 h-4" />
            Exportar {selectedIds.size > 0 ? `(${selectedIds.size})` : ""}
          </Button>
          <Button onClick={handleAdd} className="gap-2 text-xs font-bold uppercase tracking-wider shadow-lg shadow-primary/20">
            <Plus className="w-4 h-4" />
            Nuevo Cliente
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-4 rounded-2xl border border-gray-100 flex items-center gap-4 shadow-sm">
          <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Total Clientes</p>
            <p className="text-2xl font-playfair font-bold text-navy">{clients.length}</p>
          </div>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-gray-100 flex items-center gap-4 shadow-sm">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
            <UserCheck className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Activos</p>
            <p className="text-2xl font-playfair font-bold text-navy">{clients.filter((c: any) => c.isActive).length}</p>
          </div>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-gray-100 flex items-center gap-4 shadow-sm">
          <div className="w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400">
            <UserX className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Inactivos</p>
            <p className="text-2xl font-playfair font-bold text-navy">{clients.filter((c: any) => !c.isActive).length}</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full md:w-auto">
            <TabsList className="bg-muted/50 p-1">
              <TabsTrigger value="all" className="text-xs font-bold uppercase tracking-wider px-4">Todos</TabsTrigger>
              <TabsTrigger value="active" className="text-xs font-bold uppercase tracking-wider px-4">Activos</TabsTrigger>
              <TabsTrigger value="inactive" className="text-xs font-bold uppercase tracking-wider px-4">Inactivos</TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="flex items-center gap-2 flex-1 md:max-w-md">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input 
                placeholder="Buscar por nombre, RUT, email..." 
                className="pl-10 bg-slate-50 border-slate-100 focus:bg-white transition-all text-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button variant="outline" size="icon" className="shrink-0">
              <Filter className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* 🔥 SE PASAN LOS PROPS FALTANTES A LA TABLA */}
        <ClientsTable 
          clients={filteredClients} 
          isLoading={isLoading} 
          onEdit={handleEdit}
          onToggleActive={handleToggleActive}
          onDelete={handleDelete}
          selectedIds={selectedIds}
          onSelectOne={handleSelectOne}
          onSelectAll={handleSelectAll}
        />
      </div>

      <ClientFormDialog 
        open={isFormOpen} 
        onOpenChange={setIsFormOpen} 
        client={selectedClient}
        onSuccess={() => queryClient.invalidateQueries({ queryKey: ["clients"] })}
      />

      <ClientPreviewDialog 
        open={isPreviewOpen}
        onOpenChange={setIsPreviewOpen}
        client={selectedPreviewClient}
      />

      <AlertDialog open={!!itemToConfirm} onOpenChange={(open) => { if (!open) { setItemToConfirm(null); setActionType(null); } }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              {actionType === 'toggle'
                ? (itemToConfirm && filteredClients.find(c => c.id === itemToConfirm)?.isActive 
                    ? "Se desactivará al cliente." 
                    : "Se activará al cliente.")
                : "Se eliminará el cliente de la tabla permanentemente."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => { 
              if (itemToConfirm) { 
                if (actionType === 'toggle') {
                  const client = filteredClients.find(c => c.id === itemToConfirm);
                  if (client) {
                    toggleClientStatusMutation.mutate({ id: itemToConfirm, isActive: client.isActive });
                  }
                } else if (actionType === 'delete') {
                  // TODO: Implementar soft delete cuando se defina el endpoint
                  console.log('Soft delete para cliente:', itemToConfirm);
                }
                setItemToConfirm(null); 
                setActionType(null);
              } 
            }}>
              Confirmar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}