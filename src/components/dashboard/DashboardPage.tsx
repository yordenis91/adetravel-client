import React, { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { StatsCard } from "./StatsCard";
import { RecentRequests } from "./RecentRequests";
import { 
  Users, 
  ClipboardCheck, 
  PlaneTakeoff, 
  DollarSign,
  PlusCircle,
  Briefcase,
  UserPlus,
  HelpCircle,
  Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

export default function DashboardPage() {
  // 🔥 Una SOLA petición ultra-rápida que trae todos los KPIs pre-calculados
  const { data: response, isLoading } = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: () => api.get('/reports')
  });

  const reportData = (response as any)?.data || {
    summary: { totalClients: 0, totalRequests: 0, formattedRevenue: "$0" },
    requestsByStatus: []
  };

  // Extraemos las métricas exactas buscando en el arreglo de estados del backend
  const activeRequests = useMemo(() => {
    const req = reportData.requestsByStatus.find((r: any) => r.status === "RECEPCIONADA");
    return req ? req.count : 0;
  }, [reportData.requestsByStatus]);

  const confirmedRequests = useMemo(() => {
    const req = reportData.requestsByStatus.find((r: any) => r.status === "CONFIRMADA");
    return req ? req.count : 0;
  }, [reportData.requestsByStatus]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
        <p className="text-muted-foreground animate-pulse font-medium">Cargando tu panel de control...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-playfair font-bold text-navy mb-1">Buenos días</h1>
          <p className="text-muted-foreground text-sm">
            Esto es lo que está pasando hoy, {new Date().toLocaleDateString("es-CL", { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="bg-white border-gray-200 text-xs font-bold gap-2">
            <HelpCircle className="w-4 h-4 text-primary" />
            Centro de Ayuda
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard 
          title="Total Clientes" 
          value={reportData.summary.totalClients} 
          subtitle="Titulares registrados"
          icon={<Users className="w-6 h-6" />}
          trend="up"
          trendValue="+12%"
          color="blue"
          delay={0.1}
        />
        <StatsCard 
          title="Solicitudes Activas" 
          value={activeRequests} 
          subtitle="En proceso de cotización"
          icon={<ClipboardCheck className="w-6 h-6" />}
          trend="neutral"
          trendValue="estable"
          color="gold"
          delay={0.2}
        />
        <StatsCard 
          title="Viajes Confirmados" 
          value={confirmedRequests} 
          subtitle="Listos para operar"
          icon={<PlaneTakeoff className="w-6 h-6" />}
          trend="up"
          trendValue="+5"
          color="green"
          delay={0.3}
        />
        <StatsCard 
          title="Ingresos Reales" 
          value={reportData.summary.formattedRevenue} 
          subtitle="Pagos completados en CLP"
          icon={<DollarSign className="w-6 h-6" />}
          trend="up"
          trendValue="estable"
          color="navy"
          delay={0.4}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <RecentRequests />
        </div>
        
        <div className="space-y-6">
          <div className="bg-navy rounded-2xl p-6 text-white shadow-lg overflow-hidden relative">
            <div className="relative z-10">
              <h3 className="text-lg font-playfair font-bold mb-4">Acciones Rápidas</h3>
              <div className="grid grid-cols-1 gap-3">
                <Button asChild variant="secondary" className="w-full justify-start gap-3 bg-white/10 hover:bg-white/20 border-white/5 text-white hover:text-white transition-all group">
                  <Link to="/solicitudes?action=new">
                    <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center group-hover:scale-110 duration-300">
                      <PlusCircle className="w-4 h-4 text-navy" />
                    </div>
                    <span className="text-xs font-bold uppercase tracking-wider">Nueva Solicitud</span>
                  </Link>
                </Button>

                <Button asChild variant="secondary" className="w-full justify-start gap-3 bg-white/10 hover:bg-white/20 border-white/5 text-white hover:text-white transition-all group">
                  <Link to="/clientes?action=new">
                    <div className="w-8 h-8 rounded-lg bg-emerald-400 flex items-center justify-center group-hover:scale-110 duration-300">
                      <UserPlus className="w-4 h-4 text-navy" />
                    </div>
                    <span className="text-xs font-bold uppercase tracking-wider">Nuevo Cliente</span>
                  </Link>
                </Button>

                <Button asChild variant="secondary" className="w-full justify-start gap-3 bg-white/10 hover:bg-white/20 border-white/5 text-white hover:text-white transition-all group">
                  <Link to="/proveedores?action=new">
                    <div className="w-8 h-8 rounded-lg bg-blue-400 flex items-center justify-center group-hover:scale-110 duration-300">
                      <Briefcase className="w-4 h-4 text-navy" />
                    </div>
                    <span className="text-xs font-bold uppercase tracking-wider">Nuevo Proveedor</span>
                  </Link>
                </Button>
              </div>
            </div>
            <div className="absolute top-0 right-0 -mr-16 -mt-16 w-48 h-48 bg-primary/20 rounded-full blur-3xl"></div>
            <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl"></div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
            <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground mb-4">Avisos Pendientes</h3>
            <div className="space-y-4">
              <div className="p-3 border border-amber-100 bg-amber-50/50 rounded-xl flex gap-3">
                <div className="w-2 h-2 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                <div>
                  <p className="text-xs font-bold text-navy">Pagos por Vencer</p>
                  <p className="text-[10px] text-muted-foreground">Revisa los pagos en estado pendiente.</p>
                </div>
              </div>
              <div className="p-3 border border-blue-100 bg-blue-50/50 rounded-xl flex gap-3">
                <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                <div>
                  <p className="text-xs font-bold text-navy">Vouchers Borradores</p>
                  <p className="text-[10px] text-muted-foreground">Tienes vouchers sin emitir en la tabla.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}