import { ReactNode } from "react";

interface MobileLayoutProps {
  children: ReactNode;
  className?: string;
}

const MobileLayout = ({ children, className = "" }: MobileLayoutProps) => {
  return (
    <div className="min-h-screen w-full bg-background sm:bg-muted flex justify-center p-0 sm:p-4 items-start sm:items-center">
      <div className={`w-full min-h-[100dvh] relative bg-background sm:max-w-[430px] sm:rounded-2xl sm:shadow-lg sm:border sm:border-border/60 ${className}`}>
        {children}
      </div>
    </div>
  );
};

export default MobileLayout;