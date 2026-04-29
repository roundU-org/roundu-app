import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { ReactNode } from "react";

interface ScreenHeaderProps {
  title: string;
  right?: ReactNode;
  onBack?: () => void;
  hideBack?: boolean;
}

const ScreenHeader = ({ title, right, onBack, hideBack }: ScreenHeaderProps) => {
  const navigate = useNavigate();
  return (
    <div className="px-5 pt-6 pb-4 flex items-center gap-3 animate-fade-in">
      {!hideBack && (
        <button
          onClick={onBack ?? (() => navigate(-1))}
          className="w-10 h-10 rounded-xl bg-input border border-border flex items-center justify-center text-foreground hover:text-primary transition-colors active:scale-95"
        >
          <ArrowLeft size={20} />
        </button>
      )}
      <h1 className="text-lg font-bold text-foreground">{title}</h1>
      {right && <div className="ml-auto">{right}</div>}
    </div>
  );
};

export default ScreenHeader;
