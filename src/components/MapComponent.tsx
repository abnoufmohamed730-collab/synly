import React, { useEffect, useState } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMap,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { Navigation } from "lucide-react";

// Fix default marker icons in Leaflet with Vite
const customIcon = new L.Icon({
  iconUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

// Blue pulsing marker icon for user's location (Google Maps style)
const bluePulseIcon = new L.Icon({
  iconUrl:
    "data:image/svg+xml;base64," +
    "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23007bff' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'>" +
    "<circle cx='12' cy='12' r='8' fill='%23007bff' fill-opacity='0.2' stroke='%23007bff' stroke-width='2'/>" +
    "<circle cx='12' cy='12' r='4' fill='%23007bff'/>" +
    "<circle cx='12' cy='12' r='1' fill='%23007bff' fill-opacity='0.6'/>" +
    "</svg>",
  iconSize: [24, 24],
  iconAnchor: [12, 12],
  popupAnchor: [0, -12],
});

interface MapComponentProps {
  center?: [number, number];
  zoom?: number;
  onLocate?: () => void;
  onMapDragStart?: () => void;
}

// Component to handle geolocation and recenter button
function LocationMarker({ onLocate }: { onLocate?: () => void }) {
  const [position, setPosition] = useState<[number, number] | null>(null);
  const map = useMap();

  const handleGetLocation = () => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (coords) => {
          const { latitude, longitude } = coords.coords;
          const newPos: [number, number] = [latitude, longitude];
          setPosition(newPos);
          map.flyTo(newPos, 16, { animate: true });
          onLocate?.();
        },
        (error) => {
          console.error("Error getting location: ", error);
          alert("تعذر الحصول على موقعك الحالي. تأكد من تفعيل الـ GPS في متصفحك.");
        },
        { enableHighAccuracy: true }
      );
    } else {
      alert("خاصية تحديد الموقع غير مدعومة في متصفحك.");
    }
  };

  // Get location automatically when page opens
  useEffect(() => {
    handleGetLocation();
  }, [map]);

  return (
    <div className="absolute bottom-24 right-4 z-[1000]">
      <button
        onClick={handleGetLocation}
        className="w-12 h-12 rounded-full bg-slate-900/80 backdrop-blur-md border border-white/10 text-blue-400 flex items-center justify-center shadow-lg hover:bg-slate-800 transition-all"
        title="موقعي الحالي"
      >
        <Navigation className="w-5 h-5" />
      </button>
    </div>
  );
}

// Component to handle map drag events (must be inside MapContainer)
function MapEvents({ onMapDragStart }: { onMapDragStart?: () => void }) {
  const map = useMap();

  useEffect(() => {
    const handleDragStart = () => {
      onMapDragStart?.();
    };

    map.on("dragstart", handleDragStart);

    return () => {
      map.off("dragstart", handleDragStart);
    };
  }, [map, onMapDragStart]);

  return null;
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
        <MapEvents onMapDragStart={onMapDragStart} />
        <LocationMarker onLocate={onLocate} />
        <Marker position={center} icon={bluePulseIcon}>
          <Popup>
            موقعك الحالي <br /> أنت هنا.
          </Popup>
        </Marker>
      </MapContainer>
    </div>
  );
}