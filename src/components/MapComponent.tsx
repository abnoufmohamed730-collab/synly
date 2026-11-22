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
import { Navigation, Radar, AlertCircle, Plus, Minus, X } from "lucide-react";
import { toast } from "sonner";
import { useLanguage } from "../context/language-context";
import { mapTileAttribution, mapTileUrl } from "../lib/map-config";
import type { NearbyCenter } from "../services/request-service";

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
  onUserLocation?: (position: { lat: number; lng: number }) => void;
  centers?: NearbyCenter[];
}

const createCenterIcon = () => L.divIcon({
  className: "synly-center-marker",
  html: '<div style="width:32px;height:32px;border-radius:12px;background:#f97316;border:2px solid #fff;box-shadow:0 4px 16px rgba(249,115,22,.55);display:grid;place-items:center;color:#fff;font-weight:800;font-size:15px">S</div>',
  iconSize: [32, 32],
  iconAnchor: [16, 16],
});

const createLiveDotIcon = (heading?: number): L.DivIcon =>
  L.divIcon({
    className: "synly-live-dot",
    html: `
      <div style="position:relative;width:24px;height:24px;${heading ? `transform:rotate(${heading}deg);transform-origin:center;` : ""}">
        <div class="absolute inset-0 rounded-full bg-blue-500/30 animate-ping"></div>
        <div style="position:absolute;inset:0;border-radius:9999px;background:#3b82f6;border:2px solid #ffffff;box-shadow:0 0 14px rgba(59,130,246,0.65);"></div>
      </div>
    `,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  });

// Permission notification card (side/corner glassmorphic)
function PermissionCard({
  state,
  onAllow,
  onDismiss,
  onRetry,
  t,
}: {
  state: "prompt" | "denied";
  onAllow: () => void;
  onDismiss: () => void;
  onRetry: () => void;
  t: (key: string) => string;
}) {
  const isPrompt = state === "prompt";
  const title = isPrompt ? t("map.permissionTitle") : t("map.permissionDeniedTitle");
  const desc = isPrompt ? t("map.permissionDesc") : t("map.permissionDeniedDesc");
  const primaryLabel = isPrompt ? t("map.permissionAllow") : t("map.permissionRetry");
  const secondaryLabel = isPrompt ? t("map.permissionDismiss") : "";

  return (
    <div
      className="absolute end-4 top-1/2 -translate-y-1/2 z-[1000] w-80 max-w-[90vw] glass-sheet rounded-2xl p-4 shadow-2xl border border-white/10 animate-slide-in-right"
      role="dialog"
      aria-live="polite"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-white">{title}</h3>
          <p className="mt-1.5 text-xs text-slate-300 leading-relaxed">{desc}</p>
        </div>
        <button
          onClick={onDismiss}
          className="flex-shrink-0 p-1 text-slate-400 hover:text-white transition-colors"
          aria-label={isPrompt ? t("map.permissionDismiss") : t("common.close")}
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      <div className="mt-4 flex items-center gap-2">
        <button
          onClick={isPrompt ? onAllow : onRetry}
          className="flex-1 glass-btn py-2 px-3 bg-blue-500/20 border-blue-500/40 text-blue-400 hover:bg-blue-500/30 text-sm font-medium"
        >
          {primaryLabel}
        </button>
        {isPrompt && (
          <button
            onClick={onDismiss}
            className="flex-1 glass-btn py-2 px-3 border-white/10 text-slate-300 hover:bg-white/10 text-sm font-medium"
          >
            {secondaryLabel}
          </button>
        )}
      </div>
    </div>
  );
}

// Component to handle geolocation, live follow, and recenter button
function LocationMarker({
  onLocate,
  onMapDragStart,
  onUserLocation,
}: {
  onLocate?: () => void;
  onMapDragStart?: () => void;
  onUserLocation?: (position: { lat: number; lng: number }) => void;
}) {
  const map = useMap();
  const { t } = useLanguage();
  const [position, setPosition] = useState<LivePosition | null>(null);
  const [status, setStatus] = useState<"idle" | "locating" | "active" | "error">("idle");
  const [liveFollow, setLiveFollow] = useState(false);
  const [permissionState, setPermissionState] = useState<"idle" | "granted" | "denied" | "dismissed">("idle");

  const liveFollowRef = useRef(false);
  const onLocateRef = useRef(onLocate);
  const onMapDragStartRef = useRef(onMapDragStart);
  const onUserLocationRef = useRef(onUserLocation);
  const watchIdRef = useRef<number | null>(null);

  useEffect(() => {
    onLocateRef.current = onLocate;
  }, [onLocate]);

  useEffect(() => {
    onMapDragStartRef.current = onMapDragStart;
  }, [onMapDragStart]);

  useEffect(() => {
    onUserLocationRef.current = onUserLocation;
  }, [onUserLocation]);

  useEffect(() => {
    liveFollowRef.current = liveFollow;
  }, [liveFollow]);

  // Start watchPosition when permission is granted
  useEffect(() => {
    if (permissionState !== "granted") return;
    if (!("geolocation" in navigator)) {
      setStatus("error");
      setPermissionState("denied");
      return;
    }
    setStatus("locating");
    const id = navigator.geolocation.watchPosition(
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
        setPermissionState("denied");
      },
      { enableHighAccuracy: true, maximumAge: 1000, timeout: 10000 }
    );
    watchIdRef.current = id;
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
    };
  }, [permissionState, map, t]);

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

  const handleAllow = () => {
    if (!("geolocation" in navigator)) {
      setPermissionState("denied");
      setStatus("error");
      toast.error(t("map.gpsDenied"));
      return;
    }
    setStatus("locating");
    navigator.geolocation.getCurrentPosition(
      (coords) => {
        const { latitude, longitude, accuracy, heading, speed } = coords.coords;
        const next: LivePosition = { lat: latitude, lng: longitude, accuracy, heading, speed };
        setPosition(next);
        setStatus("active");
        setPermissionState("granted");
        setLiveFollow(true);
        liveFollowRef.current = true;
        map.flyTo([latitude, longitude], map.getZoom(), { animate: true });
        onUserLocationRef.current?.({ lat: latitude, lng: longitude });
        onLocateRef.current?.();
      },
      (error) => {
        setPermissionState("denied");
        setStatus("error");
        toast.error(t("map.gpsDenied"));
      },
      { enableHighAccuracy: true, maximumAge: 1000, timeout: 10000 }
    );
  };

  const handleDismiss = () => {
    setPermissionState("dismissed");
  };

  const handleRetry = () => {
    setPermissionState("idle");
    setStatus("idle");
    handleAllow();
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

  // Show permission card when idle (prompt) or denied
  const showPermissionCard = permissionState === "idle" || permissionState === "denied";

  return (
    <>
      {/* Permission notification card (side/corner) */}
      {showPermissionCard && (
        <PermissionCard
          state={permissionState === "idle" ? "prompt" : "denied"}
          onAllow={handleAllow}
          onDismiss={handleDismiss}
          onRetry={handleRetry}
          t={t}
        />
      )}

      {/* Live location marker + accuracy circle */}
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

      {/* Map controls: zoom in/out, recenter, live follow, status */}
      <div className="absolute top-20 end-4 z-[1000] flex flex-col items-end gap-2">
        <div className="flex items-center gap-2">
          <button
            onClick={() => map.zoomOut()}
            className="glass-btn h-10 w-10 rounded-xl shadow-lg text-white hover:bg-white/10 transition-all interactive-scale"
            title={t("common.zoomOut")}
            aria-label={t("common.zoomOut")}
          >
            <Minus className="h-5 w-5" />
          </button>
          <button
            onClick={() => map.zoomIn()}
            className="glass-btn h-10 w-10 rounded-xl shadow-lg text-white hover:bg-white/10 transition-all interactive-scale"
            title={t("common.zoomIn")}
            aria-label={t("common.zoomIn")}
          >
            <Plus className="h-5 w-5" />
          </button>
          <button
            onClick={() => position && map.flyTo([position.lat, position.lng], map.getZoom(), { animate: true })}
            className="glass-btn h-10 w-10 rounded-xl shadow-lg text-blue-400 hover:bg-blue-500/10 transition-all interactive-scale"
            title={t("map.myLocation")}
            aria-label={t("map.myLocation")}
          >
            <Navigation className="h-5 w-5" />
          </button>
        </div>

        <button
          type="button"
          onClick={toggleLiveFollow}
          disabled={permissionState !== "granted"}
          className={`w-10 h-10 rounded-xl backdrop-blur-md border flex items-center justify-center shadow-lg transition-all interactive-scale ${
            liveFollow
              ? "bg-blue-500/20 border-blue-500/40 text-blue-400"
              : permissionState === "granted"
                ? "bg-slate-900/80 border-white/10 text-slate-400 hover:bg-slate-800"
                : "bg-slate-900/50 border-white/5 text-slate-500 cursor-not-allowed"
          }`}
          title={liveFollow ? t("map.liveFollowStop") : t("map.liveFollow")}
          aria-label={liveFollow ? t("map.liveFollowStop") : t("map.liveFollow")}
        >
          <Radar className="h-5 w-5" />
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
  center = [0, 0],
  zoom = 3,
  onLocate,
  onMapDragStart,
  onUserLocation,
  centers = [],
  }: MapComponentProps) {
    const { t } = useLanguage();
    return (
    <div className="w-full h-full relative z-0">
      <MapContainer
        center={center}
        zoom={zoom}
        scrollWheelZoom={true}
        doubleClickZoom={true}
        touchZoom={true}
        style={{ width: "100%", height: "100%", background: "#090A0F" }}
        zoomControl={false}
      >
        <TileLayer attribution={mapTileAttribution} url={mapTileUrl} />
        <LocationMarker onLocate={onLocate} onMapDragStart={onMapDragStart} onUserLocation={onUserLocation} />
        {centers.map((serviceCenter) => (
          <Marker
            key={serviceCenter.id}
            position={[serviceCenter.latitude, serviceCenter.longitude]}
            icon={createCenterIcon()}
          >
            <Popup>
              <div className="min-w-36">
                <strong>{serviceCenter.name}</strong>
                <p>{serviceCenter.service_type}</p>
                <p>
                                  {t("map.centerPopupStatus", {
                                    distance: serviceCenter.distance_km.toFixed(1),
                                    unit: t("common.km"),
                                    status: serviceCenter.open_now ? t("common.openNow") : t("common.closed"),
                                  })}
                                </p>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
