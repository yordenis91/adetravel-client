import React, { useMemo } from "react";
import * as Sentry from "@sentry/react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { StatsCard } from "./StatsCard";
import { RecentRequests } from "./RecentRequests";
import { ExchangeRatesWidget } from "./ExchangeRatesWidget";
import { BirthdayReminder } from "./BirthdayReminder";
import { PendingAlerts } from "./PendingAlerts";
import { TasksWidget } from "@/components/tasks/TasksWidget";
import {
  Users,
  ClipboardCheck,
  PlaneTakeoff,
  DollarSign,
  PlusCircle,
  Briefcase,
  UserPlus,
  HelpCircle,
  Loader2,
  Sun,
  CloudSun,
  Moon
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";

export default function DashboardPage() {
  // 🔥 Una SOLA petición ultra-rápida que trae todos los KPIs pre-calculados
  const { data: response, isLoading } = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: () => api.get('/reports')
  });

  // 🔥 NUEVO: Obtener la configuración del sistema para las Tasas de Cambio
  const { data: configData } = useQuery({
    queryKey: ["system-config"],
    queryFn: () => api.get('/system-config')
  });

  // Extraer y parsear las tasas de forma segura
  // 2. Parseamos la información de forma segura
  const exchangeRates = useMemo(() => {
    const config = (configData as any)?.data || configData || {};

    // Si viene vacío o nulo (como estaba pasando por Zod), retornamos array vacío
    if (!config.exchangeRates) return [];

    try {
      return JSON.parse(config.exchangeRates);
    } catch (e) {
      console.error("Error parseando tasas de cambio", e);
      return [];
    }
  }, [configData]);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Buenos días" : hour < 19 ? "Buenas tardes" : "Buenas noches";
  const GreetingIcon = hour < 12 ? Sun : hour < 19 ? CloudSun : Moon;
  const iconColor = hour < 12 ? "text-amber-500" : hour < 19 ? "text-orange-400" : "text-indigo-400";

  const reportData = (response as any)?.data || {
    summary: { totalClients: 0, totalRequests: 0, formattedRevenue: "$0" },
    requestsByStatus: []
  };

  // Extraemos las métricas exactas buscando en el arreglo de estados del backend
  const activeRequests = useMemo(() => {
    const req = reportData.requestsByStatus.find((r: any) => r.status === "RECEPCIONADA");
    return req ? req.count : 0;
  }, [reportData.requestsByStatus]);

  // "Confirmadas" agrupa todo lo que ya pasó por la confirmación del proveedor (fases
  // "Confirmación proveedor" y "Pago y voucher" del flujo granular, sin contar Vendida/Cancelada).
  const confirmedRequests = useMemo(() => {
    const confirmedStatuses = [
      "ENVIADA_SOLICITUD_CONFIRMACION_PROVEEDOR", "CONFIRMADA_POR_PROVEEDOR", "ENVIADA_CONFIRMACION_CLIENTE",
      "ENVIADA_SOLICITUD_PAGO_CLIENTE", "PAGADO_POR_CLIENTE", "PAGADO_AL_PROVEEDOR",
      "VOUCHER_EMITIDO", "VOUCHER_ENTREGADO",
    ];
    return reportData.requestsByStatus
      .filter((r: any) => confirmedStatuses.includes(r.status))
      .reduce((sum: number, r: any) => sum + (r.count || 0), 0);
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
          <div className="flex items-center gap-3 mb-1">
            <motion.div
              initial={{ scale: 0, rotate: -20 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 260, damping: 20 }}
            >
              <GreetingIcon className={`w-8 h-8 ${iconColor}`} />
            </motion.div>
            <h1 className="text-3xl font-playfair font-bold text-navy">{greeting}, Admin</h1>
          </div>
          <p className="text-muted-foreground text-sm">
            Esto es lo que está pasando hoy, {new Date().toLocaleDateString("es-CL", { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}.
          </p>
        </div>
        <div className="flex gap-2 items-center">
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
          color="red"
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

          <PendingAlerts />
          <TasksWidget />
          <ExchangeRatesWidget exchangeRates={exchangeRates} />
          <BirthdayReminder />

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
            {/* ... tus avisos pendientes ... */}
          </div>
        </div>
      </div>
    </div>
  );
}