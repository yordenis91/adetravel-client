import React from "react";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Eye, Edit2, CheckCircle2 } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface ConfirmationsTableProps {
  confirmations: any[];
  requests: any[];
  providers: any[];
  isLoading: boolean;
  onView: (c: any) => void;
  onEdit: (c: any) => void;
}

export function ConfirmationsTable({ confirmations, requests, providers, isLoading, onView, onEdit }: ConfirmationsTableProps) {
  const getRequestNumber = (id: string) => requests.find((r) => r.id === id)?.requestNumber || id?.substring(0, 8);
  const getProviderName = (id: string) => {
    const p = providers.find((pv) => pv.id === id);
    return p ? (p.fantasyName || p.name) : "—";
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => <Skeleton key={i} className="h-14 w-full rounded-xl" />)}
      </div>
    );
  }

  if (confirmations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
        <div className="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center mb-4">
          <CheckCircle2 className="w-8 h-8 text-slate-300" />
        </div>
        <h3 className="text-lg font-playfair font-bold text-navy">Sin confirmaciones</h3>
        <p className="text-sm text-muted-foreground max-w-xs text-center mt-1">
          No se encontraron confirmaciones que coincidan con los filtros actuales.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-slate-100">
      <Table>
        <TableHeader className="bg-slate-50/50">
          <TableRow>
            <TableHead className="text-xs font-bold uppercase tracking-wider">N° Confirmación</TableHead>
            <TableHead className="text-xs font-bold uppercase tracking-wider">Solicitud</TableHead>
            <TableHead className="text-xs font-bold uppercase tracking-wider">Proveedor</TableHead>
            <TableHead className="text-xs font-bold uppercase tracking-wider">N° Proveedor</TableHead>
            <TableHead className="text-xs font-bold uppercase tracking-wider">Precio</TableHead>
            <TableHead className="text-xs font-bold uppercase tracking-wider">Vigencia</TableHead>
            <TableHead className="text-right text-xs font-bold uppercase tracking-wider">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {confirmations.map((c) => (
            <TableRow key={c.id} className="hover:bg-slate-50/50 transition-colors">
              <TableCell className="font-mono text-xs font-bold text-primary">{c.confirmationNumber}</TableCell>
              <TableCell className="font-mono text-xs">{getRequestNumber(c.requestId)}</TableCell>
              <TableCell className="text-sm">{getProviderName(c.providerId)}</TableCell>
              <TableCell className="text-xs text-muted-foreground">{c.providerConfirmationNumber || "—"}</TableCell>
              <TableCell className="text-xs font-bold text-navy">{Number(c.price).toLocaleString("es-CL")}</TableCell>
              <TableCell className="text-xs text-muted-foreground">
                {c.validUntil ? format(new Date(c.validUntil), "dd MMM yyyy", { locale: es }) : "—"}
              </TableCell>
              <TableCell className="text-right">
                <div className="flex items-center justify-end gap-1">
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50" onClick={() => onView(c)}>
                    <Eye className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-primary hover:bg-primary/5" onClick={() => onEdit(c)}>
                    <Edit2 className="w-4 h-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
