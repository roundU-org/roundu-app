import React from "react";
import { motion } from "framer-motion";
import { Home, CalendarCheck, User, LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export interface NavItem {
  id: string;
  label: string;
  icon: LucideIcon;
  path: string;
}

export const DEFAULT_NAV_ITEMS: NavItem[] = [
  { id: "home", label: "Home", icon: Home, path: "/home" },
  { id: "bookings", label: "Bookings", icon: CalendarCheck, path: "/bookings" },
  { id: "profile", label: "Profile", icon: User, path: "/profile" },
];

interface AnimatedBottomNavProps {
  activePath: string;
  onNavigate: (path: string) => void;
  items?: NavItem[];
  className?: string;
}

export const AnimatedBottomNav: React.FC<AnimatedBottomNavProps> = ({
  activePath,
  onNavigate,
  items = DEFAULT_NAV_ITEMS,
  className,
}) => {
  return (
    <div
      className={cn(
        "fixed bottom-5 left-1/2 -translate-x-1/2 z-50 w-[92%] max-w-[380px] pointer-events-none transform-gpu",
        className
      )}
    >
      <nav
        aria-label="Bottom Navigation"
        className="pointer-events-auto relative flex items-center justify-between p-1.5 rounded-[24px] bg-jet/95 backdrop-blur-xl ring-1 ring-white/10 shadow-[0_18px_40px_-14px_rgba(0,0,0,0.55)] transition-all duration-300"
      >
        {items.map((item) => {
          const isActive =
            activePath === item.path ||
            (item.path !== "/" && item.path !== "/home" && activePath.startsWith(item.path));

          const Icon = item.icon;

          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.path)}
              className={cn(
                "relative flex-1 flex items-center justify-center gap-2 py-3 px-3 rounded-[16px] text-xs font-semibold select-none transition-colors duration-200 outline-none focus-visible:ring-2 focus-visible:ring-navy",
                isActive
                  ? "text-jet"
                  : "text-white/55 hover:text-white"
              )}
            >
              {isActive && (
                <motion.div
                  layoutId="animatedNavActivePill"
                  className="absolute inset-0 rounded-[18px] bg-white"
                  transition={{
                    type: "spring",
                    stiffness: 400,
                    damping: 30,
                  }}
                />
              )}

              <motion.div
                className="relative z-10 flex items-center justify-center gap-2"
                whileTap={{ scale: 0.92 }}
                animate={{
                  scale: isActive ? 1.05 : 1,
                }}
                transition={{ type: "spring", stiffness: 500, damping: 25 }}
              >
                <Icon
                  size={19}
                  strokeWidth={isActive ? 2.4 : 1.8}
                  className={cn(
                    "transition-transform duration-200",
                    isActive ? "text-jet" : "text-white/55"
                  )}
                />
                <span
                  className={cn(
                    "tracking-wide transition-all duration-200",
                    isActive ? "font-semibold text-jet" : "font-medium text-white/55"
                  )}
                >
                  {item.label}
                </span>
              </motion.div>
            </button>
          );
        })}
      </nav>
    </div>
  );
};

export default AnimatedBottomNav;
