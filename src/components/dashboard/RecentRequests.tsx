import React from "react";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { FileText, ArrowRight } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

// 🔥 CORRECCIÓN: Nombres de estados actualizados a MAYÚSCULAS para coincidir con el backend Zod
const statusConfig: Record<string, { label: string; color: string }> = {
  "RECEPCIONADA": { label: "Recepcionada", color: "bg-blue-100 text-blue-700 hover:bg-blue-100/80" },
  "COTIZADA": { label: "Cotizada", color: "bg-amber-100 text-amber-700 hover:bg-amber-100/80" },
  "CONFIRMADA": { label: "Confirmada", color: "bg-emerald-100 text-emerald-700 hover:bg-emerald-100/80" },
  "CANCELADA": { label: "Cancelada", color: "bg-rose-100 text-rose-700 hover:bg-rose-100/80" },
  "VENDIDA": { label: "Vendida", color: "bg-purple-100 text-purple-700 hover:bg-purple-100/80" },
};

export function RecentRequests() {
  const { data: responseData, isLoading } = useQuery({
    queryKey: ["recent-requests"],
    queryFn: () => api.get('/requests?limit=5'),
  });

  if (isLoading) {
    return (
      <div className="space-y-4 bg-white p-6 rounded-2xl shadow-sm">
        {[1, 2, 3, 4, 5].map((i) => (
          <Skeleton key={i} className="h-12 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  const requests = Array.isArray(responseData)
    ? responseData
    : (responseData as any)?.data || [];

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 h-full">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-playfair font-bold text-navy flex items-center gap-2">
          <FileText className="w-5 h-5 text-primary" />
          Solicitudes Recientes
        </h3>
        <Button variant="ghost" size="sm" asChild className="text-primary hover:text-primary-dark">
          <Link to="/solicitudes" className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider">
            Ver todas <ArrowRight className="w-3 h-3" />
          </Link>
        </Button>
      </div>

      {requests.length === 0 ? (
        <div className="text-center py-12 px-4 border-2 border-dashed border-gray-100 rounded-xl bg-gray-50/50">
          <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
            <FileText className="w-6 h-6 text-muted-foreground/30" />
          </div>
          <p className="text-sm font-medium text-muted-foreground mb-4">No hay solicitudes recientes</p>
          <Button variant="outline" size="sm" asChild className="border-navy text-navy">
            <Link to="/solicitudes">Crear nueva solicitud</Link>
          </Button>
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent border-gray-100">
              <TableHead className="text-[10px] uppercase font-bold tracking-widest">ID</TableHead>
              <TableHead className="text-[10px] uppercase font-bold tracking-widest">Servicios</TableHead>
              <TableHead className="text-[10px] uppercase font-bold tracking-widest">Estado</TableHead>
              <TableHead className="text-[10px] uppercase font-bold tracking-widest text-right">Fecha</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {requests.map((req: any) => (
              <TableRow key={req.id} className="group cursor-pointer border-gray-100">
                <TableCell className="font-bold text-navy text-xs">
                  {req.requestNumber || `REQ-${req.id.substring(0, 6).toUpperCase()}`}
                </TableCell>
                <TableCell>
                  <div className="flex gap-1 flex-wrap">
                    {req.services?.slice(0, 2).map((s: string) => (
                      <span key={s} className="text-[10px] bg-slate-100 px-1.5 py-0.5 rounded-md text-slate-600 font-medium">
                        {s}
                      </span>
                    ))}
                    {req.services?.length > 2 && (
                      <span className="text-[10px] text-muted-foreground font-medium">
                        +{req.services.length - 2}
                      </span>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className={cn("text-[10px] font-bold border-none", statusConfig[req.status]?.color || "bg-slate-100 text-slate-600")}>
                    {statusConfig[req.status]?.label || req.status || "Pendiente"}
                  </Badge>
                </TableCell>
                <TableCell className="text-right text-xs font-medium text-muted-foreground">
                  {req.createdAt ? new Date(req.createdAt).toLocaleDateString("es-CL") : "-"}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}