import { Home, CalendarCheck, User, Heart } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { Dock, DockIcon, DockItem, DockLabel } from "@/components/ui/dock";

const navItems = [
  { id: "home", label: "Home", icon: Home, path: "/home" },
  { id: "bookings", label: "Bookings", icon: CalendarCheck, path: "/bookings" },
  { id: "favorites", label: "Favorites", icon: Heart, path: "/favorites" },
  { id: "profile", label: "Profile", icon: User, path: "/profile" },
];

const BottomNav = () => {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  return (
    <div className="fixed bottom-3 left-1/2 -translate-x-1/2 z-50 w-full max-w-[430px] px-3 pointer-events-none flex justify-center">
      <div className="pointer-events-auto">
        <Dock
          className="items-center bg-white/90 dark:bg-neutral-900/90 backdrop-blur-xl border border-slate-200/80 dark:border-neutral-800 shadow-[0_10px_30px_rgba(0,0,0,0.12)] rounded-full px-3 py-1.5"
          panelHeight={54}
          magnification={68}
          distance={120}
        >
          {navItems.map((item) => {
            const isActive = pathname === item.path || (item.id === "bookings" && pathname.startsWith("/bookings"));
            const Icon = item.icon;
            return (
              <DockItem
                key={item.id}
                onClick={() => navigate(item.path)}
                className={`aspect-square rounded-full transition-colors cursor-pointer ${
                  isActive
                    ? "bg-slate-900 text-white shadow-md dark:bg-primary dark:text-primary-foreground"
                    : "bg-slate-100/90 text-slate-600 hover:bg-slate-200 hover:text-slate-900 dark:bg-neutral-800 dark:text-neutral-300"
                }`}
              >
                <DockLabel className="font-semibold shadow-sm">{item.label}</DockLabel>
                <DockIcon>
                  <Icon className="h-5 w-5" strokeWidth={isActive ? 2.5 : 2} />
                </DockIcon>
              </DockItem>
            );
          })}
        </Dock>
      </div>
    </div>
  );
};

export default BottomNav;
