import React, { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Gift, Send, CheckCircle2, MailOpen } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";

export function BirthdayReminder() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isSending, setIsSending] = useState(false);

  // Cargamos los clientes (idealmente tu endpoint soporta paginación o trae todos los activos)
  const { data: clientsData, isLoading, isError, error } = useQuery({
    queryKey: ["clients"],
    queryFn: () => api.get('/clients'),
    onError: (err) => {
      console.error("Error loading clients for BirthdayReminder:", err);
    }
  });

  const birthdayClients = useMemo(() => {
    const clients = (clientsData as any)?.data || clientsData || [];
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentDay = today.getDate();
    const currentYear = today.getFullYear();

    return clients.filter((client: any) => {
      if (!client.birthDate || !client.email) return false;
      
      const bDate = new Date(client.birthDate);
      // Validar si es el mismo mes y día
      const isBirthdayToday = bDate.getMonth() === currentMonth && bDate.getDate() === currentDay;
      // Validar que no se le haya enviado este año
      const notSentThisYear = client.lastBirthdayEmailYear !== currentYear;

      return isBirthdayToday && notSentThisYear;
    });
  }, [clientsData]);

  const handleSendEmails = async (clientIds: string[]) => {
    try {
      setIsSending(true);
      await api.post('/clients/birthday', { clientIds });
      
      toast({
        title: "¡Felicitaciones enviadas!",
        description: `Se han enviado ${clientIds.length} correos de cumpleaños.`,
        className: "bg-emerald-50 border-emerald-200 text-emerald-800",
      });
      
      // Refrescar los clientes para que desaparezcan del widget
      queryClient.invalidateQueries({ queryKey: ["clients"] });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudieron enviar las felicitaciones.",
      });
    } finally {
      setIsSending(false);
    }
  };

  if (isLoading) return null;

  if (isError) {
    return (
      <Card className="border-slate-100 bg-rose-50/40">
        <CardContent className="p-4 flex items-center gap-3 text-rose-700">
          <Send className="w-5 h-5 text-rose-700/80" />
          <p className="text-xs font-medium">No se pudieron cargar los clientes. Verifica permisos o conexión al servidor.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <AnimatePresence>
      {birthdayClients.length > 0 ? (
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
          <Card className="border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <Gift className="w-24 h-24 text-amber-500" />
            </div>
            <CardContent className="p-6 relative z-10">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-600">
                  <Gift className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-playfair font-bold text-amber-900">Cumpleaños de Hoy</h3>
                  <p className="text-xs text-amber-700/70 font-medium">{birthdayClients.length} cliente(s) esperando felicitación</p>
                </div>
              </div>

              <div className="space-y-3 mb-4 max-h-[200px] overflow-y-auto pr-2">
                {birthdayClients.map((client: any) => (
                  <div key={client.id} className="flex items-center justify-between bg-white/60 p-3 rounded-lg border border-amber-100/50">
                    <div>
                      <p className="text-sm font-bold text-navy">{client.firstName} {client.lastName}</p>
                      <p className="text-[10px] text-muted-foreground">{client.email}</p>
                    </div>
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      className="text-amber-600 hover:text-amber-700 hover:bg-amber-100 h-8 gap-2"
                      onClick={() => handleSendEmails([client.id])}
                      disabled={isSending}
                    >
                      <Send className="w-3 h-3" /> <span className="text-xs">Enviar</span>
                    </Button>
                  </div>
                ))}
              </div>

              {birthdayClients.length > 1 && (
                <Button 
                  className="w-full bg-amber-500 hover:bg-amber-600 text-white gap-2"
                  onClick={() => handleSendEmails(birthdayClients.map((c: any) => c.id))}
                  disabled={isSending}
                >
                  <MailOpen className="w-4 h-4" />
                  Felicitar a todos ({birthdayClients.length})
                </Button>
              )}
            </CardContent>
          </Card>
        </motion.div>
      ) : (
        <Card className="border-slate-100 bg-slate-50/50 shadow-none">
          <CardContent className="p-4 flex items-center gap-3 text-muted-foreground">
            <CheckCircle2 className="w-5 h-5 text-emerald-500/50" />
            <p className="text-xs font-medium">No hay cumpleaños pendientes por felicitar hoy.</p>
          </CardContent>
        </Card>
      )}
    </AnimatePresence>
  );
}