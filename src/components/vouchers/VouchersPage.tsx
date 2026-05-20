import React, { useState, useMemo } from "react";
import { 
  Plus, 
  Search, 
  Ticket, 
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
import { VouchersTable } from "./VouchersTable";
import { VoucherFormDialog } from "./VoucherFormDialog";
import { VoucherPDFPreview } from "./VoucherPDFPreview";
import { sendEmail } from "@/integrations/core";
import { buildVoucherEmail } from "@/lib/emailTemplates";
import { renderTemplate } from "@/lib/templateVariables";
import { format } from "date-fns";
import { es } from "date-fns/locale";

export default function VouchersPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusTab, setStatusTab] = useState("all");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedVoucher, setSelectedVoucher] = useState<any>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  
  const [pdfVoucher, setPdfVoucher] = useState<any>(null);
  const [pdfOpen, setPdfOpen] = useState(false);

  const { data: vouchersResponseData = [], isLoading: isLoadingVouchers } = useQuery({
    queryKey: ["vouchers"],
    queryFn: () => api.get('/vouchers?sortBy=-created_at'),
  });

  const { data: requestsResponseData = [], isLoading: isLoadingRequests } = useQuery({
    queryKey: ["requests"],
    queryFn: () => api.get('/requests'),
  });

  const { data: clientsResponseData = [], isLoading: isLoadingClients } = useQuery({
    queryKey: ["clients"],
    queryFn: () => api.get('/clients'),
  });

  const { data: providersResponseData = [], isLoading: isLoadingProviders } = useQuery({
    queryKey: ["providers"],
    queryFn: () => api.get('/providers'),
  });

  const { data: voucherTemplatesResponseData = [] } = useQuery({
    queryKey: ['emailTemplates', 'VOUCHER_ISSUED'],
    queryFn: () => api.get('/email-templates?type=VOUCHER_ISSUED&isActive=true')
  });

  const vouchers = Array.isArray(vouchersResponseData) ? vouchersResponseData : (vouchersResponseData as any)?.data || [];
  const requests = Array.isArray(requestsResponseData) ? requestsResponseData : (requestsResponseData as any)?.data || [];
  const clients = Array.isArray(clientsResponseData) ? clientsResponseData : (clientsResponseData as any)?.data || [];
  const providers = Array.isArray(providersResponseData) ? providersResponseData : (providersResponseData as any)?.data || [];
  const voucherTemplates = Array.isArray(voucherTemplatesResponseData) ? voucherTemplatesResponseData : (voucherTemplatesResponseData as any)?.data || [];

  const isLoading = isLoadingVouchers || isLoadingRequests || isLoadingClients || isLoadingProviders;

  const filteredVouchers = useMemo(() => {
    return vouchers.filter((voucher: any) => {
      const client = clients.find(c => c.id === voucher.clientId);
      const matchesSearch = 
        (voucher.voucherNumber?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
        (voucher.serviceName?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
        (voucher.destination?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
        (client?.firstName?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
        (client?.lastName?.toLowerCase() || "").includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusTab === "all" || voucher.status === statusTab;
      
      return matchesSearch && matchesStatus;
    });
  }, [vouchers, searchTerm, statusTab, clients]);

  const stats = useMemo(() => {
    return {
      total: vouchers.length,
      borradores: vouchers.filter((v: any) => v.status === "BORRADOR").length,
      emitidos: vouchers.filter((v: any) => v.status === "EMITIDO").length,
      cancelados: vouchers.filter((v: any) => v.status === "CANCELADO").length,
    };
  }, [vouchers]);

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await api.delete(`/vouchers/${deleteId}`);
      toast({ title: "Voucher eliminado", description: "El registro del voucher ha sido eliminado correctamente." });
      queryClient.invalidateQueries({ queryKey: ["vouchers"] });
      setDeleteId(null);
    } catch (error) {
      console.error("Error deleting voucher:", error);
      toast({ variant: "destructive", title: "Error", description: "No se pudo eliminar el voucher." });
    }
  };

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      api.patch(`/vouchers/${id}`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vouchers"] });
      toast({ title: "Estado actualizado", description: "El estado del voucher ha sido actualizado." });
    },
  });

  const handleStatusChange = async (id: string, newStatus: string) => {
    updateStatusMutation.mutate({ id, status: newStatus });
    if (newStatus === 'EMITIDO') {
      try {
        const voucher = vouchers.find((v: any) => v.id === id);
        const client = clients.find((c: any) => c.id === voucher?.clientId);
        const provider = providers.find((p: any) => p.id === voucher?.providerId);
        
        if (client?.email && voucher) {
          const activeTemplate = voucherTemplates[0];
          let subject: string, body_html: string;

          if (activeTemplate) {
            const data: Record<string, string> = {
              client_name: `${client.firstName} ${client.lastName}`,
              voucher_number: voucher.voucherNumber || '',
              service_name: voucher.serviceName || '',
              service_type: voucher.serviceType || '',
              destination: voucher.destination || '',
              check_in: voucher.checkIn ? format(new Date(voucher.checkIn), "dd 'de' MMMM, yyyy", { locale: es }) : '',
              check_out: voucher.checkOut ? format(new Date(voucher.checkOut), "dd 'de' MMMM, yyyy", { locale: es }) : '',
              confirmation_code: voucher.confirmationCode || '',
              passengers: (voucher.passengerNames || []).join(', '),
              agency_name: 'ADE Travel',
              agency_email: 'contacto@adetravel.cl',
            };
            subject = renderTemplate(activeTemplate.subject, data);
            body_html = renderTemplate(activeTemplate.bodyHtml, data);
          } else {
            const result = buildVoucherEmail(voucher, client, provider);
            subject = result.subject;
            body_html = result.body_html;
          }

          await sendEmail({
            to: client.email,
            subject,
            body_html,
            from_name: 'ADE Travel',
            from_local_part: 'vouchers'
          });
          toast({ title: "Voucher enviado", description: `Voucher enviado a ${client.email}` });
        }
      } catch (err) {
        console.error('Error sending voucher email:', err);
      }
    }
  };

  const openEdit = (voucher: any) => {
    setSelectedVoucher(voucher);
    setIsFormOpen(true);
  };

  const openCreate = () => {
    setSelectedVoucher(null);
    setIsFormOpen(true);
  };

  const handlePreviewPDF = (voucher: any) => {
    setPdfVoucher(voucher);
    setPdfOpen(true);
  };

  const matchedClient = useMemo(() => {
    if (!pdfVoucher) return null;
    return clients.find(c => c.id === pdfVoucher.clientId);
  }, [pdfVoucher, clients]);

  const matchedProvider = useMemo(() => {
    if (!pdfVoucher) return null;
    return providers.find(p => p.id === pdfVoucher.providerId);
  }, [pdfVoucher, providers]);

  const matchedRequest = useMemo(() => {
    if (!pdfVoucher) return null;
    return requests.find(r => r.id === pdfVoucher.requestId);
  }, [pdfVoucher, requests]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-playfair font-bold text-navy dark:text-white">Vouchers</h1>
          <p className="text-muted-foreground mt-1 text-lg">
            Gestión y emisión de comprobantes de servicio para clientes.
          </p>
        </div>
        <Button 
          onClick={openCreate}
          className="bg-primary hover:bg-primary/90 text-navy font-bold gap-2 px-6 h-12 rounded-xl shadow-lg shadow-primary/20"
        >
          <Plus className="w-5 h-5" />
          Generar Voucher
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-none shadow-md bg-gradient-to-br from-navy to-navy-light text-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold uppercase tracking-wider opacity-80 flex items-center gap-2">
              <Ticket className="w-4 h-4" /> Total Registrados
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className="text-3xl font-bold">{stats.total}</span>
              <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
                <Ticket className="w-5 h-5 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-md bg-white dark:bg-navy-dark">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-500" /> Emitidos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className="text-3xl font-bold">{stats.emitidos}</span>
              <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-emerald-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-md bg-white dark:bg-navy-dark">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-500" /> Borradores
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className="text-3xl font-bold">{stats.borradores}</span>
              <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
                <ArrowRight className="w-5 h-5 text-amber-600" />
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
                <TabsTrigger value="BORRADOR" className="rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-navy data-[state=active]:shadow-sm">Borradores</TabsTrigger>
                <TabsTrigger value="EMITIDO" className="rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-navy data-[state=active]:shadow-sm">Emitidos</TabsTrigger>
                <TabsTrigger value="CANCELADO" className="rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-navy data-[state=active]:shadow-sm">Cancelados</TabsTrigger>
              </TabsList>
            </Tabs>

            <div className="flex items-center gap-2">
              <div className="relative w-full md:w-[300px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input 
                  placeholder="Buscar por N°, servicio o cliente..." 
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
          <VouchersTable 
            vouchers={filteredVouchers}
            requests={requests}
            clients={clients}
            isLoading={isLoading}
            onEdit={openEdit}
            onDelete={setDeleteId}
            onPreviewPDF={handlePreviewPDF}
            onStatusChange={handleStatusChange}
          />
        </CardContent>
      </Card>

      {/* Dialogs */}
      <VoucherFormDialog 
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        voucher={selectedVoucher}
      />

      <VoucherPDFPreview 
        open={pdfOpen}
        onOpenChange={setPdfOpen}
        voucher={pdfVoucher}
        client={matchedClient}
        provider={matchedProvider}
        request={matchedRequest}
      />

      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Está absolutamente seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción eliminará permanentemente el registro de este voucher. No se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Eliminar Voucher
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
