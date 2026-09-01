import React, { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ShieldCheck, Save, Loader2, Search, UserCog, History, X } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface CatalogEntry {
  name: string;
  module: string;
  description: string;
}

interface RoleSummary {
  name: string;
  permissions: string[];
  isCustomized: boolean;
  userCount: number;
}

const ROLE_LABELS: Record<string, string> = {
  GERENTE: "Gerente",
  FINANZAS: "Finanzas",
  OPERACIONES: "Operaciones",
  AGENTE_VENTAS: "Agente de Ventas",
};

function unwrap<T>(response: unknown): T {
  return (response as any)?.data ?? (response as T);
}

export default function PermisosPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [draftPermissions, setDraftPermissions] = useState<string[]>([]);

  const { data: catalogRaw, isLoading: catalogLoading } = useQuery({
    queryKey: ["permissions", "catalog"],
    queryFn: () => api.get("/permissions/catalog"),
  });
  const catalog = unwrap<CatalogEntry[]>(catalogRaw) ?? [];

  const { data: rolesRaw, isLoading: rolesLoading, refetch: refetchRoles } = useQuery({
    queryKey: ["permissions", "roles"],
    queryFn: () => api.get("/permissions/roles"),
  });
  const roles = unwrap<RoleSummary[]>(rolesRaw) ?? [];

  const selectedRoleSummary = roles.find((r) => r.name === selectedRole);

  useEffect(() => {
    if (selectedRoleSummary) {
      setDraftPermissions(selectedRoleSummary.permissions);
    }
  }, [selectedRoleSummary?.name, selectedRoleSummary?.permissions.join(",")]);

  const catalogByModule = useMemo(() => {
    const grouped: Record<string, CatalogEntry[]> = {};
    for (const entry of catalog) {
      if (!grouped[entry.module]) grouped[entry.module] = [];
      grouped[entry.module].push(entry);
    }
    return grouped;
  }, [catalog]);

  const savePermissionsMutation = useMutation({
    mutationFn: (permissions: string[]) =>
      api.put(`/permissions/roles/${selectedRole}`, { permissions }),
    onSuccess: () => {
      toast({ title: "Permisos guardados", description: `Se actualizaron los permisos de ${ROLE_LABELS[selectedRole!] ?? selectedRole}.` });
      queryClient.invalidateQueries({ queryKey: ["permissions", "roles"] });
    },
    onError: (error) => {
      toast({ variant: "destructive", title: "No se pudo guardar", description: extractError(error) });
    },
  });

  const togglePermission = (name: string, checked: boolean) => {
    setDraftPermissions((prev) => (checked ? [...prev, name] : prev.filter((p) => p !== name)));
  };

  const isLoading = catalogLoading || rolesLoading;

  return (
    <div className="flex flex-col gap-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-playfair font-bold text-navy dark:text-white flex items-center gap-3">
          <ShieldCheck className="w-8 h-8 text-primary" />
          Gestión de Permisos
        </h1>
        <p className="text-muted-foreground mt-2">
          Administra qué puede hacer cada rol y otorga excepciones puntuales a usuarios específicos.
        </p>
      </div>

      <Tabs defaultValue="roles">
        <TabsList>
          <TabsTrigger value="roles" className="gap-2">
            <ShieldCheck className="w-4 h-4" /> Roles
          </TabsTrigger>
          <TabsTrigger value="usuarios" className="gap-2">
            <UserCog className="w-4 h-4" /> Permisos individuales
          </TabsTrigger>
          <TabsTrigger value="auditoria" className="gap-2">
            <History className="w-4 h-4" /> Auditoría
          </TabsTrigger>
        </TabsList>

        <TabsContent value="roles" className="mt-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              <Card className="lg:col-span-1 border-navy/10 shadow-lg h-fit">
                <CardHeader className="bg-navy/[0.02] border-b border-navy/5">
                  <CardTitle className="text-base font-playfair">Roles de Agencia</CardTitle>
                  <CardDescription>ADMINISTRADOR siempre tiene acceso total.</CardDescription>
                </CardHeader>
                <CardContent className="p-3 space-y-2">
                  {roles.map((role) => (
                    <button
                      key={role.name}
                      onClick={() => setSelectedRole(role.name)}
                      className={`w-full text-left p-3 rounded-lg transition-colors ${
                        selectedRole === role.name ? "bg-navy text-white shadow-md" : "bg-slate-50 hover:bg-slate-100"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-semibold text-sm">{ROLE_LABELS[role.name] ?? role.name}</span>
                        {role.isCustomized && (
                          <Badge
                            variant="outline"
                            className={selectedRole === role.name ? "border-white/30 text-white" : "border-primary/30 text-primary"}
                          >
                            Personalizado
                          </Badge>
                        )}
                      </div>
                      <p className={`text-xs mt-1 ${selectedRole === role.name ? "text-white/60" : "text-muted-foreground"}`}>
                        {role.permissions.length} permisos · {role.userCount} usuario(s)
                      </p>
                    </button>
                  ))}
                </CardContent>
              </Card>

              <div className="lg:col-span-3">
                {!selectedRole ? (
                  <Card className="h-96 flex items-center justify-center border-dashed">
                    <p className="text-muted-foreground">Selecciona un rol para ver y editar sus permisos.</p>
                  </Card>
                ) : (
                  <Card className="border-navy/10 shadow-lg">
                    <CardHeader className="bg-navy/[0.02] border-b border-navy/5 flex flex-row items-center justify-between">
                      <div>
                        <CardTitle className="text-xl font-playfair">{ROLE_LABELS[selectedRole] ?? selectedRole}</CardTitle>
                        <CardDescription>{draftPermissions.length} de {catalog.length} permisos activos</CardDescription>
                      </div>
                      <Button
                        onClick={() => savePermissionsMutation.mutate(draftPermissions)}
                        disabled={savePermissionsMutation.isPending}
                        className="gap-2 bg-navy hover:bg-navy-dark text-white"
                      >
                        {savePermissionsMutation.isPending ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Save className="w-4 h-4" />
                        )}
                        Guardar Cambios
                      </Button>
                    </CardHeader>
                    <CardContent className="pt-6 space-y-6 max-h-[600px] overflow-y-auto">
                      {Object.entries(catalogByModule).map(([module, entries]) => {
                        const activeCount = entries.filter((e) => draftPermissions.includes(e.name)).length;
                        return (
                          <div key={module}>
                            <div className="flex items-center justify-between mb-3">
                              <h3 className="font-bold text-navy dark:text-white">{module}</h3>
                              <span className="text-xs bg-slate-100 px-2 py-1 rounded font-medium text-slate-600">
                                {activeCount}/{entries.length}
                              </span>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                              {entries.map((entry) => (
                                <label
                                  key={entry.name}
                                  className="flex items-start gap-3 p-2 rounded-lg hover:bg-slate-50 cursor-pointer"
                                >
                                  <Checkbox
                                    checked={draftPermissions.includes(entry.name)}
                                    onCheckedChange={(checked) => togglePermission(entry.name, checked === true)}
                                    className="mt-0.5"
                                  />
                                  <div>
                                    <div className="text-sm font-semibold text-navy dark:text-white">{entry.name}</div>
                                    <div className="text-xs text-muted-foreground">{entry.description}</div>
                                  </div>
                                </label>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="usuarios" className="mt-6">
          <UserPermissionsPanel catalog={catalog} />
        </TabsContent>

        <TabsContent value="auditoria" className="mt-6">
          <AuditPanel />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function extractError(error: unknown): string {
  if (error instanceof Error) {
    try {
      const parsed = JSON.parse(error.message);
      if (parsed?.error) return parsed.error;
    } catch {
      if (error.message) return error.message;
    }
  }
  return "Ocurrió un error inesperado.";
}

interface UserSummary {
  id: string;
  fullName: string;
  email: string;
  role: string;
  agencyRole?: string | null;
}

interface UserPermissionsDetail {
  systemRole: string;
  agencyRole: string | null;
  rolePermissions: string[];
  directGrants: { permission: string; grantedAt: string; expiresAt: string | null }[];
  effectivePermissions: string[];
}

function UserPermissionsPanel({ catalog }: { catalog: CatalogEntry[] }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [newPermission, setNewPermission] = useState<string>("");

  const { data: usersRaw, isLoading: usersLoading } = useQuery({
    queryKey: ["permissions", "user-search", search],
    queryFn: () => api.get(`/users?limit=20${search ? `&search=${encodeURIComponent(search)}` : ""}`),
    enabled: search.length > 0,
  });
  const users = unwrap<UserSummary[]>(usersRaw) ?? [];

  const { data: detailRaw, isLoading: detailLoading } = useQuery({
    queryKey: ["permissions", "user-detail", selectedUserId],
    queryFn: () => api.get(`/permissions/users/${selectedUserId}`),
    enabled: !!selectedUserId,
  });
  const detail = unwrap<UserPermissionsDetail>(detailRaw);
  const selectedUser = users.find((u) => u.id === selectedUserId);

  const grantMutation = useMutation({
    mutationFn: (permission: string) => api.post(`/permissions/users/${selectedUserId}`, { permission }),
    onSuccess: () => {
      toast({ title: "Permiso otorgado" });
      setNewPermission("");
      queryClient.invalidateQueries({ queryKey: ["permissions", "user-detail", selectedUserId] });
    },
    onError: (error) => toast({ variant: "destructive", title: "No se pudo otorgar", description: extractError(error) }),
  });

  const revokeMutation = useMutation({
    mutationFn: (permission: string) => api.delete(`/permissions/users/${selectedUserId}/${permission}`),
    onSuccess: () => {
      toast({ title: "Permiso revocado" });
      queryClient.invalidateQueries({ queryKey: ["permissions", "user-detail", selectedUserId] });
    },
    onError: (error) => toast({ variant: "destructive", title: "No se pudo revocar", description: extractError(error) }),
  });

  const grantablePermissions = catalog.filter((c) => !detail?.rolePermissions.includes(c.name));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <Card className="lg:col-span-1 border-navy/10 shadow-lg h-fit">
        <CardHeader className="bg-navy/[0.02] border-b border-navy/5">
          <CardTitle className="text-base font-playfair">Buscar Usuario</CardTitle>
        </CardHeader>
        <CardContent className="p-4 space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Nombre o correo..."
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          {usersLoading && <p className="text-xs text-muted-foreground">Buscando...</p>}
          <div className="space-y-1 max-h-80 overflow-y-auto">
            {users.map((u) => (
              <button
                key={u.id}
                onClick={() => setSelectedUserId(u.id)}
                className={`w-full text-left p-2 rounded-lg text-sm ${
                  selectedUserId === u.id ? "bg-navy text-white" : "hover:bg-slate-50"
                }`}
              >
                <div className="font-semibold">{u.fullName}</div>
                <div className={`text-xs ${selectedUserId === u.id ? "text-white/60" : "text-muted-foreground"}`}>
                  {u.email}
                </div>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="lg:col-span-2">
        {!selectedUserId ? (
          <Card className="h-64 flex items-center justify-center border-dashed">
            <p className="text-muted-foreground">Busca y selecciona un usuario para ver sus permisos.</p>
          </Card>
        ) : detailLoading || !detail ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
          </div>
        ) : (
          <Card className="border-navy/10 shadow-lg">
            <CardHeader className="bg-navy/[0.02] border-b border-navy/5">
              <CardTitle className="text-lg font-playfair">{selectedUser?.fullName}</CardTitle>
              <CardDescription>
                {detail.systemRole === "ADMINISTRADOR"
                  ? "Administrador — acceso total, no requiere excepciones."
                  : `Rol de agencia: ${ROLE_LABELS[detail.agencyRole ?? ""] ?? detail.agencyRole ?? "Sin asignar"}`}
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              {detail.systemRole !== "ADMINISTRADOR" && (
                <>
                  <div>
                    <h4 className="text-sm font-bold text-navy dark:text-white mb-2">Otorgar permiso adicional</h4>
                    <div className="flex gap-2">
                      <Select value={newPermission} onValueChange={setNewPermission}>
                        <SelectTrigger className="flex-1">
                          <SelectValue placeholder="Selecciona un permiso..." />
                        </SelectTrigger>
                        <SelectContent>
                          {grantablePermissions.map((p) => (
                            <SelectItem key={p.name} value={p.name}>
                              {p.name} — {p.description}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button
                        disabled={!newPermission || grantMutation.isPending}
                        onClick={() => grantMutation.mutate(newPermission)}
                      >
                        Otorgar
                      </Button>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-bold text-navy dark:text-white mb-2">
                      Excepciones otorgadas ({detail.directGrants.length})
                    </h4>
                    {detail.directGrants.length === 0 ? (
                      <p className="text-sm text-muted-foreground">Este usuario no tiene permisos individuales.</p>
                    ) : (
                      <div className="space-y-2">
                        {detail.directGrants.map((g) => (
                          <div key={g.permission} className="flex items-center justify-between p-2 bg-slate-50 rounded-lg">
                            <div>
                              <span className="text-sm font-semibold">{g.permission}</span>
                              <span className="text-xs text-muted-foreground ml-2">
                                otorgado el {format(new Date(g.grantedAt), "d MMM yyyy", { locale: es })}
                                {g.expiresAt && ` · expira ${format(new Date(g.expiresAt), "d MMM yyyy", { locale: es })}`}
                              </span>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-destructive"
                              onClick={() => revokeMutation.mutate(g.permission)}
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              )}

              <div>
                <h4 className="text-sm font-bold text-navy dark:text-white mb-2">
                  Permisos efectivos ({detail.effectivePermissions.length})
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {detail.effectivePermissions.map((p) => (
                    <Badge key={p} variant="outline" className="text-xs">
                      {p}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

interface AuditEntry {
  id: string;
  action: string;
  roleName: string | null;
  targetUserId: string | null;
  permission: string | null;
  performedBy: string;
  createdAt: string;
}

const AUDIT_ACTION_LABELS: Record<string, string> = {
  ROLE_PERMISSIONS_UPDATED: "Permisos de rol actualizados",
  USER_PERMISSION_GRANTED: "Permiso otorgado a usuario",
  USER_PERMISSION_REVOKED: "Permiso revocado a usuario",
};

function AuditPanel() {
  const { data, isLoading } = useQuery({
    queryKey: ["permissions", "audit"],
    queryFn: () => api.get("/permissions/audit?limit=50"),
  });
  const entries = ((data as any)?.data ?? []) as AuditEntry[];

  return (
    <Card className="border-navy/10 shadow-lg">
      <CardHeader className="bg-navy/[0.02] border-b border-navy/5">
        <CardTitle className="text-lg font-playfair">Auditoría de Permisos</CardTitle>
        <CardDescription>Últimos cambios realizados sobre roles y permisos individuales.</CardDescription>
      </CardHeader>
      <CardContent className="pt-6">
        {isLoading ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="w-6 h-6 text-primary animate-spin" />
          </div>
        ) : entries.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-10">Aún no hay cambios registrados.</p>
        ) : (
          <div className="space-y-2 max-h-[500px] overflow-y-auto">
            {entries.map((entry) => (
              <div key={entry.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg text-sm">
                <div>
                  <span className="font-semibold text-navy">{AUDIT_ACTION_LABELS[entry.action] ?? entry.action}</span>
                  {entry.roleName && <span className="text-muted-foreground"> · rol {ROLE_LABELS[entry.roleName] ?? entry.roleName}</span>}
                  {entry.permission && <span className="text-muted-foreground"> · {entry.permission}</span>}
                </div>
                <span className="text-xs text-muted-foreground">
                  {format(new Date(entry.createdAt), "d MMM yyyy, HH:mm", { locale: es })}
                </span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
