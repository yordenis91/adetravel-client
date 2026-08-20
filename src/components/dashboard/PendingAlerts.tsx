import React, { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Skeleton } from "@/components/ui/skeleton";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { isAtOrAfter } from "@/lib/workflow-status";

interface Alert {
  id: string;
  type: 'urgent' | 'warning' | 'info' | 'success';
  title: string;
  message: string;
}

export function PendingAlerts() {
  // 🔥 1. Consultas optimizadas a tu API real (Limitadas y filtradas para no colapsar la memoria)
  const { data: payData, isLoading: loadingPayments } = useQuery({
    queryKey: ["alerts-payments"],
    queryFn: () => api.get('/payments?status=PENDIENTE&limit=20'),
  });

  const { data: reqData, isLoading: loadingRequests } = useQuery({
    queryKey: ["alerts-requests"],
    queryFn: () => api.get('/requests?limit=100'),
  });

  const { data: quotData, isLoading: loadingQuotations } = useQuery({
    queryKey: ["alerts-quotations"],
    queryFn: () => api.get('/quotations?status=ENVIADA&limit=50'),
  });

  const { data: vouchData, isLoading: loadingVouchers } = useQuery({
    queryKey: ["alerts-vouchers"],
    queryFn: () => api.get('/vouchers?limit=100'),
  });

  const isLoading = loadingPayments || loadingRequests || loadingQuotations || loadingVouchers;

  // 🔥 2. Parseo seguro de respuestas (Compatible con tu backend)
  const payments = Array.isArray(payData) ? payData : (payData as any)?.data || [];
  const requests = Array.isArray(reqData) ? reqData : (reqData as any)?.data || [];
  const quotations = Array.isArray(quotData) ? quotData : (quotData as any)?.data || [];
  const vouchers = Array.isArray(vouchData) ? vouchData : (vouchData as any)?.data || [];

  // 🔥 3. Lógica de alertas adaptada
  const alerts = useMemo(() => {
    if (isLoading) return [];

    const generatedAlerts: Alert[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const threeDaysFromNow = new Date(today);
    threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);

    // 1. Pagos Pendientes (urgent)
    if (payments.length > 0) {
      generatedAlerts.push({
        id: "urgent-payments",
        type: 'urgent',
        title: "Pagos Pendientes",
        message: `${payments.length} ${payments.length === 1 ? 'pago necesita' : 'pagos necesitan'} confirmación.`
      });
    }

    // 2. Viajes Confirmados sin Voucher (urgent) — confirmados por el proveedor (o en un
    // estado posterior) y todavía sin voucher emitido.
    const confirmedRequestsWithoutVoucher = requests.filter((req: any) => {
      return (
        req.status !== "CANCELADA" &&
        isAtOrAfter(req.status, "CONFIRMADA_POR_PROVEEDOR") &&
        !vouchers.some((v: any) => v.requestId === req.id)
      );
    });

    if (confirmedRequestsWithoutVoucher.length > 0) {
      generatedAlerts.push({
        id: "urgent-no-vouchers",
        type: 'urgent',
        title: "Viajes sin Voucher",
        message: `${confirmedRequestsWithoutVoucher.length} ${confirmedRequestsWithoutVoucher.length === 1 ? 'viaje confirmado no tiene' : 'viajes confirmados no tienen'} voucher emitido.`
      });
    }

    // 3. Cotizaciones por Vencer (warning)
    const expiringQuotations = quotations.filter((q: any) => {
      if (!q.validUntil) return false;
      const validDate = new Date(q.validUntil);
      return validDate >= today && validDate <= threeDaysFromNow;
    });

    if (expiringQuotations.length > 0) {
      generatedAlerts.push({
        id: "warning-expiring-quotations",
        type: 'warning',
        title: "Cotizaciones por Vencer",
        message: `${expiringQuotations.length} ${expiringQuotations.length === 1 ? 'cotización vence' : 'cotizaciones vencen'} en los próximos 3 días.`
      });
    }

    // 4. Solicitudes sin Cotizar (warning)
    const newRequestsWithoutQuotation = requests.filter((req: any) => {
      const status = req.status?.toUpperCase();
      return status === "RECEPCIONADA" && !quotations.some((q: any) => q.requestId === req.id);
    });

    if (newRequestsWithoutQuotation.length > 0) {
      generatedAlerts.push({
        id: "warning-unquoted-requests",
        type: 'warning',
        title: "Solicitudes sin Cotizar",
        message: `${newRequestsWithoutQuotation.length} ${newRequestsWithoutQuotation.length === 1 ? 'solicitud nueva espera' : 'solicitudes nuevas esperan'} cotización.`
      });
    }

    // 5. Viajes de Hoy o Mañana (info)
    const todayVouchers = vouchers.filter((v: any) => {
      if (!v.checkIn) return false;
      const d = new Date(v.checkIn);
      d.setHours(0, 0, 0, 0);
      return d.getTime() === today.getTime();
    });

    const tomorrowVouchers = vouchers.filter((v: any) => {
      if (!v.checkIn) return false;
      const d = new Date(v.checkIn);
      d.setHours(0, 0, 0, 0);
      return d.getTime() === tomorrow.getTime();
    });

    const addTravelAlert = (list: any[], title: string, id: string) => {
      if (list.length === 0) return;
      const firstVoucher = list[0];
      
      let message = "";
      if (list.length === 1) {
        message = `1 cliente viaja a ${firstVoucher.destination || 'su destino'}. Vouchers listos.`;
      } else {
        message = `${list.length} viajeros salen a sus destinos. Vouchers listos.`;
      }

      generatedAlerts.push({ id, type: 'info', title, message });
    };

    addTravelAlert(todayVouchers, "Viaje Hoy", "info-today-travel");
    addTravelAlert(tomorrowVouchers, "Viaje Mañana", "info-tomorrow-travel");

    // Si no hay alertas, mostramos el éxito
    if (generatedAlerts.length === 0) {
      generatedAlerts.push({
        id: "all-clear",
        type: 'success',
        title: "Todo al Día",
        message: "No hay avisos urgentes pendientes. ¡Buen trabajo!"
      });
    }

    return generatedAlerts;
  }, [isLoading, payments, vouchers, requests, quotations]);

  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
        <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground mb-4">Avisos Pendientes</h3>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="p-3 border border-gray-100 rounded-xl flex gap-3">
              <Skeleton className="w-2 h-2 rounded-full mt-1.5 shrink-0" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-2 w-full" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
      <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground mb-4">Avisos Pendientes</h3>
      <div className="space-y-3">
        <AnimatePresence mode="popLayout">
          {alerts.map((alert) => (
            <motion.div
              key={alert.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              layout
              className={cn(
                "p-3 border rounded-xl flex gap-3 transition-colors",
                alert.type === 'urgent' && "border-rose-100 bg-rose-50/50",
                alert.type === 'warning' && "border-amber-100 bg-amber-50/50",
                alert.type === 'info' && "border-blue-100 bg-blue-50/50",
                alert.type === 'success' && "border-emerald-100 bg-emerald-50/50"
              )}
            >
              <div className={cn(
                "w-2 h-2 rounded-full mt-1.5 shrink-0",
                alert.type === 'urgent' && "bg-rose-500",
                alert.type === 'warning' && "bg-amber-500",
                alert.type === 'info' && "bg-blue-500",
                alert.type === 'success' && "bg-emerald-500"
              )} />
              <div>
                <p className={cn(
                  "text-xs font-bold",
                  alert.type === 'urgent' ? "text-rose-900" : "text-navy"
                )}>
                  {alert.title}
                </p>
                <p className="text-[10px] text-muted-foreground mt-0.5">{alert.message}</p>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}