import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Star } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { FlowHeader, BottomCTA } from "@/components/FlowHeader";
import { useApp } from "@/context/AppContext";
import api from "@/lib/api";
const Rating = () => {
  const navigate = useNavigate();
  const { id = "" } = useParams();
  const { bookings, dispatch, user } = useApp();
  const booking = bookings.find((b) => b.id === id);
  const [stars, setStars] = useState(0);
  const [review, setReview] = useState("");
  const [error, setError] = useState("");

  if (!booking) {
    navigate("/home", { replace: true });
    return null;
  }

  const submit = async () => {
    if (stars === 0) {
      setError("Please select a rating");
      return;
    }
    setError("");
    
    try {
      await api.post('/ratings', {
        booking_id: booking.id,
        customer_id: booking.customer_id || booking.customerId || user?.id,
        provider_id: booking.provider_id || booking.providerId,
        rating: stars,
        comment: review
      });
      dispatch({ type: "UPDATE_BOOKING", id: booking.id, patch: { rating: stars, review } });
      navigate("/home", { replace: true });
    } catch (err: any) {
      console.error("Failed to submit rating", err);
      setError("Failed to submit rating. Please try again.");
    }
  };

  const words = ["", "Poor", "Not great", "Okay", "Good", "Excellent"];
  const quick = stars >= 4 ? ["On time", "Polite", "Clean work", "Fair price"] : stars > 0 ? ["Late", "Messy", "Overpriced", "Didn't fix it"] : [];
  const addTag = (t: string) => setReview((r) => (r.includes(t) ? r : r ? `${r}, ${t.toLowerCase()}` : t));

  return (
    <div className="flex min-h-full flex-col bg-background pb-32">
      <FlowHeader title="How did it go?" subtitle="Your rating helps neighbours pick great pros." />

      <div className="flex-1 px-5 pt-6">
        <div className="rounded-[24px] bg-card px-5 py-7 text-center ring-1 ring-line">
          <div className="flex justify-center gap-1.5">
            {[1, 2, 3, 4, 5].map((n) => (
              <motion.button key={n} whileTap={{ scale: 0.8 }} onClick={() => setStars(n)} aria-label={`${n} star${n > 1 ? "s" : ""}`}>
                <Star size={40} strokeWidth={1.6} className={n <= stars ? "fill-brand-amber text-brand-amber" : "text-line"} />
              </motion.button>
            ))}
          </div>
          <AnimatePresence mode="wait">
            <motion.p
              key={stars}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              className={`mt-3 h-6 text-[15px] font-medium ${stars >= 4 ? "text-success-ink" : stars > 0 && stars <= 2 ? "text-danger-ink" : "text-ink"}`}
            >
              {words[stars] || "Tap a star"}
            </motion.p>
          </AnimatePresence>
        </div>

        {quick.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {quick.map((t) => (
              <button
                key={t}
                onClick={() => addTag(t)}
                className={`rounded-full px-3.5 py-2 text-[13px] ring-1 transition-colors ${
                  review.includes(t) || review.includes(t.toLowerCase())
                    ? stars >= 4 ? "bg-success-soft text-success-ink ring-success/30" : "bg-danger-soft text-danger-ink ring-danger/25"
                    : "bg-card text-ink ring-line"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        )}

        <textarea
          value={review}
          onChange={(e) => setReview(e.target.value)}
          placeholder="Anything else? (optional)"
          rows={4}
          className="mt-4 w-full resize-none rounded-[20px] bg-card p-4 text-[15px] text-ink ring-1 ring-line placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-navy"
        />
      </div>

      <BottomCTA onClick={submit} disabled={stars === 0} note={error ? <p className="text-center text-[13px] text-danger">{error}</p> : undefined}>
        Submit rating
      </BottomCTA>
    </div>
  );
};

export default Rating;
