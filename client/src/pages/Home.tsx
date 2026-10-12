import { useState, useCallback, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search, MapPin, Bell, ChevronRight, Menu, X, Home as HomeIcon, CalendarCheck,
  Settings, HelpCircle, LogOut, Smartphone, Wallet, Gift, Sparkles, Wrench,
  Loader2, Zap, Droplet, Paintbrush, Hammer, ShieldAlert, Fan, CloudRain, ShieldCheck, SprayCan, AirVent,
} from "lucide-react";
import BottomNav from "@/components/BottomNav";
import { services, quickFixes, smartSuggestions, SmartSuggestion } from "@/data/mockData";
import { useApp } from "@/context/AppContext";
import { useCurrentLocation } from "@/hooks/useLocation";
import { reverseGeocode } from "@/lib/mapProvider";
import LocationModal from "@/components/LocationModal";
import { motion, Variants } from "framer-motion";
import AdBannerCarousel from "@/components/AdBannerCarousel";
import api from "@/lib/api";

export interface Provider {
  id: string;
  name: string;
}

export interface Booking {
  id: string;
  serviceId?: string;
  service_id?: string;
  status: string;
  paid?: boolean;
}

const getSuggestionIconConfig = (serviceId: string) => {
  switch (serviceId) {
    case "electrician":
      return { icon: Zap, bgColor: "bg-amber-500/10 text-amber-500 border-amber-500/20" };
    case "plumber":
      return { icon: Droplet, bgColor: "bg-blue-500/10 text-blue-500 border-blue-500/20" };
    case "painter":
      return { icon: Paintbrush, bgColor: "bg-pink-500/10 text-pink-500 border-pink-500/20" };
    case "carpenter":
      return { icon: Hammer, bgColor: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" };
    case "pestcontrol":
      return { icon: ShieldAlert, bgColor: "bg-red-500/10 text-danger border-red-500/20" };
    case "housekeeping":
      return { icon: SprayCan, bgColor: "bg-amber-100 text-amber-700 border-amber-200/80" };
    default:
      return { icon: Wrench, bgColor: "bg-indigo-500/10 text-indigo-500 border-indigo-500/20" };
  }
};

const electricalCardBg = "bg-gradient-to-br from-sky-50 via-white to-slate-100";
const electricalTextColor = "text-slate-900";

interface CategoryDesignToken {
  initial: string;
  photo: string;
  tintOverlay: string;
  fallbackGradient: string;
  watermarkColor: string;
  categoryBadge: string;
  secondaryChip: string;
  borderAccent: string;
}

const CATEGORY_TOKENS: Record<string, CategoryDesignToken> = {
  plumber: {
    initial: "P",
    photo: "https://images.unsplash.com/photo-1585058177583-0498b5e61d85?w=600&q=80&fit=crop&crop=center",
    tintOverlay: "bg-sky-950/40 mix-blend-color",
    fallbackGradient: "bg-gradient-to-br from-slate-900 via-sky-950 to-slate-950",
    watermarkColor: "text-sky-300/[0.12]",
    categoryBadge: "bg-blue-600 text-white font-extrabold shadow-xs",
    secondaryChip: "bg-black/50 text-white/95 border border-white/20 backdrop-blur-md shadow-2xs",
    borderAccent: "hover:border-blue-500/40",
  },
  electrician: {
    initial: "E",
    photo: "https://images.unsplash.com/photo-1621905252507-b35492cc74b4?w=600&q=80&fit=crop&crop=center",
    tintOverlay: "bg-amber-950/40 mix-blend-color",
    fallbackGradient: "bg-gradient-to-br from-slate-900 via-amber-950 to-slate-950",
    watermarkColor: "text-amber-300/[0.12]",
    categoryBadge: "bg-amber-600 text-white font-extrabold shadow-xs",
    secondaryChip: "bg-black/50 text-white/95 border border-white/20 backdrop-blur-md shadow-2xs",
    borderAccent: "hover:border-amber-500/40",
  },
  housekeeping: {
    initial: "H",
    photo: "https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=600&q=80&fit=crop&crop=center",
    tintOverlay: "bg-emerald-950/40 mix-blend-color",
    fallbackGradient: "bg-gradient-to-br from-slate-900 via-emerald-950 to-slate-950",
    watermarkColor: "text-emerald-300/[0.12]",
    categoryBadge: "bg-emerald-600 text-white font-extrabold shadow-xs",
    secondaryChip: "bg-black/50 text-white/95 border border-white/20 backdrop-blur-md shadow-2xs",
    borderAccent: "hover:border-emerald-500/40",
  },
  painter: {
    initial: "P",
    photo: "https://images.unsplash.com/photo-1562259949-e8e7689d7828?w=600&q=80&fit=crop&crop=center",
    tintOverlay: "bg-rose-950/40 mix-blend-color",
    fallbackGradient: "bg-gradient-to-br from-slate-900 via-rose-950 to-slate-950",
    watermarkColor: "text-rose-300/[0.12]",
    categoryBadge: "bg-rose-600 text-white font-extrabold shadow-xs",
    secondaryChip: "bg-black/50 text-white/95 border border-white/20 backdrop-blur-md shadow-2xs",
    borderAccent: "hover:border-rose-500/40",
  },
  carpenter: {
    initial: "C",
    photo: "https://images.unsplash.com/photo-1538688525198-9b88f6f53126?w=600&q=80&fit=crop&crop=center",
    tintOverlay: "bg-teal-950/40 mix-blend-color",
    fallbackGradient: "bg-gradient-to-br from-slate-900 via-teal-950 to-slate-950",
    watermarkColor: "text-teal-300/[0.12]",
    categoryBadge: "bg-teal-600 text-white font-extrabold shadow-xs",
    secondaryChip: "bg-black/50 text-white/95 border border-white/20 backdrop-blur-md shadow-2xs",
    borderAccent: "hover:border-teal-500/40",
  },
  default: {
    initial: "S",
    photo: "https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=600&q=80&fit=crop&crop=center",
    tintOverlay: "bg-indigo-950/40 mix-blend-color",
    fallbackGradient: "bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-950",
    watermarkColor: "text-indigo-300/[0.12]",
    categoryBadge: "bg-indigo-600 text-white font-extrabold shadow-xs",
    secondaryChip: "bg-black/50 text-white/95 border border-white/20 backdrop-blur-md shadow-2xs",
    borderAccent: "hover:border-indigo-500/40",
  },
};

const getCategoryDesignToken = (serviceId: string): CategoryDesignToken => {
  return CATEGORY_TOKENS[serviceId] || CATEGORY_TOKENS.default;
};

const modernSuggestionCardConfigs: Record<string, {
  title: string;
  caption: string;
  icon: typeof Zap;
  label?: string;
}> = {
  "sug-elec-3": {
    title: "Smart AC Cleaning",
    caption: "Fresh air & peak cooling efficiency",
    icon: AirVent,
    label: "AC Care",
  },
  "sug-elec-1": {
    title: "Fan Deep Cleaning",
    caption: "Smooth, noise-free airflow for your home",
    icon: Fan,
    label: "Fan Service",
  },
  "sug-elec-2": {
    title: "Switchboard Maintenance",
    caption: "Check loose connections & fire safety",
    icon: Zap,
    label: "Safety Check",
  },
  "sug-plumb-4": {
    title: "Drainage Cleaning",
    caption: "Prevent water blockage & clogs",
    icon: CloudRain,
    label: "Rain Ready",
  },
  "sug-hk-2": {
    title: "Home Sanitization",
    caption: "Safe, germ-free & hygienic space",
    icon: SprayCan,
    label: "Sanitize",
  },
  "sug-hk-5": {
    title: "Post-Monsoon Cleanup",
    caption: "Damp walls & mould deep cleaning",
    icon: SprayCan,
    label: "Monsoon Care",
  },
  "sug-elec-5": {
    title: "Festival Home Setup",
    caption: "Sparkling clean home for celebrations",
    icon: Sparkles,
    label: "Festival Ready",
  },
  "sug-exp-2": {
    title: "Festival Preparation",
    caption: "Deep clean & ready home for guests",
    icon: Gift,
    label: "Festive Special",
  },
};

const getModernSuggestionConfig = (sugg: SmartSuggestion) => {
  const base = modernSuggestionCardConfigs[sugg.id];
  if (base) return base;
  const fallback = getSuggestionIconConfig(sugg.serviceId);
  return {
    title: sugg.title,
    caption: sugg.subtitle,
    icon: fallback.icon,
    label: sugg.season !== "all" ? sugg.season.toUpperCase() : undefined,
  };
};

const recommendedDescriptions: Record<string, string> = {
  "sug-elec-1": "Ceiling fan is making noise and needs inspection or servicing.",
  "sug-elec-2": "Switchboard maintenance is required to check loose connections and safety risks.",
  "sug-elec-3": "AC filter cleaning is required because the filters may be dirty and affecting cooling efficiency.",
  "sug-elec-4": "Home wiring inspection is required to check electrical safety and prevent faults.",
  "sug-elec-5": "Smart lighting installation is required for upgrading to energy-efficient LED lights.",
  "sug-plumb-1": "Water leakage check is required to find and fix possible leaks at home.",
  "sug-plumb-2": "Kitchen drain cleaning is required to prevent blockage and overflow.",
  "sug-plumb-3": "Bathroom tap repair is required because the tap may be dripping or not working properly.",
  "sug-plumb-4": "Monsoon drainage check is required to inspect and clear possible drain clogs.",
  "sug-hk-1": "Bathroom deep cleaning is required for a full hygiene and stain-removal service.",
  "sug-hk-2": "Full home sanitization is required to clean and sanitize the home thoroughly.",
  "sug-hk-3": "Kitchen deep cleaning is required to remove grease buildup and improve hygiene.",
  "sug-hk-4": "Sofa and carpet cleaning is required to remove dust, stains, and allergens.",
  "sug-hk-5": "Post-monsoon home cleanup is required to address dampness, mould, and general cleaning.",
  "sug-car-1": "Doorstep car wash is required for exterior cleaning at the service location.",
  "sug-car-2": "Interior car detailing is required to deep clean upholstery, dashboard, and cabin areas.",
  "sug-car-3": "Pre-monsoon car care is required to clean and protect the vehicle before heavy rains.",
  "sug-drv-1": "Acting driver service is required for a verified driver today.",
  "sug-exp-1": "General home maintenance is required for inspection and repair of household issues.",
  "sug-exp-2": "Festival home preparation service is required to get the home ready for celebrations.",
};

const RecommendationCard = ({
  sugg,
  idx,
  onSelect,
}: {
  sugg: SmartSuggestion;
  idx: number;
  onSelect: (sugg: SmartSuggestion) => void;
}) => {
  const cardConfig = getModernSuggestionConfig(sugg);
  const Icon = cardConfig.icon;
  const isTopPick = idx < 2;

  return (
    <motion.button
      whileTap={{ scale: 0.98 }}
      onClick={() => onSelect(sugg)}
      className="w-[220px] flex-shrink-0 snap-start rounded-[20px] bg-card p-4 text-left ring-1 ring-line shadow-[0_1px_2px_rgba(14,27,44,0.04),0_12px_28px_-18px_rgba(14,27,44,0.25)] flex flex-col justify-between focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy"
    >
      <div className="flex items-start justify-between">
        <span className="grid h-11 w-11 place-items-center rounded-[14px] bg-sand text-navy">
          <Icon size={20} strokeWidth={1.8} />
        </span>
        {isTopPick ? (
          <span className="rounded-full bg-orange-50 px-2.5 py-1 text-[10.5px] font-semibold text-brand-deep">Top pick</span>
        ) : cardConfig.label ? (
          <span className="rounded-full bg-sand px-2.5 py-1 text-[10.5px] font-medium text-slate-600">{cardConfig.label}</span>
        ) : null}
      </div>
      <div className="mt-5">
        <h3 className="text-[15px] font-semibold leading-snug tracking-tight text-ink line-clamp-2">{cardConfig.title}</h3>
        <p className="mt-1 text-[12px] leading-relaxed text-muted-foreground line-clamp-2">{cardConfig.caption}</p>
      </div>
      <span className="mt-4 inline-flex items-center gap-1 text-[12.5px] font-semibold text-navy">
        Book now <ChevronRight size={14} strokeWidth={2.4} />
      </span>
    </motion.button>
  );
};

const SHORT_LABELS: Record<string, string> = {
  plumber: "Plumber",
  electrician: "Electrician",
  carwash: "Car wash",
  drivers: "Drivers",
  housekeeping: "Cleaning",
  "ac-cleaning": "AC repair",
  "washing-machine-cleaning": "Washer",
};

const STATUS_COPY: Record<string, { title: string; step: number }> = {
  pending: { title: "Finding your professional", step: 0 },
  accepted: { title: "Your professional is confirmed", step: 1 },
  assigned: { title: "Your professional is confirmed", step: 1 },
  on_the_way: { title: "On the way to you", step: 2 },
  arrived: { title: "Arrived at your door", step: 3 },
  in_progress: { title: "Work in progress", step: 3 },
  payment_pending: { title: "Job done. Pay now", step: 3 },
  completed: { title: "Job done. Pay now", step: 3 },
};

const Home = () => {
  const navigate = useNavigate();
  const { user, dispatch, notifications, bookings, currentLocation } = useApp();
  const [menuOpen, setMenuOpen] = useState(false);
  const [locating, setLocating] = useState(false);
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const [realNearbyProviders, setRealNearbyProviders] = useState<Provider[]>([]);

  useEffect(() => {
    dispatch({ type: "SET_ROLE", role: "customer" });
  }, [dispatch]);

  useEffect(() => {
    const abortController = new AbortController();
    const fetchRealProviders = async () => {
      try {
        const params: Record<string, string | number> = {};
        if (user?.id) params.userId = user.id;
        if (currentLocation?.lat != null && currentLocation?.lng != null) {
          params.lat = currentLocation.lat;
          params.lng = currentLocation.lng;
        }
        const res = await api.get("/providers/search", {
          params,
          signal: abortController.signal
        });
        if (res.data.success && res.data.data) {
          setRealNearbyProviders(res.data.data.slice(0, 8));
        }
      } catch (err: any) {
        if (err.name !== "CanceledError" && err.name !== "AbortError") {
          console.error("Failed to fetch nearby providers", err);
        }
      }
    };
    fetchRealProviders();
    return () => abortController.abort();
  }, [user?.id, currentLocation]);

  useEffect(() => {
    const abortController = new AbortController();
    const fetchLatestBookings = async () => {
      if (user?.id) {
        try {
          const res = await api.get(`/bookings/customer/${user.id}`, {
            signal: abortController.signal
          });
          if (res.data?.success) {
            dispatch({ type: "SET_BOOKINGS", bookings: res.data.data });
          }
        } catch (err: any) {
          if (err.name !== "CanceledError" && err.name !== "AbortError") {
            console.error("Failed to fetch customer bookings on home mount:", err);
          }
        }
      }
    };
    fetchLatestBookings();
    return () => abortController.abort();
  }, [user?.id, dispatch]);

  const currentSeason: SmartSuggestion["season"] = useMemo(() => {
    const m = new Date().getMonth();
    if (m >= 2 && m <= 5) return "summer";
    if (m >= 6 && m <= 9) return "monsoon";
    if (m >= 10 && m <= 11) return "festival";
    return "winter";
  }, []);

  const rankedSuggestions = useMemo(() => {
    const bookedServiceIds = new Set(
      (bookings || []).map((b: Booking) => b.serviceId || b.service_id)
    );
    const scored = smartSuggestions
      .filter((s) => s.id !== "sug-plumb-2")
      .map((s) => {
        let score = s.priority;
        if (s.season === currentSeason) score += 5;
        if (s.season === "all") score += 1;
        if (bookedServiceIds.has(s.serviceId)) score += 2;
        return { ...s, score };
      });
    scored.sort((a, b) => b.score - a.score);
    const seen = new Set<string>();
    const deduped: typeof scored = [];
    for (const s of scored) {
      if (!seen.has(s.serviceId) || deduped.length < 4) {
        deduped.push(s);
        seen.add(s.serviceId);
      }
      if (deduped.length >= 5) break;
    }

    const festivalSuggestion = scored.find((s) => s.id === "sug-exp-2");
    if (festivalSuggestion && !deduped.some((s) => s.id === "sug-exp-2")) {
      deduped.push(festivalSuggestion);
    }

    return deduped;
  }, [bookings, currentSeason]);

  const activeBooking = useMemo(() => {
    return (bookings || []).find((b: Booking) =>
      ["pending", "accepted", "assigned", "on_the_way", "arrived", "in_progress", "payment_pending"].includes(b.status) ||
      (b.status === "completed" && !b.paid)
    );
  }, [bookings]);

  const handleLocationFetched = useCallback(async (lat: number, lng: number) => {
    dispatch({ type: "SET_CURRENT_LOCATION", lat, lng });
    setLocating(true);
    try {
      const result = await reverseGeocode(lat, lng);
      if (result.address) {
        dispatch({ type: "UPDATE_USER", user: { address: result.address } });
        localStorage.setItem("roundu_last_location", JSON.stringify({ lat, lng, address: result.address, ts: Date.now() }));
      }
    } catch (err) {
      console.warn("Reverse geocode failed:", err);
      try {
        const cached = localStorage.getItem("roundu_last_location");
        if (cached) {
          const parsed = JSON.parse(cached);
          dispatch({ type: "UPDATE_USER", user: { address: parsed.address } });
        }
      } catch (_) { }
    } finally {
      setLocating(false);
    }
  }, [dispatch]);

  const { loading: gpsLoading } = useCurrentLocation(handleLocationFetched);

  // ─── Logout: removes only session keys, keeps phone-specific role ────────
  // ✅ Do NOT use localStorage.clear() — that wipes roundu_role_<phone>
  // and forces re-selection of role on next login. Only remove session keys.
  const handleLogout = () => {
    setMenuOpen(false);
    try { localStorage.removeItem("roundu_token"); } catch (_) { }
    try { localStorage.removeItem("roundu_user"); } catch (_) { }
    try { localStorage.removeItem("roundu_role"); } catch (_) { }
    try { sessionStorage.clear(); } catch (_) { }
    dispatch({ type: "LOGOUT" });
    setTimeout(() => {
      window.location.href = "/";
    }, 50);
  };

  const browseServices = services.slice(0, 8);
  const goToProviders = (id: string) => navigate(`/service-select/${id}`);
  const goToRecommendedBooking = (suggestion: SmartSuggestion) => {
    navigate(`/book-service/${suggestion.serviceId}`, {
      state: {
        serviceId: suggestion.serviceId,
        recommendedSuggestionId: suggestion.id,
        lockedDescription: recommendedDescriptions[suggestion.id] || suggestion.title,
      },
    });
  };

  // All menu items including logout at bottom
  const menuItems = [
    { icon: HomeIcon, label: "Home", path: "/home", isLogout: false },
    { icon: CalendarCheck, label: "My Bookings", path: "/bookings", isLogout: false },
    { icon: Wallet, label: "Wallet", path: "/wallet", isLogout: false },
    { icon: Smartphone, label: "Refer & Earn", path: "/refer-earn", isLogout: false },
    { icon: Settings, label: "Settings", path: "/settings", isLogout: false },
    { icon: HelpCircle, label: "Help & Support", path: "/support", isLogout: false },
    { icon: LogOut, label: "Logout", path: "", isLogout: true },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
  };
  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } },
  };

  const firstName = (user?.name || "there").split(" ")[0];
  const status = activeBooking ? STATUS_COPY[activeBooking.status] || { title: "Booking in progress", step: 1 } : null;

  return (
    <div className="min-h-screen flex flex-col bg-background pb-32 relative overflow-x-hidden">

      {/* ═══════ SLIDE-OUT MENU ═══════ */}
      <div className={`fixed inset-0 z-50 ${menuOpen ? "pointer-events-auto" : "pointer-events-none"}`}>
        <div
          className={`absolute inset-0 bg-ink/40 backdrop-blur-sm transition-opacity duration-300 ${menuOpen ? "opacity-100" : "opacity-0"}`}
          onClick={() => setMenuOpen(false)}
        />
        <div
          className={`absolute top-0 left-0 w-[290px] bg-paper flex flex-col transition-transform duration-300 ease-out shadow-2xl ${menuOpen ? "translate-x-0" : "-translate-x-full"}`}
          style={{ height: "100dvh" }}
        >
          <div className="flex-shrink-0 px-6 pt-12 pb-6 border-b border-line relative">
            <button
              onClick={() => setMenuOpen(false)}
              className="absolute top-5 right-5 grid h-9 w-9 place-items-center rounded-full bg-sand"
              aria-label="Close menu"
            >
              <X size={16} className="text-ink" />
            </button>
            <div className="flex items-center gap-3">
              <div className="grid h-14 w-14 flex-shrink-0 place-items-center overflow-hidden rounded-full bg-navy text-lg font-semibold text-paper">
                {user.profilePicture ? (
                  <img src={user.profilePicture} alt={user.name} className="h-full w-full object-cover" />
                ) : (
                  firstName[0]?.toUpperCase()
                )}
              </div>
              <div className="min-w-0">
                <h3 className="truncate text-[16px] font-semibold text-ink">{user.name}</h3>
                <p className="mt-0.5 truncate text-[12px] text-muted-foreground">{user.phone || user.email || "RoundU member"}</p>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto overscroll-contain px-3 py-3" style={{ WebkitOverflowScrolling: "touch" }}>
            {menuItems.map((item, idx) => (
              <button
                key={idx}
                onClick={() => {
                  if (item.isLogout) handleLogout();
                  else {
                    setMenuOpen(false);
                    navigate(item.path);
                  }
                }}
                className={`w-full flex items-center gap-3.5 rounded-[14px] px-3 py-3.5 text-left transition-colors ${
                  item.isLogout ? "mt-2 text-danger hover:bg-danger-soft" : "text-ink hover:bg-sand"
                }`}
              >
                <item.icon size={19} strokeWidth={1.8} className={item.isLogout ? "text-danger" : "text-navy"} />
                <span className="flex-1 text-[14.5px] font-medium">{item.label}</span>
                {!item.isLogout && <ChevronRight size={15} className="text-slate-400" />}
              </button>
            ))}
            <div className="h-24" />
          </div>
        </div>
      </div>

      {/* ─── Header ─── */}
      <motion.header
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="px-5 pt-5 flex items-center justify-between"
      >
        <motion.button
          whileTap={{ scale: 0.92 }}
          onClick={() => setMenuOpen(true)}
          aria-label="Open menu"
          className="grid h-11 w-11 place-items-center rounded-full bg-card ring-1 ring-line"
        >
          <Menu size={19} className="text-ink" strokeWidth={2} />
        </motion.button>

        <button
          onClick={() => setIsLocationModalOpen(true)}
          className="flex max-w-[190px] items-center gap-1.5 rounded-full bg-card px-3.5 py-2 ring-1 ring-line"
        >
          <MapPin size={14} className="flex-shrink-0 text-brand-amber" />
          <span className="truncate text-[12.5px] font-medium text-ink">
            {locating || gpsLoading ? "Detecting…" : (user.address || "Set location").trim()}
          </span>
        </button>

        <motion.button
          whileTap={{ scale: 0.92 }}
          onClick={() => navigate("/notifications")}
          aria-label="Notifications"
          className="relative grid h-11 w-11 place-items-center rounded-full bg-card ring-1 ring-line"
        >
          <Bell size={19} className="text-ink" strokeWidth={2} />
          {notifications.length > 0 && (
            <span className="absolute right-3 top-3 h-2 w-2 rounded-full bg-brand-amber ring-2 ring-card" />
          )}
        </motion.button>
      </motion.header>

      {/* ─── Greeting + search ─── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.05, ease: [0.22, 1, 0.36, 1] }}
        className="px-5 pt-7"
      >
        <p className="text-[12px] font-medium uppercase tracking-[0.14em] text-muted-foreground">Good to see you, {firstName}</p>
        <h1 className="mt-1.5 text-[30px] font-semibold leading-[1.1] tracking-[-0.03em] text-navy">
          What needs <span className="text-slate-400">fixing today?</span>
        </h1>
        <motion.button
          whileTap={{ scale: 0.99 }}
          onClick={() => navigate("/search")}
          className="mt-5 flex w-full items-center gap-3 rounded-[16px] bg-sand px-4 py-4 text-left"
        >
          <Search size={18} className="text-slate-500" strokeWidth={2} />
          <span className="text-[14.5px] text-slate-500">Kitchen tap is leaking…</span>
        </motion.button>
      </motion.div>

      <motion.div variants={containerVariants} initial="hidden" animate="visible" className="flex-1">
        {/* ═══ ACTIVE BOOKING (styled like the tracking sheet) ═══ */}
        {activeBooking && status && (
          <motion.div variants={itemVariants} className="px-5 pt-6">
            <button
              onClick={() => navigate(`/tracking/${activeBooking.id}`)}
              className="w-full rounded-[22px] bg-card p-5 text-left ring-1 ring-line shadow-[0_18px_40px_-24px_rgba(14,27,44,0.4)] active:scale-[0.99] transition-transform"
            >
              <p className="text-[12px] text-muted-foreground">Your booking</p>
              <div className="mt-0.5 flex items-center justify-between gap-3">
                <h3 className="text-[19px] font-semibold tracking-[-0.02em] text-navy">{status.title}</h3>
                <ChevronRight size={18} className="text-slate-400" />
              </div>
              <div className="mt-4 grid grid-cols-3 gap-2">
                {["Matched", "On the way", "Arrived"].map((label, i) => (
                  <div key={label}>
                    <div className={`h-[3px] rounded-full ${i < status.step ? "bg-brand-amber" : "bg-line"}`} />
                    <p className={`mt-2 text-[11px] ${i < status.step ? "text-ink" : "text-slate-400"}`}>{label}</p>
                  </div>
                ))}
              </div>
            </button>
          </motion.div>
        )}

        {/* ═══ ROUNDU PROMO ═══ */}
        <motion.div variants={itemVariants} className="px-5 pt-6">
          <button
            onClick={() => navigate("/offers")}
            className="relative w-full overflow-hidden rounded-[22px] bg-navy p-5 text-left"
          >
            <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-[radial-gradient(circle,rgba(233,162,74,0.35),rgba(233,162,74,0)_70%)]" />
            <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-paper/60">First booking</p>
            <h3 className="mt-2 max-w-[220px] text-[22px] font-semibold leading-[1.15] tracking-[-0.02em] text-paper">
              50% off your first visit
            </h3>
            <p className="mt-1 text-[12.5px] text-paper/60">Up to ₹200 with code WELCOME50</p>
            <span className="mt-4 inline-flex items-center gap-1.5 rounded-[12px] bg-paper px-3.5 py-2 text-[12.5px] font-semibold text-navy">
              See offers <ChevronRight size={14} strokeWidth={2.4} />
            </span>
          </button>
        </motion.div>

        {/* ═══ SERVICES ═══ */}
        <motion.div variants={itemVariants} className="px-5 pt-8">
          <div className="mb-4 flex items-end justify-between">
            <h2 className="text-[19px] font-semibold tracking-[-0.02em] text-ink">Services</h2>
            <button onClick={() => navigate("/services")} className="text-[13px] font-semibold text-navy">
              See all
            </button>
          </div>
          <div className="grid grid-cols-4 gap-x-3 gap-y-5">
            {browseServices.map((service) => (
              <motion.button
                key={service.id}
                whileTap={{ scale: 0.94 }}
                onClick={() => goToProviders(service.id)}
                className="flex flex-col items-center gap-2"
              >
                <span className="grid h-[62px] w-full place-items-center rounded-[18px] bg-card ring-1 ring-line">
                  <service.icon size={24} className="text-navy" strokeWidth={1.7} />
                </span>
                <span className="text-center text-[11.5px] font-medium leading-tight text-ink">
                  {SHORT_LABELS[service.id] || service.label.split(" ")[0]}
                </span>
              </motion.button>
            ))}
          </div>
        </motion.div>

        {/* ═══ QUICK FIXES ═══ */}
        <motion.div variants={itemVariants} className="pt-8">
          <h2 className="mb-3 px-5 text-[19px] font-semibold tracking-[-0.02em] text-ink">Quick fixes</h2>
          <div className="flex gap-2 overflow-x-auto px-5 pb-1 scrollbar-hide">
            {quickFixes.map((fix) => (
              <motion.button
                whileTap={{ scale: 0.95 }}
                key={fix.id}
                onClick={() =>
                  goToProviders(
                    fix.id === "pipe" || fix.id === "drain" || fix.id === "water" ? "plumber"
                      : fix.id === "fan" || fix.id === "switch" ? "electrician"
                        : fix.id === "cleaning" ? "housekeeping"
                          : fix.id === "driver" ? "drivers"
                            : fix.id === "carwash" ? "carwash"
                              : "security"
                  )
                }
                className="flex flex-shrink-0 items-center gap-2 whitespace-nowrap rounded-full bg-card px-4 py-2.5 text-ink ring-1 ring-line"
              >
                <fix.icon size={15} strokeWidth={2} className="text-brand-amber" />
                <span className="text-[13.5px] font-medium">{fix.label}</span>
              </motion.button>
            ))}
          </div>
        </motion.div>

        {/* ═══ RECOMMENDED ═══ */}
        {rankedSuggestions.length > 0 && (
          <div className="pt-8">
            <h2 className="mb-3 px-5 text-[19px] font-semibold tracking-[-0.02em] text-ink">Recommended for you</h2>
            <div className="flex gap-3 overflow-x-auto px-5 pb-4 pt-1 scrollbar-hide snap-x snap-mandatory items-stretch">
              {rankedSuggestions.map((sugg, idx) => (
                <RecommendationCard key={sugg.id} sugg={sugg} idx={idx} onSelect={goToRecommendedBooking} />
              ))}
            </div>
          </div>
        )}

        {/* ═══ REFER + HELP ═══ */}
        <motion.div variants={itemVariants} className="grid grid-cols-2 gap-3 px-5 pt-4">
          <button onClick={() => navigate("/refer-earn")} className="rounded-[20px] bg-card p-4 text-left ring-1 ring-line">
            <Gift size={20} className="text-brand-amber" strokeWidth={1.8} />
            <h3 className="mt-4 text-[14.5px] font-semibold text-ink">Refer &amp; earn</h3>
            <p className="mt-0.5 text-[12px] text-muted-foreground">₹500 per friend</p>
          </button>
          <button onClick={() => navigate("/get-help")} className="rounded-[20px] bg-card p-4 text-left ring-1 ring-line">
            <HelpCircle size={20} className="text-navy" strokeWidth={1.8} />
            <h3 className="mt-4 text-[14.5px] font-semibold text-ink">Get help</h3>
            <p className="mt-0.5 text-[12px] text-muted-foreground">We reply fast</p>
          </button>
        </motion.div>
      </motion.div>

      <LocationModal isOpen={isLocationModalOpen} onClose={() => setIsLocationModalOpen(false)} />
      <BottomNav />
    </div>
  );
};

export default Home;
