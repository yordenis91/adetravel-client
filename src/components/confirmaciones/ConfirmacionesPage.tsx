import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, CheckCircle2, ShoppingBag, DollarSign, Ticket } from "lucide-react";
import { ConfirmacionesTable } from "./ConfirmacionesTable";
import { ConfirmacionDetailSheet } from "./ConfirmacionDetailSheet";

export default function ConfirmacionesPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("Todas");
  const [selectedRequest, setSelectedRequest] = useState<any>(null);

  const { data: requestsResponseData = [], isLoading: isRequestsLoading } = useQuery({
    queryKey: ["requests"],
    queryFn: () => api.get('/requests'),
  });

  const { data: clientsResponseData = [], isLoading: isClientsLoading } = useQuery({
    queryKey: ["clients"],
    queryFn: () => api.get('/clients'),
  });

  const { data: paymentsResponseData = [] } = useQuery({
    queryKey: ["payments"],
    queryFn: () => api.get('/payments'),
  });

  const { data: vouchersResponseData = [] } = useQuery({
    queryKey: ["vouchers"],
    queryFn: () => api.get('/vouchers'),
  });

  const { data: quotationsResponseData = [] } = useQuery({
    queryKey: ["quotations"],
    queryFn: () => api.get('/quotations'),
  });

  const requests = Array.isArray(requestsResponseData) ? requestsResponseData : (requestsResponseData as any)?.data || [];
  const clients = Array.isArray(clientsResponseData) ? clientsResponseData : (clientsResponseData as any)?.data || [];
  const payments = Array.isArray(paymentsResponseData) ? paymentsResponseData : (paymentsResponseData as any)?.data || [];
  const vouchers = Array.isArray(vouchersResponseData) ? vouchersResponseData : (vouchersResponseData as any)?.data || [];
  const quotations = Array.isArray(quotationsResponseData) ? quotationsResponseData : (quotationsResponseData as any)?.data || [];

  const confirmedRequests = useMemo(() => {
    return requests.filter((r: any) => r.status === "Confirmada" || r.status === "Vendida");
  }, [requests]);

  const filteredRequests = useMemo(() => {
    return confirmedRequests.filter((request: any) => {
      const client = clients.find((c: any) => c.id === request.clientId);
      const clientName = client ? `${client.firstName} ${client.lastName}`.toLowerCase() : "";
      const matchesSearch = 
        request.requestNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        clientName.includes(searchTerm.toLowerCase());
      
      const matchesTab = activeTab === "Todas" || request.status === activeTab;
      
      return matchesSearch && matchesTab;
    });
  }, [confirmedRequests, clients, searchTerm, activeTab]);

  const stats = useMemo(() => {
    const totalConfirmadas = confirmedRequests.filter((r: any) => r.status === "Confirmada").length;
    const totalVendidas = confirmedRequests.filter((r: any) => r.status === "Vendida").length;
    
    const confirmedRequestIds = confirmedRequests.map((r: any) => r.id);
    const completedPayments = payments.filter((p: any) => 
      confirmedRequestIds.includes(p.requestId) && p.status === "COMPLETADO" && p.currency === "CLP"
    );
    const totalIngresos = completedPayments.reduce((acc: number, p: any) => acc + (p.amount || 0), 0);
    
    const emittedVouchers = vouchers.filter((v: any) => 
      confirmedRequestIds.includes(v.requestId) && v.status === "EMITIDO"
    ).length;

    return { totalConfirmadas, totalVendidas, totalIngresos, emittedVouchers };
  }, [confirmedRequests, payments, vouchers]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-CL", {
      style: "currency",
      currency: "CLP",
    }).format(amount);
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-1">
        <h1 className="text-4xl font-playfair font-bold text-navy">Confirmaciones</h1>
        <p className="text-muted-foreground">Reservas confirmadas y ventas cerradas</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-none shadow-sm bg-white overflow-hidden group">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground mb-1">Confirmadas</p>
                <h3 className="text-2xl font-bold text-navy">{stats.totalConfirmadas}</h3>
              </div>
              <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-500 group-hover:bg-blue-500 group-hover:text-white transition-colors">
                <CheckCircle2 className="w-5 h-5" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm bg-white overflow-hidden group">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground mb-1">Vendidas</p>
                <h3 className="text-2xl font-bold text-navy">{stats.totalVendidas}</h3>
              </div>
              <div className="w-10 h-10 rounded-full bg-purple-50 flex items-center justify-center text-purple-500 group-hover:bg-purple-500 group-hover:text-white transition-colors">
                <ShoppingBag className="w-5 h-5" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm bg-white overflow-hidden group">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground mb-1">Ingresos (CLP)</p>
                <h3 className="text-2xl font-bold text-navy">{formatCurrency(stats.totalIngresos)}</h3>
              </div>
              <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-500 group-hover:bg-emerald-500 group-hover:text-white transition-colors">
                <DollarSign className="w-5 h-5" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm bg-white overflow-hidden group">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground mb-1">Vouchers Emitidos</p>
                <h3 className="text-2xl font-bold text-navy">{stats.emittedVouchers}</h3>
              </div>
              <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center text-amber-500 group-hover:bg-amber-500 group-hover:text-white transition-colors">
                <Ticket className="w-5 h-5" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full md:w-auto">
          <TabsList className="bg-white border border-gray-100 p-1">
            <TabsTrigger value="Todas" className="text-xs uppercase tracking-widest font-bold px-4 py-2">Todas</TabsTrigger>
            <TabsTrigger value="Confirmada" className="text-xs uppercase tracking-widest font-bold px-4 py-2">Confirmadas</TabsTrigger>
            <TabsTrigger value="Vendida" className="text-xs uppercase tracking-widest font-bold px-4 py-2">Vendidas</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="relative w-full md:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            placeholder="Buscar por n° o cliente..." 
            className="pl-10 bg-white border-gray-100"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <ConfirmacionesTable 
          requests={filteredRequests}
          clients={clients}
          payments={payments}
          vouchers={vouchers}
          isLoading={isRequestsLoading || isClientsLoading}
          onView={(request) => setSelectedRequest(request)}
        />
      </div>

      {selectedRequest && (
        <ConfirmacionDetailSheet 
          request={selectedRequest}
          client={clients.find((c: any) => c.id === selectedRequest.clientId)}
          payments={payments.filter((p: any) => p.requestId === selectedRequest.id)}
          vouchers={vouchers.filter((v: any) => v.requestId === selectedRequest.id)}
          quotation={quotations.find((q: any) => q.requestId === selectedRequest.id && q.status === "Aceptada")}
          open={!!selectedRequest}
          onOpenChange={(open) => !open && setSelectedRequest(null)}
        />
      )}
    </div>
  );
}
