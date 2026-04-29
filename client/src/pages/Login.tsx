import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Phone, ArrowRight } from "lucide-react";
import { useApp } from "@/context/AppContext";
import axios from "axios";
import { toast } from "sonner";

const Login = () => {
  const navigate = useNavigate();
  const { dispatch } = useApp();
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);

  const handleNext = async () => {
    if (phone.length < 10) return;
    setLoading(true);

    // --- DEVELOPER BYPASS ---
    if (phone === "0000000000") {
      toast.success("Developer Bypass: Logged in");
      dispatch({ type: "SET_PHONE", phone: "9876543210" });
      dispatch({ type: "SET_AUTH", value: true });
      setLoading(false);
      navigate("/onboarding-name");
      return;
    }
    // ------------------------

    const configuration = {
      widgetId: "366442766b61313736353937",
      tokenAuth: "512565TUAGr8Jdy69f12a68P1", // Using your Auth Key
      identifier: `91${phone}`,
      exposeMethods: true,
      success: async (data: any) => {
        console.log('OTP Widget Success Callback:', data);
        toast.info("OTP Verified! Authenticating...");
        setLoading(true);
        
        try {
          // MSG91 can return the token as a string OR as an object { message: 'token' }
          const accessToken = typeof data === 'string' ? data : (data.message || data.accessToken || data.token);
          
          if (!accessToken) {
            console.error('No token found in success data:', data);
            toast.error("Could not retrieve verification token.");
            setLoading(false);
            return;
          }

          const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:5000";
          const verifyResponse = await axios.post(`${apiUrl}/api/v1/auth/verify-widget-token`, {
            accessToken: accessToken
          });

          if (verifyResponse.data.success) {
            const serverUser = verifyResponse.data.user;
            dispatch({ type: "SET_PHONE", phone: verifyResponse.data.mobile || phone });
            dispatch({ type: "SET_USER_ID", id: serverUser.id });
            dispatch({ type: "UPDATE_USER", user: { 
              name: serverUser.name || "",
              email: serverUser.email || "",
              address: serverUser.address || ""
            }});
            dispatch({ type: "SET_AUTH", value: true });
            if (verifyResponse.data.token) {
              localStorage.setItem("roundu_token", verifyResponse.data.token);
            }
            toast.success("Verified successfully!");
            navigate("/onboarding-name");
          }
        } catch (err) {
          console.error('Server Verification Failed:', err);
          toast.error("Security verification failed. Please try again.");
        } finally {
          setLoading(false);
        }
      },
      failure: (error: any) => {
        console.error('OTP Failure:', error);
        toast.error("OTP verification failed. Please try again.");
        setLoading(false);
      }
    };

    if ((window as any).initSendOTP) {
      (window as any).initSendOTP(configuration);
    } else {
      // Load script dynamically if not present
      const script = document.createElement('script');
      script.src = 'https://verify.msg91.com/otp-provider.js';
      script.async = true;
      script.onload = () => {
        (window as any).initSendOTP(configuration);
      };
      document.head.appendChild(script);
    }
  };

  return (
    <div className="min-h-full flex flex-col px-6 py-8 bg-background">
      <button
        onClick={() => navigate(-1)}
        className="w-10 h-10 rounded-xl bg-input border border-border flex items-center justify-center text-foreground hover:text-primary hover:border-primary/30 transition-all active:scale-90"
      >
        <ArrowLeft size={20} />
      </button>

      <div className="mt-10 mb-8 animate-fade-in">
        <h1 className="text-3xl font-extrabold text-foreground leading-tight tracking-tight">
          Welcome to<br />
          <span className="text-primary bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/70">Roundu</span>
        </h1>
        <p className="text-muted-foreground mt-3 text-sm">Enter your phone number to continue</p>
      </div>

      <div className="animate-fade-in-up" style={{ animationDelay: "0.15s", opacity: 0 }}>
        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">
          Phone Number *
        </label>
        <div className="relative">
          <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-2 text-muted-foreground">
            <Phone size={18} />
            <span className="text-sm font-semibold text-foreground">+91</span>
            <div className="w-px h-5 bg-border" />
          </div>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
            onKeyDown={(e) => {
              if (e.key === "Enter" && phone.length === 10) {
                handleNext();
              }
            }}
            placeholder="Enter your number"
            className="w-full pl-24 pr-4 py-4 rounded-2xl bg-input border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all text-base"
          />
        </div>
      </div>

      <button
        onClick={handleNext}
        disabled={phone.length < 10 || loading}
        className="mt-6 w-full py-4 rounded-2xl font-bold text-base transition-all duration-300 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed bg-primary text-primary-foreground hover:bg-secondary animate-fade-in-up flex items-center justify-center gap-2 shadow-lg shadow-primary/20 hover:shadow-primary/30"
        style={{ animationDelay: "0.3s", opacity: 0 }}
      >
        {loading ? (
          <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        ) : (
          <>
            Next
            <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
          </>
        )}
      </button>

    </div>
  );
};

export default Login;
