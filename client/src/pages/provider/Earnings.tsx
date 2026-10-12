import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ArrowLeft, TrendingUp, Calendar, Wallet } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { getServiceById } from "@/data/mockData";
import { FlowHeader } from "@/components/FlowHeader";
import AvailableBalanceCard from '@/components/AvailableBalanceCard';

import axios from "axios";

const formatRupees = (amount: number): string => {
  return amount.toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

const Earnings = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const {
    user,
    walletBalance = 0,
    commissionDue = 0,
    codPendingCount = 0,
    dispatch
  } = useApp() as any;
  const [balance, setBalance] = useState(0);
  const [completedJobs, setCompletedJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState<"Today" | "This Week" | "This Month">("Today");

  const handleBack = () => {
    if (window.history.state && window.history.state.idx > 0) {
      navigate(-1);
    } else {
      navigate(location.state?.from === "profile" ? "/provider/profile" : "/provider");
    }
  };

  useEffect(() => {
    const fetchEarnings = async () => {
      try {
        const dashboardRes = await axios.get(`/api/v1/providers/dashboard?userId=${user.id}`);
        if (dashboardRes.data.success) {
          setBalance(dashboardRes.data.data.wallet?.balance || 0);

          const providerId = dashboardRes.data.data.provider.id;

          const bookingsRes = await axios.get(`/api/v1/bookings/provider/${providerId}`);
          if (bookingsRes.data.success) {
            const completed = bookingsRes.data.data.filter(
              (b: any) =>
                b.status === "completed" ||
                b.status === "paid"
            );

            console.log("Completed Jobs:", completed);

            setCompletedJobs(completed);
          }
        }
      } catch (error) {
        console.error("Failed to fetch earnings:", error);
      } finally {
        setLoading(false);
      }
    };
    if (user.id) {
      fetchEarnings();
    }
  }, [user.id]);


  const now = Date.now();
  const filteredJobs = completedJobs.filter((j) => {
    const jobDate = new Date(
      j.completed_at ||
      j.created_at ||
      j.updated_at ||
      j.scheduled_at ||
      j.date
    )
      .getTime();
    if (timeframe === "Today") return now - jobDate < 86400000;
    if (timeframe === "This Week") return now - jobDate < 7 * 86400000;
    return now - jobDate < 30 * 86400000;
  });


  const timeframeTotal = filteredJobs.reduce(
    (s, j) => s + (Number(j.price) || 0),
    0
  );

  const withdrawableAmount = walletBalance;
  return (
    <div className="provider-theme flex min-h-full flex-col bg-background pb-28">
      <FlowHeader title="Earnings" onBack={handleBack} />

      <div className="space-y-3 px-5 pt-3">
        <AvailableBalanceCard
          walletBalance={walletBalance}
          commissionDue={commissionDue}
          codPendingCount={codPendingCount}
          onWithdraw={() => {
            if (walletBalance <= 0) {
              alert("No withdrawable balance");
              return;
            }

            const amount = Number(
              prompt(
                `Enter amount to withdraw (Available ₹${walletBalance.toFixed(2)})`
              )
            );

            if (!amount || amount <= 0) return;

            if (amount > walletBalance) {
              alert("Insufficient wallet balance");
              return;
            }

            dispatch({
              type: "UPDATE_WALLET",
              amount: -amount
            });

            alert(`₹${amount.toFixed(2)} withdrawn successfully`);
          }}
        />

        {commissionDue > 0 && (
          <div className="flex items-center gap-4 rounded-[20px] bg-card p-4 ring-1 ring-line">
            <div className="flex-1">
              <p className="text-[13px] text-muted-foreground">Commission due</p>
              <p className="text-[22px] font-semibold tracking-tight text-red-700 tabular-nums">₹{formatRupees(commissionDue)}</p>
            </div>

            <button
              onClick={() => {
                dispatch({
                  type: "CLEAR_COMMISSION_DUE",
                  amount: commissionDue
                });
              }}
              className="rounded-[14px] bg-red-700 px-5 py-3 text-[14px] font-semibold text-white"
            >
              Pay now
            </button>
          </div>
        )}

        <div className="flex items-center gap-4 rounded-[20px] bg-card p-4 ring-1 ring-line">
          <div className="flex-1">
            <p className="text-[14.5px] font-medium text-ink">Top up wallet</p>
            <p className="text-[12.5px] text-muted-foreground">Keeps commission covered</p>
          </div>

          <button
            onClick={() => {
              const amount = Number(
                prompt("Enter amount to add")
              );

              if (!amount || amount <= 0) return;

              dispatch({
                type: "UPDATE_WALLET",
                amount
              });
            }}
            className="rounded-[14px] bg-sand px-5 py-3 text-[14px] font-medium text-ink"
          >
            Add money
          </button>
        </div>

        <div className="!mt-6 grid grid-cols-3 rounded-[14px] bg-sand p-1">
          {["Today", "This Week", "This Month"].map((label) => (
            <button
              key={label}
              onClick={() => setTimeframe(label as any)}
              className={`rounded-[11px] py-2.5 text-[13px] font-medium transition-colors ${timeframe === label ? "bg-card text-ink shadow-[0_2px_8px_-2px_rgba(14,27,44,0.18)]" : "text-muted-foreground"}`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-2">
          <Stat
            label="Jobs Done"
            value={String(filteredJobs.length)}
            color="text-ink"
          />
          <Stat
            label="Earned"
            value={`₹${formatRupees(timeframeTotal)}`}
            color="text-[#2F5B2A]"
          />
        </div>
      </div>


      <div className="px-5 mt-6 flex-1 overflow-y-auto">
        <h2 className="mb-3 text-[17px] font-semibold tracking-[-0.02em] text-navy">Completed jobs</h2>
        {filteredJobs.length === 0 ? (
          <div className="flex flex-col items-center rounded-[22px] bg-card px-6 py-10 text-center ring-1 ring-line">
            <span className="grid h-12 w-12 place-items-center rounded-full bg-sand text-muted-foreground"><Wallet size={20} /></span>
            <h3 className="mt-3 text-[15px] font-semibold text-ink">No earnings yet</h3>
            <p className="mt-1 text-[13px] text-muted-foreground">
              Completed jobs will appear here.
            </p>
          </div>
        ) : (
          <div className="rounded-[22px] bg-card px-4 ring-1 ring-line">
            {filteredJobs.map((j) => {
              const s = getServiceById(j.serviceId);
              return (
                <div key={j.id} className="flex items-center gap-3 border-b border-line py-3.5 last:border-b-0">
                  <div className="grid h-10 w-10 place-items-center rounded-[12px] bg-sand text-navy">
                    {s && <s.icon size={17} strokeWidth={1.8} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="truncate text-[14px] font-medium text-ink">{j.customerName}</p>
                    <p className="text-[12px] text-muted-foreground">
                      {s?.label ? `${s.label} · ` : ""}{j.date}
                    </p>
                  </div>
                  <span className="text-[14.5px] font-semibold text-[#2F5B2A] tabular-nums">+₹{formatRupees(Number(j.price) || 0)}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

const Stat = ({ label, value, color = "text-foreground" }: { label: string; value: string; color?: string }) => (
  <div className="rounded-[18px] bg-card p-4 ring-1 ring-line">
    <p className="text-[12.5px] text-muted-foreground">{label}</p>
    <p className={`mt-0.5 text-[22px] font-semibold tracking-tight tabular-nums ${color}`}>{value}</p>
  </div>
);


export default Earnings;
