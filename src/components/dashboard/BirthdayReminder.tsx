import React, { useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { useQuery, useQueryClient } from "@tanstack/react-query";
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
import { 
  Cake, 
  Send, 
  Eye, 
  CheckCircle2, 
  PartyPopper,
  Calendar,
  Loader2,
  Mail
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export function BirthdayReminder() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Estados de la UI
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<any>(null);
  const [sendingStatus, setSendingStatus] = useState<string | 'all' | null>(null);

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
  const handleSendEmails = async (clientIds: string[], type: string | 'all') => {
    try {
      setSendingStatus(type);
      
      // Llamamos a la ruta que armaste en el backend
      await api.post('/clients/birthday', { clientIds });
      
      toast({
        title: type === 'all' ? "Envío masivo completado" : "¡Correo enviado!",
        description: type === 'all' 
          ? `Se enviaron ${clientIds.length} saludos de cumpleaños correctamente.`
          : `Se ha enviado el saludo de cumpleaños con éxito.`,
        className: "bg-emerald-50 border-emerald-200 text-emerald-800",
      });
      
      // Refrescar los clientes para que se muevan a la lista de "Enviados"
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      setIsPreviewOpen(false);
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

  // Plantilla HTML de respaldo para la Vista Previa
  const getPreviewHtml = (client: any) => `
    <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; border: 1px solid #f1f5f9; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
      <div style="background-color: #0f172a; padding: 30px 20px; text-align: center;">
        <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-family: Georgia, serif;">¡Feliz Cumpleaños!</h1>
      </div>
      <div style="padding: 30px 20px; background-color: #ffffff; text-align: center;">
        <p style="font-size: 18px; color: #334155; margin-bottom: 20px;">Estimado/a <strong>${client?.firstName} ${client?.lastName}</strong>,</p>
        <p style="color: #64748b; line-height: 1.6; margin-bottom: 30px;">En nombre de todo el equipo de ADE Travel, queremos desearte un día maravilloso lleno de alegría y rodeado de tus seres queridos. ¡Que este nuevo año de vida venga cargado de nuevos viajes y aventuras inolvidables!</p>
        <div style="display: inline-block; padding: 12px 24px; background-color: #f8fafc; color: #0f172a; border-radius: 8px; font-weight: bold; border: 1px solid #e2e8f0;">
          🎉 ¡Disfruta tu día al máximo!
        </div>
      </div>
      <div style="background-color: #f8fafc; padding: 15px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #f1f5f9;">
        ADE Travel &copy; ${new Date().getFullYear()}
      </div>
    </div>
  `;

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
                              size="icon" 
                              className="h-8 w-8 text-amber-600 hover:text-amber-700 hover:bg-amber-50"
                              onClick={() => handlePreview(client)}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon" 
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
              Así es como {selectedClient?.firstName} recibirá su felicitación.
            </SheetDescription>
          </SheetHeader>

          {selectedClient && (
            <div className="space-y-6">
              <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm bg-white">
                <div className="bg-slate-100/50 border-b border-slate-200 p-4 text-xs space-y-2">
                  <div className="flex gap-2">
                    <span className="font-bold text-slate-500 w-16">De:</span>
                    <span className="text-navy font-medium">ADE Travel &lt;info@adetravel.cl&gt;</span>
                  </div>
                  <div className="flex gap-2">
                    <span className="font-bold text-slate-500 w-16">Para:</span>
                    <span className="text-navy">{selectedClient.email}</span>
                  </div>
                  <div className="flex gap-2">
                    <span className="font-bold text-slate-500 w-16">Asunto:</span>
                    <span className="font-bold text-navy">¡Feliz Cumpleaños, {selectedClient.firstName}! 🎂</span>
                  </div>
                </div>
                
                {/* Renderizado de HTML Seguro */}
                <div 
                  className="bg-white p-6 flex justify-center"
                  dangerouslySetInnerHTML={{ __html: getPreviewHtml(selectedClient) }}
                />
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
              onClick={() => handleSendEmails([selectedClient.id], selectedClient.id)}
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