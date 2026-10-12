import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { CalendarCheck } from "lucide-react";
import { useApp } from "@/context/AppContext";
import BottomNav from "@/components/BottomNav";
import BookingCard from "@/components/BookingCard";
import EmptyState from "@/components/EmptyState";
import api from "@/lib/api";
import { motion } from "framer-motion";

const tabs = ["Upcoming", "Active", "Completed"];

const Bookings = () => {
  const navigate = useNavigate();
  const { bookings, user, role, dispatch } = useApp();
  const [tab, setTab] = useState(0);

  useEffect(() => {
    const fetchLatest = async () => {
      if (user?.id && role === "customer") {
        try {
          const res = await api.get(`/bookings/customer/${user.id}`);
          if (res.data?.success) {
            dispatch({ type: "SET_BOOKINGS", bookings: res.data.data });
          }
        } catch (err) {
          console.error("Failed to fetch customer bookings on page mount:", err);
        }
      }
    };
    fetchLatest();
  }, [user?.id, role, dispatch]);

  const filtered = bookings.filter((b) => {
    if (tab === 0) return ["pending", "accepted", "assigned"].includes(b.status);
    if (tab === 1) return ["on_the_way", "arrived", "in_progress"].includes(b.status);
    return ["completed", "paid"].includes(b.status);
  });

  return (
    <div className="flex min-h-full flex-col bg-background pb-28">
      <div className="px-5 pb-3 pt-6">
        <h1 className="text-[28px] font-semibold tracking-[-0.03em] text-navy">Bookings</h1>
        <div className="mt-4 grid grid-cols-3 rounded-[14px] bg-sand p-1">
          {tabs.map((t, i) => (
            <button
              key={t}
              onClick={() => setTab(i)}
              className={`relative rounded-[11px] py-2.5 text-[13.5px] font-medium transition-colors ${i === tab ? "text-ink" : "text-muted-foreground"}`}
            >
              {i === tab && (
                <motion.span
                  layoutId="bookings-tab"
                  className="absolute inset-0 rounded-[11px] bg-card shadow-[0_2px_8px_-2px_rgba(14,27,44,0.18)]"
                  transition={{ type: "spring", stiffness: 420, damping: 34 }}
                />
              )}
              <span className="relative">{t}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto px-5 pb-8 pt-2">
        {filtered.length === 0 ? (
          <div className="mt-10 flex flex-col items-center text-center">
            <span className="grid h-16 w-16 place-items-center rounded-full bg-sand text-navy">
              <CalendarCheck size={26} strokeWidth={1.8} />
            </span>
            <p className="mt-4 text-[17px] font-semibold text-ink">Nothing here yet</p>
            <p className="mt-1 max-w-[240px] text-[13.5px] text-muted-foreground">
              {tab === 2 ? "Finished jobs will show up here." : "When you book a service, you can follow it here."}
            </p>
            <button onClick={() => navigate("/services")} className="mt-5 rounded-[14px] bg-jet px-5 py-3 text-[14px] font-semibold text-paper">
              Book a service
            </button>
          </div>
        ) : (
          filtered.map((b) => <BookingCard key={b.id} booking={b} onClick={() => navigate(`/bookings/${b.id}`)} />)
        )}
      </div>

      <BottomNav />
    </div>
  );
};

export default Bookings;
