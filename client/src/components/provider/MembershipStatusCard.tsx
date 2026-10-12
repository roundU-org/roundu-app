import { Crown, Sparkles, Star } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { getDisplayPrice, getMembershipBadgeLabel } from "@/lib/membership";
import { MembershipBillingCycle, MembershipPlanId } from "@/types/membership";

interface MembershipStatusCardProps {
  planId: MembershipPlanId;
  billingCycle: MembershipBillingCycle;
}

const MembershipStatusCard = ({ planId, billingCycle }: MembershipStatusCardProps) => {
  const navigate = useNavigate();
  const badgeLabel = getMembershipBadgeLabel(planId);
  const amount = getDisplayPrice(planId, billingCycle);

  return (
    <div className="bg-gradient-to-r from-primary to-primary/90 text-primary-foreground rounded-[24px] p-5 ring-1 ring-line overflow-hidden relative">
      <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-white/10 blur-xl" />
      <div className="flex items-start justify-between gap-3 relative z-10">
        <div>
          <p className="text-xs uppercase tracking-widest font-semibold text-primary-foreground/80">
            Membership Status
          </p>
          <p className="text-xl font-semibold mt-1">{badgeLabel}</p>
          <p className="text-xs mt-1 text-primary-foreground/90">
            {amount ? `₹${amount}/${billingCycle === "weekly" ? "week" : "month"}` : "Upgrade to boost profile reach"}
          </p>
        </div>
        <div className="w-11 h-11 rounded-[14px] bg-white/15 flex items-center justify-center">
          {planId === "pro" ? <Crown size={20} /> : planId === "basic" ? <Sparkles size={20} /> : <Star size={20} />}
        </div>
      </div>
      <button
        onClick={() => navigate("/provider/membership")}
        className="mt-4 bg-white/15 hover:bg-white/20 transition-colors px-4 py-2 rounded-[14px] text-xs font-bold"
      >
        {planId === "free" ? "Upgrade Membership" : "Manage Membership"}
      </button>
    </div>
  );
};

export default MembershipStatusCard;
