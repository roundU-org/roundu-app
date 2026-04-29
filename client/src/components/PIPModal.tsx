import { AlertTriangle, CheckCircle2, ShieldAlert } from "lucide-react";

interface PIPModalProps {
  reasons: string[];
  onCommit: () => void;
}

const PIPModal = ({ reasons, onCommit }: PIPModalProps) => {
  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-background/95 backdrop-blur-md animate-in fade-in duration-300">
      <div className="w-full max-w-sm bg-card border border-destructive/30 rounded-3xl shadow-2xl overflow-hidden flex flex-col relative animate-in zoom-in-95 duration-300">
        <div className="bg-destructive p-6 flex flex-col items-center text-center">
          <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center mb-4 border border-white/30 animate-pulse">
            <ShieldAlert size={32} className="text-white" />
          </div>
          <h2 className="text-xl font-extrabold text-white">Performance Improvement Plan (PIP)</h2>
          <p className="text-sm text-white/80 mt-1">Your account is at risk of deactivation</p>
        </div>

        <div className="p-6 space-y-4">
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
            <AlertTriangle size={14} className="text-destructive" /> Reasons for Penalty
          </p>
          <ul className="space-y-3">
            {reasons.map((reason, idx) => (
              <li key={idx} className="flex items-start gap-3 bg-destructive/5 p-3 rounded-xl border border-destructive/10">
                <div className="w-5 h-5 rounded-full bg-destructive/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-destructive" />
                </div>
                <p className="text-sm font-semibold text-destructive/90 leading-tight">{reason}</p>
              </li>
            ))}
          </ul>

          <div className="bg-muted rounded-2xl p-4 mt-2">
            <p className="text-xs text-muted-foreground leading-relaxed">
              To continue using the platform, you must commit to improving your service quality. Future complaints or low ratings will lead to permanent suspension.
            </p>
          </div>
        </div>

        <div className="p-4 pt-0 border-t border-border bg-muted/20">
          <button
            onClick={onCommit}
            className="w-full py-4 rounded-2xl bg-destructive text-white font-bold text-base active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-lg shadow-destructive/20 mt-4"
          >
            <CheckCircle2 size={18} /> I Commit to Improve
          </button>
        </div>
      </div>
    </div>
  );
};

export default PIPModal;
