import { MessageSquare } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { useApp } from "@/context/AppContext";
import "./chatbot.css";

const SupportChatbot = () => {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated } = useApp() as any;

  // Only on hub screens. On forms, maps and booking steps it covered buttons and content.
  const shownRoutes = ["/bookings", "/support", "/get-help", "/provider/jobs"];
  if (!isAuthenticated || !shownRoutes.includes(pathname)) return null;

  return (
    <button
      onClick={() =>
        navigate("/assistant", {
          state: { from: pathname },
        })
      }
      aria-label="Ask RoundU assistant"
      className="fixed bottom-28 right-5 z-40 grid h-12 w-12 place-items-center rounded-full bg-card text-navy ring-1 ring-line shadow-[0_14px_30px_-12px_rgba(14,27,44,0.45)] transition-transform active:scale-95"
    >
      <MessageSquare size={20} strokeWidth={1.9} />
    </button>
  );
};

export default SupportChatbot;