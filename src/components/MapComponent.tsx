import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Circle,
  Popup,
  useMap,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { Navigation, Radar, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { useLanguage } from "../context/language-context";

interface LivePosition {
  lat: number;
  lng: number;
  accuracy: number;
  heading?: number;
  speed?: number;
}

interface MapComponentProps {
  center?: [number, number];
  zoom?: number;
  onLocate?: () => void;
  onMapDragStart?: () => void;
}

const createLiveDotIcon = (heading?: number): L.DivIcon =>
  L.divIcon({
    className: "synly-live-dot",
    html: `
      <div style="position:relative;width:24px;height:24px;${
        heading ? `transform:rotate(${heading}deg);transform-origin:center;` : ""
      }">
        <div class="absolute inset-0 rounded-full bg-blue-500/30 animate-ping"></div>
        <div style="position:absolute;inset:0;border-radius:9999px;background:#3b82f6;border:2px solid #ffffff;box-shadow:0 0 14px rgba(59,130,246,0.65);"></div>
      </div>
    `,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  });

// Component to handle geolocation, live follow, and recenter button
function LocationMarker({
  onLocate,
  onMapDragStart,
}: {
  onLocate?: () => void;
  onMapDragStart?: () => void;
}) {
  const map = useMap();
  const { t } = useLanguage();
  const [position, setPosition] = useState<LivePosition | null>(null);
  const [status, setStatus] = useState<"idle" | "locating" | "active" | "error">("idle");
  const [liveFollow, setLiveFollow] = useState(false);
  const liveFollowRef = useRef(false);
  const onLocateRef = useRef(onLocate);
  const onMapDragStartRef = useRef(onMapDragStart);

  useEffect(() => {
    onLocateRef.current = onLocate;
  }, [onLocate]);

  useEffect(() => {
    onMapDragStartRef.current = onMapDragStart;
  }, [onMapDragStart]);

  useEffect(() => {
    liveFollowRef.current = liveFollow;
  }, [liveFollow]);

  // Real-time street-level movement tracking via watchPosition
  useEffect(() => {
    if (!("geolocation" in navigator)) {
      setStatus("error");
      toast.error(t("map.gpsDenied"));
      return;
    }
    setStatus("locating");
    const watchId = navigator.geolocation.watchPosition(
      (coords) => {
        const { latitude, longitude, accuracy, heading, speed } = coords.coords;
        const next: LivePosition = { lat: latitude, lng: longitude, accuracy, heading, speed };
        setPosition(next);
        setStatus("active");
        if (liveFollowRef.current) {
          map.flyTo([latitude, longitude], map.getZoom(), { animate: true });
        }
      },
      (error) => {
        setStatus("error");
        toast.error(t("map.gpsDenied"));
      },
      { enableHighAccuracy: true, maximumAge: 1000, timeout: 10000 }
    );
    return () => navigator.geolocation.clearWatch(watchId);
  }, [map, t]);

  // Pause live follow when the user manually drags the map
  useEffect(() => {
    const handleDragStart = () => {
      setLiveFollow(false);
      liveFollowRef.current = false;
      onMapDragStartRef.current?.();
    };
    map.on("dragstart", handleDragStart);
    return () => {
      map.off("dragstart", handleDragStart);
    };
  }, [map]);

  const handleGetLocation = () => {
    if (!("geolocation" in navigator)) {
      setStatus("error");
      toast.error(t("map.gpsDenied"));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (coords) => {
        const { latitude, longitude, accuracy, heading, speed } = coords.coords;
        const next: LivePosition = { lat: latitude, lng: longitude, accuracy, heading, speed };
        setPosition(next);
        setStatus("active");
        map.flyTo([latitude, longitude], map.getZoom(), { animate: true });
        onLocateRef.current?.();
      },
      (error) => {
        setStatus("error");
        toast.error(t("map.gpsDenied"));
      },
      { enableHighAccuracy: true, maximumAge: 1000, timeout: 10000 }
    );
  };

  const toggleLiveFollow = () => {
    const next = !liveFollow;
    setLiveFollow(next);
    liveFollowRef.current = next;
    if (next && position) {
      map.flyTo([position.lat, position.lng], map.getZoom(), { animate: true });
    }
  };

  const icon = useMemo(() => createLiveDotIcon(position?.heading), [position?.heading]);

  const statusContent =
    status === "error"
      ? t("map.gpsDenied")
      : status === "locating"
        ? t("map.locating")
        : status === "active"
          ? liveFollow
            ? t("map.trackingActive")
            : t("map.trackingPaused")
          : null;

  return (
    <>
      {position && (
        <Marker position={[position.lat, position.lng]} icon={icon}>
          <Popup>{t("map.myLocation")}</Popup>
        </Marker>
      )}

      {position && (
        <Circle
          center={[position.lat, position.lng]}
          radius={position.accuracy}
          pathOptions={{ color: "#3b82f6", fillColor: "#3b82f6", fillOpacity: 0.12 }}
        />
      )}

      <div className="absolute bottom-24 right-4 z-[1000] flex flex-col items-end gap-2">
        <button
          onClick={handleGetLocation}
          className="w-12 h-12 rounded-full bg-slate-900/80 backdrop-blur-md border border-white/10 text-blue-400 flex items-center justify-center shadow-lg hover:bg-slate-800 transition-all"
          title="موقعي الحالي"
        >
          <Navigation className="w-5 h-5" />
        </button>

        <button
          type="button"
          onClick={toggleLiveFollow}
          className={`w-12 h-12 rounded-full backdrop-blur-md border flex items-center justify-center shadow-lg transition-all interactive-scale ${
            liveFollow
              ? "bg-blue-500/20 border-blue-500/40 text-blue-400"
              : "bg-slate-900/80 border-white/10 text-slate-400 hover:bg-slate-800"
          }`}
          title={liveFollow ? t("map.liveFollowStop") : t("map.liveFollow")}
          aria-label={liveFollow ? t("map.liveFollowStop") : t("map.liveFollow")}
        >
          <Radar className="w-5 h-5" />
        </button>

        {statusContent && (
          <div
            className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold backdrop-blur-xl ${
              status === "error"
                ? "bg-red-500/10 border-red-500/30 text-red-400"
                : status === "locating"
                  ? "bg-slate-900/80 border-white/10 text-slate-300"
                  : liveFollow
                    ? "bg-blue-500/10 border-blue-500/30 text-blue-400"
                    : "bg-slate-900/80 border-white/10 text-slate-300"
            }`}
          >
            {status === "error" ? (
              <AlertCircle className="h-3 w-3" />
            ) : (
              <Radar className="h-3 w-3" />
            )}
            <span>{statusContent}</span>
          </div>
        )}
      </div>
    </>
  );
}

export function MapComponent({
  center = [30.0444, 31.2357],
  zoom = 15,
  onLocate,
  onMapDragStart,
}: MapComponentProps) {
  return (
    <div className="w-full h-full relative z-0">
      <MapContainer
        center={center}
        zoom={zoom}
        scrollWheelZoom={false}
        style={{ width: "100%", height: "100%", background: "#090A0F" }}
        zoomControl={false}
      >
        {/* Free OpenStreetMap tiles - no API key required */}
        <TileLayer
          attribution='© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <LocationMarker onLocate={onLocate} onMapDragStart={onMapDragStart} />
      </MapContainer>
    </div>
  );
}
