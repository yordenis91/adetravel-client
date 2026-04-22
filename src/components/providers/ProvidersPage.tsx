import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { ProvidersTable } from "./ProvidersTable";
import { ProviderFormDialog } from "./ProviderFormDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Plus, 
  Search, 
  Building2, 
  CheckCircle2, 
  XCircle, 
  Filter,
  Download,
  ChevronDown
} from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function ProvidersPage() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: providers = [], isLoading } = useQuery({
    queryKey: ["providers", activeTab],
    queryFn: async () => {
      if (activeTab === "active") return await Provider.filter({ isActive: true }, "-created_at");
      if (activeTab === "inactive") return await Provider.filter({ isActive: false }, "-created_at");
      return await api.get('/providers?sortBy=-created_at');
    }
  });

  const filteredProviders = providers.filter((p: any) => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = (
      p.name?.toLowerCase().includes(searchLower) ||
      p.fantasyName?.toLowerCase().includes(searchLower) ||
      p.email?.toLowerCase().includes(searchLower) ||
      p.businessType?.toLowerCase().includes(searchLower)
    );
    const matchesType = typeFilter === "all" || p.businessType === typeFilter;
    return matchesSearch && matchesType;
  });

  const deactivateMutation = useMutation({
    mutationFn: (id: string) => api.patch(`/providers/${id}`, { isActive: false }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["providers"] });
      toast({ title: "Proveedor desactivado", description: "El estado del proveedor ha sido actualizado." });
    }
  });

  const handleEdit = (provider: any) => {
    setSelectedProvider(provider);
    setIsFormOpen(true);
  };

  const handleAdd = () => {
    setSelectedProvider(null);
    setIsFormOpen(true);
  };

  const handleDelete = (id: string) => {
    if (window.confirm("¿Estás seguro de que deseas desactivar este proveedor?")) {
      deactivateMutation.mutate(id);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-playfair font-bold text-navy mb-1">Proveedores</h1>
          <p className="text-muted-foreground text-sm">Gestiona la red de proveedores de servicios turísticos.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2 bg-white text-xs font-bold uppercase tracking-wider">
            <Download className="w-4 h-4" />
            Exportar
          </Button>
          <Button onClick={handleAdd} className="gap-2 text-xs font-bold uppercase tracking-wider shadow-lg shadow-primary/20">
            <Plus className="w-4 h-4" />
            Nuevo Proveedor
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-4 rounded-2xl border border-gray-100 flex items-center gap-4 shadow-sm">
          <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Total Proveedores</p>
            <p className="text-2xl font-playfair font-bold text-navy">{providers.length}</p>
          </div>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-gray-100 flex items-center gap-4 shadow-sm">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Activos</p>
            <p className="text-2xl font-playfair font-bold text-navy">{providers.filter((p: any) => p.isActive).length}</p>
          </div>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-gray-100 flex items-center gap-4 shadow-sm">
          <div className="w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400">
            <XCircle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Inactivos</p>
            <p className="text-2xl font-playfair font-bold text-navy">{providers.filter((p: any) => !p.isActive).length}</p>
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

          <div className="flex items-center gap-2 flex-1 md:max-w-2xl">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input 
                placeholder="Buscar por nombre, tipo, email..." 
                className="pl-10 bg-slate-50 border-slate-100 focus:bg-white transition-all text-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[180px] bg-slate-50 border-slate-100 text-xs font-medium">
                <SelectValue placeholder="Tipo de Servicio" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los tipos</SelectItem>
                <SelectItem value="RENT_A_CAR">Arriendo de Autos</SelectItem>
                <SelectItem value="TOUR_OPERATOR">Operador de Turismo</SelectItem>
                <SelectItem value="INSURANCE">Seguros</SelectItem>
                <SelectItem value="AIRLINE">Aerolínea</SelectItem>
                <SelectItem value="HOTEL">Hotel</SelectItem>
                <SelectItem value="PRIVATE_HOUSE">Casa Particular</SelectItem>
                <SelectItem value="PRIVATE_CAR">Auto Particular</SelectItem>
                <SelectItem value="TOURIST_SERVICES">Servicios Turísticos</SelectItem>
                <SelectItem value="RESTAURANT">Restaurante</SelectItem>
                <SelectItem value="OTHER">Otro</SelectItem>
              </SelectContent>
            </Select>

            <Button variant="outline" size="icon" className="shrink-0 bg-slate-50 border-slate-100">
              <Filter className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <ProvidersTable 
          providers={filteredProviders} 
          isLoading={isLoading} 
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      </div>

      <ProviderFormDialog 
        open={isFormOpen} 
        onOpenChange={setIsFormOpen} 
        provider={selectedProvider}
        onSuccess={() => queryClient.invalidateQueries({ queryKey: ["providers"] })}
      />
    </div>
  );
}
