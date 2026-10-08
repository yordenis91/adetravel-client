import React, { useState } from "react";
import { getErrorMessage } from "@/lib/api";
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
import { Switch } from "@/components/ui/switch";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Edit2, Power, PowerOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  CatalogResource, useCatalog, useCatalogDependents, useCreateCatalogItem, useUpdateCatalogItem, useDeleteCatalogItem,
} from "@/hooks/useCatalogs";

interface CatalogTabProps {
  resource: CatalogResource;
  label: string;
  /** Si el catálogo tiene padre (City/Region → Country, CarModel → CarBrand). */
  parent?: { resource: CatalogResource; field: "countryId" | "carBrandId"; label: string };
  /** Nombre en plural de lo que cuelga de este catálogo (País → "ciudades y regiones"), para los avisos. */
  childrenLabel?: string;
}

export function CatalogTab({ resource, label, parent, childrenLabel }: CatalogTabProps) {
  const { toast } = useToast();
  const [parentFilter, setParentFilter] = useState<string>("all");
  // Se listan también los inactivos: si no, un registro dado de baja desaparecía sin poder reactivarse
  // ni explicar por qué "ya existe" al volver a crearlo.
  const [showInactive, setShowInactive] = useState(true);
  const { data: allItems, isLoading } = useCatalog(resource, parentFilter === "all" ? undefined : parentFilter, parent?.field, true);
  const items = showInactive ? allItems : allItems.filter((i) => i.isActive);
  const inactiveCount = allItems.filter((i) => !i.isActive).length;
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
      toast({ variant: "destructive", title: "Error al guardar", description: getErrorMessage(err, "Intenta nuevamente.") });
    }
  };

  // Desactivar/reactivar siempre pasa por una confirmación; el aviso de dependientes viene de la API.
  const [confirm, setConfirm] = useState<{ item: any; action: "disable" | "enable" } | null>(null);
  const dependents = useCatalogDependents(resource, confirm?.action === "disable" && childrenLabel ? confirm.item.id : null);
  const dependentsText = dependents?.items.map((d) => `${d.count} ${d.count === 1 ? d.singular : d.label}`).join(" y ");

  const handleConfirm = async () => {
    if (!confirm) return;
    const { item, action } = confirm;
    try {
      if (action === "disable") {
        await deleteMutation.mutateAsync({ id: item.id, cascade: (dependents?.total ?? 0) > 0 });
        toast({ title: `${label} desactivado`, description: dependentsText ? `También se desactivaron ${dependentsText}.` : undefined });
      } else {
        await updateMutation.mutateAsync({ id: item.id, isActive: true, cascade: !!childrenLabel });
        toast({ title: `${label} reactivado` });
      }
    } catch (err: any) {
      toast({ variant: "destructive", title: action === "disable" ? "No se pudo desactivar" : "No se pudo reactivar", description: getErrorMessage(err, "Intenta nuevamente.") });
    } finally {
      setConfirm(null);
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
        <div className="flex items-center gap-4">
          {inactiveCount > 0 && (
            <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer">
              <Switch checked={showInactive} onCheckedChange={setShowInactive} aria-label="Mostrar inactivos" />
              Mostrar inactivos ({inactiveCount})
            </label>
          )}
        <Button onClick={openCreate} size="sm" className="gap-2 text-xs font-bold uppercase tracking-wider">
          <Plus className="w-4 h-4" /> Agregar
        </Button>
        </div>
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
                    <Button variant="ghost" size="icon" aria-label="Editar elemento" className="h-8 w-8" onClick={() => openEdit(item)}>
                      <Edit2 className="w-3.5 h-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" aria-label={item.isActive ? "Desactivar" : "Activar"} className="h-8 w-8" onClick={() => setConfirm({ item, action: item.isActive ? "disable" : "enable" })}>
                      {item.isActive ? <PowerOff className="w-3.5 h-3.5 text-rose-500" /> : <Power className="w-3.5 h-3.5 text-emerald-500" />}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <AlertDialog open={!!confirm} onOpenChange={(o) => { if (!o) setConfirm(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirm?.action === "disable" ? `¿Desactivar ${label.toLowerCase()} "${confirm.item.name}"?` : `¿Reactivar ${label.toLowerCase()} "${confirm?.item.name}"?`}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirm?.action === "disable" ? (
                <>
                  Dejará de aparecer como sugerencia en los formularios. Los registros ya guardados no cambian.
                  {dependentsText && <strong className="block mt-2 text-rose-600">Tiene {dependentsText} activas asociadas: también se desactivarán.</strong>}
                </>
              ) : (
                <>
                  Volverá a aparecer en los formularios.
                  {childrenLabel && <span className="block mt-2">También se reactivarán sus {childrenLabel}.</span>}
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirm} disabled={confirm?.action === "disable" && !!childrenLabel && !dependents}>{confirm?.action === "disable" ? "Desactivar" : "Reactivar"}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

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
