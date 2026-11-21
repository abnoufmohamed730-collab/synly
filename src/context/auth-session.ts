import type { AppMode, PersistedAuthSession, SessionInfo, User } from "./auth-types";

export const REMEMBERED_EXPIRY_MS = 30 * 24 * 60 * 60 * 1000;
export const TRANSIENT_EXPIRY_MS = 12 * 60 * 60 * 1000;
export const SESSION_STORAGE_KEY = "synly_auth_session_v1";
const MODE_STORAGE_KEY = "synly_mode_v1";

export function createDeviceSessions(): SessionInfo[] {
  const ua = typeof navigator !== "undefined" ? navigator.userAgent : "";
  const isMobile = /Android|iPhone|iPad|iPod|Opera Mini|IEMobile/i.test(ua);
  const isTablet = /iPad|tablet/i.test(ua);
  let browser = "Chrome";
  if (ua.includes("Firefox")) browser = "Firefox";
  else if (ua.includes("Safari") && !ua.includes("Chrome")) browser = "Safari";
  else if (ua.includes("Edg")) browser = "Edge";

  let os = "Desktop";
  if (ua.includes("Windows")) os = "Windows";
  else if (ua.includes("Mac OS")) os = "macOS";
  else if (ua.includes("Android")) os = "Android";
  else if (ua.includes("iPhone") || ua.includes("iOS")) os = "iOS";
  else if (ua.includes("Linux")) os = "Linux";

  return [
    {
      id: `sess_curr_${Math.random().toString(36).substring(2, 9)}`,
      deviceName: `${browser} on ${os}`,
      deviceType: isTablet ? "tablet" : isMobile ? "mobile" : "desktop",
      browser,
      os,
      userAgent: ua.slice(0, 120),
      lastActiveAt: new Date().toISOString(),
      ipAddress: "197.38.45.12",
      location: "Cairo, Egypt",
      isCurrent: true,
    },
    {
      id: `sess_mob_${Math.random().toString(36).substring(2, 9)}`,
      deviceName: "iPhone 15 Pro • Synly App",
      deviceType: "mobile",
      browser: "Synly iOS",
      os: "iOS 17.4",
      userAgent: "Synly/2.4 (iPhone15,2; iOS 17.4)",
      lastActiveAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      ipAddress: "156.204.18.91",
      location: "Giza, Egypt",
      isCurrent: false,
    },
  ];
}

export function createUserId(): string {
  return `usr_${Math.random().toString(36).substring(2, 9)}`;
}

export function createPersistedSession(
  user: User,
  activeMode: AppMode,
  rememberMe: boolean,
  deviceSessions: SessionInfo[],
  now = Date.now()
): PersistedAuthSession {
  return {
    version: 1,
    token: `synly_jwt_${Math.random().toString(36).substring(2, 16)}`,
    user,
    activeMode,
    rememberMe,
    createdAt: now,
    expiresAt: now + (rememberMe ? REMEMBERED_EXPIRY_MS : TRANSIENT_EXPIRY_MS),
    deviceSessions,
  };
}

export function readStoredSession(): PersistedAuthSession | null {
  try {
    const raw = localStorage.getItem(SESSION_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PersistedAuthSession;
    if (
      !parsed ||
      parsed.version !== 1 ||
      !parsed.user?.id ||
      typeof parsed.expiresAt !== "number" ||
      parsed.expiresAt <= Date.now()
    ) {
      clearStoredSession();
      return null;
    }
    return parsed;
  } catch {
    clearStoredSession();
    return null;
  }
}

export function writeStoredSession(session: PersistedAuthSession | null): void {
  try {
    if (!session) {
      clearStoredSession();
      return;
    }
    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
    localStorage.setItem(
      MODE_STORAGE_KEY,
      JSON.stringify({ mode: session.activeMode, expiresAt: session.expiresAt })
    );
  } catch {
    // Storage may be unavailable in private browsing or when quota is exhausted.
  }
}

export function clearStoredSession(): void {
  try {
    localStorage.removeItem(SESSION_STORAGE_KEY);
    localStorage.removeItem(MODE_STORAGE_KEY);
  } catch {
    // Storage may be unavailable in private browsing.
  }
}

export { readStoredSession as safeGetStoredSession, writeStoredSession as safePersistSession };
export type { PersistedAuthSession as StoredAuthSession };
