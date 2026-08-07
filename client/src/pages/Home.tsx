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
      return { icon: ShieldAlert, bgColor: "bg-red-500/10 text-red-500 border-red-500/20" };
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
  const [imgError, setImgError] = useState(false);
  const cardConfig = getModernSuggestionConfig(sugg);
  const token = getCategoryDesignToken(sugg.serviceId);
  const isTopPick = idx < 2;

  return (
    <motion.button
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => onSelect(sugg)}
      className={`w-[245px] sm:w-[265px] flex-shrink-0 snap-start bg-white rounded-[20px] border border-slate-200/80 ${token.borderAccent} shadow-[0_2px_4px_rgba(15,23,42,0.03),0_8px_20px_rgba(15,23,42,0.04)] hover:shadow-[0_4px_12px_rgba(15,23,42,0.06),0_16px_32px_rgba(15,23,42,0.08)] transition-all duration-300 relative overflow-hidden flex flex-col justify-between text-left group cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2`}
    >
      {/* Editorial Macro Photo Hero Stage (~112px / h-28) */}
      <div className="relative h-28 w-full overflow-hidden bg-slate-950 flex-shrink-0 border-b border-slate-900/50">
        {!imgError && token.photo ? (
          <img
            src={token.photo}
            alt={sugg.category}
            onError={() => setImgError(true)}
            className="w-full h-full object-cover contrast-[1.06] brightness-[0.88] saturate-[0.82] group-hover:scale-105 transition-transform duration-700 ease-out"
            loading="lazy"
          />
        ) : (
          /* Option B Graceful Fallback — Line-Art Motif & Tonal Gradient */
          <div className={`w-full h-full ${token.fallbackGradient} relative flex items-center justify-center`}>
            <div className="absolute inset-0 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:14px_14px] opacity-10" />
            <div className={`text-[110px] font-black leading-none select-none absolute -bottom-7 -right-3 ${token.watermarkColor} tracking-tighter pointer-events-none font-sans`}>
              {token.initial}
            </div>
          </div>
        )}

        {/* Category Tonal Hue Color Overlay */}
        <div className={`absolute inset-0 ${token.tintOverlay} pointer-events-none`} />

        {/* Legibility Gradient & Edge Vignette Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/40 to-transparent shadow-[inset_0_0_24px_rgba(0,0,0,0.5)] pointer-events-none" />

        {/* 2-3% Micro Grain/Noise Texture Overlay */}
        <div
          className="absolute inset-0 opacity-25 pointer-events-none mix-blend-overlay"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.08'/%3E%3C/svg%3E")`,
          }}
        />

        {/* Badges Overlay: Dominant Category Pill + Demoted Quiet Chip */}
        <div className="relative z-10 flex items-center justify-between gap-1.5 w-full p-3.5">
          <span className={`text-[10px] uppercase tracking-widest px-2.5 py-1 rounded-md ${token.categoryBadge}`}>
            {sugg.category}
          </span>
          {cardConfig.label && (
            <span className="text-[9.5px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-black/50 text-white/95 border border-white/20 backdrop-blur-md shadow-2xs">
              {cardConfig.label}
            </span>
          )}
        </div>
      </div>

      {/* Card Content Body */}
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          <div className="min-h-[40px] flex items-center">
            <h3 className="text-[15px] font-semibold text-slate-900 tracking-tight leading-snug group-hover:text-primary transition-colors line-clamp-2">
              {cardConfig.title}
            </h3>
          </div>
          <p className="text-[12px] font-normal text-slate-500 leading-relaxed line-clamp-2 mt-1">
            {cardConfig.caption}
          </p>
        </div>

        {/* Footer: Top 1-2 get "Top Pick", otherwise "Suggested" + Dominant Dark Pill CTA */}
        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
          {isTopPick ? (
            <span className="text-[11px] font-semibold text-amber-700 flex items-center gap-1">
              <Sparkles size={12} className="text-amber-500" /> Top Pick
            </span>
          ) : (
            <span className="text-[11px] font-medium text-slate-400">
              Suggested
            </span>
          )}
          <span className="inline-flex items-center gap-1 rounded-xl bg-slate-900 group-hover:bg-primary px-3.5 py-1.5 text-[12px] font-semibold text-white shadow-[0_2px_8px_rgba(15,23,42,0.15)] transition-colors">
            Book Now <ChevronRight size={13} strokeWidth={2.5} className="group-hover:translate-x-0.5 transition-transform" />
          </span>
        </div>
      </div>
    </motion.button>
  );
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

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC] pb-28 relative overflow-x-hidden">

      {/* ═══════ SLIDE-OUT MENU OVERLAY ═══════ */}
      <div
        className={`fixed inset-0 z-50 transition-all duration-300 ${menuOpen ? "pointer-events-auto" : "pointer-events-none"
          }`}
      >
        {/* Backdrop */}
        <div
          className={`absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity duration-300 ${menuOpen ? "opacity-100" : "opacity-0"
            }`}
          onClick={() => setMenuOpen(false)}
        />

        {/* Drawer — full height, flex column, scrollable body */}
        <div
          className={`absolute top-0 left-0 w-[280px] bg-white shadow-2xl flex flex-col transition-transform duration-300 ease-out ${menuOpen ? "translate-x-0" : "-translate-x-full"
            }`}
          style={{ height: "100dvh" }}
        >
          {/* ── User Profile Header (fixed, never scrolls) ── */}
          <div className="flex-shrink-0 px-5 pt-10 pb-5 bg-primary relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-white/5 -translate-y-1/2 translate-x-1/2 pointer-events-none" />
            <button
              onClick={() => setMenuOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
            >
              <X size={18} className="text-white" />
            </button>
            <div className="flex items-center gap-3 relative z-10">
              <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-white/30 flex items-center justify-center flex-shrink-0 bg-white/15">
                {user.profilePicture ? (
                  <img src={user.profilePicture} alt={user.name} className="w-full h-full object-cover" />
                ) : (
                  <img
                    src={`data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="none"><defs><linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="%233B82F6"/><stop offset="100%" stop-color="%232563EB"/></linearGradient></defs><rect width="100" height="100" rx="50" fill="url(%23g)"/><path d="M50 25c6.627 0 12 5.373 12 12s-5.373 12-12 12-12-5.373-12-12 5.373-12 12-12zm-24 45c0-11.046 8.954-20 20-20h8c11.046 0 20 8.954 20 20v2H26v-2z" fill="white" fill-opacity="0.95"/></svg>`}
                    alt="Default Avatar"
                    className="w-full h-full object-cover"
                  />
                )}
              </div>
              <div className="min-w-0">
                <h3 className="text-white font-bold text-[15px] truncate">{user.name}</h3>
                <p className="text-white/60 text-[11px] mt-0.5 truncate">
                  {user.phone || user.email || "RoundU User"}
                </p>
              </div>
            </div>
          </div>

          {/* ── Scrollable Menu List ── */}
          {/* This div takes all remaining height and scrolls independently */}
          <div
            className="flex-1 overflow-y-auto overscroll-contain py-2"
            style={{ WebkitOverflowScrolling: "touch" }}
          >
            {menuItems.map((item, idx) => {
              const isLogout = item.isLogout;
              return (
                <button
                  key={idx}
                  onClick={() => {
                    if (isLogout) {
                      handleLogout();
                    } else {
                      setMenuOpen(false);
                      navigate(item.path);
                    }
                  }}
                  className={`w-full flex items-center gap-3.5 px-5 py-4 transition-colors text-left group ${isLogout
                    ? "hover:bg-red-50 active:bg-red-100"
                    : "hover:bg-slate-50 active:bg-slate-100"
                    }`}
                >
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors flex-shrink-0 ${isLogout
                      ? "bg-red-50 group-hover:bg-red-100"
                      : "bg-[#F1F4F8] group-hover:bg-primary/10"
                      }`}
                  >
                    <item.icon
                      size={18}
                      className={isLogout ? "text-red-500" : "text-primary"}
                      strokeWidth={2}
                    />
                  </div>
                  <span
                    className={`text-[14px] font-semibold flex-1 ${isLogout ? "text-red-500" : "text-foreground"
                      }`}
                  >
                    {item.label}
                  </span>
                  <ChevronRight
                    size={14}
                    className={isLogout ? "text-red-300" : "text-muted-foreground/40"}
                  />
                </button>
              );
            })}

            {/* Bottom padding so last item isn't hidden behind nav bar */}
            <div className="h-24" />
          </div>
        </div>
      </div>

      {/* ─── Header ─── */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="px-5 pt-4 pb-3 flex items-center justify-between bg-white shadow-sm relative z-10"
      >
        <div className="flex items-center gap-3">
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => setMenuOpen(true)}
            className="w-11 h-11 rounded-[16px] bg-[#F8FAFC] border-2 border-transparent hover:border-primary/10 flex items-center justify-center transition-all"
          >
            <Menu size={22} className="text-primary" strokeWidth={2.5} />
          </motion.button>
          <div>
            <h1 className="text-[22px] font-bold text-foreground leading-tight tracking-tight">
              Hi {(user?.name || "User").split(" ")[0]}!{" "}
              <span className="inline-block animate-waving-hand origin-bottom-right">👋</span>
            </h1>
            <button
              onClick={() => setIsLocationModalOpen(true)}
              className="group flex items-center gap-1.5 mt-1.5 text-[12px] font-bold text-muted-foreground hover:text-primary transition-colors cursor-pointer w-fit"
            >
              <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 group-hover:bg-accent/20 transition-colors">
                <MapPin size={10} className="text-primary group-hover:text-accent transition-colors" />
              </div>
              <span className="line-clamp-1 max-w-[150px] truncate leading-none text-left">
                {locating || gpsLoading ? "Detecting..." : (user.address || "Set Location").trim()}
              </span>
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate("/wallet")}
            className="w-11 h-11 rounded-[16px] bg-white border border-[#E8EBF0] flex items-center justify-center transition-all shadow-sm hover:shadow-md hover:border-primary/20"
          >
            <Wallet size={20} className="text-primary" strokeWidth={2} />
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate("/notifications")}
            className="w-11 h-11 rounded-[16px] bg-white border border-[#E8EBF0] flex items-center justify-center relative transition-all shadow-sm hover:shadow-md hover:border-primary/20"
          >
            <Bell size={20} className="text-primary" strokeWidth={2} />
            {notifications.length > 0 && (
              <span className="absolute top-2.5 right-2.5 w-2.5 h-2.5 rounded-full bg-accent border-2 border-white shadow-sm" />
            )}
          </motion.button>
        </div>
      </motion.div>

      {/* ─── Search Bar ─── */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="px-5 pb-5 pt-4 relative z-0"
      >
        <motion.button
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          onClick={() => navigate("/search")}
          className="w-full text-left relative group"
        >
          <div className="absolute left-5 top-1/2 -translate-y-1/2 text-primary/40 group-hover:text-accent transition-colors">
            <Search size={20} strokeWidth={2.5} />
          </div>
          <div className="w-full pl-[52px] pr-5 py-4 rounded-[20px] bg-white border border-slate-200/80 group-hover:border-primary/20 transition-all text-[15px] text-muted-foreground font-medium shadow-sm">
            What service do you need today?
          </div>
        </motion.button>
      </motion.div>

      {/* ─── Scrollable Content ─── */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="flex-1 overflow-y-auto"
      >
        {/* ═══ ACTIVE BOOKING BANNER ═══ */}
        {activeBooking && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="px-5 pt-4 pb-2"
          >
            <div
              onClick={() => navigate(`/tracking/${activeBooking.id}`)}
              className="w-full flex items-center justify-between p-4 rounded-[20px] bg-gradient-to-r from-orange-500 via-amber-500 to-amber-600 text-white shadow-lg cursor-pointer hover:from-orange-600 hover:to-amber-700 transition-all active:scale-[0.99] group border border-amber-400/30"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white/25 flex items-center justify-center animate-pulse">
                  <span className="text-xl">
                    {activeBooking.status === "on_the_way" ? "🛵" :
                      activeBooking.status === "arrived" ? "📍" :
                        activeBooking.status === "in_progress" ? "🔧" :
                          (activeBooking.status === "completed" || activeBooking.status === "payment_pending") && !activeBooking.paid ? "💳" : "👤"}
                  </span>
                </div>
                <div>
                  <h4 className="font-bold text-sm leading-tight text-white">
                    {activeBooking.status === "on_the_way" ? "Provider is on the way" :
                      activeBooking.status === "arrived" ? "Provider has arrived!" :
                        activeBooking.status === "in_progress" ? "Service in progress..." :
                          (activeBooking.status === "completed" || activeBooking.status === "payment_pending") && !activeBooking.paid ? "Service Completed — Pay Now" :
                            "Active Booking Tracking"}
                  </h4>
                  <p className="text-[11px] text-white/90 mt-0.5 font-medium">
                    {(activeBooking.status === "completed" || activeBooking.status === "payment_pending") && !activeBooking.paid ? "Tap to view tracking & complete payment" : "Tap to track live location & status"}
                  </p>
                </div>
              </div>
              <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center group-hover:translate-x-1 transition-transform">
                <ChevronRight size={16} className="text-white" />
              </div>
            </div>
          </motion.div>
        )}

        {/* ═══ AD BANNERS ═══ */}
        <AdBannerCarousel />

        {/* ═══ BROWSE SERVICES ═══ */}
        <motion.div variants={itemVariants} className="px-5 pt-6 pb-2">
          <div className="flex items-end justify-between mb-4">
            <div>
              <h2 className="text-[20px] font-bold text-foreground tracking-tight">Browse Services</h2>
              <p className="text-[13px] text-muted-foreground mt-0.5">Explore our vetted specialists</p>
            </div>
            <button
              onClick={() => navigate("/services")}
              className="text-[13px] font-semibold text-accent flex items-center gap-0.5 hover:text-primary transition-colors bg-accent/10 px-3 py-1.5 rounded-full"
            >
              View All <ChevronRight size={14} />
            </button>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {browseServices.map((service) => (
              <motion.button
                key={service.id}
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => goToProviders(service.id)}
                className="group bg-white rounded-[24px] p-5 text-left transition-all border border-transparent hover:border-primary/10 shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-[0_12px_30px_rgba(21,46,75,0.08)] relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-white via-white to-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                <div className="w-14 h-14 rounded-[18px] bg-[#F8FAFC] flex items-center justify-center mb-4 group-hover:bg-primary/5 transition-colors relative z-10">
                  <service.icon size={26} className="text-primary group-hover:scale-110 transition-transform duration-300" strokeWidth={1.8} />
                </div>
                <h3 className="text-[15px] font-semibold text-foreground leading-tight group-hover:text-primary transition-colors relative z-10">
                  {service.label}
                </h3>
                <p className="text-[12px] text-muted-foreground mt-1 leading-snug relative z-10 line-clamp-2">
                  {service.desc}
                </p>
              </motion.button>
            ))}
          </div>
        </motion.div>

        {/* ═══ QUICK FIXES ═══ */}
        <motion.div variants={itemVariants} className="pt-2 pb-2">
          <div className="px-5 mb-3">
            <h2 className="text-[20px] font-bold text-foreground tracking-tight">Quick Fixes</h2>
            <p className="text-[11px] text-muted-foreground mt-0.5">Common issues solved instantly</p>
          </div>
          <div className="flex gap-2.5 overflow-x-auto px-5 pb-2 scrollbar-hide">
            {quickFixes.map((fix) => (
              <motion.button
                whileHover={{ scale: 1.05 }}
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
                className={`flex items-center gap-2 ${fix.bgClass} ${fix.textClass} px-4 py-2.5 rounded-full whitespace-nowrap hover:brightness-95 transition-all flex-shrink-0 shadow-sm border ${fix.borderClass}`}
              >
                <fix.icon size={16} strokeWidth={2.5} />
                <span className="text-[14px] font-semibold">{fix.label}</span>
              </motion.button>
            ))}
          </div>
        </motion.div>

        {/* ═══ RECOMMENDED FOR YOU ═══ */}
        {rankedSuggestions.length > 0 && (
          <div className="pt-7 pb-4">
            <div className="px-5 flex items-center justify-between mb-5">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-7 h-7 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Sparkles size={15} className="text-primary" />
                  </div>
                  <h2 className="text-[19px] font-bold text-foreground tracking-tight">Recommended for You</h2>
                </div>
                <p className="text-[12px] text-muted-foreground ml-9">Personalized picks based on your activity</p>
              </div>
              <button
                onClick={() => navigate("/bookings")}
                className="text-[12px] font-semibold text-primary hover:text-primary/80 transition-colors bg-primary/5 hover:bg-primary/10 px-3.5 py-1.5 rounded-full flex items-center gap-1"
              >
                History <ChevronRight size={13} />
              </button>
            </div>

            <div className="flex gap-4 overflow-x-auto px-5 pt-2 pb-5 scrollbar-hide snap-x snap-mandatory items-stretch">
              {rankedSuggestions.map((sugg, idx) => (
                <RecommendationCard
                  key={sugg.id}
                  sugg={sugg}
                  idx={idx}
                  onSelect={goToRecommendedBooking}
                />
              ))}
            </div>
          </div>
        )}

        {/* ═══ REFER & EARN ═══ */}
        <motion.div variants={itemVariants} className="px-5 pb-4 pt-4">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate("/refer-earn")}
            className="w-full flex items-center gap-4 p-5 rounded-[24px] bg-[#152E4B] border border-[#0f2a41] shadow-[0_8px_30px_rgba(0,0,0,0.08)] relative overflow-hidden group"
          >
            <div className="absolute top-[-20%] right-[-10%] w-[150px] h-[150px] bg-[#152E4B]/80 rounded-full blur-[40px] pointer-events-none group-hover:bg-[#1A3B5A]/90 transition-colors duration-500" />
            <div className="w-14 h-14 rounded-[18px] bg-[#163B60] shadow-sm flex items-center justify-center flex-shrink-0 z-10 group-hover:scale-110 transition-transform duration-300">
              <Gift size={26} className="text-white" strokeWidth={2} />
            </div>
            <div className="flex-1 text-left z-10">
              <h3 className="text-[16px] font-semibold text-white leading-tight">Refer and Earn</h3>
              <p className="text-[12px] font-medium text-slate-300 mt-1">Invite friends and get ₹500 on their first booking</p>
            </div>
            <ChevronRight size={20} className="text-white flex-shrink-0 z-10 group-hover:translate-x-1 transition-transform" />
          </motion.button>
        </motion.div>

        {/* ═══ GET HELP ═══ */}
        <motion.div variants={itemVariants} className="px-5 pb-6 pt-2">
          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            onClick={() => navigate("/get-help")}
            className="w-full flex items-center gap-4 p-5 rounded-[30px] bg-[#FEF2F2] border border-red-100 shadow-sm shadow-red-100/70 overflow-hidden"
          >
            <div className="w-14 h-14 rounded-[18px] bg-white border border-red-100 shadow-sm flex items-center justify-center flex-shrink-0">
              <HelpCircle size={22} className="text-red-600" strokeWidth={2.2} />
            </div>
            <div className="flex-1 text-left">
              <h3 className="text-[16px] font-semibold text-slate-900 leading-tight">Get Help</h3>
              <p className="text-[13px] text-slate-500 mt-1 leading-relaxed">Our experts are ready to help you.</p>
            </div>
            <ChevronRight size={20} className="text-red-500 flex-shrink-0" />
          </motion.button>
        </motion.div>
      </motion.div>

      <LocationModal
        isOpen={isLocationModalOpen}
        onClose={() => setIsLocationModalOpen(false)}
      />
      <BottomNav />
    </div>
  );
};

export default Home;
