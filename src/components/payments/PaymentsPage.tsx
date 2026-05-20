import React, { useState, useMemo } from "react";
import { 
  Plus, 
  Search, 
  DollarSign, 
  Clock, 
  CheckCircle, 
  XCircle,
  Filter,
  ArrowRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Tabs,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
} from "@/components/ui/card";
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
import { sendEmail } from "@/integrations/core";
import { buildPaymentEmail } from "@/lib/emailTemplates";
import { renderTemplate } from "@/lib/templateVariables";
import { format } from "date-fns";
import { es } from "date-fns/locale";

export default function PaymentsPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusTab, setStatusTab] = useState("all");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<any>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data: paymentsResponseData = [] } = useQuery({
    queryKey: ["payments"],
    queryFn: () => api.get('/payments?sortBy=-created_at'),
  });

  const { data: requestsResponseData = [] } = useQuery({
    queryKey: ["requests"],
    queryFn: () => api.get('/requests'),
  });

  const { data: clientsResponseData = [] } = useQuery({
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

  const isLoading = isLoadingPayments || isLoadingRequests || isLoadingClients;

  const isLoading = isLoadingPayments || isLoadingRequests || isLoadingClients;

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
      api.patch(`/payments/${id}`, { status }),
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
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-playfair font-bold text-navy dark:text-white">Pagos</h1>
          <p className="text-muted-foreground mt-1 text-lg">
            Gestión y seguimiento de recaudaciones por servicios de viaje.
          </p>
        </div>
        <Button 
          onClick={openCreate}
          className="bg-primary hover:bg-primary/90 text-navy font-bold gap-2 px-6 h-12 rounded-xl shadow-lg shadow-primary/20"
        >
          <Plus className="w-5 h-5" />
          Registrar Pago
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-none shadow-md bg-gradient-to-br from-emerald-500 to-emerald-600 text-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold uppercase tracking-wider opacity-80 flex items-center gap-2">
              <DollarSign className="w-4 h-4" /> Recaudado (Total)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col">
              <span className="text-2xl font-bold">{formatCurrency(stats.totalRecaudadoCLP, "CLP")}</span>
              <span className="text-sm font-medium opacity-90">{formatCurrency(stats.totalRecaudadoUSD, "USD")}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-md bg-white dark:bg-navy-dark">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-500" /> Pendientes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className="text-3xl font-bold">{stats.pendientes}</span>
              <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
                <ArrowRight className="w-5 h-5 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-md bg-white dark:bg-navy-dark">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-500" /> Completados
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className="text-3xl font-bold">{stats.completados}</span>
              <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-emerald-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-md bg-white dark:bg-navy-dark">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <XCircle className="w-4 h-4 text-rose-500" /> Cancelados
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className="text-3xl font-bold">{stats.cancelados}</span>
              <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center">
                <XCircle className="w-5 h-5 text-rose-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Card */}
      <Card className="border-none shadow-xl overflow-hidden bg-white/70 dark:bg-navy-dark/40 backdrop-blur-sm">
        <CardHeader className="border-b bg-muted/30 pb-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <Tabs defaultValue="all" className="w-full md:w-auto" onValueChange={setStatusTab}>
              <TabsList className="bg-muted/50 p-1 rounded-xl">
                <TabsTrigger value="all" className="rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-navy data-[state=active]:shadow-sm">Todos</TabsTrigger>
                <TabsTrigger value="PENDIENTE" className="rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-navy data-[state=active]:shadow-sm">Pendientes</TabsTrigger>
                <TabsTrigger value="COMPLETADO" className="rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-navy data-[state=active]:shadow-sm">Completados</TabsTrigger>
                <TabsTrigger value="CANCELADO" className="rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-navy data-[state=active]:shadow-sm">Cancelados</TabsTrigger>
              </TabsList>
            </Tabs>

            <div className="flex items-center gap-2">
              <div className="relative w-full md:w-[300px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input 
                  placeholder="Buscar por N°, ref o cliente..." 
                  className="pl-10 h-10 rounded-xl border-muted-foreground/10 focus:ring-primary/20"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Button variant="outline" size="icon" className="h-10 w-10 rounded-xl">
                <Filter className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <PaymentsTable 
            payments={filteredPayments}
            requests={requests}
            clients={clients}
            isLoading={isLoading}
            onEdit={openEdit}
            onDelete={setDeleteId}
            onStatusChange={handleStatusChange}
          />
        </CardContent>
      </Card>

      {/* Dialogs */}
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
