import React, { useMemo } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { api } from "@/lib/api";
import { 
  Loader2, ArrowLeft, Landmark, User, Mail, Phone, 
  MapPin, Briefcase, Building2, CreditCard, Ticket,
  ClipboardList, Hash, Globe, CheckSquare
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";

export default function ProviderDetailsPage() {
  const { providerId } = useParams<{ providerId: string }>();
  const navigate = useNavigate();

  const { data: providerData, isLoading: isProviderLoading } = useQuery({
    queryKey: ["providers", providerId],
    queryFn: () => api.get(`/providers/${providerId}`),
    enabled: !!providerId,
  });

  const { data: vouchersData, isLoading: isVouchersLoading } = useQuery({
    queryKey: ["vouchers", { providerId }],
    queryFn: () => api.get(`/vouchers?providerId=${providerId}`),
    enabled: !!providerId,
  });

  const { data: tasksData, isLoading: isTasksLoading } = useQuery({
    queryKey: ["tasks", { providerId }],
    queryFn: () => api.get(`/tasks?relatedEntityId=${providerId}&relatedEntityType=PROVEEDOR`),
    enabled: !!providerId,
  });

  const isLoading = isProviderLoading || isVouchersLoading || isTasksLoading;

  const provider = (providerData as any)?.data || providerData;
  const vouchers = Array.isArray(vouchersData) ? vouchersData : (vouchersData as any)?.data || [];
  const tasks = Array.isArray(tasksData) ? tasksData : (tasksData as any)?.data || [];

  const kpis = useMemo(() => {
    const completedTasks = tasks.filter((t: any) => t.status === "COMPLETADO" || t.status === "COMPLETED").length;
    return [
      { label: "Vouchers Emitidos", value: vouchers.length, icon: <Ticket className="w-5 h-5" />, color: "gold" },
      { label: "Comisión / VAT", value: provider?.vatPercentage ? `${provider.vatPercentage}%` : "—", icon: <Landmark className="w-5 h-5" />, color: "emerald" },
      { label: "Tareas Pendientes", value: tasks.length - completedTasks, icon: <CheckSquare className="w-5 h-5" />, color: "blue" },
      { label: "Rubro", value: provider?.businessType?.replace(/_/g, " ") || "General", icon: <Briefcase className="w-5 h-5" />, color: "slate" },
    ];
  }, [vouchers, provider, tasks]);

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
        <p className="text-muted-foreground animate-pulse font-medium">Cargando perfil del proveedor...</p>
      </div>
    );
  }

  if (!provider) return <div className="text-center py-20 text-muted-foreground">Proveedor no encontrado</div>;

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.32 }} className="w-full space-y-8 pb-20">
      
      {/* Cabecera idéntica a ClientTimeline */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
        <div className="space-y-1">
          <button onClick={() => navigate("/proveedores")} className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors mb-4">
            <ArrowLeft className="w-3 h-3" /> Volver a Proveedores
          </button>
          
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary font-bold text-2xl border border-primary/20 shrink-0">
              {(provider.fantasyName || provider.name || "P")[0].toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-playfair font-bold text-navy">{provider.fantasyName || provider.name}</h1>
                <Badge className={cn("text-[10px] uppercase font-bold tracking-wider px-2 py-0.5", provider.isActive ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500")}>
                  {provider.isActive ? "Activo" : "Inactivo"}
                </Badge>
              </div>
              <div className="flex flex-wrap items-center gap-x-6 gap-y-1 mt-2 text-sm text-muted-foreground">
                <span className="flex items-center gap-2"><Building2 className="w-3 h-3 text-primary/60" /> RUC/NIT: {provider.rut || "—"}</span>
                <span className="flex items-center gap-2"><MapPin className="w-3 h-3 text-primary/60" /> {provider.city || "Ciudad"}, {provider.country || "País"}</span>
                {provider.email && <span className="flex items-center gap-2"><Mail className="w-3 h-3 text-primary/60" /> {provider.email}</span>}
                {provider.phone && <span className="flex items-center gap-2"><Phone className="w-3 h-3 text-primary/60" /> {provider.phone}</span>}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tarjetas KPI */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {kpis.map((kpi, i) => (
          <motion.div key={kpi.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
            <Card className="border-none shadow-sm bg-white overflow-hidden hover:shadow-md transition-all duration-300">
              <CardContent className="p-5 flex items-center gap-4">
                <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0", 
                  kpi.color === "blue" && "bg-blue-50 text-blue-600",
                  kpi.color === "emerald" && "bg-emerald-50 text-emerald-600",
                  kpi.color === "gold" && "bg-amber-50 text-amber-600",
                  kpi.color === "slate" && "bg-slate-50 text-slate-600",
                )}>
                  {kpi.icon}
                </div>
                <div className="overflow-hidden">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest truncate">{kpi.label}</p>
                  <p className="text-xl font-playfair font-bold text-navy truncate">{kpi.value}</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Contenido en Pestañas */}
      <Tabs defaultValue="info" className="w-full">
        <TabsList className="bg-white border border-gray-100 shadow-sm p-1 mb-6 h-auto flex-wrap">
          <TabsTrigger value="info" className="py-2.5 text-xs font-bold tracking-wider uppercase data-[state=active]:bg-primary/5 data-[state=active]:text-primary">Información y Finanzas</TabsTrigger>
          <TabsTrigger value="vouchers" className="py-2.5 text-xs font-bold tracking-wider uppercase data-[state=active]:bg-primary/5 data-[state=active]:text-primary">Historial de Vouchers</TabsTrigger>
          <TabsTrigger value="tareas" className="py-2.5 text-xs font-bold tracking-wider uppercase data-[state=active]:bg-primary/5 data-[state=active]:text-primary">Gestión de Tareas</TabsTrigger>
        </TabsList>

        <TabsContent value="info" className="outline-none space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Razón Social */}
            <Card className="border border-gray-100 shadow-sm">
              <CardHeader className="pb-3 border-b border-gray-50 bg-slate-50/50">
                <CardTitle className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-navy">
                  <Building2 className="w-4 h-4 text-primary" /> Perfil de la Empresa
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4 space-y-4">
                <DetailRow label="Razón Social" value={provider.name} />
                <DetailRow label="Nombre de Fantasía" value={provider.fantasyName} />
                <div className="grid grid-cols-2 gap-4">
                  <DetailRow label="RUC / NIT" value={provider.rut} />
                  <DetailRow label="Tipo de Negocio" value={provider.businessType?.replace(/_/g, " ")} />
                </div>
                <DetailRow label="Dirección Comercial" value={`${provider.address || ""}, ${provider.city || ""}, ${provider.country || ""}`} />
              </CardContent>
            </Card>

            {/* Finanzas */}
            <Card className="border border-gray-100 shadow-sm">
              <CardHeader className="pb-3 border-b border-gray-50 bg-slate-50/50">
                <CardTitle className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-navy">
                  <Landmark className="w-4 h-4 text-primary" /> Finanzas y Facturación
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <DetailRow label="Banco" value={provider.bankName} />
                  <DetailRow label="N° Cuenta / IBAN" value={provider.bankAccount} />
                </div>
                <DetailRow label="Titular de la Cuenta" value={provider.bankAccountHolder} />
                <div className="grid grid-cols-2 gap-4">
                  <DetailRow label="Método de Pago Preferido" value={provider.paymentMethod} />
                  <DetailRow label="Porcentaje de Comisión" value={provider.vatPercentage ? `${provider.vatPercentage}%` : null} />
                </div>
              </CardContent>
            </Card>

            {/* Ejecutivo de Cuenta */}
            <Card className="border border-gray-100 shadow-sm">
              <CardHeader className="pb-3 border-b border-gray-50 bg-blue-50/30">
                <CardTitle className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-navy">
                  <User className="w-4 h-4 text-blue-600" /> Ejecutivo de Cuenta (Comercial)
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4 space-y-4">
                <DetailRow label="Nombre del Ejecutivo" value={provider.executiveName} />
                <div className="grid grid-cols-2 gap-4">
                  <DetailRow label="Teléfono Directo" value={provider.executivePhone} />
                  <DetailRow label="Correo Electrónico" value={provider.executiveEmail} />
                </div>
              </CardContent>
            </Card>

            {/* Contacto de Reservas */}
            <Card className="border border-gray-100 shadow-sm">
              <CardHeader className="pb-3 border-b border-gray-50 bg-emerald-50/30">
                <CardTitle className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-navy">
                  <Globe className="w-4 h-4 text-emerald-600" /> Contacto Operativo (Reservas)
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4 space-y-4">
                <DetailRow label="Nombre del Contacto" value={provider.contactName} />
                <div className="grid grid-cols-2 gap-4">
                  <DetailRow label="Teléfono / WhatsApp" value={provider.contactPhone} />
                  <DetailRow label="Correo de Reservas" value={provider.contactEmail} />
                </div>
                <DetailRow label="ID / RUT de Contacto" value={provider.contactRut} />
              </CardContent>
            </Card>

          </div>
        </TabsContent>

        <TabsContent value="vouchers" className="outline-none">
          <Card className="border border-gray-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full table-auto text-sm">
                <thead className="bg-slate-50 border-b border-gray-100">
                  <tr className="text-left text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                    <th className="px-6 py-4">Código / Referencia</th>
                    <th className="px-6 py-4">Tipo de Servicio</th>
                    <th className="px-6 py-4">Monto</th>
                    <th className="px-6 py-4">Estado</th>
                    <th className="px-6 py-4">Fecha Emisión</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {vouchers.map((v: any) => (
                    <tr key={v.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4 font-medium text-navy">{v.voucherNumber || v.code || v.id.slice(0,8)}</td>
                      <td className="px-6 py-4">{v.serviceType || "—"}</td>
                      <td className="px-6 py-4">{v.amount ? `$${v.amount}` : "—"}</td>
                      <td className="px-6 py-4">
                        <Badge variant="outline" className="text-[9px] uppercase tracking-wider">
                          {v.status || "EMITIDO"}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-muted-foreground">
                        {new Date(v.createdAt || v.created_at || Date.now()).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </td>
                    </tr>
                  ))}
                  {vouchers.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground">
                        No hay vouchers emitidos para este proveedor.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="tareas" className="outline-none">
          <div className="space-y-4">
            {tasks.length === 0 && (
              <div className="text-center py-12 bg-white rounded-xl border border-gray-100 shadow-sm text-muted-foreground">
                No hay tareas pendientes asociadas a este proveedor.
              </div>
            )}
            {tasks.map((t: any) => {
              const isCompleted = t.status === "COMPLETADO" || t.status === "COMPLETED";
              return (
                <Card key={t.id} className={cn("border shadow-sm transition-all", isCompleted ? "bg-slate-50/50 border-gray-100" : "border-l-4 border-l-blue-500 border-y-gray-100 border-r-gray-100 bg-white")}>
                  <CardContent className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-3">
                        <h4 className={cn("font-bold", isCompleted ? "text-slate-500 line-through" : "text-navy")}>
                          {t.title || t.name}
                        </h4>
                        <Badge variant="outline" className={cn("text-[9px] uppercase tracking-wider", isCompleted ? "bg-slate-100 text-slate-500" : "bg-blue-50 text-blue-700 border-blue-200")}>
                          {t.status || "PENDIENTE"}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{t.description || t.notes || "Sin descripción"}</p>
                    </div>
                    {t.dueDate && (
                      <div className="shrink-0 text-right">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Vencimiento</p>
                        <p className={cn("text-sm font-medium", isCompleted ? "text-slate-500" : "text-navy")}>
                          {format(parseISO(t.dueDate), 'dd MMM yyyy', { locale: es })}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>
      </Tabs>
    </motion.div>
  );
}

// Sub-componente para renderizar pares Label/Value uniformemente
function DetailRow({ label, value }: { label: string, value: any }) {
  if (value === undefined || value === null || value === "") return (
    <div className="flex flex-col gap-1">
      <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70">{label}</span>
      <span className="text-sm font-medium text-slate-400">—</span>
    </div>
  );
  
  return (
    <div className="flex flex-col gap-1">
      <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{label}</span>
      <span className="text-sm font-medium text-navy">{value}</span>
    </div>
  );
}