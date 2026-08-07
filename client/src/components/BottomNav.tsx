import { motion } from "framer-motion";
import { Home, CalendarCheck, User } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";

const navItems = [
  { id: "home", label: "Home", icon: Home, path: "/home" },
  { id: "bookings", label: "Bookings", icon: CalendarCheck, path: "/bookings" },
  { id: "profile", label: "Profile", icon: User, path: "/profile" },
];

const BottomNav = () => {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 w-[92%] max-w-[390px] z-50 pointer-events-none transform-gpu">
      <div className="pointer-events-auto bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl border border-slate-200/90 dark:border-slate-800 shadow-[0_12px_36px_rgba(15,23,42,0.16)] rounded-[28px] p-2 flex items-center justify-around">
        {navItems.map((item) => {
          const isActive = pathname === item.path || (item.id === "bookings" && pathname.startsWith("/bookings"));
          const Icon = item.icon;

          return (
            <button
              key={item.id}
              onClick={() => navigate(item.path)}
              className={`relative flex items-center justify-center gap-2 px-4 py-2.5 rounded-full text-[13px] font-semibold transition-all duration-300 active:scale-95 select-none ${
                isActive
                  ? "text-white dark:text-primary-foreground font-bold"
                  : "text-slate-500 hover:text-slate-900 dark:text-neutral-400 dark:hover:text-neutral-100"
              }`}
            >
              {isActive && (
                <motion.div
                  layoutId="bottomNavActivePill"
                  className="absolute inset-0 bg-slate-900 dark:bg-primary rounded-full shadow-md shadow-slate-900/20"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
              <span className="relative z-10 flex items-center gap-2">
                <Icon size={19} strokeWidth={isActive ? 2.5 : 2} />
                <span>{item.label}</span>
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default BottomNav;
