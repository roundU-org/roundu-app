import { ReactNode } from "react";

interface MobileLayoutProps {
  children: ReactNode;
  className?: string;
}

const MobileLayout = ({ children, className = "" }: MobileLayoutProps) => {
  return (
    <div className={`w-full min-h-[100dvh] relative bg-background ${className}`}>
      {children}
    </div>
  );
};

export default MobileLayout;