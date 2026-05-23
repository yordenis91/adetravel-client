import React, { useState } from "react";
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
import { isToday, isWithinInterval, subDays, startOfDay } from "date-fns";

export default function BitacoraPage() {
  const [filterType, setFilterType] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");

  const { data: logsResponseData = [], isLoading } = useQuery<any[]>({
    queryKey: ["activity-logs"],
    queryFn: async () => {
      const result = await api.get("/activity-logs?limit=200");
      return Array.isArray(result) ? result : (result as any)?.data || [];
    }
  });

  const logs = Array.isArray(logsResponseData) ? logsResponseData : (logsResponseData as any)?.data || [];

  const filteredLogs = logs.filter((log) => {
    const matchesType = filterType === "all" || log.entityType === filterType;
    const matchesSearch = 
      log.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.entityLabel?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.action?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesType && matchesSearch;
  });

  const stats = {
    total: logs.length,
    today: logs.filter((l) => l.createdAt && isToday(new Date(l.createdAt))).length,
    week: logs.filter((l) => {
      if (!l.createdAt) return false;
      const date = new Date(l.createdAt);
      return isWithinInterval(date, {
        start: startOfDay(subDays(new Date(), 7)),
        end: new Date(),
      });
    }).length,
  };

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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-navy border-none text-white overflow-hidden relative shadow-lg">
          <div className="absolute right-0 top-0 p-4 opacity-10">
            <History className="w-16 h-16" />
          </div>
          <CardContent className="p-6">
            <p className="text-xs font-bold uppercase tracking-widest text-primary mb-1">Total Eventos</p>
            <h3 className="text-3xl font-playfair font-bold">{stats.total}</h3>
            <p className="text-[10px] text-white/50 mt-1">Registrados en el sistema</p>
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
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1">Esta Semana</p>
            <h3 className="text-3xl font-playfair font-bold text-navy dark:text-white">{stats.week}</h3>
            <div className="flex items-center gap-1 text-[10px] text-amber-600 mt-1 font-bold">
              <AlertCircle className="w-3 h-3" /> Actividad últimos 7 días
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
              </SelectContent>
            </Select>
          </div>
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <Loader2 className="w-10 h-10 text-primary animate-spin" />
            <p className="text-sm font-medium text-muted-foreground">Cargando bitácora de auditoría...</p>
          </div>
        ) : filteredLogs.length > 0 ? (
          <ScrollArea className="h-[600px] pr-6">
            <div className="max-w-4xl mx-auto py-4">
              {filteredLogs.map((log: any, index: number) => (
                <TimelineItem 
                  key={log.id} 
                  log={log} 
                  isLast={index === filteredLogs.length - 1} 
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
              <h3 className="text-lg font-playfair font-bold text-navy dark:text-white">Sin actividad registrada</h3>
              <p className="text-sm text-muted-foreground">
                No hay eventos que coincidan con los filtros actuales o aún no se han realizado acciones en el sistema.
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