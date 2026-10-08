import React, { useEffect, useState, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Plus,
  Search,
  Ticket,
  Clock,
  CheckCircle,
  XCircle
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
import { api, getErrorMessage } from "@/lib/api";
import { usePagedList } from "@/hooks/usePagedList";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { ListPagination } from "@/components/shared/ListPagination";
import { ListError } from "@/components/shared/ListError";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { VouchersTable } from "./VouchersTable";
import { VoucherFormDialog } from "./VoucherFormDialog";
import { VoucherPDFPreview } from "./VoucherPDFPreview";
import { ExportMenu } from "@/components/shared/ExportMenu";
import { serviceTypeLabel } from "@/lib/service-types";

export default function VouchersPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusTab, setStatusTab] = useState("all");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedVoucher, setSelectedVoucher] = useState<any>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  
  const [processingId, setProcessingId] = useState<string | null>(null);

  const [pdfVoucher, setPdfVoucher] = useState<any>(null);
  const [pdfOpen, setPdfOpen] = useState(false);

  // Paginado, búsqueda (N°, servicio, destino, código, cliente) y estado en el servidor. Cliente,
  // solicitud y proveedor vienen incrustados en cada voucher.
  const search = useDebouncedValue(searchTerm.trim());
  const list = usePagedList("vouchers", "/vouchers", { status: statusTab, search });
  const vouchers = list.rows;
  const filteredVouchers = vouchers;
  const isLoading = list.isLoading;

  // Contadores de todos los vouchers (GET /vouchers/stats), no solo de la página visible.
  const { data: statsResponse } = useQuery({
    queryKey: ["vouchers", "stats"],
    queryFn: () => api.get("/vouchers/stats"),
  });
  const stats = useMemo(() => {
    const s = (statsResponse as any)?.data ?? {};
    return { total: s.total ?? 0, borradores: s.borradores ?? 0, emitidos: s.emitidos ?? 0, cancelados: s.cancelados ?? 0 };
  }, [statsResponse]);

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
    onError: (error) => {
      // El motivo concreto (p. ej. "la solicitud aún no está pagada al proveedor") viene de la API.
      toast({ variant: "destructive", title: "No se pudo cambiar el estado", description: getErrorMessage(error, "No se pudo actualizar el estado.") });
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

  // Deep-link desde el buscador global: /vouchers?view=<voucherId>. Se pide por id: el voucher
  // puede no estar en la página visible.
  useEffect(() => {
    const viewId = searchParams.get("view");
    if (!viewId) return;
    searchParams.delete("view");
    setSearchParams(searchParams, { replace: true });
    api.get(`/vouchers/${viewId}`)
      .then((res: any) => res?.data && openEdit(res.data))
      .catch(() => toast({ variant: "destructive", title: "Voucher no encontrado" }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, setSearchParams]);

  // La vista previa necesita los datos completos de cliente y proveedor (RUT, correo, teléfono),
  // que el listado no trae: se pide el voucher por id (GET /vouchers/:id los incluye).
  const handlePreviewPDF = async (voucher: any) => {
    setPdfVoucher(voucher);
    setPdfOpen(true);
    try {
      const res: any = await api.get(`/vouchers/${voucher.id}`);
      if (res?.data) setPdfVoucher(res.data);
    } catch (error) {
      toast({ variant: "destructive", title: "No se pudo cargar el voucher", description: getErrorMessage(error, "Error de conexión.") });
    }
  };

  const matchedClient = pdfVoucher?.client ?? null;
  const matchedProvider = pdfVoucher?.provider ?? null;
  const matchedRequest = pdfVoucher?.request ?? null;

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
          <ExportMenu
            filename="vouchers_adetravel"
            data={filteredVouchers.map((v: any) => {
              const client = v.client;
              return {
                numero: v.voucherNumber,
                cliente: client ? `${client.firstName} ${client.lastName}` : "",
                servicio: v.serviceName || serviceTypeLabel(v.serviceType),
                destino: v.destination || "",
                estado: v.status,
                fecha: v.createdAt,
              };
            })}
            columns={[
              { key: "numero", label: "N° Voucher" },
              { key: "cliente", label: "Cliente" },
              { key: "servicio", label: "Servicio" },
              { key: "destino", label: "Destino" },
              { key: "estado", label: "Estado" },
              { key: "fecha", label: "Fecha" },
            ]}
          />
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
                placeholder="Buscar por N°, servicio o cliente..." aria-label="Buscar por N°, servicio o cliente" 
                className="pl-10 bg-slate-50 border-slate-100 focus:bg-white transition-all text-sm h-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </div>

        {list.isError ? (
          <ListError error={list.error} onRetry={() => list.refetch()} what="los vouchers" />
        ) : (
          <>
            <VouchersTable
              vouchers={filteredVouchers}
              isLoading={isLoading}
              processingId={processingId}
              onEdit={openEdit}
              onDelete={setDeleteId}
              onPreviewPDF={handlePreviewPDF}
              onStatusChange={handleStatusChange}
            />
            <ListPagination page={list.page} limit={list.limit} total={list.total} onPageChange={list.setPage} isFetching={list.isFetching} />
          </>
        )}
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