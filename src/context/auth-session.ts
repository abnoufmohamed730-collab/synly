import type { AppMode } from "./auth-types";

const MODE_STORAGE_KEY = "synly_mode_v1";

export function readStoredMode(): AppMode {
  try {
    return localStorage.getItem(MODE_STORAGE_KEY) === "vendor" ? "vendor" : "user";
  } catch {
    return "user";
  }
}

export function writeStoredMode(mode: AppMode): void {
  try {
    localStorage.setItem(MODE_STORAGE_KEY, mode);
  } catch {
    // The selected presentation mode is optional when browser storage is unavailable.
  }
}
