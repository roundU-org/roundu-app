import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ArrowLeft, ChevronLeft, ChevronRight } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { FlowHeader, BottomCTA } from "@/components/FlowHeader";

const BookingDate = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { selectedProvider, dispatch } = useApp();
  const [month, setMonth] = useState(new Date());
  const [selected, setSelected] = useState<Date | null>(null);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Enter" && selected) {
        handleNext();
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [selected]);

  if (!selectedProvider && !location.state?.serviceId) {
    navigate("/home", { replace: true });
    return null;
  }

  const year = month.getFullYear();
  const m = month.getMonth();
  const firstDay = new Date(year, m, 1).getDay();
  const daysInMonth = new Date(year, m + 1, 0).getDate();
  const today = new Date(); today.setHours(0, 0, 0, 0);

  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const handleNext = () => {
    if (!selected) return;
    const localDateStr = `${selected.getFullYear()}-${String(selected.getMonth() + 1).padStart(2, '0')}-${String(selected.getDate()).padStart(2, '0')}`;
    dispatch({ type: "SELECT_DATE", date: localDateStr });
    navigate("/booking/time", { state: location.state });
  };

  const quick = [0, 1, 2].map((n) => {
    const d = new Date(today);
    d.setDate(d.getDate() + n);
    return { d, label: n === 0 ? "Today" : n === 1 ? "Tomorrow" : d.toLocaleDateString("en-IN", { weekday: "short" }) };
  });

  return (
    <div className="flex min-h-full flex-col bg-background pb-32">
      <FlowHeader step={1} title="When should we come?" subtitle="Pick a day. You'll choose the time next." />

      <div className="flex-1 px-5 pt-4">
        <div className="grid grid-cols-3 gap-2">
          {quick.map(({ d, label }) => {
            const on = selected?.toDateString() === d.toDateString();
            return (
              <button
                key={label}
                onClick={() => {
                  setSelected(d);
                  setMonth(new Date(d.getFullYear(), d.getMonth(), 1));
                }}
                className={`rounded-[16px] px-3 py-3 text-left transition-colors active:scale-[0.98] ${on ? "bg-jet text-paper" : "bg-card text-ink ring-1 ring-line"}`}
              >
                <span className="block text-[14px] font-semibold">{label}</span>
                <span className={`block text-[12px] ${on ? "text-paper/60" : "text-muted-foreground"}`}>
                  {d.toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                </span>
              </button>
            );
          })}
        </div>

        <div className="mt-4 rounded-[24px] bg-card p-5 ring-1 ring-line">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-[16px] font-semibold text-ink">{month.toLocaleString("en", { month: "long", year: "numeric" })}</h3>
            <div className="flex gap-1.5">
              <button onClick={() => setMonth(new Date(year, m - 1, 1))} aria-label="Previous month" className="grid h-9 w-9 place-items-center rounded-full bg-sand text-ink">
                <ChevronLeft size={16} />
              </button>
              <button onClick={() => setMonth(new Date(year, m + 1, 1))} aria-label="Next month" className="grid h-9 w-9 place-items-center rounded-full bg-sand text-ink">
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
          <div className="mb-1 grid grid-cols-7">
            {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
              <div key={i} className="py-1 text-center text-[11px] text-muted-foreground">{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-y-1">
            {cells.map((d, i) => {
              if (d === null) return <div key={i} />;
              const date = new Date(year, m, d);
              const isPast = date < today;
              const isSelected = selected && date.toDateString() === selected.toDateString();
              const isToday = date.toDateString() === today.toDateString();
              return (
                <button
                  key={i}
                  disabled={isPast}
                  onClick={() => setSelected(date)}
                  className={`relative mx-auto grid aspect-square w-full max-w-[42px] place-items-center rounded-full text-[14px] tabular-nums transition-colors ${
                    isSelected ? "bg-jet font-semibold text-paper" : isPast ? "cursor-not-allowed text-slate-300" : "text-ink hover:bg-sand"
                  }`}
                >
                  {d}
                  {isToday && !isSelected && <span className="absolute bottom-1 h-1 w-1 rounded-full bg-brand-amber" />}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <BottomCTA onClick={handleNext} disabled={!selected}>
        {selected ? `Continue · ${selected.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" })}` : "Choose a day"}
      </BottomCTA>
    </div>
  );
};

export default BookingDate;
