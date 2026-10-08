import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import * as Sentry from "@sentry/react";
import { installChunkReloadHandler } from "./lib/chunk-reload";
import { scrubBreadcrumb, scrubEvent } from "./lib/sentry-scrub";

// Tras un despliegue nuevo, las pestañas con la versión vieja piden módulos que ya no existen.
installChunkReloadHandler();

const backendUrl = import.meta.env.VITE_API_URL || "http://localhost:3000";

// 🔥 1. Inicializamos Sentry de forma segura
if (import.meta.env.VITE_SENTRY_DSN) {
  Sentry.init({
    dsn: import.meta.env.VITE_SENTRY_DSN,
    
    // Entornos: Ayuda a separar errores de pruebas y de producción
    environment: import.meta.env.VITE_SENTRY_ENVIRONMENT || (import.meta.env.PROD ? "production" : "development"),

    // Sin datos personales: ni IP ni cuerpos; correos, RUT y tokens enmascarados y URL sin query
    // (ver src/lib/sentry-scrub.ts).
    sendDefaultPii: false,
    beforeSend: (event) => scrubEvent(event),
    beforeSendTransaction: (event) => scrubEvent(event),
    beforeBreadcrumb: (breadcrumb) => scrubBreadcrumb(breadcrumb),

    // Integraciones recomendadas para monitorear rendimiento
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration({
        // La app maneja PII (pasaportes, datos bancarios): las grabaciones
        // de sesión deben ocultar texto y bloquear medios por defecto.
        maskAllText: true,
        maskAllInputs: true,
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
