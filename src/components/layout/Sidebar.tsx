import React, { useEffect, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { 
  LayoutDashboard, 
  Users, 
  Building2, 
  FileText, 
  Calculator, 
  CheckCircle2, 
  CreditCard, 
  Ticket, 
  BarChart3, 
  ScrollText,
  LogOut,
  ChevronRight,
  UserCog,
  Settings,
  Mail
} from "lucide-react";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

const navSections = [
  {
    title: "Principal",
    items: [
      { name: "Panel Principal", icon: LayoutDashboard, path: "/dashboard" },
    ]
  },
  {
    title: "Gestión",
    items: [
      { name: "Clientes", icon: Users, path: "/clientes" },
      { name: "Proveedores", icon: Building2, path: "/proveedores" },
      { name: "Solicitudes", icon: FileText, path: "/solicitudes" },
    ]
  },
  {
    title: "Operaciones",
    items: [
      { name: "Cotizaciones", icon: Calculator, path: "/cotizaciones" },
      { name: "Confirmaciones", icon: CheckCircle2, path: "/confirmaciones" },
      { name: "Pagos", icon: CreditCard, path: "/pagos" },
      { name: "Vouchers", icon: Ticket, path: "/vouchers" },
    ]
  },
  {
    title: "Administración",
    items: [
      { name: "Usuarios", icon: UserCog, path: "/usuarios" },
      { name: "Configuración", icon: Settings, path: "/configuracion" },
      { name: "Plantillas de Email", icon: Mail, path: "/plantillas-email" },
    ]
  },
  {
    title: "Reportes",
    items: [
      { name: "Estadísticas", icon: BarChart3, path: "/reportes" },
      { name: "Bitácora", icon: ScrollText, path: "/bitacora" },
    ]
  }
];

// Special handling for icons since I want to be specific
const iconMap: Record<string, any> = {
  "Clientes": Users,
  "Proveedores": Building2,
  "Solicitudes": FileText,
  "Usuarios": UserCog,
  "Configuración": Settings,
};

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const location = useLocation();
  const { data: me } = useQuery({
    queryKey: ["current-user"],
    queryFn: () => api.get("/auth/me")
  });
  const navRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const scrollToActive = () => {
      if (navRef.current) {
        // Try to find by data-nav-path first as per plan
        let activeItem = navRef.current.querySelector(`[data-nav-path="${location.pathname}"]`);
        
        // Fallback to .active class if not found (handles dashboard/root cases)
        if (!activeItem) {
          activeItem = navRef.current.querySelector(".sidebar-nav-item.active");
        }

        if (activeItem) {
          activeItem.scrollIntoView({ block: "nearest", behavior: "smooth" });
        }
      }
    };

    // Use requestAnimationFrame to ensure the DOM has rendered the new state
    const rafId = requestAnimationFrame(() => {
      // Small delay sometimes needed for scrollArea-like components or complex transitions
      setTimeout(scrollToActive, 100);
    });

    return () => cancelAnimationFrame(rafId);
  }, [location.pathname]);

  // User is loaded via react-query (shared cache with Header)
  
  return (
    <aside className={cn(
      "fixed left-0 top-0 h-screen w-64 bg-navy text-sidebar-foreground flex flex-col z-50 transition-transform duration-300 ease-in-out lg:translate-x-0",
      isOpen ? "translate-x-0" : "-translate-x-full"
    )}>
      <div className="p-6">
        <div className="flex items-center gap-2 mb-8">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <span className="text-navy font-bold">A</span>
          </div>
          <h1 className="text-xl font-playfair font-bold tracking-tight">
            ADE <span className="text-primary italic">Travel</span>
          </h1>
        </div>

        <nav ref={navRef} className="space-y-8 overflow-y-auto max-h-[calc(100vh-200px)] hide-scrollbar">
          {navSections.map((section) => (
            <div key={section.title}>
              <h2 className="text-[10px] uppercase tracking-widest text-sidebar-foreground/40 font-bold mb-4 px-4">
                {section.title}
              </h2>
              <div className="space-y-1">
                {section.items.map((item) => {
                  const Icon = iconMap[item.name] || item.icon;
                  const isActive = location.pathname === item.path || (item.path === "/dashboard" && location.pathname === "/");
                  
                  return (
                    <Link
                      key={item.name}
                      to={item.path}
                      data-nav-path={item.path}
                      onClick={onClose}
                      className={cn(
                        "sidebar-nav-item",
                        isActive && "active"
                      )}
                    >
                      <Icon className={cn("w-4 h-4", isActive ? "text-primary" : "text-sidebar-foreground/60")} />
                      <span className="text-sm font-medium">{item.name}</span>
                      {isActive && <ChevronRight className="w-3 h-3 ml-auto text-primary" />}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
      </div>

      <div className="mt-auto p-6 border-t border-sidebar-border bg-navy-dark/50">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center text-primary text-[10px] font-bold">
            {me?.fullName ? me.fullName.split(' ').map((n: any) => n[0]).join('').slice(0, 2).toUpperCase() : 'AD'}
          </div>
          <div className="flex flex-col overflow-hidden">
            <span className="text-xs font-semibold truncate">{me?.fullName || 'Admin ADE'}</span>
            <span className="text-[10px] text-sidebar-foreground/50 truncate">
              {me?.role === 'ADMINISTRADOR' ? 'Administrador' : 'Agente'}
            </span>
          </div>
        </div>
        <Button 
          variant="ghost" 
          size="sm" 
          className="w-full justify-start gap-2 text-sidebar-foreground/60 hover:text-destructive hover:bg-destructive/10"
          onClick={() => {
            if (onClose) onClose();
            localStorage.removeItem("token");
            window.location.href = "/login";
          }}
        >
          <LogOut className="w-4 h-4" />
          <span className="text-xs">Cerrar Sesión</span>
        </Button>
      </div>
    </aside>
  );
}
