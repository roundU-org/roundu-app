import { useNavigate } from "react-router-dom";
import { ArrowLeft, Plus, TrendingUp, TrendingDown, History, CreditCard, Wallet as WalletIcon } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { FlowHeader } from "@/components/FlowHeader";

const Wallet = () => {
  const navigate = useNavigate();
  const { walletBalance } = useApp();

  const transactions = [
    { id: 1, type: "credit", label: "Added to Wallet", amount: 500, date: "Today, 10:30 AM" },
    { id: 2, type: "debit", label: "Booking: Electrician", amount: 299, date: "Yesterday, 4:15 PM" },
    { id: 3, type: "credit", label: "Cashback Received", amount: 25, date: "20 Apr, 11:20 AM" },
  ];

  return (
    <div className="flex min-h-full flex-col bg-background pb-28">
      <FlowHeader title="Wallet" />

      <div className="flex-1 space-y-6 px-5 pt-3">
        {/* Balance */}
        <div className="rounded-[24px] bg-navy p-6 text-paper animate-scale-in">
          <p className="text-[13px] text-paper/60">Available balance</p>
          <p className="mt-1 text-[38px] font-semibold leading-none tracking-[-0.02em] tabular-nums">₹{walletBalance.toLocaleString("en-IN")}</p>
          <div className="mt-6 grid grid-cols-[1fr_auto] gap-2">
            <button
              onClick={() => navigate("/wallet/topup")}
              className="flex items-center justify-center gap-2 rounded-[14px] bg-paper py-3 text-[14px] font-semibold text-navy transition-transform active:scale-[0.97]"
            >
              <Plus size={16} strokeWidth={2.4} /> Add money
            </button>
            <button aria-label="Cards" className="grid w-12 place-items-center rounded-[14px] bg-white/10 transition-transform active:scale-[0.97]">
              <CreditCard size={18} />
            </button>
          </div>
        </div>

        {/* Transactions */}
        <div className="animate-fade-in" style={{ animationDelay: "0.15s" }}>
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-[17px] font-semibold tracking-[-0.02em] text-navy">Recent activity</h3>
            <button onClick={() => navigate("/wallet/history")} className="flex items-center gap-1 text-[13px] font-medium text-brand-deep">
              <History size={14} /> See all
            </button>
          </div>
          <div className="rounded-[22px] bg-card px-4 ring-1 ring-line">
            {transactions.map((tx) => (
              <div key={tx.id} className="flex items-center gap-3 border-b border-line py-3.5 last:border-b-0">
                <span className={`grid h-10 w-10 place-items-center rounded-full ${tx.type === "credit" ? "bg-[#E8EFE4] text-[#2F5B2A]" : "bg-sand text-ink"}`}>
                  {tx.type === "credit" ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[14px] font-medium text-ink">{tx.label}</span>
                  <span className="block text-[12px] text-muted-foreground">{tx.date}</span>
                </span>
                <span className={`text-[14.5px] font-semibold tabular-nums ${tx.type === "credit" ? "text-[#2F5B2A]" : "text-ink"}`}>
                  {tx.type === "credit" ? "+" : "−"}₹{tx.amount}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Wallet;
