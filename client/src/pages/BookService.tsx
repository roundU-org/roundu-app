import { useState, useEffect, useRef, useCallback } from "react";
import {
  ArrowLeft,
  MapPin,
  Clock,
  Zap,
  Mic,
  Trash2,
  Square,
  Play,
  Pause,
  XCircle,
  X,
  Loader2,
  Camera,
  Image,
} from "lucide-react";


import { compressImage, uploadImage } from "@/lib/imageUpload";

import {
  useNavigate,
  useParams,
  useLocation,
} from "react-router-dom";

import { getServiceById } from "@/data/mockData";
import { useVoiceRecorder } from "@/hooks/useVoiceRecorder";
import { useApp } from "@/context/AppContext";
import { uploadVoiceNote } from "@/lib/voiceUpload";
import { useCurrentLocation } from "@/hooks/useLocation";
import { reverseGeocode } from "@/lib/mapProvider";
import LocationModal from "@/components/LocationModal";
import { FlowHeader } from "@/components/FlowHeader";
import {
  motion,
  AnimatePresence,
} from "framer-motion";

const BookService = () => {
  const { serviceId = "s1" } =
    useParams<{ serviceId: string }>();

  const navigate = useNavigate();

  const routerLocation = useLocation();

  const service =
    getServiceById(serviceId);

  const {
    dispatch,
    user,
    bookingNotes,
    bookingVoiceNote,
    bookingVoiceNoteUrl,
    bookingImages,
  } = useApp();

  const [images, setImages] = useState<string[]>(bookingImages || []);
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [fullscreenImage, setFullscreenImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const cameraInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    dispatch({ type: "SET_IMAGES", images });
  }, [images, dispatch]);

  const handleTakePhoto = () => {
    setUploadError("");
    if (images.length >= 5) {
      setUploadError("You can upload up to 5 photos only.");
      return;
    }
    cameraInputRef.current?.click();
  };

  const handleChooseGallery = () => {
    setUploadError("");
    if (images.length >= 5) {
      setUploadError("You can upload up to 5 photos only.");
      return;
    }
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (images.length + files.length > 5) {
      setUploadError("You can upload up to 5 photos only.");
      return;
    }

    setUploadError("");
    setIsProcessing(true);

    try {
      const newUrls: string[] = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (!['image/jpeg', 'image/png', 'image/jpg'].includes(file.type)) {
          setUploadError("Unsupported format. Only JPG, JPEG, and PNG are allowed.");
          setIsProcessing(false);
          return;
        }

        const compressed = await compressImage(file);
        const url = await uploadImage(compressed, file.name);
        newUrls.push(url);
      }
      setImages(prev => [...prev, ...newUrls]);
    } catch (err: any) {
      console.error(err);
      setUploadError(err.message || "Failed to upload file.");
    } finally {
      setIsProcessing(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleRemoveImage = (indexToRemove: number) => {
    setImages(prev => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const [locating, setLocating] =
    useState(false);

  const [
    isLocationModalOpen,
    setIsLocationModalOpen,
  ] = useState(false);

  const lockedDescription =
    (routerLocation.state as any)
      ?.lockedDescription;

  const isDescriptionLocked =
    typeof lockedDescription ===
    "string" &&
    lockedDescription.trim().length >
    0;

  // Selected problem areas passed from ServiceSelection
  const selectedIssue: string =
    (routerLocation.state as any)
      ?.issue || "";

  const selectedProblems: string[] =
    selectedIssue
      ? selectedIssue
        .split(",")
        .map((s: string) => s.trim())
        .filter(Boolean)
      : [];

  const [desc, setDesc] = useState(
    isDescriptionLocked
      ? lockedDescription
      : bookingNotes || ""
  );

  useEffect(() => {
    if (isDescriptionLocked) {
      setDesc(lockedDescription);
    }
  }, [
    isDescriptionLocked,
    lockedDescription,
  ]);

  const handleLocationFetched =
    useCallback(
      async (
        lat: number,
        lng: number
      ) => {
        if (user.address) return;

        dispatch({
          type: "SET_CURRENT_LOCATION",
          lat,
          lng,
        });

        setLocating(true);

        try {
          const result =
            await reverseGeocode(
              lat,
              lng
            );

          if (result.address) {
            dispatch({
              type: "UPDATE_USER",
              user: {
                address: result.address,
              },
            });
            localStorage.setItem("roundu_last_location", JSON.stringify({ lat, lng, address: result.address, ts: Date.now() }));
          }
        } catch (err) {
          console.warn("Reverse geocode failed:", err);
          try {
            const cached = localStorage.getItem("roundu_last_location");
            if (cached) {
              const parsed = JSON.parse(cached);
              dispatch({
                type: "UPDATE_USER",
                user: {
                  address: parsed.address,
                },
              });
            }
          } catch (_) { }
        } finally {
          setLocating(false);
        }
      },
      [dispatch, user.address]
    );

  const {
    loading: gpsLoading,
    refetch: manualRefetch,
  } = useCurrentLocation(
    handleLocationFetched
  );

  const [
    scheduleType,
    setScheduleType,
  ] = useState<
    "now" | "later" | null
  >(null);

  const [isUploading, setIsUploading] =
    useState(false);

  const [error, setError] =
    useState("");

  const [isCancelled, setIsCancelled] =
    useState(false);

  const restoredAudioRef =
    useRef<HTMLAudioElement | null>(
      null
    );

  const [
    isRestoredPlaying,
    setIsRestoredPlaying,
  ] = useState(false);

  const [
    restoredCleared,
    setRestoredCleared,
  ] = useState(false);

  const recorder =
    useVoiceRecorder();

  const showRestoredVoice =
    !restoredCleared &&
    bookingVoiceNote &&
    !!bookingVoiceNoteUrl &&
    !recorder.audioBlob;

  useEffect(() => {
    if (
      bookingVoiceNoteUrl &&
      !restoredCleared
    ) {
      const audio = new Audio(
        bookingVoiceNoteUrl
      );

      audio.onended = () =>
        setIsRestoredPlaying(false);

      restoredAudioRef.current =
        audio;
    }

    return () => {
      restoredAudioRef.current?.pause();

      restoredAudioRef.current =
        null;
    };
  }, [
    bookingVoiceNoteUrl,
    restoredCleared,
  ]);

  const toggleRestoredPlay = () => {
    const audio =
      restoredAudioRef.current;

    if (!audio) return;

    if (isRestoredPlaying) {
      audio.pause();

      setIsRestoredPlaying(false);
    } else {
      audio.play();

      setIsRestoredPlaying(true);
    }
  };

  const deleteRestoredVoice = () => {
    restoredAudioRef.current?.pause();

    restoredAudioRef.current =
      null;

    setIsRestoredPlaying(false);

    setRestoredCleared(true);

    dispatch({
      type: "SET_NOTES",
      notes: desc,
      voiceNote: false,
      voiceNoteUrl: undefined,
    });
  };

  useEffect(() => {
    if (
      (routerLocation.state as any)
        ?.cancelled
    ) {
      setIsCancelled(true);

      window.history.replaceState(
        {},
        ""
      );
    }
  }, [routerLocation.state]);

  const handleScheduleSelect =
    async (
      type: "now" | "later"
    ) => {
      if (
        !desc &&
        !recorder.audioBlob &&
        !showRestoredVoice
      ) {
        setError(
          "Please describe your issue first"
        );

        return;
      }

      setError("");

      setIsCancelled(false);

      setScheduleType(type);

      let uploadedUrl:
        | string
        | undefined = undefined;

      if (recorder.audioBlob) {
        setIsUploading(true);

        try {
          uploadedUrl =
            await uploadVoiceNote(
              recorder.audioBlob
            );
        } catch (err) {
          setError(
            "Failed to upload voice note."
          );

          setIsUploading(false);

          setScheduleType(null);

          return;
        }

        setIsUploading(false);
      }

      dispatch({
        type: "SET_NOTES",
        notes: desc,
        voiceNote:
          !!recorder.audioBlob ||
          showRestoredVoice,
        voiceNoteUrl:
          uploadedUrl ||
          (showRestoredVoice
            ? bookingVoiceNoteUrl ??
            undefined
            : undefined),
      });

      if (type === "later") {
        navigate("/booking/date", {
          state: {
            serviceId,
            desc,
            hasVoiceNote:
              !!recorder.audioBlob,
            voiceNoteUrl:
              uploadedUrl,
          },
        });

        return;
      }

      sessionStorage.removeItem(
        "searching_providers_state"
      );

      sessionStorage.removeItem(
        "searching_providers_scroll"
      );

      navigate(
        `/searching-providers/${serviceId}`
      );
    };

  const goBack = () => {
    if (isCancelled) {
      dispatch({ type: "RESET_BOOKING_DRAFT" });
      navigate("/home", { replace: true });
    } else {
      navigate(-1);
    }
  };
  const busy = isUploading || isProcessing;

  return (
    <div className="flex min-h-[100dvh] flex-col bg-background pb-10 font-sans">
      <FlowHeader
        title="Tell us a little more"
        subtitle={
          <span className="inline-flex items-center gap-2">
            {service?.label || "Service"}
            {isCancelled && (
              <span className="inline-flex items-center gap-1 rounded-full bg-danger-soft px-2 py-0.5 text-[11.5px] font-medium text-danger-ink">
                <XCircle size={12} /> Previous request cancelled
              </span>
            )}
          </span>
        }
        onBack={goBack}
      />

      <div className="space-y-3 px-5 pt-4">
        {/* the issues picked on the previous screen */}
        {selectedProblems.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {selectedProblems.map((problem, idx) => (
              <motion.span
                key={problem}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: idx * 0.05 }}
                className="inline-flex items-center gap-1.5 rounded-full bg-danger-soft px-3 py-1.5 text-[13px] font-medium text-danger-ink"
              >
                <span className="h-1.5 w-1.5 rounded-full bg-danger" />
                {problem}
              </motion.span>
            ))}
          </div>
        )}

        {/* describe + voice */}
        <section className="rounded-[22px] bg-card p-4 ring-1 ring-line">
          <p className="mb-2 text-[13px] font-medium text-muted-foreground">What's going on?</p>
          <textarea
            rows={3}
            value={desc}
            onChange={(e) => !isDescriptionLocked && setDesc(e.target.value)}
            readOnly={isDescriptionLocked}
            placeholder="e.g. Water drips from under the kitchen sink"
            className="w-full resize-none rounded-[14px] bg-sand/60 p-3.5 text-[15px] text-ink placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-navy"
          />

          <div className="mt-3">
            {recorder.isRecording ? (
              <div className="flex items-center gap-3 rounded-[14px] bg-danger-soft px-3.5 py-3">
                <span className="relative flex h-3 w-3">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-danger opacity-60" />
                  <span className="relative inline-flex h-3 w-3 rounded-full bg-danger" />
                </span>
                <span className="flex-1 text-[14px] font-medium text-danger-ink">Recording…</span>
                <button onClick={recorder.stopRecording} aria-label="Stop recording" className="grid h-10 w-10 place-items-center rounded-full bg-danger text-white">
                  <Square size={14} fill="currentColor" />
                </button>
              </div>
            ) : recorder.audioBlob || showRestoredVoice ? (
              <div className="flex items-center gap-3 rounded-[14px] bg-sand/60 px-3.5 py-3">
                <button
                  onClick={recorder.audioBlob ? recorder.playAudio : toggleRestoredPlay}
                  aria-label="Play voice note"
                  className="grid h-10 w-10 place-items-center rounded-full bg-navy text-paper"
                >
                  {(recorder.audioBlob ? recorder.isPlaying : isRestoredPlaying) ? <Pause size={15} /> : <Play size={15} className="ml-0.5" />}
                </button>
                <span className="flex-1">
                  <span className="block text-[14px] font-medium text-ink">Voice note</span>
                  <span className="block text-[12px] text-success-ink">Attached</span>
                </span>
                <button
                  onClick={recorder.audioBlob ? recorder.deleteRecording : deleteRestoredVoice}
                  aria-label="Delete voice note"
                  className="grid h-10 w-10 place-items-center rounded-full text-muted-foreground hover:text-danger"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ) : (
              <button onClick={recorder.startRecording} className="flex w-full items-center gap-3 rounded-[14px] bg-sand/60 px-3.5 py-3 text-left active:scale-[0.99] transition-transform">
                <span className="grid h-10 w-10 place-items-center rounded-full bg-card text-navy ring-1 ring-line">
                  <Mic size={17} />
                </span>
                <span className="flex-1">
                  <span className="block text-[14px] font-medium text-ink">Or say it out loud</span>
                  <span className="block text-[12px] text-muted-foreground">Record a short voice note</span>
                </span>
              </button>
            )}
          </div>

          {isUploading && (
            <p className="mt-3 flex items-center gap-2 text-[13px] text-muted-foreground">
              <Loader2 size={14} className="animate-spin" /> Uploading voice note…
            </p>
          )}
        </section>

        {/* photos */}
        <section className="rounded-[22px] bg-card p-4 ring-1 ring-line">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-[13px] font-medium text-muted-foreground">Photos <span className="text-slate-400">· optional</span></p>
            {images.length > 0 && <span className="text-[12px] text-muted-foreground">{images.length} added</span>}
          </div>
          <input type="file" ref={fileInputRef} accept="image/jpeg,image/png,image/jpg" multiple style={{ display: "none" }} onChange={handleFileChange} />
          <input type="file" ref={cameraInputRef} accept="image/jpeg,image/png,image/jpg" capture="environment" style={{ display: "none" }} onChange={handleFileChange} />

          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            <button
              onClick={handleTakePhoto}
              type="button"
              className="grid h-20 w-20 flex-shrink-0 place-items-center rounded-[14px] bg-sand/60 text-navy active:scale-95 transition-transform"
            >
              <span className="flex flex-col items-center gap-1 text-[11.5px] font-medium">
                <Camera size={18} /> Camera
              </span>
            </button>
            <button
              onClick={handleChooseGallery}
              type="button"
              className="grid h-20 w-20 flex-shrink-0 place-items-center rounded-[14px] bg-sand/60 text-navy active:scale-95 transition-transform"
            >
              <span className="flex flex-col items-center gap-1 text-[11.5px] font-medium">
                <Image size={18} /> Gallery
              </span>
            </button>
            {images.map((url, idx) => (
              <div key={url} className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-[14px] ring-1 ring-line">
                <img src={url} alt={`Photo ${idx + 1}`} onClick={() => setFullscreenImage(url)} className="h-full w-full cursor-pointer object-cover" />
                <button
                  onClick={() => handleRemoveImage(idx)}
                  type="button"
                  aria-label="Remove photo"
                  className="absolute right-1 top-1 grid h-6 w-6 place-items-center rounded-full bg-ink/60 text-white"
                >
                  <X size={12} strokeWidth={2.5} />
                </button>
              </div>
            ))}
          </div>
          {isProcessing && (
            <p className="mt-2 flex items-center gap-2 text-[12.5px] text-muted-foreground">
              <Loader2 size={13} className="animate-spin" /> Uploading photos…
            </p>
          )}
          {uploadError && <p className="mt-2 text-[12.5px] text-danger">{uploadError}</p>}
        </section>

        {/* address */}
        <section className="flex items-center gap-3 rounded-[22px] bg-card p-4 ring-1 ring-line">
          <button onClick={() => manualRefetch()} aria-label="Use my current location" className="grid h-11 w-11 flex-shrink-0 place-items-center rounded-full bg-orange-50 text-brand-deep">
            {locating || gpsLoading ? <Loader2 size={18} className="animate-spin" /> : <MapPin size={18} />}
          </button>
          <span className="min-w-0 flex-1">
            <span className="block text-[13px] text-muted-foreground">Service at</span>
            <span className="block truncate text-[14.5px] font-medium text-ink">{user.address || "Set your location"}</span>
          </span>
          <button onClick={() => setIsLocationModalOpen(true)} className="rounded-full bg-sand px-3.5 py-2 text-[13px] font-medium text-ink">
            Change
          </button>
        </section>

        {error && <p className="rounded-[12px] bg-danger-soft px-3.5 py-2.5 text-[13px] text-danger-ink">{error}</p>}

        {/* when */}
        <section>
          <p className="mb-2.5 mt-3 text-[13px] font-medium text-muted-foreground">When do you need it?</p>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => handleScheduleSelect("now")}
              disabled={busy}
              className={`rounded-[20px] p-4 text-left transition-all active:scale-[0.98] disabled:opacity-60 ${
                scheduleType === "now" ? "bg-navy text-paper" : "bg-card text-ink ring-1 ring-line"
              }`}
            >
              <Zap size={20} className={scheduleType === "now" ? "text-brand-amber" : "text-brand-deep"} />
              <span className="mt-3 block text-[15.5px] font-semibold">Right now</span>
              <span className={`block text-[12.5px] ${scheduleType === "now" ? "text-paper/65" : "text-muted-foreground"}`}>Pro arrives in minutes</span>
            </button>
            <button
              onClick={() => handleScheduleSelect("later")}
              disabled={busy}
              className={`rounded-[20px] p-4 text-left transition-all active:scale-[0.98] disabled:opacity-60 ${
                scheduleType === "later" ? "bg-navy text-paper" : "bg-card text-ink ring-1 ring-line"
              }`}
            >
              <Clock size={20} className={scheduleType === "later" ? "text-paper" : "text-navy"} />
              <span className="mt-3 block text-[15.5px] font-semibold">Pick a time</span>
              <span className={`block text-[12.5px] ${scheduleType === "later" ? "text-paper/65" : "text-muted-foreground"}`}>Choose a day and slot</span>
            </button>
          </div>
        </section>
      </div>

      {/* FULLSCREEN IMAGE */}
      <AnimatePresence>
        {fullscreenImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setFullscreenImage(null)}
            className="fixed inset-0 z-50 flex items-center justify-center bg-ink/90 p-4"
          >
            <button onClick={() => setFullscreenImage(null)} aria-label="Close" className="absolute right-5 top-5 grid h-11 w-11 place-items-center rounded-full bg-white/10 text-white">
              <X size={22} />
            </button>
            <motion.img
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              src={fullscreenImage}
              alt="Photo preview"
              className="max-h-[85vh] max-w-full rounded-[18px] object-contain"
              onClick={(e) => e.stopPropagation()}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <LocationModal isOpen={isLocationModalOpen} onClose={() => setIsLocationModalOpen(false)} />
    </div>
  );
};

export default BookService;