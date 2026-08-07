import { Home, CalendarCheck, User } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { Dock, DockIcon, DockItem, DockLabel } from "@/components/ui/dock";

const navItems = [
  { id: "home", label: "Home", icon: Home, path: "/home" },
  { id: "bookings", label: "Bookings", icon: CalendarCheck, path: "/bookings" },
  { id: "profile", label: "Profile", icon: User, path: "/profile" },
];

const BottomNav = () => {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  return (
    <div className="fixed bottom-3 left-0 right-0 max-w-[430px] mx-auto px-4 z-50 pointer-events-none flex justify-center transform-gpu">
      <div className="pointer-events-auto">
        <Dock
          className="items-center bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl border border-slate-200/90 dark:border-slate-800 shadow-[0_12px_36px_rgba(15,23,42,0.16)] rounded-full px-3 py-1"
          panelHeight={52}
          magnification={64}
          distance={100}
        >
          {navItems.map((item) => {
            const isActive = pathname === item.path || (item.id === "bookings" && pathname.startsWith("/bookings"));
            const Icon = item.icon;
            return (
              <DockItem
                key={item.id}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  navigate(item.path);
                }}
                className={`relative aspect-square rounded-full transition-colors duration-150 ${
                  isActive
                    ? "bg-slate-900 text-white shadow-md shadow-slate-900/20 dark:bg-primary dark:text-primary-foreground"
                    : "bg-slate-100/90 text-slate-600 hover:bg-slate-200/90 hover:text-slate-900 dark:bg-neutral-800 dark:text-neutral-300"
                }`}
              >
                <DockLabel className="font-semibold">{item.label}</DockLabel>
                <DockIcon>
                  <Icon className="h-4.5 w-4.5" strokeWidth={isActive ? 2.5 : 2} />
                </DockIcon>
                {isActive && (
                  <span className="absolute -bottom-1 w-1 h-1 rounded-full bg-slate-900 dark:bg-primary" />
                )}
              </DockItem>
            );
          })}
        </Dock>
      </div>
    </div>
  );
};

export default BottomNav;
