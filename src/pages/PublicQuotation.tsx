import React, { useState } from "react";
import { useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Helmet } from "react-helmet-async";
import { CheckCircle2, Clock, Download, Loader2, Mail, MapPin, MessageCircle, Phone, ShieldCheck, XCircle, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ApiError, getErrorMessage } from "@/lib/api";
import { PublicQuotation, formatDateOnly, type PublicQuotationData } from "@/lib/quotationOnline";
import { buildWhatsAppUrl } from "@/lib/whatsapp";

const money = (amount: number | undefined, currency: string | undefined) =>
  new Intl.NumberFormat(currency === "CLP" ? "es-CL" : "en-US", { style: "currency", currency: currency || "CLP", minimumFractionDigits: 0 }).format(amount || 0);

type Action = "accept" | "question" | "renew" | null;

/**
 * Página pública de una cotización (`/c/<código>`): la ve el cliente final, sin cuenta ni contraseña.
 * Abrirla queda registrado para que el agente sepa que la vio; aceptar NO cambia el estado de la cotización,
 * solo avisa al agente, que la confirma.
 */
export default function PublicQuotationPage() {
  const { code = "" } = useParams();
  const queryClient = useQueryClient();
  const [action, setAction] = useState<Action>(null);
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<{ title: string; text: string } | null>(null);
  const [downloading, setDownloading] = useState(false);

  const query = useQuery({
    queryKey: ["public-quotation", code],
    queryFn: () => PublicQuotation.get(code),
    retry: false, // un 404 es definitivo; cada intento extra además contaría como una apertura
    staleTime: Infinity,
    refetchOnWindowFocus: false,
  });
  const data = query.data;

  const close = () => { setAction(null); setError(null); };
  const refresh = () => queryClient.invalidateQueries({ queryKey: ["public-quotation", code] });

  const submit = useMutation({
    mutationFn: async () => {
      if (action === "accept") return PublicQuotation.accept(code, name.trim());
      if (action === "question") return PublicQuotation.question(code, message.trim(), name.trim());
      return PublicQuotation.renew(code, message.trim(), name.trim());
    },
    onSuccess: () => {
      const agent = data?.agentName ?? "tu agente";
      if (action === "accept") setDone({ title: "¡Recibimos tu solicitud!", text: `${agent} confirmará la aceptación y te indicará cómo continuar. Todavía no se ha hecho ningún cobro.` });
      else if (action === "question") setDone({ title: "Consulta enviada", text: `${agent} recibió tu mensaje y te responderá a la brevedad.` });
      else setDone({ title: "Solicitud enviada", text: `${agent} preparará una cotización actualizada y se pondrá en contacto contigo.` });
      setName(""); setMessage(""); close();
      void refresh();
    },
    onError: (e) => setError(getErrorMessage(e, "No se pudo enviar. Inténtalo de nuevo.")),
  });

  const download = async () => {
    setDownloading(true);
    try {
      const blob = await PublicQuotation.pdf(code);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${data?.quotationNumber ?? "cotizacion"}.pdf`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (e) {
      setDone({ title: "No se pudo descargar el PDF", text: getErrorMessage(e, "Inténtalo de nuevo en unos minutos.") });
    } finally {
      setDownloading(false);
    }
  };

  if (query.isPending) {
    return (
      <Shell>
        <div role="status" className="flex flex-col items-center gap-3 py-24 text-muted-foreground">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm">Cargando tu cotización…</p>
        </div>
      </Shell>
    );
  }

  if (query.isError || !data) {
    const notFound = query.error instanceof ApiError && query.error.status === 404;
    return (
      <Shell>
        <Notice
          icon={<XCircle className="h-10 w-10 text-slate-400" />}
          title={notFound ? "Este enlace no está disponible" : "No pudimos cargar la cotización"}
          text={notFound ? "Puede que haya vencido o que tu agente lo haya reemplazado. Pídele que te envíe uno nuevo." : "Revisa tu conexión e inténtalo de nuevo."}
        >
          {!notFound && <Button onClick={() => query.refetch()} className="mt-4">Reintentar</Button>}
        </Notice>
      </Shell>
    );
  }

  const { agency } = data;
  const whatsapp = buildWhatsAppUrl(agency.phone, `Hola, te escribo por la cotización ${data.quotationNumber}.`);
  const contactBar = (
    <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-sm text-muted-foreground">
      {agency.email && <a className="flex items-center gap-1.5 hover:text-navy" href={`mailto:${agency.email}`}><Mail className="h-4 w-4" /> {agency.email}</a>}
      {agency.phone && <a className="flex items-center gap-1.5 hover:text-navy" href={`tel:${agency.phone.replace(/\s/g, "")}`}><Phone className="h-4 w-4" /> {agency.phone}</a>}
      {agency.website && <span className="flex items-center gap-1.5"><Globe className="h-4 w-4" /> {agency.website}</span>}
    </div>
  );

  return (
    <Shell agency={agency} title={`Cotización ${data.quotationNumber} — ${agency.name}`}>
      {done && (
        <div role="status" className="mb-6 flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-900">
          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
          <div>
            <p className="font-bold">{done.title}</p>
            <p className="text-sm">{done.text}</p>
          </div>
        </div>
      )}

      {data.state === "expired" && (
        <Notice
          icon={<Clock className="h-10 w-10 text-amber-500" />}
          title={`La cotización ${data.quotationNumber} venció`}
          text={`Estuvo vigente hasta el ${formatDateOnly(data.validUntil)}. Los precios pueden haber cambiado: ${data.agentName ?? "tu agente"} puede prepararte una versión actualizada.`}
        >
          <div className="mt-5 flex flex-wrap justify-center gap-3">
            <Button onClick={() => setAction("renew")}>Pedir una cotización actualizada</Button>
            {whatsapp && <Button variant="outline" asChild><a href={whatsapp} target="_blank" rel="noreferrer noopener"><MessageCircle className="mr-2 h-4 w-4" /> WhatsApp</a></Button>}
          </div>
          <div className="mt-6">{contactBar}</div>
        </Notice>
      )}

      {data.state === "closed" && (
        <Notice
          icon={<XCircle className="h-10 w-10 text-slate-400" />}
          title="Esta cotización ya no está disponible"
          text={`Si quieres retomarla o ver otras opciones, escríbele a ${data.agentName ?? "tu agente"}.`}
        >
          <div className="mt-6">{contactBar}</div>
        </Notice>
      )}

      {(data.state === "open" || data.state === "accepted") && (
        <article className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <header className="border-b border-slate-100 bg-slate-50/60 p-6 sm:p-8">
            <p className="text-sm text-muted-foreground">Hola {data.clientFirstName},</p>
            <h1 className="mt-1 font-playfair text-2xl font-bold text-navy sm:text-3xl">
              {data.agentName ? `${data.agentName} te preparó esta cotización` : "Tu cotización"}
            </h1>
            <dl className="mt-5 grid grid-cols-1 gap-4 text-sm sm:grid-cols-3">
              <div><dt className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Cotización</dt><dd className="mt-1 font-mono font-bold text-navy">{data.quotationNumber}</dd></div>
              {data.destination && <div><dt className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Destino</dt><dd className="mt-1 flex items-center gap-1.5 font-bold text-navy"><MapPin className="h-4 w-4 text-gold" /> {data.destination}</dd></div>}
              <div><dt className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Válida hasta</dt><dd className="mt-1 font-bold text-navy">{formatDateOnly(data.validUntil)}</dd></div>
            </dl>
          </header>

          {data.state === "accepted" && (
            <div role="status" className="flex items-center gap-2 border-b border-emerald-100 bg-emerald-50 px-6 py-3 text-sm font-medium text-emerald-800 sm:px-8">
              <CheckCircle2 className="h-4 w-4" /> Esta cotización fue aceptada. Gracias por confiar en nosotros.
            </div>
          )}
          {data.state === "open" && data.acceptanceRequested && (
            <div role="status" className="flex items-center gap-2 border-b border-emerald-100 bg-emerald-50 px-6 py-3 text-sm font-medium text-emerald-800 sm:px-8">
              <CheckCircle2 className="h-4 w-4" /> Recibimos tu solicitud de aceptar. {data.agentName ?? "Tu agente"} la confirmará y te contactará.
            </div>
          )}

          <div className="space-y-8 p-6 sm:p-8">
            {/* Servicios: tabla en pantallas anchas, tarjetas en el celular */}
            <section aria-labelledby="servicios">
              <h2 id="servicios" className="mb-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Qué incluye</h2>
              <ul className="space-y-3 sm:hidden">
                {data.items?.map((item, i) => (
                  <li key={i} className="rounded-2xl border border-slate-100 p-4">
                    <p className="font-bold text-navy">{item.service}</p>
                    {item.description && <p className="mt-0.5 text-xs text-muted-foreground">{item.description}</p>}
                    <p className="mt-2 flex justify-between text-sm"><span className="text-muted-foreground">{item.quantity} × {money(item.unitPrice, data.currency)}</span><strong className="text-navy">{money(item.total, data.currency)}</strong></p>
                  </li>
                ))}
              </ul>
              <div className="hidden overflow-hidden rounded-2xl border border-slate-100 sm:block">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50/60 text-[10px] uppercase text-navy/60">
                    <tr><th className="px-5 py-3 text-left">Servicio</th><th className="px-3 py-3 text-center">Cant.</th><th className="px-3 py-3 text-right">P. unitario</th><th className="px-5 py-3 text-right">Total</th></tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {data.items?.map((item, i) => (
                      <tr key={i}>
                        <td className="px-5 py-4"><p className="font-bold text-navy">{item.service}</p>{item.description && <p className="mt-0.5 text-xs text-muted-foreground">{item.description}</p>}</td>
                        <td className="px-3 py-4 text-center">{item.quantity}</td>
                        <td className="px-3 py-4 text-right text-navy/70">{money(item.unitPrice, data.currency)}</td>
                        <td className="px-5 py-4 text-right font-bold text-navy">{money(item.total, data.currency)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            <section className="ml-auto w-full space-y-2 rounded-2xl border border-navy/5 bg-navy/[0.02] p-5 sm:max-w-sm" aria-label="Totales">
              <Row label="Subtotal" value={money(data.subtotal, data.currency)} />
              {!!data.discount && data.discount > 0 && <Row label="Descuento" value={`- ${money(data.discount, data.currency)}`} className="text-rose-600" />}
              <Row label={`IVA (${data.taxPercentage ?? 0}%)`} value={money(data.taxAmount, data.currency)} />
              <div className="flex items-baseline justify-between border-t border-navy/10 pt-3">
                <span className="text-xs font-bold uppercase tracking-widest text-navy">Total</span>
                <span className="font-playfair text-2xl font-bold text-navy">{money(data.total, data.currency)}</span>
              </div>
              <p className="text-right text-[10px] italic text-muted-foreground">Expresado en {data.currency}</p>
            </section>

            {(data.notes || data.termsAndConditions) && (
              <section className="grid gap-5 text-xs leading-relaxed text-slate-600 sm:grid-cols-2">
                {data.notes && <div><h2 className="mb-1.5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Observaciones</h2><p className="whitespace-pre-line rounded-xl bg-slate-50 p-4">{data.notes}</p></div>}
                {data.termsAndConditions && <div><h2 className="mb-1.5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Términos y condiciones</h2><p className="whitespace-pre-line rounded-xl bg-slate-50 p-4">{data.termsAndConditions}</p></div>}
              </section>
            )}
          </div>

          <footer className="flex flex-col gap-3 border-t border-slate-100 bg-slate-50/60 p-6 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:p-8">
            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              {data.state === "open" && data.canAccept && (
                <Button size="lg" onClick={() => setAction("accept")} className="gap-2 bg-emerald-600 hover:bg-emerald-700">
                  <CheckCircle2 className="h-5 w-5" /> Quiero aceptar esta cotización
                </Button>
              )}
              <Button size="lg" variant="outline" onClick={() => setAction("question")} className="gap-2">
                <MessageCircle className="h-5 w-5" /> Tengo una consulta
              </Button>
            </div>
            <Button size="lg" variant="ghost" onClick={download} disabled={downloading} className="gap-2 text-navy">
              {downloading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Download className="h-5 w-5" />} Descargar PDF
            </Button>
          </footer>
        </article>
      )}

      <div className="mt-8 space-y-3 text-center">
        {data.state === "open" || data.state === "accepted" ? contactBar : null}
        <p className="mx-auto flex max-w-xl items-start justify-center gap-1.5 text-xs text-muted-foreground">
          <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <span>
            Registramos la fecha en que abres este enlace para que tu agente pueda atenderte mejor. No guardamos tu dirección IP.{" "}
            <a className="underline hover:text-navy" href="/legal/politica-de-privacidad">Política de privacidad</a>
          </span>
        </p>
      </div>

      <Dialog open={action !== null} onOpenChange={(o) => { if (!o && !submit.isPending) close(); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-playfair text-navy">
              {action === "accept" ? "¿Quieres aceptar esta cotización?" : action === "question" ? "Escríbele a tu agente" : "Pedir una cotización actualizada"}
            </DialogTitle>
            <DialogDescription>
              {action === "accept"
                ? `Avisaremos a ${data.agentName ?? "tu agente"}, que confirmará la aceptación y te indicará cómo continuar. Todavía no se hace ningún cobro.`
                : action === "question"
                  ? `${data.agentName ?? "Tu agente"} recibirá tu mensaje y te responderá a la brevedad.`
                  : "Cuéntanos si cambió algo (fechas, número de personas) y te prepararemos una versión al día."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <label htmlFor="pq-name" className="text-xs font-bold uppercase tracking-wider text-navy">Tu nombre (opcional)</label>
              <Input id="pq-name" value={name} onChange={(e) => setName(e.target.value)} maxLength={100} autoComplete="name" />
            </div>
            {action !== "accept" && (
              <div className="space-y-1.5">
                <label htmlFor="pq-message" className="text-xs font-bold uppercase tracking-wider text-navy">{action === "question" ? "Tu consulta" : "Mensaje (opcional)"}</label>
                <Textarea id="pq-message" value={message} onChange={(e) => setMessage(e.target.value)} rows={5} maxLength={1000} />
              </div>
            )}
            {error && <p role="alert" className="rounded-xl border border-red-100 bg-red-50 p-3 text-sm text-red-700">{error}</p>}
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={close} disabled={submit.isPending}>Cancelar</Button>
            <Button
              onClick={() => { setError(null); submit.mutate(); }}
              disabled={submit.isPending || (action === "question" && message.trim() === "")}
            >
              {submit.isPending ? "Enviando…" : action === "accept" ? "Sí, quiero aceptar" : "Enviar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Shell>
  );
}

function Row({ label, value, className = "" }: { label: string; value: string; className?: string }) {
  return <div className={`flex justify-between text-sm text-muted-foreground ${className}`}><span>{label}</span><span className="font-semibold text-navy">{value}</span></div>;
}

function Notice({ icon, title, text, children }: { icon: React.ReactNode; title: string; text: string; children?: React.ReactNode }) {
  return (
    <div className="mx-auto flex max-w-xl flex-col items-center rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm sm:p-12">
      {icon}
      <h1 className="mt-4 font-playfair text-2xl font-bold text-navy">{title}</h1>
      <p className="mt-2 text-sm text-muted-foreground">{text}</p>
      {children}
    </div>
  );
}

/** Marco de la página pública: sin menú ni sesión; con el nombre/logo de la agencia y sin indexar en buscadores. */
function Shell({ children, agency, title }: { children: React.ReactNode; agency?: PublicQuotationData["agency"]; title?: string }) {
  return (
    <div className="min-h-screen bg-slate-50">
      <Helmet>
        <title>{title ?? "Cotización"}</title>
        <meta name="robots" content="noindex, nofollow" />
        <meta name="referrer" content="no-referrer" />
      </Helmet>
      <header className="bg-navy text-white">
        <div className="mx-auto flex max-w-3xl items-center gap-3 px-4 py-4 sm:px-6">
          {agency?.logoUrl && <img src={agency.logoUrl} alt="" className="h-9 w-9 rounded-lg bg-white object-contain p-0.5" />}
          <span className="font-playfair text-lg font-bold">{agency?.name ?? "ADE Travel"}</span>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-10">{children}</main>
    </div>
  );
}
