import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { ArrowLeft, Check, Clock, MapPin, Star } from "lucide-react";

import { useApp, ProviderQuote } from "@/context/AppContext";
import { getAbsoluteIsoTimestamp } from "@/lib/utils";
import { socket } from "@/lib/socket";
import { createBooking } from "@/lib/api";
import { useCurrentLocation } from "@/hooks/useLocation";
import { getServiceById } from "@/data/mockData";
import { staticMapUrl } from "@/lib/mapProvider";

/**
 * SEARCHING PROVIDERS — Radar map + live quote display
 * Image 1: Grid/radar map while searching
 * When quotes arrive: quote card appears at the bottom (same page)
 */

interface CachedSearchState {
    serviceId: string;
    broadcastId: string;
    selectedDate?: string | null;
    selectedTime?: string | null;
}

const getCachedSearchState = (
    serviceId: string | undefined
): CachedSearchState | null => {
    try {
        const cached = sessionStorage.getItem("searching_providers_state");
        if (cached) {
            const parsed = JSON.parse(cached);
            if (parsed.serviceId === serviceId) return parsed;
        }
    } catch (e) {
        console.error("Failed to parse cached search state", e);
    }
    return null;
};

const SearchingProviders = () => {
    const { serviceId } = useParams();
    const navigate = useNavigate();
    const location = useLocation();

    const cachedState = getCachedSearchState(serviceId);

    const {
        user,
        nearbyProviders,
        currentLocation,
        dispatch,
        receivedQuotes,
        bookingNotes,
        bookingVoiceNoteUrl,
        bookingVoiceNote,
        bookingImages,
        selectedDate: contextDate,
        selectedTime: contextTime,
    } = useApp();

    const selectedDate = location.state?.selectedDate || contextDate;
    const selectedTime = location.state?.selectedTime || contextTime;

    const [error, setError] = useState("");
    const [acceptingQuoteId, setAcceptingQuoteId] = useState<string | null>(null);
    const [selectedQuote, setSelectedQuote] = useState<ProviderQuote | null>(null);
    const [showTimeoutModal, setShowTimeoutModal] = useState(false);
    const [hasTimedOut, setHasTimedOut] = useState(false);
    const [providerDots, setProviderDots] = useState<{ x: number; y: number; id: string }[]>([]);

    const isRestoredRef = useRef(!!cachedState);
    const hasTriggered = useRef(!!cachedState);

    const [broadcastId] = useState(
        () => cachedState?.broadcastId || `bc-${user?.id || "anon"}-${Date.now()}`
    );

    // Timer
    const [searchStartTime] = useState<number>(() => {
        if (cachedState) {
            const stored =
                sessionStorage.getItem("search_start_time") ||
                localStorage.getItem("search_start_time");
            if (stored) return Number(stored);
        }
        const now = Date.now();
        sessionStorage.setItem("search_start_time", String(now));
        localStorage.setItem("search_start_time", String(now));
        return now;
    });
    const [remainingSeconds, setRemainingSeconds] = useState(300);

    useEffect(() => {
        const update = () => {
            const now = Date.now();
            const elapsed = Math.floor((now - searchStartTime) / 1000);
            const secs = Math.max(300 - elapsed, 0);
            setRemainingSeconds(secs);
            if (secs <= 0 && !hasTimedOut && receivedQuotes.length === 0) {
                setHasTimedOut(true);
                setShowTimeoutModal(true);
            }
        };
        update();
        const timer = setInterval(update, 1000);
        return () => clearInterval(timer);
    }, [searchStartTime, hasTimedOut, receivedQuotes.length]);

    // Provider dots on the radar
    useEffect(() => {
        const ids = Object.keys(nearbyProviders);
        const cx = 50, cy = 50, maxR = 44;
        const dots = ids.slice(0, 6).map((id, i) => {
            const angle = (i / Math.max(ids.length, 1)) * 2 * Math.PI + 0.6;
            const r = 18 + Math.random() * (maxR - 18);
            return {
                id,
                x: cx + r * Math.cos(angle),
                y: cy + r * Math.sin(angle),
            };
        });
        setProviderDots(dots);
    }, [nearbyProviders]);

    // Selected quote: always default to first
    useEffect(() => {
        if (receivedQuotes.length > 0 && !selectedQuote) {
            setSelectedQuote(receivedQuotes[0]);
        }
        if (receivedQuotes.length === 0) {
            setSelectedQuote(null);
        }
    }, [receivedQuotes, selectedQuote]);

    // ── AUTO-REDIRECT: as soon as ANY quote arrives, go to the provider selection page ──
    useEffect(() => {
        if (receivedQuotes.length > 0 && serviceId) {
            navigate(`/select-provider/${serviceId}`, { replace: true });
        }
    }, [receivedQuotes.length, serviceId, navigate]);

    // GPS
    const coordsRef = useRef<{ lat: number; lng: number } | null>(currentLocation);
    const handleLocationUpdate = useCallback(
        (lat: number, lng: number) => {
            coordsRef.current = { lat, lng };
            dispatch({ type: "SET_CURRENT_LOCATION", lat, lng });
        },
        [dispatch]
    );
    useCurrentLocation(handleLocationUpdate);

    // Cancel
    const handleCancelRequest = () => {
        sessionStorage.removeItem("search_start_time");
        localStorage.removeItem("search_start_time");
        sessionStorage.removeItem("searching_providers_state");
        sessionStorage.removeItem("searching_providers_quotes");
        dispatch({ type: "CLEAR_RECEIVED_QUOTES" });
        navigate(-1);
    };

    // Cache state
    useEffect(() => {
        if (!serviceId) return;
        const stateToCache: CachedSearchState = { serviceId, broadcastId };
        sessionStorage.setItem("searching_providers_state", JSON.stringify(stateToCache));
    }, [serviceId, broadcastId]);

    // Cache quotes
    useEffect(() => {
        sessionStorage.setItem("searching_providers_quotes", JSON.stringify(receivedQuotes));
    }, [receivedQuotes]);

    // BROADCAST
    useEffect(() => {
        if (isRestoredRef.current) {
            try {
                const cachedQuotes = sessionStorage.getItem("searching_providers_quotes");
                if (cachedQuotes) {
                    const parsed = JSON.parse(cachedQuotes);
                    parsed.forEach((q: any) => {
                        dispatch({ type: "ADD_RECEIVED_QUOTE", quote: q });
                    });
                }
            } catch (e) {
                console.error("Failed to restore quotes", e);
            }
        } else {
            dispatch({ type: "CLEAR_RECEIVED_QUOTES" });
            sessionStorage.removeItem("search_start_time");
            localStorage.removeItem("search_start_time");
            const freshNow = Date.now();
            sessionStorage.setItem("searching_providers_state", JSON.stringify({
                serviceId,
                broadcastId,
                selectedDate,
                selectedTime
            }));
            sessionStorage.setItem("search_start_time", String(freshNow));
            localStorage.setItem("search_start_time", String(freshNow));
        }

        const buildPayload = () => {
            const finalDate = selectedDate || cachedState?.selectedDate || new Date().toISOString().slice(0, 10);
            const finalTime = selectedTime || cachedState?.selectedTime || new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

            return {
                broadcastId,
                customerId: user.id,
                customerName: user.name,
                serviceId: serviceId || "electrician",
                address: user.address || "Current Location",
                lat: coordsRef.current?.lat ?? null,
                lng: coordsRef.current?.lng ?? null,
                date: finalDate,
                time: finalTime,
                notes: bookingNotes || "Quick fix request from customer",
                voiceNoteUrl: bookingVoiceNoteUrl,
                voiceNote: bookingVoiceNote,
                images: bookingImages || [],
                jobType: (selectedDate || cachedState?.selectedDate) ? "scheduled" : "quick_fix",
            };
        };

        const doEmit = () => {
            if (socket.connected) {
                socket.emit("broadcast_job", buildPayload());
                if (!hasTriggered.current) {
                    dispatch({ type: "ADD_NOTIFICATION", text: "Searching for nearby providers..." });
                    hasTriggered.current = true;
                }
            }
        };

        if (socket.connected) {
            doEmit();
        } else {
            socket.once("connect", doEmit);
        }

        const interval = setInterval(doEmit, 5000);
        return () => {
            clearInterval(interval);
            socket.off("connect", doEmit);
        };
    }, [serviceId, user, dispatch, bookingNotes, bookingVoiceNoteUrl, bookingVoiceNote, selectedDate, selectedTime]);

    // ACCEPT QUOTE
    const handleAcceptQuote = async (quote: ProviderQuote) => {
        if (acceptingQuoteId) return;
        try {
            setError("");
            setAcceptingQuoteId(quote.providerId);
            const actualSelectedDate = selectedDate || cachedState?.selectedDate;
            const actualSelectedTime = selectedTime || cachedState?.selectedTime;

            const finalScheduledAt = actualSelectedDate
                ? getAbsoluteIsoTimestamp(
                    actualSelectedDate,
                    actualSelectedTime || new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                )
                : new Date().toISOString();

            const finalJobType = actualSelectedDate ? "scheduled" : "quick_fix";

            const bookingData = {
                broadcast_id: quote.broadcastId,
                customer_id: String(user?.id || ""),
                provider_id: String(quote.providerId || ""),
                service_id: String(serviceId || ""),
                status: "assigned",
                scheduled_at: finalScheduledAt,
                address:
                    user?.address ||
                    (currentLocation
                        ? `${currentLocation?.lat},${currentLocation?.lng}`
                        : "Customer Location"),
                lat: currentLocation?.lat || null,
                lng: currentLocation?.lng || null,
                price: Number(quote.price || 0),
                notes: bookingNotes || "",
                voice_note: bookingVoiceNote || false,
                voice_note_url: bookingVoiceNoteUrl || null,
                paid: false,
                images: bookingImages || [],
                jobType: finalJobType,
            };

            const res = await createBooking(bookingData);

            if (res?.success && res?.data?.id) {
                socket.emit("accept_quote", {
                    broadcastId: quote.broadcastId,
                    acceptedProviderId: quote.providerId,
                    bookingId: res.data.id,
                    customerName: user?.name || "Customer",
                    customerPhone: user?.phone || "1234567890",
                    address:
                        user?.address ||
                        (currentLocation
                            ? `${currentLocation?.lat},${currentLocation?.lng}`
                            : "Customer Location"),
                    serviceId: serviceId,
                    price: quote.price,
                    lat: currentLocation?.lat || null,
                    lng: currentLocation?.lng || null,
                    scheduled_at: finalScheduledAt,
                    jobType: finalJobType,
                });

                dispatch({ type: "ADD_BOOKING", booking: res.data });
                navigate(`/tracking/${res.data.id}`);
                return;
            }

            throw new Error(res?.message || "Booking creation failed");
        } catch (error: any) {
            console.error("ACCEPT QUOTE ERROR", error);
            setError(
                error?.response?.data?.message ||
                error?.message ||
                "Failed to confirm booking"
            );
        } finally {
            setAcceptingQuoteId(null);
        }
    };

    const service = getServiceById(serviceId || "");
    const serviceLabel = (service?.label || "professional").toLowerCase();
    const foundCount = Math.max(Object.keys(nearbyProviders).length, receivedQuotes.length);
    const hasQuotes = receivedQuotes.length > 0;
    const timeLabel = `${Math.floor(remainingSeconds / 60)}:${String(remainingSeconds % 60).padStart(2, "0")}`;
    const elapsedPct = Math.min(100, ((300 - remainingSeconds) / 300) * 100);
    const here = currentLocation || coordsRef.current;
    const mapUrl = here ? staticMapUrl(here.lat, here.lng, 15, 600, 640) : null;
    const whenLabel = selectedDate ? `${selectedDate}${selectedTime ? `, ${selectedTime}` : ""}` : "Now · Quick fix";

    // Request → Pros notified → Quotes in
    const stage = hasQuotes ? 4 : foundCount > 0 ? 3 : 2;
    const steps = [
        { label: "Request sent", sub: "Your job is live" },
        { label: foundCount > 0 ? `${foundCount} pros notified` : "Finding pros nearby", sub: "Verified, within 5 km" },
        { label: hasQuotes ? `${receivedQuotes.length} quote${receivedQuotes.length > 1 ? "s" : ""} in` : "Waiting for quotes", sub: "Usually under a minute" },
    ];

    return (
        <div className="relative flex min-h-screen flex-col bg-background font-sans">
            {/* TIMEOUT MODAL */}
            {showTimeoutModal && (
                <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/40 backdrop-blur-[2px] sm:items-center">
                    <div className="w-full max-w-[430px] rounded-t-[28px] bg-card p-6 sm:rounded-[28px]">
                        <span className="grid h-12 w-12 place-items-center rounded-full bg-sand text-navy">
                            <Clock size={20} />
                        </span>
                        <h2 className="mt-4 text-[22px] font-semibold tracking-[-0.02em] text-navy">No one free right now</h2>
                        <p className="mt-1.5 text-[14px] leading-relaxed text-muted-foreground">
                            We couldn't find an available {serviceLabel} near you. Try again, or book for a later time.
                        </p>
                        <div className="mt-6 grid grid-cols-2 gap-2">
                            <button
                                onClick={handleCancelRequest}
                                className="rounded-[14px] bg-sand py-3.5 text-[14px] font-medium text-ink active:scale-[0.98]"
                            >
                                Go back
                            </button>
                            <button
                                onClick={() => {
                                    sessionStorage.removeItem("search_start_time");
                                    localStorage.removeItem("search_start_time");
                                    setHasTimedOut(false);
                                    setShowTimeoutModal(false);
                                    const now = Date.now();
                                    sessionStorage.setItem("search_start_time", String(now));
                                    localStorage.setItem("search_start_time", String(now));
                                }}
                                className="rounded-[14px] bg-navy py-3.5 text-[14px] font-semibold text-paper active:scale-[0.98]"
                            >
                                Search again
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── MAP + RADAR ── */}
            <div className="relative overflow-hidden" style={{ height: hasQuotes ? "38vh" : "52vh", minHeight: 300, transition: "height .5s cubic-bezier(.22,1,.36,1)" }}>
                {mapUrl ? (
                    <img
                        src={mapUrl}
                        alt=""
                        className="absolute inset-0 h-full w-full object-cover"
                        style={{ filter: "sepia(.35) saturate(.7) contrast(1.02)" }}
                    />
                ) : (
                    <svg viewBox="0 0 380 340" className="absolute inset-0 h-full w-full" preserveAspectRatio="xMidYMid slice" aria-hidden>
                        <defs>
                            <pattern id="sp-blocks" width="54" height="54" patternUnits="userSpaceOnUse" x="-17" y="-24">
                                <rect x="7" y="7" width="40" height="40" rx="7" fill="#F6F3EE" />
                            </pattern>
                        </defs>
                        <rect width="380" height="340" fill="#E6DFD3" />
                        <rect width="380" height="340" fill="url(#sp-blocks)" />
                    </svg>
                )}
                {/* soft fade into the sheet */}
                <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-background to-transparent" />

                {/* radar, centred on the customer */}
                <div className="pointer-events-none absolute left-1/2 top-[46%] -translate-x-1/2 -translate-y-1/2">
                    <div className="relative h-[300px] w-[300px]">
                        <div className="absolute inset-0 rounded-full border border-brand-amber/40 bg-brand-amber/[0.03]" />
                        <div className="absolute inset-[22%] rounded-full border border-dashed border-brand-amber/30" />
                        {!hasQuotes && (
                            <>
                                <div className="sp-sweep absolute inset-0 rounded-full" />
                                {[0, 1, 2].map((i) => (
                                    <span key={i} className="sp-ring absolute inset-0 rounded-full border-2 border-brand-amber/50" style={{ animationDelay: `${i * 0.9}s` }} />
                                ))}
                            </>
                        )}
                        {/* nearby pros */}
                        {providerDots.map((dot, i) => (
                            <span
                                key={dot.id}
                                className="sp-pin absolute grid h-8 w-8 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-card text-[11px] font-semibold text-navy shadow-[0_6px_16px_-6px_rgba(14,27,44,0.5)] ring-2 ring-brand-amber"
                                style={{ left: `${dot.x}%`, top: `${dot.y}%`, animationDelay: `${i * 0.12}s` }}
                            >
                                {service ? <service.icon size={14} /> : "•"}
                            </span>
                        ))}
                        {/* you */}
                        <span className="absolute left-1/2 top-1/2 h-12 w-12 -translate-x-1/2 -translate-y-1/2 rounded-full bg-navy/15" />
                        <span className="absolute left-1/2 top-1/2 h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-navy ring-[3px] ring-white shadow-md" />
                    </div>
                </div>

                <button
                    onClick={handleCancelRequest}
                    aria-label="Back"
                    className="absolute left-4 top-4 z-20 grid h-11 w-11 place-items-center rounded-full bg-card text-ink ring-1 ring-line shadow-[0_8px_20px_-10px_rgba(14,27,44,0.4)] active:scale-95 transition"
                >
                    <ArrowLeft size={20} />
                </button>
                <div className="absolute right-4 top-4 z-20 flex items-center gap-2 rounded-full bg-card px-3.5 py-2 ring-1 ring-line shadow-[0_8px_20px_-10px_rgba(14,27,44,0.4)]">
                    <span className="relative flex h-2 w-2">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand-amber opacity-70" />
                        <span className="relative inline-flex h-2 w-2 rounded-full bg-brand-amber" />
                    </span>
                    <span className="text-[12px] font-medium tabular-nums text-ink">{hasQuotes ? "Quotes in" : `Searching · ${timeLabel}`}</span>
                </div>
            </div>

            {/* ── SHEET ── */}
            <div className="relative z-10 -mt-6 flex-1 px-3 pb-6">
                <div className="rounded-[28px] bg-card p-6 ring-1 ring-line shadow-[0_-12px_40px_-16px_rgba(14,27,44,0.3)]">
                    <p className="text-[13px] text-muted-foreground">
                        {hasQuotes ? "Pick the one that suits you" : foundCount > 0 ? `${foundCount} nearby · asking them now` : "Searching your neighbourhood"}
                    </p>
                    <h2 className="mt-0.5 text-[26px] font-semibold leading-[1.1] tracking-[-0.03em] text-navy">
                        {hasQuotes ? `Quotes for your ${serviceLabel}` : `Finding your ${serviceLabel}`}
                    </h2>

                    {/* progress */}
                    <div className="mt-5 h-[3px] overflow-hidden rounded-full bg-line">
                        <div className="h-full rounded-full bg-brand-amber transition-[width] duration-1000" style={{ width: hasQuotes ? "100%" : `${Math.max(8, elapsedPct)}%` }} />
                    </div>

                    {!hasQuotes && (
                        <ol className="mt-5 space-y-3.5">
                            {steps.map((s, i) => {
                                const done = i + 1 < stage;
                                const active = i + 1 === stage;
                                return (
                                    <li key={i} className="flex items-center gap-3">
                                        <span
                                            className={`grid h-7 w-7 flex-shrink-0 place-items-center rounded-full text-[12px] font-semibold ${
                                                done ? "bg-[#E8EFE4] text-[#2F5B2A]" : active ? "bg-orange-50 text-brand-deep ring-1 ring-orange-200" : "bg-sand text-slate-400"
                                            }`}
                                        >
                                            {done ? <Check size={14} strokeWidth={2.6} /> : active ? <span className="h-2 w-2 animate-pulse rounded-full bg-brand-amber" /> : i + 1}
                                        </span>
                                        <span className="min-w-0 flex-1">
                                            <span className={`block text-[14.5px] ${active || done ? "font-medium text-ink" : "text-slate-400"}`}>{s.label}</span>
                                            <span className="block text-[12px] text-muted-foreground">{s.sub}</span>
                                        </span>
                                    </li>
                                );
                            })}
                        </ol>
                    )}

                    {/* quotes */}
                    {hasQuotes && (
                        <div className="mt-5 space-y-2.5">
                            {receivedQuotes.map((q) => {
                                const on = selectedQuote?.providerId === q.providerId;
                                return (
                                    <div
                                        key={q.providerId}
                                        onClick={() => setSelectedQuote(q)}
                                        className={`cursor-pointer rounded-[20px] p-4 transition-all ${on ? "bg-card ring-2 ring-navy" : "bg-card ring-1 ring-line"}`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="grid h-11 w-11 flex-shrink-0 place-items-center overflow-hidden rounded-full bg-navy text-[15px] font-semibold text-paper">
                                                {q.providerAvatar && q.providerAvatar.length > 2 ? (
                                                    <img src={q.providerAvatar} alt={q.providerName} className="h-full w-full object-cover" />
                                                ) : (
                                                    (q.providerName || "P").charAt(0).toUpperCase()
                                                )}
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <p className="truncate text-[15px] font-semibold text-ink">{q.providerName}</p>
                                                <p className="flex items-center gap-1 text-[12.5px] text-muted-foreground">
                                                    {!q.rating ? (
                                                        <span>New on RoundU</span>
                                                    ) : (
                                                        <>
                                                            <Star size={11} className="fill-brand-amber text-brand-amber" /> {Number(q.rating).toFixed(1)}
                                                            {q.reviews ? <span>({q.reviews})</span> : null}
                                                        </>
                                                    )}
                                                    <span>· {q.distanceKm} km</span>
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-[20px] font-semibold tracking-tight text-ink tabular-nums">₹{q.price}</p>
                                                <p className="text-[12px] text-[#2F5B2A]">{q.etaMin} min away</p>
                                            </div>
                                        </div>
                                        {on && (
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleAcceptQuote(q);
                                                }}
                                                disabled={!!acceptingQuoteId}
                                                className="mt-4 w-full rounded-[14px] bg-navy py-3.5 text-[14.5px] font-semibold text-paper transition active:scale-[0.98] disabled:cursor-wait disabled:opacity-60"
                                            >
                                                {acceptingQuoteId === q.providerId ? "Confirming…" : `Book ${q.providerName.split(" ")[0]} · ₹${q.price}`}
                                            </button>
                                        )}
                                    </div>
                                );
                            })}
                            <p className="pt-1 text-center text-[12px] text-muted-foreground tabular-nums">More quotes may arrive · {timeLabel} left</p>
                        </div>
                    )}

                    {error && <p className="mt-4 rounded-[12px] bg-red-50 px-3 py-2.5 text-[13px] text-red-700">{error}</p>}
                </div>

                {/* request summary */}
                <div className="mt-3 rounded-[22px] bg-card px-4 ring-1 ring-line">
                    <div className="flex items-center gap-3 border-b border-line py-3.5">
                        <span className="grid h-9 w-9 place-items-center rounded-[12px] bg-sand text-navy">
                            {service ? <service.icon size={17} strokeWidth={1.8} /> : <Clock size={16} />}
                        </span>
                        <span className="flex-1 text-[14px] font-medium text-ink">{service?.label || "Service"}</span>
                        <span className="text-[12.5px] text-muted-foreground">{whenLabel}</span>
                    </div>
                    <div className="flex items-center gap-3 py-3.5">
                        <span className="grid h-9 w-9 place-items-center rounded-[12px] bg-sand text-navy">
                            <MapPin size={16} />
                        </span>
                        <span className="min-w-0 flex-1 truncate text-[13.5px] text-muted-foreground">{user?.address || "Your current location"}</span>
                    </div>
                </div>

                <button
                    onClick={handleCancelRequest}
                    className="mt-3 w-full rounded-[14px] py-3.5 text-[14px] font-medium text-muted-foreground active:scale-[0.98] transition"
                >
                    Cancel request
                </button>
            </div>
        </div>
    );
};

export default SearchingProviders;
