import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";
import { 
  Users, 
  ShieldCheck, 
  UserPlus, 
  Search, 
  Copy, 
  Check, 
  MoreVertical,
  Mail,
  Calendar,
  Info
} from "lucide-react";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  CardDescription 
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { toast } from "sonner";
import { UserRoleBadge } from "./UserRoleBadge";
import { format } from "date-fns";
import { es } from "date-fns/locale";

const AGENCY_ROLES = [
  { value: "GERENTE", label: "Gerente" },
  { value: "AGENTE_SENIOR", label: "Agente Senior" },
  { value: "AGENTE", label: "Agente" },
  { value: "ASISTENTE", label: "Asistente" },
];

export default function UsuariosPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [copied, setCopied] = useState(false);
  const queryClient = useQueryClient();

  const { data: users = [], isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: () => User.list()
  });

  useEffect(() => {
    async function loadMe() {
      try {
        const me = await User.me();
        setCurrentUser(me);
      } catch (error) {
        console.error("Error loading current user", error);
      }
    }
    loadMe();
  }, []);

  const updateRoleMutation = useMutation({
    mutationFn: async ({ userId, agencyRole }: { userId: string, agencyRole: string }) => {
      return await User.update(userId, { agencyRole });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success("Rol de agencia actualizado correctamente");
    },
    onError: (error) => {
      console.error(error);
      toast.error("Error al actualizar el rol");
    }
  });

  const copySignupUrl = () => {
    const url = `${window.location.origin}/auth/app-signup`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    toast.success("Enlace de registro copiado al portapapeles");
    setTimeout(() => setCopied(false), 2000);
  };

  const filteredUsers = (users as any[]).filter(user => 
    user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const stats = {
    total: users.length,
    admins: (users as any[]).filter(u => u.role === 'administrator').length,
    agents: (users as any[]).filter(u => u.agencyRole && u.agencyRole !== 'ASISTENTE').length
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-playfair font-bold text-navy">Gestión de Usuarios</h1>
          <p className="text-muted-foreground">Administra el equipo de ADE Travel y sus permisos de acceso.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-none shadow-sm bg-white">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-navy/5 rounded-xl text-navy">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Total Usuarios</p>
                <h3 className="text-2xl font-bold text-navy">{stats.total}</h3>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm bg-white">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gold/10 rounded-xl text-gold-dark">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Administradores</p>
                <h3 className="text-2xl font-bold text-navy">{stats.admins}</h3>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm bg-white">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-emerald-50 rounded-xl text-emerald-600">
                <UserPlus className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Equipo Operativo</p>
                <h3 className="text-2xl font-bold text-navy">{stats.agents}</h3>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-none shadow-sm bg-white overflow-hidden">
        <CardHeader className="pb-0 border-b border-slate-100 bg-slate-50/30">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6">
            <div className="relative w-full md:w-96">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input 
                placeholder="Buscar por nombre o correo..." 
                className="pl-10 bg-white"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
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
                  Array.from({ length: 3 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell colSpan={5} className="h-16 text-center text-muted-foreground animate-pulse">Cargando usuarios...</TableCell>
                    </TableRow>
                  ))
                ) : filteredUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-32 text-center text-muted-foreground">
                      No se encontraron usuarios que coincidan con la búsqueda.
                    </TableCell>
                  </TableRow>
                ) : filteredUsers.map((user) => (
                  <TableRow 
                    key={user.id} 
                    className={`hover:bg-slate-50/50 transition-colors border-b border-slate-50 ${currentUser?.id === user.id ? 'bg-gold/5 border-l-4 border-l-gold' : ''}`}
                  >
                    <TableCell className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <Avatar className="w-10 h-10 border border-slate-200 shadow-sm">
                          <AvatarFallback className="bg-navy text-white font-bold">
                            {user.full_name?.split(' ').map((n: any) => n[0]).join('').slice(0, 2).toUpperCase() || '??'}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col">
                          <span className="font-bold text-navy flex items-center gap-2">
                            {user.full_name}
                            {currentUser?.id === user.id && (
                              <span className="bg-gold text-[10px] text-white px-1.5 py-0.5 rounded font-bold uppercase tracking-tighter">Tú</span>
                            )}
                          </span>
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Mail className="w-3 h-3" /> {user.email}
                          </span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <UserRoleBadge role={user.role} type="system" />
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button variant="ghost" size="icon" className="w-6 h-6 text-muted-foreground">
                                <Info className="w-3.5 h-3.5" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p className="text-xs">El rol del sistema es administrado por la plataforma Buildy.</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Select 
                        value={user.agencyRole || "ASISTENTE"} 
                        onValueChange={(val) => updateRoleMutation.mutate({ userId: user.id, agencyRole: val })}
                        disabled={updateRoleMutation.isPending}
                      >
                        <SelectTrigger className="w-[180px] h-8 text-xs font-medium bg-white border-slate-200">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {AGENCY_ROLES.map((role) => (
                            <SelectItem key={role.value} value={role.value} className="text-xs">
                              {role.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <span className="text-xs text-muted-foreground flex items-center gap-1.5 font-medium">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        {user.created_at ? format(new Date(user.created_at), "d 'de' MMM, yyyy", { locale: es }) : 'N/A'}
                      </span>
                    </TableCell>
                    <TableCell className="px-6 text-right">
                      <Button variant="ghost" size="icon" className="hover:bg-navy/5 text-navy/50">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-navy text-white border-none shadow-lg overflow-hidden relative">
        <div className="absolute top-0 right-0 p-8 opacity-10">
          <UserPlus className="w-32 h-32" />
        </div>
        <CardContent className="p-8 relative z-10">
          <div className="flex flex-col md:flex-row items-center gap-8">
            <div className="flex-1">
              <h3 className="text-2xl font-playfair font-bold mb-2">Invitar nuevos miembros</h3>
              <p className="text-white/70 max-w-xl">
                Para añadir un nuevo usuario al equipo de ADE Travel, comparte el enlace de registro. 
                Una vez que se registren, aparecerán en esta lista y podrás asignarles su rol de agencia.
              </p>
            </div>
            <div className="flex flex-col gap-3 w-full md:w-auto">
              <div className="flex items-center gap-2 bg-white/10 p-1.5 rounded-lg border border-white/20">
                <code className="text-xs px-2 truncate w-48 md:w-64 font-mono text-primary">
                  {window.location.origin}/auth/app-signup
                </code>
                <Button 
                  size="sm" 
                  className={cn(
                    "bg-primary hover:bg-gold-dark text-navy font-bold gap-2 whitespace-nowrap",
                    copied && "bg-emerald-500 hover:bg-emerald-600 text-white"
                  )}
                  onClick={copySignupUrl}
                >
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  {copied ? "Copiado" : "Copiar Enlace"}
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
