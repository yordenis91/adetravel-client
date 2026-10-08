import React, { useEffect, useRef, useState } from "react";
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
  ChevronDown,
  UserCog,
  Settings,
  Mail,
  ClipboardList,
  Package2,
  BookOpen,
  ShieldCheck
} from "lucide-react";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";

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
      { name: "Clientes", icon: Users, path: "/clientes", permission: "VIEW_CLIENTS" },
      { name: "Proveedores", icon: Building2, path: "/proveedores", permission: "VIEW_PROVIDERS" },
      { name: "Solicitudes", icon: FileText, path: "/solicitudes", permission: "VIEW_REQUESTS" },
      { name: "Tareas", icon: ClipboardList, path: "/tareas" },
    ]
  },
  {
    title: "Operaciones",
    items: [
      { name: "Servicios", icon: Package2, path: "/servicios", permission: "VIEW_SERVICES" },
      { name: "Cotizaciones", icon: Calculator, path: "/cotizaciones", permission: "VIEW_QUOTATIONS" },
      { name: "Confirmaciones", icon: CheckCircle2, path: "/confirmaciones", permission: "VIEW_CONFIRMATIONS" },
      { name: "Pagos", icon: CreditCard, path: "/pagos", permission: "VIEW_PAYMENTS" },
      { name: "Vouchers", icon: Ticket, path: "/vouchers", permission: "VIEW_VOUCHERS" },
    ]
  },
  {
    title: "Administración",
    items: [
      { name: "Usuarios", icon: UserCog, path: "/usuarios", permission: "MANAGE_USERS" },
      { name: "Configuración", icon: Settings, path: "/configuracion", permission: "MANAGE_SYSTEM_CONFIG" },
      { name: "Plantillas de Email", icon: Mail, path: "/plantillas-email", permission: "MANAGE_TEMPLATES" },
      { name: "Permisos", icon: ShieldCheck, path: "/permisos", permission: "MANAGE_PERMISSIONS" },
      { name: "Nomencladores", icon: BookOpen, path: "/nomencladores", permission: "VIEW_CATALOGS" },
    ]
  },
  {
    title: "Reportes",
    items: [
      { name: "Estadísticas", icon: BarChart3, path: "/reportes", permission: "VIEW_REPORTS" },
      { name: "Bitácora", icon: ScrollText, path: "/bitacora", permission: "VIEW_LOGS" },
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
  "Tareas": ClipboardList,
};

const AGENCY_ROLE_LABELS: Record<string, string> = {
  GERENTE: "Gerente",
  FINANZAS: "Finanzas",
  OPERACIONES: "Operaciones",
  AGENTE_VENTAS: "Agente de ventas",
};

const COLLAPSED_KEY = "ade.sidebar.collapsed";

/**
 * Secciones plegadas. Se recuerdan por navegador; la primera vez, en pantallas de menos de 1000 px
 * de alto, Administración y Reportes empiezan plegadas para que el resto quepa sin desplazarse.
 */
function loadCollapsed(): Record<string, boolean> {
  try {
    const saved = localStorage.getItem(COLLAPSED_KEY);
    if (saved) return JSON.parse(saved);
  } catch {
    /* almacenamiento no disponible: valores por defecto */
  }
  const short = typeof window !== "undefined" && window.innerHeight < 1000;
  return short ? { "Administración": true, "Reportes": true } : {};
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>(loadCollapsed);
  const toggleSection = (title: string) => {
    setCollapsed((prev) => {
      const next = { ...prev, [title]: !prev[title] };
      try {
        localStorage.setItem(COLLAPSED_KEY, JSON.stringify(next));
      } catch {
        /* sin almacenamiento: el estado vale para esta sesión */
      }
      return next;
    });
  };
  const location = useLocation();
  const { logout, hasPermission } = useAuth();
  const { data: meResponse } = useQuery({
    queryKey: ["current-user"],
    queryFn: () => api.get("/auth/me")
  });
  // El backend devuelve { data: {...} }; sin este unwrap, el nombre y el
  // rol al pie del sidebar nunca se actualizaban (mismo bug que había en Header.tsx).
  const me: any = (meResponse as any)?.data ?? meResponse;
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
      {/* El menú ocupa todo el alto libre entre el logo y el pie, con desplazamiento visible: antes
          tenía un alto fijo (100vh - 200px) y en 1440×900 quedaban 7 opciones fuera de la vista. */}
      <div className="px-6 pt-6 flex-1 min-h-0 flex flex-col">
        <div className="flex items-center mb-6 shrink-0">
          <img
            src="/cropped-logo-png-2.png"
            alt="ADE Travel Logo"
            className="h-10 sm:h-12 w-auto object-contain drop-shadow-sm"
          />
        </div>

        <nav ref={navRef} aria-label="Menú principal" className="flex-1 min-h-0 space-y-5 overflow-y-auto pb-4 pr-1 sidebar-scroll">
          {navSections.map((section) => {
            const visibleItems = section.items.filter((item) => !item.permission || hasPermission(item.permission));
            // Sin opciones visibles para este usuario, la sección no se muestra (antes quedaba el título vacío).
            if (visibleItems.length === 0) return null;
            const isActiveIn = (path: string) => location.pathname === path || (path === "/dashboard" && location.pathname === "/");
            const containsActive = visibleItems.some((item) => isActiveIn(item.path));
            // Las secciones de una sola opción no se pliegan; la de la pantalla actual siempre está abierta.
            const collapsible = visibleItems.length > 1;
            const isCollapsed = collapsible && !containsActive && !!collapsed[section.title];
            const listId = `sidebar-section-${section.title.normalize("NFD").replace(/[^a-zA-Z]/g, "").toLowerCase()}`;
            return (
            <div key={section.title}>
              {collapsible ? (
                <h2 className="mb-1">
                  <button
                    type="button"
                    onClick={() => toggleSection(section.title)}
                    aria-expanded={!isCollapsed}
                    aria-controls={listId}
                    className="w-full flex items-center justify-between px-4 py-1 rounded-md text-[10px] uppercase tracking-widest text-sidebar-foreground/40 font-bold hover:text-sidebar-foreground/70 transition-colors"
                  >
                    <span>{section.title}</span>
                    <span className="flex items-center gap-1.5">
                      {isCollapsed && <span className="normal-case tracking-normal font-medium">{visibleItems.length}</span>}
                      <ChevronDown className={cn("w-3 h-3 transition-transform", isCollapsed && "-rotate-90")} aria-hidden="true" />
                    </span>
                  </button>
                </h2>
              ) : (
                <h2 className="text-[10px] uppercase tracking-widest text-sidebar-foreground/40 font-bold mb-2 px-4">
                  {section.title}
                </h2>
              )}
              <div id={listId} className="space-y-1" hidden={isCollapsed}>
                {visibleItems
                  .map((item) => {
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
            );
          })}
        </nav>
      </div>

      <div className="shrink-0 px-6 py-4 border-t border-sidebar-border bg-navy-dark/50">
        {/* Pie compacto (una fila): deja más alto libre al menú. */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 shrink-0 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center text-primary text-[10px] font-bold">
            {me?.fullName ? me.fullName.split(' ').map((n: any) => n[0]).join('').slice(0, 2).toUpperCase() : 'AD'}
          </div>
          <div className="flex flex-col overflow-hidden flex-1">
            <span className="text-xs font-semibold truncate">{me?.fullName || 'Admin ADE'}</span>
            <span className="text-[10px] text-sidebar-foreground/50 truncate">
              {me?.role === 'ADMINISTRADOR' ? 'Administrador' : (AGENCY_ROLE_LABELS[me?.agencyRole ?? ''] ?? 'Usuario')}
            </span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Cerrar sesión"
            title="Cerrar sesión"
            className="h-8 w-8 shrink-0 text-sidebar-foreground/60 hover:text-destructive hover:bg-destructive/10"
            onClick={() => {
              if (onClose) onClose();
              logout();
              window.location.href = "/auth/login";
            }}
          >
            <LogOut className="w-4 h-4" aria-hidden="true" />
          </Button>
        </div>
        <div className="mt-2 flex items-center justify-center gap-3 text-[10px] text-sidebar-foreground/40">
          <Link to="/legal/terminos-de-servicio" className="hover:text-sidebar-foreground/70 transition-colors">
            Términos
          </Link>
          <span>·</span>
          <Link to="/legal/politica-de-privacidad" className="hover:text-sidebar-foreground/70 transition-colors">
            Privacidad
          </Link>
        </div>
      </div>
    </aside>
  );
}
