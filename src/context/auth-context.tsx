import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  ReactNode,
} from "react";

export type AppMode = "user" | "vendor";
export type Role = "user" | "vendor";

export interface SessionInfo {
  id: string;
  deviceName: string;
  deviceType: "mobile" | "desktop" | "tablet";
  browser: string;
  os: string;
  userAgent: string;
  lastActiveAt: string;
  ipAddress: string;
  location: string;
  isCurrent: boolean;
}

export interface User {
  id: string;
  email: string;
  businessName: string;
  serviceType: string;
  location: string;
  operatingHours: string;
  status: "online" | "offline";
  verified: boolean;
  role: Role;
  username?: string;
  phone?: string;
  carModel?: string;
  plateNumber?: string;
  yearOfManufacture?: string;
  transmission?: string;
  fuelType?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  phoneNumbers?: string | string[];
  emergencyLine?: string;
  paymentMethods?: string[];
  socialFacebook?: string;
  socialWhatsApp?: string;
  socialInstagram?: string;
  lastLoginAt?: string;
  deviceSessions?: SessionInfo[];
}

export interface RegisterData {
  role: Role;
  username: string;
  email: string;
  password: string;
  phone: string;
  carModel?: string;
  plateNumber?: string;
  yearOfManufacture?: string;
  transmission?: string;
  fuelType?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  carLicenseFile?: File | null;
  personalIdFile?: File | null;
  businessName?: string;
  serviceType?: string;
  phoneNumbers?: string | string[];
  emergencyLine?: string;
  location?: string;
  coordinates?: { lat: number; lng: number } | null;
  commercialRegisterFile?: File | null;
  taxIdFile?: File | null;
  workingHours?: string;
  paymentMethods?: string[];
  socialFacebook?: string;
  socialWhatsApp?: string;
  socialInstagram?: string;
}

export interface AuthContextType {
  user: User | null;
  role: Role;
  activeMode: AppMode;
  mode: AppMode; // Alias for activeMode for compatibility
  isAuthenticated: boolean;
  isLoading: boolean; // Hydration state
  sessionExpiresAt: number | null;
  rememberMe: boolean;
  deviceSessions: SessionInfo[];
  currentSession: SessionInfo | null;
  login: (email: string, password: string, remember?: boolean) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: (options?: { allSessions?: boolean }) => Promise<void>;
  logoutAllSessions: () => Promise<void>;
  revokeDeviceSession: (sessionId: string) => Promise<void>;
  switchMode: (newMode: AppMode) => Promise<void>;
  setMode: (newMode: AppMode) => Promise<void>; // Alias for switchMode
  updateUserProfile: (data: Partial<User>) => void;
  updateUser: (data: Partial<User>) => void; // Alias for updateUserProfile
  refreshSession: () => Promise<void>;
}

interface PersistedAuthSession {
  version: 1;
  token: string;
  user: User;
  activeMode: AppMode;
  rememberMe: boolean;
  createdAt: number;
  expiresAt: number;
  deviceSessions: SessionInfo[];
}

const SESSION_STORAGE_KEY = "synly_auth_session_v1";
const MODE_STORAGE_KEY = "synly_mode_v1";

// 30 days when "Remember me" is checked; 12 hours for transient sessions
const REMEMBERED_EXPIRY_MS = 30 * 24 * 60 * 60 * 1000;
const TRANSIENT_EXPIRY_MS = 12 * 60 * 60 * 1000;

function detectCurrentDevice(): Omit<SessionInfo, "id" | "isCurrent"> {
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

  return {
    deviceName: `${browser} on ${os}`,
    deviceType: isTablet ? "tablet" : isMobile ? "mobile" : "desktop",
    browser,
    os,
    userAgent: ua.slice(0, 120),
    lastActiveAt: new Date().toISOString(),
    ipAddress: "197.38.45.12",
    location: "Cairo, Egypt",
  };
}

function createDefaultDeviceSessions(): SessionInfo[] {
  const current = detectCurrentDevice();
  const currentSession: SessionInfo = {
    ...current,
    id: "sess_curr_" + Math.random().toString(36).substring(2, 9),
    isCurrent: true,
  };

  const mobileSession: SessionInfo = {
    id: "sess_mob_" + Math.random().toString(36).substring(2, 9),
    deviceName: "iPhone 15 Pro • Synly App",
    deviceType: "mobile",
    browser: "Synly iOS",
    os: "iOS 17.4",
    userAgent: "Synly/2.4 (iPhone15,2; iOS 17.4)",
    lastActiveAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    ipAddress: "156.204.18.91",
    location: "Giza, Egypt",
    isCurrent: false,
  };

  return [currentSession, mobileSession];
}

function safeGetStoredSession(): PersistedAuthSession | null {
  try {
    const raw = localStorage.getItem(SESSION_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PersistedAuthSession;

    // Schema validation and expiration checks
    if (!parsed || parsed.version !== 1 || !parsed.user || !parsed.user.id) {
      localStorage.removeItem(SESSION_STORAGE_KEY);
      return null;
    }

    if (typeof parsed.expiresAt === "number" && Date.now() > parsed.expiresAt) {
      // Session has expired
      localStorage.removeItem(SESSION_STORAGE_KEY);
      return null;
    }

    return parsed;
  } catch {
    try {
      localStorage.removeItem(SESSION_STORAGE_KEY);
    } catch {
      // Ignore storage errors
    }
    return null;
  }
}

function safePersistSession(session: PersistedAuthSession | null): void {
  try {
    if (!session) {
      localStorage.removeItem(SESSION_STORAGE_KEY);
      localStorage.removeItem(MODE_STORAGE_KEY);
    } else {
      localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
      localStorage.setItem(
        MODE_STORAGE_KEY,
        JSON.stringify({ mode: session.activeMode, expiresAt: session.expiresAt })
      );
    }
  } catch {
    // Ignore quota or private-browsing errors
  }
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [activeMode, setActiveMode] = useState<AppMode>("user");
  const [rememberMe, setRememberMe] = useState<boolean>(true);
  const [sessionExpiresAt, setSessionExpiresAt] = useState<number | null>(null);
  const [deviceSessions, setDeviceSessions] = useState<SessionInfo[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true); // Hydration state

  // Initial Hydration from resilient localStorage schema
  useEffect(() => {
    const hydrateSession = () => {
      const persisted = safeGetStoredSession();
      if (persisted) {
        setUser(persisted.user);
        setActiveMode(persisted.activeMode || persisted.user.role || "user");
        setRememberMe(persisted.rememberMe ?? true);
        setSessionExpiresAt(persisted.expiresAt);
        setDeviceSessions(
          persisted.deviceSessions?.length
            ? persisted.deviceSessions
            : createDefaultDeviceSessions()
        );
      } else {
        setUser(null);
        setActiveMode("user");
        setSessionExpiresAt(null);
        setDeviceSessions([]);
      }
      setIsLoading(false);
    };

    hydrateSession();

    // Cross-tab synchronization (Uber/inDrive style)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === SESSION_STORAGE_KEY) {
        if (!e.newValue) {
          setUser(null);
          setSessionExpiresAt(null);
          setDeviceSessions([]);
        } else {
          try {
            const next = JSON.parse(e.newValue) as PersistedAuthSession;
            if (next && next.user) {
              setUser(next.user);
              setActiveMode(next.activeMode);
              setSessionExpiresAt(next.expiresAt);
              if (next.deviceSessions) setDeviceSessions(next.deviceSessions);
            }
          } catch {
            // Ignore parse errors from concurrent writes
          }
        }
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  // Periodic expiration watcher
  useEffect(() => {
    if (!sessionExpiresAt) return;

    const interval = setInterval(() => {
      if (Date.now() > sessionExpiresAt) {
        // Expire session smoothly
        setUser(null);
        setSessionExpiresAt(null);
        setDeviceSessions([]);
        safePersistSession(null);
      }
    }, 60 * 1000); // Check every minute

    return () => clearInterval(interval);
  }, [sessionExpiresAt]);

  const login = useCallback(
    async (email: string, password: string, remember: boolean = true) => {
      setIsLoading(true);
      try {
        // Simulate realistic network authentication
        await new Promise((resolve) => setTimeout(resolve, 600));

        if (!email.trim() || !password.trim()) {
          throw new Error("Please enter both email and password");
        }

        const isVendorEmail =
          email.toLowerCase().includes("vendor") ||
          email.toLowerCase().includes("workshop") ||
          email.toLowerCase().includes("center");
        const resolvedRole: Role = isVendorEmail ? "vendor" : "user";
        const initialMode: AppMode = resolvedRole;

        const sessions = createDefaultDeviceSessions();
        const now = Date.now();
        const expiresAt = now + (remember ? REMEMBERED_EXPIRY_MS : TRANSIENT_EXPIRY_MS);

        const authenticatedUser: User = {
          id: "usr_" + Math.random().toString(36).substring(2, 9),
          email: email.trim(),
          businessName: isVendorEmail
            ? "Al-Ahram Auto Center"
            : "Ahmed Mohamed",
          serviceType: isVendorEmail ? "Mechanical Repair & Diagnostics" : "",
          location: "Nasr City, Cairo",
          operatingHours: isVendorEmail ? "8:00 AM - 10:00 PM" : "",
          status: "online",
          verified: true,
          role: resolvedRole,
          username: email.split("@")[0],
          phone: "+20 100 123 4567",
          carModel: isVendorEmail ? undefined : "Hyundai Elantra 2022",
          plateNumber: isVendorEmail ? undefined : "ABC 1234",
          lastLoginAt: new Date().toISOString(),
          deviceSessions: sessions,
        };

        const sessionPayload: PersistedAuthSession = {
          version: 1,
          token: "synly_jwt_" + Math.random().toString(36).substring(2, 16),
          user: authenticatedUser,
          activeMode: initialMode,
          rememberMe: remember,
          createdAt: now,
          expiresAt,
          deviceSessions: sessions,
        };

        safePersistSession(sessionPayload);

        setUser(authenticatedUser);
        setActiveMode(initialMode);
        setRememberMe(remember);
        setSessionExpiresAt(expiresAt);
        setDeviceSessions(sessions);
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const register = useCallback(async (data: RegisterData) => {
    setIsLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 800));

      const sessions = createDefaultDeviceSessions();
      const now = Date.now();
      const expiresAt = now + REMEMBERED_EXPIRY_MS;

      const newUser: User = {
        id: "usr_" + Math.random().toString(36).substring(2, 9),
        email: data.email.trim(),
        businessName:
          data.role === "vendor"
            ? data.businessName || "New Service Center"
            : data.username || "Synly User",
        serviceType: data.serviceType || "",
        location: data.location || "Cairo, Egypt",
        operatingHours: data.workingHours || "9:00 AM - 10:00 PM",
        status: "online",
        verified: false,
        role: data.role,
        username: data.username,
        phone: data.phone,
        carModel: data.carModel,
        plateNumber: data.plateNumber,
        yearOfManufacture: data.yearOfManufacture,
        transmission: data.transmission,
        fuelType: data.fuelType,
        emergencyContactName: data.emergencyContactName,
        emergencyContactPhone: data.emergencyContactPhone,
        phoneNumbers: data.phoneNumbers,
        emergencyLine: data.emergencyLine,
        paymentMethods: data.paymentMethods,
        socialFacebook: data.socialFacebook,
        socialWhatsApp: data.socialWhatsApp,
        socialInstagram: data.socialInstagram,
        lastLoginAt: new Date().toISOString(),
        deviceSessions: sessions,
      };

      const sessionPayload: PersistedAuthSession = {
        version: 1,
        token: "synly_jwt_" + Math.random().toString(36).substring(2, 16),
        user: newUser,
        activeMode: data.role,
        rememberMe: true,
        createdAt: now,
        expiresAt,
        deviceSessions: sessions,
      };

      safePersistSession(sessionPayload);

      setUser(newUser);
      setActiveMode(data.role);
      setRememberMe(true);
      setSessionExpiresAt(expiresAt);
      setDeviceSessions(sessions);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(async (options?: { allSessions?: boolean }) => {
    setIsLoading(true);
    try {
      safePersistSession(null);
      setUser(null);
      setActiveMode("user");
      setSessionExpiresAt(null);
      setDeviceSessions([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logoutAllSessions = useCallback(async () => {
    await logout({ allSessions: true });
  }, [logout]);

  const revokeDeviceSession = useCallback(
    async (sessionId: string) => {
      setDeviceSessions((prev) => {
        const next = prev.filter((s) => s.id !== sessionId);
        const stored = safeGetStoredSession();
        if (stored) {
          stored.deviceSessions = next;
          safePersistSession(stored);
        }
        return next;
      });
    },
    []
  );

  const switchMode = useCallback(
    async (newMode: AppMode) => {
      setActiveMode(newMode);
      const stored = safeGetStoredSession();
      if (stored) {
        stored.activeMode = newMode;
        safePersistSession(stored);
      }
    },
    []
  );

  const updateUserProfile = useCallback(
    (data: Partial<User>) => {
      setUser((prev) => {
        if (!prev) return null;
        const updated: User = { ...prev, ...data };
        const stored = safeGetStoredSession();
        if (stored) {
          stored.user = updated;
          safePersistSession(stored);
        }
        return updated;
      });
    },
    []
  );

  const refreshSession = useCallback(async () => {
    const stored = safeGetStoredSession();
    if (!stored) return;

    const newExpiresAt =
      Date.now() + (stored.rememberMe ? REMEMBERED_EXPIRY_MS : TRANSIENT_EXPIRY_MS);
    stored.expiresAt = newExpiresAt;
    safePersistSession(stored);
    setSessionExpiresAt(newExpiresAt);
  }, []);

  const currentSession =
    deviceSessions.find((s) => s.isCurrent) || deviceSessions[0] || null;

  return (
    <AuthContext.Provider
      value={{
        user,
        role: user?.role || "user",
        activeMode,
        mode: activeMode, // Alias
        isAuthenticated: !!user && !isLoading,
        isLoading,
        sessionExpiresAt,
        rememberMe,
        deviceSessions,
        currentSession,
        login,
        register,
        logout,
        logoutAllSessions,
        revokeDeviceSession,
        switchMode,
        setMode: switchMode, // Alias
        updateUserProfile,
        updateUser: updateUserProfile, // Alias
        refreshSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

export default AuthContext;
