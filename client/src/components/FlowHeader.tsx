import { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft } from "lucide-react";

/** Header for multi-step flows: back button, step bars (amber, like tracking) and a title. */
export const FlowHeader = ({
  step,
  total = 3,
  title,
  subtitle,
  onBack,
}: {
  step?: number;
  total?: number;
  title: string;
  subtitle?: ReactNode;
  onBack?: () => void;
}) => {
  const navigate = useNavigate();
  return (
    <div className="px-5 pb-2 pt-5">
      <div className="flex items-center gap-4">
        <button
          onClick={onBack ?? (() => navigate(-1))}
          aria-label="Back"
          className="grid h-11 w-11 flex-shrink-0 place-items-center rounded-full bg-card text-ink ring-1 ring-line active:scale-95 transition-transform"
        >
          <ChevronLeft size={20} />
        </button>
        {step !== undefined && (
          <div className="flex flex-1 items-center gap-1.5">
            {Array.from({ length: total }, (_, i) => (
              <span key={i} className={`h-[3px] flex-1 rounded-full ${i < step ? "bg-brand-amber" : "bg-line"}`} />
            ))}
          </div>
        )}
        {step !== undefined && (
          <span className="text-[12px] tabular-nums text-muted-foreground">
            {step}/{total}
          </span>
        )}
      </div>
      <h1 className="mt-6 text-[28px] font-semibold leading-[1.1] tracking-[-0.03em] text-navy">{title}</h1>
      {subtitle && <p className="mt-1.5 text-[14px] text-muted-foreground">{subtitle}</p>}
    </div>
  );
};

/** Fixed bottom action used across flows. */
export const BottomCTA = ({
  children,
  onClick,
  disabled,
  note,
}: {
  children: ReactNode;
  onClick: () => void;
  disabled?: boolean;
  note?: ReactNode;
}) => (
  <div className="fixed bottom-0 left-0 right-0 z-20 mx-auto max-w-[430px] bg-background/90 px-5 pb-6 pt-3 backdrop-blur-md">
    {note && <div className="mb-3">{note}</div>}
    <button
      onClick={onClick}
      disabled={disabled}
      className="w-full rounded-[16px] bg-navy py-4 text-[15px] font-semibold text-paper transition-all active:scale-[0.98] disabled:opacity-35"
    >
      {children}
    </button>
  </div>
);
