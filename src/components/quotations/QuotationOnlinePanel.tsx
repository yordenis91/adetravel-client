import React, { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { CalendarClock, CheckCircle2, Copy, ExternalLink, Eye, Link2, Loader2, RefreshCw, Unlink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { api, getErrorMessage } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext";
import { describeEvent, type QuotationLinkEvent, type QuotationLinkInfo, type ScheduledSend } from "@/lib/quotationOnline";

interface QuotationOnlinePanelProps {
  quotationId: string;
  /** Estado en español tal como lo muestra la lista: Borrador, Enviada, Aceptada, Rechazada. */
  status: string;
  /** Confirmar la aceptación que pidió el cliente (cambia el estado a Aceptada). */
  onConfirmAcceptance: () => void;
}

const ago = (iso: string) => formatDistanceToNow(new Date(iso), { addSuffix: true, locale: es });
const when = (iso: string) => new Date(iso).toLocaleString("es-CL", { dateStyle: "medium", timeStyle: "short" });

/**
 * Seguimiento de la cotización en línea para el agente: si el cliente la abrió, cuántas veces, si pidió aceptar o dejó
 * una consulta, y el enlace para copiarlo (p. ej. a WhatsApp), regenerarlo o revocarlo. También los envíos programados.
 */
export function QuotationOnlinePanel({ quotationId, status, onConfirmAcceptance }: QuotationOnlinePanelProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { hasPermission } = useAuth();
  const canManage = hasPermission("MANAGE_QUOTATIONS");
  const [confirm, setConfirm] = useState<"regenerate" | "revoke" | null>(null);
  const visible = status === "Enviada" || status === "Aceptada" || status === "Rechazada";

  const linkQuery = useQuery({
    queryKey: ["quotation-link", quotationId],
    queryFn: async () => ((await api.get(`/quotations/${quotationId}/link`)) as { data: { link: QuotationLinkInfo | null } }).data.link,
    enabled: visible,
    refetchInterval: 60_000, // el cliente puede abrirla mientras el agente mira la pantalla
    staleTime: 0,
  });
  const scheduledQuery = useQuery({
    queryKey: ["quotation-scheduled", quotationId],
    queryFn: async () => ((await api.get(`/quotations/${quotationId}/scheduled`)) as { data: (ScheduledSend)[] }).data,
    enabled: canManage,
    staleTime: 0,
  });

  const refresh = () => {
    void queryClient.invalidateQueries({ queryKey: ["quotation-link", quotationId] });
    void queryClient.invalidateQueries({ queryKey: ["quotations"] });
  };
  const onError = (error: unknown) => toast({ title: "No se pudo completar la acción", description: getErrorMessage(error, "Inténtalo de nuevo."), variant: "destructive" });

  const create = useMutation({ mutationFn: () => api.post(`/quotations/${quotationId}/link`), onSuccess: refresh, onError });
  const regenerate = useMutation({
    mutationFn: () => api.post(`/quotations/${quotationId}/link/regenerate`),
    onSuccess: () => { setConfirm(null); refresh(); toast({ title: "Enlace nuevo creado", description: "El enlace anterior dejó de funcionar." }); },
    onError,
  });
  const revoke = useMutation({
    mutationFn: () => api.delete(`/quotations/${quotationId}/link`),
    onSuccess: () => { setConfirm(null); refresh(); toast({ title: "Enlace revocado", description: "Ya nadie puede abrir la cotización con ese enlace." }); },
    onError,
  });
  const cancelScheduled = useMutation({
    mutationFn: (id: string) => api.delete(`/quotations/${quotationId}/scheduled/${id}`),
    onSuccess: () => { void scheduledQuery.refetch(); toast({ title: "Envío cancelado" }); },
    onError,
  });

  const copy = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      toast({ title: "Enlace copiado", description: "Pégalo en WhatsApp o donde quieras compartirlo." });
    } catch {
      toast({ title: "No se pudo copiar", description: url, variant: "destructive" });
    }
  };

  const link = linkQuery.data ?? null;
  const scheduled = scheduledQuery.data ?? [];
  if (!visible && scheduled.length === 0) return null;

  return (
    <section aria-label="Seguimiento en línea" className="min-w-0 max-w-full space-y-4 rounded-2xl border border-slate-100 bg-slate-50/40 p-5">
      <div className="flex items-center justify-between gap-3">
        <h3 className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
          <Link2 className="h-3.5 w-3.5" /> Cotización en línea
        </h3>
        {linkQuery.isFetching && <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" aria-label="Actualizando" />}
      </div>

      {scheduled.length > 0 && (
        <ul className="space-y-2">
          {scheduled.map((s) => (
            <li key={s.id} className={`flex items-center justify-between gap-3 rounded-xl border p-3 text-sm ${s.status === "FALLIDO" ? "border-red-100 bg-red-50 text-red-800" : "border-amber-100 bg-amber-50 text-amber-900"}`}>
              <span className="flex items-center gap-2">
                <CalendarClock className="h-4 w-4 shrink-0" />
                {s.status === "FALLIDO" ? `El envío programado no salió: ${s.lastError}` : `Envío programado para el ${when(s.sendAt)}`}
              </span>
              {canManage && <Button size="sm" variant="outline" onClick={() => cancelScheduled.mutate(s.id)} disabled={cancelScheduled.isPending}>{s.status === "FALLIDO" ? "Descartar" : "Cancelar envío"}</Button>}
            </li>
          ))}
        </ul>
      )}

      {visible && linkQuery.isError && (
        <p role="alert" className="text-sm text-red-700">{getErrorMessage(linkQuery.error, "No se pudo cargar el seguimiento.")}</p>
      )}

      {visible && !linkQuery.isError && !link && !linkQuery.isPending && (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            {status === "Enviada"
              ? "Esta cotización se envió sin enlace en línea. Crea uno para compartirlo (por ejemplo por WhatsApp) y saber cuándo el cliente la abre."
              : "Esta cotización no tiene un enlace en línea activo."}
          </p>
          {status === "Enviada" && canManage && (
            <Button size="sm" onClick={() => create.mutate()} disabled={create.isPending} className="gap-2">
              <Link2 className="h-3.5 w-3.5" /> Crear enlace para compartir
            </Button>
          )}
        </div>
      )}

      {link && (
        <>
          {link.acceptanceRequestedAt && status === "Enviada" && (
            <div role="status" className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900">
              <span className="flex items-center gap-2 font-medium">
                <CheckCircle2 className="h-4 w-4" /> El cliente pidió aceptar esta cotización {ago(link.acceptanceRequestedAt)}.
              </span>
              {canManage && <Button size="sm" onClick={onConfirmAcceptance} className="gap-2 bg-emerald-600 hover:bg-emerald-700">Confirmar aceptación</Button>}
            </div>
          )}

          <dl className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-3">
            <div>
              <dt className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Aperturas</dt>
              <dd className="mt-1 flex items-center gap-1.5 font-bold text-navy"><Eye className="h-4 w-4 text-gold" /> {link.viewCount}</dd>
            </div>
            <div>
              <dt className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Primera vez</dt>
              <dd className="mt-1 text-navy">{link.firstViewedAt ? ago(link.firstViewedAt) : <span className="text-amber-700">Aún sin abrir</span>}</dd>
            </div>
            <div>
              <dt className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Última vez</dt>
              <dd className="mt-1 text-navy">{link.lastViewedAt ? ago(link.lastViewedAt) : "---"}</dd>
            </div>
          </dl>

          <div className="space-y-2">
            <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2">
              {/* break-all (no truncate): un URL sin cortes ensancharía el área con scroll y recortaría los botones */}
              <code className="min-w-0 flex-1 break-all text-xs text-slate-600" title={link.url}>{link.url}</code>
              <Button size="sm" variant="outline" onClick={() => copy(link.url)} className="gap-1.5" aria-label="Copiar enlace"><Copy className="h-3.5 w-3.5" /> Copiar</Button>
              <Button size="sm" variant="ghost" asChild aria-label="Abrir la página del cliente">
                <a href={link.url} target="_blank" rel="noreferrer noopener"><ExternalLink className="h-3.5 w-3.5" /></a>
              </Button>
            </div>
            <p className="text-[11px] text-muted-foreground">
              Vence el {new Date(link.expiresAt).toLocaleDateString("es-CL", { dateStyle: "long" })}. Tus propias aperturas con la sesión iniciada no cuentan como visitas.
            </p>
            {canManage && (
              <div className="flex flex-wrap gap-2">
                <Button size="sm" variant="outline" onClick={() => setConfirm("regenerate")} className="gap-1.5"><RefreshCw className="h-3.5 w-3.5" /> Regenerar enlace</Button>
                <Button size="sm" variant="outline" onClick={() => setConfirm("revoke")} className="gap-1.5 text-rose-600 hover:bg-rose-50"><Unlink className="h-3.5 w-3.5" /> Revocar</Button>
              </div>
            )}
          </div>

          {link.events.length > 0 && (
            <div>
              <h4 className="mb-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Actividad</h4>
              <ol className="space-y-2 border-l-2 border-slate-100 pl-4">
                {link.events.map((e: QuotationLinkEvent) => (
                  <li key={e.id} className="text-sm">
                    <p className="text-navy">{describeEvent(e)}</p>
                    <p className="text-[11px] text-muted-foreground" title={when(e.createdAt)}>{ago(e.createdAt)}</p>
                  </li>
                ))}
              </ol>
            </div>
          )}
        </>
      )}

      <ConfirmDialog
        open={confirm === "regenerate"}
        onOpenChange={(o) => !o && setConfirm(null)}
        title="¿Regenerar el enlace?"
        description="El enlace actual dejará de funcionar: si ya se lo enviaste al cliente, tendrás que enviarle el nuevo."
        confirmLabel="Regenerar"
        onConfirm={() => regenerate.mutate()}
        isLoading={regenerate.isPending}
      />
      <ConfirmDialog
        open={confirm === "revoke"}
        onOpenChange={(o) => !o && setConfirm(null)}
        title="¿Revocar el enlace?"
        description="Nadie podrá abrir la cotización con ese enlace. Puedes crear uno nuevo cuando quieras."
        confirmLabel="Revocar"
        variant="danger"
        onConfirm={() => revoke.mutate()}
        isLoading={revoke.isPending}
      />
    </section>
  );
}
