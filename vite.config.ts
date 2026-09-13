/// <reference types="vitest" />
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "superdev-tagger";

process.env.SUPERDEV_SANDBOX = "true";
// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    proxy: {
      "/api/integrations": {
        target: "https://superdev.build",
        changeOrigin: true,
        rewrite: (path) =>
          path.replace(/^\/api\/integrations/, "/api/integrations"),
      },
    },
    hmr: {
      overlay: false,
    },
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(
    Boolean
  ),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./vitest.setup.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      // Igual que en el backend: la cobertura se mide solo sobre los módulos
      // que ya tienen tests reales (pagos, cliente de API compartido, hook de
      // notificaciones, StatsCard). El resto del frontend aún no tiene suite
      // y diluiría el número sin decir nada útil.
      include: [
        "src/lib/api.ts",
        "src/components/payments/PaymentFormDialog.tsx",
        "src/components/payments/PaymentsTable.tsx",
        "src/hooks/useNotifications.ts",
        "src/components/dashboard/StatsCard.tsx",
      ],
      thresholds: {
        statements: 60,
        branches: 55,
        functions: 55,
        lines: 60,
      },
    },
  },
}));
