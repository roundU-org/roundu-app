import { Calendar, Clock, MapPin } from "lucide-react";
import { Booking, getProviderById, getServiceById } from "@/data/mockData";

interface BookingCardProps {
  booking: Booking;
  onClick?: () => void;
}

const statusStyles: Record<string, string> = {
  pending: "bg-sand text-muted-foreground",
  accepted: "bg-sand text-ink",
  assigned: "bg-sand text-ink",
  on_the_way: "bg-orange-50 text-brand-deep",
  arrived: "bg-orange-50 text-brand-deep",
  in_progress: "bg-orange-50 text-brand-deep",
  completed: "bg-[#E8EFE4] text-[#2F5B2A]",
  paid: "bg-[#E8EFE4] text-[#2F5B2A]",
  cancelled: "bg-red-50 text-red-700",
};

const statusLabels: Record<string, string> = {
  pending: "Pending",
  accepted: "Accepted",
  assigned: "Assigned",
  on_the_way: "On the way",
  arrived: "Arrived",
  in_progress: "In progress",
  completed: "Completed",
  paid: "Paid",
  cancelled: "Cancelled",
};

const BookingCard = ({ booking, onClick }: BookingCardProps) => {
  const provider = (booking as any).providerDetails || getProviderById(booking.providerId) || {
    id: booking.providerId,
    name: "Service Provider",
    distanceKm: 2.5,
  };
  const service = getServiceById(booking.serviceId);
  if (!service) return null;
  return (
    <button
      onClick={onClick}
      className="w-full rounded-[20px] bg-card p-4 text-left ring-1 ring-line transition-transform active:scale-[0.99]"
    >
      <div className="flex items-center gap-3">
        <div className="grid h-12 w-12 flex-shrink-0 place-items-center rounded-[14px] bg-sand text-navy">
          <service.icon size={21} strokeWidth={1.8} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <h3 className="truncate text-[15px] font-semibold text-ink">{service.label}</h3>
            <span className={`flex-shrink-0 rounded-full px-2.5 py-1 text-[11px] font-medium ${statusStyles[booking.status] || "bg-sand text-ink"}`}>
              {statusLabels[booking.status] || booking.status}
            </span>
          </div>
          <p className="mt-0.5 truncate text-[12.5px] text-muted-foreground">
            with {provider.name}
          </p>
        </div>
      </div>
      <div className="mt-3 flex items-center justify-between border-t border-line pt-3 text-[12.5px] text-muted-foreground">
        <span className="flex items-center gap-1.5"><Calendar size={13} /> {booking.date} · {booking.time}</span>
        <span className="flex items-center gap-1.5"><MapPin size={13} /> {provider.distanceKm} km</span>
        <span className="text-[14px] font-semibold text-ink tabular-nums">₹{booking.price}</span>
      </div>
    </button>
  );
};

export default BookingCard;
