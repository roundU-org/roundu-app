import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, IndianRupee, Check, ShieldCheck, ChevronRight, ArrowRight } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { toast } from "sonner";

const WalletTopUp = () => {
  const navigate = useNavigate();
  const { dispatch } = useApp();
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);

  const presets = ["200", "500", "1000", "2000"];

  const handleTopUp = () => {
    const num = parseFloat(amount);
    if (!num || num < 10) {
      toast.error("Minimum amount is ₹10");
      return;
    }

    setLoading(true);
    // Simulate payment
    setTimeout(() => {
      dispatch({ type: "UPDATE_WALLET", amount: num });
      dispatch({ type: "ADD_NOTIFICATION", text: `₹${num} added to your wallet successfully!` });
      toast.success("Payment successful!");
      setLoading(false);
      navigate("/wallet", { replace: true });
    }, 1500);
  };

  return (
    <div className="min-h-full flex flex-col bg-background relative overflow-hidden pb-10">
      {/* Premium Background */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
      
      {/* Header */}
      <div className="px-6 pt-8 pb-4 flex items-center gap-4 relative z-10">
        <button
          onClick={() => navigate(-1)}
          className="w-10 h-10 rounded-xl bg-input border border-border flex items-center justify-center text-foreground active:scale-95 transition-all"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-xl font-extrabold text-foreground tracking-tight">Add Money</h1>
      </div>

      <div className="px-6 space-y-8 flex-1 relative z-10">
        <div className="pt-4">
          <label className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-widest mb-4 block">Enter Amount</label>
          <div className="relative group">
            <div className="absolute left-0 top-1/2 -translate-y-1/2 text-primary">
              <IndianRupee size={32} strokeWidth={2.5} />
            </div>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              className="w-full pl-12 pr-4 py-4 text-4xl font-extrabold bg-transparent border-b-2 border-border focus:border-primary focus:outline-none transition-all placeholder:text-muted-foreground"
              autoFocus
            />
          </div>
        </div>

        {/* Presets */}
        <div className="grid grid-cols-4 gap-2 animate-fade-in" style={{ animationDelay: "0.1s" }}>
          {presets.map((p) => (
            <button
              key={p}
              onClick={() => setAmount(p)}
              className={`py-3 rounded-xl border-2 font-bold text-xs transition-all ${amount === p ? "bg-primary border-primary text-primary-foreground" : "bg-card border-border text-foreground hover:border-primary/30"}`}
            >
              ₹{p}
            </button>
          ))}
        </div>

        {/* Benefits */}
        <div className="bg-primary/5 rounded-3xl p-5 border border-primary/10 animate-fade-in" style={{ animationDelay: "0.2s" }}>
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
              <ShieldCheck className="text-primary" size={20} />
            </div>
            <div>
              <p className="text-[13px] font-extrabold text-foreground">Secure Payment</p>
              <p className="text-[10px] text-muted-foreground mt-1 leading-relaxed">Your transactions are encrypted with 256-bit SSL protection.</p>
            </div>
          </div>
        </div>

        {/* Payment Methods Mock */}
        <div className="space-y-3 animate-fade-in" style={{ animationDelay: "0.3s" }}>
           <p className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-widest pl-1">Payment Method</p>
           <div className="bg-card border border-border rounded-2xl p-4 flex items-center justify-between">
             <div className="flex items-center gap-3">
               <div className="w-10 h-10 rounded-lg bg-input flex items-center justify-center">
                 <img src="https://img.icons8.com/color/48/000000/google-pay-new.png" className="w-6" alt="GPay" />
               </div>
               <p className="text-sm font-bold text-foreground">Google Pay / UPI</p>
             </div>
             <div className="w-5 h-5 rounded-full border-2 border-primary flex items-center justify-center">
               <div className="w-2.5 h-2.5 rounded-full bg-primary" />
             </div>
           </div>
           <button className="w-full flex items-center justify-center gap-1 py-1 text-[11px] font-bold text-primary opacity-60">
             Change Payment Method <ChevronRight size={12} />
           </button>
        </div>
      </div>

      {/* Action Button */}
      <div className="px-6 pt-4 relative z-10">
        <button
          onClick={handleTopUp}
          disabled={!amount || parseFloat(amount) <= 0 || loading}
          className="w-full py-4 rounded-2xl bg-primary text-primary-foreground font-extrabold text-lg shadow-2xl shadow-primary/30 active:scale-[0.98] transition-all disabled:opacity-40 flex items-center justify-center gap-3 h-16"
        >
          {loading ? (
            <div className="w-6 h-6 border-4 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
          ) : (
            <>
              Proceed to Pay <ArrowRight size={20} />
            </>
          )}
        </button>
      </div>

      {/* Success Modal Overlay Placeholder */}
      {loading && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-md flex items-center justify-center text-center px-10">
           <div className="space-y-6 animate-scale-in">
             <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
               <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center text-primary-foreground">
                 <Check size={32} strokeWidth={3} />
               </div>
             </div>
             <div>
               <h2 className="text-2xl font-extrabold text-foreground">Processing...</h2>
               <p className="text-sm text-muted-foreground mt-2">Connecting to secure gateway</p>
             </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default WalletTopUp;
