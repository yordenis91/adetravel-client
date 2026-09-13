import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import * as Sentry from "@sentry/react";

// Superdev client initialization is disabled locally to avoid appId errors.
// Re-enable by setting VITE_SUPERDEV_ENABLED=true and providing VITE_APP_ID / VITE_SUPERDEV_BASE_URL.
// import "@/lib/superdev/client";

const backendUrl = import.meta.env.VITE_API_URL || "http://localhost:3000";

console.log("SENTRY CONFIGURADO:", !!import.meta.env.VITE_SENTRY_DSN);

// 🔥 1. Inicializamos Sentry de forma segura
if (import.meta.env.VITE_SENTRY_DSN) {
  Sentry.init({
    dsn: import.meta.env.VITE_SENTRY_DSN,
    
    // Entornos: Ayuda a separar errores de pruebas y de producción
    environment: import.meta.env.PROD ? "production" : "development",

    // Integraciones recomendadas para monitorear rendimiento
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration({
        // La app maneja PII (pasaportes, datos bancarios): las grabaciones
        // de sesión deben ocultar texto y bloquear medios por defecto.
        maskAllText: true,
        blockAllMedia: true,
      }),
    ],

    // Performance Monitoring: 100% en desarrollo, 20% en producción para
    // controlar el volumen/costo de transacciones.
    tracesSampleRate: import.meta.env.PROD ? 0.2 : 1.0,

    // Session Replay (Graba la pantalla del usuario cuando ocurre un error)
    replaysSessionSampleRate: 0.1, 
    replaysOnErrorSampleRate: 1.0, 
  });
}

fetch(`${backendUrl}/health`)
  .then((res) => {
    if (!res.ok) {
      throw new Error(`Backend health check returned ${res.status}`);
    }
    return res.json();
  })
  .then((data) => {
    console.info("Backend connection OK:", backendUrl, data);
  })
  .catch((error) => {
    console.error("Backend connection failed:", backendUrl, error);
  });

createRoot(document.getElementById("root")!).render(<App />);
