import { useNavigate } from "react-router-dom";
import { ChevronRight, Pencil, History, LogOut, Bell, HelpCircle, Tag, Settings, Gift, Wallet, Repeat, BadgeCheck } from "lucide-react";
import BottomNav from "@/components/BottomNav";
import { useApp } from "@/context/AppContext";

const Profile = () => {
  const navigate = useNavigate();
  const { user, dispatch, bookings, walletBalance } = useApp() as any;

  const handleLogout = () => {
    dispatch({ type: "LOGOUT" });
    navigate("/login", { replace: true });
  };

  const done = (bookings || []).filter((b: any) => ["completed", "paid"].includes(b.status)).length;
  const firstName = (user.name || "there").split(" ")[0];

  return (
    <div className="flex min-h-full flex-col bg-background pb-32 font-sans">
      <div className="px-5 pb-2 pt-6">
        <h1 className="text-[28px] font-semibold tracking-[-0.03em] text-navy">Profile</h1>
      </div>

      <div className="flex-1 space-y-3 px-5 pt-2">
        {/* who you are */}
        <div className="rounded-[24px] bg-card p-5 ring-1 ring-line">
          <div className="flex items-center gap-4">
            <div className="relative h-16 w-16 flex-shrink-0">
              <div className="grid h-full w-full place-items-center overflow-hidden rounded-full bg-navy text-[22px] font-semibold text-paper">
                {user.profilePicture ? <img src={user.profilePicture} alt={user.name} className="h-full w-full object-cover" /> : firstName[0]}
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 grid h-6 w-6 place-items-center rounded-full bg-success text-white ring-[3px] ring-card">
                <BadgeCheck size={13} />
              </span>
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="truncate text-[19px] font-semibold tracking-[-0.01em] text-ink">{user.name || "Your name"}</h2>
              <p className="text-[13px] text-muted-foreground">+91 {user.phone || "—"}</p>
              {user.email && <p className="truncate text-[13px] text-muted-foreground">{user.email}</p>}
            </div>
            <button
              onClick={() => navigate("/profile/edit")}
              aria-label="Edit profile"
              className="grid h-10 w-10 place-items-center rounded-full bg-sand text-ink active:scale-95 transition-transform"
            >
              <Pencil size={16} />
            </button>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-2 border-t border-line pt-4">
            <button onClick={() => navigate("/bookings")} className="text-left">
              <p className="text-[20px] font-semibold tracking-tight text-ink tabular-nums">{done}</p>
              <p className="text-[12px] text-muted-foreground">Jobs done</p>
            </button>
            <button onClick={() => navigate("/wallet")} className="text-left">
              <p className="text-[20px] font-semibold tracking-tight text-ink tabular-nums">₹{Number(walletBalance || 0).toLocaleString("en-IN")}</p>
              <p className="text-[12px] text-muted-foreground">Wallet</p>
            </button>
          </div>
        </div>

        <Group>
          <Item icon={History} label="My bookings" onClick={() => navigate("/bookings")} />
          <Item icon={Wallet} label="Wallet" onClick={() => navigate("/wallet")} />
          <Item icon={Bell} label="Notifications" onClick={() => navigate("/notifications")} />
        </Group>

        <Group>
          <Item icon={Tag} label="Offers" onClick={() => navigate("/offers")} />
          <Item icon={Gift} label="Refer and earn" hint="Get ₹100" onClick={() => navigate("/refer-earn")} />
        </Group>

        <Group>
          <Item icon={Settings} label="Settings" onClick={() => navigate("/settings")} />
          <Item icon={HelpCircle} label="Help and support" onClick={() => navigate("/support")} />
        </Group>

        {user.accountType === "provider" && user.role === "customer" && (
          <button
            onClick={() => {
              dispatch({ type: "SET_ROLE", role: "provider" });
              navigate("/provider", { replace: true });
            }}
            className="flex w-full items-center justify-center gap-2 rounded-[16px] bg-navy py-4 text-[15px] font-semibold text-paper active:scale-[0.98] transition-transform"
          >
            <Repeat size={17} /> Switch to professional mode
          </button>
        )}

        <button
          onClick={handleLogout}
          className="flex w-full items-center justify-center gap-2 rounded-[16px] py-4 text-[15px] font-medium text-danger active:scale-[0.98] transition-transform"
        >
          <LogOut size={17} /> Log out
        </button>
      </div>

      <BottomNav />
    </div>
  );
};

const Group = ({ children }: { children: React.ReactNode }) => (
  <div className="overflow-hidden rounded-[22px] bg-card ring-1 ring-line">{children}</div>
);

const Item = ({ icon: Icon, label, hint, onClick }: { icon: any; label: string; hint?: string; onClick: () => void }) => (
  <button onClick={onClick} className="flex w-full items-center gap-3.5 border-b border-line px-4 py-3.5 text-left last:border-b-0 active:bg-sand/50 transition-colors">
    <span className="grid h-9 w-9 place-items-center rounded-[11px] bg-sand text-navy">
      <Icon size={17} strokeWidth={1.9} />
    </span>
    <span className="flex-1 text-[15px] text-ink">{label}</span>
    {hint && <span className="rounded-full bg-success-soft px-2.5 py-1 text-[11.5px] font-medium text-success-ink">{hint}</span>}
    <ChevronRight size={17} className="text-slate-300" />
  </button>
);

export default Profile;
