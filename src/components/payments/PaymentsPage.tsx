import React, { useState, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Plus,
  Search,
  DollarSign,
  Clock,
  CheckCircle,
  XCircle,
  Filter
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Tabs,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { api } from "@/lib/api";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { PaymentsTable } from "./PaymentsTable";
import { PaymentFormDialog } from "./PaymentFormDialog";
import { ExportMenu } from "@/components/shared/ExportMenu";
import { sendEmail } from "@/integrations/core";
import { buildPaymentEmail } from "@/lib/emailTemplates";
import { renderTemplate } from "@/lib/templateVariables";
import { format } from "date-fns";
import { es } from "date-fns/locale";

export default function PaymentsPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  // Deep-link desde el buscador global: /pagos?search=<paymentNumber>.
  const [searchTerm, setSearchTerm] = useState(() => searchParams.get("search") || "");
  const [statusTab, setStatusTab] = useState("all");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<any>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data: paymentsResponseData = [], isLoading: isPaymentsLoading } = useQuery({
    queryKey: ["payments"],
    queryFn: () => api.get('/payments?sortBy=-created_at'),
  });

  const { data: requestsResponseData = [], isLoading: isRequestsLoading } = useQuery({
    queryKey: ["requests"],
    queryFn: () => api.get('/requests'),
  });

  const { data: clientsResponseData = [], isLoading: isClientsLoading } = useQuery({
    queryKey: ["clients"],
    queryFn: () => api.get('/clients'),
  });

  const { data: paymentTemplatesResponseData = [] } = useQuery({
    queryKey: ['emailTemplates', 'PAYMENT_CONFIRMED'],
    queryFn: () => api.get('/email-templates?type=PAYMENT_CONFIRMED&isActive=true')
  });

  const payments = Array.isArray(paymentsResponseData) ? paymentsResponseData : (paymentsResponseData as any)?.data || [];
  const requests = Array.isArray(requestsResponseData) ? requestsResponseData : (requestsResponseData as any)?.data || [];
  const clients = Array.isArray(clientsResponseData) ? clientsResponseData : (clientsResponseData as any)?.data || [];
  const paymentTemplates = Array.isArray(paymentTemplatesResponseData) ? paymentTemplatesResponseData : (paymentTemplatesResponseData as any)?.data || [];

  const isLoading = isPaymentsLoading || isRequestsLoading || isClientsLoading;

  const filteredPayments = useMemo(() => {
    return payments.filter((payment: any) => {
      const client = clients.find(c => c.id === payment.clientId);
      const matchesSearch = 
        (payment.paymentNumber?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
        (payment.reference?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
        (client?.firstName?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
        (client?.lastName?.toLowerCase() || "").includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusTab === "all" || payment.status === statusTab;
      
      return matchesSearch && matchesStatus;
    });
  }, [payments, searchTerm, statusTab, clients]);

  // Stats calculation
  const stats = useMemo(() => {
    const completed = payments.filter((p: any) => p.status === "COMPLETADO");
    const totalCLP = completed
      .filter((p: any) => p.currency === "CLP")
      .reduce((sum: number, p: any) => sum + (p.amount || 0), 0);
    const totalUSD = completed
      .filter((p: any) => p.currency === "USD")
      .reduce((sum: number, p: any) => sum + (p.amount || 0), 0);
    
    return {
      totalRecaudadoCLP: totalCLP,
      totalRecaudadoUSD: totalUSD,
      pendientes: payments.filter((p: any) => p.status === "PENDIENTE").length,
      completados: completed.length,
      cancelados: payments.filter((p: any) => p.status === "CANCELADO").length,
    };
  }, [payments]);

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await api.delete(`/payments/${deleteId}`);
      toast({ title: "Pago eliminado", description: "El registro de pago ha sido eliminado correctamente." });
      queryClient.invalidateQueries({ queryKey: ["payments"] });
      setDeleteId(null);
    } catch (error) {
      console.error("Error deleting payment:", error);
      toast({ variant: "destructive", title: "Error", description: "No se pudo eliminar el pago." });
    }
  };

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      api.patch(`/payments/${id}/status`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payments"] });
      toast({ title: "Estado actualizado", description: "El estado del pago ha sido actualizado." });
    },
  });

  const handleStatusChange = async (id: string, newStatus: string) => {
    updateStatusMutation.mutate({ id, status: newStatus });
    if (newStatus === 'COMPLETADO') {
      try {
        const payment = payments.find((p: any) => p.id === id);
        const client = clients.find((c: any) => c.id === payment?.clientId);
        const request = requests.find((r: any) => r.id === payment?.requestId);
        
        if (client?.email && payment) {
          const activeTemplate = paymentTemplates[0];
          let subject: string, body_html: string;

          if (activeTemplate) {
            const methodLabels: Record<string, string> = { 
              EFECTIVO: 'Efectivo', 
              TARJETA: 'Tarjeta', 
              TRANSFERENCIA: 'Transferencia Bancaria', 
              CHEQUE: 'Cheque', 
              WEBPAY: 'Webpay' 
            };
            
            const data: Record<string, string> = {
              client_name: `${client.firstName} ${client.lastName}`,
              payment_number: payment.paymentNumber || '',
              amount: new Intl.NumberFormat("es-CL", { style: "currency", currency: payment.currency || "CLP" }).format(payment.amount || 0),
              currency: payment.currency || 'CLP',
              payment_date: payment.paymentDate ? format(new Date(payment.paymentDate), "dd 'de' MMMM, yyyy", { locale: es }) : '',
              payment_method: methodLabels[payment.method] || payment.method || '',
              reference: payment.reference || '',
              agency_name: 'ADE Travel',
              agency_email: 'contacto@adetravel.cl',
            };
            subject = renderTemplate(activeTemplate.subject, data);
            body_html = renderTemplate(activeTemplate.bodyHtml, data);
          } else {
            const result = buildPaymentEmail(payment, client, request);
            subject = result.subject;
            body_html = result.body_html;
          }

          await sendEmail({
            to: client.email,
            subject,
            body_html,
            from_name: 'ADE Travel',
            from_local_part: 'pagos'
          });
          toast({ title: "Confirmación enviada", description: `Email enviado a ${client.email}` });
        }
      } catch (err) {
        console.error('Error sending payment email:', err);
      }
    }
  };

  const openEdit = (payment: any) => {
    setSelectedPayment(payment);
    setIsFormOpen(true);
  };

  const openCreate = () => {
    setSelectedPayment(null);
    setIsFormOpen(true);
  };

  const formatCurrency = (amount: number, currency: string) => {
    if (currency === "CLP") {
      return new Intl.NumberFormat("es-CL", {
        style: "currency",
        currency: "CLP",
        maximumFractionDigits: 0,
      }).format(amount);
    }
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-playfair font-bold text-navy mb-1">Pagos</h1>
          <p className="text-muted-foreground text-sm">
            Gestión y seguimiento de recaudaciones por servicios de viaje.
          </p>
        </div>
        <div className="flex gap-2">
          <ExportMenu
            filename="pagos_adetravel"
            data={filteredPayments.map((p: any) => {
              const client = clients.find((c: any) => c.id === p.clientId);
              return {
                numero: p.paymentNumber,
                cliente: client ? `${client.firstName} ${client.lastName}` : "",
                monto: p.amount,
                moneda: p.currency,
                metodo: p.method,
                estado: p.status,
                fecha: p.paymentDate || p.createdAt,
              };
            })}
            columns={[
              { key: "numero", label: "N° Pago" },
              { key: "cliente", label: "Cliente" },
              { key: "monto", label: "Monto" },
              { key: "moneda", label: "Moneda" },
              { key: "metodo", label: "Método" },
              { key: "estado", label: "Estado" },
              { key: "fecha", label: "Fecha" },
            ]}
          />
          <Button onClick={openCreate} className="gap-2 text-xs font-bold uppercase tracking-wider shadow-lg shadow-primary/20">
            <Plus className="w-4 h-4" /> Registrar Pago
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-gray-100 flex flex-col justify-center shadow-sm">
          <div className="flex items-center gap-2 mb-1">
            <DollarSign className="w-4 h-4 text-emerald-500" />
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Recaudado</p>
          </div>
          <div>
            <p className="text-xl font-playfair font-bold text-navy">{formatCurrency(stats.totalRecaudadoCLP, "CLP")}</p>
            <p className="text-xs text-muted-foreground font-medium">{formatCurrency(stats.totalRecaudadoUSD, "USD")}</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-gray-100 flex items-center gap-3 shadow-sm">
          <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-500">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Pendientes</p>
            <p className="text-xl font-playfair font-bold text-navy">{stats.pendientes}</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-gray-100 flex items-center gap-3 shadow-sm">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-500">
            <CheckCircle className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Completados</p>
            <p className="text-xl font-playfair font-bold text-navy">{stats.completados}</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-gray-100 flex items-center gap-3 shadow-sm">
          <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center text-rose-500">
            <XCircle className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Cancelados</p>
            <p className="text-xl font-playfair font-bold text-navy">{stats.cancelados}</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <Tabs value={statusTab} onValueChange={setStatusTab} className="w-full lg:w-auto overflow-x-auto">
            <TabsList className="bg-muted/50 p-1 h-auto flex-wrap sm:flex-nowrap">
              <TabsTrigger value="all" className="text-[10px] font-bold uppercase tracking-wider px-3 h-8">Todos</TabsTrigger>
              <TabsTrigger value="PENDIENTE" className="text-[10px] font-bold uppercase tracking-wider px-3 h-8">Pendientes</TabsTrigger>
              <TabsTrigger value="COMPLETADO" className="text-[10px] font-bold uppercase tracking-wider px-3 h-8">Completados</TabsTrigger>
              <TabsTrigger value="CANCELADO" className="text-[10px] font-bold uppercase tracking-wider px-3 h-8">Cancelados</TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="flex items-center gap-2 flex-1 md:max-w-sm">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input 
                placeholder="Buscar N°, ref o cliente..." 
                className="pl-10 bg-slate-50 border-slate-100 focus:bg-white transition-all text-sm h-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button variant="outline" size="icon" className="shrink-0 h-10 w-10">
              <Filter className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <PaymentsTable 
          payments={filteredPayments}
          requests={requests}
          clients={clients}
          isLoading={isLoading}
          onEdit={openEdit}
          onDelete={setDeleteId}
          onStatusChange={handleStatusChange}
        />
      </div>

      <PaymentFormDialog 
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        payment={selectedPayment}
      />

      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Está absolutamente seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción eliminará permanentemente el registro de este pago. No se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Eliminar Registro
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}