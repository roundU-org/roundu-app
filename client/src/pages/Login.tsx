import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Phone, ArrowRight } from "lucide-react";
import { useApp } from "@/context/AppContext";
import axios from "axios";
import { API_BASE_URL } from "@/config/env";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { motion, AnimatePresence } from "framer-motion";
import BrandLogo from "@/components/BrandLogo";

const loginSchema = z.object({
  phone: z.string().length(10, "Phone number must be exactly 10 digits").regex(/^\d+$/, "Must be numbers only"),
});

type LoginFormData = z.infer<typeof loginSchema>;

const Login = () => {
  const navigate = useNavigate();
  const { dispatch } = useApp();
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isFocused, setIsFocused] = useState(false);

  const { register, handleSubmit, formState: { errors, isValid } } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    mode: "onChange",
  });

  const onSubmit = async (data: LoginFormData) => {
    setLoading(true);
    setError("");

    try {
      const response = await axios.post(`${API_BASE_URL}/auth/send-otp`, { phone: data.phone });

      if (response.data.success) {
        dispatch({ type: "SET_PHONE", phone: data.phone });
        localStorage.setItem("roundu_pending_phone", data.phone);
        navigate("/otp");
      } else {
        setError(response.data.message || "Failed to send OTP");
      }
    } catch (err: any) {
      console.error('Send OTP Failed:', err);
      if (import.meta.env.DEV) {
        console.warn('[Login] Using Mock OTP fallback');
        dispatch({ type: "SET_PHONE", phone: data.phone });
        localStorage.setItem("roundu_pending_phone", data.phone);
        navigate("/otp");
      } else {
        const apiError = err.response?.data?.error;
        const errorMessage = typeof apiError === "string" ? apiError : apiError?.message;
        setError(errorMessage || "Failed to send OTP. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-background px-6 pb-8 pt-6">
      {/* Quiet map motif from the brand, fading into the page */}
      <svg className="pointer-events-none absolute inset-x-0 top-0 h-[34vh] w-full opacity-70" viewBox="0 0 390 380" preserveAspectRatio="xMidYMid slice" aria-hidden>
        <defs>
          <pattern id="lg-blocks" width="62" height="62" patternUnits="userSpaceOnUse" x="-8" y="-8">
            <rect x="8" y="8" width="46" height="46" rx="8" fill="#F6F3EE" />
          </pattern>
          <linearGradient id="lg-fade" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0.45" stopColor="#F6F3EE" stopOpacity="0" />
            <stop offset="1" stopColor="#F6F3EE" />
          </linearGradient>
        </defs>
        <rect width="390" height="380" fill="#E6DFD3" />
        <rect width="390" height="380" fill="url(#lg-blocks)" />
        <rect x="116" y="54" width="46" height="46" rx="8" fill="#D3DCC7" />
        <path d="M -10 255 L 147 255 L 147 131 L 271 131 L 271 69" fill="none" stroke="#FC7508" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="271" cy="69" r="9" fill="#152E4B" stroke="#fff" strokeWidth="3" />
        <rect width="390" height="380" fill="url(#lg-fade)" />
      </svg>

      <motion.div
        initial={{ opacity: 0, x: -12 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10"
      >
        <button
          onClick={() => navigate(-1)}
          aria-label="Back"
          className="grid h-11 w-11 place-items-center rounded-full bg-card text-ink ring-1 ring-line active:scale-90 transition-transform"
        >
          <ArrowLeft size={20} strokeWidth={2} />
        </button>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 mt-[20vh]"
      >
        <BrandLogo className="h-10" />
        <h1 className="mt-6 text-[32px] font-semibold leading-[1.08] tracking-[-0.035em] text-navy">
          {isSignUp ? "Create your account." : "Trusted hands at your door."}
        </h1>
        <p className="mt-3 text-[15px] leading-relaxed text-muted-foreground">
          {isSignUp ? "Takes less than a minute." : "Enter your phone number to continue."}
        </p>
      </motion.div>

      <AnimatePresence mode="wait">
        {error && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="relative z-10 mt-6 rounded-[14px] bg-danger-soft p-4 text-sm font-medium text-danger-ink ring-1 ring-danger/25"
          >
            {error}
          </motion.div>
        )}
      </AnimatePresence>

      <form onSubmit={handleSubmit(onSubmit)} className="relative z-10 mt-8 space-y-4">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.12, ease: [0.22, 1, 0.36, 1] }}
        >
          <label htmlFor="phone" className="sr-only">Phone number</label>
          <div
            className={`flex items-center gap-3 rounded-[16px] bg-card px-4 ring-1 transition-shadow ${
              errors.phone ? "ring-danger" : isFocused ? "ring-2 ring-navy" : "ring-line"
            }`}
          >
            <Phone size={17} className="text-slate-400" strokeWidth={2} />
            <span className="text-[16px] font-semibold text-ink">+91</span>
            <span className="h-5 w-px bg-line" />
            <input
              id="phone"
              type="tel"
              inputMode="numeric"
              pattern="[0-9]*"
              {...register("phone")}
              maxLength={10}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              placeholder="98765 43210"
              className="w-full bg-transparent py-[18px] text-[17px] font-medium tracking-wide text-ink placeholder:text-slate-400 focus:outline-none"
            />
          </div>
          {errors.phone && <p className="ml-1 mt-2 text-[12px] font-medium text-danger">{errors.phone.message}</p>}
        </motion.div>

        <motion.button
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.22, ease: [0.22, 1, 0.36, 1] }}
          whileTap={isValid && !loading ? { scale: 0.98 } : {}}
          type="submit"
          disabled={!isValid || loading}
          className="flex w-full items-center justify-center gap-2.5 rounded-[16px] bg-jet py-[18px] text-[16px] font-semibold text-paper transition-opacity disabled:cursor-not-allowed disabled:opacity-40"
        >
          {loading ? (
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-paper/30 border-t-paper" />
          ) : (
            <>
              {isSignUp ? "Sign up" : "Continue"}
              <ArrowRight size={18} strokeWidth={2.2} />
            </>
          )}
        </motion.button>
      </form>

      <p className="relative z-10 mt-auto pt-8 text-center text-[12px] leading-relaxed text-muted-foreground">
        By continuing you agree to our{" "}
        <button type="button" onClick={() => navigate("/terms")} className="font-medium text-ink underline underline-offset-2">Terms</button> and{" "}
        <button type="button" onClick={() => navigate("/privacy")} className="font-medium text-ink underline underline-offset-2">Privacy Policy</button>.
      </p>
    </div>
  );
};

export default Login;
