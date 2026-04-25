import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HelmetProvider } from "react-helmet-async";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import Clients from "./pages/Clients";
import Providers from "./pages/Providers";
import Requests from "./pages/Requests";
import Quotations from "./pages/Quotations";
import Confirmaciones from "./pages/Confirmaciones";
import Payments from "./pages/Payments";
import Vouchers from "./pages/Vouchers";
import Reportes from "./pages/Reportes";
import Bitacora from "./pages/Bitacora";
import Usuarios from "./pages/Usuarios";
import Configuracion from "./pages/Configuracion";
import EmailTemplates from "./pages/EmailTemplates";
import Login from "./pages/Login";
import Register from "./pages/Register";
import NotFound from "./pages/NotFound";
import { BrandingBadge } from "./components/BrandingBadge";

const queryClient = new QueryClient();

const App = () => (
  <HelmetProvider>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/clientes" element={<Clients />} />
            <Route path="/proveedores" element={<Providers />} />
            <Route path="/solicitudes" element={<Requests />} />
            <Route path="/cotizaciones" element={<Quotations />} />
            <Route path="/confirmaciones" element={<Confirmaciones />} />
            <Route path="/pagos" element={<Payments />} />
            <Route path="/vouchers" element={<Vouchers />} />
            <Route path="/reportes" element={<Reportes />} />
            <Route path="/bitacora" element={<Bitacora />} />
            <Route path="/usuarios" element={<Usuarios />} />
            <Route path="/configuracion" element={<Configuracion />} />
            <Route path="/plantillas-email" element={<EmailTemplates />} />
            <Route path="/auth/login" element={<Login />} />
            <Route path="/auth/register" element={<Register />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
        <BrandingBadge />
      </TooltipProvider>
    </QueryClientProvider>
  </HelmetProvider>
);

export default App;
