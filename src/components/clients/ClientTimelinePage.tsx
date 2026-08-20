import React, { useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { 
  ArrowLeft, Calendar, FileText, CreditCard, Ticket, ClipboardList, 
  AlertTriangle, User, Plus, ChevronRight, TrendingUp, Clock, DollarSign, Briefcase, Eye, ExternalLink, X, CheckSquare
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { format, isAfter, subDays, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { motion } from "framer-motion";
import { isWorkflowStatus, getStatusColor as getWorkflowStatusColor } from "@/lib/workflow-status";

type EventType = "solicitud" | "cotizacion" | "pago" | "voucher" | "bitacora" | "tarea";

interface TimelineEvent {
  id: string;
  type: EventType;
  date: Date;
  title: string;
  subtitle?: string;
  description?: string;
  status?: string;
  color: string;
  icon: React.ReactNode;
  originalData: any;
}

export default function ClientTimelinePage() {
  const { clientId } = useParams<{ clientId: string }>();
  const navigate = useNavigate();

  // Estados UI
  const [filterType, setFilterType] = useState<string>("all");
  const [selectedEvent, setSelectedEvent] = useState<TimelineEvent | null>(null);

  // Queries
  const { data: clientData, isLoading: isClientLoading } = useQuery({
    queryKey: ["client", clientId],
    queryFn: () => api.get(`/clients/${clientId}`),
    enabled: !!clientId
  });

  const { data: requestsData = [], isLoading: isRequestsLoading } = useQuery({
    queryKey: ["client-requests", clientId],
    queryFn: () => api.get(`/requests?clientId=${clientId}`),
    enabled: !!clientId
  });

  const { data: quotationsData = [], isLoading: isQuotationsLoading } = useQuery({
    queryKey: ["client-quotations", clientId],
    queryFn: () => api.get(`/quotations?clientId=${clientId}`),
    enabled: !!clientId
  });

  const { data: paymentsData = [], isLoading: isPaymentsLoading } = useQuery({
    queryKey: ["client-payments", clientId],
    queryFn: () => api.get(`/payments?clientId=${clientId}`),
    enabled: !!clientId
  });

  const { data: vouchersData = [], isLoading: isVouchersLoading } = useQuery({
    queryKey: ["client-vouchers", clientId],
    queryFn: () => api.get(`/vouchers?clientId=${clientId}`),
    enabled: !!clientId
  });

  const { data: logsData = [], isLoading: isLogsLoading } = useQuery({
    queryKey: ["client-logs", clientId],
    queryFn: () => api.get(`/activity-logs?entityId=${clientId}&limit=100`),
    enabled: !!clientId
  });

  const { data: tasksData = [], isLoading: isTasksLoading } = useQuery({
    queryKey: ["client-tasks", clientId],
    queryFn: () => api.get(`/tasks?relatedEntityId=${clientId}&relatedEntityType=CLIENTE`),
    enabled: !!clientId
  });

  const isLoading = isClientLoading || isRequestsLoading || isQuotationsLoading || isPaymentsLoading || isVouchersLoading || isLogsLoading || isTasksLoading;

  const client = (clientData as any)?.data || clientData;
  const requests = Array.isArray(requestsData) ? requestsData : (requestsData as any)?.data || [];
  const quotations = Array.isArray(quotationsData) ? quotationsData : (quotationsData as any)?.data || [];
  const payments = Array.isArray(paymentsData) ? paymentsData : (paymentsData as any)?.data || [];
  const vouchers = Array.isArray(vouchersData) ? vouchersData : (vouchersData as any)?.data || [];
  const logs = Array.isArray(logsData) ? logsData : (logsData as any)?.data || [];
  const tasks = Array.isArray(tasksData) ? tasksData : (tasksData as any)?.data || [];

  const safeParseDate = (dateString: string | undefined) => {
    if (!dateString) return new Date();
    try { return parseISO(dateString); } catch (e) { return new Date(); }
  };

  // Consolidación de Eventos
  const events = useMemo(() => {
    if (isLoading) return [];
    const allEvents: TimelineEvent[] = [];

    requests.forEach((r: any) => {
      allEvents.push({
        id: r.id, type: "solicitud", date: safeParseDate(r.createdAt),
        title: `Solicitud ${r.requestNumber || ''}`, subtitle: `${r.originCity || 'N/A'} → ${r.destinationCity || 'N/A'}`,
        description: r.description, status: r.status, color: "blue", icon: <Briefcase className="w-4 h-4" />, originalData: r
      });
    });

    quotations.forEach((q: any) => {
      allEvents.push({
        id: q.id, type: "cotizacion", date: safeParseDate(q.createdAt),
        title: `Cotización ${q.quotationNumber || ''}`,
        subtitle: q.currency === "CLP" ? new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP" }).format(q.total) : `$${q.total} USD`,
        status: q.status, color: "sky", icon: <FileText className="w-4 h-4" />, originalData: q
      });
    });

    payments.forEach((p: any) => {
      allEvents.push({
        id: p.id, type: "pago", date: safeParseDate(p.createdAt),
        title: `Pago ${p.paymentNumber || ''}`,
        subtitle: `${p.method} · ${p.currency === "CLP" ? new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP" }).format(p.amount) : `$${p.amount} USD`}`,
        status: p.status, color: "emerald", icon: <CreditCard className="w-4 h-4" />, originalData: p
      });
    });

    vouchers.forEach((v: any) => {
      allEvents.push({
        id: v.id, type: "voucher", date: safeParseDate(v.createdAt),
        title: `Voucher ${v.voucherNumber || ''}`, subtitle: `${v.serviceType}: ${v.serviceName}`,
        status: v.status, color: "gold", icon: <Ticket className="w-4 h-4" />, originalData: v
      });
    });

    // Integrar Tareas del Cliente
    tasks.forEach((t: any) => {
      const status = (t.status || '').toString().toUpperCase();
      const isCompleted = status.includes('COMPLET') || status === 'COMPLETED';
      allEvents.push({
        id: t.id,
        type: "tarea",
        date: safeParseDate(t.dueDate || t.createdAt),
        title: t.title || 'Tarea',
        subtitle: t.dueDate ? format(parseISO(t.dueDate), 'dd MMM yyyy', { locale: es }) : undefined,
        description: t.notes || t.description,
        status: t.status,
        color: isCompleted ? "emerald" : "gold",
        icon: <CheckSquare className="w-4 h-4" />,
        originalData: t
      });
    });

    logs.forEach((l: any) => {
      allEvents.push({
        id: l.id, type: "bitacora", date: safeParseDate(l.createdAt),
        title: l.action?.replace(/_/g, " ") || 'Acción', description: l.description, 
        color: "slate", icon: <ClipboardList className="w-4 h-4" />, originalData: l
      });
    });

    return allEvents.sort((a, b) => b.date.getTime() - a.date.getTime());
  }, [requests, quotations, payments, vouchers, logs, tasks, isLoading]);

  // 🔥 Filtro Dinámico
  const filteredEvents = useMemo(() => {
    if (filterType === "all") return events;
    return events.filter(e => e.type === filterType);
  }, [events, filterType]);

  const groupedEvents = useMemo(() => {
    const groups: { [key: string]: TimelineEvent[] } = {};
    filteredEvents.forEach(event => {
      const monthYear = format(event.date, "MMMM yyyy", { locale: es });
      if (!groups[monthYear]) groups[monthYear] = [];
      groups[monthYear].push(event);
    });
    return groups;
  }, [filteredEvents]);

  const kpis = useMemo(() => { /* ... misma lógica de kpis ... */
    const totalPaidCLP = payments.filter((p: any) => p.status === "COMPLETADO" && p.currency === "CLP").reduce((sum: number, p: any) => sum + (p.amount || 0), 0);
    const acceptedQuotations = quotations.filter((q: any) => q.status === "ACEPTADA").length;
    const lastActivityDate = events.length > 0 ? events[0].date : null;
    return {
      totalRequests: requests.length, acceptedQuotations,
      totalPaidCLP: new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP" }).format(totalPaidCLP),
      lastActivity: lastActivityDate ? format(lastActivityDate, "dd MMM yyyy", { locale: es }) : "Sin actividad"
    };
  }, [requests, quotations, payments, events]);

  const alerts = useMemo(() => { /* ... misma lógica de alertas ... */
    const activeAlerts: string[] = [];
    if (client?.isActive && events.length === 0) activeAlerts.push("Cliente activo — sin actividad registrada");
    else if (client?.isActive && events.length > 0 && isAfter(subDays(new Date(), 60), events[0].date)) activeAlerts.push("Cliente activo sin actividad por más de 60 días");
    const pendingPayments = payments.filter((p: any) => p.status === "PENDIENTE");
    if (pendingPayments.length > 0) activeAlerts.push(`${pendingPayments.length} pago(s) pendiente(s)`);
    return activeAlerts;
  }, [client, events, payments, quotations]);

  if (isLoading) return <TimelineSkeleton />;
  if (!client) return <div>Cliente no encontrado</div>;

  return (
    <div className="space-y-8 pb-20 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <button onClick={() => navigate("/clientes")} className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors mb-4">
            <ArrowLeft className="w-3 h-3" /> Volver a Clientes
          </button>
          
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary font-bold text-2xl border border-primary/20">
              {client.firstName?.[0]}{client.lastName?.[0]}
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-playfair font-bold text-navy">{client.firstName} {client.lastName}</h1>
                <Badge className={cn("text-[10px] uppercase font-bold tracking-wider px-2 py-0.5", client.isActive ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500")}>
                  {client.isActive ? "Activo" : "Inactivo"}
                </Badge>
              </div>
              <div className="flex flex-wrap items-center gap-x-6 gap-y-1 mt-2 text-sm text-muted-foreground">
                <span className="flex items-center gap-2"><Clock className="w-3 h-3 text-primary/60" /> {client.email}</span>
                <span className="flex items-center gap-2"><Clock className="w-3 h-3 text-primary/60" /> {client.phone}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-2 shrink-0 self-end md:self-center">
          <Button variant="outline" size="sm" className="gap-2 text-xs font-bold uppercase tracking-wider" onClick={() => navigate("/solicitudes?action=new")}>
            <Plus className="w-3 h-3" /> Nueva Solicitud
          </Button>
          <Button variant="outline" size="sm" className="gap-2 text-xs font-bold uppercase tracking-wider" onClick={() => navigate("/cotizaciones?action=new")}>
            <Plus className="w-3 h-3" /> Nueva Cotización
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Solicitudes", value: kpis.totalRequests, icon: <Briefcase className="w-5 h-5" />, color: "blue" },
          { label: "Cotiz. Aceptadas", value: kpis.acceptedQuotations, icon: <TrendingUp className="w-5 h-5" />, color: "emerald" },
          { label: "Total Pagado", value: kpis.totalPaidCLP, icon: <DollarSign className="w-5 h-5" />, color: "gold" },
          { label: "Última Actividad", value: kpis.lastActivity, icon: <Calendar className="w-5 h-5" />, color: "slate" },
        ].map((kpi, i) => (
          <motion.div key={kpi.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
            <Card className="border-none shadow-sm bg-white overflow-hidden hover:shadow-md transition-all duration-300">
              <CardContent className="p-5 flex items-center gap-4">
                <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", 
                  kpi.color === "blue" && "bg-blue-50 text-blue-600",
                  kpi.color === "emerald" && "bg-emerald-50 text-emerald-600",
                  kpi.color === "gold" && "bg-amber-50 text-amber-600",
                  kpi.color === "slate" && "bg-slate-50 text-slate-600",
                )}>
                  {kpi.icon}
                </div>
                <div>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{kpi.label}</p>
                  <p className="text-xl font-playfair font-bold text-navy truncate">{kpi.value}</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {alerts.length > 0 && (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="bg-amber-50 border border-amber-200 rounded-2xl p-6 space-y-3 shadow-sm">
          <div className="flex items-center gap-2 text-amber-800 font-bold text-sm mb-1">
            <AlertTriangle className="w-4 h-4" /> Alertas de Seguimiento
          </div>
          <div className="grid gap-2">
            {alerts.map((alert, i) => (
              <div key={i} className="flex items-start gap-3 text-sm text-amber-700 bg-white/50 p-2.5 rounded-lg border border-amber-100">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0" />{alert}
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* 🔥 Controles del Historial (Título + Filtro) */}
      <div className="space-y-8 relative pt-4">
        <div className="flex items-center justify-between border-b border-gray-200 pb-4">
          <h2 className="text-xl font-playfair font-bold text-navy flex items-center gap-3">
            Historial de Actividad
          </h2>
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-[200px] h-10 text-xs font-bold tracking-wider uppercase bg-white">
              <SelectValue placeholder="Filtrar por..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todo el Historial</SelectItem>
              <SelectItem value="solicitud">Solo Solicitudes</SelectItem>
              <SelectItem value="cotizacion">Solo Cotizaciones</SelectItem>
              <SelectItem value="pago">Solo Pagos</SelectItem>
              <SelectItem value="voucher">Solo Vouchers</SelectItem>
              <SelectItem value="tarea">Solo Tareas</SelectItem>
              <SelectItem value="bitacora">Solo Bitácora</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {filteredEvents.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-gray-100 shadow-sm">
            <h3 className="text-lg font-playfair font-bold text-navy">Sin resultados</h3>
            <p className="text-muted-foreground text-sm max-w-xs mx-auto mt-2">
              No hay eventos que coincidan con el filtro seleccionado.
            </p>
          </div>
        ) : (
          <div className="relative space-y-16">
            <div className="absolute left-4 top-2 bottom-2 w-0.5 bg-gradient-to-b from-gray-200 via-gray-200 to-transparent" />
            {Object.entries(groupedEvents).map(([monthYear, monthEvents], monthIdx) => (
              <div key={monthYear} className="space-y-8">
                <div className="relative">
                  <div className="absolute left-0 w-8 h-8 rounded-full bg-[#F8F9FC] border-2 border-gray-200 flex items-center justify-center z-10 shadow-sm">
                    <div className="w-2 h-2 rounded-full bg-gray-400" />
                  </div>
                  <h3 className="ml-12 text-sm font-bold uppercase tracking-[0.2em] text-muted-foreground pt-1.5">{monthYear}</h3>
                </div>

                <div className="space-y-8 ml-4">
                  {monthEvents.map((event, eventIdx) => (
                    <motion.div key={event.id} initial={{ opacity: 0, x: -10 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: eventIdx * 0.05 }} className="relative pl-8 group">
                      <div className={cn("absolute left-[-17px] top-4 w-8 h-8 rounded-full border-4 border-[#F8F9FC] flex items-center justify-center z-10 shadow-md transition-transform group-hover:scale-110",
                        event.color === "blue" && "bg-blue-600 text-white", event.color === "sky" && "bg-sky-500 text-white",
                        event.color === "emerald" && "bg-emerald-500 text-white", event.color === "gold" && "bg-amber-500 text-white", event.color === "slate" && "bg-slate-400 text-white",
                      )}>
                        {event.icon}
                      </div>

                      <Card className="border border-gray-100 shadow-sm hover:border-primary/30 transition-all duration-300 overflow-hidden bg-white">
                        <CardContent className="p-5">
                          <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                            <div className="space-y-2">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest bg-muted px-1.5 py-0.5 rounded">
                                  {format(event.date, "dd MMM, HH:mm", { locale: es })}
                                </span>
                                <h4 className="font-bold text-navy">{event.title}</h4>
                                {event.status && (
                                  <Badge variant="outline" className={cn("text-[9px] font-bold uppercase tracking-wider", getStatusColor(event.status))}>
                                    {event.status}
                                  </Badge>
                                )}
                              </div>
                              {event.subtitle && <p className="text-sm font-medium text-slate-700">{event.subtitle}</p>}
                            </div>

                            {/* 🔥 Botón modificado para abrir la Vista Rápida */}
                            <Button variant="ghost" size="sm" className="text-xs text-primary font-bold bg-primary/5 hover:bg-primary/10"
                              onClick={() => setSelectedEvent(event)}>
                              <Eye className="w-4 h-4 mr-2" />
                              Ver Detalles
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 🔥 Panel Lateral de Detalles (Quick View) */}
      <Sheet open={!!selectedEvent} onOpenChange={(open) => !open && setSelectedEvent(null)}>
        <SheetContent className="sm:max-w-md overflow-y-auto bg-slate-50 p-0 flex flex-col">
          {selectedEvent && (
            <>
              <SheetHeader className={cn("p-6 text-white relative", 
                selectedEvent.color === "blue" && "bg-blue-600",
                selectedEvent.color === "sky" && "bg-sky-600",
                selectedEvent.color === "emerald" && "bg-emerald-600",
                selectedEvent.color === "gold" && "bg-amber-500",
                selectedEvent.color === "slate" && "bg-slate-700"
              )}>
                <Button variant="ghost" size="icon" className="absolute right-4 top-4 text-white hover:bg-white/20" onClick={() => setSelectedEvent(null)}>
                  <X className="w-5 h-5" />
                </Button>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm">
                    {selectedEvent.icon}
                  </div>
                  <SheetTitle className="text-white text-2xl font-playfair font-bold">
                    {selectedEvent.title}
                  </SheetTitle>
                </div>
                {selectedEvent.status && (
                  <Badge variant="outline" className="mt-3 bg-white/10 border-white/20 text-white w-fit text-[10px] tracking-widest uppercase">
                    ESTADO: {selectedEvent.status}
                  </Badge>
                )}
              </SheetHeader>
              
              <div className="p-6 space-y-6 flex-1">
                <h3 className="text-sm font-bold uppercase tracking-widest text-navy mb-4 border-b pb-2">Datos del Registro</h3>
                <div className="grid grid-cols-2 gap-y-6 gap-x-4">
                  {renderEventDetails(selectedEvent)}
                </div>
              </div>

              <div className="p-6 bg-white border-t border-slate-200">
                <Button 
                  className="w-full gap-2 font-bold" 
                  onClick={() => {
                    const idParam = selectedEvent.originalData.id ? `?search=${selectedEvent.originalData.id}` : '';
                    if (selectedEvent.type === "solicitud") navigate(`/solicitudes${idParam}`);
                    if (selectedEvent.type === "cotizacion") navigate(`/cotizaciones${idParam}`);
                    if (selectedEvent.type === "pago") navigate(`/pagos${idParam}`);
                    if (selectedEvent.type === "voucher") navigate(`/vouchers${idParam}`);
                    if (selectedEvent.type === "bitacora") navigate(`/bitacora`);
                  }}
                >
                  <ExternalLink className="w-4 h-4" />
                  Ir al módulo completo
                </Button>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}

// ---------------------------------------------------------
// FUNCIONES AUXILIARES
// ---------------------------------------------------------

function getStatusColor(status: string) {
  const s = status.toUpperCase();
  // Estados del flujo granular de Solicitud/Servicio (17 valores) — fuente de verdad en
  // src/lib/workflow-status.ts. Se resuelven primero para no caer en el fallback genérico.
  if (isWorkflowStatus(s)) {
    const c = getWorkflowStatusColor(s);
    return `${c.bg} ${c.text} ${c.border}`;
  }
  // Estados de Cotización/Pago/Tarea que no comparten el enum granular de Solicitud.
  if (s === "BORRADOR") return "bg-slate-100 text-slate-600 border-slate-200";
  if (s === "ENVIADA") return "bg-sky-100 text-sky-700 border-sky-200";
  if (s === "ACEPTADA" || s === "COMPLETADO" || s === "COMPLETED") return "bg-emerald-100 text-emerald-700 border-emerald-200";
  if (s === "PENDIENTE" || s === "PENDING") return "bg-amber-100 text-amber-700 border-amber-200";
  if (s === "RECHAZADA" || s === "CANCELADO") return "bg-rose-100 text-rose-700 border-rose-200";
  return "bg-slate-50 text-slate-500 border-slate-100";
}

function DetailRow({ label, value, fullWidth = false }: { label: string, value: any, fullWidth?: boolean }) {
  if (value === undefined || value === null || value === "") return null;
  return (
    <div className={cn("flex flex-col gap-1", fullWidth ? "col-span-2" : "col-span-1")}>
      <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{label}</span>
      <span className="text-sm font-medium text-navy">{value}</span>
    </div>
  );
}

function renderEventDetails(event: TimelineEvent) {
  const data = event.originalData;
  const currencyFormatter = new Intl.NumberFormat("es-CL", { style: "currency", currency: data.currency || "CLP" });

  switch(event.type) {
    case "cotizacion":
      return (
        <>
          <DetailRow label="Moneda" value={data.currency} />
          <DetailRow label="Total" value={currencyFormatter.format(data.total)} />
          <DetailRow label="Validez" value={data.validUntil ? format(parseISO(data.validUntil), 'dd MMM yyyy') : 'N/A'} />
          <DetailRow label="Notas / Condiciones" value={data.notes} fullWidth />
        </>
      );
    case "pago":
      return (
        <>
          <DetailRow label="Método" value={data.method} />
          <DetailRow label="Monto" value={currencyFormatter.format(data.amount)} />
          <DetailRow label="Fecha del Pago" value={data.paymentDate} />
          <DetailRow label="Referencia / Comprobante" value={data.reference} />
          <DetailRow label="Notas" value={data.notes} fullWidth />
        </>
      );
    case "solicitud":
      return (
        <>
          <DetailRow label="Origen" value={data.originCity} />
          <DetailRow label="Destino" value={data.destinationCity} />
          <DetailRow label="Duración (Días)" value={data.durationDays} />
          <DetailRow label="Pasajeros" value={data.passengersCount} />
          <DetailRow label="Servicios Requeridos" value={data.services?.join(", ")} fullWidth />
          <DetailRow label="Notas" value={data.notes} fullWidth />
        </>
      );
    case "voucher":
      return (
        <>
          <DetailRow label="Tipo de Servicio" value={data.serviceType} />
          <DetailRow label="Nombre del Servicio" value={data.serviceName} fullWidth />
          <DetailRow label="Check-In" value={data.checkIn} />
          <DetailRow label="Check-Out" value={data.checkOut} />
          <DetailRow label="Código de Confirmación" value={data.confirmationCode} fullWidth />
          <DetailRow label="Notas" value={data.notes} fullWidth />
        </>
      );
    case "bitacora":
      return (
        <>
          <DetailRow label="Realizado por" value={data.performedBy || "Sistema"} />
          <DetailRow label="Módulo Afectado" value={data.entityType} />
          <DetailRow label="Descripción del Evento" value={data.description} fullWidth />
        </>
      );
    case "tarea":
      return (
        <>
          <DetailRow label="Estado" value={data.status ? (data.status.toString().toUpperCase() === 'COMPLETED' || data.status.toString().toUpperCase() === 'COMPLETADO' ? 'Completada' : data.status) : 'Pendiente'} />
          <DetailRow label="Asignada a" value={data.assignedTo || data.owner || '—'} />
          <DetailRow label="Vencimiento" value={data.dueDate ? format(parseISO(data.dueDate), 'dd MMM yyyy', { locale: es }) : 'Sin fecha'} />
          <DetailRow label="Notas" value={data.notes || data.description} fullWidth />
        </>
      );
    default:
      return <DetailRow label="Detalles" value="No hay detalles estructurados." fullWidth />;
  }
}

function TimelineSkeleton() {
  return (
    <div className="space-y-8 pb-20">
      <div className="flex justify-between items-center"><Skeleton className="h-16 w-64 rounded-2xl" /></div>
      <div className="grid grid-cols-4 gap-4"><Skeleton className="h-24 w-full rounded-2xl" /><Skeleton className="h-24 w-full rounded-2xl" /></div>
    </div>
  );
}