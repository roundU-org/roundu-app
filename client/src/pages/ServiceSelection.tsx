import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";

import {
  ArrowLeft,
  Wrench,
  Droplets,
  Zap,
  Sparkles,
  Car,
  Paintbrush,
  Box,
  ShieldCheck,
  Clock,
  ThumbsUp,
  Loader2,
  ArrowRight,
  Check,
  HelpCircle,
} from "lucide-react";

import { getServiceById } from "@/data/mockData";
import { useApp } from "@/context/AppContext";
import { FlowHeader, BottomCTA } from "@/components/FlowHeader";

import {
  motion,
  AnimatePresence,
} from "framer-motion";

/* =========================================
   ICON MAPPER
========================================= */

const getProblemIcon = (str: string) => {
  const l = str.toLowerCase();

  if (
    l.includes("water") ||
    l.includes("leak") ||
    l.includes("tap") ||
    l.includes("clog") ||
    l.includes("drain")
  )
    return Droplets;

  if (
    l.includes("electric") ||
    l.includes("wire") ||
    l.includes("switch") ||
    l.includes("trip") ||
    l.includes("fan") ||
    l.includes("power") ||
    l.includes("light") ||
    l.includes("fuse")
  )
    return Zap;

  if (
    l.includes("clean") ||
    l.includes("wash") ||
    l.includes("spa") ||
    l.includes("dust")
  )
    return Sparkles;

  if (
    l.includes("car") ||
    l.includes("drive")
  )
    return Car;

  if (
    l.includes("paint") ||
    l.includes("color")
  )
    return Paintbrush;

  if (
    l.includes("install") ||
    l.includes("setup")
  )
    return Box;

  return Wrench;
};

/* =========================================
   COMPONENT
========================================= */

const ServiceSelection = () => {

  const { serviceId } = useParams();

  const navigate = useNavigate();

  const { dispatch } = useApp();

  const service = getServiceById(serviceId || "");
  const [selectedProblems, setSelectedProblems] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showHelpForm, setShowHelpForm] = useState(false);
  const [helpDesc, setHelpDesc] = useState("");
  const [helpContact, setHelpContact] = useState("");

  /* =========================================
     REDIRECT
  ========================================= */

  useEffect(() => {
    if (serviceId === "drivers") {
      navigate(`/book-driver/${serviceId}`, {
        replace: true,
      });
    }
  }, [serviceId, navigate]);

  /* =========================================
     RESET DRAFT
  ========================================= */

  useEffect(() => {
    dispatch({
      type: "RESET_BOOKING_DRAFT",
    });
  }, [dispatch, serviceId]);

  /* =========================================
     NOT FOUND
  ========================================= */

  if (!service) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <h2 className="text-xl font-bold">
          Service not found
        </h2>

        <button
          onClick={() => navigate("/home")}
          className="mt-4 text-primary font-bold"
        >
          Go Home
        </button>
      </div>
    );
  }

  if (serviceId === "drivers")
    return null;

  /* =========================================
     TOGGLE
  ========================================= */

  const toggleSelection = (
    problem: string
  ) => {
    setSelectedProblems((prev) => {
      if (prev.includes(problem)) {
        return prev.filter(
          (p) => p !== problem
        );
      }

      return [...prev, problem];
    });
  };

  /* =========================================
     CONTINUE
  ========================================= */

  const handleContinue = () => {

    if (selectedProblems.length === 0)
      return;

    setIsLoading(true);

    setTimeout(() => {

      setIsLoading(false);

      dispatch({
        type: "SELECT_SERVICE",
        id: service.id,
      });

      navigate(
        `/book-service/${service.id}`,
        {
          state: {
            serviceId: service.id,
            issue:
              selectedProblems.join(", "),
          },
        }
      );
    }, 400);
  };

  /* =========================================
     HELP
  ========================================= */

  const handleConfirmHelp = () => {
    if (!helpDesc.trim() || !helpContact.trim()) return;
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      dispatch({ type: "SELECT_SERVICE", id: service.id });
      navigate(`/book-service/${service.id}`, {
        state: {
          serviceId: service.id,
          issue: `Help Request: ${helpDesc} (Contact: ${helpContact})`
        }
      });
    }, 400);
  };

  /* =========================================
     PROBLEMS
  ========================================= */

  const getExtendedProblems = () => {

    const list = service.commonProblems
      ? [...service.commonProblems]
      : [];

    if (
      service.id === "plumber" &&
      !list.includes("Drain cleaning")
    ) {
      list.push(
        "Drain cleaning",
        "Pipe installation",
        "Low water pressure",
        "Bathtub repair"
      );
    }

    if (
      service.id === "electrician" &&
      !list.includes("Power outage")
    ) {
      list.push(
        "Power outage",
        "Light installation",
        "Wiring issue",
        "Fuse problem"
      );
    }

    if (!list.includes("Other")) {
      list.push("Other");
    }

    return list;
  };

  const problemsList =
    getExtendedProblems();

  return (
    <div className="flex min-h-screen flex-col bg-background pb-32">
      <FlowHeader
        title="What's the problem?"
        subtitle={`${service.label} · pick everything that applies`}
        onBack={() => navigate("/home")}
      />

      <div className="flex-1 px-5 pt-4">
        <motion.ul
          initial="hidden"
          animate="visible"
          variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.035 } } }}
          className="overflow-hidden rounded-[22px] bg-card ring-1 ring-line"
        >
          {problemsList.map((problem) => {
            const on = selectedProblems.includes(problem);
            const Icon = getProblemIcon(problem);
            return (
              <motion.li
                key={problem}
                variants={{ hidden: { opacity: 0, y: 8 }, visible: { opacity: 1, y: 0 } }}
                className="border-b border-line last:border-b-0"
              >
                <button
                  onClick={() => toggleSelection(problem)}
                  aria-pressed={on}
                  className={`flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors ${on ? "bg-orange-50/60" : "active:bg-sand/60"}`}
                >
                  <span className={`grid h-10 w-10 flex-shrink-0 place-items-center rounded-[12px] transition-colors ${on ? "bg-orange-100 text-brand-deep" : "bg-sand text-navy"}`}>
                    <Icon size={18} strokeWidth={1.9} />
                  </span>
                  <span className={`flex-1 text-[15px] ${on ? "font-semibold text-ink" : "text-ink"}`}>{problem}</span>
                  <span
                    className={`grid h-6 w-6 flex-shrink-0 place-items-center rounded-full transition-all ${
                      on ? "bg-navy text-paper" : "ring-1 ring-line"
                    }`}
                  >
                    <AnimatePresence>
                      {on && (
                        <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
                          <Check size={13} strokeWidth={3} />
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </span>
                </button>
              </motion.li>
            );
          })}
        </motion.ul>

        {/* reassurance */}
        <div className="mt-5 grid grid-cols-3 gap-2">
          {[
            { icon: ShieldCheck, label: "Verified pros", tone: "text-success" },
            { icon: Clock, label: "Price before booking", tone: "text-navy" },
            { icon: ThumbsUp, label: "Pay after the job", tone: "text-navy" },
          ].map((t) => (
            <div key={t.label} className="flex flex-col items-center gap-1.5 rounded-[16px] bg-card px-2 py-3 text-center ring-1 ring-line">
              <t.icon size={18} className={t.tone} />
              <span className="text-[11.5px] leading-tight text-muted-foreground">{t.label}</span>
            </div>
          ))}
        </div>
      </div>

      <BottomCTA onClick={handleContinue} disabled={selectedProblems.length === 0 || isLoading}>
        {isLoading ? (
          <span className="inline-flex items-center gap-2"><Loader2 size={18} className="animate-spin" /> One moment…</span>
        ) : selectedProblems.length === 0 ? (
          "Select at least one"
        ) : (
          `Continue · ${selectedProblems.length} issue${selectedProblems.length > 1 ? "s" : ""}`
        )}
      </BottomCTA>
    </div>
  );
};

export default ServiceSelection;