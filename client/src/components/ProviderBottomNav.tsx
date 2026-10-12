import { LayoutDashboard, Briefcase, Wallet, User } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";

const navItems = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, path: "/provider" },
  { id: "jobs", label: "Jobs", icon: Briefcase, path: "/provider/jobs" },
  { id: "earnings", label: "Earnings", icon: Wallet, path: "/provider/earnings" },
  { id: "profile", label: "Profile", icon: User, path: "/provider/profile" },
];

const ProviderBottomNav = () => {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  return (
    <div className="fixed bottom-4 left-1/2 z-50 w-[92%] max-w-[400px] -translate-x-1/2">
      <nav className="flex items-center justify-between rounded-[24px] bg-jet/95 p-1.5 ring-1 ring-white/10 shadow-[0_18px_40px_-14px_rgba(0,0,0,0.55)] backdrop-blur-xl">
        {navItems.map((item) => {
          const isActive = pathname === item.path || (item.id === "dashboard" && pathname === "/provider");
          return (
            <button
              key={item.id}
              onClick={() => navigate(item.path)}
              className={`relative flex flex-1 flex-col items-center gap-1 rounded-[16px] py-2.5 transition-colors duration-200 active:scale-95 ${
                isActive ? "bg-white text-jet" : "text-white/55 hover:text-white"
              }`}
            >
              <item.icon size={20} strokeWidth={isActive ? 2.2 : 1.8} />
              <span className="text-[10.5px] font-semibold">{item.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
};

export default ProviderBottomNav;
