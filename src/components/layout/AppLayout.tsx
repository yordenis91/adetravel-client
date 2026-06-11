import React, { useState, Suspense } from "react";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { useLocation, Outlet } from "react-router-dom";
import { Loader2 } from "lucide-react";

const pageTitles: Record<string, string> = {
  "/": "Panel Principal",
  "/dashboard": "Panel Principal",
  "/clientes": "Gestión de Clientes",
  "/proveedores": "Proveedores de Servicios",
  "/solicitudes": "Solicitudes de Viaje",
  "/cotizaciones": "Cotizaciones",
  "/confirmaciones": "Confirmaciones de Reserva",
  "/pagos": "Registro de Pagos",
  "/vouchers": "Generación de Vouchers",
  "/reportes": "Reportes y Estadísticas",
  "/bitacora": "Bitácora de Operaciones",
  "/tareas": "Gestión de Tareas",
};

export default function AppLayout() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();
  
  const getPageTitle = (pathname: string) => {
    if (pageTitles[pathname]) return pageTitles[pathname];
    if (pathname.startsWith("/clientes/")) return "Historial del Cliente";
    return "ADE Travel";
  };

  const title = getPageTitle(location.pathname);

  return (
    <div className="min-h-screen bg-[#F8F9FC]">
      <Sidebar isOpen={isMobileMenuOpen} onClose={() => setIsMobileMenuOpen(false)} />
      
      <div className="lg:pl-64 flex flex-col min-h-screen">
        <Header title={title} onMobileMenuOpen={() => setIsMobileMenuOpen(!isMobileMenuOpen)} />
        
        <main className="flex-1 p-8 flex flex-col relative overflow-hidden">
          <Suspense 
            fallback={
              <div className="flex-1 flex flex-col items-center justify-center min-h-[60vh] gap-4">
                <Loader2 className="w-10 h-10 text-primary animate-spin" />
                <p className="text-muted-foreground animate-pulse font-medium">Cargando módulo...</p>
              </div>
            }
          >
            <div className="flex-1 overflow-y-auto">
              <Outlet />
            </div>
          </Suspense>
        </main>

        <footer className="px-8 py-6 border-t border-gray-100 text-center">
          <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">
            © {new Date().getFullYear()} ADE Travel — Luxury Travel Management System
          </p>
        </footer>
      </div>

      {/* Mobile Backdrop */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-navy/40 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
    </div>
  );
}
