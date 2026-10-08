import React, { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { usePagedList } from "@/hooks/usePagedList";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { ListPagination } from "@/components/shared/ListPagination";
import { ListError } from "@/components/shared/ListError";
import { ConfirmationsTable } from "./ConfirmationsTable";
import { ConfirmationFormDialog } from "./ConfirmationFormDialog";
import { ConfirmationDetailSheet } from "./ConfirmationDetailSheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, CheckCircle2 } from "lucide-react";
import { ExportMenu } from "@/components/shared/ExportMenu";

export default function ConfirmacionesPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedConfirmation, setSelectedConfirmation] = useState<any>(null);
  const queryClient = useQueryClient();

  // Paginado y búsqueda en el servidor. La solicitud y el proveedor vienen en cada fila; antes se
  // pedían todas las solicitudes con limit=1000, que la API rechaza (máximo 100).
  const search = useDebouncedValue(searchTerm.trim());
  const list = usePagedList("confirmations", "/confirmations", { search });
  const filteredConfirmations = list.rows;

  const handleAdd = () => {
    setSelectedConfirmation(null);
    setIsFormOpen(true);
  };

  const handleEdit = (c: any) => {
    setSelectedConfirmation(c);
    setIsFormOpen(true);
    setIsDetailOpen(false);
  };

  const handleView = (c: any) => {
    setSelectedConfirmation(c);
    setIsDetailOpen(true);
  };

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["confirmations"] });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-playfair font-bold text-navy mb-1 flex items-center gap-2">
            <CheckCircle2 className="w-7 h-7 text-primary" />
            Confirmaciones
          </h1>
          <p className="text-muted-foreground text-sm">Confirmaciones de reserva emitidas por los proveedores.</p>
        </div>
        <div className="flex gap-2">
          <ExportMenu
            filename="confirmaciones_adetravel"
            data={filteredConfirmations.map((c: any) => {
              const provider = c.provider;
              return {
                numero: c.confirmationNumber,
                solicitud: c.request?.requestNumber || "",
                proveedor: provider ? (provider.fantasyName || provider.name) : "",
                precio: c.price,
                vigencia: c.validUntil,
              };
            })}
            columns={[
              { key: "numero", label: "N° Confirmación" },
              { key: "solicitud", label: "Solicitud" },
              { key: "proveedor", label: "Proveedor" },
              { key: "precio", label: "Precio" },
              { key: "vigencia", label: "Vigencia" },
            ]}
          />
          <Button onClick={handleAdd} className="gap-2 text-xs font-bold uppercase tracking-wider shadow-lg shadow-primary/20">
            <Plus className="w-4 h-4" />
            Nueva Confirmación
          </Button>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm space-y-6">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por N° de confirmación..." aria-label="Buscar por N° de confirmación"
            className="pl-10 bg-slate-50 border-slate-100 h-10 text-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {list.isError ? (
          <ListError error={list.error} onRetry={() => list.refetch()} what="las confirmaciones" />
        ) : (
          <>
            <ConfirmationsTable
              confirmations={filteredConfirmations}
              isLoading={list.isLoading}
              onView={handleView}
              onEdit={handleEdit}
            />
            <ListPagination page={list.page} limit={list.limit} total={list.total} onPageChange={list.setPage} isFetching={list.isFetching} />
          </>
        )}
      </div>

      <ConfirmationFormDialog
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        confirmation={selectedConfirmation}
        onSuccess={invalidate}
      />

      <ConfirmationDetailSheet
        open={isDetailOpen}
        onOpenChange={setIsDetailOpen}
        confirmation={selectedConfirmation}
        onEdit={handleEdit}
      />
    </div>
  );
}
