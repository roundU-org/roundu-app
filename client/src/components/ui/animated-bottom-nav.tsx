import React from "react";
import { motion } from "framer-motion";
import { Home, CalendarCheck, User, Plus, LucideIcon } from "lucide-react";
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
  /** Raised centre button (e.g. "Book"). Inserted in the middle of the items. */
  action?: { label: string; path: string; icon?: LucideIcon };
  layoutKey?: string;
  className?: string;
}

const isActivePath = (activePath: string, path: string, root: string[]) =>
  activePath === path || (!root.includes(path) && activePath.startsWith(path + "/"));

/** Light tab bar: icon + label, active tab in a soft orange pill that glides between tabs. */
export const AnimatedBottomNav: React.FC<AnimatedBottomNavProps> = ({
  activePath,
  onNavigate,
  items = DEFAULT_NAV_ITEMS,
  action,
  layoutKey = "tabbar",
  className,
}) => {
  const roots = ["/", "/home", "/provider"];
  const left = action ? items.slice(0, Math.ceil(items.length / 2)) : items;
  const right = action ? items.slice(left.length) : [];

  const Tab = ({ item }: { item: NavItem }) => {
    const active = isActivePath(activePath, item.path, roots);
    const Icon = item.icon;
    return (
      <button
        onClick={() => onNavigate(item.path)}
        aria-current={active ? "page" : undefined}
        className="flex flex-1 flex-col items-center gap-1 pb-1 pt-2 outline-none focus-visible:ring-2 focus-visible:ring-navy rounded-[14px]"
      >
        <span className="relative grid h-8 w-14 place-items-center">
          {active && (
            <motion.span
              layoutId={`${layoutKey}-pill`}
              className="absolute inset-0 rounded-full bg-orange-50 ring-1 ring-orange-100"
              transition={{ type: "spring", stiffness: 420, damping: 32 }}
            />
          )}
          <motion.span whileTap={{ scale: 0.86 }} className="relative">
            <Icon size={20} strokeWidth={active ? 2.3 : 1.8} className={active ? "text-brand-deep" : "text-slate-400"} />
          </motion.span>
        </span>
        <span className={cn("text-[11px] leading-none", active ? "font-semibold text-ink" : "font-medium text-slate-400")}>
          {item.label}
        </span>
      </button>
    );
  };

  const ActionIcon = action?.icon ?? Plus;

  return (
    <div className={cn("fixed inset-x-0 bottom-0 z-50 mx-auto max-w-[430px]", className)}>
      <nav
        aria-label="Bottom Navigation"
        className="relative flex items-end border-t border-line bg-card/95 px-2 pb-[max(env(safe-area-inset-bottom),10px)] shadow-[0_-10px_30px_-18px_rgba(14,27,44,0.25)] backdrop-blur-xl"
      >
        {left.map((item) => (
          <Tab key={item.id} item={item} />
        ))}
        {action && (
          <div className="flex flex-1 flex-col items-center">
            <motion.button
              whileTap={{ scale: 0.92 }}
              onClick={() => onNavigate(action.path)}
              aria-label={action.label}
              className="-mt-7 grid h-[58px] w-[58px] place-items-center rounded-full bg-brand-amber text-white shadow-[0_12px_24px_-10px_rgba(252,117,8,0.75)] ring-[5px] ring-background"
            >
              <ActionIcon size={24} strokeWidth={2.4} />
            </motion.button>
            <span className="mt-1 pb-1 text-[11px] font-semibold leading-none text-ink">{action.label}</span>
          </div>
        )}
        {right.map((item) => (
          <Tab key={item.id} item={item} />
        ))}
      </nav>
    </div>
  );
};

export default AnimatedBottomNav;
