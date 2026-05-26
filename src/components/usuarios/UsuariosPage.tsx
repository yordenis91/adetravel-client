import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";
import { 
  Users, ShieldCheck, UserPlus, Search, Copy, Check, MoreVertical, Mail, Calendar, Info, Plus, UserX, UserCheck, Edit 
} from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { UserRoleBadge } from "./UserRoleBadge";
import { format } from "date-fns";
import { es } from "date-fns/locale";

const AGENCY_ROLES = [
  { value: "GERENTE", label: "Gerente" },
  { value: "FINANZAS", label: "Finanzas" },
  { value: "OPERACIONES", label: "Operaciones" },
  { value: "AGENTE_VENTAS", label: "Agente de Ventas" },
];

export default function UsuariosPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [copied, setCopied] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newUser, setNewUser] = useState({ fullName: "", email: "", password: "", role: "USUARIO", agencyRole: "AGENTE_VENTAS" });
  // Estados para Edición
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState({ id: "", fullName: "", email: "", newPassword: "" });

  const queryClient = useQueryClient();

  // 1. Obtener datos
  const { data: responseData = [], isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: () => api.get('/users?limit=100')
  });

  const { data: statsData } = useQuery({
    queryKey: ['users', 'stats'],
    queryFn: () => api.get('/users/stats')
  });

  const users = Array.isArray(responseData) ? responseData : (responseData as any)?.data || [];
  const backendStats = (statsData as any)?.data || statsData || { total: 0, administradores: 0, equipoOperativo: 0 };

  // 2. Mutación: Actualizar Rol
  const updateRoleMutation = useMutation({
    mutationFn: async ({ userId, agencyRole }: { userId: string, agencyRole: string }) => {
      return await api.patch(`/users/${userId}`, { agencyRole });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['users', 'stats'] });
      toast.success("Rol actualizado correctamente");
    },
    onError: (error: any) => toast.error(error.response?.data?.message || "Error al actualizar rol")
  });

  // 3. Mutación: Suspender / Reactivar (Tres puntitos)
  const toggleStatusMutation = useMutation({
    mutationFn: async ({ userId, isActive }: { userId: string, isActive: boolean }) => {
      return await api.patch(`/users/${userId}`, { isActive });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success(variables.isActive ? "Usuario reactivado" : "Acceso suspendido");
    },
    onError: (error: any) => toast.error(error.response?.data?.message || "No tienes permisos")
  });

  // 4. Mutación: Crear Nuevo Usuario
  const createUserMutation = useMutation({
    mutationFn: async (userData: typeof newUser) => {
      // Ajusta esta ruta según cómo tengas configurado tu router de auth en el backend
      return await api.post('/auth/invite', userData); 
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['users', 'stats'] });
      toast.success("Usuario creado e invitación enviada");
      setIsCreateModalOpen(false);
      setNewUser({ fullName: "", email: "", password: "", role: "USUARIO", agencyRole: "AGENTE_VENTAS" }); // Reset
    },
    onError: (error: any) => toast.error(error.response?.data?.message || "Error al crear usuario")
  });

  // 5. Mutación: Editar Usuario (Nombre, Correo, Contraseña)
  const editUserMutation = useMutation({
    mutationFn: async (data: typeof editingUser) => {
      const payload: any = { fullName: data.fullName, email: data.email };
      // Solo enviamos la contraseña si el administrador escribió una nueva
      if (data.newPassword.trim() !== "") {
        payload.password = data.newPassword;
      }
      return await api.patch(`/users/${data.id}`, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success("Perfil de usuario actualizado con éxito");
      setIsEditModalOpen(false);
    },
    onError: (error: any) => toast.error(error.response?.data?.message || "Error al actualizar perfil")
  });

  const handleEditUser = (e: React.FormEvent) => {
    e.preventDefault();
    editUserMutation.mutate(editingUser);
  };

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    createUserMutation.mutate(newUser);
  };

  const copySignupUrl = () => {
    const url = `${window.location.origin}/auth/app-signup`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    toast.success("Enlace copiado al portapapeles");
    setTimeout(() => setCopied(false), 2000);
  };

  const filteredUsers = (users as any[]).filter(user => 
    user.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-playfair font-bold text-navy">Gestión de Usuarios</h1>
          <p className="text-muted-foreground">Administra el equipo de ADE Travel y sus permisos de acceso.</p>
        </div>
        
        {/* 🔥 NUEVO: Modal de Creación de Usuario */}
        <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
          <DialogTrigger asChild>
            <Button className="bg-navy hover:bg-navy-dark text-white gap-2 font-bold shadow-md">
              <Plus className="w-4 h-4" /> Crear Usuario
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle className="text-xl font-playfair font-bold text-navy">Nuevo Miembro del Equipo</DialogTitle>
              <DialogDescription>
                Ingresa los datos del nuevo empleado. Se le enviará un correo de bienvenida.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateUser} className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-bold text-navy">Nombre Completo</label>
                <Input required placeholder="Ej: Ana López" value={newUser.fullName} onChange={e => setNewUser({...newUser, fullName: e.target.value})} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-navy">Correo Electrónico</label>
                <Input required type="email" placeholder="ana@adetravel.com" value={newUser.email} onChange={e => setNewUser({...newUser, email: e.target.value})} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-navy">Contraseña Temporal</label>
                <Input required type="password" placeholder="Min. 8 caracteres" value={newUser.password} onChange={e => setNewUser({...newUser, password: e.target.value})} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-navy">Rol en la Agencia</label>
                <Select value={newUser.agencyRole} onValueChange={val => setNewUser({...newUser, agencyRole: val})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {AGENCY_ROLES.map(r => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <DialogFooter className="mt-6">
                <Button type="button" variant="outline" onClick={() => setIsCreateModalOpen(false)}>Cancelar</Button>
                <Button type="submit" className="bg-navy text-white" disabled={createUserMutation.isPending}>
                  {createUserMutation.isPending ? "Creando..." : "Crear Usuario"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* 🔥 NUEVO: Modal de Edición de Usuario */}
        <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle className="text-xl font-playfair font-bold text-navy">Editar Perfil de Usuario</DialogTitle>
              <DialogDescription>
                Actualiza los datos personales o resetea la contraseña de este empleado.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleEditUser} className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-bold text-navy">Nombre Completo</label>
                <Input required value={editingUser.fullName} onChange={e => setEditingUser({...editingUser, fullName: e.target.value})} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-navy">Correo Electrónico</label>
                <Input required type="email" value={editingUser.email} onChange={e => setEditingUser({...editingUser, email: e.target.value})} />
              </div>
              <div className="space-y-2 relative">
                <label className="text-sm font-bold text-navy">Nueva Contraseña (Opcional)</label>
                <Input 
                  type="password" 
                  placeholder="Dejar en blanco para no cambiar" 
                  value={editingUser.newPassword} 
                  onChange={e => setEditingUser({...editingUser, newPassword: e.target.value})} 
                />
                <p className="text-[10px] text-muted-foreground mt-1">
                  Si escribes algo aquí, la contraseña anterior quedará invalidada.
                </p>
              </div>
              
              <DialogFooter className="mt-6">
                <Button type="button" variant="outline" onClick={() => setIsEditModalOpen(false)}>Cancelar</Button>
                <Button type="submit" className="bg-navy text-white" disabled={editUserMutation.isPending}>
                  {editUserMutation.isPending ? "Guardando..." : "Guardar Cambios"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Tarjetas de Estadísticas (Se mantienen igual) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* ... tus tarjetas actuales ... */}
      </div>

      <Card className="border-none shadow-sm bg-white overflow-hidden">
        <CardHeader className="pb-0 border-b border-slate-100 bg-slate-50/30">
          <div className="relative w-full md:w-96 pb-6">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Buscar por nombre o correo..." className="pl-10 bg-white" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent border-b border-slate-100">
                  <TableHead className="font-bold text-navy px-6 py-4">Usuario</TableHead>
                  <TableHead className="font-bold text-navy">Rol Sistema</TableHead>
                  <TableHead className="font-bold text-navy">Rol Agencia</TableHead>
                  <TableHead className="font-bold text-navy">Ingreso</TableHead>
                  <TableHead className="font-bold text-navy text-right px-6">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow><TableCell colSpan={5} className="h-16 text-center text-muted-foreground animate-pulse">Cargando usuarios...</TableCell></TableRow>
                ) : filteredUsers.length === 0 ? (
                  <TableRow><TableCell colSpan={5} className="h-32 text-center text-muted-foreground">No se encontraron usuarios.</TableCell></TableRow>
                ) : filteredUsers.map((user) => (
                  <TableRow key={user.id} className={cn("transition-colors border-b border-slate-50", !user.isActive && "bg-slate-50/50 opacity-60")}>
                    <TableCell className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <Avatar className={cn("w-10 h-10 border shadow-sm", !user.isActive ? "border-slate-300 grayscale" : "border-slate-200")}>
                          <AvatarFallback className={cn("font-bold text-white", user.isActive ? "bg-navy" : "bg-slate-400")}>
                            {user.fullName?.split(' ').map((n: any) => n[0]).join('').slice(0, 2).toUpperCase() || '??'}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col">
                          <span className="font-bold text-navy flex items-center gap-2">
                            {user.fullName} {!user.isActive && <span className="text-[10px] bg-red-100 text-red-600 px-2 rounded-full">Suspendido</span>}
                          </span>
                          <span className="text-xs text-muted-foreground flex items-center gap-1"><Mail className="w-3 h-3" /> {user.email}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell><UserRoleBadge role={user.role} type="system" /></TableCell>
                    <TableCell>
                      <Select 
                        value={user.agencyRole || "AGENTE_VENTAS"} 
                        onValueChange={(val) => updateRoleMutation.mutate({ userId: user.id, agencyRole: val })}
                        disabled={updateRoleMutation.isPending || !user.isActive}
                      >
                        <SelectTrigger className="w-[180px] h-8 text-xs font-medium bg-white border-slate-200">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {AGENCY_ROLES.map((role) => (
                            <SelectItem key={role.value} value={role.value} className="text-xs">{role.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <span className="text-xs text-muted-foreground flex items-center gap-1.5 font-medium">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        {user.createdAt ? format(new Date(user.createdAt), "d 'de' MMM, yyyy", { locale: es }) : 'N/A'}
                      </span>
                    </TableCell>
                    
                    {/* 🔥 NUEVO: Menú de Tres Puntitos Funcional */}
                    <TableCell className="px-6 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="hover:bg-navy/5 text-navy/50">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuLabel>Acciones de Usuario</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="cursor-pointer" 
                          onClick={() => {
                            setEditingUser({ id: user.id, fullName: user.fullName, email: user.email, newPassword: "" });
                            setIsEditModalOpen(true);
                          }}>
                            <Edit className="w-4 h-4 mr-2" /> Editar Perfil
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            className={cn("cursor-pointer font-medium", user.isActive ? "text-red-600 focus:text-red-700" : "text-emerald-600 focus:text-emerald-700")}
                            onClick={() => toggleStatusMutation.mutate({ userId: user.id, isActive: !user.isActive })}
                          >
                            {user.isActive ? (
                              <><UserX className="w-4 h-4 mr-2" /> Suspender Acceso</>
                            ) : (
                              <><UserCheck className="w-4 h-4 mr-2" /> Reactivar Acceso</>
                            )}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>

                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}