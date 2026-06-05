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
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Edit, 
  Trash2, 
  Eye, 
  MoreVertical, 
  Phone, 
  Mail, 
  Building2,
  MapPin,
  CreditCard
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";

interface ProvidersTableProps {
  providers: any[];
  isLoading: boolean;
  onEdit: (provider: any) => void;
  onDelete: (id: string) => void;
  selectedIds?: Set<string>;
  onSelectOne?: (id: string) => void;
  onSelectAll?: () => void;
}

const businessTypeLabels: Record<string, string> = {
  RENT_A_CAR: "Arriendo de Autos",
  TOUR_OPERATOR: "Operador de Turismo",
  INSURANCE: "Seguros",
  AIRLINE: "Aerolínea",
  HOTEL: "Hotel",
  PRIVATE_HOUSE: "Casa Particular",
  PRIVATE_CAR: "Auto Particular",
  TOURIST_SERVICES: "Servicios Turísticos",
  RESTAURANT: "Restaurante",
  OTHER: "Otro",
};

const businessTypeColors: Record<string, string> = {
  RENT_A_CAR: "bg-orange-100 text-orange-700",
  TOUR_OPERATOR: "bg-violet-100 text-violet-700",
  INSURANCE: "bg-amber-100 text-amber-700",
  AIRLINE: "bg-blue-100 text-blue-700",
  HOTEL: "bg-emerald-100 text-emerald-700",
  PRIVATE_HOUSE: "bg-slate-100 text-slate-700",
  PRIVATE_CAR: "bg-slate-100 text-slate-700",
  TOURIST_SERVICES: "bg-indigo-100 text-indigo-700",
  RESTAURANT: "bg-red-100 text-red-700",
  OTHER: "bg-slate-100 text-slate-700",
};

const paymentMethodLabels: Record<string, string> = {
  CREDIT_CARD: "T. Crédito",
  DEBIT_CARD: "T. Débito",
  WEBPAY: "WebPay",
  TRANSFER: "Transferencia",
  CASH: "Efectivo",
  CHECK: "Cheque",
};

export function ProvidersTable({ providers, isLoading, onEdit, onDelete, selectedIds = new Set<string>(), onSelectOne, onSelectAll }: ProvidersTableProps) {
  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <Skeleton key={i} className="h-20 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  if (providers.length === 0) {
    return (
      <div className="text-center py-20 bg-white rounded-2xl border border-gray-100">
        <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
          <Building2 className="w-8 h-8 text-muted-foreground/30" />
        </div>
        <h3 className="text-lg font-playfair font-bold text-navy">No se encontraron proveedores</h3>
        <p className="text-muted-foreground text-sm max-w-xs mx-auto mt-2">
          Comienza agregando tu primer proveedor de servicios turísticos.
        </p>
      </div>
    );
  }

  const isAllSelected = providers.length > 0 && selectedIds.size === providers.length;
  const isSomeSelected = selectedIds.size > 0 && selectedIds.size < providers.length;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
      <Table>
        <TableHeader className="bg-muted/50">
          <TableRow className="hover:bg-transparent border-gray-100">
            <TableHead className="w-10 px-4 py-4">
              <Checkbox
                checked={isAllSelected}
                onCheckedChange={onSelectAll}
                className={cn(
                  "rounded-sm border-slate-300 data-[state=checked]:bg-primary data-[state=checked]:border-primary",
                  isSomeSelected && "data-[state=unchecked]:bg-slate-100 data-[state=unchecked]:border-slate-300"
                )}
                data-state={isAllSelected ? "checked" : (isSomeSelected ? "indeterminate" : "unchecked")}
              />
            </TableHead>
            <TableHead className="text-[10px] uppercase font-bold tracking-widest px-6 py-4">Proveedor</TableHead>
            <TableHead className="text-[10px] uppercase font-bold tracking-widest py-4">Tipo</TableHead>
            <TableHead className="text-[10px] uppercase font-bold tracking-widest py-4">Contacto</TableHead>
            <TableHead className="text-[10px] uppercase font-bold tracking-widest py-4">País/Ciudad</TableHead>
            <TableHead className="text-[10px] uppercase font-bold tracking-widest py-4">Método Pago</TableHead>
            <TableHead className="text-[10px] uppercase font-bold tracking-widest py-4">Estado</TableHead>
            <TableHead className="text-[10px] uppercase font-bold tracking-widest py-4 text-right pr-6">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {providers.map((provider) => (
            <TableRow key={provider.id} className="group hover:bg-muted/30 transition-colors border-gray-50">
              <TableCell className="px-4 py-4">
                <Checkbox
                  checked={selectedIds.has(provider.id)}
                  onCheckedChange={() => onSelectOne && onSelectOne(provider.id)}
                  className="rounded-sm border-slate-300 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                />
              </TableCell>
              <TableCell className="px-6 py-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-bold text-sm border border-primary/20 group-hover:bg-primary group-hover:text-white transition-all duration-300">
                    {provider.name?.[0]}
                  </div>
                  <div>
                    <p className="font-bold text-navy text-sm leading-tight">{provider.name}</p>
                    {provider.fantasyName && (
                      <p className="text-[10px] text-muted-foreground mt-0.5 italic">{provider.fantasyName}</p>
                    )}
                    <p className="text-[9px] text-muted-foreground mt-0.5">{provider.rut || "Sin RUT"}</p>
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <Badge 
                  variant="secondary" 
                  className={cn(
                    "text-[9px] font-bold uppercase tracking-wider border-none",
                    businessTypeColors[provider.businessType] || "bg-slate-100 text-slate-700"
                  )}
                >
                  {businessTypeLabels[provider.businessType] || "Otro"}
                </Badge>
              </TableCell>
              <TableCell>
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-[10px] text-slate-600">
                    <Mail className="w-3 h-3 text-primary/60" />
                    <span>{provider.email || "-"}</span>
                  </div>
                  <div className="flex items-center gap-2 text-[10px] text-slate-600">
                    <Phone className="w-3 h-3 text-primary/60" />
                    <span>{provider.phone || "-"}</span>
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2 text-[10px] text-slate-600">
                  <MapPin className="w-3 h-3 text-primary/60" />
                  <span>{provider.city ? `${provider.city}, ${provider.country}` : provider.country || "-"}</span>
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2 text-[10px] text-slate-600">
                  <CreditCard className="w-3 h-3 text-primary/60" />
                  <span>{paymentMethodLabels[provider.paymentMethod] || "-"}</span>
                </div>
              </TableCell>
              <TableCell>
                <Badge 
                  variant="outline" 
                  className={cn(
                    "text-[9px] font-bold uppercase tracking-wider border-none",
                    provider.isActive ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-400"
                  )}
                >
                  {provider.isActive ? "Activo" : "Inactivo"}
                </Badge>
              </TableCell>
              <TableCell className="text-right pr-6">
                <div className="flex justify-end gap-1">
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-navy hover:bg-navy/5">
                    <Eye className="w-4 h-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/5"
                    onClick={() => onEdit(provider)}
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
                        onClick={() => onDelete(provider.id)}
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Desactivar Proveedor
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
