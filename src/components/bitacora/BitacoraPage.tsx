import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { TimelineItem } from "./TimelineItem";
import {
  Search,
  Filter,
  History,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Clock,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function BitacoraPage() {
  const [filterType, setFilterType] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // 🔥 Efecto Debounce: Espera 500ms después de que el usuario deja de escribir para buscar
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchTerm), 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // 1. Obtener estadísticas globales REALES desde el backend
  const { data: statsResponse } = useQuery({
    queryKey: ["activity-logs-stats"],
    queryFn: () => api.get("/activity-logs/stats?days=7")
  });
  
  const stats = (statsResponse as any)?.data || statsResponse || { total: 0, today: 0, recent: 0 };

  // 2. Obtener logs delegando el filtro y la búsqueda a la Base de Datos
  const { data: logsResponse, isLoading } = useQuery({
    queryKey: ["activity-logs", filterType, debouncedSearch],
    queryFn: () => {
      const params = new URLSearchParams({ limit: "100" });
      if (filterType !== "all") params.append("entityType", filterType);
      if (debouncedSearch) params.append("search", debouncedSearch);
      return api.get(`/activity-logs?${params.toString()}`);
    }
  });

  const logs = Array.isArray(logsResponse) ? logsResponse : (logsResponse as any)?.data || [];

  return (
    <div className="flex flex-col gap-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-playfair font-bold text-navy dark:text-white flex items-center gap-3">
          <History className="w-8 h-8 text-primary" />
          Bitácora de Actividad
        </h1>
        <p className="text-muted-foreground mt-2">
          Registro cronológico de todas las acciones realizadas en el sistema.
        </p>
      </div>

      {/* Tarjetas de Estadísticas Reales */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-navy border-none text-white overflow-hidden relative shadow-lg">
          <div className="absolute right-0 top-0 p-4 opacity-10">
            <History className="w-16 h-16" />
          </div>
          <CardContent className="p-6">
            <p className="text-xs font-bold uppercase tracking-widest text-primary mb-1">Total Eventos</p>
            <h3 className="text-3xl font-playfair font-bold">{stats.total}</h3>
            <p className="text-[10px] text-white/50 mt-1">Registrados en el sistema histórico</p>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-navy-dark border-none shadow-md overflow-hidden relative">
          <div className="absolute right-0 top-0 p-4 opacity-5 text-navy">
            <Calendar className="w-16 h-16" />
          </div>
          <CardContent className="p-6">
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1">Hoy</p>
            <h3 className="text-3xl font-playfair font-bold text-navy dark:text-white">{stats.today}</h3>
            <div className="flex items-center gap-1 text-[10px] text-emerald-600 mt-1 font-bold">
              <CheckCircle2 className="w-3 h-3" /> Eventos en las últimas 24h
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-navy-dark border-none shadow-md overflow-hidden relative">
          <div className="absolute right-0 top-0 p-4 opacity-5 text-navy">
            <Clock className="w-16 h-16" />
          </div>
          <CardContent className="p-6">
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1">Últimos 7 Días</p>
            {/* El endpoint del backend devuelve 'recent' basado en los días solicitados */}
            <h3 className="text-3xl font-playfair font-bold text-navy dark:text-white">{stats.recent || stats.week || 0}</h3>
            <div className="flex items-center gap-1 text-[10px] text-amber-600 mt-1 font-bold">
              <AlertCircle className="w-3 h-3" /> Actividad de la semana
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="bg-white dark:bg-navy-dark border-none rounded-2xl p-6 shadow-xl">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between mb-8 pb-6 border-b border-slate-100 dark:border-slate-800">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Buscar por descripción, ID o etiqueta..." 
              className="pl-10 h-11 bg-slate-50 dark:bg-navy-light/50 border-none rounded-xl"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="flex items-center gap-2 text-sm font-bold text-navy dark:text-white uppercase tracking-wider">
              <Filter className="w-4 h-4" /> Filtrar:
            </div>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-full md:w-[180px] h-11 bg-slate-50 dark:bg-navy-light/50 border-none rounded-xl">
                <SelectValue placeholder="Tipo de entidad" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los tipos</SelectItem>
                <SelectItem value="Cliente">Clientes</SelectItem>
                <SelectItem value="Proveedor">Proveedores</SelectItem>
                <SelectItem value="Solicitud">Solicitudes</SelectItem>
                <SelectItem value="Cotización">Cotizaciones</SelectItem>
                <SelectItem value="Pago">Pagos</SelectItem>
                <SelectItem value="Voucher">Vouchers</SelectItem>
                <SelectItem value="EmailTemplate">Plantillas Email</SelectItem>
                <SelectItem value="User">Usuarios</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <Loader2 className="w-10 h-10 text-primary animate-spin" />
            <p className="text-sm font-medium text-muted-foreground">Consultando base de datos...</p>
          </div>
        ) : logs.length > 0 ? (
          <ScrollArea className="h-[600px] pr-6">
            <div className="max-w-4xl mx-auto py-4">
              {logs.map((log: any, index: number) => (
                <TimelineItem 
                  key={log.id} 
                  log={log} 
                  isLast={index === logs.length - 1} 
                />
              ))}
            </div>
          </ScrollArea>
        ) : (
          <div className="flex flex-col items-center justify-center py-32 gap-6 text-center">
            <div className="w-20 h-20 rounded-full bg-slate-50 dark:bg-navy-light/30 flex items-center justify-center">
              <History className="w-10 h-10 text-slate-200" />
            </div>
            <div className="space-y-2 max-w-xs">
              <h3 className="text-lg font-playfair font-bold text-navy dark:text-white">Sin resultados</h3>
              <p className="text-sm text-muted-foreground">
                No se encontró ninguna actividad que coincida con tu búsqueda en la base de datos.
              </p>
            </div>
            {(filterType !== "all" || searchTerm) && (
              <Button variant="outline" onClick={() => { setFilterType("all"); setSearchTerm(""); }}>
                Limpiar filtros
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}