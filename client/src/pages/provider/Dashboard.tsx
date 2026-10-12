import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Bell, Wallet, User, MapPin, Calendar, Clock, Check, X,
  Power, Star, TrendingUp, AlertTriangle, Lightbulb,
  ChevronRight, Inbox, Briefcase, FileText, Image as ImageIcon, Video, Play, Mic, Eye,
  ClipboardCheck, Images, Wrench, LogOut
} from "lucide-react";
import { toast } from "sonner";
import { useApp } from "@/context/AppContext";
import { getServiceById, ProviderRequest } from "@/data/mockData";
import EmptyState from "@/components/EmptyState";
import IncomingRequestPopup from "@/components/IncomingRequestPopup";
import LocationModal from "@/components/LocationModal";
import { socket } from "@/lib/socket";
import { getShortAddress, getDistance } from "@/lib/utils";
import { useCurrentLocation } from "@/hooks/useLocation";
import { reverseGeocode } from "@/lib/mapProvider";
import { motion, AnimatePresence } from "framer-motion";

const formatRupees = (amount: number): string => {
  return amount.toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

const Dashboard = () => {
  const navigate = useNavigate();
  const { providerRequests, completedJobs, dispatch, user, isOnline, providerStats, liveBroadcasts, notifications, quotedBroadcasts, currentLocation, setQuotingBroadcast } = useApp() as any;

  // Sync role to provider on mount
  useEffect(() => {
    dispatch({ type: "SET_ROLE", role: "provider" });
  }, [dispatch]);
  const [showWarning, setShowWarning] = useState(true);
  const {
    walletBalance = 0,
    commissionDue = 0,
    codPendingCount = 0,
    isFrozen = false
  } = useApp() as any;

  const hasPaymentPendingJob = providerRequests.some(
    (r: any) => r.status === "payment_pending"

  );
  const canAcceptScheduledJob = (job: any) => {
    const activeJob = providerRequests.find((r: any) =>
      [
        "accepted",
        "assigned",
        "on_the_way",
        "arrived",
        "in_progress",
        "payment_pending"
      ].includes(r.status)
    );

    if (!activeJob) return true;

    const now = new Date();

    const scheduledTime = new Date(
      `${job.date} ${job.time}`
    );

    const diffHours =
      (scheduledTime.getTime() - now.getTime()) /
      (1000 * 60 * 60);

    return diffHours >= 6;
  };
  const [selectedJob, setSelectedJob] = useState<ProviderRequest | null>(null);
  const [simulatedRequest, setSimulatedRequest] = useState<ProviderRequest | null>(null);

  const [locating, setLocating] = useState(false);
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);

  // State for PIP (Performance Improvement Plan) UI
  const [showPip, setShowPip] = useState(false);
  const [pipType, setPipType] = useState<"new_signup" | "low_rating" | null>(null);
  const [fullScreenImage, setFullScreenImage] = useState<string | null>(null);

  const isCritical = providerStats.rating < 4.0 || (providerStats.responseRate > 0 && providerStats.responseRate < 50);

  const pending = providerRequests.filter((r) => r.status === "pending");
  const accepted = providerRequests.filter((r) => r.status === "accepted" || r.status === "assigned" || r.status === "in_progress" || r.status === "on_the_way" || r.status === "arrived");
  const earnings = completedJobs.reduce((s, j) => s + (Number(j.price) || 0), 0);
  const todayDateStr = new Date().toDateString();
  const todayEarnings = completedJobs
    .filter((j: any) => {
      if (!j.date || j.date === "Today") return true;
      const d = new Date(j.date);
      return !isNaN(d.getTime()) && d.toDateString() === todayDateStr;
    })
    .reduce((s: number, j: any) => s + (Number(j.price) || 0), 0);

  const isBusy = providerRequests.some((r: any) => {
    // Check if job is stale (older than 24 hours)
    let start = r.scheduled_at ? new Date(r.scheduled_at) : null;
    if (!start || isNaN(start.getTime())) {
      if (r.date && r.time) {
        if (r.time.toLowerCase() === 'now') {
          start = new Date();
        } else {
          start = new Date(`${r.date} ${r.time}`);
        }
      }
    }

    if (start && !isNaN(start.getTime())) {
      const ageHours = (new Date().getTime() - start.getTime()) / (1000 * 60 * 60);
      if (ageHours > 24) return false; // Ignore stale jobs
    }

    if (
      [
        "in_progress",
        "on_the_way",
        "arrived",
        "payment_pending"
      ].includes(r.status)
    ) {
      return true;
    }
    if (["assigned", "accepted"].includes(r.status)) {
      if (start && !isNaN(start.getTime())) {
        const durationHours = r.duration || 2;
        const end = new Date(start.getTime() + durationHours * 60 * 60 * 1000);
        const now = new Date();
        if (now >= start && now <= end) {
          return true;
        }
      }
    }
    return false;
  });

  const currentActiveJob = providerRequests.find((r: any) =>
    ["assigned", "accepted", "on_the_way", "arrived", "in_progress", "payment_pending"].includes(r.status)
  );

  const toggleOnline = () => {
    const nextStatus = !isOnline;
    dispatch({ type: "SET_ONLINE", value: nextStatus });
    socket.emit("toggle_online", { userId: user.id, isOnline: nextStatus });
  };



  // Auto-fetch GPS on mount → reverse geocode → update user.address
  const handleLocationFetched = useCallback(async (lat: number, lng: number) => {
    dispatch({ type: "SET_CURRENT_LOCATION", lat, lng });
    setLocating(true);
    try {
      const result = await reverseGeocode(lat, lng);
        if (result.address) {
          dispatch({ type: "UPDATE_USER", user: { address: result.address } });
        }
    } catch (err) {
      console.warn("Reverse geocode failed:", err);
      dispatch({ type: "UPDATE_USER", user: { address: `${lat.toFixed(4)}, ${lng.toFixed(4)}` } });
    } finally {
      setLocating(false);
    }
  }, [dispatch]);
  const { loading: gpsLoading } = useCurrentLocation(handleLocationFetched);

  const seenBroadcastIds = useRef(new Set<string>());

  // Listen for live broadcasts directly in Dashboard (bypasses context closure issue)
  useEffect(() => {
    const handleBroadcast = (broadcast: any) => {
      console.log("Broadcast received:", broadcast);
      console.log("Images:", broadcast.images);
      console.log("[Dashboard] 📡 incoming_broadcast received locally:", broadcast.broadcastId);
      if (seenBroadcastIds.current.has(broadcast.broadcastId)) return; // deduplicate
      // Additional handling can be added here
    };
    socket.on("incoming_broadcast", handleBroadcast);
    return () => {
      socket.off("incoming_broadcast", handleBroadcast);
    };
  }, []);

  useEffect(() => {
    const handleJobTaken = (data: { broadcastId: string; acceptedProviderId: string }) => {
      dispatch({ type: "REMOVE_LIVE_BROADCAST", id: data.broadcastId });
    };
    socket.on("job_taken", handleJobTaken);
    return () => {
      socket.off("job_taken", handleJobTaken);
    };
  }, [dispatch]);

  useEffect(() => {
    const today = new Date().toISOString().slice(0, 10);
    if (providerStats.rating === 0) {
      const hasSeenNewSignup = localStorage.getItem("has_seen_new_signup");
      if (!hasSeenNewSignup) {
        localStorage.setItem("has_seen_new_signup", "true");
        setPipType("new_signup");
        setShowPip(true);
      }
    } else {
      if (providerStats.rating < 3.5) {
        localStorage.setItem("is_in_pip", "true");
      } else if (providerStats.rating >= 3.7) {
        localStorage.setItem("is_in_pip", "false");
      }

      const isInPip = localStorage.getItem("is_in_pip") === "true";
      if (isInPip) {
        const lastSeenLowRating = localStorage.getItem("last_seen_low_rating");
        if (lastSeenLowRating !== today) {
          localStorage.setItem("last_seen_low_rating", today);
          setPipType("low_rating");
          setShowPip(true);
        }
      }
    }
  }, [providerStats.rating]);

  // Listen for job taken events
  useEffect(() => {
    const handleJobTaken = (data: { broadcastId: string; acceptedProviderId: string }) => {
      dispatch({ type: "REMOVE_LIVE_BROADCAST", id: data.broadcastId });
    };
    socket.on("job_taken", handleJobTaken);
    return () => {
      socket.off("job_taken", handleJobTaken);
    };
  }, [dispatch]);
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
  } as any;

  // Accept a direct request (same checks as before, shared by the list and the details sheet)
  const acceptRequest = (r: any) => {
    if (isFrozen) {
      alert("Account Frozen. Clear outstanding commission dues before accepting new jobs.");
      return;
    }
    if (hasPaymentPendingJob) {
      if (r.jobType === "scheduled") {
        const hoursDiff = (new Date(`${r.date} ${r.time}`).getTime() - Date.now()) / (1000 * 60 * 60);
        if (hoursDiff < 6) {
          alert("Scheduled jobs must be at least 6 hours away from your current active job.");
          return;
        }
      } else {
        alert("Complete payment collection for your current Quick Fix job before accepting another one.");
        return;
      }
    }
    socket.emit("update_job_status", { jobId: r.id, status: "accepted" });
    dispatch({ type: "ACCEPT_REQUEST", id: r.id });
    navigate(`/provider/job/${r.id}`);
  };

  const firstName = user.name?.split(" ")[0] || "there";
  const warningOn = showWarning && providerStats.responseRate > 0 && providerStats.responseRate < 90;
  const statusLine = isFrozen
    ? "Account frozen · clear dues to get jobs"
    : isBusy
      ? "On a job · new requests are paused"
      : isOnline
        ? "Online · jobs nearby will reach you"
        : "Offline · go online to get jobs";

  const stats = [
    { label: "Today", value: `₹${Math.round(todayEarnings).toLocaleString("en-IN")}` },
    { label: "Jobs done", value: String(completedJobs.length) },
    { label: "Rating", value: providerStats.rating ? Number(providerStats.rating).toFixed(1) : "New" },
    { label: "Response", value: `${providerStats.responseRate || 0}%` },
  ];

  const actions = [
    { label: "My jobs", sub: `${accepted.length + pending.length} active`, icon: ClipboardCheck, to: "/provider/jobs" },
    { label: "Earnings", sub: `₹${Math.round(earnings).toLocaleString("en-IN")}`, icon: Wallet, to: "/provider/earnings" },
    { label: "Portfolio", sub: "Your work", icon: Images, to: "/provider/portfolio" },
    { label: "Documents", sub: "KYC", icon: FileText, to: "/provider/documents" },
  ];

  return (
    <div className="provider-theme relative flex min-h-full flex-col bg-background pb-28">
      {/* ── Header ── */}
      <div className="sticky top-0 z-[80] flex items-center gap-3 bg-background/90 px-5 pb-3 pt-4 backdrop-blur-md">
        <button
          onClick={() => navigate("/provider/profile")}
          aria-label="Profile"
          className="h-11 w-11 flex-shrink-0 overflow-hidden rounded-full bg-navy ring-1 ring-line"
        >
          {user.profilePicture ? (
            <img src={user.profilePicture} alt={user.name} className="h-full w-full object-cover" />
          ) : (
            <span className="grid h-full w-full place-items-center text-[16px] font-semibold text-paper">{firstName[0]}</span>
          )}
        </button>
        <button onClick={() => setIsLocationModalOpen(true)} className="min-w-0 flex-1 text-left">
          <p className="text-[12px] text-muted-foreground">Working near</p>
          <p className="flex items-center gap-1 truncate text-[14px] font-semibold text-ink">
            <MapPin size={13} className="flex-shrink-0 text-brand-amber" />
            <span className="truncate">
              {locating || gpsLoading ? "Detecting…" : getShortAddress(user.address) || user.address || "Set location"}
            </span>
          </p>
        </button>
        <button
          onClick={() => navigate("/notifications")}
          aria-label="Notifications"
          className="relative grid h-11 w-11 flex-shrink-0 place-items-center rounded-full bg-card text-ink ring-1 ring-line"
        >
          <Bell size={19} strokeWidth={2} />
          {(pending.length > 0 || notifications.length > 0) && (
            <span className="absolute right-2.5 top-2.5 h-2 w-2 rounded-full bg-brand-amber ring-2 ring-card" />
          )}
        </button>
      </div>

      <div className="flex-1 px-5">
        {/* ── Greeting + availability ── */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="mt-2">
          <h1 className="text-[28px] font-semibold leading-[1.1] tracking-[-0.03em] text-navy">Hi, {firstName}</h1>
          <p className="mt-1 text-[14px] text-muted-foreground">{statusLine}</p>
        </motion.div>

        <button
          type="button"
          disabled={isBusy}
          onClick={toggleOnline}
          className={`mt-4 flex w-full items-center justify-between rounded-[20px] px-5 py-4 text-left transition-colors ${
            "bg-card text-ink ring-1 ring-line"
          } ${isBusy ? "cursor-not-allowed opacity-70" : ""}`}
        >
          <span className="flex items-center gap-3">
            <span className="relative flex h-2.5 w-2.5">
              {isOnline && <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-60" />}
              <span className={`relative inline-flex h-2.5 w-2.5 rounded-full ${isOnline ? "bg-success" : "bg-slate-300"}`} />
            </span>
            <span>
              <span className="block text-[15px] font-semibold">{isOnline ? "You're online" : "You're offline"}</span>
              <span className={`block text-[12px] ${"text-muted-foreground"}`}>
                {isBusy ? "Finish your active job first" : isOnline ? "Tap to go offline" : "Tap to start taking jobs"}
              </span>
            </span>
          </span>
          <span className={`relative h-7 w-12 rounded-full p-1 transition-colors ${isOnline ? "bg-brand-amber" : "bg-line"}`}>
            <span className={`block h-5 w-5 rounded-full bg-white shadow transition-transform ${isOnline ? "translate-x-5" : ""}`} />
          </span>
        </button>

        {/* ── Notices ── */}
        <AnimatePresence>
          {(isFrozen || isBusy || warningOn) && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
              <div className="mt-3 space-y-2">
                {isFrozen && (
                  <Notice tone="red" title="Account frozen" body="Outstanding commission dues. Clear them to receive new jobs." />
                )}
                {isBusy && (
                  <Notice tone="amber" title="Active job lock" body="Finish your current job to accept new bookings." />
                )}
                {warningOn && (
                  <Notice
                    tone="amber"
                    title="Response rate is low"
                    body={`You're at ${providerStats.responseRate}%. Accept more jobs to stay in good standing.`}
                    onClose={() => setShowWarning(false)}
                  />
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Live broadcasts ── */}
        {isOnline && !isBusy && liveBroadcasts.length > 0 && (
          <section className="mt-7">
            <SectionTitle>
              <span className="mr-2 inline-block h-2 w-2 animate-pulse rounded-full bg-brand-amber align-middle" />
              Live requests near you
            </SectionTitle>
            <div className="space-y-3">
              {liveBroadcasts.map((b: any) => {
                const service = getServiceById(b.serviceId);
                const isQuoted = b.status === "waiting_for_customer" || (quotedBroadcasts && quotedBroadcasts.includes(b.broadcastId));
                const photos = b.images?.length ? b.images : b.photos || [];
                return (
                  <motion.div
                    key={b.broadcastId}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-[22px] bg-card p-5 ring-1 ring-line shadow-[0_10px_30px_-18px_rgba(14,27,44,0.35)]"
                  >
                    <div className="flex items-start gap-3">
                      <div className="grid h-12 w-12 flex-shrink-0 place-items-center rounded-[14px] bg-orange-50 text-brand-amber">
                        {service && <service.icon size={22} strokeWidth={2} />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-[12px] text-muted-foreground">{service?.label || b.serviceId}</p>
                        <p className="truncate text-[16px] font-semibold text-ink">{b.customerName}</p>
                        <p className="mt-1 flex items-center gap-3 text-[12.5px] text-muted-foreground">
                          <span className="flex min-w-0 items-center gap-1"><MapPin size={12} className="flex-shrink-0" /><span className="truncate">{getShortAddress(b.address) || "Area not given"}</span></span>
                          <span className="flex flex-shrink-0 items-center gap-1"><Clock size={12} /> {b.time}</span>
                        </p>
                      </div>
                    </div>

                    {b.notes && <p className="mt-3 rounded-[12px] bg-sand px-3 py-2 text-[13px] text-ink">“{b.notes}”</p>}

                    {photos.length > 0 && (
                      <div className="mt-3 flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                        {photos.map((img: string, i: number) => (
                          <img
                            key={i}
                            src={img}
                            alt={`Issue ${i + 1}`}
                            onClick={() => setFullScreenImage(img)}
                            className="h-16 w-16 flex-shrink-0 cursor-pointer rounded-[12px] object-cover ring-1 ring-line"
                          />
                        ))}
                      </div>
                    )}

                    {b.voiceNoteUrl && (
                      <div className="mt-3 rounded-[12px] bg-sand p-3">
                        <p className="mb-2 flex items-center gap-1.5 text-[12px] font-medium text-ink"><Mic size={13} /> Voice note</p>
                        <audio
                          src={b.voiceNoteUrl}
                          controls
                          className="h-8 w-full"
                          onError={(e) => {
                            console.error("Audio playback error:", e);
                            (e.target as any).insertAdjacentHTML("afterend", '<p class="text-[11px] text-danger mt-1">Couldn\'t load audio</p>');
                          }}
                        />
                      </div>
                    )}

                    <div className="mt-4 flex gap-2">
                      {isQuoted ? (
                        <>
                          <div className="flex flex-1 items-center justify-center rounded-[14px] bg-sand py-3 text-[13.5px] font-medium text-muted-foreground">
                            Waiting for customer…
                          </div>
                          <button
                            onClick={() => {
                              socket.emit("cancel_quote", { broadcastId: b.broadcastId, customerId: b.customerId, providerId: user.id });
                              dispatch({ type: "REMOVE_QUOTED_BROADCAST", id: b.broadcastId });
                              dispatch({ type: "REMOVE_LIVE_BROADCAST", id: b.broadcastId });
                            }}
                            className="rounded-[14px] px-4 py-3 text-[13.5px] font-medium text-danger ring-1 ring-danger/25"
                          >
                            Cancel quote
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            disabled={isBusy}
                            onClick={() => setQuotingBroadcast(b)}
                            className="flex-1 rounded-[14px] bg-navy py-3 text-[14px] font-semibold text-paper active:scale-[0.98] disabled:opacity-40"
                          >
                            Send a quote
                          </button>
                          <button
                            onClick={() => dispatch({ type: "REMOVE_LIVE_BROADCAST", id: b.broadcastId })}
                            className="rounded-[14px] bg-sand px-5 py-3 text-[14px] font-medium text-ink"
                          >
                            Skip
                          </button>
                        </>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </section>
        )}

        {/* ── Wallet ── */}
        <section className="mt-7">
          <div className={`rounded-[24px] p-5 ${isFrozen ? "bg-danger-ink" : "bg-navy"} text-paper`}>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[13px] text-paper/60">Wallet balance</p>
                <p className="mt-1 text-[32px] font-semibold leading-none tracking-[-0.02em] tabular-nums">₹{formatRupees(Number(walletBalance) || 0)}</p>
              </div>
              <button
                onClick={() => navigate("/provider/earnings")}
                className="flex items-center gap-1 rounded-full bg-white/10 px-3 py-1.5 text-[12px] font-medium"
              >
                Details <ChevronRight size={13} />
              </button>
            </div>
            <div className="mt-5 grid grid-cols-3 gap-3 border-t border-white/10 pt-4">
              <WalletStat label="Commission due" value={`₹${formatRupees(Number(commissionDue) || 0)}`} />
              <WalletStat label="Cash jobs pending" value={String(codPendingCount)} highlight={codPendingCount > 0} />
              <WalletStat label="Platform share" value="15%" />
            </div>
            {hasPaymentPendingJob && (
              <p className="mt-4 rounded-[12px] bg-white/10 px-3 py-2.5 text-[12.5px] leading-relaxed text-paper/85">
                Collect payment for your current job before taking another Quick Fix.
              </p>
            )}
          </div>

          <div className="mt-3 grid grid-cols-4 gap-2">
            {stats.map((s) => (
              <div key={s.label} className="rounded-[16px] bg-card px-2 py-3 text-center ring-1 ring-line">
                <p className="truncate text-[16px] font-semibold tracking-tight text-ink tabular-nums">{s.value}</p>
                <p className="mt-0.5 text-[11px] text-muted-foreground">{s.label}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── Shortcuts ── */}
        <section className="mt-7 grid grid-cols-4 gap-2">
          {actions.map((a) => (
            <button key={a.label} onClick={() => navigate(a.to)} className="flex flex-col items-center gap-2 rounded-[16px] py-1 active:scale-95 transition-transform">
              <span className="grid h-14 w-14 place-items-center rounded-[18px] bg-sand text-navy">
                <a.icon size={22} strokeWidth={1.8} />
              </span>
              <span className="text-center">
                <span className="block text-[12.5px] font-medium text-ink">{a.label}</span>
                <span className="block text-[11px] text-muted-foreground">{a.sub}</span>
              </span>
            </button>
          ))}
        </section>

        {/* ── Direct requests ── */}
        <section className="mt-8">
          <SectionTitle>Direct requests</SectionTitle>
          {!isOnline || isBusy || pending.length === 0 ? (
            <div className="rounded-[22px] bg-card px-6 py-8 text-center ring-1 ring-line">
              <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-sand text-muted-foreground">
                {!isOnline ? <Power size={20} /> : isBusy ? <AlertTriangle size={20} /> : <Inbox size={20} />}
              </span>
              <p className="mt-3 text-[15px] font-semibold text-ink">
                {!isOnline ? "You're offline" : isBusy ? "You're on a job" : "No new requests"}
              </p>
              <p className="mt-1 text-[13px] text-muted-foreground">
                {!isOnline ? "Go online to receive direct requests." : isBusy ? "Finish it to receive new requests." : "Customers who pick you will show up here."}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {pending.map((r: any) => {
                const service = getServiceById(r.serviceId);
                const blocked = isFrozen || (hasPaymentPendingJob && r.jobType !== "scheduled");
                return (
                  <div key={r.id} className="rounded-[22px] bg-card p-5 ring-1 ring-line">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-[12px] text-muted-foreground">{service?.label}</p>
                        <p className="truncate text-[16px] font-semibold text-ink">{r.customerName}</p>
                      </div>
                      <p className="text-[20px] font-semibold tracking-tight text-ink tabular-nums">₹{r.price}</p>
                    </div>
                    <div className="mt-3 space-y-1.5 text-[13px] text-muted-foreground">
                      <p className="flex items-center gap-2"><MapPin size={13} className="flex-shrink-0" /><span className="truncate">{r.address}</span></p>
                      <p className="flex items-center gap-2"><Calendar size={13} /> {r.date} · {r.time}</p>
                    </div>
                    {r.notes && <p className="mt-3 rounded-[12px] bg-sand px-3 py-2 text-[13px] text-ink">“{r.notes}”</p>}
                    <div className="mt-4 flex gap-2">
                      <button
                        onClick={() => acceptRequest(r)}
                        disabled={blocked}
                        className="flex-1 rounded-[14px] bg-navy py-3 text-[14px] font-semibold text-paper active:scale-[0.98] disabled:bg-line disabled:text-muted-foreground"
                      >
                        {isFrozen ? "Account frozen" : hasPaymentPendingJob && r.jobType !== "scheduled" ? "Payment pending" : "Accept"}
                      </button>
                      <button onClick={() => setSelectedJob(r)} className="rounded-[14px] bg-sand px-4 py-3 text-[14px] font-medium text-ink">
                        Details
                      </button>
                      <button
                        onClick={() => dispatch({ type: "REJECT_REQUEST", id: r.id })}
                        aria-label="Reject"
                        className="grid w-12 place-items-center rounded-[14px] text-danger ring-1 ring-danger/25"
                      >
                        <X size={17} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* ── Upcoming ── */}
        {accepted.length > 0 && (
          <section className="mt-8">
            <div className="mb-3 flex items-center justify-between">
              <SectionTitle className="mb-0">Upcoming</SectionTitle>
              <button onClick={() => navigate("/provider/jobs")} className="flex items-center gap-0.5 text-[13px] font-medium text-brand-deep">
                See all <ChevronRight size={14} />
              </button>
            </div>
            <div className="space-y-2">
              {accepted.map((r: any) => {
                const service = getServiceById(r.serviceId);
                return (
                  <button
                    key={r.id}
                    onClick={() => navigate(`/provider/job/${r.id}`)}
                    className="flex w-full items-center gap-3 rounded-[20px] bg-card p-4 text-left ring-1 ring-line active:scale-[0.99] transition-transform"
                  >
                    <span className="grid h-11 w-11 flex-shrink-0 place-items-center rounded-[14px] bg-sand text-navy">
                      {service ? <service.icon size={20} strokeWidth={1.8} /> : <Wrench size={20} />}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[15px] font-semibold text-ink">{service?.label}</span>
                      <span className="block truncate text-[12.5px] text-muted-foreground">{r.customerName} · {r.date}, {r.time}</span>
                    </span>
                    <ChevronRight size={18} className="text-slate-400" />
                  </button>
                );
              })}
            </div>
          </section>
        )}

        {/* ── Recent ── */}
        <section className="mt-8 pb-4">
          <SectionTitle>Recent jobs</SectionTitle>
          <div className="rounded-[22px] bg-card px-4 ring-1 ring-line">
            {completedJobs.slice(0, 3).map((job: any) => {
              const service = getServiceById(job.serviceId);
              return (
                <div key={job.id} className="flex items-center gap-3 border-b border-line py-3.5 last:border-b-0">
                  <span className="grid h-9 w-9 place-items-center rounded-full bg-success-soft text-success-ink">
                    <Check size={16} strokeWidth={2.4} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[14px] font-medium text-ink">{service?.label || "Service completed"}</span>
                    <span className="block text-[12px] text-muted-foreground">{job.date || "Today"}</span>
                  </span>
                  <span className="text-[14.5px] font-semibold text-success-ink tabular-nums">+₹{formatRupees(Number(job.price) || 0)}</span>
                </div>
              );
            })}
            {completedJobs.length === 0 && <p className="py-6 text-center text-[13px] text-muted-foreground">No finished jobs yet.</p>}
          </div>
        </section>
      </div>

      {/* Floating Window for Job Details */}
      {selectedJob && (
        <div className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center sm:p-4">
          <div className="absolute inset-0 bg-ink/40 backdrop-blur-[2px]" onClick={() => setSelectedJob(null)} />
          <div className="relative flex max-h-[85vh] w-full max-w-[430px] flex-col overflow-hidden rounded-t-[28px] bg-card shadow-[0_-20px_50px_-20px_rgba(14,27,44,0.45)] animate-fade-in sm:rounded-[28px]">
            <div className="sticky top-0 z-10 flex items-center justify-between bg-card px-6 pb-2 pt-5">
              <h2 className="text-[20px] font-semibold tracking-[-0.02em] text-navy">Job details</h2>
              <button onClick={() => setSelectedJob(null)} className="grid h-9 w-9 place-items-center rounded-full bg-sand">
                <X size={20} className="text-muted-foreground" />
              </button>
            </div>

            <div className="space-y-3 overflow-y-auto px-6 pb-28 pt-2">
              <div className="flex items-center gap-3">
                <div className="grid h-12 w-12 flex-shrink-0 place-items-center rounded-full bg-navy text-[16px] font-semibold text-paper">
                  {selectedJob.customerName.split(" ").map((n: string) => n[0]).join("")}
                </div>
                <div>
                  <p className="text-[16px] font-semibold text-ink">{selectedJob.customerName}</p>
                  <p className="text-[13px] text-muted-foreground">{getServiceById(selectedJob.serviceId)?.label}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="rounded-[16px] bg-sand p-3.5">
                  <p className="mb-1 flex items-center gap-1 text-[12px] text-muted-foreground"><Calendar size={12} /> Date</p>
                  <p className="text-[14px] font-medium text-ink">{selectedJob.date}</p>
                </div>
                <div className="rounded-[16px] bg-sand p-3.5">
                  <p className="mb-1 flex items-center gap-1 text-[12px] text-muted-foreground"><Clock size={12} /> Time</p>
                  <p className="text-[14px] font-medium text-ink">{selectedJob.time}</p>
                </div>
              </div>

              <div className="rounded-[16px] bg-sand p-3.5">
                <p className="mb-1 flex items-center gap-1 text-[12px] text-muted-foreground"><MapPin size={12} /> Address</p>
                <p className="text-[14px] font-medium text-ink">{selectedJob.address}</p>
              </div>

              <div className="rounded-[16px] bg-success-soft p-3.5">
                <p className="mb-1 flex items-center gap-1 text-[12px] text-success-ink"><Wallet size={12} /> Earnings</p>
                <p className="text-[22px] font-semibold tracking-tight text-success-ink">₹{selectedJob.price}</p>
              </div>

              {selectedJob.notes && (
                <div className="rounded-[16px] bg-sand p-3.5">
                  <p className="mb-1 flex items-center gap-1 text-[12px] text-muted-foreground"><FileText size={12} /> Notes from Customer</p>
                  <p className="text-[13.5px] leading-relaxed text-ink">"{selectedJob.notes}"</p>
                </div>
              )}

              {/* Attachments Section */}
              {(selectedJob.photos?.length > 0 || selectedJob.video || selectedJob.voiceNote) ? (
                <div>
                  <h3 className="mb-2 mt-2 text-[14px] font-semibold text-ink">Attachments provided</h3>
                  <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar">
                    {selectedJob.photos?.map((photo: string, idx: number) => (
                      <div 
                        key={idx} 
                        className="w-24 h-24 rounded-xl bg-muted flex-shrink-0 flex items-center justify-center border border-border shadow-sm overflow-hidden relative cursor-pointer hover:opacity-80 transition-opacity"
                        onClick={() => setFullScreenImage(photo)}
                      >
                        <img src={photo} alt="Issue" className="w-full h-full object-cover" />
                      </div>
                    ))}
                    {selectedJob.video && (
                      <div className="w-24 h-24 rounded-xl bg-muted flex-shrink-0 flex items-center justify-center border border-border relative shadow-sm overflow-hidden">
                        <Video size={24} className="text-muted-foreground/60 z-10" />
                        <div className="absolute inset-0 bg-black/10 flex items-center justify-center z-20">
                          <div className="w-8 h-8 rounded-full bg-black/40 flex items-center justify-center backdrop-blur-sm">
                            <Play size={14} className="text-white fill-white ml-0.5" />
                          </div>
                        </div>
                      </div>
                    )}
                    {selectedJob.voiceNote && selectedJob.voiceNoteUrl && (
                      <div className="w-full bg-primary/5 rounded-xl p-3 border border-primary/10 flex flex-col gap-2 shadow-sm min-w-[200px]">
                        <div className="flex items-center gap-2 text-primary font-bold text-[10px] uppercase tracking-wider">
                          <Mic size={14} /> Voice Note
                        </div>
                        <audio
                          src={selectedJob.voiceNoteUrl}
                          controls
                          className="w-full h-8"
                          onError={(e) => {
                            console.error("Audio playback error:", e);
                            (e.target as any).insertAdjacentHTML('afterend', '<p class="text-[9px] text-danger font-bold mt-1">Error loading audio</p>');
                          }}
                        />
                      </div>
                    )}
                    {selectedJob.voiceNote && !selectedJob.voiceNoteUrl && (
                      <div className="w-32 h-24 rounded-xl bg-muted flex-shrink-0 flex items-center justify-center border border-border flex-col gap-1 shadow-sm">
                        <Mic size={20} className="text-muted-foreground/60" />
                        <span className="text-[10px] text-muted-foreground font-semibold">Voice Note</span>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div>
                  <h3 className="mb-2 mt-2 text-[14px] font-semibold text-ink">Attachments provided</h3>
                  <p className="text-xs text-muted-foreground">No attachments provided.</p>
                </div>
              )}
            </div>

            <div className="absolute bottom-0 left-0 right-0 flex gap-2 border-t border-line bg-card p-4">
              <button
                onClick={() => {
                  dispatch({ type: "REJECT_REQUEST", id: selectedJob.id });
                  setSelectedJob(null);
                }}
                className="flex-1 rounded-[14px] bg-sand py-3.5 text-[14px] font-medium text-ink active:scale-95 transition-transform"
              >
                Reject
              </button>
              <button
                onClick={() => {

                  if (isFrozen) {
                    alert("Account frozen. Clear dues first.");
                    return;
                  }

                  if (hasPaymentPendingJob) {
                    alert(
                      "Complete pending payment before accepting another Quick Fix."
                    );
                    return;
                  }

                  socket.emit("update_job_status", {
                    jobId: selectedJob.id,
                    status: "accepted"
                  });

                  dispatch({
                    type: "ACCEPT_REQUEST",
                    id: selectedJob.id
                  });

                  navigate(`/provider/job/${selectedJob.id}`);
                }}
                disabled={isFrozen} className={`flex-1 rounded-[14px] py-3.5 text-[14px] font-semibold transition-transform
    ${isFrozen || hasPaymentPendingJob
                    ? "bg-line text-muted-foreground cursor-not-allowed"
                    : "bg-navy text-paper"
                  }
  `}
              >
                {isFrozen
                  ? "Account Frozen"
                  : hasPaymentPendingJob
                    ? "Payment Pending"
                    : "Accept Job"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Location Modal */}
      <LocationModal
        isOpen={isLocationModalOpen}
        onClose={() => setIsLocationModalOpen(false)}
      />

      {/* Full-screen Image Modal */}
      {fullScreenImage && (
        <div 
          className="fixed inset-0 z-[2000] flex justify-center items-center p-4 bg-black/90 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setFullScreenImage(null)}
        >
          <button 
            className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors"
            onClick={(e) => { e.stopPropagation(); setFullScreenImage(null); }}
          >
            <X size={24} />
          </button>
          <img 
            src={fullScreenImage} 
            alt="Full size preview" 
            className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl" 
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
};

// ── Small pieces ────────────────────────────────────────────────────────────
const SectionTitle = ({ children, className = "mb-3" }: { children: React.ReactNode; className?: string }) => (
  <h2 className={`${className} text-[17px] font-semibold tracking-[-0.02em] text-navy`}>{children}</h2>
);

const WalletStat = ({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) => (
  <div className="min-w-0">
    <p className={`truncate text-[15px] font-semibold tabular-nums ${highlight ? "text-[#FFB067]" : ""}`}>{value}</p>
    <p className="mt-0.5 text-[11px] leading-tight text-paper/55">{label}</p>
  </div>
);

const Notice = ({ tone, title, body, onClose }: { tone: "amber" | "red"; title: string; body: string; onClose?: () => void }) => (
  <div className={`flex items-start gap-3 rounded-[18px] p-4 ring-1 ${tone === "red" ? "bg-danger-soft ring-danger/25" : "bg-orange-50 ring-orange-200"}`}>
    <AlertTriangle size={17} className={`mt-0.5 flex-shrink-0 ${tone === "red" ? "text-danger" : "text-brand-amber"}`} />
    <div className="min-w-0 flex-1">
      <p className={`text-[14px] font-semibold ${tone === "red" ? "text-danger-ink" : "text-ink"}`}>{title}</p>
      <p className={`mt-0.5 text-[12.5px] leading-relaxed ${tone === "red" ? "text-danger-ink" : "text-muted-foreground"}`}>{body}</p>
    </div>
    {onClose && (
      <button onClick={onClose} aria-label="Dismiss" className="-m-1 p-1 text-muted-foreground">
        <X size={15} />
      </button>
    )}
  </div>
);

export default Dashboard;
