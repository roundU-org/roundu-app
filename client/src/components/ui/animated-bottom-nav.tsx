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
        className="pointer-events-auto relative flex items-center justify-between p-1.5 rounded-full bg-[#0B132B]/95 dark:bg-[#070C1A]/95 backdrop-blur-xl border border-white/10 shadow-[0_12px_36px_rgba(0,0,0,0.45)] transition-all duration-300"
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
                "relative flex-1 flex items-center justify-center gap-2 py-3 px-3 rounded-full text-xs font-semibold select-none transition-colors duration-200 outline-none focus-visible:ring-2 focus-visible:ring-orange-500",
                isActive
                  ? "text-white"
                  : "text-slate-400 hover:text-slate-200"
              )}
            >
              {isActive && (
                <motion.div
                  layoutId="animatedNavActivePill"
                  className="absolute inset-0 rounded-full bg-gradient-to-r from-orange-500 to-amber-500 shadow-[0_4px_20px_rgba(249,115,22,0.4)]"
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
                    isActive ? "text-white drop-shadow-sm" : "text-slate-400 group-hover:text-slate-200"
                  )}
                />
                <span
                  className={cn(
                    "tracking-wide transition-all duration-200",
                    isActive ? "font-bold text-white" : "font-medium text-slate-400"
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
