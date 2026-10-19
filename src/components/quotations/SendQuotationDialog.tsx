import React, { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { AlertTriangle, CalendarClock, Link2, Paperclip, Plus, RotateCcw, Send, X, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { api, getErrorMessage } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

/** Mismos topes que el API. */
export const MAX_RECIPIENTS = 10;
export const MAX_SCHEDULE_DAYS = 90;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface EmailDraft {
  recipients: { primary: string | null; additional: string[] };
  subject: string;
  message: string;
  /** Texto sugerido según se envíe el enlace, el PDF o ambos. */
  messages?: { both: string; link: string; pdf: string };
  attachmentName: string;
  /** A quién llegan las respuestas del cliente (quien envía). */
  replyTo?: string | null;
  deliveryMode: "live" | "redirect" | "off";
  status: string;
}

interface SendResult {
  sent: boolean;
  scheduled?: boolean;
  sendAt?: string;
  recipients: number;
  statusChanged: boolean;
  linkUrl?: string | null;
}

interface SendQuotationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Cotización a enviar (solo se usa el id y el número). */
  quotation: { id: string; quotationNumber: string } | null;
  /** Se llama tras un envío (o programación) exitoso, para refrescar la lista y el estado. */
  onSent: (result: SendResult & { quotationId: string }) => void;
}

/** `datetime-local` (hora del navegador) a partir de una fecha. */
const toLocalInput = (d: Date) => new Date(d.getTime() - d.getTimezoneOffset() * 60_000).toISOString().slice(0, 16);

/** Lista de correos agregados a mano (CC / CCO) con su validación. */
function AddressList({ label, values, onChange, taken, max }: { label: string; values: string[]; onChange: (v: string[]) => void; taken: string[]; max: number }) {
  const [input, setInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const add = () => {
    const email = input.trim();
    if (!email) return;
    if (!EMAIL_RE.test(email)) { setError("Correo inválido"); return; }
    if ([...values, ...taken].some((v) => v.toLowerCase() === email.toLowerCase())) { setError("Ese correo ya está en la lista"); return; }
    if (values.length >= max) { setError(`Máximo ${max} correos`); return; }
    onChange([...values, email]);
    setInput("");
    setError(null);
  };
  return (
    <div className="space-y-1.5">
      <span className="text-xs font-bold uppercase tracking-wider text-navy">{label}</span>
      {values.length > 0 && (
        <ul className="flex flex-wrap gap-1.5">
          {values.map((v) => (
            <li key={v} className="flex items-center gap-1 rounded-full bg-slate-100 py-0.5 pl-2.5 pr-1 text-xs">
              <span className="break-all">{v}</span>
              <button type="button" aria-label={`Quitar ${v}`} onClick={() => onChange(values.filter((x) => x !== v))} className="rounded-full p-0.5 hover:bg-slate-200">
                <X className="h-3 w-3" />
              </button>
            </li>
          ))}
        </ul>
      )}
      <div className="flex items-start gap-2">
        <div className="flex-1">
          <Input
            value={input}
            onChange={(e) => { setInput(e.target.value); setError(null); }}
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); add(); } }}
            placeholder="correo@ejemplo.cl"
            aria-label={`Agregar correo en ${label}`}
            inputMode="email"
            className="h-9"
          />
          {error && <p className="mt-1 text-xs text-destructive">{error}</p>}
        </div>
        <Button type="button" variant="outline" size="sm" onClick={add} aria-label={`Agregar a ${label}`} className="gap-1">
          <Plus className="h-3.5 w-3.5" /> Agregar
        </Button>
      </div>
    </div>
  );
}

/**
 * Enviar la cotización por correo: la persona ve y edita el asunto y el mensaje, elige a quién (correo principal,
 * adicionales del cliente u otros), con copia (CC) y copia oculta (CCO), si va el enlace en línea (con seguimiento),
 * el PDF adjunto o ambos, y si sale ahora o a una hora programada. La cotización solo pasa a "Enviada" si el correo salió.
 */
export function SendQuotationDialog({ open, onOpenChange, quotation, onSent }: SendQuotationDialogProps) {
  const { toast } = useToast();
  const [selected, setSelected] = useState<string[]>([]);
  const [custom, setCustom] = useState<string[]>([]);
  const [customInput, setCustomInput] = useState("");
  const [customError, setCustomError] = useState<string | null>(null);
  const [cc, setCc] = useState<string[]>([]);
  const [bcc, setBcc] = useState<string[]>([]);
  const [showCopies, setShowCopies] = useState(false);
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [messageEdited, setMessageEdited] = useState(false);
  const [includeLink, setIncludeLink] = useState(true);
  const [attachPdf, setAttachPdf] = useState(true);
  const [schedule, setSchedule] = useState(false);
  const [scheduledAt, setScheduledAt] = useState("");
  const [sendError, setSendError] = useState<string | null>(null);

  const draftQuery = useQuery({
    queryKey: ["quotation-email-draft", quotation?.id],
    queryFn: async () => ((await api.get(`/quotations/${quotation!.id}/email-draft`)) as { data: EmailDraft }).data,
    enabled: open && !!quotation,
    gcTime: 0, // siempre fresco: el cliente o la cotización pueden haber cambiado
    staleTime: 0,
  });
  const draft = draftQuery.data;

  /** Texto sugerido para lo que se va a enviar. */
  const suggested = (d: EmailDraft, link: boolean, pdf: boolean) => {
    const variants = d.messages;
    if (!variants) return d.message;
    return link && pdf ? variants.both : link ? variants.link : variants.pdf;
  };

  // Al llegar el borrador se prellena el formulario (solo con el correo principal marcado: lo más seguro por defecto).
  useEffect(() => {
    if (!draft) return;
    setSelected(draft.recipients.primary ? [draft.recipients.primary] : []);
    setCustom([]);
    setCustomInput("");
    setCustomError(null);
    setCc([]);
    setBcc([]);
    setShowCopies(false);
    setIncludeLink(true);
    setAttachPdf(true);
    setSchedule(false);
    setScheduledAt("");
    setSubject(draft.subject);
    setMessage(draft.message);
    setMessageEdited(false);
    setSendError(null);
  }, [draft]);

  const changeDelivery = (link: boolean, pdf: boolean) => {
    setIncludeLink(link);
    setAttachPdf(pdf);
    // Si la persona no tocó el mensaje, el texto se ajusta a lo que va en el correo.
    if (draft && !messageEdited) setMessage(suggested(draft, link, pdf));
  };

  const known = draft ? [...(draft.recipients.primary ? [draft.recipients.primary] : []), ...draft.recipients.additional] : [];
  const allOptions = [...known, ...custom.filter((c) => !known.some((k) => k.toLowerCase() === c.toLowerCase()))];
  const isSelected = (email: string) => selected.some((s) => s.toLowerCase() === email.toLowerCase());
  const toggle = (email: string) =>
    setSelected((prev) => (isSelected(email) ? prev.filter((s) => s.toLowerCase() !== email.toLowerCase()) : [...prev, email]));

  const addCustom = () => {
    const email = customInput.trim();
    if (!email) return;
    if (!EMAIL_RE.test(email)) { setCustomError("Correo inválido"); return; }
    if (allOptions.some((o) => o.toLowerCase() === email.toLowerCase())) {
      setCustomError("Ese correo ya está en la lista");
      return;
    }
    if (allOptions.length >= MAX_RECIPIENTS) { setCustomError(`Máximo ${MAX_RECIPIENTS} destinatarios`); return; }
    setCustom((prev) => [...prev, email]);
    setSelected((prev) => [...prev, email]);
    setCustomInput("");
    setCustomError(null);
  };

  // Límites de la fecha de envío programado (se recalculan al abrir: dependen de «ahora»).
  const bounds = useMemo(() => {
    const now = Date.now();
    return { min: toLocalInput(new Date(now + 5 * 60_000)), max: toLocalInput(new Date(now + MAX_SCHEDULE_DAYS * 86_400_000)) };
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps
  const scheduleValid = !schedule || (!!scheduledAt && scheduledAt >= bounds.min && scheduledAt <= bounds.max);

  const send = useMutation({
    mutationFn: async () =>
      ((await api.post(`/quotations/${quotation!.id}/send`, {
        to: selected, cc, bcc, subject: subject.trim(), message: message.trim(), attachPdf, includeLink,
        ...(schedule ? { scheduledAt: new Date(scheduledAt).toISOString() } : {}),
      })) as { data: SendResult }).data,
    onSuccess: (result) => {
      if (result.scheduled) {
        toast({ title: "Envío programado", description: `La cotización saldrá el ${new Date(result.sendAt ?? scheduledAt).toLocaleString("es-CL", { dateStyle: "long", timeStyle: "short" })}. Puedes cancelarlo desde el detalle de la cotización.` });
      } else {
        toast({
          title: "Cotización enviada",
          description: `${result.recipients === 1 ? "Se envió a 1 destinatario" : `Se envió a ${result.recipients} destinatarios`}${result.statusChanged ? "; ahora está en estado Enviada." : "."}`,
        });
      }
      onSent({ ...result, quotationId: quotation!.id });
      onOpenChange(false);
    },
    onError: (error) => setSendError(getErrorMessage(error, "No se pudo enviar la cotización.")),
  });

  const handleOpenChange = (next: boolean) => {
    if (send.isPending) return; // no cerrar a mitad del envío
    onOpenChange(next);
  };

  const off = draft?.deliveryMode === "off";
  const nothingToSend = !includeLink && !attachPdf;
  const canSend = !!draft && !off && selected.length > 0 && subject.trim() !== "" && message.trim() !== "" && !nothingToSend && scheduleValid && !send.isPending;
  const isResend = draft?.status === "ENVIADA";
  const actionLabel = schedule ? "Programar envío" : isResend ? "Reenviar" : "Enviar";

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-playfair text-navy">{isResend ? "Reenviar cotización" : "Enviar cotización"}</DialogTitle>
          <DialogDescription>
            Revisa y edita el mensaje antes de enviarlo. La cotización {quotation?.quotationNumber} puede ir como enlace en línea, como PDF adjunto o ambos.
          </DialogDescription>
        </DialogHeader>

        {draftQuery.isPending && <p role="status" className="text-sm text-muted-foreground">Preparando el correo…</p>}

        {draftQuery.isError && (
          <div role="alert" className="flex items-start gap-2 rounded-xl border border-red-100 bg-red-50 p-3 text-sm text-red-700">
            <XCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{getErrorMessage(draftQuery.error, "No se pudo preparar el correo.")}</span>
          </div>
        )}

        {draft && (
          <div className="space-y-4">
            {off && (
              <div role="alert" className="flex items-start gap-2 rounded-xl border border-red-100 bg-red-50 p-3 text-sm text-red-700">
                <XCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>El envío de correos está desactivado en este entorno: no se puede enviar.</span>
              </div>
            )}
            {draft.deliveryMode === "redirect" && (
              <div role="status" className="flex items-start gap-2 rounded-xl border border-amber-100 bg-amber-50 p-3 text-sm text-amber-800">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>Modo demostración: el correo no llegará al cliente, se desvía a una casilla de pruebas (sin copias).</span>
              </div>
            )}
            {isResend && (
              <p className="text-xs text-muted-foreground">Esta cotización ya fue enviada: es un reenvío y el estado no cambia.</p>
            )}

            <fieldset className="space-y-2">
              <legend className="text-xs font-bold uppercase tracking-wider text-navy">Para</legend>
              {!draft.recipients.primary && (
                <p className="text-xs text-amber-700">El cliente no tiene un correo principal registrado: agrega uno abajo.</p>
              )}
              {allOptions.map((email) => (
                <label key={email} className="flex items-center gap-2 text-sm">
                  <input type="checkbox" className="h-4 w-4 accent-[#0F1E3C]" checked={isSelected(email)} onChange={() => toggle(email)} />
                  <span className="break-all">{email}</span>
                  {email === draft.recipients.primary && <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold uppercase text-slate-500">Principal</span>}
                </label>
              ))}
              <div className="flex items-start gap-2">
                <div className="flex-1">
                  <Input
                    value={customInput}
                    onChange={(e) => { setCustomInput(e.target.value); setCustomError(null); }}
                    onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addCustom(); } }}
                    placeholder="Agregar otro correo"
                    aria-label="Agregar otro destinatario"
                    inputMode="email"
                    className="h-9"
                  />
                  {customError && <p className="mt-1 text-xs text-destructive">{customError}</p>}
                </div>
                <Button type="button" variant="outline" size="sm" onClick={addCustom} aria-label="Agregar destinatario" className="gap-1">
                  <Plus className="h-3.5 w-3.5" /> Agregar
                </Button>
              </div>

              {!showCopies ? (
                <button type="button" onClick={() => setShowCopies(true)} className="text-xs font-medium text-primary hover:underline">
                  + Agregar copia (CC) o copia oculta (CCO)
                </button>
              ) : (
                <div className="space-y-3 rounded-xl border border-slate-100 bg-slate-50/50 p-3">
                  <AddressList label="CC (copia)" values={cc} onChange={setCc} taken={[...selected, ...bcc]} max={MAX_RECIPIENTS} />
                  <AddressList label="CCO (copia oculta)" values={bcc} onChange={setBcc} taken={[...selected, ...cc]} max={MAX_RECIPIENTS} />
                  <p className="text-[11px] text-muted-foreground">Quienes van en CCO reciben el correo sin que el cliente lo vea.</p>
                </div>
              )}
              {draft.replyTo && <p className="text-xs text-muted-foreground">Si el cliente responde, su respuesta llegará a <strong>{draft.replyTo}</strong>.</p>}
            </fieldset>

            <div className="space-y-1.5">
              <label htmlFor="quotation-subject" className="text-xs font-bold uppercase tracking-wider text-navy">Asunto</label>
              <Input id="quotation-subject" value={subject} onChange={(e) => setSubject(e.target.value)} maxLength={200} />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label htmlFor="quotation-message" className="text-xs font-bold uppercase tracking-wider text-navy">Mensaje</label>
                <button
                  type="button"
                  onClick={() => { setSubject(draft.subject); setMessage(suggested(draft, includeLink, attachPdf)); setMessageEdited(false); }}
                  className="flex items-center gap-1 text-xs text-muted-foreground hover:text-navy"
                >
                  <RotateCcw className="h-3 w-3" /> Restablecer
                </button>
              </div>
              <Textarea id="quotation-message" value={message} onChange={(e) => { setMessage(e.target.value); setMessageEdited(true); }} rows={9} maxLength={5000} />
            </div>

            <fieldset className="space-y-2 rounded-xl bg-slate-50 p-3">
              <legend className="sr-only">Qué se envía</legend>
              <label className="flex items-start gap-2 text-sm">
                <input type="checkbox" className="mt-0.5 h-4 w-4 accent-[#0F1E3C]" checked={includeLink} onChange={(e) => changeDelivery(e.target.checked, attachPdf)} />
                <span>
                  <span className="flex items-center gap-1.5 font-medium"><Link2 className="h-3.5 w-3.5" /> Incluir enlace para ver la cotización en línea</span>
                  <span className="block text-xs text-muted-foreground">Te avisamos cuando el cliente la abra, y puede aceptarla o consultarte desde ahí.</span>
                </span>
              </label>
              <label className="flex items-start gap-2 text-sm">
                <input type="checkbox" className="mt-0.5 h-4 w-4 accent-[#0F1E3C]" checked={attachPdf} onChange={(e) => changeDelivery(includeLink, e.target.checked)} />
                <span className="flex items-center gap-1.5"><Paperclip className="h-3.5 w-3.5" /> Adjuntar <strong>{draft.attachmentName}</strong></span>
              </label>
              {nothingToSend && <p role="alert" className="text-xs text-destructive">Incluye el enlace, el PDF o ambos: si no, el cliente no recibe la cotización.</p>}
            </fieldset>

            <fieldset className="space-y-2">
              <legend className="sr-only">Cuándo enviar</legend>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" className="h-4 w-4 accent-[#0F1E3C]" checked={schedule} onChange={(e) => setSchedule(e.target.checked)} />
                <span className="flex items-center gap-1.5"><CalendarClock className="h-3.5 w-3.5" /> Programar el envío para más tarde</span>
              </label>
              {schedule && (
                <div className="ml-6 space-y-1">
                  <label htmlFor="quotation-schedule" className="text-xs text-muted-foreground">Fecha y hora de envío</label>
                  <Input id="quotation-schedule" type="datetime-local" value={scheduledAt} min={bounds.min} max={bounds.max} onChange={(e) => setScheduledAt(e.target.value)} className="h-9 max-w-xs" />
                  {scheduledAt && !scheduleValid && <p role="alert" className="text-xs text-destructive">Elige una hora futura (entre 5 minutos y {MAX_SCHEDULE_DAYS} días desde ahora).</p>}
                  <p className="text-xs text-muted-foreground">La cotización seguirá en Borrador hasta que salga el correo. Puedes cancelarlo antes.</p>
                </div>
              )}
            </fieldset>

            {sendError && (
              <div role="alert" className="flex items-start gap-2 rounded-xl border border-red-100 bg-red-50 p-3 text-sm text-red-700">
                <XCircle className="mt-0.5 h-4 w-4 shrink-0" /> <span>{sendError}</span>
              </div>
            )}
          </div>
        )}

        <DialogFooter className="gap-2 sm:gap-0">
          <Button type="button" variant="outline" onClick={() => handleOpenChange(false)} disabled={send.isPending}>Cancelar</Button>
          <Button type="button" onClick={() => { setSendError(null); send.mutate(); }} disabled={!canSend} className="gap-2">
            {schedule ? <CalendarClock className="h-4 w-4" /> : <Send className="h-4 w-4" />}
            {send.isPending ? (schedule ? "Programando…" : "Enviando…") : actionLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
