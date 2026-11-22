const fallbackTileUrl = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";
const fallbackAttribution = '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

export const mapTileUrl = import.meta.env.VITE_MAP_TILE_URL || fallbackTileUrl;
export const mapTileAttribution = import.meta.env.VITE_MAP_TILE_ATTRIBUTION || fallbackAttribution;
