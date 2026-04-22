import React, { useState } from "react";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation } from "react-router-dom";

interface AppLayoutProps {
  children: React.ReactNode;
}

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
};

export default function AppLayout({ children }: AppLayoutProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();
  const title = pageTitles[location.pathname] || "ADE Travel";

  return (
    <div className="min-h-screen bg-[#F8F9FC]">
      <Sidebar isOpen={isMobileMenuOpen} onClose={() => setIsMobileMenuOpen(false)} />
      
      <div className="lg:pl-64 flex flex-col min-h-screen">
        <Header title={title} onMobileMenuOpen={() => setIsMobileMenuOpen(!isMobileMenuOpen)} />
        
        <main className="flex-1 p-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
            >
              {children}
            </motion.div>
          </AnimatePresence>
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
