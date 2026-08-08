import { motion } from "framer-motion";
import { Home, CalendarCheck, User } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";

const navItems = [
  { id: "home",     label: "Home",     icon: Home,          path: "/home" },
  { id: "bookings", label: "Bookings", icon: CalendarCheck, path: "/bookings" },
  { id: "profile",  label: "Profile",  icon: User,          path: "/profile" },
];

const BottomNav = () => {
  const navigate  = useNavigate();
  const { pathname } = useLocation();

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-50 pointer-events-none"
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
    >
      <div
        className="pointer-events-auto mx-auto"
        style={{ maxWidth: 480, padding: "0 24px 20px" }}
      >
        {/* Dark floating dock */}
        <div
          style={{
            background: "linear-gradient(145deg, #1a2f4a 0%, #0f1e30 100%)",
            borderRadius: 26,
            border: "1px solid rgba(255,255,255,0.07)",
            boxShadow: "0 20px 60px rgba(10,16,26,0.55), 0 4px 16px rgba(10,16,26,0.35)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-around",
            padding: "10px 8px",
            position: "relative",
          }}
        >
          {navItems.map((item) => {
            const isActive =
              pathname === item.path ||
              (item.id === "bookings" && pathname.startsWith("/bookings"));
            const Icon = item.icon;

            return (
              <button
                key={item.id}
                onClick={() => navigate(item.path)}
                style={{
                  flex: 1,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 5,
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  padding: "4px 0",
                  WebkitTapHighlightColor: "transparent",
                  outline: "none",
                  minHeight: 54,
                }}
              >
                {/* Icon wrapper */}
                <motion.div
                  animate={{ y: isActive ? -3 : 0, scale: isActive ? 1.1 : 1 }}
                  transition={{ type: "spring", stiffness: 420, damping: 26 }}
                  style={{ position: "relative" }}
                >
                  {/* Amber glow blob behind active icon */}
                  {isActive && (
                    <motion.div
                      layoutId="navGlow"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.25 }}
                      style={{
                        position: "absolute",
                        top: "50%",
                        left: "50%",
                        width: 44,
                        height: 44,
                        borderRadius: "50%",
                        background: "radial-gradient(circle, rgba(245,158,11,0.35) 0%, rgba(169,93,6,0.0) 70%)",
                        transform: "translate(-50%, -50%)",
                        zIndex: 0,
                        filter: "blur(6px)",
                      }}
                    />
                  )}

                  <Icon
                    size={22}
                    strokeWidth={isActive ? 2.2 : 1.6}
                    color={isActive ? "#F59E0B" : "rgba(255,255,255,0.35)"}
                    style={{ position: "relative", zIndex: 1, transition: "color 0.2s ease" }}
                  />
                </motion.div>

                {/* Label */}
                <motion.span
                  animate={{ opacity: isActive ? 1 : 0.38 }}
                  transition={{ duration: 0.18 }}
                  style={{
                    fontSize: 10.5,
                    fontWeight: isActive ? 700 : 500,
                    color: isActive ? "#F59E0B" : "#ffffff",
                    letterSpacing: "0.02em",
                    lineHeight: 1,
                    fontFamily: "inherit",
                  }}
                >
                  {item.label}
                </motion.span>

                {/* Bottom dot indicator */}
                <motion.div
                  animate={{ scaleX: isActive ? 1 : 0, opacity: isActive ? 1 : 0 }}
                  transition={{ type: "spring", stiffness: 500, damping: 35 }}
                  style={{
                    width: 18,
                    height: 2.5,
                    borderRadius: 2,
                    background: "linear-gradient(90deg, #F59E0B, #A95D06)",
                    boxShadow: "0 0 8px rgba(245,158,11,0.7)",
                    transformOrigin: "center",
                    marginTop: 1,
                  }}
                />
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default BottomNav;
