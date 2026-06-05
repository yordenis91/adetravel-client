import React from "react";
import { Bell, Search, Menu, LogOut, Settings, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { GlobalSearch } from "@/components/dashboard/GlobalSearch";
// 🔥 1. Importamos tu hook de autenticación
import { useAuth } from "@/context/AuthContext";

interface HeaderProps {
  title: string;  
  onMobileMenuOpen?: () => void;
}

export function Header({ title, onMobileMenuOpen }: HeaderProps) {
  // 🔥 2. Extraemos la función logout del contexto
  const { logout } = useAuth();
  
  const { data: user } = useQuery({
    queryKey: ["current-user"],
    queryFn: () => api.get("/auth/me")
  });

  const handleLogout = () => {
    // 🔥 3. Usamos el método oficial (esto borra el 'ade_token' y limpia los estados)
    logout();
    
    // Opcionalmente puedes forzar la redirección si tu AuthContext no lo hace por ti:
    window.location.href = "/auth/login"; 
  };

  const initials = user?.fullName 
    ? user.fullName.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase() 
    : 'AD';

  return (
    <header className="h-16 bg-white border-b border-gray-100 flex items-center justify-between px-8 sticky top-0 z-40">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" className="lg:hidden" onClick={onMobileMenuOpen}>
          <Menu className="w-5 h-5" />
        </Button>
        <h2 className="text-lg font-playfair font-bold text-navy">{title}</h2>
      </div>

      <div className="flex items-center gap-6">
        {/* Buscador Global (Visual) */}
        {/* <div className="hidden md:flex items-center bg-muted rounded-full px-3 py-1.5 gap-2 w-64 border border-transparent focus-within:border-primary/30 transition-all"> */}
        <div className="hidden md:flex items-center w-64 z-50 relative">
          <GlobalSearch />
        </div>

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="relative text-muted-foreground hover:text-navy">
            <Bell className="w-5 h-5" />
            {/* Indicador de notificaciones */}
            <span className="absolute top-2 right-2 w-2 h-2 bg-primary rounded-full border-2 border-white"></span>
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-8 w-8 rounded-full ml-2">
                <Avatar className="h-8 w-8 border border-gray-100">
                  <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
                    {initials}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none text-navy font-bold">
                    {user?.fullName || "Cargando..."}
                  </p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {user?.email || ""}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="cursor-pointer gap-2">
                <User className="w-4 h-4" /> Mi Perfil
              </DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer gap-2">
                <Settings className="w-4 h-4" /> Configuración
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                className="text-destructive focus:text-destructive cursor-pointer gap-2 font-medium"
                onClick={handleLogout}
              >
                <LogOut className="w-4 h-4" /> Cerrar Sesión
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}