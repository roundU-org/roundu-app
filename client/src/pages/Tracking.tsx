import { useEffect, useState, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Phone, MessageSquare, ChevronLeft, Navigation2, MapPin,
  Wrench, CheckCircle, MoreVertical, Send, Mic, AlertTriangle,
  Key, Calendar, CreditCard, IndianRupee, ChevronRight,
} from "lucide-react";
import { useApp } from "@/context/AppContext";
import MapComponent from "@/components/MapComponent";
import { socket } from "@/lib/socket";
import { getProviderById, getServiceById } from "@/data/mockData";
import api from "@/lib/api";

// ── Stages matching the mockup (horizontal progress bar) ────────────────────
const STAGES = [
  { key: "on_the_way",  label: "On the way",   icon: "🛵" },
  { key: "arrived",     label: "Arrived",       icon: "👤" },
  { key: "in_progress", label: "On Progress",   icon: "🔧" },
  { key: "completed",   label: "Completed",     icon: "✓"  },
] as const;

const STATUS_ORDER = ["assigned", "on_the_way", "arrived", "in_progress", "completed"];

const stageIndex = (status: string) => {
  const mappedStatus = status === "payment_pending" ? "completed" : status;
  const i = STATUS_ORDER.indexOf(mappedStatus);
  return Math.max(i - 1, -1); // -1 = not started, 0 = on_the_way, etc.
};

// ── Chat message type ────────────────────────────────────────────────────────
interface ChatMsg {
  id: string;
  text: string;
  sender: "provider" | "customer";
  time: string;
}

const Tracking = () => {
  const navigate = useNavigate();
  const { id = "" } = useParams();
  const { user, bookings, dispatch, currentLocation } = useApp();
  const booking = bookings.find((b) => b.id === id);

  // Provider state – initialised from context/mock, then enriched via API
  const [provider, setProvider] = useState<any>(() => {
    if (!booking) return undefined;
    if ((booking as any).providerDetails) return (booking as any).providerDetails;
    const mock = getProviderById(booking.providerId);
    if (mock) return mock;
    // Friendly default fallback to prevent crashes for real users in DB
    return {
      id: booking.providerId,
      name: "Professional",
      rating: 4.8,
      reviews: 120,
      pricePerHr: 399,
      experienceYrs: 5,
      avatar: "P",
      verified: true,
      available: true,
      serviceId: booking.serviceId,
    };
  });

  // OTP for the booking
  const [otp, setOtp] = useState<string>((booking as any)?.otp || "8306");

  // Live status & stage
  const [liveStatus, setLiveStatus] = useState<string | null>(null);
  const [stageTimes, setStageTimes] = useState<Record<string, string>>({});
  const [routeInfo, setRouteInfo] = useState<{ distanceKm: number; durationMin: number } | null>(null);

  // ETA
  const [eta, setEta] = useState<number>(provider?.etaMin || 12);

  // Notification toast
  const [notification, setNotification] = useState<{ text: string; emoji: string }>({ text: "", emoji: "" });
  const notifTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Pending quote
  const [pendingQuote, setPendingQuote] = useState<{ amount: number } | null>(null);

  const chatHistories = (useApp() as any).chatHistories || {};
  const globalChat = chatHistories[id] || [];

  // ── Fetch full provider details if not already loaded ─────────────────────
  useEffect(() => {
    if (!booking?.providerId) return;
    if (provider?.phone) return; // already have full details
    api.get(`/providers/${booking.providerId}`)
      .then((res) => {
        if (res.data?.success && res.data?.data?.provider) {
          setProvider(res.data.data.provider);
        }
      })
      .catch((err) => {
        console.warn("Could not fetch provider details via api:", err);
      });
  }, [booking?.providerId]);

  // ── Fetch OTP ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!id) return;
    fetch(`/api/bookings/${id}/otp`)
      .then((r) => r.json())
      .then((data) => { if (data?.otp) setOtp(String(data.otp)); })
      .catch(() => {});
  }, [id]);

  // ── Fetch chat history ────────────────────────────────────────────────────
  useEffect(() => {
    if (!id) return;
    socket.emit("join_chat_room", { bookingId: id });
  }, [id]);

  // ── Socket: location & status ─────────────────────────────────────────────
  useEffect(() => {
    const onStatus = (data: { bookingId: string; status: string; quote?: number }) => {
      const nid = data.bookingId.replace("req-", "");
      if (nid !== id && data.bookingId !== id) return;
      setLiveStatus(data.status);
      dispatch({ type: "UPDATE_BOOKING_STATUS", bookingId: id, status: data.status as any });
      const now = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
      setStageTimes((p) => ({ ...p, [data.status]: now }));
      if (data.status === "quote_set" && data.quote) {
        setPendingQuote({ amount: data.quote });
        showNotification("💰", `Provider sent a quote: ₹${data.quote}`);
      } else if (data.status === "on_the_way") showNotification("🛵", "Provider is on the way!");
      else if (data.status === "arrived")    showNotification("📍", "Provider has arrived!");
      else if (data.status === "in_progress") showNotification("🔧", "Service has started!");
      else if (data.status === "completed" || data.status === "payment_pending") {
        showNotification("✅", "Service completed! Please complete payment below.");
      } else if (data.status === "paid") {
        showNotification("✅", "Payment confirmed! Redirecting to ratings...");
        dispatch({ type: "PAY_BOOKING", id });
        setTimeout(() => navigate(`/rating/${id}`, { replace: true }), 1500);
      }
    };

    socket.on("job_status_updated", onStatus);
    return () => {
      socket.off("job_status_updated", onStatus);
    };
  }, [id, dispatch, navigate]);

  // ── Redirect if booking missing ───────────────────────────────────────────
  useEffect(() => {
    if (!booking) {
      const t = setTimeout(() => { if (!bookings.find((b) => b.id === id)) navigate("/home", { replace: true }); }, 500);
      return () => clearTimeout(t);
    }
  }, [booking, bookings, id, navigate]);

  // ── Redirect to rating if already paid ─────────────────────────────────────
  useEffect(() => {
    if (booking && (booking as any).paid && (booking.status === "completed" || booking.status === "paid")) {
      showNotification("✅", "Payment confirmed! Redirecting to ratings...");
      const t = setTimeout(() => {
        navigate(`/rating/${booking.id}`, { replace: true });
      }, 1500);
      return () => clearTimeout(t);
    }
  }, [booking?.status, (booking as any)?.paid, navigate]);

  if (!booking) return null;

  // ── ETA countdown ─────────────────────────────────────────────────────────
  useEffect(() => {
    const t = setInterval(() => setEta((e) => Math.max(0, e - 1)), 60_000);
    return () => clearInterval(t);
  }, []);



  const showNotification = (emoji: string, text: string) => {
    setNotification({ text, emoji });
    if (notifTimer.current) clearTimeout(notifTimer.current);
    notifTimer.current = setTimeout(() => setNotification({ text: "", emoji: "" }), 4000);
  };

  const handleCall = () => {
    const phone = provider?.phone || "+919999999999";
    window.open(`tel:${phone}`, "_self");
  };



  const handleApproveQuote = () => {
    dispatch({ type: "UPDATE_BOOKING_STATUS", bookingId: id, status: "in_progress" as any });
    socket.emit("update_job_status", { bookingId: id, status: "in_progress" });
    setPendingQuote(null);
    showNotification("✅", "Quote approved!");
  };

  const handleRejectQuote = () => {
    setPendingQuote(null);
    showNotification("❌", "Quote rejected.");
  };

  const currentStatus = liveStatus || booking.status;
  const activeStage = stageIndex(currentStatus);
  const service = getServiceById(booking.serviceId);

  // ── Render ────────────────────────────────────────────────────────────────
  const etaMin = routeInfo ? routeInfo.durationMin : eta;
  const arrivalTime = new Date(Date.now() + etaMin * 60_000).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  const proName = provider?.name || "Your professional";
  const firstName = proName.split(" ")[0];
  const isDone = currentStatus === "completed" || currentStatus === "payment_pending";
  const showOtp = currentStatus === "on_the_way" || currentStatus === "arrived" || currentStatus === "assigned";
  // Matched → On the way → Arrived, as on roundu.in
  const filled = isDone || currentStatus === "in_progress" || currentStatus === "arrived" ? 3 : currentStatus === "on_the_way" ? 2 : 1;

  const headline =
    currentStatus === "arrived" ? { kicker: `${firstName} is here`, title: "Arrived at your door" }
    : currentStatus === "in_progress" ? { kicker: `${firstName} is working on it`, title: "Work in progress" }
    : isDone ? { kicker: "All done", title: "Job completed" }
    : currentStatus === "on_the_way" ? { kicker: `${firstName} is on the way`, title: `Arriving ${arrivalTime}` }
    : { kicker: `${firstName} is confirmed`, title: `Arriving ${arrivalTime}` };

  return (
    <div className="relative mx-auto flex min-h-[100dvh] max-w-[430px] flex-col bg-background">
      {/* ── Map ── */}
      <div className="relative h-[54vh] min-h-[320px] [&>div:first-child]:h-full">
        <MapComponent
          bookingId={id}
          customerLocation={
            booking.lat && booking.lng
              ? [Number(booking.lat), Number(booking.lng)]
              : currentLocation
                ? [currentLocation.lat, currentLocation.lng]
                : [12.9716, 77.5946]
          }
          providerLocation={
            booking.providerLat && booking.providerLng
              ? [Number(booking.providerLat), Number(booking.providerLng)]
              : booking.lat && booking.lng
                ? [Number(booking.lat) + 0.003, Number(booking.lng) + 0.003]
                : currentLocation
                  ? [currentLocation.lat + 0.003, currentLocation.lng + 0.003]
                  : [12.9766, 77.5996]
          }
          onRouteUpdate={(info) => setRouteInfo(info)}
        />
        <button
          onClick={() => navigate("/home")}
          aria-label="Back"
          className="absolute left-4 top-4 z-10 grid h-11 w-11 place-items-center rounded-full bg-card text-ink ring-1 ring-line shadow-[0_8px_20px_-10px_rgba(14,27,44,0.4)]"
        >
          <ChevronLeft size={20} />
        </button>
      </div>

      {/* ── Sheet ── */}
      <div className="relative z-10 -mt-8 flex-1 px-3 pb-10">
        <div className="rounded-[28px] bg-card p-6 ring-1 ring-line shadow-[0_-12px_40px_-16px_rgba(14,27,44,0.3)]">
          {notification.text && (
            <div className="mb-4 flex animate-fade-in items-center gap-2 rounded-[14px] bg-jet px-4 py-3 text-[13px] font-medium text-paper">
              <span>{notification.emoji}</span> {notification.text}
            </div>
          )}

          {pendingQuote && (
            <div className="mb-5 rounded-[18px] bg-orange-50 p-4 ring-1 ring-orange-200">
              <p className="flex items-center gap-1 text-[12px] font-medium text-brand-deep">
                <IndianRupee size={13} /> {firstName} sent a quote
              </p>
              <p className="mt-1 text-[28px] font-semibold tracking-tight text-ink">₹{pendingQuote.amount}</p>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <button onClick={handleApproveQuote} className="rounded-[12px] bg-jet py-3 text-[14px] font-semibold text-paper">
                  Approve
                </button>
                <button onClick={handleRejectQuote} className="rounded-[12px] bg-danger-soft py-3 text-[14px] font-semibold text-danger-ink">
                  Decline
                </button>
              </div>
            </div>
          )}

          {/* Status */}
          <div className="flex items-end justify-between gap-4">
            <div className="min-w-0">
              <p className="text-[13px] text-muted-foreground">{headline.kicker}</p>
              <h2 className="mt-0.5 text-[28px] font-semibold leading-[1.1] tracking-[-0.03em] text-navy">{headline.title}</h2>
            </div>
            {!isDone && currentStatus !== "in_progress" && currentStatus !== "arrived" && (
              <p className="flex-shrink-0 text-[34px] font-semibold leading-none tracking-tight text-ink tabular-nums">
                {etaMin}
                <span className="ml-1 text-[13px] font-medium text-muted-foreground">min</span>
              </p>
            )}
          </div>

          {/* Progress */}
          <div className="mt-5 grid grid-cols-3 gap-2">
            {["Matched", "On the way", "Arrived"].map((label, i) => (
              <div key={label}>
                <div className={`h-[3px] rounded-full ${i < filled ? "bg-brand-amber" : "bg-line"}`} />
                <p className={`mt-2 text-[11.5px] ${i < filled ? "text-ink" : "text-slate-400"}`}>{label}</p>
              </div>
            ))}
          </div>

          {/* Actions */}
          <div className="mt-5 grid grid-cols-2 gap-2">
            <button onClick={handleCall} className="flex items-center justify-center gap-2 rounded-[14px] bg-sand py-3.5 text-[14px] font-medium text-ink active:scale-[0.98]">
              <Phone size={16} /> Call
            </button>
            <button onClick={() => navigate(`/chat/${booking.id}`)} className="flex items-center justify-center gap-2 rounded-[14px] bg-sand py-3.5 text-[14px] font-medium text-ink active:scale-[0.98]">
              <MessageSquare size={16} /> Message
            </button>
          </div>

          {showOtp && (
            <p className="mt-4 text-center text-[13px] text-muted-foreground">
              Share OTP{" "}
              <span className="font-semibold tracking-[0.3em] text-ink">{otp.split("").join(" ")}</span>{" "}
              when they arrive
            </p>
          )}

          {isDone && (
            <button
              className="mt-5 w-full rounded-[14px] bg-jet py-4 text-[15px] font-semibold text-paper active:scale-[0.99]"
              onClick={() => {
                if (!(booking as any).paid) {
                  dispatch({ type: "SELECT_PROVIDER", id: booking.providerId });
                  dispatch({ type: "SELECT_SERVICE", id: booking.serviceId });
                  navigate("/booking/payment", { state: { bookingId: booking.id } });
                } else {
                  navigate(`/rating/${booking.id}`);
                }
              }}
            >
              {!(booking as any).paid ? "Pay now" : "Rate your experience"}
            </button>
          )}
        </div>

        {/* Professional */}
        <div className="mt-3 flex items-center gap-3 rounded-[22px] bg-card p-4 ring-1 ring-line">
          <div className="grid h-12 w-12 flex-shrink-0 place-items-center overflow-hidden rounded-full bg-navy text-[17px] font-semibold text-paper">
            {typeof provider?.avatar === "string" && provider.avatar.startsWith("http") ? (
              <img src={provider.avatar} alt={proName} className="h-full w-full object-cover" />
            ) : (
              proName[0]
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[15px] font-semibold text-ink">{proName}</p>
            <p className="text-[12.5px] text-muted-foreground">
              {service?.label || "Service"} · ★ {provider?.rating?.toFixed(1) || "4.8"}
            </p>
          </div>
          <span className="rounded-full bg-success-soft px-2.5 py-1 text-[11px] font-medium text-success-ink">Verified</span>
        </div>

        {/* Details */}
        <div className="mt-3 rounded-[22px] bg-card px-4 ring-1 ring-line">
          <DetailRow icon={<Wrench size={15} />} label="Service" value={service?.label || booking.serviceId || "Service"} />
          <DetailRow icon={<Key size={15} />} label="Booking ID" value={`KA${String(booking.id).slice(-6).toUpperCase()}`} />
          <DetailRow icon={<Calendar size={15} />} label="Scheduled" value={`${booking.date || "Today"}, ${booking.time || "Now"}`} />
          <DetailRow icon={<IndianRupee size={15} />} label="Price" value={booking.price ? `₹${booking.price}` : "After inspection"} />
          <DetailRow icon={<CreditCard size={15} />} label="Payment" value="After the job" />
        </div>

        <p className="mt-4 flex items-start gap-2 px-2 text-[12px] leading-relaxed text-muted-foreground">
          <AlertTriangle size={13} className="mt-0.5 flex-shrink-0 text-brand-amber" />
          Keep payments inside the app. Never share card or UPI details on a call.
        </p>
      </div>
    </div>
  );
};

// ── Helper: booking detail row ──────────────────────────────────────────────
const DetailRow = ({
  icon, label, value,
}: { icon: React.ReactNode; label: string; value: string }) => (
  <div className="flex items-center gap-3 border-b border-line py-3.5 last:border-b-0">
    <span className="text-slate-400">{icon}</span>
    <span className="flex-1 text-[13.5px] text-muted-foreground">{label}</span>
    <span className="text-[13.5px] font-medium text-ink">{value}</span>
  </div>
);

export default Tracking;
