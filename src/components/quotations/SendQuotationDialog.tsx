import React, { useEffect, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { AlertTriangle, Paperclip, Plus, RotateCcw, Send, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { api, getErrorMessage } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

/** Mismo tope que el API (MAX_QUOTATION_RECIPIENTS). */
export const MAX_RECIPIENTS = 10;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface EmailDraft {
  recipients: { primary: string | null; additional: string[] };
  subject: string;
  message: string;
  attachmentName: string;
  deliveryMode: "live" | "redirect" | "off";
  status: string;
}

interface SendResult {
  sent: true;
  recipients: number;
  statusChanged: boolean;
}

interface SendQuotationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Cotización a enviar (solo se usa el id y el número). */
  quotation: { id: string; quotationNumber: string } | null;
  /** Se llama tras un envío exitoso, para refrescar la lista y el estado. */
  onSent: (result: SendResult & { quotationId: string }) => void;
}

/**
 * Enviar la cotización por correo: la persona ve y edita el asunto y el mensaje, elige a quién (correo principal,
 * adicionales del cliente u otros) y el PDF va adjunto. La cotización solo pasa a "Enviada" si el correo salió.
 */
export function SendQuotationDialog({ open, onOpenChange, quotation, onSent }: SendQuotationDialogProps) {
  const { toast } = useToast();
  const [selected, setSelected] = useState<string[]>([]);
  const [custom, setCustom] = useState<string[]>([]);
  const [customInput, setCustomInput] = useState("");
  const [customError, setCustomError] = useState<string | null>(null);
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [sendError, setSendError] = useState<string | null>(null);

  const draftQuery = useQuery({
    queryKey: ["quotation-email-draft", quotation?.id],
    queryFn: async () => ((await api.get(`/quotations/${quotation!.id}/email-draft`)) as { data: EmailDraft }).data,
    enabled: open && !!quotation,
    gcTime: 0, // siempre fresco: el cliente o la cotización pueden haber cambiado
    staleTime: 0,
  });
  const draft = draftQuery.data;

  // Al llegar el borrador se prellena el formulario (solo con el correo principal marcado: lo más seguro por defecto).
  useEffect(() => {
    if (!draft) return;
    setSelected(draft.recipients.primary ? [draft.recipients.primary] : []);
    setCustom([]);
    setCustomInput("");
    setCustomError(null);
    setSubject(draft.subject);
    setMessage(draft.message);
    setSendError(null);
  }, [draft]);

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

  const send = useMutation({
    mutationFn: async () =>
      ((await api.post(`/quotations/${quotation!.id}/send`, { to: selected, subject: subject.trim(), message: message.trim() })) as { data: SendResult }).data,
    onSuccess: (result) => {
      toast({
        title: "Cotización enviada",
        description: `${result.recipients === 1 ? "Se envió a 1 destinatario" : `Se envió a ${result.recipients} destinatarios`}${result.statusChanged ? "; ahora está en estado Enviada." : "."}`,
      });
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
  const canSend = !!draft && !off && selected.length > 0 && subject.trim() !== "" && message.trim() !== "" && !send.isPending;
  const isResend = draft?.status === "ENVIADA";

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-playfair text-navy">{isResend ? "Reenviar cotización" : "Enviar cotización"}</DialogTitle>
          <DialogDescription>
            Revisa y edita el mensaje antes de enviarlo. El PDF de la cotización {quotation?.quotationNumber} va adjunto.
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
                <span>Modo demostración: el correo no llegará al cliente, se desvía a una casilla de pruebas.</span>
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
                <Button type="button" variant="outline" size="sm" onClick={addCustom} className="gap-1">
                  <Plus className="h-3.5 w-3.5" /> Agregar
                </Button>
              </div>
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
                  onClick={() => { setSubject(draft.subject); setMessage(draft.message); }}
                  className="flex items-center gap-1 text-xs text-muted-foreground hover:text-navy"
                >
                  <RotateCcw className="h-3 w-3" /> Restablecer
                </button>
              </div>
              <Textarea id="quotation-message" value={message} onChange={(e) => setMessage(e.target.value)} rows={9} maxLength={5000} />
            </div>

            <p className="flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2 text-xs text-muted-foreground">
              <Paperclip className="h-3.5 w-3.5" /> Se adjunta <strong>{draft.attachmentName}</strong>
            </p>

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
            <Send className="h-4 w-4" />
            {send.isPending ? "Enviando…" : isResend ? "Reenviar" : "Enviar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
