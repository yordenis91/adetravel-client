import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { QuotationsTable } from "./QuotationsTable";
import { QuotationFormDialog } from "./QuotationFormDialog";
import { QuotationDetailSheet } from "./QuotationDetailSheet";
import { QuotationPDFPreview } from "./QuotationPDFPreview";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Plus, 
  Search, 
  ReceiptText, 
  Send, 
  CheckCircle2, 
  Clock, 
  Filter
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { sendEmail } from "@/integrations/core";
import { buildQuotationEmail } from "@/lib/emailTemplates";
import { renderTemplate } from "@/lib/templateVariables";
import { format } from "date-fns";
import { es } from "date-fns/locale";

export default function QuotationsPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [statusTab, setStatusTab] = useState("Todas");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedQuotation, setSelectedQuotation] = useState<any>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [viewedQuotation, setViewedQuotation] = useState<any>(null);
  
  // PDF Preview State
  const [pdfOpen, setPdfOpen] = useState(false);
  const [pdfQuotation, setPdfQuotation] = useState<any>(null);

  const { data: quotationsResponseData = [], isLoading: loadingQuotations} = useQuery({
    queryKey: ["quotations"],
    queryFn: () => api.get('/quotations'),
  });

  const { data: requestsResponseData = [], isLoading: loadingRequests } = useQuery({
    queryKey: ["requests"],
    queryFn: () => api.get('/requests'),
  });

  const { data: clientsResponseData = [], isLoading: loadingClients } = useQuery({
    queryKey: ["clients"],
    queryFn: () => api.get('/clients'),
  });

  const { data: quotationTemplatesResponseData = [], isLoading: loadingQuotationTemplates } = useQuery({
    queryKey: ['emailTemplates', 'QUOTATION_SENT'],
    queryFn: () => api.get('/email-templates?type=QUOTATION_SENT&isActive=true')
  });

  const formatStatus = (s?: string) => {
    if (!s) return "Borrador";
    return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
  };

  const rawQuotations = Array.isArray(quotationsResponseData) ? quotationsResponseData : (quotationsResponseData as any)?.data || [];
  const quotations = rawQuotations.map((q: any) => ({
    ...q,
    status: formatStatus(q.status)
  }));
  const requests = Array.isArray(requestsResponseData) ? requestsResponseData : (requestsResponseData as any)?.data || [];
  const clients = Array.isArray(clientsResponseData) ? clientsResponseData : (clientsResponseData as any)?.data || [];
  const quotationTemplates = Array.isArray(quotationTemplatesResponseData) ? quotationTemplatesResponseData : (quotationTemplatesResponseData as any)?.data || [];

  const isLoading = loadingClients || loadingRequests || loadingQuotations || loadingQuotationTemplates;

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string, status: string }) => 
      api.patch(`/quotations/${id}/status`, { status: status.toUpperCase() }), // enviar estado en MAYÚSCULAS como espera el backend
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["quotations"] });
      toast({ title: "Estado actualizado", description: "La cotización ha cambiado de estado exitosamente." });
      if (viewedQuotation) {
        setViewedQuotation((prev: any) => ({ ...prev, status: formatStatus(variables.status) }));
      }
    },
  });

  const duplicateQuotationMutation = useMutation({
    mutationFn: (id: string) => api.post(`/quotations/${id}/duplicate`),
    onSuccess: (response: any) => {
      queryClient.invalidateQueries({ queryKey: ["quotations"] });
      toast({ 
        title: "Cotización duplicada", 
        description: `Se ha creado con éxito la versión borrador: ${response?.data?.quotationNumber || ""}` 
      });
    },
    onError: () => {
      toast({ 
        title: "Error", 
        description: "No se pudo duplicar la cotización.", 
        variant: "destructive" 
      });
    }
  });

  const handleDuplicate = (id: string) => {
    duplicateQuotationMutation.mutate(id);
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    updateStatusMutation.mutate({ id, status: newStatus });

    if (newStatus === 'Enviada') {
      try {
        const quotation = quotations.find((q: any) => q.id === id);
        const client = clients.find((c: any) => c.id === quotation?.clientId);
        const request = requests.find((r: any) => r.id === quotation?.requestId);
        
        if (client?.email && quotation) {
          const activeTemplate = quotationTemplates[0];
          let subject: string, body_html: string;
          
          if (activeTemplate) {
            const destination = request ? `${request.originCity || ''} → ${request.destinationCity || ''}` : '';
            const data: Record<string, string> = {
              client_name: `${client.firstName} ${client.lastName}`,
              quotation_number: quotation.quotationNumber || '',
              valid_until: quotation.validUntil ? format(new Date(quotation.validUntil), "dd 'de' MMMM, yyyy", { locale: es }) : '',
              destination,
              total: new Intl.NumberFormat("es-CL", { style: "currency", currency: quotation.currency || "CLP" }).format(quotation.total || 0),
              currency: quotation.currency || 'CLP',
              agency_name: 'ADE Travel',
              agency_email: 'contacto@adetravel.cl',
              agency_phone: '+56 9 1234 5678',
            };
            subject = renderTemplate(activeTemplate.subject, data);
            body_html = renderTemplate(activeTemplate.bodyHtml, data);
          } else {
            const result = buildQuotationEmail(quotation, client, request);
            subject = result.subject;
            body_html = result.body_html;
          }

          await sendEmail({
            to: client.email,
            subject,
            body_html,
            from_name: 'ADE Travel',
            from_local_part: 'cotizaciones'
          });
          toast({ title: "Email enviado", description: `Cotización enviada a ${client.email}` });
        }
      } catch (err) {
        console.error('Error sending quotation email:', err);
      }
    }
  };

  const handleEdit = (quotation: any) => {
    setSelectedQuotation(quotation);
    setIsFormOpen(true);
    setIsDetailOpen(false);
  };

  const handleView = (quotation: any) => {
    setViewedQuotation(quotation);
    setIsDetailOpen(true);
  };

  const handlePreviewPDF = (quotation: any) => {
    setPdfQuotation(quotation);
    setPdfOpen(true);
  };

  const filteredQuotations = quotations.filter((q) => {
    const client = clients.find(c => c.id === q.clientId);
    const clientName = client ? `${client.firstName} ${client.lastName}` : "";
    const matchesSearch = (q.quotationNumber?.toLowerCase() || "").includes(search.toLowerCase()) ||
                          clientName.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusTab === "Todas" || q.status === statusTab;
    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: quotations.length,
    borrador: quotations.filter(q => q.status === "Borrador").length,
    enviadas: quotations.filter(q => q.status === "Enviada").length,
    aceptadas: quotations.filter(q => q.status === "Aceptada").length,
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-playfair font-bold text-navy mb-1">Cotizaciones</h1>
          <p className="text-muted-foreground text-sm">
            Gestiona propuestas formales y haz seguimiento de ventas.
          </p>
        </div>
        <div className="flex gap-2">
          
          <Button onClick={() => { setSelectedQuotation(null); setIsFormOpen(true); }} className="gap-2 text-xs font-bold uppercase tracking-wider shadow-lg shadow-primary/20">
            <Plus className="w-4 h-4" /> Nueva Cotización
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-gray-100 flex items-center gap-3 shadow-sm">
          <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
            <ReceiptText className="w-5 h-5" />
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
            <p className="text-xl font-playfair font-bold text-navy">{stats.borrador}</p>
          </div>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-gray-100 flex items-center gap-3 shadow-sm">
          <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-500">
            <Send className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Enviadas</p>
            <p className="text-xl font-playfair font-bold text-navy">{stats.enviadas}</p>
          </div>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-gray-100 flex items-center gap-3 shadow-sm">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-500">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Aceptadas</p>
            <p className="text-xl font-playfair font-bold text-navy">{stats.aceptadas}</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <Tabs value={statusTab} onValueChange={setStatusTab} className="w-full lg:w-auto overflow-x-auto">
            <TabsList className="bg-muted/50 p-1 h-auto flex-wrap sm:flex-nowrap">
              <TabsTrigger value="Todas" className="text-[10px] font-bold uppercase tracking-wider px-3 h-8">Todas</TabsTrigger>
              <TabsTrigger value="Borrador" className="text-[10px] font-bold uppercase tracking-wider px-3 h-8">Borrador</TabsTrigger>
              <TabsTrigger value="Enviada" className="text-[10px] font-bold uppercase tracking-wider px-3 h-8">Enviadas</TabsTrigger>
              <TabsTrigger value="Aceptada" className="text-[10px] font-bold uppercase tracking-wider px-3 h-8">Aceptadas</TabsTrigger>
              <TabsTrigger value="Rechazada" className="text-[10px] font-bold uppercase tracking-wider px-3 h-8">Rechazadas</TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="flex items-center gap-2 flex-1 md:max-w-sm">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input 
                placeholder="Buscar por N° o Cliente..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 bg-slate-50 border-slate-100 focus:bg-white transition-all text-sm h-10"
              />
            </div>
            <Button variant="outline" size="icon" className="shrink-0 h-10 w-10">
              <Filter className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <QuotationsTable 
          quotations={filteredQuotations} 
          requests={requests}
          clients={clients}
          isLoading={isLoading} 
          onEdit={handleEdit}
          onView={handleView}
          onStatusChange={handleStatusChange}
          onPreviewPDF={handlePreviewPDF}
          onDuplicate={handleDuplicate}
        />
      </div>

      <QuotationFormDialog 
        open={isFormOpen} 
        onOpenChange={setIsFormOpen} 
        quotation={selectedQuotation}
        onSuccess={() => queryClient.invalidateQueries({ queryKey: ["quotations"] })}
      />

      <QuotationDetailSheet 
        open={isDetailOpen} 
        onOpenChange={setIsDetailOpen}
        quotation={viewedQuotation}
        request={requests.find(r => r.id === viewedQuotation?.requestId)}
        client={clients.find(c => c.id === viewedQuotation?.clientId)}
        onEdit={handleEdit}
        onStatusChange={handleStatusChange}
      />

      <QuotationPDFPreview 
        open={pdfOpen}
        onOpenChange={setPdfOpen}
        quotation={pdfQuotation}
        client={clients.find(c => c.id === pdfQuotation?.clientId)}
        request={requests.find(r => r.id === pdfQuotation?.requestId)}
      />
    </div>
  );
}