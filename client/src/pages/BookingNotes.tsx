import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Mic, Square, Play, Pause, Trash2 } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { useVoiceRecorder } from "@/hooks/useVoiceRecorder";
import { uploadVoiceNote } from "@/lib/voiceUpload";
import { toast } from "sonner";
import { FlowHeader, BottomCTA } from "@/components/FlowHeader";

const BookingNotes = () => {
  const navigate = useNavigate();
  const { selectedProvider, selectedDate, selectedTime, dispatch } = useApp();
  const [notes, setNotes] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  
  const recorder = useVoiceRecorder(60); // 60 seconds max

  const handleNext = useCallback(async () => {
    let uploadedUrl: string | null = null;
    if (recorder.audioBlob) {
      setIsUploading(true);
      toast.info("Uploading voice note...");
      try {
        uploadedUrl = await uploadVoiceNote(recorder.audioBlob);
        toast.success("Voice note uploaded!");
      } catch (err) {
        toast.error("Failed to upload voice note. Please try again.");
        setIsUploading(false);
        return; // Stop flow
      }
      setIsUploading(false);
    }
    
    dispatch({ type: "SET_NOTES", notes, voiceNote: !!recorder.audioBlob, voiceNoteUrl: uploadedUrl || undefined });
    navigate("/booking/payment");
  }, [dispatch, navigate, notes, recorder.audioBlob]);

  if (!selectedProvider || !selectedDate || !selectedTime) {
    navigate("/booking/date", { replace: true });
    return null;
  }

  return (
    <div className="flex min-h-full flex-col bg-background pb-32">
      <FlowHeader step={3} title="Anything we should know?" subtitle="Optional, but it helps your professional bring the right tools." />

      <div className="flex-1 space-y-3 px-5 pt-4">
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="e.g. Kitchen switchboard sparks when I turn it on"
          rows={4}
          className="w-full resize-none rounded-[20px] bg-card p-4 text-[15px] text-ink ring-1 ring-line placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-navy"
        />

        {/* Voice note */}
        <div className="rounded-[20px] bg-card p-4 ring-1 ring-line">
          {!recorder.isRecording && !recorder.audioBlob ? (
            <button onClick={recorder.startRecording} className="flex w-full items-center gap-3 text-left">
              <span className="grid h-11 w-11 place-items-center rounded-full bg-sand text-navy"><Mic size={18} /></span>
              <span className="flex-1">
                <span className="block text-[14.5px] font-medium text-ink">Describe it by voice</span>
                <span className="block text-[12.5px] text-muted-foreground">Up to 60 seconds</span>
              </span>
            </button>
          ) : recorder.isRecording ? (
            <div className="flex items-center gap-3">
              <span className="relative flex h-3 w-3">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-500 opacity-60" />
                <span className="relative inline-flex h-3 w-3 rounded-full bg-red-600" />
              </span>
              <span className="flex-1 text-[14.5px] font-medium tabular-nums text-ink">Recording · {recorder.formatTime(recorder.duration)}</span>
              <button onClick={recorder.stopRecording} aria-label="Stop" className="grid h-11 w-11 place-items-center rounded-full bg-red-600 text-white">
                <Square size={15} fill="currentColor" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <button onClick={recorder.playAudio} aria-label="Play" className="grid h-11 w-11 place-items-center rounded-full bg-navy text-paper">
                {recorder.isPlaying ? <Pause size={15} fill="currentColor" /> : <Play size={15} fill="currentColor" className="ml-0.5" />}
              </button>
              <div className="flex-1">
                <p className="text-[14.5px] font-medium text-ink">Voice note</p>
                <p className="text-[12.5px] tabular-nums text-muted-foreground">
                  {recorder.isPlaying
                    ? `${recorder.formatTime(recorder.playbackTime)} / ${recorder.formatTime(recorder.duration)}`
                    : recorder.formatTime(recorder.duration)}
                </p>
              </div>
              <button onClick={recorder.deleteRecording} aria-label="Delete" className="grid h-10 w-10 place-items-center rounded-full text-muted-foreground hover:text-red-600">
                <Trash2 size={16} />
              </button>
            </div>
          )}
          {recorder.error && <p className="mt-2 text-[12px] text-red-600">{recorder.error}</p>}
        </div>

        {/* Summary */}
        <div className="rounded-[20px] bg-card px-4 ring-1 ring-line">
          <SummaryRow label="Professional" value={selectedProvider.name} />
          <SummaryRow label="Date" value={selectedDate} />
          <SummaryRow label="Time" value={selectedTime} />
          <SummaryRow label="Rate" value={`₹${selectedProvider.pricePerHr}/hr`} />
        </div>
      </div>

      <BottomCTA onClick={handleNext} disabled={isUploading}>
        {isUploading ? "Uploading voice note…" : "Continue to payment"}
      </BottomCTA>
    </div>
  );
};

const SummaryRow = ({ label, value }: { label: string; value: string }) => (
  <div className="flex items-center justify-between border-b border-line py-3.5 last:border-b-0">
    <span className="text-[13.5px] text-muted-foreground">{label}</span>
    <span className="text-[13.5px] font-medium text-ink">{value}</span>
  </div>
);

export default BookingNotes;
