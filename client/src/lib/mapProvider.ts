/**
 * mapProvider.ts
 * ──────────────────────────────────────────────────────────────
 * Dual-provider map utility for RoundU.
 *
 * Strategy:
 *   1. Try Google Maps first (PRIMARY).
 *   2. If the Google Maps API key is missing, quota-exceeded, or any
 *      other network/auth error occurs → automatically fall over to
 *      Mapbox (FALLBACK).
 *   3. Subsequent calls reuse whichever provider is currently active,
 *      so there's no per-call overhead once resolved.
 *
 * Usage:
 *   import { loadMap, geocode, getDirections } from "@/lib/mapProvider";
 *
 *   // Mount a map into a div
 *   const map = await loadMap(containerRef.current, { lat: 13.08, lng: 80.27 });
 *
 *   // Geocode an address
 *   const { lat, lng } = await geocode("Chennai, Tamil Nadu");
 *
 *   // Get a route (returns GeoJSON LineString)
 *   const route = await getDirections(origin, destination);
 */

// ──────────────────────────────────────────────────────────────
// 1. Config — populate via environment variables
// ──────────────────────────────────────────────────────────────

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY ?? "";
const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN ?? "";

// ──────────────────────────────────────────────────────────────
// 2. Types
// ──────────────────────────────────────────────────────────────

export type Provider = "google" | "mapbox";

export interface LatLng {
  lat: number;
  lng: number;
}

export interface MapInstance {
  /** Underlying native map object (google.maps.Map | mapboxgl.Map) */
  native: unknown;
  provider: Provider;
  /** Pan + zoom the map to a new center */
  setCenter(center: LatLng, zoom?: number): void;
  /** Add a marker and return a remove() fn */
  addMarker(options: MarkerOptions): () => void;
  /** Draw a polyline route */
  drawRoute(coordinates: LatLng[], color?: string): () => void;
  /** Destroy the map and clean up DOM */
  destroy(): void;
}

export interface MarkerOptions {
  position: LatLng;
  label?: string;
  /** "customer" | "provider" | "pin" — controls icon color */
  type?: "customer" | "provider" | "pin";
  popup?: string;
}

export interface RouteResult {
  coordinates: LatLng[];
  /** Distance in metres */
  distanceMetres: number;
  /** Duration in seconds */
  durationSeconds: number;
}

// ──────────────────────────────────────────────────────────────
// 3. Provider state (module-level singleton)
// ──────────────────────────────────────────────────────────────

let activeProvider: Provider | null = null;

/** Returns the currently active provider, or null if not yet resolved. */
export function getActiveProvider(): Provider | null {
  return activeProvider;
}

// ──────────────────────────────────────────────────────────────
// 4. Script / SDK loaders
// ──────────────────────────────────────────────────────────────

let googleLoadPromise: Promise<void> | null = null;
let mapboxLoadPromise: Promise<void> | null = null;

function loadGoogleMapsSDK(): Promise<void> {
  if (googleLoadPromise) return googleLoadPromise;

  googleLoadPromise = new Promise((resolve, reject) => {
    if (!GOOGLE_MAPS_API_KEY) {
      reject(new Error("Google Maps API key is not configured (VITE_GOOGLE_MAPS_API_KEY)"));
      return;
    }

    // If already loaded
    if (typeof google !== "undefined" && google.maps) {
      resolve();
      return;
    }

    const callbackName = "__roundu_gmaps_cb__";
    (window as any)[callbackName] = () => {
      resolve();
      delete (window as any)[callbackName];
    };

    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&callback=${callbackName}&libraries=places`;
    script.async = true;
    script.defer = true;
    script.onerror = () =>
      reject(new Error("Failed to load Google Maps SDK — network error or invalid key"));
    document.head.appendChild(script);

    // Timeout guard (8 s)
    setTimeout(() => reject(new Error("Google Maps SDK load timeout")), 8000);
  });

  return googleLoadPromise;
}

function loadMapboxSDK(): Promise<void> {
  if (mapboxLoadPromise) return mapboxLoadPromise;

  mapboxLoadPromise = new Promise((resolve, reject) => {
    if (!MAPBOX_TOKEN) {
      reject(new Error("Mapbox token is not configured (VITE_MAPBOX_TOKEN)"));
      return;
    }

    if ((window as any).mapboxgl) {
      resolve();
      return;
    }

    // Load CSS
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "https://api.mapbox.com/mapbox-gl-js/v3.4.0/mapbox-gl.css";
    document.head.appendChild(link);

    // Load JS
    const script = document.createElement("script");
    script.src = "https://api.mapbox.com/mapbox-gl-js/v3.4.0/mapbox-gl.js";
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load Mapbox GL JS"));
    document.head.appendChild(script);

    setTimeout(() => reject(new Error("Mapbox SDK load timeout")), 8000);
  });

  return mapboxLoadPromise;
}

// ──────────────────────────────────────────────────────────────
// 5. Google Maps MapInstance adapter
// ──────────────────────────────────────────────────────────────

function createGoogleMapInstance(
  map: google.maps.Map,
  overlays: Array<google.maps.Marker | google.maps.Polyline>
): MapInstance {
  return {
    native: map,
    provider: "google",

    setCenter({ lat, lng }, zoom = 15) {
      map.setCenter({ lat, lng });
      map.setZoom(zoom);
    },

    addMarker({ position, label, type = "pin", popup }) {
      const colors: Record<string, string> = {
        customer: "0EA5E9",
        provider: "10B981",
        pin: "6366F1",
      };
      const color = colors[type];

      const marker = new google.maps.Marker({
        position,
        map,
        label: label ? { text: label, color: "#fff", fontWeight: "bold" } : undefined,
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 10,
          fillColor: `#${color}`,
          fillOpacity: 1,
          strokeColor: "#ffffff",
          strokeWeight: 2,
        },
      });

      if (popup) {
        const infoWindow = new google.maps.InfoWindow({ content: popup });
        marker.addListener("click", () => infoWindow.open(map, marker));
      }

      overlays.push(marker);
      return () => {
        marker.setMap(null);
        const idx = overlays.indexOf(marker);
        if (idx !== -1) overlays.splice(idx, 1);
      };
    },

    drawRoute(coordinates, color = "#6366F1") {
      const polyline = new google.maps.Polyline({
        path: coordinates,
        geodesic: true,
        strokeColor: color,
        strokeOpacity: 0.9,
        strokeWeight: 4,
        map,
      });
      overlays.push(polyline);
      return () => {
        polyline.setMap(null);
        const idx = overlays.indexOf(polyline);
        if (idx !== -1) overlays.splice(idx, 1);
      };
    },

    destroy() {
      overlays.forEach((o) => {
        if (o instanceof google.maps.Marker) o.setMap(null);
        if (o instanceof google.maps.Polyline) o.setMap(null);
      });
      overlays.length = 0;
    },
  };
}

// ──────────────────────────────────────────────────────────────
// 6. Mapbox MapInstance adapter
// ──────────────────────────────────────────────────────────────

function createMapboxMapInstance(map: any, markersRef: any[]): MapInstance {
  const mapboxgl = (window as any).mapboxgl;

  return {
    native: map,
    provider: "mapbox",

    setCenter({ lat, lng }, zoom = 15) {
      map.flyTo({ center: [lng, lat], zoom });
    },

    addMarker({ position, label, type = "pin", popup }) {
      const colors: Record<string, string> = {
        customer: "#0EA5E9",
        provider: "#10B981",
        pin: "#6366F1",
      };

      const el = document.createElement("div");
      el.style.cssText = `
        width: 28px; height: 28px; border-radius: 50%;
        background: ${colors[type]}; border: 2px solid #fff;
        box-shadow: 0 2px 6px rgba(0,0,0,0.3);
        display: flex; align-items: center; justify-content: center;
        color: #fff; font-size: 11px; font-weight: bold;
        cursor: pointer;
      `;
      if (label) el.textContent = label;

      const marker = new mapboxgl.Marker({ element: el })
        .setLngLat([position.lng, position.lat])
        .addTo(map);

      if (popup) {
        const p = new mapboxgl.Popup({ offset: 25 }).setText(popup);
        marker.setPopup(p);
        el.addEventListener("click", () => p.addTo(map));
      }

      markersRef.push(marker);
      return () => {
        marker.remove();
        const idx = markersRef.indexOf(marker);
        if (idx !== -1) markersRef.splice(idx, 1);
      };
    },

    drawRoute(coordinates, color = "#6366F1") {
      const id = `route-${Date.now()}`;
      map.addSource(id, {
        type: "geojson",
        data: {
          type: "Feature",
          geometry: {
            type: "LineString",
            coordinates: coordinates.map((c) => [c.lng, c.lat]),
          },
        },
      });
      map.addLayer({
        id,
        type: "line",
        source: id,
        layout: { "line-join": "round", "line-cap": "round" },
        paint: { "line-color": color, "line-width": 4, "line-opacity": 0.9 },
      });
      return () => {
        if (map.getLayer(id)) map.removeLayer(id);
        if (map.getSource(id)) map.removeSource(id);
      };
    },

    destroy() {
      markersRef.forEach((m) => m.remove());
      markersRef.length = 0;
      map.remove();
    },
  };
}

// ──────────────────────────────────────────────────────────────
// 7. loadMap — public API
// ──────────────────────────────────────────────────────────────

/**
 * Mount an interactive map in `container`.
 * Tries Google Maps first; falls back to Mapbox on any failure.
 */
export async function loadMap(
  container: HTMLElement,
  center: LatLng,
  zoom = 14
): Promise<MapInstance> {
  // If we've already resolved a provider, go straight to it
  if (activeProvider === "google") return _loadGoogleMap(container, center, zoom);
  if (activeProvider === "mapbox") return _loadMapboxMap(container, center, zoom);

  // First call — try Google
  try {
    const instance = await _loadGoogleMap(container, center, zoom);
    activeProvider = "google";
    console.info("[MapProvider] Using Google Maps");
    return instance;
  } catch (googleErr) {
    console.warn("[MapProvider] Google Maps failed, falling back to Mapbox:", googleErr);
    try {
      const instance = await _loadMapboxMap(container, center, zoom);
      activeProvider = "mapbox";
      console.info("[MapProvider] Using Mapbox");
      return instance;
    } catch (mapboxErr) {
      throw new AggregateError(
        [googleErr, mapboxErr],
        "Both map providers failed. Check your API keys."
      );
    }
  }
}

async function _loadGoogleMap(
  container: HTMLElement,
  center: LatLng,
  zoom: number
): Promise<MapInstance> {
  await loadGoogleMapsSDK();

  // Validate key by attempting a real map render — quota errors surface here
  return new Promise((resolve, reject) => {
    try {
      const overlays: Array<google.maps.Marker | google.maps.Polyline> = [];
      const map = new google.maps.Map(container, {
        center,
        zoom,
        disableDefaultUI: true,
        zoomControl: true,
        styles: GOOGLE_MAP_STYLES,
      });

      // Google doesn't throw on quota exceeded immediately; listen for the error event
      google.maps.event.addListenerOnce(map, "tilesloaded", () =>
        resolve(createGoogleMapInstance(map, overlays))
      );

      // Detect auth failures emitted on window
      const authFailHandler = () => reject(new Error("Google Maps: AuthFailure (quota or key issue)"));
      (window as any).gm_authFailure = authFailHandler;

      // Resolve after a short delay if no failure
      setTimeout(() => resolve(createGoogleMapInstance(map, overlays)), 3000);
    } catch (e) {
      reject(e);
    }
  });
}

async function _loadMapboxMap(
  container: HTMLElement,
  center: LatLng,
  zoom: number
): Promise<MapInstance> {
  await loadMapboxSDK();
  const mapboxgl = (window as any).mapboxgl;
  mapboxgl.accessToken = MAPBOX_TOKEN;

  return new Promise((resolve, reject) => {
    try {
      const markers: any[] = [];
      const map = new mapboxgl.Map({
        container,
        style: "mapbox://styles/mapbox/streets-v12",
        center: [center.lng, center.lat],
        zoom,
        attributionControl: false,
      });

      map.on("load", () => resolve(createMapboxMapInstance(map, markers)));
      map.on("error", (e: any) => reject(new Error(`Mapbox error: ${e.error?.message ?? e}`)));
    } catch (e) {
      reject(e);
    }
  });
}

// ──────────────────────────────────────────────────────────────
// 8. Geocoding
// ──────────────────────────────────────────────────────────────

/**
 * Geocode an address string to lat/lng.
 * Uses whichever provider is active (Google first, then Mapbox).
 */
export async function geocode(address: string): Promise<LatLng> {
  // Ensure a provider has been resolved
  if (!activeProvider) await _resolveProvider();

  if (activeProvider === "google") {
    await loadGoogleMapsSDK();
    return new Promise((resolve, reject) => {
      const geocoder = new google.maps.Geocoder();
      geocoder.geocode({ address }, (results, status) => {
        if (status === "OK" && results?.[0]) {
          const loc = results[0].geometry.location;
          resolve({ lat: loc.lat(), lng: loc.lng() });
        } else {
          reject(new Error(`Google geocoding failed: ${status}`));
        }
      });
    });
  }

  // Mapbox geocoding REST API
  const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(address)}.json?access_token=${MAPBOX_TOKEN}&limit=1`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Mapbox geocoding HTTP ${res.status}`);
  const data = await res.json();
  const [lng, lat] = data.features?.[0]?.center ?? [];
  if (lat == null) throw new Error("Mapbox geocoding: no results");
  return { lat, lng };
}

// ──────────────────────────────────────────────────────────────
// 9. Directions / Routing
// ──────────────────────────────────────────────────────────────

/**
 * Get driving directions between two points.
 * Returns a list of LatLng coordinates suitable for drawRoute().
 */
export async function getDirections(
  origin: LatLng,
  destination: LatLng
): Promise<RouteResult> {
  if (!activeProvider) await _resolveProvider();

  if (activeProvider === "google") {
    await loadGoogleMapsSDK();
    return new Promise((resolve, reject) => {
      const svc = new google.maps.DirectionsService();
      svc.route(
        {
          origin,
          destination,
          travelMode: google.maps.TravelMode.DRIVING,
        },
        (result, status) => {
          if (status === "OK" && result) {
            const leg = result.routes[0].legs[0];
            const path = result.routes[0].overview_path.map((p) => ({
              lat: p.lat(),
              lng: p.lng(),
            }));
            resolve({
              coordinates: path,
              distanceMetres: leg.distance?.value ?? 0,
              durationSeconds: leg.duration?.value ?? 0,
            });
          } else {
            reject(new Error(`Google Directions failed: ${status}`));
          }
        }
      );
    });
  }

  // Mapbox Directions API
  const url =
    `https://api.mapbox.com/directions/v5/mapbox/driving/` +
    `${origin.lng},${origin.lat};${destination.lng},${destination.lat}` +
    `?access_token=${MAPBOX_TOKEN}&geometries=geojson&overview=full`;

  const res = await fetch(url);
  if (!res.ok) throw new Error(`Mapbox Directions HTTP ${res.status}`);
  const data = await res.json();
  const route = data.routes?.[0];
  if (!route) throw new Error("Mapbox Directions: no routes returned");

  const coordinates: LatLng[] = route.geometry.coordinates.map(
    ([lng, lat]: [number, number]) => ({ lat, lng })
  );

  return {
    coordinates,
    distanceMetres: route.distance,
    durationSeconds: route.duration,
  };
}

// ──────────────────────────────────────────────────────────────
// 10. Helpers
// ──────────────────────────────────────────────────────────────

/** Internal helper: resolve provider without mounting a visible map */
async function _resolveProvider(): Promise<void> {
  if (activeProvider) return;
  try {
    await loadGoogleMapsSDK();
    activeProvider = "google";
  } catch {
    await loadMapboxSDK();
    activeProvider = "mapbox";
  }
}

/** Manually force a specific provider (useful for testing) */
export function forceProvider(provider: Provider): void {
  activeProvider = provider;
  googleLoadPromise = null;
  mapboxLoadPromise = null;
}

/** Reset provider state (useful in tests) */
export function resetProvider(): void {
  activeProvider = null;
  googleLoadPromise = null;
  mapboxLoadPromise = null;
}

// ──────────────────────────────────────────────────────────────
// 11. Google Maps custom style (dark/neutral)
// ──────────────────────────────────────────────────────────────

const GOOGLE_MAP_STYLES: google.maps.MapTypeStyle[] = [
  { elementType: "geometry", stylers: [{ color: "#f5f5f5" }] },
  { elementType: "labels.icon", stylers: [{ visibility: "off" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#616161" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#f5f5f5" }] },
  { featureType: "road", elementType: "geometry", stylers: [{ color: "#ffffff" }] },
  { featureType: "road.arterial", elementType: "labels.text.fill", stylers: [{ color: "#757575" }] },
  { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#dadada" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#c9c9c9" }] },
  { featureType: "water", elementType: "labels.text.fill", stylers: [{ color: "#9e9e9e" }] },
  { featureType: "poi", stylers: [{ visibility: "off" }] },
  { featureType: "transit", stylers: [{ visibility: "off" }] },
];
