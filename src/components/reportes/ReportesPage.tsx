import React, { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Users, 
  FileText, 
  CheckCircle, 
  DollarSign,
  TrendingUp,
  Calendar
} from "lucide-react";
import SolicitudesChart from "./SolicitudesChart";
import PagosChart from "./PagosChart";
import CotizacionesChart from "./CotizacionesChart";
import { motion } from "framer-motion";

const NAVY = "#0F1E3C";
const GOLD = "#C9A84C";

export default function ReportesPage() {
  const { data: clientsResponseData = [], isLoading: loadingClients } = useQuery({
    queryKey: ["clients-all"],
    queryFn: () => api.get('/clients')
  });

  const { data: requestsResponseData = [], isLoading: loadingRequests } = useQuery({
    queryKey: ["requests-all"],
    queryFn: () => api.get('/requests')
  });

  const { data: quotationsResponseData = [], isLoading: loadingQuotations } = useQuery({
    queryKey: ["quotations-all"],
    queryFn: () => api.get('/quotations')
  });

  const { data: paymentsResponseData = [], isLoading: loadingPayments } = useQuery({
    queryKey: ["payments-all"],
    queryFn: () => api.get('/payments')
  });

  const clients = Array.isArray(clientsResponseData) ? clientsResponseData : (clientsResponseData as any)?.data || [];
  const requests = Array.isArray(requestsResponseData) ? requestsResponseData : (requestsResponseData as any)?.data || [];
  const quotations = Array.isArray(quotationsResponseData) ? quotationsResponseData : (quotationsResponseData as any)?.data || [];
  const payments = Array.isArray(paymentsResponseData) ? paymentsResponseData : (paymentsResponseData as any)?.data || [];

  const isLoading = loadingClients || loadingRequests || loadingQuotations || loadingPayments;

  const isLoading = loadingClients || loadingRequests || loadingQuotations || loadingPayments;

  const stats = useMemo(() => {
    const totalClients = clients.length;
    const totalRequests = requests.length;
    const acceptedQuotations = quotations.filter(q => q.status === "Aceptada").length;
    
    const totalRecaudado = payments
      .filter(p => p.status === "COMPLETADO" && p.currency === "CLP")
      .reduce((sum, p) => sum + (p.amount || 0), 0);

    return {
      totalClients,
      totalRequests,
      acceptedQuotations,
      totalRecaudado: new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(totalRecaudado)
    };
  }, [clients, requests, quotations, payments]);

  const recentRequests = useMemo(() => {
    return requests
      .filter(r => r.status === "Confirmada" || r.status === "Vendida")
      .sort((a, b) => new Date(b.created_at || "").getTime() - new Date(a.created_at || "").getTime())
      .slice(0, 5);
  }, [requests]);

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div className="flex justify-between items-end">
          <div className="space-y-2">
            <Skeleton className="h-10 w-48" />
            <Skeleton className="h-4 w-64" />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-32 w-full rounded-2xl" />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Skeleton className="h-[400px] w-full rounded-2xl" />
          <Skeleton className="h-[400px] w-full rounded-2xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-playfair font-bold text-navy mb-1">Estadísticas</h1>
          <p className="text-muted-foreground text-sm flex items-center gap-2">
            <Calendar className="w-4 h-4 text-gold" />
            Datos actualizados al {new Date().toLocaleDateString("es-CL", { day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard 
          title="Total Clientes" 
          value={stats.totalClients} 
          icon={<Users className="w-5 h-5" />} 
          color="blue"
        />
        <KPICard 
          title="Total Solicitudes" 
          value={stats.totalRequests} 
          icon={<FileText className="w-5 h-5" />} 
          color="gold"
        />
        <KPICard 
          title="Cotizaciones Aceptadas" 
          value={stats.acceptedQuotations} 
          icon={<CheckCircle className="w-5 h-5" />} 
          color="green"
        />
        <KPICard 
          title="Recaudación CLP" 
          value={stats.totalRecaudado} 
          icon={<DollarSign className="w-5 h-5" />} 
          color="navy"
          subtitle="Pagos completados"
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <ChartCard title="Solicitudes por Estado">
          <SolicitudesChart requests={requests} />
        </ChartCard>

        <ChartCard title="Estado de Cotizaciones">
          <CotizacionesChart quotations={quotations} />
        </ChartCard>

        <ChartCard title="Métodos de Pago">
          <PagosChart payments={payments} />
        </ChartCard>

        <ChartCard title="Referencia de Clientes">
          <ReferralChart clients={clients} />
        </ChartCard>
      </div>

      {/* Summary Table */}
      <Card className="border-none shadow-sm overflow-hidden rounded-2xl">
        <CardHeader className="bg-navy text-white py-4 px-6">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-playfair font-bold">Últimas Solicitudes Confirmadas</CardTitle>
            <TrendingUp className="w-5 h-5 text-primary" />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-muted/50 text-[10px] uppercase tracking-widest font-bold text-muted-foreground">
                  <th className="px-6 py-3">Referencia</th>
                  <th className="px-6 py-3">Destino</th>
                  <th className="px-6 py-3">Estado</th>
                  <th className="px-6 py-3 text-right">Fecha</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {recentRequests.length > 0 ? (
                  recentRequests.map((req) => (
                    <tr key={req.id} className="hover:bg-muted/30 transition-colors group">
                      <td className="px-6 py-4">
                        <span className="text-sm font-bold text-navy group-hover:text-gold transition-colors">
                          {req.requestNumber || "S/N"}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-xs text-muted-foreground">
                          {req.destinationCity}, {req.destinationCountry}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          req.status === 'Vendida' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'
                        }`}>
                          {req.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="text-xs text-muted-foreground">
                          {new Date(req.created_at).toLocaleDateString()}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-sm text-muted-foreground">
                      No hay solicitudes confirmadas recientes.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function KPICard({ title, value, icon, color, subtitle }: any) {
  const colorMap: Record<string, string> = {
    blue: "bg-blue-50 text-blue-600 border-blue-100",
    gold: "bg-amber-50 text-amber-600 border-amber-100",
    green: "bg-emerald-50 text-emerald-600 border-emerald-100",
    navy: "bg-slate-100 text-slate-800 border-slate-200",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <Card className="border-none shadow-sm rounded-2xl overflow-hidden hover:shadow-md transition-shadow">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className={`p-2.5 rounded-xl border ${colorMap[color] || colorMap.navy}`}>
              {icon}
            </div>
          </div>
          <div className="space-y-1">
            <p className="text-2xl font-bold text-navy font-manrope">{value}</p>
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{title}</p>
            {subtitle && <p className="text-[10px] text-muted-foreground italic">{subtitle}</p>}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function ChartCard({ title, children }: any) {
  return (
    <Card className="border-none shadow-sm rounded-2xl overflow-hidden">
      <CardHeader className="pb-2 border-b border-border/50 bg-slate-50/50">
        <CardTitle className="text-sm font-bold uppercase tracking-widest text-navy-light">{title}</CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        {children}
      </CardContent>
    </Card>
  );
}

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";

function ReferralChart({ clients }: { clients: any[] }) {
  const data = useMemo(() => {
    const counts: Record<string, number> = {
      "CONSULATE": 0,
      "REFERRAL": 0,
      "WEBSITE": 0,
      "OTHER": 0
    };

    clients.forEach(c => {
      const source = c.referralSource || "OTHER";
      if (counts[source] !== undefined) {
        counts[source]++;
      } else {
        counts["OTHER"]++;
      }
    });

    return Object.entries(counts)
      .filter(([_, value]) => value > 0)
      .map(([name, value]) => ({ name, value }));
  }, [clients]);

  const COLORS = ["#0F1E3C", "#C9A84C", "#3b82f6", "#94a3b8"];

  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            outerRadius={80}
            dataKey="value"
            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip 
            contentStyle={{ borderRadius: "8px", border: "none", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
