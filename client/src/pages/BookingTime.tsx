import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ArrowLeft, Clock } from "lucide-react";
import { timeSlots } from "@/data/mockData";
import { useApp } from "@/context/AppContext";
import { FlowHeader, BottomCTA } from "@/components/FlowHeader";

const BookingTime = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { selectedDate, dispatch } = useApp();
  const [time, setTime] = useState<string | null>(null);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Enter" && time) {
        handleNext();
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [time]);

  if (!selectedDate) {
    navigate("/booking/date", { replace: true });
    return null;
  }

  const handleNext = () => {
    if (!time) return;
    dispatch({ type: "SELECT_TIME", time });
    
    if (location.state?.serviceId) {
      const bcId = `bc-${Date.now()}`;
      sessionStorage.setItem("searching_providers_state", JSON.stringify({
        serviceId: location.state.serviceId,
        broadcastId: bcId,
        selectedDate,
        selectedTime: time
      }));
      sessionStorage.removeItem("searching_providers_scroll");
      navigate(`/searching-providers/${location.state.serviceId}`, { state: { selectedDate, selectedTime: time } });
    } else {
      navigate("/booking/notes");
    }
  };

  const dayLabel = (() => {
    const d = new Date(`${selectedDate}T00:00:00`);
    return isNaN(d.getTime()) ? selectedDate : d.toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" });
  })();
  const hourOf = (t: string) => {
    const [hm, ap] = t.split(" ");
    const h = Number(hm.split(":")[0]) % 12;
    return ap === "PM" ? h + 12 : h;
  };
  const groups = [
    { name: "Morning", slots: timeSlots.filter((t) => hourOf(t) < 12) },
    { name: "Afternoon", slots: timeSlots.filter((t) => hourOf(t) >= 12 && hourOf(t) < 16) },
    { name: "Evening", slots: timeSlots.filter((t) => hourOf(t) >= 16) },
  ];
  const short = (t: string) => t.replace(/^0/, "").toLowerCase();

  return (
    <div className="flex min-h-full flex-col bg-background pb-32">
      <FlowHeader step={2} title="What time suits you?" subtitle={dayLabel} />

      <div className="flex-1 space-y-6 px-5 pt-4">
        {groups.map((g) => (
          <div key={g.name}>
            <p className="mb-2.5 text-[13px] font-medium text-muted-foreground">{g.name}</p>
            <div className="grid grid-cols-3 gap-2">
              {g.slots.map((t) => (
                <button
                  key={t}
                  onClick={() => setTime(t)}
                  className={`rounded-[14px] py-3.5 text-[14px] tabular-nums transition-colors active:scale-[0.97] ${
                    time === t ? "bg-jet font-semibold text-paper" : "bg-card text-ink ring-1 ring-line"
                  }`}
                >
                  {short(t)}
                </button>
              ))}
            </div>
          </div>
        ))}
        <p className="flex items-center gap-2 text-[12.5px] text-muted-foreground">
          <Clock size={14} className="text-brand-amber" /> Your professional arrives within 30 minutes of the slot.
        </p>
      </div>

      <BottomCTA onClick={handleNext} disabled={!time}>
        {time ? `Continue · ${short(time)}` : "Choose a time"}
      </BottomCTA>
    </div>
  );
};

export default BookingTime;
