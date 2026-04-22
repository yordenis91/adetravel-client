import React from "react";
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
  HelpCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

export default function DashboardPage() {
  const { data: clientCount = 0 } = useQuery({
    queryKey: ["client-count"],
    queryFn: async () => {
      const clients = await api.get('/clients');
      return clients.length;
    }
  });

  const { data: activeRequests = 0 } = useQuery({
    queryKey: ["active-requests-count"],
    queryFn: async () => {
      const requests = await api.get('/requests?status=Recepcionada');
      return requests.length;
    }
  });

  const { data: confirmedThisMonth = 0 } = useQuery({
    queryKey: ["confirmed-requests-count"],
    queryFn: async () => {
      const requests = await api.get('/requests?status=Confirmada');
      return requests.length;
    }
  });

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-playfair font-bold text-navy mb-1">Buenos días, Admin</h1>
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
          value={clientCount} 
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
          value={confirmedThisMonth} 
          subtitle="Para este mes"
          icon={<PlaneTakeoff className="w-6 h-6" />}
          trend="up"
          trendValue="+5"
          color="green"
          delay={0.3}
        />
        <StatsCard 
          title="Ingresos Estimados" 
          value="$12.4M" 
          subtitle="Proyección mensual"
          icon={<DollarSign className="w-6 h-6" />}
          trend="down"
          trendValue="-2%"
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
                <Button variant="secondary" className="w-full justify-start gap-3 bg-white/10 hover:bg-white/20 border-white/5 text-white hover:text-white transition-all group">
                  <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center group-hover:scale-110 duration-300">
                    <PlusCircle className="w-4 h-4 text-navy" />
                  </div>
                  <span className="text-xs font-bold uppercase tracking-wider">Nueva Solicitud</span>
                </Button>
                <Button variant="secondary" className="w-full justify-start gap-3 bg-white/10 hover:bg-white/20 border-white/5 text-white hover:text-white transition-all group">
                  <div className="w-8 h-8 rounded-lg bg-emerald-400 flex items-center justify-center group-hover:scale-110 duration-300">
                    <UserPlus className="w-4 h-4 text-navy" />
                  </div>
                  <span className="text-xs font-bold uppercase tracking-wider">Nuevo Cliente</span>
                </Button>
                <Button variant="secondary" className="w-full justify-start gap-3 bg-white/10 hover:bg-white/20 border-white/5 text-white hover:text-white transition-all group">
                  <div className="w-8 h-8 rounded-lg bg-blue-400 flex items-center justify-center group-hover:scale-110 duration-300">
                    <Briefcase className="w-4 h-4 text-navy" />
                  </div>
                  <span className="text-xs font-bold uppercase tracking-wider">Nuevo Proveedor</span>
                </Button>
              </div>
            </div>
            {/* Abstract decorative elements */}
            <div className="absolute top-0 right-0 -mr-16 -mt-16 w-48 h-48 bg-primary/20 rounded-full blur-3xl"></div>
            <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl"></div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground mb-4">Avisos Pendientes</h3>
            <div className="space-y-4">
              <div className="p-3 border border-amber-100 bg-amber-50/50 rounded-xl flex gap-3">
                <div className="w-2 h-2 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                <div>
                  <p className="text-xs font-bold text-navy">Pagos por Vencer</p>
                  <p className="text-[10px] text-muted-foreground">3 reservas necesitan confirmación de pago hoy.</p>
                </div>
              </div>
              <div className="p-3 border border-blue-100 bg-blue-50/50 rounded-xl flex gap-3">
                <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                <div>
                  <p className="text-xs font-bold text-navy">Vouchers Listos</p>
                  <p className="text-[10px] text-muted-foreground">Familia González viaja mañana. Vouchers generados.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
