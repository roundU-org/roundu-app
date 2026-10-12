import { useNavigate, useParams } from "react-router-dom";
import { Calendar, Star, XCircle, ShieldCheck, IndianRupee, Hash, MessageSquare, MapPin } from "lucide-react";
import { FlowHeader } from "@/components/FlowHeader";
import { useApp } from "@/context/AppContext";
import { socket } from "@/lib/socket";
import { getProviderById, getServiceById } from "@/data/mockData";

const BookingDetail = () => {
  const navigate = useNavigate();
  const { id = "" } = useParams();
  const { bookings } = useApp();
  const booking = bookings.find((b) => b.id === id);
  if (!booking) {
    navigate("/bookings", { replace: true });
    return null;
  }
  const provider = (booking as any).providerDetails || getProviderById(booking.providerId) || {
    id: booking.providerId,
    name: "Service Provider",
    experienceYrs: 3,
    rating: 4.8,
    distanceKm: 2.5,
  };
  const service = getServiceById(booking.serviceId);

  const status = booking.status as string;
  const statusChip: Record<string, { label: string; cls: string }> = {
    pending: { label: "Finding a pro", cls: "bg-sand text-ink" },
    accepted: { label: "Confirmed", cls: "bg-sand text-ink" },
    assigned: { label: "Confirmed", cls: "bg-sand text-ink" },
    on_the_way: { label: "On the way", cls: "bg-orange-50 text-brand-deep" },
    arrived: { label: "Arrived", cls: "bg-orange-50 text-brand-deep" },
    in_progress: { label: "In progress", cls: "bg-orange-50 text-brand-deep" },
    payment_pending: { label: "Payment due", cls: "bg-orange-50 text-brand-deep" },
    completed: { label: "Completed", cls: "bg-success-soft text-success-ink" },
    paid: { label: "Paid", cls: "bg-success-soft text-success-ink" },
    cancelled: { label: "Cancelled", cls: "bg-danger-soft text-danger-ink" },
  };
  const chip = statusChip[status] || { label: status.replace("_", " "), cls: "bg-sand text-ink" };
  const canCancel = ["pending", "assigned", "accepted", "on_the_way"].includes(status);
  const isLive = !["completed", "cancelled", "paid"].includes(status);

  return (
    <div className="flex min-h-full flex-col bg-background pb-32">
      <FlowHeader title={service?.label || "Booking"} subtitle={`Booking KA${String(booking.id).slice(-6).toUpperCase()}`} />

      <div className="flex-1 space-y-3 px-5 pt-3">
        <div className="rounded-[24px] bg-card p-5 ring-1 ring-line">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="grid h-12 w-12 place-items-center overflow-hidden rounded-full bg-navy text-[17px] font-semibold text-paper">
                {(provider?.name || "P")[0]}
              </div>
              <div>
                <p className="text-[16px] font-semibold text-ink">{provider?.name}</p>
                <p className="flex items-center gap-1 text-[12.5px] text-muted-foreground">
                  <Star size={11} className="fill-brand-amber text-brand-amber" /> {Number(provider?.rating || 4.8).toFixed(1)}
                  <span>· {service?.label}</span>
                </p>
              </div>
            </div>
            <span className={`rounded-full px-2.5 py-1 text-[11.5px] font-medium ${chip.cls}`}>{chip.label}</span>
          </div>

          <div className="mt-4 border-t border-line">
            <Row icon={Calendar} label="When" value={`${booking.date}, ${booking.time}`} />
            <Row icon={IndianRupee} label="Price" value={booking.price ? `₹${booking.price}` : "After inspection"} />
            <Row icon={MapPin} label="Distance" value={`${provider?.distanceKm ?? "—"} km away`} />
            <Row icon={Hash} label="Booking ID" value={`KA${String(booking.id).slice(-6).toUpperCase()}`} />
          </div>
        </div>

        {booking.notes && (
          <div className="rounded-[22px] bg-card p-4 ring-1 ring-line">
            <p className="mb-1 text-[12.5px] text-muted-foreground">Your note</p>
            <p className="text-[14.5px] text-ink">“{booking.notes}”</p>
          </div>
        )}

        {booking.rating && (
          <div className="rounded-[22px] bg-card p-4 ring-1 ring-line">
            <p className="mb-1.5 text-[12.5px] text-muted-foreground">Your review</p>
            <div className="flex gap-0.5">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} size={16} className={i < (booking.rating as number) ? "fill-brand-amber text-brand-amber" : "text-line"} />
              ))}
            </div>
            {booking.review && <p className="mt-2 text-[14px] text-ink">{booking.review}</p>}
          </div>
        )}

        {canCancel && (
          <div className="rounded-[22px] bg-card p-4 ring-1 ring-line">
            <button
              onClick={() => socket.emit("update_job_status", { bookingId: booking.id, status: "cancelled" })}
              className="flex w-full items-center gap-3 text-left active:scale-[0.99] transition-transform"
            >
              <span className="grid h-10 w-10 place-items-center rounded-full bg-danger-soft text-danger">
                <XCircle size={18} />
              </span>
              <span className="flex-1">
                <span className="block text-[15px] font-medium text-danger">Cancel booking</span>
                <span className="block text-[12.5px] text-muted-foreground">Free before the work starts</span>
              </span>
            </button>
            <p className="mt-3 flex items-center gap-1.5 border-t border-line pt-3 text-[12px] text-muted-foreground">
              <ShieldCheck size={13} className="text-success" /> Payments stay inside RoundU until the job is done.
            </p>
          </div>
        )}
      </div>

      <div className="fixed bottom-0 left-0 right-0 z-20 mx-auto flex max-w-[430px] gap-2 bg-background/90 px-5 pb-6 pt-3 backdrop-blur-md">
        {isLive && (
          <>
            <button onClick={() => navigate(`/chat/${booking.id}`)} className="flex items-center justify-center gap-2 rounded-[16px] bg-sand px-5 py-4 text-[15px] font-medium text-ink active:scale-[0.98]">
              <MessageSquare size={17} /> Message
            </button>
            <button onClick={() => navigate(`/tracking/${booking.id}`)} className="flex-1 rounded-[16px] bg-navy py-4 text-[15px] font-semibold text-paper active:scale-[0.98]">
              Track booking
            </button>
          </>
        )}
        {status === "completed" && !booking.rating && (
          <button onClick={() => navigate(`/rating/${booking.id}`)} className="flex-1 rounded-[16px] bg-navy py-4 text-[15px] font-semibold text-paper active:scale-[0.98]">
            Rate {(provider?.name || "your pro").split(" ")[0]}
          </button>
        )}
        {(status === "cancelled" || (status === "completed" && booking.rating) || status === "paid") && (
          <button onClick={() => navigate("/bookings")} className="flex-1 rounded-[16px] bg-sand py-4 text-[15px] font-medium text-ink active:scale-[0.98]">
            Back to bookings
          </button>
        )}
      </div>
    </div>
  );
};

const Row = ({ icon: Icon, label, value }: { icon: any; label: string; value: string }) => (
  <div className="flex items-center gap-3 border-b border-line py-3 last:border-b-0">
    <Icon size={15} className="text-slate-400" />
    <span className="flex-1 text-[13.5px] text-muted-foreground">{label}</span>
    <span className="text-[13.5px] font-medium text-ink">{value}</span>
  </div>
);

export default BookingDetail;
