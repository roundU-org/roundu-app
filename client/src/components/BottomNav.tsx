import { motion, AnimatePresence } from "framer-motion";
import { Home, CalendarCheck, User } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";

const navItems = [
  {
    id: "home",
    label: "Home",
    icon: Home,
    path: "/home",
    activeColor: "#152E4B",
    activeBg: "rgba(21,46,75,0.10)",
  },
  {
    id: "bookings",
    label: "Bookings",
    icon: CalendarCheck,
    path: "/bookings",
    activeColor: "#A95D06",
    activeBg: "rgba(169,93,6,0.10)",
  },
  {
    id: "profile",
    label: "Profile",
    icon: User,
    path: "/profile",
    activeColor: "#152E4B",
    activeBg: "rgba(21,46,75,0.10)",
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
      {/* Gradient fade above nav */}
      <div
        className="pointer-events-none"
        style={{
          height: 28,
          background:
            "linear-gradient(to top, rgba(242,244,248,0.98) 0%, rgba(242,244,248,0) 100%)",
          marginBottom: -2,
        }}
      />

      {/* Nav bar */}
      <div
        className="pointer-events-auto mx-auto"
        style={{
          maxWidth: 480,
          padding: "0 16px 14px 16px",
        }}
      >
        <div
          style={{
            background: "rgba(255,255,255,0.97)",
            backdropFilter: "blur(24px)",
            WebkitBackdropFilter: "blur(24px)",
            borderRadius: 28,
            border: "1.5px solid rgba(21,46,75,0.09)",
            boxShadow:
              "0 8px 32px rgba(15,23,42,0.12), 0 2px 8px rgba(15,23,42,0.06), inset 0 1px 0 rgba(255,255,255,0.9)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-around",
            padding: "6px 8px",
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
                className="relative flex-1 flex flex-col items-center justify-center select-none touch-manipulation"
                style={{
                  outline: "none",
                  border: "none",
                  background: "transparent",
                  cursor: "pointer",
                  minHeight: 56,
                  WebkitTapHighlightColor: "transparent",
                }}
              >
                {/* Active background pill */}
                <AnimatePresence>
                  {isActive && (
                    <motion.div
                      layoutId="navActivePill"
                      initial={{ opacity: 0, scale: 0.85 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.85 }}
                      transition={{
                        type: "spring",
                        stiffness: 420,
                        damping: 30,
                        mass: 0.8,
                      }}
                      style={{
                        position: "absolute",
                        inset: "4px 6px",
                        borderRadius: 18,
                        background: item.activeBg,
                        zIndex: 0,
                      }}
                    />
                  )}
                </AnimatePresence>

                {/* Icon */}
                <motion.div
                  animate={{
                    y: isActive ? -2 : 0,
                    scale: isActive ? 1.08 : 1,
                  }}
                  transition={{ type: "spring", stiffness: 400, damping: 28 }}
                  style={{ position: "relative", zIndex: 1 }}
                >
                  {/* Active dot indicator above icon */}
                  {isActive && (
                    <motion.div
                      layoutId="navActiveDot"
                      initial={{ opacity: 0, scaleX: 0 }}
                      animate={{ opacity: 1, scaleX: 1 }}
                      exit={{ opacity: 0, scaleX: 0 }}
                      transition={{ type: "spring", stiffness: 400, damping: 30 }}
                      style={{
                        position: "absolute",
                        top: -7,
                        left: "50%",
                        transform: "translateX(-50%)",
                        width: 20,
                        height: 3,
                        borderRadius: 2,
                        background: item.activeColor,
                      }}
                    />
                  )}

                  <Icon
                    size={22}
                    strokeWidth={isActive ? 2.3 : 1.8}
                    color={isActive ? item.activeColor : "#94a3b8"}
                    style={{
                      transition: "color 0.2s ease, stroke-width 0.2s ease",
                    }}
                  />
                </motion.div>

                {/* Label */}
                <motion.span
                  animate={{
                    opacity: isActive ? 1 : 0.55,
                    y: isActive ? 0 : 1,
                  }}
                  transition={{ duration: 0.18 }}
                  style={{
                    position: "relative",
                    zIndex: 1,
                    fontSize: 10.5,
                    fontWeight: isActive ? 700 : 500,
                    letterSpacing: isActive ? "0.01em" : "0em",
                    color: isActive ? item.activeColor : "#94a3b8",
                    marginTop: 3,
                    lineHeight: 1,
                    fontFamily: "inherit",
                    transition: "color 0.2s ease",
                  }}
                >
                  {item.label}
                </motion.span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default BottomNav;
