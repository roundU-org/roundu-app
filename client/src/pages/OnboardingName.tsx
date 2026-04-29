import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, User } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { toast } from "sonner";

const OnboardingName = () => {
  const navigate = useNavigate();
  const { user, dispatch } = useApp();
  const [name, setName] = useState(user.name || "");

  const handleContinue = () => {
    if (name.trim().length < 2) {
      toast.error("Please enter a valid name");
      return;
    }
    dispatch({ type: "UPDATE_USER", user: { name } });
    toast.success(`Welcome, ${name.split(" ")[0]}!`);
    navigate("/role", { replace: true });
  };

  return (
    <div className="min-h-full flex flex-col px-6 py-8 bg-background">
      <div className="mt-10 mb-8 animate-fade-in">
        <h1 className="text-3xl font-extrabold text-foreground leading-tight">
          What should we<br />
          <span className="text-primary">call you?</span>
        </h1>
        <p className="text-muted-foreground mt-3 text-sm">
          Enter your name for a personalized experience
        </p>
      </div>

      <div className="animate-fade-in-up" style={{ animationDelay: "0.15s", opacity: 0 }}>
        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">
          Full Name
        </label>
        <div className="relative">
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">
            <User size={18} />
          </div>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleContinue();
            }}
            placeholder="John Doe"
            autoFocus
            className="w-full pl-12 pr-4 py-4 rounded-2xl bg-input border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all text-base"
          />
        </div>
      </div>

      <button
        onClick={handleContinue}
        disabled={name.trim().length < 2}
        className="mt-6 w-full py-4 rounded-2xl font-bold text-base transition-all duration-300 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed bg-primary text-primary-foreground hover:bg-secondary animate-fade-in-up flex items-center justify-center gap-2 shadow-lg shadow-primary/20"
        style={{ animationDelay: "0.3s", opacity: 0 }}
      >
        Continue
        <ArrowRight size={18} />
      </button>

      <div className="mt-auto pt-10 text-center animate-fade-in" style={{ animationDelay: "0.5s", opacity: 0 }}>
        <p className="text-xs text-muted-foreground">
          You can always change this later in your profile
        </p>
      </div>
    </div>
  );
};

export default OnboardingName;
