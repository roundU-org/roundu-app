import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertTriangle, RefreshCcw } from "lucide-react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);

    // Auto-reload on dynamic import / chunk load failures caused by new deployment asset hashes
    const isChunkError =
      error?.message?.includes("Failed to fetch dynamically imported module") ||
      error?.message?.includes("Importing a module script failed") ||
      error?.name === "ChunkLoadError";

    if (isChunkError) {
      const hasReloaded = sessionStorage.getItem("chunk_error_reloaded");
      if (!hasReloaded) {
        sessionStorage.setItem("chunk_error_reloaded", "true");
        window.location.reload();
      }
    }
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center">
          <div className="w-20 h-20 rounded-full bg-red-50 flex items-center justify-center mb-6">
            <AlertTriangle className="text-red-500" size={40} />
          </div>
          <h1 className="text-2xl font-black text-foreground mb-2">App Updated</h1>
          <p className="text-muted-foreground mb-4 max-w-xs mx-auto">
            A new version of RoundU is available. Please reload to update.
          </p>
          <div className="bg-red-50 text-red-800 text-left p-3 rounded-xl mb-8 max-w-[90%] overflow-auto text-[10px] font-mono border border-red-200 shadow-sm">
            <p className="font-bold mb-1 text-red-900">{this.state.error?.message}</p>
          </div>
          <button
            onClick={() => {
              sessionStorage.removeItem("chunk_error_reloaded");
              window.location.reload();
            }}
            className="flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-2xl font-bold active:scale-95 transition-all shadow-lg shadow-primary/20"
          >
            <RefreshCcw size={18} />
            Reload App Now
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
