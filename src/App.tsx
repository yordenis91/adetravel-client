import React, { Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HelmetProvider } from "react-helmet-async";
import { BrowserRouter, Routes, Route, Navigate, Outlet } from "react-router-dom";
import * as Sentry from "@sentry/react";
import { AuthProvider } from "@/context/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Loader2 } from "lucide-react";

// 1. PRIMERO: Todas las importaciones estáticas (Rutas públicas)
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import NotFound from "./pages/NotFound";
import AppLayout from "./components/layout/AppLayout";
//import { BrandingBadge } from "./components/BrandingBadge";

// 2. DESPUÉS: Todas las importaciones dinámicas (Rutas protegidas - Code Splitting)
const Dashboard = React.lazy(() => import("./pages/Dashboard"));
const Clients = React.lazy(() => import("./pages/Clients"));
const ClientTimeline = React.lazy(() => import("@/pages/ClientTimeline"));
const Providers = React.lazy(() => import("./pages/Providers"));
const ProviderDetails = React.lazy(() => import("./pages/ProviderDetailsPage"));
const Requests = React.lazy(() => import("./pages/Requests"));
const Quotations = React.lazy(() => import("./pages/Quotations"));
const Confirmaciones = React.lazy(() => import("./pages/Confirmaciones"));
const Payments = React.lazy(() => import("./pages/Payments"));
const Vouchers = React.lazy(() => import("./pages/Vouchers"));
const Reportes = React.lazy(() => import("./pages/Reportes"));
const Bitacora = React.lazy(() => import("./pages/Bitacora"));
const Notifications = React.lazy(() => import("./pages/Notifications"));
const Usuarios = React.lazy(() => import("./pages/Usuarios"));
const Configuracion = React.lazy(() => import("./pages/Configuracion"));
const EmailTemplates = React.lazy(() => import("./pages/EmailTemplates"));
const Tasks = React.lazy(() => import("./pages/Tasks")); // 🔥 Corregido: Ahora Tasks también es Lazy


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
const FallbackError = ({ error, resetError }: { error: unknown; componentStack: string; eventId: string; resetError: () => void }) => (
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
      Error ID: {error instanceof Error ? error.message : "Desconocido"}
    </p>
  </div>
);

const PageLoader = () => (
  <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
    <Loader2 className="w-10 h-10 text-primary animate-spin" />
    <p className="text-muted-foreground animate-pulse font-medium">Cargando módulo...</p>
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
              <Route path="/auth/forgot-password" element={<ForgotPassword />} />
              <Route path="/auth/reset-password/:token" element={<ResetPassword />} />
              
              {/* RUTAS PROTEGIDAS ANIDADAS EN EL LAYOUT */}
              <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/clientes" element={<Clients />} />
                <Route path="/clientes/:clientId/timeline" element={<ClientTimeline />} />
                <Route path="/proveedores" element={<Providers />} />
                <Route path="/proveedores/:providerId" element={<ProviderDetails />} />
                <Route path="/solicitudes" element={<Requests />} />
                <Route path="/cotizaciones" element={<Quotations />} />
                <Route path="/confirmaciones" element={<Confirmaciones />} />
                <Route path="/pagos" element={<Payments />} />
                <Route path="/vouchers" element={<Vouchers />} />
                <Route path="/reportes" element={<Reportes />} />
                <Route path="/bitacora" element={<Bitacora />} />
                <Route path="/notifications" element={<Notifications />} />
                <Route path="/tareas" element={<Tasks />} />
                
                {/* 🔥 Rutas de Administración Protegidas por Rol */}
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
              </Route>
              
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
