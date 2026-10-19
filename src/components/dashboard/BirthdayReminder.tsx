import React, { useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { keepPreviousData, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle,
  SheetDescription,
  SheetFooter
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { 
  Cake, 
  Send, 
  Eye, 
  CheckCircle2, 
  PartyPopper,
  Calendar,
  Loader2,
  Mail,
  RotateCcw
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export function BirthdayReminder() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Estados de la UI
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<any>(null);
  const [sendingStatus, setSendingStatus] = useState<string | 'all' | null>(null);
  // Saludo editado para el cliente de la vista previa (null = el de la plantilla). Se envía solo si se cambió.
  const [editedMessage, setEditedMessage] = useState<string | null>(null);
  const [debouncedMessage, setDebouncedMessage] = useState<string | null>(null);

  React.useEffect(() => {
    const t = setTimeout(() => setDebouncedMessage(editedMessage), 400);
    return () => clearTimeout(t);
  }, [editedMessage]);

  // Vista previa del correo tal como saldrá: la arma el servidor con la plantilla activa (Configuración > Plantillas).
  const { data: preview, isFetching: previewLoading, isError: previewError } = useQuery({
    queryKey: ["birthday-preview", selectedClient?.id, debouncedMessage],
    queryFn: async () =>
      ((await api.post('/clients/birthday/preview', { clientId: selectedClient.id, ...(debouncedMessage ? { message: debouncedMessage } : {}) })) as { data: { subject: string; html: string; message: string } }).data,
    enabled: isPreviewOpen && !!selectedClient,
    placeholderData: keepPreviousData,
    staleTime: 0,
  });

  // 1. Obtener clientes desde la API
  const { data: clientsData, isLoading } = useQuery({
    queryKey: ["clients"],
    queryFn: () => api.get('/clients?isActive=true&limit=100'), // Traemos clientes activos
  });

  // 2. Procesar fechas de forma segura (sin errores de Zona Horaria)
  const { pendingBirthdays, sentBirthdays } = useMemo(() => {
    const clients = (clientsData as any)?.data || clientsData || [];
    const today = new Date();
    const currentMonth = today.getMonth() + 1; 
    const currentDay = today.getDate();
    const currentYear = today.getFullYear();

    const pending: any[] = [];
    const sent: any[] = [];

    clients.forEach((client: any) => {
      if (!client.birthDate || !client.email) return;
      
      const dateParts = client.birthDate.split('-');
      if (dateParts.length !== 3) return;

      const birthMonth = parseInt(dateParts[1], 10);
      const birthDay = parseInt(dateParts[2], 10);

      const isBirthdayToday = (birthMonth === currentMonth) && (birthDay === currentDay);
      
      if (isBirthdayToday) {
        const alreadySent = client.lastBirthdayEmailYear === currentYear;
        if (alreadySent) {
          sent.push(client);
        } else {
          pending.push(client);
        }
      }
    });

    return { pendingBirthdays: pending, sentBirthdays: sent };
  }, [clientsData]);

  // 3. Manejador de envío a través de nuestro Backend Enterprise
  const handleSendEmails = async (clientIds: string[], type: string | 'all', messages?: Record<string, string>) => {
    try {
      setSendingStatus(type);
      const res = (await api.post('/clients/birthday', { clientIds, ...(messages ? { messages } : {}) })) as { sent?: number; skipped?: number; failed?: number };
      const sent = res?.sent ?? clientIds.length;
      const failed = res?.failed ?? 0;
      const skipped = res?.skipped ?? 0;

      if (sent === 0) {
        toast({
          variant: "destructive",
          title: failed > 0 ? "El correo no salió" : "No se envió ningún correo",
          description: failed > 0
            ? "No se pudo enviar el saludo (revisa la configuración de correo). Puedes intentarlo de nuevo."
            : "Ya estaba felicitado este año o el cliente no tiene correo.",
        });
      } else {
        toast({
          title: type === 'all' ? "Envío masivo completado" : "¡Correo enviado!",
          description: sent === 1 && failed === 0 && skipped === 0
            ? "Se ha enviado el saludo de cumpleaños con éxito."
            : `Se enviaron ${sent} saludo${sent !== 1 ? 's' : ''}${failed ? `; ${failed} no salió${failed !== 1 ? 'eron' : ''}` : ''}${skipped ? `; ${skipped} se omitió${skipped !== 1 ? ' (ya felicitados o sin correo)' : ' (ya felicitado o sin correo)'}` : ''}.`,
          className: failed ? undefined : "bg-emerald-50 border-emerald-200 text-emerald-800",
        });
      }

      // Refrescar los clientes para que se muevan a la lista de "Enviados"
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      if (sent > 0) setIsPreviewOpen(false);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error al enviar",
        description: "No se pudieron enviar las felicitaciones. Inténtalo de nuevo.",
      });
    } finally {
      setSendingStatus(null);
    }
  };

  const handlePreview = (client: any) => {
    setSelectedClient(client);
    setEditedMessage(null);
    setDebouncedMessage(null);
    setIsPreviewOpen(true);
  };

  if (isLoading) {
    return (
      <Card className="border-dashed bg-slate-50/50 shadow-none">
        <CardContent className="p-6 flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  const hasPending = pendingBirthdays.length > 0;
  const hasSent = sentBirthdays.length > 0;
  const allSent = hasSent && !hasPending;

  return (
    <>
      <AnimatePresence mode="wait">
        <motion.div
          key={hasPending ? "pending" : allSent ? "sent" : "empty"}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.3 }}
        >
          <Card className={cn(
            "overflow-hidden border-2 shadow-sm transition-colors duration-500",
            hasPending ? "border-amber-200 bg-amber-50/30" : 
            allSent ? "border-emerald-100 bg-emerald-50/30" : 
            "border-slate-100 bg-white"
          )}>
            <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-sm font-bold uppercase tracking-widest flex items-center gap-2">
                <Cake className={cn("w-4 h-4", hasPending ? "text-amber-500" : allSent ? "text-emerald-500" : "text-muted-foreground")} />
                Cumpleaños de Hoy
              </CardTitle>
              {hasPending && (
                <Badge variant="secondary" className="bg-amber-100 text-amber-700 hover:bg-amber-100 font-bold">
                  {pendingBirthdays.length} pendiente{pendingBirthdays.length !== 1 ? 's' : ''}
                </Badge>
              )}
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {hasPending ? (
                  <>
                    <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                      {pendingBirthdays.map((client) => (
                        <div 
                          key={client.id} 
                          className="p-3 bg-white border border-amber-100/60 rounded-xl flex items-center justify-between shadow-sm"
                        >
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-navy truncate">
                              {client.firstName} {client.lastName}
                            </p>
                            <p className="text-[10px] text-muted-foreground truncate flex items-center gap-1">
                              <Mail className="w-3 h-3" />
                              {client.email}
                            </p>
                          </div>
                          <div className="flex gap-1 shrink-0">
                            <Button 
                              variant="ghost" 
                              size="icon" aria-label="Vista previa del saludo" 
                              className="h-8 w-8 text-amber-600 hover:text-amber-700 hover:bg-amber-50"
                              onClick={() => handlePreview(client)}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon" aria-label="Enviar saludo de cumpleaños" 
                              className="h-8 w-8 text-amber-600 hover:text-amber-700 hover:bg-amber-50"
                              disabled={sendingStatus !== null}
                              onClick={() => handleSendEmails([client.id], client.id)}
                            >
                              {sendingStatus === client.id ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <Send className="w-4 h-4" />
                              )}
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    {pendingBirthdays.length > 1 && (
                      <Button 
                        className="w-full bg-amber-500 hover:bg-amber-600 text-white font-bold text-[10px] uppercase tracking-wider py-5 mt-2"
                        disabled={sendingStatus !== null}
                        onClick={() => handleSendEmails(pendingBirthdays.map(c => c.id), 'all')}
                      >
                        {sendingStatus === 'all' ? (
                          <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        ) : (
                          <PartyPopper className="w-4 h-4 mr-2" />
                        )}
                        Felicitar a todos ({pendingBirthdays.length})
                      </Button>
                    )}
                  </>
                ) : allSent ? (
                  <div className="py-4 text-center space-y-2">
                    <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-2">
                      <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                    </div>
                    <p className="text-xs font-bold text-navy">¡Todo listo!</p>
                    <p className="text-[10px] text-muted-foreground px-4">
                      Todos los cumpleañeros de hoy ya han sido felicitados.
                    </p>
                  </div>
                ) : (
                  <div className="py-4 text-center space-y-2">
                    <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-2">
                      <Calendar className="w-6 h-6 text-slate-400" />
                    </div>
                    <p className="text-xs font-bold text-muted-foreground italic">Sin cumpleaños hoy</p>
                    <p className="text-[10px] text-muted-foreground px-4">
                      No hay clientes registrados que cumplan años el día de hoy.
                    </p>
                  </div>
                )}

                {/* Resumen de los que ya se enviaron hoy */}
                {hasSent && hasPending && (
                  <div className="pt-3 border-t border-amber-100/50 mt-3">
                    <p className="text-[10px] font-medium text-emerald-600 flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      {sentBirthdays.length} saludo{sentBirthdays.length !== 1 ? 's' : ''} enviado{sentBirthdays.length !== 1 ? 's' : ''} hoy
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </AnimatePresence>

      {/* MODAL DE VISTA PREVIA */}
      <Sheet open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <SheetContent side="right" className="sm:max-w-xl overflow-y-auto bg-slate-50">
          <SheetHeader className="mb-6">
            <SheetTitle className="flex items-center gap-2 font-playfair text-2xl text-navy">
              <Eye className="w-5 h-5 text-amber-500" />
              Vista Previa
            </SheetTitle>
            <SheetDescription>
              Así recibirá {selectedClient?.firstName} su felicitación. Puedes personalizar el mensaje antes de enviar.
            </SheetDescription>
          </SheetHeader>

          {selectedClient && (
            <div className="space-y-6">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label htmlFor="birthday-message" className="text-xs font-bold text-slate-600">Mensaje para {selectedClient.firstName}</label>
                  {editedMessage !== null && (
                    <Button type="button" variant="ghost" size="sm" className="h-7 gap-1 text-xs" onClick={() => setEditedMessage(null)}>
                      <RotateCcw className="w-3 h-3" /> Restablecer
                    </Button>
                  )}
                </div>
                <Textarea
                  id="birthday-message"
                  rows={4}
                  maxLength={2000}
                  value={editedMessage ?? preview?.message ?? ""}
                  onChange={(e) => setEditedMessage(e.target.value)}
                  placeholder="Escribe un saludo personal para este cliente"
                />
                <p className="text-[11px] text-muted-foreground">Es el texto central del correo. Si no lo cambias, se usa el de la plantilla.</p>
              </div>

              <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm bg-white">
                <div className="bg-slate-100/50 border-b border-slate-200 p-4 text-xs space-y-2">
                  <div className="flex gap-2">
                    <span className="font-bold text-slate-500 w-16">Para:</span>
                    <span className="text-navy">{selectedClient.email}</span>
                  </div>
                  <div className="flex gap-2">
                    <span className="font-bold text-slate-500 w-16">Asunto:</span>
                    <span className="font-bold text-navy">{preview?.subject ?? ""}</span>
                  </div>
                </div>

                {previewError && !preview ? (
                  <p role="alert" className="p-6 text-sm text-red-700">No se pudo cargar la vista previa.</p>
                ) : (
                  // iframe aislado: la plantilla es HTML de Configuración y no debe tocar la aplicación.
                  <iframe
                    title="Vista previa del correo"
                    sandbox=""
                    srcDoc={preview?.html ?? ""}
                    className={cn("w-full h-[420px] bg-white transition-opacity", previewLoading && "opacity-60")}
                  />
                )}
              </div>
            </div>
          )}

          <SheetFooter className="mt-8 flex-row justify-end gap-3">
            <Button variant="outline" onClick={() => setIsPreviewOpen(false)}>
              Cerrar
            </Button>
            <Button 
              className="bg-amber-500 hover:bg-amber-600 text-white font-bold shadow-md"
              disabled={sendingStatus !== null}
              onClick={() => handleSendEmails([selectedClient.id], selectedClient.id, editedMessage?.trim() ? { [selectedClient.id]: editedMessage.trim() } : undefined)}
            >
              {sendingStatus === selectedClient?.id ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Send className="w-4 h-4 mr-2" />
              )}
              Enviar Ahora
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </>
  );
}