import React, { useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { useRequest, useChangeRequestStatus } from "@/hooks/useRequests";
import {
  ArrowLeft,
  Edit2,
  MapPin,
  Calendar,
  DollarSign,
  FileText,
  Briefcase,
  User,
  CreditCard,
  Ticket,
  ClipboardList,
  Eye,
  X,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { motion } from "framer-motion";
import { isWorkflowStatus, getStatusColor as getWorkflowStatusColor } from "@/lib/workflow-status";
import { RequestStatusBadge } from "./RequestStatusBadge";
import { RequestStatusFlow } from "./RequestStatusFlow";
import { RequestStatusActions } from "./RequestStatusActions";
import { RequestFormDialog } from "./RequestFormDialog";
import { ServicesSection } from "@/components/services/ServicesSection";

type EventType = "cotizacion" | "pago" | "voucher" | "confirmacion" | "bitacora";

interface TimelineEvent {
  id: string;
  type: EventType;
  date: Date;
  title: string;
  subtitle?: string;
  status?: string;
  color: string;
  icon: React.ReactNode;
  originalData: any;
}

export default function RequestDetailPage() {
  const { requestId } = useParams<{ requestId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [filterType, setFilterType] = useState("all");
  const [selectedEvent, setSelectedEvent] = useState<TimelineEvent | null>(null);

  const { data: request, isLoading: isRequestLoading } = useRequest(requestId!);
  const updateStatusMutation = useChangeRequestStatus();

  const { data: clientsResponse = [] } = useQuery({
    queryKey: ["clients-all"],
    queryFn: async () => await api.get("/clients"),
  });
  const clients = Array.isArray(clientsResponse) ? clientsResponse : (clientsResponse as any)?.data || [];

  const { data: providersResponse = [] } = useQuery({
    queryKey: ["providers-all"],
    queryFn: async () => await api.get("/providers?limit=200"),
  });
  const providers = Array.isArray(providersResponse) ? providersResponse : (providersResponse as any)?.data || [];

  const { data: logsResponse = [], isLoading: isLogsLoading } = useQuery({
    queryKey: ["request-logs", requestId],
    queryFn: async () => await api.get(`/activity-logs?entityId=${requestId}&limit=100`),
    enabled: !!requestId,
  });
  const logs = Array.isArray(logsResponse) ? logsResponse : (logsResponse as any)?.data || [];

  const isLoading = isRequestLoading;

  const getProviderName = (id?: string) => {
    if (!id) return null;
    const provider = providers.find((p: any) => p.id === id);
    return provider ? provider.fantasyName || provider.name : null;
  };

  const safeParseDate = (dateString: string | undefined) => {
    if (!dateString) return new Date();
    try {
      return parseISO(dateString);
    } catch {
      return new Date();
    }
  };

  // Vista 360° de la Solicitud: además de sus propios datos, consolida en una sola
  // línea de tiempo todo lo que ya viene incluido en GET /requests/:id (cotizaciones,
  // pagos, vouchers, confirmaciones) más la Bitácora, siguiendo el mismo patrón que
  // ClientTimelinePage usa para el cliente.
  const events = useMemo(() => {
    if (!request) return [];
    const allEvents: TimelineEvent[] = [];
    const currencyFormat = (amount: number, currency: string) =>
      currency === "CLP"
        ? new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP" }).format(amount)
        : `$${amount} ${currency}`;

    (request.quotations || []).forEach((q: any) => {
      allEvents.push({
        id: q.id, type: "cotizacion", date: safeParseDate(q.createdAt),
        title: `Cotización ${q.quotationNumber || ""}`,
        subtitle: currencyFormat(q.total, q.currency),
        status: q.status, color: "sky", icon: <FileText className="w-4 h-4" />, originalData: q,
      });
    });

    (request.payments || []).forEach((p: any) => {
      allEvents.push({
        id: p.id, type: "pago", date: safeParseDate(p.createdAt),
        title: `Pago ${p.paymentNumber || ""}`,
        subtitle: `${p.method} · ${currencyFormat(p.amount, p.currency)}`,
        status: p.status, color: "emerald", icon: <CreditCard className="w-4 h-4" />, originalData: p,
      });
    });

    (request.vouchers || []).forEach((v: any) => {
      allEvents.push({
        id: v.id, type: "voucher", date: safeParseDate(v.createdAt),
        title: `Voucher ${v.voucherNumber || ""}`,
        subtitle: `${v.serviceType || ""}${v.serviceName ? `: ${v.serviceName}` : ""}`,
        status: v.status, color: "gold", icon: <Ticket className="w-4 h-4" />, originalData: v,
      });
    });

    (request.confirmations || []).forEach((c: any) => {
      allEvents.push({
        id: c.id, type: "confirmacion", date: safeParseDate(c.createdAt),
        title: `Confirmación ${c.confirmationNumber || ""}`,
        subtitle: getProviderName(c.providerId) || undefined,
        color: "violet", icon: <ClipboardList className="w-4 h-4" />, originalData: c,
      });
    });

    logs.forEach((l: any) => {
      allEvents.push({
        id: l.id, type: "bitacora", date: safeParseDate(l.createdAt),
        title: l.action?.replace(/_/g, " ") || "Acción", subtitle: l.description,
        color: "slate", icon: <ClipboardList className="w-4 h-4" />, originalData: l,
      });
    });

    return allEvents.sort((a, b) => b.date.getTime() - a.date.getTime());
  }, [request, logs, providers]);

  const filteredEvents = useMemo(() => {
    if (filterType === "all") return events;
    return events.filter((e) => e.type === filterType);
  }, [events, filterType]);

  const groupedEvents = useMemo(() => {
    const groups: { [key: string]: TimelineEvent[] } = {};
    filteredEvents.forEach((event) => {
      const monthYear = format(event.date, "MMMM yyyy", { locale: es });
      if (!groups[monthYear]) groups[monthYear] = [];
      groups[monthYear].push(event);
    });
    return groups;
  }, [filteredEvents]);

  const kpis = useMemo(() => {
    if (!request) return null;
    const totalPaidCLP = (request.payments || [])
      .filter((p: any) => p.status === "COMPLETADO" && p.currency === "CLP")
      .reduce((sum: number, p: any) => sum + (p.amount || 0), 0);
    return {
      servicesCount: request.servicesList?.length || 0,
      quotationsCount: request.quotations?.length || 0,
      vouchersCount: request.vouchers?.length || 0,
      totalPaidCLP: new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP" }).format(totalPaidCLP),
    };
  }, [request]);

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP" }).format(amount || 0);

  const handleStatusChange = (newStatus: string, note?: string) => {
    if (!requestId) return;
    const payload = newStatus === "CANCELADA"
      ? { id: requestId, status: newStatus, cancellationReason: note }
      : { id: requestId, status: newStatus, notes: note };
    updateStatusMutation.mutate(payload, {
      onSuccess: () => toast({ title: "Estado actualizado", description: "El estado de la solicitud ha sido cambiado." }),
    });
  };

  if (isLoading) return <RequestDetailSkeleton />;
  if (!request) {
    return (
      <div className="text-center py-20 text-muted-foreground">
        Solicitud no encontrada.
        <div className="mt-4">
          <Button variant="outline" onClick={() => navigate("/solicitudes")}>Volver a Solicitudes</Button>
        </div>
      </div>
    );
  }

  const client = request.client;
  const clientName = client ? `${client.firstName} ${client.lastName}` : "Cliente no disponible";

  return (
    <div className="space-y-8 pb-20 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
        <div className="space-y-1">
          <button
            onClick={() => navigate("/solicitudes")}
            className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors mb-4"
          >
            <ArrowLeft className="w-3 h-3" /> Volver a Solicitudes
          </button>

          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-[10px] font-mono font-bold text-primary px-2 py-1 bg-primary/10 rounded tracking-tighter">
              {request.requestNumber}
            </span>
            <RequestStatusBadge status={request.status} />
          </div>
          <h1 className="text-3xl font-playfair font-bold text-navy mt-2">{clientName}</h1>
          <p className="text-muted-foreground text-sm flex items-center gap-2 mt-1">
            <MapPin className="w-3.5 h-3.5 text-primary/60" />
            {request.originCity || "N/A"} → {request.destinationCity}, {request.destinationCountry}
          </p>
        </div>

        <Button variant="outline" size="sm" className="gap-2 text-xs font-bold uppercase tracking-wider shrink-0" onClick={() => setIsFormOpen(true)}>
          <Edit2 className="w-3.5 h-3.5" /> Editar Solicitud
        </Button>
      </div>

      {kpis && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Servicios", value: kpis.servicesCount, icon: <Briefcase className="w-5 h-5" />, color: "blue" },
            { label: "Cotizaciones", value: kpis.quotationsCount, icon: <FileText className="w-5 h-5" />, color: "sky" },
            { label: "Vouchers Emitidos", value: kpis.vouchersCount, icon: <Ticket className="w-5 h-5" />, color: "gold" },
            { label: "Total Pagado", value: kpis.totalPaidCLP, icon: <DollarSign className="w-5 h-5" />, color: "emerald" },
          ].map((kpi, i) => (
            <motion.div key={kpi.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
              <Card className="border-none shadow-sm bg-white overflow-hidden hover:shadow-md transition-all duration-300">
                <CardContent className="p-5 flex items-center gap-4">
                  <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
                    kpi.color === "blue" && "bg-blue-50 text-blue-600",
                    kpi.color === "sky" && "bg-sky-50 text-sky-600",
                    kpi.color === "gold" && "bg-amber-50 text-amber-600",
                    kpi.color === "emerald" && "bg-emerald-50 text-emerald-600",
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
      )}

      <div className="bg-slate-50/50 p-6 rounded-2xl border border-slate-100">
        <h4 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-4">Progreso de la Solicitud</h4>
        <RequestStatusFlow currentStatus={request.status} />
        <div className="mt-6">
          <RequestStatusActions currentStatus={request.status} onChange={handleStatusChange} />
        </div>
        {request.status === "CANCELADA" && request.cancellationReason && (
          <div className="mt-4 p-3 bg-rose-50 border border-rose-100 rounded-lg">
            <p className="text-[10px] font-bold uppercase tracking-widest text-rose-600 mb-1">Motivo de cancelación</p>
            <p className="text-sm text-rose-700">{request.cancellationReason}</p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <InfoCard icon={<User className="w-4 h-4" />} title="Información del Cliente">
          <p className="text-lg font-playfair font-bold text-navy">{clientName}</p>
          <p className="text-xs text-muted-foreground mt-1">ID Cliente: {request.clientId}</p>
          {request.createdByName && (
            <p className="text-xs text-muted-foreground mt-1">Creada por {request.createdByName}</p>
          )}
        </InfoCard>

        <InfoCard icon={<Calendar className="w-4 h-4" />} title="Fechas y Duración">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-tighter">Fecha Solicitud</p>
              <p className="text-sm font-bold text-navy">
                {request.requestDate ? format(new Date(request.requestDate), "dd MMMM, yyyy", { locale: es }) : "-"}
              </p>
            </div>
            <div className="text-right">
              <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-tighter">Duración</p>
              <p className="text-sm font-bold text-navy">{request.durationDays} Días</p>
            </div>
          </div>
        </InfoCard>

        <InfoCard icon={<MapPin className="w-4 h-4" />} title="Itinerario y Destino">
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1">
              <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-tighter">Desde</p>
              <p className="text-base font-bold text-navy">{request.originCity || "N/A"}, {request.originCountry || "N/A"}</p>
            </div>
            <ArrowLeft className="w-4 h-4 text-primary rotate-180 shrink-0" />
            <div className="flex-1 text-right">
              <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-tighter">Hacia</p>
              <p className="text-base font-bold text-navy">{request.destinationCity}, {request.destinationCountry}</p>
            </div>
          </div>
        </InfoCard>

        <InfoCard icon={<DollarSign className="w-4 h-4" />} title="Presupuesto Estimado">
          <p className="text-[10px] text-muted-foreground uppercase font-bold">Rango</p>
          <p className="text-sm font-bold text-navy">
            {formatCurrency(request.budgetMin)} - {formatCurrency(request.budgetMax)}
          </p>
        </InfoCard>
      </div>

      <div className="space-y-3">
        <div className="flex items-center gap-2 text-primary">
          <Briefcase className="w-4 h-4" />
          <span className="text-[10px] font-bold uppercase tracking-widest">Servicios</span>
        </div>
        <ServicesSection requestId={request.id} isPackage={!!request.isPackage} defaultClientId={request.clientId} />
      </div>

      <div className="space-y-3">
        <div className="flex items-center gap-2 text-primary">
          <FileText className="w-4 h-4" />
          <span className="text-[10px] font-bold uppercase tracking-widest">Descripción y Requerimientos</span>
        </div>
        <Card className="border border-gray-100 shadow-sm">
          <CardContent className="p-5 min-h-[80px]">
            <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">
              {request.description || "Sin descripción adicional proporcionada."}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-8 relative pt-4">
        <div className="flex items-center justify-between border-b border-gray-200 pb-4">
          <h2 className="text-xl font-playfair font-bold text-navy">Historial de Actividad</h2>
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-[200px] h-10 text-xs font-bold tracking-wider uppercase bg-white">
              <SelectValue placeholder="Filtrar por..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todo el Historial</SelectItem>
              <SelectItem value="cotizacion">Solo Cotizaciones</SelectItem>
              <SelectItem value="pago">Solo Pagos</SelectItem>
              <SelectItem value="voucher">Solo Vouchers</SelectItem>
              <SelectItem value="confirmacion">Solo Confirmaciones</SelectItem>
              <SelectItem value="bitacora">Solo Bitácora</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {isLogsLoading ? (
          <Skeleton className="h-32 w-full rounded-2xl" />
        ) : filteredEvents.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-gray-100 shadow-sm">
            <h3 className="text-lg font-playfair font-bold text-navy">Sin actividad todavía</h3>
            <p className="text-muted-foreground text-sm max-w-xs mx-auto mt-2">
              Las cotizaciones, pagos, vouchers y confirmaciones de esta solicitud van a aparecer acá.
            </p>
          </div>
        ) : (
          <div className="relative space-y-16">
            <div className="absolute left-4 top-2 bottom-2 w-0.5 bg-gradient-to-b from-gray-200 via-gray-200 to-transparent" />
            {Object.entries(groupedEvents).map(([monthYear, monthEvents]) => (
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
                        event.color === "sky" && "bg-sky-500 text-white",
                        event.color === "emerald" && "bg-emerald-500 text-white",
                        event.color === "gold" && "bg-amber-500 text-white",
                        event.color === "violet" && "bg-violet-500 text-white",
                        event.color === "slate" && "bg-slate-400 text-white",
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

                            <Button variant="ghost" size="sm" className="text-xs text-primary font-bold bg-primary/5 hover:bg-primary/10" onClick={() => setSelectedEvent(event)}>
                              <Eye className="w-4 h-4 mr-2" /> Ver Detalles
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

      <RequestFormDialog
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        request={request}
        clients={clients}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ["requests"] });
          toast({ title: "Solicitud actualizada" });
        }}
      />

      <Sheet open={!!selectedEvent} onOpenChange={(open) => !open && setSelectedEvent(null)}>
        <SheetContent className="sm:max-w-md overflow-y-auto bg-slate-50 p-0 flex flex-col">
          {selectedEvent && (
            <>
              <SheetHeader className={cn("p-6 text-white relative",
                selectedEvent.color === "sky" && "bg-sky-600",
                selectedEvent.color === "emerald" && "bg-emerald-600",
                selectedEvent.color === "gold" && "bg-amber-500",
                selectedEvent.color === "violet" && "bg-violet-600",
                selectedEvent.color === "slate" && "bg-slate-700",
              )}>
                <Button variant="ghost" size="icon" className="absolute right-4 top-4 text-white hover:bg-white/20" onClick={() => setSelectedEvent(null)}>
                  <X className="w-5 h-5" />
                </Button>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm">{selectedEvent.icon}</div>
                  <SheetTitle className="text-white text-2xl font-playfair font-bold">{selectedEvent.title}</SheetTitle>
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
                  {renderEventDetails(selectedEvent, getProviderName)}
                </div>
              </div>

              <div className="p-6 bg-white border-t border-slate-200">
                <Button
                  className="w-full gap-2 font-bold"
                  onClick={() => {
                    if (selectedEvent.type === "cotizacion") navigate(`/cotizaciones?search=${selectedEvent.originalData.quotationNumber}`);
                    if (selectedEvent.type === "pago") navigate(`/pagos?search=${selectedEvent.originalData.paymentNumber}`);
                    if (selectedEvent.type === "voucher") navigate(`/vouchers?search=${selectedEvent.originalData.voucherNumber}`);
                    if (selectedEvent.type === "confirmacion") navigate(`/confirmaciones?search=${selectedEvent.originalData.confirmationNumber}`);
                    if (selectedEvent.type === "bitacora") navigate(`/bitacora`);
                  }}
                >
                  <ExternalLink className="w-4 h-4" /> Ir al módulo completo
                </Button>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}

function InfoCard({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-primary">
        {icon}
        <span className="text-[10px] font-bold uppercase tracking-widest">{title}</span>
      </div>
      <div className="p-4 bg-white rounded-xl border border-slate-100 shadow-sm">{children}</div>
    </div>
  );
}

function getStatusColor(status: string) {
  const s = status.toUpperCase();
  if (isWorkflowStatus(s)) {
    const c = getWorkflowStatusColor(s);
    return `${c.bg} ${c.text} ${c.border}`;
  }
  if (s === "BORRADOR") return "bg-slate-100 text-slate-600 border-slate-200";
  if (s === "ENVIADA") return "bg-sky-100 text-sky-700 border-sky-200";
  if (s === "ACEPTADA" || s === "COMPLETADO") return "bg-emerald-100 text-emerald-700 border-emerald-200";
  if (s === "PENDIENTE") return "bg-amber-100 text-amber-700 border-amber-200";
  if (s === "RECHAZADA" || s === "CANCELADO") return "bg-rose-100 text-rose-700 border-rose-200";
  return "bg-slate-50 text-slate-500 border-slate-100";
}

function DetailRow({ label, value, fullWidth = false }: { label: string; value: any; fullWidth?: boolean }) {
  if (value === undefined || value === null || value === "") return null;
  return (
    <div className={cn("flex flex-col gap-1", fullWidth ? "col-span-2" : "col-span-1")}>
      <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{label}</span>
      <span className="text-sm font-medium text-navy">{value}</span>
    </div>
  );
}

function renderEventDetails(event: TimelineEvent, getProviderName: (id?: string) => string | null) {
  const data = event.originalData;
  const currencyFormatter = new Intl.NumberFormat("es-CL", { style: "currency", currency: data.currency || "CLP" });

  switch (event.type) {
    case "cotizacion":
      return (
        <>
          <DetailRow label="Moneda" value={data.currency} />
          <DetailRow label="Total" value={currencyFormatter.format(data.total)} />
          <DetailRow label="Validez" value={data.validUntil ? format(parseISO(data.validUntil), "dd MMM yyyy") : "N/A"} />
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
    case "confirmacion":
      return (
        <>
          <DetailRow label="Proveedor" value={getProviderName(data.providerId)} />
          <DetailRow label="Precio" value={currencyFormatter.format(data.price)} />
          <DetailRow label="N° Confirmación Proveedor" value={data.providerConfirmationNumber} />
          <DetailRow label="Válida hasta" value={data.validUntil} />
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
    default:
      return <DetailRow label="Detalles" value="No hay detalles estructurados." fullWidth />;
  }
}

function RequestDetailSkeleton() {
  return (
    <div className="space-y-8 pb-20">
      <Skeleton className="h-16 w-96 rounded-2xl" />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Skeleton className="h-24 w-full rounded-2xl" />
        <Skeleton className="h-24 w-full rounded-2xl" />
        <Skeleton className="h-24 w-full rounded-2xl" />
        <Skeleton className="h-24 w-full rounded-2xl" />
      </div>
      <Skeleton className="h-40 w-full rounded-2xl" />
    </div>
  );
}
