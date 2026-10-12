import { LayoutDashboard, Briefcase, Wallet, User } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { AnimatedBottomNav, NavItem } from "@/components/ui/animated-bottom-nav";

const navItems: NavItem[] = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, path: "/provider" },
  { id: "jobs", label: "Jobs", icon: Briefcase, path: "/provider/jobs" },
  { id: "earnings", label: "Earnings", icon: Wallet, path: "/provider/earnings" },
  { id: "profile", label: "Profile", icon: User, path: "/provider/profile" },
];

const ProviderBottomNav = () => {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  return <AnimatedBottomNav items={navItems} activePath={pathname} onNavigate={(p) => navigate(p)} layoutKey="provider-tabbar" />;
};

export default ProviderBottomNav;
