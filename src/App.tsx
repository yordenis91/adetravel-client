import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HelmetProvider } from "react-helmet-async";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/context/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
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
        <AuthProvider>
          <BrowserRouter>
            <Routes>
              {/* Redirección de raíz a dashboard */}
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              
              {/* Rutas públicas */}
              <Route path="/auth/login" element={<Login />} />
              <Route path="/auth/register" element={<Register />} />
              
              {/* Rutas protegidas */}
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/clientes"
                element={
                  <ProtectedRoute>
                    <Clients />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/proveedores"
                element={
                  <ProtectedRoute>
                    <Providers />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/solicitudes"
                element={
                  <ProtectedRoute>
                    <Requests />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/cotizaciones"
                element={
                  <ProtectedRoute>
                    <Quotations />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/confirmaciones"
                element={
                  <ProtectedRoute>
                    <Confirmaciones />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/pagos"
                element={
                  <ProtectedRoute>
                    <Payments />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/vouchers"
                element={
                  <ProtectedRoute>
                    <Vouchers />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/reportes"
                element={
                  <ProtectedRoute>
                    <Reportes />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/bitacora"
                element={
                  <ProtectedRoute>
                    <Bitacora />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/usuarios"
                element={
                  <ProtectedRoute allowedRoles={["ADMINISTRADOR"]}>
                    <Usuarios />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/configuracion"
                element={
                  <ProtectedRoute allowedRoles={["ADMINISTRADOR"]}>
                    <Configuracion />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/plantillas-email"
                element={
                  <ProtectedRoute allowedRoles={["ADMINISTRADOR"]}>
                    <EmailTemplates />
                  </ProtectedRoute>
                }
              />
              {/* Catch-all route */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </AuthProvider>
        <BrandingBadge />
      </TooltipProvider>
    </QueryClientProvider>
  </HelmetProvider>
);

export default App;
