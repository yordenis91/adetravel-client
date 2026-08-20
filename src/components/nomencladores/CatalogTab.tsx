import React, { useState } from "react";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Edit2, Power, PowerOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  CatalogResource, useCatalog, useCreateCatalogItem, useUpdateCatalogItem, useDeleteCatalogItem,
} from "@/hooks/useCatalogs";

interface CatalogTabProps {
  resource: CatalogResource;
  label: string;
  /** Si el catálogo tiene padre (City/Region → Country, CarModel → CarBrand). */
  parent?: { resource: CatalogResource; field: "countryId" | "carBrandId"; label: string };
}

export function CatalogTab({ resource, label, parent }: CatalogTabProps) {
  const { toast } = useToast();
  const [parentFilter, setParentFilter] = useState<string>("all");
  const { data: items, isLoading } = useCatalog(resource, parentFilter === "all" ? undefined : parentFilter, parent?.field);
  const { data: parentItems } = useCatalog(parent?.resource ?? "countries", undefined, undefined);

  const createMutation = useCreateCatalogItem(resource);
  const updateMutation = useUpdateCatalogItem(resource);
  const deleteMutation = useDeleteCatalogItem(resource);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [name, setName] = useState("");
  const [parentValue, setParentValue] = useState("");

  const getParentName = (item: any) => {
    if (!parent) return null;
    const p = (parentItems || []).find((pi: any) => pi.id === item[parent.field]);
    return p?.name || "—";
  };

  const openCreate = () => {
    setEditingItem(null);
    setName("");
    setParentValue("");
    setDialogOpen(true);
  };

  const openEdit = (item: any) => {
    setEditingItem(item);
    setName(item.name);
    setParentValue(parent ? item[parent.field] || "" : "");
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!name.trim()) return;
    if (parent && !parentValue) {
      toast({ variant: "destructive", title: `Selecciona ${parent.label}` });
      return;
    }
    const payload: Record<string, unknown> = { name: name.trim() };
    if (parent) payload[parent.field] = parentValue;

    try {
      if (editingItem) {
        await updateMutation.mutateAsync({ id: editingItem.id, ...payload });
        toast({ title: `${label} actualizado` });
      } else {
        await createMutation.mutateAsync(payload);
        toast({ title: `${label} creado` });
      }
      setDialogOpen(false);
    } catch (err: any) {
      toast({ variant: "destructive", title: "Error al guardar", description: err?.message });
    }
  };

  const handleToggleActive = async (item: any) => {
    if (item.isActive) {
      await deleteMutation.mutateAsync(item.id);
    } else {
      await updateMutation.mutateAsync({ id: item.id, isActive: true });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        {parent ? (
          <Select value={parentFilter} onValueChange={setParentFilter}>
            <SelectTrigger className="w-56 h-9 bg-slate-50 border-slate-100 text-xs">
              <SelectValue placeholder={`Filtrar por ${parent.label}`} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos ({parent.label})</SelectItem>
              {(parentItems || []).map((p: any) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
            </SelectContent>
          </Select>
        ) : <div />}
        <Button onClick={openCreate} size="sm" className="gap-2 text-xs font-bold uppercase tracking-wider">
          <Plus className="w-4 h-4" /> Agregar
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-2">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-10 w-full rounded-lg" />)}</div>
      ) : (
        <div className="rounded-xl border border-slate-100 overflow-hidden">
          <Table>
            <TableHeader className="bg-slate-50/50">
              <TableRow>
                <TableHead className="text-xs font-bold uppercase">Nombre</TableHead>
                {parent && <TableHead className="text-xs font-bold uppercase">{parent.label}</TableHead>}
                <TableHead className="text-xs font-bold uppercase">Estado</TableHead>
                <TableHead className="text-right text-xs font-bold uppercase">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.length === 0 && (
                <TableRow><TableCell colSpan={parent ? 4 : 3} className="text-center text-xs text-muted-foreground py-8">Sin registros.</TableCell></TableRow>
              )}
              {items.map((item: any) => (
                <TableRow key={item.id}>
                  <TableCell className="text-sm font-medium">{item.name}</TableCell>
                  {parent && <TableCell className="text-sm text-muted-foreground">{getParentName(item)}</TableCell>}
                  <TableCell>
                    <Badge variant="outline" className={item.isActive ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-slate-50 text-slate-500 border-slate-200"}>
                      {item.isActive ? "Activo" : "Inactivo"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(item)}>
                      <Edit2 className="w-3.5 h-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleToggleActive(item)}>
                      {item.isActive ? <PowerOff className="w-3.5 h-3.5 text-rose-500" /> : <Power className="w-3.5 h-3.5 text-emerald-500" />}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingItem ? `Editar ${label}` : `Agregar ${label}`}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {parent && (
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{parent.label} *</label>
                <Select value={parentValue} onValueChange={setParentValue}>
                  <SelectTrigger className="bg-slate-50 border-slate-100"><SelectValue placeholder={`Selecciona ${parent.label}`} /></SelectTrigger>
                  <SelectContent>
                    {(parentItems || []).map((p: any) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Nombre *</label>
              <Input value={name} onChange={(e) => setName(e.target.value)} className="bg-slate-50 border-slate-100" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave}>Guardar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
