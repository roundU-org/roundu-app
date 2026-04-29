import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { ArrowLeft, Database, RefreshCw } from "lucide-react";
import { useNavigate } from "react-router-dom";

const DbCheck = () => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchData = async () => {
    setLoading(true);
    const { data: responses, error } = await supabase
      .from('onboarding_responses')
      .select('*')
      .order('updated_at', { ascending: false });
    
    if (error) {
      console.error(error);
    } else {
      setData(responses || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <div className="min-h-full flex flex-col bg-background p-6">
      <div className="flex items-center justify-between mb-8">
        <button onClick={() => navigate(-1)} className="p-2 rounded-xl bg-input border border-border">
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-xl font-bold flex items-center gap-2">
          <Database size={20} className="text-primary" />
          DB Check
        </h1>
        <button onClick={fetchData} className="p-2 rounded-xl bg-primary/10 text-primary">
          <RefreshCw size={20} className={loading ? "animate-spin" : ""} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto space-y-4 no-scrollbar pb-10">
        {data.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">
            <p>No records found in `onboarding_responses` table.</p>
          </div>
        ) : (
          data.map((item, i) => (
            <div key={i} className="p-4 rounded-2xl bg-card border border-border shadow-sm">
              <div className="flex justify-between items-start mb-2">
                <span className="text-sm font-bold text-primary">{item.phone}</span>
                <span className="text-[10px] text-muted-foreground">{new Date(item.updated_at).toLocaleString()}</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="text-muted-foreground">Home: <span className="text-foreground font-semibold">{item.homeType}</span></div>
                <div className="text-muted-foreground">Freq: <span className="text-foreground font-semibold">{item.frequency}</span></div>
                <div className="text-muted-foreground">Size: <span className="text-foreground font-semibold">{item.householdSize}</span></div>
                <div className="col-span-2 text-muted-foreground">Services: <span className="text-foreground font-semibold">{item.serviceIds?.join(", ")}</span></div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default DbCheck;
