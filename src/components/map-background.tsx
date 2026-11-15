import { Wrench, AlertTriangle, Navigation } from "lucide-react";
import { cn } from "../lib/utils";

interface MapPin {
  id: string;
  x: number; // percentage
  y: number; // percentage
  type: "center" | "emergency";
  label: string;
}

const pins: MapPin[] = [
  { id: "p1", x: 22, y: 30, type: "center", label: "AutoCare Pro" },
  { id: "p2", x: 68, y: 22, type: "center", label: "Speedy Tires" },
  { id: "p3", x: 45, y: 55, type: "emergency", label: "Breakdown" },
  { id: "p4", x: 80, y: 62, type: "center", label: "ElectroAuto" },
  { id: "p5", x: 30, y: 72, type: "center", label: "PartsHub" },
  { id: "p6", x: 58, y: 38, type: "emergency", label: "Flat Tire" },
];

export function MapBackground({
  selectedPin,
  onSelectPin,
}: {
  selectedPin: string | null;
  onSelectPin: (id: string) => void;
}) {
  return (
    <div className="absolute inset-0 overflow-hidden bg-[#0A0E1A]">
      {/* Base map SVG */}
      <svg
        className="absolute inset-0 h-full w-full"
        viewBox="0 0 800 600"
        preserveAspectRatio="xMidYMid slice"
      >
        <defs>
          <pattern id="mapGrid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(148,163,184,0.06)" strokeWidth="1" />
          </pattern>
          <radialGradient id="mapGlow" cx="50%" cy="45%" r="55%">
            <stop offset="0%" stopColor="#1E3A5F" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#0A0E1A" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="riverGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#0D1B2E" />
            <stop offset="50%" stopColor="#10233D" />
            <stop offset="100%" stopColor="#0D1B2E" />
          </linearGradient>
        </defs>

        <rect width="800" height="600" fill="#0A0E1A" />
        <rect width="800" height="600" fill="url(#mapGrid)" />
        <rect width="800" height="600" fill="url(#mapGlow)" />

        {/* River */}
        <path
          d="M -50 460 C 120 420, 220 520, 400 470 S 680 380, 850 430 L 850 650 L -50 650 Z"
          fill="url(#riverGrad)"
          opacity="0.8"
        />

        {/* Main roads */}
        <path d="M -20 300 C 180 280, 380 330, 820 285" stroke="#1E293B" strokeWidth="14" fill="none" strokeLinecap="round" />
        <path d="M -20 300 C 180 280, 380 330, 820 285" stroke="#334155" strokeWidth="2" fill="none" strokeDasharray="12 10" />
        <path d="M 400 -20 C 380 140, 420 340, 395 620" stroke="#1E293B" strokeWidth="12" fill="none" strokeLinecap="round" />
        <path d="M 400 -20 C 380 140, 420 340, 395 620" stroke="#334155" strokeWidth="2" fill="none" strokeDasharray="12 10" />

        {/* Secondary roads */}
        <path d="M 100 -20 C 120 150, 80 350, 130 620" stroke="#182234" strokeWidth="6" fill="none" />
        <path d="M 620 -20 C 600 180, 650 380, 610 620" stroke="#182234" strokeWidth="6" fill="none" />
        <path d="M -20 120 C 200 140, 500 100, 820 130" stroke="#182234" strokeWidth="5" fill="none" />
        <path d="M -20 520 C 250 500, 550 540, 820 510" stroke="#182234" strokeWidth="5" fill="none" />
        <path d="M 250 -20 C 260 200, 240 400, 270 620" stroke="#182234" strokeWidth="4" fill="none" />
        <path d="M -20 200 C 300 210, 600 180, 820 200" stroke="#182234" strokeWidth="4" fill="none" />

        {/* Blocks / districts */}
        <rect x="150" y="160" width="90" height="70" rx="6" fill="#111827" opacity="0.6" />
        <rect x="480" y="150" width="110" height="80" rx="6" fill="#111827" opacity="0.6" />
        <rect x="160" y="380" width="100" height="60" rx="6" fill="#111827" opacity="0.6" />
        <rect x="500" y="400" width="90" height="70" rx="6" fill="#111827" opacity="0.6" />
        <rect x="330" y="240" width="70" height="50" rx="6" fill="#111827" opacity="0.5" />
      </svg>

      {/* Pins */}
      {pins.map((pin) => (
        <button
          key={pin.id}
          onClick={() => onSelectPin(pin.id)}
          className="absolute -translate-x-1/2 -translate-y-1/2 z-10 group"
          style={{ left: `${pin.x}%`, top: `${pin.y}%` }}
        >
          <div
            className={cn(
              "flex h-10 w-10 items-center justify-center rounded-full border backdrop-blur-xl transition-transform group-hover:scale-110",
              pin.type === "center"
                ? "bg-blue-500/20 border-blue-400/40 text-blue-300 shadow-lg shadow-blue-500/20"
                : "bg-orange-500/20 border-orange-400/40 text-orange-300 shadow-lg shadow-orange-500/20 pin-pulse-orange"
            )}
          >
            {pin.type === "center" ? <Wrench className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
          </div>
          {selectedPin === pin.id && (
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-40 rounded-xl border border-white/10 bg-slate-950/80 backdrop-blur-xl p-3 shadow-2xl">
              <p className="text-xs font-semibold text-white truncate">{pin.label}</p>
              <p className="text-[10px] text-slate-400">
                {pin.type === "center" ? "Service Center" : "Emergency"}
              </p>
            </div>
          )}
        </button>
      ))}

      {/* User location */}
      <div className="absolute z-10" style={{ left: "50%", top: "48%" }}>
        <div className="relative -translate-x-1/2 -translate-y-1/2">
          <div className="absolute inset-0 rounded-full bg-blue-500/30 animate-ping" />
          <div className="relative flex h-5 w-5 items-center justify-center rounded-full bg-blue-500 border-2 border-white shadow-lg shadow-blue-500/50">
            <Navigation className="h-3 w-3 text-white" />
          </div>
        </div>
      </div>

      {/* Vignette */}
      <div className="absolute inset-0 bg-gradient-to-b from-slate-950/60 via-transparent to-slate-950/80 pointer-events-none" />
    </div>
  );
}
