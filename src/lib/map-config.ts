// Map tile + directions configuration.
//
// Tile providers are configured through environment variables so a deployment can point at a
// licensed/self-hosted provider instead of sending commercial traffic to the public
// OpenStreetMap tile servers. The public servers remain a development-only fallback.
const publicOsmTiles = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";
const publicOsmAttribution = '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

export const mapTileUrl = import.meta.env.VITE_MAP_TILE_URL || publicOsmTiles;
export const mapTileAttribution = import.meta.env.VITE_MAP_TILE_ATTRIBUTION || publicOsmAttribution;

// Without VITE_MAP_TILE_URL the public OSM servers are used as a development fallback.

const directionsBase = import.meta.env.VITE_MAP_DIRECTIONS_URL || "https://www.openstreetmap.org/directions";
const mapViewBase = import.meta.env.VITE_MAP_VIEW_URL || "https://www.openstreetmap.org/";

export function directionsUrl(from: { lat: number; lng: number }, to: { lat: number; lng: number }): string {
  const query = new URLSearchParams({ from: `${from.lat},${from.lng}`, to: `${to.lat},${to.lng}` }).toString();
  return `${directionsBase}${directionsBase.includes("?") ? "&" : "?"}${query}`;
}

export function mapViewUrl(lat: number, lng: number, zoom = 16): string {
  return `${mapViewBase}?mlat=${lat}&mlon=${lng}#map=${zoom}/${lat}/${lng}`;
}