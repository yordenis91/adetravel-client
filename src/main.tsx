import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Superdev client initialization is disabled locally to avoid appId errors.
// Re-enable by setting VITE_SUPERDEV_ENABLED=true and providing VITE_APP_ID / VITE_SUPERDEV_BASE_URL.
// import "@/lib/superdev/client";

const backendUrl = import.meta.env.VITE_API_URL || "http://localhost:3000";

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
