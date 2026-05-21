import React from "react";
import { cn } from "@/lib/utils";
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
import { Edit, Trash2, Eye, MoreVertical, Phone, Mail } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";

interface ClientsTableProps {
  clients: any[];
  isLoading: boolean;
  onEdit: (client: any) => void;
  onDelete: (id: string) => void;
  onView: (client: any) => void;
}

export function ClientsTable({ clients, isLoading, onEdit, onDelete, onView}: ClientsTableProps) {
  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <Skeleton key={i} className="h-16 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  if (clients.length === 0) {
    return (
      <div className="text-center py-20 bg-white rounded-2xl border border-gray-100">
        <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
          <Edit className="w-8 h-8 text-muted-foreground/30" />
        </div>
        <h3 className="text-lg font-playfair font-bold text-navy">No se encontraron clientes</h3>
        <p className="text-muted-foreground text-sm max-w-xs mx-auto mt-2">
          Comienza agregando tu primer cliente para gestionar sus viajes.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
      <Table>
        <TableHeader className="bg-muted/50">
          <TableRow className="hover:bg-transparent border-gray-100">
            <TableHead className="text-[10px] uppercase font-bold tracking-widest px-6 py-4">Cliente</TableHead>
            <TableHead className="text-[10px] uppercase font-bold tracking-widest py-4">ID / RUT</TableHead>
            <TableHead className="text-[10px] uppercase font-bold tracking-widest py-4">Contacto</TableHead>
            <TableHead className="text-[10px] uppercase font-bold tracking-widest py-4">Fuente</TableHead>
            <TableHead className="text-[10px] uppercase font-bold tracking-widest py-4">Estado</TableHead>
            <TableHead className="text-[10px] uppercase font-bold tracking-widest py-4 text-right pr-6">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {clients.map((client) => (
            <TableRow key={client.id} className="group hover:bg-muted/30 transition-colors border-gray-50">
              <TableCell className="px-6 py-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm border border-primary/20 group-hover:bg-primary group-hover:text-white transition-all duration-300">
                    {client.firstName?.[0]}{client.lastName?.[0]}
                  </div>
                  <div>
                    <p className="font-bold text-navy text-sm leading-tight">{client.firstName} {client.lastName}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{client.nationality || "Nacionalidad no especificada"}</p>
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <div className="space-y-1">
                  <p className="text-xs font-medium text-navy">{client.rut || "-"}</p>
                  {client.passportNumber && (
                    <p className="text-[10px] text-muted-foreground">Pass: {client.passportNumber}</p>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-[10px] text-slate-600">
                    <Mail className="w-3 h-3 text-primary/60" />
                    <span>{client.email || "-"}</span>
                  </div>
                  <div className="flex items-center gap-2 text-[10px] text-slate-600">
                    <Phone className="w-3 h-3 text-primary/60" />
                    <span>{client.phone || "-"}</span>
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <Badge variant="outline" className="text-[9px] font-bold uppercase tracking-wider bg-slate-50 border-slate-200 text-slate-500">
                  {client.referralSource || "Directo"}
                </Badge>
              </TableCell>
              <TableCell>
                <Badge 
                  variant="outline" 
                  className={cn(
                    "text-[9px] font-bold uppercase tracking-wider border-none",
                    client.isActive ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-400"
                  )}
                >
                  {client.isActive ? "Activo" : "Inactivo"}
                </Badge>
              </TableCell>
              <TableCell className="text-right pr-6">
                <div className="flex justify-end gap-1">
                  <Button 
                  variant="ghost"
                   size="icon"
                   className="h-8 w-8 text-muted-foreground hover:text-navy hover:bg-navy/5"
                   onClick={() => onView(client)}
                   >
                    <Eye className="w-4 h-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/5"
                    onClick={() => onEdit(client)}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem 
                        className="text-destructive focus:text-destructive focus:bg-destructive/5"
                        onClick={() => onDelete(client.id)}
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Desactivar Cliente
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
