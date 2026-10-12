import { useNavigate, useParams } from "react-router-dom";
import { Check, Calendar, IndianRupee, Hash, Wrench } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { getProviderById, getServiceById } from "@/data/mockData";

const BookingSuccess = () => {
  const navigate = useNavigate();
  const { id = "" } = useParams();
  const { bookings } = useApp();
  const booking = bookings.find((b) => b.id === id);
  if (!booking) {
    navigate("/home", { replace: true });
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

  return (
    <div className="flex min-h-full flex-col bg-background px-5 pb-8 pt-10">
      <div className="flex flex-1 flex-col items-center justify-center text-center">
        <div className="relative mb-7 animate-fade-in-up" style={{ opacity: 0 }}>
          <div className="absolute inset-0 h-24 w-24 rounded-full bg-success-soft animate-pulse-ring" />
          <div className="relative grid h-24 w-24 place-items-center rounded-full bg-success-soft">
            <span className="grid h-14 w-14 place-items-center rounded-full bg-success">
              <Check size={28} className="text-white" strokeWidth={2.6} />
            </span>
          </div>
        </div>

        <h1 className="text-[30px] font-semibold leading-[1.1] tracking-[-0.03em] text-navy">You're booked</h1>
        <p className="mt-2 max-w-xs text-[14.5px] text-muted-foreground">
          {provider?.name} will see you on {booking.date} at {booking.time}.
        </p>

        <div className="mt-8 w-full rounded-[22px] bg-card px-4 text-left ring-1 ring-line">
          <Row icon={Wrench} label="Service" text={service?.label || "Service"} />
          <Row icon={Calendar} label="When" text={`${booking.date}, ${booking.time}`} />
          <Row icon={IndianRupee} label="Price" text={booking.price ? `₹${booking.price}` : "After inspection"} />
          <Row icon={Hash} label="Booking ID" text={booking.id.slice(-8).toUpperCase()} />
        </div>
        <p className="mt-4 text-[12.5px] text-muted-foreground">You'll pay after the job is done.</p>
      </div>

      <div className="space-y-2">
        <button
          onClick={() => navigate(`/tracking/${booking.id}`, { replace: true })}
          className="w-full rounded-[16px] bg-navy py-4 text-[15px] font-semibold text-paper transition-transform active:scale-[0.98]"
        >
          Track your booking
        </button>
        <div className="grid grid-cols-2 gap-2">
          <button onClick={() => navigate(`/chat/${booking.id}`)} className="rounded-[16px] bg-sand py-3.5 text-[14px] font-medium text-ink">
            Message
          </button>
          <button onClick={() => navigate("/home", { replace: true })} className="rounded-[16px] bg-sand py-3.5 text-[14px] font-medium text-ink">
            Home
          </button>
        </div>
      </div>
    </div>
  );
};

const Row = ({ icon: Icon, label, text }: { icon: any; label: string; text: string }) => (
  <div className="flex items-center gap-3 border-b border-line py-3.5 last:border-b-0">
    <Icon size={15} className="text-slate-400" />
    <span className="flex-1 text-[13.5px] text-muted-foreground">{label}</span>
    <span className="text-[13.5px] font-medium text-ink">{text}</span>
  </div>
);

export default BookingSuccess;
