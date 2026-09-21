import { createRoot } from "react-dom/client";
import { Capacitor } from "@capacitor/core";
import { StatusBar, Style } from "@capacitor/status-bar";
import App from "./App.tsx";
import "./index.css";
import "./styles/background.css";

// Android (targetSdk 35+) draws the WebView edge-to-edge behind the status
// bar by default, so page content renders underneath it unless we opt out.
// Telling the status bar not to overlay the WebView makes Android reserve
// that space natively - no per-page safe-area CSS needed. No-op on web.
if (Capacitor.isNativePlatform()) {
  StatusBar.setOverlaysWebView({ overlay: false }).catch(() => {});
  StatusBar.setStyle({ style: Style.Dark }).catch(() => {});
  StatusBar.setBackgroundColor({ color: "#F8FAFC" }).catch(() => {});
}

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
