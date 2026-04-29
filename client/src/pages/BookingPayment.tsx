import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Wallet, Smartphone, Check } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { Booking } from "@/data/mockData";
import { toast } from "sonner";

const BookingPayment = () => {
  const navigate = useNavigate();
  const { 
    selectedProvider, 
    selectedServiceId, 
    selectedDate = new Date().toISOString().slice(0, 10), 
    selectedTime = "10:00 AM", 
    bookingNotes, 
    bookings,
    dispatch 
  } = useApp();
  
  const [method, setMethod] = useState<"wallet" | "upi">("wallet");
  const [loading, setLoading] = useState(false);

  // Fix: Move navigate to useEffect
  useEffect(() => {
    if (!selectedProvider || !selectedServiceId) {
      navigate("/home", { replace: true });
    }
  }, [selectedProvider, selectedServiceId, navigate]);

  if (!selectedProvider || !selectedServiceId) return null;

  const base = selectedProvider?.pricePerHr || 299;
  const tax = Math.round(base * 0.05);
  const platform = 19;
  const total = base + tax + platform;

  const handleConfirm = () => {
    setLoading(true);
    setTimeout(() => {
      // Find if we are paying for an existing unpaid booking
      const existingUnpaid = bookings.find(b => b.providerId === selectedProvider.id && !b.paid);
      
      if (existingUnpaid) {
        dispatch({ type: "PAY_BOOKING", id: existingUnpaid.id });
        toast.success("Payment successful");
        navigate(`/booking/success/${existingUnpaid.id}`, { replace: true });
        return;
      }

      // Fallback: Create new (for legacy support)
      const booking: Booking = {
        id: `bk-${Date.now()}`,
        providerId: selectedProvider.id,
        serviceId: selectedServiceId,
        date: selectedDate,
        time: selectedTime,
        notes: bookingNotes,
        status: "assigned",
        createdAt: Date.now(),
        price: total,
        paid: true,
      };
      dispatch({ type: "ADD_BOOKING", booking });
      dispatch({ type: "ADD_NOTIFICATION", text: `Booking confirmed with ${selectedProvider.name}` });
      dispatch({ type: "RESET_BOOKING_DRAFT" });
      toast.success("Payment successful");
      navigate(`/booking/success/${booking.id}`, { replace: true });
    }, 1400);
  };

  return (
    <div className="min-h-full flex flex-col bg-background pb-28">
      <div className="px-5 pt-6 pb-4 flex items-center gap-3 animate-fade-in">
        <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-xl bg-input border border-border flex items-center justify-center active:scale-95">
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-lg font-bold text-foreground">Payment</h1>
      </div>

      <div className="flex-1 px-5 space-y-5">
        <div className="bg-card border border-border rounded-2xl p-4 shadow-card">
          <h3 className="text-xs font-bold text-foreground mb-3">Price Breakdown</h3>
          <Row label="Service charge" value={`₹${base}`} />
          <Row label="Taxes (5%)" value={`₹${tax}`} />
          <Row label="Platform fee" value={`₹${platform}`} />
          <div className="h-px bg-border my-2" />
          <Row label="Total" value={`₹${total}`} bold />
        </div>

        <div>
          <h3 className="text-xs font-bold text-foreground mb-3">Payment Method</h3>
          <div className="space-y-2">
            <PaymentOption
              active={method === "wallet"}
              onClick={() => setMethod("wallet")}
              icon={Wallet}
              title="Roundu Wallet"
              subtitle="Balance: ₹2,400"
            />
            <PaymentOption
              active={method === "upi"}
              onClick={() => setMethod("upi")}
              icon={Smartphone}
              title="UPI"
              subtitle="Pay via Google Pay / PhonePe"
            />
          </div>
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 p-5 bg-card border-t border-border">
        <button
          onClick={handleConfirm}
          disabled={loading}
          className="w-full py-4 rounded-2xl bg-primary text-primary-foreground font-bold text-sm hover:bg-secondary active:scale-[0.98] transition-all disabled:opacity-60"
        >
          {loading ? "Processing..." : `Confirm & Pay ₹${total}`}
        </button>
      </div>
    </div>
  );
};

const Row = ({ label, value, bold }: { label: string; value: string; bold?: boolean }) => (
  <div className="flex items-center justify-between py-1.5">
    <span className={`text-xs ${bold ? "font-bold text-foreground" : "text-muted-foreground"}`}>{label}</span>
    <span className={`text-xs ${bold ? "font-extrabold text-primary text-base" : "font-semibold text-foreground"}`}>{value}</span>
  </div>
);

const PaymentOption = ({ active, onClick, icon: Icon, title, subtitle }: any) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center gap-3 p-4 rounded-2xl border transition-all active:scale-[0.98] ${
      active ? "bg-primary/5 border-primary" : "bg-card border-border"
    }`}
  >
    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${active ? "bg-primary text-primary-foreground" : "bg-input text-primary"}`}>
      <Icon size={18} />
    </div>
    <div className="flex-1 text-left">
      <p className="text-sm font-bold text-foreground">{title}</p>
      <p className="text-[10px] text-muted-foreground">{subtitle}</p>
    </div>
    {active && (
      <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
        <Check size={12} className="text-primary-foreground" />
      </div>
    )}
  </button>
);

export default BookingPayment;
