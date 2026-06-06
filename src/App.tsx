import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HelmetProvider } from "react-helmet-async";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import * as Sentry from "@sentry/react";
import { AuthProvider } from "@/context/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Dashboard from "./pages/Dashboard";
import Clients from "./pages/Clients";
import ClientTimeline from "@/pages/ClientTimeline";
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
import Tasks from "./pages/Tasks";
import NotFound from "./pages/NotFound";
//import { BrandingBadge } from "./components/BrandingBadge";


// 🔥 Configuración nivel Enterprise
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // Los datos se consideran frescos por 5 minutos (evita peticiones dobles)
      retry: 1, // Si falla la red, intenta 1 sola vez más antes de mostrar error
      refetchOnWindowFocus: false, // No recargar la base de datos solo porque el usuario cambió de pestaña
    },
  },
});

// 🔥 1. Creamos una pantalla elegante para cuando algo explote
const FallbackError = ({ error, resetError }: any) => (
  <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-6 text-center">
    <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-4">
      {/* Icono de advertencia rápido */}
      <span className="text-2xl font-bold">!</span>
    </div>
    <h2 className="text-2xl font-playfair font-bold text-navy mb-2">Ups, algo salió mal</h2>
    <p className="text-muted-foreground max-w-md mb-6">
      Hemos detectado un error inesperado y nuestro equipo técnico ya ha sido notificado automáticamente.
    </p>
    <button 
      onClick={resetError} 
      className="bg-navy hover:bg-navy-light text-white font-bold py-2 px-6 rounded-xl transition-all"
    >
      Intentar recargar la página
    </button>
    <p className="text-xs text-slate-400 mt-8 font-mono">
      Error ID: {error?.message || "Desconocido"}
    </p>
  </div>
);

const App = () => (
  <Sentry.ErrorBoundary fallback={FallbackError} showDialog={false}>
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
                path="/clientes/:clientId/timeline"
                element={
                  <ProtectedRoute>
                    <ClientTimeline />
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
              <Route 
                  path="/tareas" 
                  element={
                    <ProtectedRoute>
                      <Tasks />
                    </ProtectedRoute>
                  } 
                />
              {/* Catch-all route */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </AuthProvider>
        {/* <BrandingBadge /> */}
      </TooltipProvider>
    </QueryClientProvider>
  </HelmetProvider>
  </Sentry.ErrorBoundary>
);

export default App;
