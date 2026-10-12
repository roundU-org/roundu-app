import { Service } from "@/data/mockData";

interface ServiceCardProps {
  service: Service;
  onClick?: () => void;
  variant?: "compact" | "tile";
}

const ServiceCard = ({
  service,
  onClick,
  variant = "tile",
}: ServiceCardProps) => {

  if (variant === "compact") {
    return (
      <button
        onClick={onClick}
        className="glass-card service-card flex items-center gap-3 p-4 rounded-[18px] bg-card border border-line hover:border-primary/40 transition-all active:scale-[0.97] text-left shadow-card w-full h-full"
      >
        <div className="w-11 h-11 rounded-[14px] bg-primary flex items-center justify-center flex-shrink-0">
          <service.icon
            size={20}
            className="text-primary-foreground"
          />
        </div>

        <div className="min-w-0">
          <p className="text-sm font-bold text-foreground truncate">
            {service.label}
          </p>

          <p className="text-[11px] text-muted-foreground truncate">
            {service.desc}
          </p>
        </div>
      </button>
    );
  }

  return (
    <button
      onClick={onClick}
      className="glass-card service-card bg-card border border-line rounded-[18px] p-5 text-left hover:border-primary/40 transition-all active:scale-[0.97] shadow-card w-full h-full flex flex-col"
    >
        <div className="w-12 h-12 rounded-[14px] bg-primary flex items-center justify-center mb-3">
          <service.icon
            size={22}
            className="text-primary-foreground"
          />
        </div>

        <h3 className="text-sm font-bold text-foreground">
          {service.label}
        </h3>

        <p className="text-[11px] text-muted-foreground mt-0.5">
          {service.desc}
        </p>
    </button>
  );
};

export default ServiceCard;