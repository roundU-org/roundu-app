import { ArrowLeft, Bell, Globe, Trash2, ChevronRight, Info, Percent } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { Switch } from "@/components/ui/switch";

const Settings = () => {
  const navigate = useNavigate();
  const [pushEnabled, setPushEnabled] = useState(true);
  const [emailEnabled, setEmailEnabled] = useState(false);
  const [promosEnabled, setPromosEnabled] = useState(true);

  return (
    <div className="min-h-full flex flex-col bg-[#F5F6FA] pb-24 font-sans">
      <div className="bg-white px-5 pt-6 pb-4 flex items-center shadow-sm sticky top-0 z-10">
        <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center mr-3 hover:bg-gray-100 active:scale-95 transition-all">
          <ArrowLeft size={20} className="text-[#152E4B]" />
        </button>
        <h1 className="text-xl font-extrabold text-[#030916]">Settings</h1>
      </div>

      <div className="px-5 pt-6">
        {/* Languages */}
        <div className="mb-8">
          <h2 className="text-xs font-extrabold text-gray-400 uppercase tracking-widest pl-1 mb-3">Preferences</h2>
          <button className="w-full bg-white rounded-2xl p-4 flex justify-between items-center shadow-sm border border-gray-100 active:scale-[0.98] transition-transform">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#152E4B]/5 flex items-center justify-center">
                <Globe size={18} className="text-[#152E4B]" />
              </div>
              <div className="text-left">
                <p className="font-bold text-[14px] text-gray-900">Language</p>
                <p className="text-[11px] text-gray-400 mt-0.5">English</p>
              </div>
            </div>
            <ChevronRight size={18} className="text-gray-300" />
          </button>
        </div>

        {/* Notifications */}
        <div className="mb-8">
          <h2 className="text-xs font-extrabold text-gray-400 uppercase tracking-widest pl-1 mb-3">Notifications</h2>
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 space-y-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-gray-50 flex items-center justify-center border border-gray-100">
                  <Bell size={16} className="text-gray-500" />
                </div>
                <p className="font-semibold text-[14px] text-gray-900">Push Notifications</p>
              </div>
              <Switch checked={pushEnabled} onCheckedChange={setPushEnabled} />
            </div>
            <div className="h-px bg-gray-100 w-full" />
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-gray-50 flex items-center justify-center border border-gray-100">
                  <Info size={16} className="text-gray-500" />
                </div>
                <p className="font-semibold text-[14px] text-gray-900">Booking Updates</p>
              </div>
              <Switch checked={emailEnabled} onCheckedChange={setEmailEnabled} />
            </div>
            <div className="h-px bg-gray-100 w-full" />
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-gray-50 flex items-center justify-center border border-gray-100">
                  <Percent size={16} className="text-gray-500" />
                </div>
                <p className="font-semibold text-[14px] text-gray-900">Offers & Promos</p>
              </div>
              <Switch checked={promosEnabled} onCheckedChange={setPromosEnabled} />
            </div>
          </div>
        </div>

        {/* Danger Zone */}
        <div>
          <h2 className="text-xs font-extrabold text-red-300 uppercase tracking-widest pl-1 mb-3">Account</h2>
          <button className="w-full bg-white rounded-2xl p-4 flex items-center gap-3 shadow-sm border border-red-100 hover:bg-red-50 transition-colors active:scale-[0.98]">
            <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center">
              <Trash2 size={18} className="text-red-500" />
            </div>
            <div className="text-left flex-1">
              <p className="font-bold text-[14px] text-red-600">Delete Account</p>
              <p className="text-[11px] text-red-400 mt-0.5">Permanently remove your data</p>
            </div>
          </button>
        </div>

      </div>
    </div>
  );
};
export default Settings;
