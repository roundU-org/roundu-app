import { motion } from "framer-motion";
import { Home, CalendarCheck, User } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";

const navItems = [
  {
    id: "home",
    label: "Home",
    icon: Home,
    path: "/home",
    activeColor: "#152E4B",
  },
  {
    id: "bookings",
    label: "Bookings",
    icon: CalendarCheck,
    path: "/bookings",
    activeColor: "#A95D06",
  },
  {
    id: "profile",
    label: "Profile",
    icon: User,
    path: "/profile",
    activeColor: "#152E4B",
  },
];

const BottomNav = () => {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-50 pointer-events-none"
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
    >
      <div
        className="pointer-events-auto mx-auto"
        style={{
          maxWidth: 480,
          padding: "0 20px 16px 20px",
        }}
      >
        <div
          style={{
            background: "rgba(255,255,255,0.98)",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
            borderRadius: 24,
            border: "1px solid rgba(15,23,42,0.07)",
            boxShadow:
              "0 -2px 0 rgba(15,23,42,0.04), 0 8px 40px rgba(15,23,42,0.14), 0 2px 12px rgba(15,23,42,0.06)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-around",
            padding: "10px 4px 10px 4px",
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
                  gap: 4,
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  padding: "2px 0",
                  WebkitTapHighlightColor: "transparent",
                  outline: "none",
                  position: "relative",
                  minHeight: 52,
                }}
              >
                {/* Top active accent bar */}
                <motion.div
                  animate={{
                    scaleX: isActive ? 1 : 0,
                    opacity: isActive ? 1 : 0,
                  }}
                  transition={{ type: "spring", stiffness: 500, damping: 35 }}
                  style={{
                    position: "absolute",
                    top: -10,
                    left: "50%",
                    translateX: "-50%",
                    width: 28,
                    height: 3,
                    borderRadius: 2,
                    background: item.activeColor,
                    transformOrigin: "center",
                  }}
                />

                {/* Icon container */}
                <motion.div
                  animate={{
                    y: isActive ? -1 : 0,
                  }}
                  transition={{ type: "spring", stiffness: 400, damping: 28 }}
                  style={{
                    width: 42,
                    height: 36,
                    borderRadius: 12,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: isActive
                      ? item.activeColor === "#A95D06"
                        ? "rgba(169,93,6,0.09)"
                        : "rgba(21,46,75,0.08)"
                      : "transparent",
                    transition: "background 0.22s ease",
                  }}
                >
                  <Icon
                    size={21}
                    strokeWidth={isActive ? 2.2 : 1.7}
                    color={isActive ? item.activeColor : "#b0bec5"}
                    style={{ transition: "color 0.2s ease" }}
                  />
                </motion.div>

                {/* Label */}
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: isActive ? 700 : 500,
                    color: isActive ? item.activeColor : "#b0bec5",
                    lineHeight: 1,
                    letterSpacing: isActive ? "0.01em" : 0,
                    fontFamily: "inherit",
                    transition: "color 0.2s ease, font-weight 0.1s ease",
                  }}
                >
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default BottomNav;
