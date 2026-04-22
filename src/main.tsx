import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Superdev client initialization is disabled locally to avoid appId errors.
// Re-enable by setting VITE_SUPERDEV_ENABLED=true and providing VITE_APP_ID / VITE_SUPERDEV_BASE_URL.
// import "@/lib/superdev/client";

createRoot(document.getElementById("root")!).render(<App />);
