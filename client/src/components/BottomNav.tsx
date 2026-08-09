import { useLocation, useNavigate } from "react-router-dom";
import { AnimatedBottomNav } from "@/components/ui/animated-bottom-nav";

const BottomNav = () => {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  return (
    <AnimatedBottomNav
      activePath={pathname}
      onNavigate={(path) => navigate(path)}
    />
  );
};

export default BottomNav;

