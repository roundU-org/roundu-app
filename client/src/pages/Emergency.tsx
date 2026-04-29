import { useNavigate } from "react-router-dom";
import { ArrowLeft, AlertTriangle, Phone, Zap, Droplets } from "lucide-react";
import { providers, services } from "@/data/mockData";
import { useApp } from "@/context/AppContext";

const emergencyServices = ["electrician", "plumber", "mechanic"];

const Emergency = () => {
  const navigate = useNavigate();
  const { dispatch } = useApp();

  const quickBook = (serviceId: string) => {
    const fastest = providers
      .filter((p) => p.serviceId === serviceId && p.available)
      .sort((a, b) => a.etaMin - b.etaMin)[0];
    if (!fastest) return;
    dispatch({ type: "SELECT_SERVICE", id: serviceId });
    dispatch({ type: "SELECT_PROVIDER", id: fastest.id });
    navigate(`/provider/${fastest.id}`);
  };

  return (
    <div className="min-h-full flex flex-col bg-background pb-24">
      <div className="px-5 pt-6 pb-4 flex items-center gap-3 animate-fade-in">
        <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-xl bg-input border border-border flex items-center justify-center active:scale-95">
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-lg font-bold text-foreground">Emergency Help</h1>
      </div>

      <div className="px-5 flex-1 space-y-4">
        <div className="bg-accent rounded-2xl p-5">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-accent-foreground/10 flex items-center justify-center flex-shrink-0">
              <AlertTriangle size={20} className="text-accent-foreground" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-accent-foreground">Need help fast?</h2>
              <p className="text-xs text-accent-foreground/80 mt-0.5">
                Get connected to the nearest available pro in under 15 minutes.
              </p>
            </div>
          </div>
          <button className="w-full mt-4 py-3 rounded-xl bg-primary text-primary-foreground font-bold text-sm flex items-center justify-center gap-2">
            <Phone size={16} /> Call Roundu Helpline
          </button>
        </div>

        <div>
          <h3 className="text-sm font-bold text-foreground mb-3">Quick Book</h3>
          <div className="space-y-2">
            {emergencyServices.map((sid) => {
              const s = services.find((x) => x.id === sid);
              if (!s) return null;
              return (
                <button
                  key={sid}
                  onClick={() => quickBook(sid)}
                  className="w-full bg-card border border-border rounded-2xl p-4 flex items-center gap-3 shadow-card active:scale-[0.98] transition-all"
                >
                  <div className="w-11 h-11 rounded-xl bg-primary flex items-center justify-center">
                    <s.icon size={20} className="text-primary-foreground" />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="text-sm font-bold text-foreground">{s.label}</p>
                    <p className="text-[10px] text-muted-foreground">Nearest pro · ~20 min</p>
                  </div>
                  <span className="text-xs font-bold text-primary">Book →</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Emergency;
