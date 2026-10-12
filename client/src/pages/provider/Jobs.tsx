import { FlowHeader } from "@/components/FlowHeader";
import { motion } from "framer-motion";
import { useState, useMemo, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ArrowLeft, Clock, Calendar, MapPin, CheckCircle2, ChevronLeft, ChevronRight } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { getServiceById } from "@/data/mockData";
import EmptyState from "@/components/EmptyState";
import { Calendar as DateRangeCalendar } from "@/components/ui/calendar";
import { DateRange } from "react-day-picker";

const formatRupees = (amount: number): string => {
  return amount.toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};
import {
  isWithinInterval,
  parseISO,
  startOfMonth,
  endOfMonth,
  startOfDay,
  endOfDay,
  isAfter,
  isBefore,
  startOfToday,
  startOfWeek,
  endOfWeek,
  startOfYear,
  format,
  isSameDay,
} from "date-fns";

type JobTab = "upcoming" | "active" | "completed";
type JobsDateRanges = Record<JobTab, DateRange | undefined>;

const emptyDateRanges: JobsDateRanges = {
  upcoming: undefined,
  active: undefined,
  completed: undefined,
};

const Jobs = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { providerRequests, completedJobs } = useApp();
  const [tab, setTab] = useState<JobTab>("active");
  const [dateRanges, setDateRanges] = useState<JobsDateRanges>(emptyDateRanges);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [calendarClosing, setCalendarClosing] = useState(false);
  const [activeFilter] = useState<"today">("today");
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const resultsRef = useRef<HTMLDivElement | null>(null);
  const today = startOfToday();
  const dateRange = dateRanges[tab];

  // Persist date range in localStorage
  useEffect(() => {
    const raw = localStorage.getItem("jobsDateRanges");
    if (raw) {
      try {
        const obj = JSON.parse(raw);
        setDateRanges({
          upcoming: obj.upcoming ? {
            from: obj.upcoming.from ? new Date(obj.upcoming.from) : undefined,
            to: obj.upcoming.to ? new Date(obj.upcoming.to) : undefined,
          } : undefined,
          active: obj.active ? {
            from: obj.active.from ? new Date(obj.active.from) : undefined,
            to: obj.active.to ? new Date(obj.active.to) : undefined,
          } : undefined,
          completed: obj.completed ? {
            from: obj.completed.from ? new Date(obj.completed.from) : undefined,
            to: obj.completed.to ? new Date(obj.completed.to) : undefined,
          } : undefined,
        });
      } catch { }
      return;
    }

    const legacyRaw = localStorage.getItem("jobsDateRange");
    if (legacyRaw) {
      try {
        const obj = JSON.parse(legacyRaw);
        setDateRanges((prev) => ({
          ...prev,
          upcoming: {
            from: obj.from ? new Date(obj.from) : undefined,
            to: obj.to ? new Date(obj.to) : undefined,
          },
        }));
      } catch { }
    }
  }, []);

  useEffect(() => {
    const hasRange = Object.values(dateRanges).some((range) => range?.from || range?.to);

    if (hasRange) {
      localStorage.setItem("jobsDateRanges", JSON.stringify({
        upcoming: dateRanges.upcoming ? {
          from: dateRanges.upcoming.from?.toISOString(),
          to: dateRanges.upcoming.to?.toISOString(),
        } : undefined,
        active: dateRanges.active ? {
          from: dateRanges.active.from?.toISOString(),
          to: dateRanges.active.to?.toISOString(),
        } : undefined,
        completed: dateRanges.completed ? {
          from: dateRanges.completed.from?.toISOString(),
          to: dateRanges.completed.to?.toISOString(),
        } : undefined,
      }));
    } else {
      localStorage.removeItem("jobsDateRanges");
    }
    localStorage.removeItem("jobsDateRange");
  }, [dateRanges]);

  useEffect(() => {
    setCalendarOpen(false);
    setCalendarClosing(false);
  }, [tab]);

  useEffect(() => {
    return () => {
      if (closeTimerRef.current) {
        clearTimeout(closeTimerRef.current);
      }
    };
  }, []);

  const handleBack = () => {
    if (window.history.state && window.history.state.idx > 0) {
      navigate(-1);
    } else {
      navigate(location.state?.from === "profile" ? "/provider/profile" : "/provider");
    }
  };

  const parseJobDate = (dateStr: string) => {
    if (!dateStr || dateStr === "Today") return new Date();
    const d = new Date(dateStr);
    if (!isNaN(d.getTime())) return d;
    try {
      return parseISO(dateStr);
    } catch (e) {
      return new Date();
    }
  };

  const formatDateRange = (range: DateRange | undefined) => {
    if (!range?.from) return "Select date range";

    if (range.to) {
      return `${format(range.from, "MMM dd")} - ${format(range.to, "MMM dd")}`;
    }

    return format(range.from, "MMM dd");
  };

  const getTabStyles = (targetTab: JobTab) => {
    return {
      bg: "bg-card",
      border: "border-line",
      text: "text-ink",
      softText: "text-muted-foreground",
      selected: "bg-navy text-paper hover:bg-navy focus:bg-navy",
      middle: "aria-selected:bg-sand aria-selected:text-ink",
    };
  };

  const getDisabledDate = (targetTab: JobTab) => {
    if (targetTab === "upcoming") {
      return (day: Date) => isBefore(day, today);
    }

    if (targetTab === "completed") {
      return (day: Date) => {
        const isTodayDate = isSameDay(day, today);

        if (isTodayDate) return false;

        return isAfter(day, today);
      };
    }

    if (targetTab === "active") {
      // Only allow selecting today; disable all other dates
      return (day: Date) => !isSameDay(day, today);
    }

    const { start, end } = getActiveFilterRange();
    return (day: Date) => isBefore(day, startOfDay(start)) || isAfter(day, endOfDay(end));
  };

  const openCalendar = () => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
    }
    setCalendarClosing(false);
    setCalendarOpen(true);
  };

  const closeCalendar = (scrollToResults = false) => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
    }

    setCalendarClosing(true);
    closeTimerRef.current = setTimeout(() => {
      setCalendarOpen(false);
      setCalendarClosing(false);

      if (scrollToResults) {
        resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }, 180);
  };

  const handleDateRangeChange = (newRange: DateRange | undefined) => {
    setDateRanges((prev) => ({
      ...prev,
      [tab]: newRange,
    }));

    if (newRange?.from && newRange?.to) {
      closeCalendar(true);
    }
  };

  const DateRangeControl = ({ label }: { label: string }) => {
    const styles = getTabStyles(tab);
    const shouldRenderCalendar = calendarOpen || calendarClosing;

    return (
      <div className="px-5 mt-3">
        <button
          type="button"
          onClick={openCalendar}
          aria-expanded={calendarOpen && !calendarClosing}
          className={`flex min-h-14 w-full items-center gap-3 ${styles.bg} ${styles.border} rounded-[18px] border px-4 py-3 text-left transition-transform active:scale-[0.99]`}
        >
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-sand text-navy">
            <Calendar size={18} />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-[12px] text-muted-foreground">
              {label}
            </span>
            <span className="block truncate text-[14.5px] font-semibold text-ink">
              {formatDateRange(dateRange)}
            </span>
          </span>
        </button>

        {shouldRenderCalendar && (
          <div
            className={`mt-2 origin-top overflow-hidden rounded-[18px] border ${styles.border} bg-card ${calendarClosing
              ? "animate-out fade-out zoom-out-95 slide-out-to-top-2 duration-200"
              : "animate-in fade-in zoom-in-95 slide-in-from-top-2 duration-200"
              }`}
          >
            <DateRangeCalendar
              initialFocus
              mode="range"
              defaultMonth={dateRange?.from || (tab === "completed" ? startOfMonth(today) : today)}
              selected={dateRange}
              onSelect={handleDateRangeChange}
              numberOfMonths={1}
              disabled={getDisabledDate(tab)}
              className="p-3"
              classNames={{
                months: "flex flex-col",
                month: "space-y-3 w-full",
                head_cell: "text-muted-foreground rounded-md w-10 flex-1 font-bold text-[0.72rem]",
                cell: "h-10 flex-1 text-center text-sm p-0 relative [&:has([aria-selected].day-range-end)]:rounded-r-md [&:has([aria-selected])]:bg-transparent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
                day: "h-10 w-10 mx-auto p-0 font-medium rounded-full hover:bg-sand aria-selected:opacity-100",
                day_selected: styles.selected,
                day_today: "ring-1 ring-brand-amber",
                day_disabled: "text-muted-foreground opacity-25 cursor-not-allowed bg-transparent hover:bg-transparent",
                day_range_middle: styles.middle,
                day_outside: "day-outside text-muted-foreground opacity-20 aria-selected:opacity-30",
                nav_button_previous: tab === "active" ? "opacity-30 cursor-not-allowed" : "",
                nav_button_next: tab === "active" ? "opacity-30 cursor-not-allowed" : "",
                nav_button: tab === "active" ? "pointer-events-none opacity-30" : undefined,
              }}
              components={
                tab === "active"
                  ? {
                    IconLeft: (props) => <ChevronLeft className="h-4 w-4 opacity-30 cursor-not-allowed" {...props} />,
                    IconRight: (props) => <ChevronRight className="h-4 w-4 opacity-30 cursor-not-allowed" {...props} />,
                  }
                  : undefined
              }
            />
          </div>
        )}
      </div>
    );
  };

  // Get filter range for Active tab based on selected chip
  const getActiveFilterRange = (): { start: Date; end: Date } => {
    const today = startOfToday();
    return {
      start: today,
      end: endOfDay(today),
    };
  };
  const filteredJobs = useMemo(() => {
    const now = new Date();
    const upcomingRange = dateRanges.upcoming;
    const activeRange = dateRanges.active;
    const completedRange = dateRanges.completed;

    // Upcoming jobs: only future jobs
    const upcomingList = providerRequests.filter((r) => {
      const isUpcomingStatus = [
        "pending",
        "accepted",
        "assigned",
        "quote_set",
        "quote_accepted",
        "scheduled",
      ].includes(r.status);

      if (!isUpcomingStatus) return false;

      const jobDate = parseJobDate(r.date);
      // Only show jobs that are today or in the future
      return !isBefore(jobDate, startOfDay(now));
    });

    const filteredUpcoming = upcomingRange?.from || upcomingRange?.to
      ? upcomingList.filter((r) => {
        const jobDate = parseJobDate(r.date);
        const start = upcomingRange.from ? startOfDay(upcomingRange.from) : startOfMonth(now);
        const end = upcomingRange.to ? endOfDay(upcomingRange.to) : (upcomingRange.from ? endOfDay(upcomingRange.from) : endOfMonth(now));
        return isWithinInterval(jobDate, { start, end });
      })
      : upcomingList;

    // Active jobs: only current/in-progress jobs
    const activeList = providerRequests.filter((r) => {
      const isActiveStatus = [
        "on_the_way",
        "arrived",
        "in_progress",
        "payment_pending",
      ].includes(r.status);
      return isActiveStatus;
    });

    const filteredActive = activeList;

    // Completed jobs: all jobs marked as paid/completed, regardless of date
    const completedList = [
      ...providerRequests.filter((r) => ["completed", "paid"].includes(r.status)),
      ...completedJobs,
    ];

    // Apply date range filter only if dates are selected
    const filteredCompleted = completedRange?.from || completedRange?.to
      ? completedList.filter((r) => {
        const jobDate = parseJobDate(r.date);
        const start = completedRange.from ? startOfDay(completedRange.from) : startOfYear(now);
        const end = completedRange.to ? endOfDay(completedRange.to) : (completedRange.from ? endOfDay(completedRange.from) : endOfDay(now));
        return isWithinInterval(jobDate, { start, end });
      })
      : completedList;

    return {
      upcoming: filteredUpcoming,
      active: filteredActive,
      completed: filteredCompleted,
    };
  }, [providerRequests, completedJobs, dateRanges, activeFilter]);

  const upcomingJobs = filteredJobs.upcoming;
  const activeJobs = filteredJobs.active;
  const completedJobsList = filteredJobs.completed;

  // Calculate statistics
  const upcomingEarnings = upcomingJobs.reduce((sum, job) => sum + (Number(job.price) || 0), 0);
  const activeTodayEarnings = activeJobs
    .filter((job) => isSameDay(parseJobDate(job.date), today))
    .reduce((sum, job) => sum + (Number(job.price) || 0), 0);
  const completedEarnings = completedJobsList.reduce((sum, job) => sum + (Number(job.price) || 0), 0);


  const openJob = (job: any) =>
    navigate(`/provider/job/${job.id}`, { state: { from: location.state?.from === "profile" ? "profile" : "jobs" } });

  const tabList: { key: JobTab; label: string; count: number }[] = [
    { key: "active", label: "Active", count: activeJobs.length },
    { key: "upcoming", label: "Upcoming", count: upcomingJobs.length },
    { key: "completed", label: "Done", count: completedJobsList.length },
  ];

  const statusLabel: Record<string, string> = {
    on_the_way: "On the way",
    arrived: "Arrived",
    in_progress: "In progress",
    payment_pending: "Collect payment",
  };

  const summary =
    tab === "active"
      ? [{ label: "Today's earnings", value: `₹${formatRupees(activeTodayEarnings)}` }, { label: "Active jobs", value: String(activeJobs.length) }]
      : tab === "upcoming"
        ? [{ label: "Expected", value: `₹${formatRupees(upcomingEarnings)}` }, { label: "Scheduled", value: String(upcomingJobs.length) }]
        : [{ label: "Earned", value: `₹${formatRupees(completedEarnings)}` }, { label: "Completed", value: String(completedJobsList.length) }];

  const list = tab === "active" ? activeJobs : tab === "upcoming" ? upcomingJobs : completedJobsList;

  return (
    <div className="provider-theme relative flex min-h-full flex-col bg-background pb-28">
      <FlowHeader title="My jobs" onBack={handleBack} />

      {/* Tabs */}
      <div className="px-5 pt-3">
        <div className="grid grid-cols-3 rounded-[14px] bg-sand p-1">
          {tabList.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`relative rounded-[11px] py-2.5 text-[13.5px] font-medium transition-colors ${tab === t.key ? "text-ink" : "text-muted-foreground"}`}
            >
              {tab === t.key && (
                <motion.span
                  layoutId="jobs-tab"
                  className="absolute inset-0 rounded-[11px] bg-card shadow-[0_2px_8px_-2px_rgba(14,27,44,0.18)]"
                  transition={{ type: "spring", stiffness: 420, damping: 34 }}
                />
              )}
              <span className="relative">
                {t.label} <span className="tabular-nums text-muted-foreground">{t.count}</span>
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Summary */}
      <div className="mt-3 grid grid-cols-2 gap-2 px-5">
        {summary.map((s) => (
          <div key={s.label} className="rounded-[18px] bg-card p-4 ring-1 ring-line">
            <p className="text-[12.5px] text-muted-foreground">{s.label}</p>
            <p className="mt-0.5 text-[22px] font-semibold tracking-tight text-ink tabular-nums">{s.value}</p>
          </div>
        ))}
      </div>

      {tab === "upcoming" && <DateRangeControl label="Scheduled between" />}
      {tab === "completed" && <DateRangeControl label="Completed between" />}

      {/* List */}
      <div ref={resultsRef} className="mt-4 flex-1 scroll-mt-24 overflow-y-auto px-5">
        {list.length === 0 ? (
          <div className="flex flex-col items-center rounded-[22px] bg-card px-6 py-10 text-center ring-1 ring-line">
            <span className="grid h-12 w-12 place-items-center rounded-full bg-sand text-muted-foreground">
              {tab === "completed" ? <CheckCircle2 size={20} /> : tab === "active" ? <Clock size={20} /> : <Calendar size={20} />}
            </span>
            <p className="mt-3 text-[15px] font-semibold text-ink">
              {tab === "active" ? "No active jobs right now" : tab === "upcoming" ? "Nothing scheduled" : "No completed jobs here"}
            </p>
            <p className="mt-1 text-[13px] text-muted-foreground">
              {tab === "active" ? "Jobs you're working on show up here." : tab === "upcoming" ? "Accepted bookings will appear here." : "Try a wider date range."}
            </p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {list.map((job: any) => {
              const service = getServiceById(job.serviceId);
              const done = tab === "completed";
              const chip = done ? "Completed" : tab === "active" ? statusLabel[job.status] || job.status : job.jobType === "scheduled" ? "Scheduled" : "Quick Fix";
              const Wrapper: any = done ? "div" : "button";
              return (
                <Wrapper
                  key={job.id}
                  {...(done ? {} : { onClick: () => openJob(job) })}
                  className="block w-full rounded-[20px] bg-card p-4 text-left ring-1 ring-line transition-transform active:scale-[0.99]"
                >
                  <div className="flex items-center gap-3">
                    <span className="grid h-11 w-11 flex-shrink-0 place-items-center rounded-[14px] bg-sand text-navy">
                      {service ? <service.icon size={20} strokeWidth={1.8} /> : <CheckCircle2 size={20} />}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[15px] font-semibold text-ink">{service?.label || "Service"}</span>
                      <span className="block truncate text-[12.5px] text-muted-foreground">{job.customerName}</span>
                    </span>
                    <span
                      className={`flex flex-shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium ${
                        done ? "bg-[#E8EFE4] text-[#2F5B2A]" : tab === "active" ? "bg-orange-50 text-brand-deep" : "bg-sand text-ink"
                      }`}
                    >
                      {tab === "active" && <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-brand-amber" />}
                      {chip}
                    </span>
                  </div>
                  <div className="mt-3 flex items-center justify-between gap-3 border-t border-line pt-3 text-[12.5px] text-muted-foreground">
                    <span className="flex min-w-0 items-center gap-1.5">
                      <Calendar size={13} className="flex-shrink-0" /> {job.date}
                      {job.time ? ` · ${job.time}` : ""}
                    </span>
                    {(tab !== "active" || job.price) && (
                      <span className={`flex-shrink-0 text-[14px] font-semibold tabular-nums ${done ? "text-[#2F5B2A]" : "text-ink"}`}>
                        {done ? "+" : ""}₹{formatRupees(Number(job.price) || 0)}
                      </span>
                    )}
                  </div>
                  {!done && job.address && (
                    <p className="mt-1.5 flex items-center gap-1.5 truncate text-[12.5px] text-muted-foreground">
                      <MapPin size={13} className="flex-shrink-0" /> <span className="truncate">{job.address}</span>
                    </p>
                  )}
                </Wrapper>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Jobs;
