import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ArrowLeft, Wallet, Smartphone, Check, Coins } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { FlowHeader, BottomCTA } from "@/components/FlowHeader";
import { Booking, getProviderById, getServiceById } from "@/data/mockData";
import { getAbsoluteIsoTimestamp } from "@/lib/utils";
import { socket } from "@/lib/socket";

import api, { createBooking, loadRazorpay } from "@/lib/api";

const BookingPayment = () => {
  const navigate = useNavigate();
  const {
    selectedProvider,
    selectedServiceId,
    selectedDate = new Date().toISOString().slice(0, 10),
    selectedTime = "10:00 AM",
    bookingNotes,
    bookingVoiceNote,
    bookingVoiceNoteUrl,
    bookingImages,
    bookings,
    user,
    dispatch,
    addBooking,
    walletBalance
  } = useApp();

  const location = useLocation();
  const bookingId = location.state?.bookingId;
  const existingBooking = bookings.find((b) => b.id === bookingId);

  const [method, setMethod] = useState<"wallet" | "upi" | "cash">("wallet");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Fix: Move navigate to useEffect, bypassing if paying for completed existing booking
  useEffect(() => {
    if (!bookingId && (!selectedProvider || !selectedServiceId)) {
      navigate("/home", { replace: true });
    }
  }, [bookingId, selectedProvider, selectedServiceId, navigate]);

  if (!bookingId) return null;

  const provider = existingBooking
    ? ((existingBooking as any).providerDetails || getProviderById(existingBooking.providerId) || {
      id: existingBooking.providerId,
      name: "Service Provider",
      pricePerHr: existingBooking.price,
    })
    : selectedProvider;

  const serviceId = existingBooking ? existingBooking.serviceId : selectedServiceId;

  // Pricing calculations
  const base = existingBooking ? Number(existingBooking.price) : (provider?.pricePerHr || 299);
  const tax = existingBooking ? 0 : Math.round(base * 0.05);
  const platform = existingBooking ? 0 : 19;
  const total = base + tax + platform;


  const handleConfirm = async () => {
    setLoading(true);
    setError("");

    if (existingBooking) {
      // 1. Paying for an existing booking
      if (method === "cash") {
        try {
          dispatch({ type: "PAY_BOOKING", id: bookingId });
          dispatch({ type: "UPDATE_BOOKING_STATUS", bookingId: bookingId, status: "paid" });
          socket.emit("update_job_status", { bookingId: bookingId, status: "paid", paid: true });
          navigate(`/rating/${bookingId}`, { replace: true });
        } catch (err) {
          setError("Failed to process cash payment option");
        } finally {
          setLoading(false);
        }
      } else if (method === "wallet") {
        try {
          if ((walletBalance ?? 0) < total) {
            setError("Insufficient wallet balance. Please add money to your Roundu Wallet.");
            setLoading(false);
            return;
          }

          dispatch({ type: "UPDATE_WALLET", amount: -total });
          dispatch({ type: "PAY_BOOKING", id: bookingId });
          dispatch({ type: "UPDATE_BOOKING_STATUS", bookingId: bookingId, status: "paid" });
          socket.emit("update_job_status", { bookingId: bookingId, status: "paid", paid: true });
          navigate(`/rating/${bookingId}`, { replace: true });
        } catch (err) {
          setError("Failed to process wallet payment");
        } finally {
          setLoading(false);
        }
      } else {
        // UPI via Razorpay for existing booking
        const res = await loadRazorpay();
        if (!res) {
          setError("Payment gateway failed to load. Are you online?");
          setLoading(false);
          return;
        }
        try {
          const orderRes = await api.post("/payments/create-order", {
            amount: total,
            currency: "INR",
            receipt: `receipt_${Date.now()}`,
          });

          if (!orderRes.data.success) {
            throw new Error("Order creation failed");
          }

          const order = orderRes.data.order;

          const options = {
            key: import.meta.env.VITE_RAZORPAY_KEY_ID || "rzp_test_SjkbAFGdLhaT6C",
            amount: order.amount,
            currency: order.currency,
            name: "RoundU Services",
            description: `Payment for Completed Job with ${provider?.name}`,
            order_id: order.id,
            handler: async (response: any) => {
              try {
                setLoading(true);
                const verifyRes = await api.post("/payments/verify", {
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_signature: response.razorpay_signature,

                  providerId: provider?.id || selectedProvider?.id,
                  amount: total
                });

                if (!verifyRes.data.success) {
                  setError("Payment verification failed. Please contact support.");
                  return;
                }


                dispatch({ type: "PAY_BOOKING", id: bookingId });

                dispatch({
                  type: "UPDATE_BOOKING_STATUS",
                  bookingId: bookingId,
                  status: "paid"
                });

                socket.emit("update_job_status", {
                  bookingId: bookingId,
                  status: "paid",
                  paid: true
                });

                navigate(`/rating/${bookingId}`, { replace: true });
              } catch (err) {
                console.error("Verification error:", err);
                setError("Failed to verify payment");
              } finally {
                setLoading(false);
              }
            },
            prefill: {
              name: user.name,
              email: user.email,
              contact: user.phone,
            },
            theme: { color: "#6366F1" },
            modal: {
              ondismiss: () => {
                setLoading(false);
                setError("Payment cancelled");
              }
            }
          };

          const rzp = new (window as any).Razorpay(options);
          rzp.open();
        } catch (error) {
          console.error("Payment error:", error);
          setError("Failed to initialize payment");
          setLoading(false);
        }
      }
    } else {
      // 2. Creating a new booking (standard checkout)
      if (method === "cash") {
        try {
          const bookingData = {
            customer_id: user.id,
            provider_id: provider?.id || selectedProvider?.id,
            service_id: serviceId,
            scheduled_at: getAbsoluteIsoTimestamp(selectedDate, selectedTime),
            address: user.address || "Client Address",
            price: total,
            notes: bookingNotes,
            voice_note: bookingVoiceNote,
            voice_note_url: bookingVoiceNoteUrl || null,
            payment_id: "cash_payment",
            paid: false,
            images: bookingImages || [],
          };

          const bookingRes = await createBooking(bookingData);
          if (bookingRes.success) {
            addBooking(bookingRes.data);
            // Mark booking as completed and navigate to rating page
            dispatch({ type: "UPDATE_BOOKING_STATUS", bookingId: bookingRes.data.id, status: "completed" });
            dispatch({ type: "PAY_BOOKING", id: bookingRes.data.id });
            dispatch({ type: "RESET_BOOKING_DRAFT" });
            navigate(`/rating/${bookingRes.data.id}`, { replace: true });
          }
        } catch (err) {
          setError("Failed to complete booking with Cash option");
        } finally {
          setLoading(false);
        }
      } else if (method === "wallet") {
        try {
          if ((walletBalance ?? 0) < total) {
            setError("Insufficient wallet balance. Please add money to your Roundu Wallet.");
            setLoading(false);
            return;
          }

          dispatch({ type: "UPDATE_WALLET", amount: -total });
          const bookingData = {
            customer_id: user.id,
            provider_id: provider?.id || selectedProvider?.id,
            service_id: serviceId,
            scheduled_at: getAbsoluteIsoTimestamp(selectedDate, selectedTime),
            address: user.address || "Client Address",
            price: total,
            notes: bookingNotes,
            voice_note: bookingVoiceNote,
            voice_note_url: bookingVoiceNoteUrl || null,
            payment_id: "wallet_payment",
            paid: true,
            images: bookingImages || [],
          };

          const bookingRes = await createBooking(bookingData);
          if (bookingRes.success) {
            const enrichedData = { ...bookingRes.data, paid: true };
            addBooking(enrichedData);
            dispatch({ type: "RESET_BOOKING_DRAFT" });
            navigate(`/booking/success/${bookingRes.data.id}`, { replace: true });
          }
        } catch (err) {
          setError("Failed to complete booking with Wallet option");
        } finally {
          setLoading(false);
        }
      } else {
        const res = await loadRazorpay();
        if (!res) {
          setError("Payment gateway failed to load. Are you online?");
          setLoading(false);
          return;
        }

        try {
          const orderRes = await api.post("/payments/create-order", {
            amount: total,
            currency: "INR",
            receipt: `receipt_${Date.now()}`,
          });

          if (!orderRes.data.success) {
            throw new Error("Order creation failed");
          }

          const order = orderRes.data.order;

          const options = {
            key: import.meta.env.VITE_RAZORPAY_KEY_ID || "rzp_test_SjkbAFGdLhaT6C",
            amount: order.amount,
            currency: order.currency,
            name: "RoundU Services",
            description: `Booking for ${provider?.name || selectedProvider?.name}`,
            order_id: order.id,
            handler: async (response: any) => {
              try {
                setLoading(true);
                const verifyRes = await api.post("/payments/verify", {
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_signature: response.razorpay_signature,

                  providerId: provider?.id || selectedProvider?.id,
                  amount: total
                });

                if (!verifyRes.data.success) {
                  setError("Payment verification failed. Please contact support.");
                  return;
                }

                const bookingData = {
                  customer_id: user.id,
                  provider_id: provider?.id || selectedProvider?.id,
                  service_id: serviceId,
                  scheduled_at: getAbsoluteIsoTimestamp(selectedDate, selectedTime),
                  address: user.address || "Client Address",
                  price: total,
                  notes: bookingNotes,
                  voice_note: bookingVoiceNote,
                  voice_note_url: bookingVoiceNoteUrl || null,
                  payment_id: response.razorpay_payment_id,
                  paid: true,
                  images: bookingImages || [],
                };

                const bookingRes = await createBooking(bookingData);
                if (bookingRes.success) {
                  const enrichedData = { ...bookingRes.data, paid: true };
                  addBooking(enrichedData);
                  // Mark booking as completed and navigate to rating page
                  dispatch({ type: "UPDATE_BOOKING_STATUS", bookingId: bookingRes.data.id, status: "completed" });
                  dispatch({ type: "PAY_BOOKING", id: bookingRes.data.id });
                  dispatch({ type: "RESET_BOOKING_DRAFT" });
                  navigate(`/rating/${bookingRes.data.id}`, { replace: true });
                }
              } catch (err) {
                console.error("Verification/Booking error:", err);
                setError("Failed to complete booking. Please check your internet.");
              } finally {
                setLoading(false);
              }
            },
            prefill: {
              name: user.name,
              email: user.email,
              contact: user.phone,
            },
            theme: { color: "#6366F1" },
            modal: {
              ondismiss: () => {
                setLoading(false);
                setError("Payment cancelled");
              }
            }
          };

          const rzp = new (window as any).Razorpay(options);
          rzp.open();
        } catch (error) {
          console.error("Payment error:", error);
          setError("Failed to initialize payment");
          setLoading(false);
        }
      }
    }
  };

  return (
    <div className="flex min-h-full flex-col bg-background pb-32">
      <FlowHeader title="Review and pay" subtitle="You can pay now, or in cash once the job is done." />

      <div className="flex-1 space-y-6 px-5 pt-4">
        {error && (
          <div className="rounded-[14px] bg-danger-soft p-3.5 text-[13px] font-medium text-danger-ink ring-1 ring-danger/25">{error}</div>
        )}

        <div className="rounded-[22px] bg-card px-4 py-1 ring-1 ring-line">
          <Row label="Service charge" value={`₹${base}`} />
          <Row label="Taxes (5%)" value={`₹${tax}`} />
          <Row label="Platform fee" value={`₹${platform}`} />
          <Row label="Total" value={`₹${total}`} bold />
        </div>

        <div>
          <h3 className="mb-3 text-[17px] font-semibold tracking-[-0.02em] text-navy">Pay with</h3>
          <div className="space-y-2">
            <PaymentOption
              active={method === "wallet"}
              onClick={() => setMethod("wallet")}
              icon={Wallet}
              title="RoundU wallet"
              subtitle={`Balance ₹${(walletBalance ?? 0).toLocaleString("en-IN")}`}
            />
            <PaymentOption active={method === "upi"} onClick={() => setMethod("upi")} icon={Smartphone} title="UPI" subtitle="Google Pay, PhonePe, Paytm" />
            <PaymentOption active={method === "cash"} onClick={() => setMethod("cash")} icon={Coins} title="Cash" subtitle="Pay your professional after the job" />
          </div>
        </div>
      </div>

      <BottomCTA onClick={handleConfirm} disabled={loading}>
        {loading ? "Processing…" : method === "cash" ? `Confirm booking · ₹${total}` : `Pay ₹${total}`}
      </BottomCTA>
    </div>
  );
};

const Row = ({ label, value, bold }: { label: string; value: string; bold?: boolean }) => (
  <div className={`flex items-center justify-between py-3 ${bold ? "border-t border-line" : ""}`}>
    <span className={bold ? "text-[15px] font-semibold text-ink" : "text-[13.5px] text-muted-foreground"}>{label}</span>
    <span className={`tabular-nums ${bold ? "text-[20px] font-semibold tracking-tight text-ink" : "text-[13.5px] font-medium text-ink"}`}>{value}</span>
  </div>
);

const PaymentOption = ({ active, onClick, icon: Icon, title, subtitle }: any) => (
  <button
    onClick={onClick}
    className={`flex w-full items-center gap-3 rounded-[18px] bg-card p-4 transition-all active:scale-[0.99] ${active ? "ring-2 ring-navy" : "ring-1 ring-line"}`}
  >
    <span className={`grid h-11 w-11 place-items-center rounded-full ${active ? "bg-jet text-paper" : "bg-sand text-navy"}`}>
      <Icon size={18} />
    </span>
    <span className="flex-1 text-left">
      <span className="block text-[15px] font-medium text-ink">{title}</span>
      <span className="block text-[12.5px] text-muted-foreground">{subtitle}</span>
    </span>
    <span className={`grid h-5 w-5 place-items-center rounded-full ${active ? "bg-jet" : "ring-1 ring-line"}`}>
      {active && <Check size={12} className="text-paper" strokeWidth={3} />}
    </span>
  </button>
);

export default BookingPayment;
