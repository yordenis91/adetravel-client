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
import { getStatusColor, getStatusLabel } from "@/lib/workflow-status";

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
          <TableHeader className="bg-slate-50/50 border-b border-gray-100">
            <TableRow className="hover:bg-transparent border-none">
              <TableHead className="text-[10px] uppercase font-extrabold tracking-widest text-slate-600">ID</TableHead>
              <TableHead className="text-[10px] uppercase font-extrabold tracking-widest text-slate-600">Servicios</TableHead>
              <TableHead className="text-[10px] uppercase font-extrabold tracking-widest text-slate-600">Estado</TableHead>
              <TableHead className="text-[10px] uppercase font-extrabold tracking-widest text-slate-600 text-right">Fecha</TableHead>
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
                  <Badge variant="outline" className={cn("text-[10px] font-bold border-none", getStatusColor(req.status).bg, getStatusColor(req.status).text)}>
                    {getStatusLabel(req.status)}
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