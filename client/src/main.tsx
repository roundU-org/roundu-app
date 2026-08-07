import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import "./styles/background.css";

// Automatically recover when Vite asset hashes change after a new deployment
if (typeof window !== 'undefined') {
  window.addEventListener('vite:preloadError', (event) => {
    console.warn('Vite chunk preload error detected after new deployment, auto-reloading page...', event);
    const hasReloaded = sessionStorage.getItem('chunk_preload_reloaded');
    if (!hasReloaded) {
      sessionStorage.setItem('chunk_preload_reloaded', 'true');
      window.location.reload();
    }
  });

  (window as any).__logs = (window as any).__logs || [];
  const originalLog = console.log;
  console.log = (...args) => {
    (window as any).__logs.push(args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' '));
    originalLog.apply(console, args);
  };
}

createRoot(document.getElementById("root")!).render(
  <App />
);
