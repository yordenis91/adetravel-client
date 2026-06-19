import React, { useState, useMemo } from "react";
import { 
  Plus, 
  Search, 
  Ticket, 
  Clock, 
  CheckCircle, 
  XCircle,
  Filter,
  Download
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
  
  const [processingId, setProcessingId] = useState<string | null>(null);

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
      api.patch(`/vouchers/${id}/status`, { status }),
    onMutate: (variables) => {
      setProcessingId(variables.id);
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["vouchers"] });
      toast({ title: "Estado actualizado", description: `El voucher ha cambiado a ${variables.status}.` });
    },
    onError: () => {
      toast({ variant: "destructive", title: "Error", description: "No se pudo actualizar el estado." });
    },
    onSettled: () => {
      setProcessingId(null);
    }
  });

  const handleStatusChange = (id: string, newStatus: string) => {
    updateStatusMutation.mutate({ id, status: newStatus });
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
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-playfair font-bold text-navy mb-1">Vouchers</h1>
          <p className="text-muted-foreground text-sm">
            Gestión y emisión de comprobantes de servicio para clientes.
          </p>
        </div>
        <div className="flex gap-2">        
          <Button onClick={openCreate} className="gap-2 text-xs font-bold uppercase tracking-wider shadow-lg shadow-primary/20">
            <Plus className="w-4 h-4" /> Generar Voucher
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-gray-100 flex items-center gap-3 shadow-sm">
          <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
            <Ticket className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Total</p>
            <p className="text-xl font-playfair font-bold text-navy">{stats.total}</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-gray-100 flex items-center gap-3 shadow-sm">
          <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-500">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Borradores</p>
            <p className="text-xl font-playfair font-bold text-navy">{stats.borradores}</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-gray-100 flex items-center gap-3 shadow-sm">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-500">
            <CheckCircle className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Emitidos</p>
            <p className="text-xl font-playfair font-bold text-navy">{stats.emitidos}</p>
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
              <TabsTrigger value="BORRADOR" className="text-[10px] font-bold uppercase tracking-wider px-3 h-8">Borradores</TabsTrigger>
              <TabsTrigger value="EMITIDO" className="text-[10px] font-bold uppercase tracking-wider px-3 h-8">Emitidos</TabsTrigger>
              <TabsTrigger value="CANCELADO" className="text-[10px] font-bold uppercase tracking-wider px-3 h-8">Cancelados</TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="flex items-center gap-2 flex-1 md:max-w-sm">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input 
                placeholder="Buscar por N°, servicio o cliente..." 
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

        <VouchersTable 
          vouchers={filteredVouchers}
          requests={requests}
          clients={clients}
          isLoading={isLoading}
          processingId={processingId}
          onEdit={openEdit}
          onDelete={setDeleteId}
          onPreviewPDF={handlePreviewPDF}
          onStatusChange={handleStatusChange}
        />
      </div>

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