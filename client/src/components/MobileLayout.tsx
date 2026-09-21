import { ReactNode } from "react";

interface MobileLayoutProps {
  children: ReactNode;
  className?: string;
}

const MobileLayout = ({ children, className = "" }: MobileLayoutProps) => {
  return (
    <div className="min-h-screen w-full bg-background sm:bg-muted flex justify-center p-0 sm:p-4 items-start sm:items-center">
      <div
        className={`w-full min-h-[100dvh] relative bg-background sm:max-w-[430px] sm:rounded-2xl sm:shadow-lg sm:border sm:border-border/60 ${className}`}
        // Android 15+ (targetSdk 35+) enforces edge-to-edge and ignores the
        // old opt-out API, so the WebView draws under the status bar
        // regardless of native config. Reserving that space here pushes
        // every page's content (and their `sticky top-0` headers, which
        // respect an ancestor's padding-box - unlike `fixed`) down below
        // it, without needing to touch each page individually.
        style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}
      >
        {children}
      </div>
    </div>
  );
};

export default MobileLayout;