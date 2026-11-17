import { useEffect } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  useMapEvents,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { MapPin } from "lucide-react";

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

interface LocationPickerProps {
  value: { lat: number; lng: number } | null;
  onChange: (coords: { lat: number; lng: number }) => void;
}

function ClickHandler({ onChange }: { onChange: (coords: { lat: number; lng: number }) => void }) {
  useMapEvents({
    click(e) {
      onChange({ lat: e.latlng.lat, lng: e.latlng.lng });
    },
  });
  return null;
}

export function LocationPicker({ value, onChange }: LocationPickerProps) {
  const center: [number, number] = value ? [value.lat, value.lng] : [30.0444, 31.2357];

  useEffect(() => {
    // Try to get user's current location as default
    if (!value && "geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (coords) => {
          onChange({ lat: coords.coords.latitude, lng: coords.coords.longitude });
        },
        () => {
          // Silently ignore geolocation errors
        }
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="relative rounded-xl overflow-hidden border border-white/10 h-56 w-full">
      <MapContainer
        center={center}
        zoom={13}
        scrollWheelZoom={false}
        style={{ width: "100%", height: "100%", background: "#090A0F" }}
      >
        <TileLayer
          attribution='© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <ClickHandler onChange={onChange} />
        {value && <Marker position={[value.lat, value.lng]} icon={customIcon} />}
      </MapContainer>

      <div className="absolute top-3 start-3 z-[1000] flex items-center gap-2 rounded-xl bg-slate-950/80 backdrop-blur-md border border-white/10 px-3 py-2 text-xs text-slate-300">
        <MapPin className="h-3.5 w-3.5 text-blue-400" />
        {value
          ? `${value.lat.toFixed(4)}, ${value.lng.toFixed(4)}`
          : "Click to pin location"}
      </div>
    </div>
  );
}
