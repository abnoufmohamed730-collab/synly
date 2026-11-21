import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import type {
  AppMode,
  AuthContextType,
  PersistedAuthSession,
  RegisterData,
  Role,
  SessionInfo,
  User,
} from "./auth-types";
import {
  createDeviceSessions,
  createPersistedSession,
  createUserId,
  readStoredSession,
  REMEMBERED_EXPIRY_MS,
  SESSION_STORAGE_KEY,
  TRANSIENT_EXPIRY_MS,
  writeStoredSession,
} from "./auth-session";

export type { AppMode, AuthContextType, RegisterData, Role, SessionInfo, User } from "./auth-types";

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function getDefaultMode(role: Role): AppMode {
  return role;
}

function buildAuthenticatedUser(email: string, role: Role, sessions: SessionInfo[]): User {
  const isVendor = role === "vendor";
  return {
    id: createUserId(),
    email: email.trim(),
    businessName: isVendor ? "Al-Ahram Auto Center" : "Ahmed Mohamed",
    serviceType: isVendor ? "Mechanical Repair & Diagnostics" : "",
    location: "Nasr City, Cairo",
    operatingHours: isVendor ? "8:00 AM - 10:00 PM" : "",
    status: "online",
    verified: true,
    role,
    username: email.split("@")[0],
    phone: "+20 100 123 4567",
    carModel: isVendor ? undefined : "Hyundai Elantra 2022",
    plateNumber: isVendor ? undefined : "ABC 1234",
    lastLoginAt: new Date().toISOString(),
    deviceSessions: sessions,
  };
}

function buildRegisteredUser(data: RegisterData, sessions: SessionInfo[]): User {
  return {
    id: createUserId(),
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
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [activeMode, setActiveMode] = useState<AppMode>("user");
  const [rememberMe, setRememberMe] = useState(true);
  const [sessionExpiresAt, setSessionExpiresAt] = useState<number | null>(null);
  const [deviceSessions, setDeviceSessions] = useState<SessionInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const applySession = useCallback((session: PersistedAuthSession | null) => {
    setUser(session?.user ?? null);
    setActiveMode(session?.activeMode ?? "user");
    setRememberMe(session?.rememberMe ?? true);
    setSessionExpiresAt(session?.expiresAt ?? null);
    setDeviceSessions(session?.deviceSessions ?? []);
  }, []);

  useEffect(() => {
    applySession(readStoredSession());
    setIsLoading(false);

    const handleStorageChange = (event: StorageEvent) => {
      if (event.key !== SESSION_STORAGE_KEY) return;
      if (!event.newValue) {
        applySession(null);
        return;
      }
      applySession(readStoredSession());
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, [applySession]);

  useEffect(() => {
    if (!sessionExpiresAt) return;
    const interval = window.setInterval(() => {
      if (Date.now() >= sessionExpiresAt) {
        writeStoredSession(null);
        applySession(null);
      }
    }, 60_000);
    return () => window.clearInterval(interval);
  }, [sessionExpiresAt, applySession]);

  const commitSession = useCallback((session: PersistedAuthSession) => {
    writeStoredSession(session);
    applySession(session);
  }, [applySession]);

  const login = useCallback(async (email: string, password: string, remember = true) => {
    setIsLoading(true);
    try {
      await new Promise((resolve) => window.setTimeout(resolve, 600));
      if (!email.trim() || !password.trim()) {
        throw new Error("Please enter both email and password");
      }
      const normalizedEmail = email.trim().toLowerCase();
      const role: Role = /vendor|workshop|center/.test(normalizedEmail) ? "vendor" : "user";
      const sessions = createDeviceSessions();
      const authenticatedUser = buildAuthenticatedUser(email, role, sessions);
      commitSession(createPersistedSession(authenticatedUser, getDefaultMode(role), remember, sessions));
    } finally {
      setIsLoading(false);
    }
  }, [commitSession]);

  const register = useCallback(async (data: RegisterData) => {
    setIsLoading(true);
    try {
      await new Promise((resolve) => window.setTimeout(resolve, 800));
      const sessions = createDeviceSessions();
      const newUser = buildRegisteredUser(data, sessions);
      commitSession(createPersistedSession(newUser, data.role, true, sessions));
    } finally {
      setIsLoading(false);
    }
  }, [commitSession]);

  const logout = useCallback(async (_options?: { allSessions?: boolean }) => {
    setIsLoading(true);
    try {
      writeStoredSession(null);
      applySession(null);
    } finally {
      setIsLoading(false);
    }
  }, [applySession]);

  const logoutAllSessions = useCallback(async () => logout({ allSessions: true }), [logout]);

  const revokeDeviceSession = useCallback(async (sessionId: string) => {
    setDeviceSessions((current) => {
      const next = current.filter((session) => session.id !== sessionId);
      const stored = readStoredSession();
      if (stored) writeStoredSession({ ...stored, deviceSessions: next });
      return next;
    });
  }, []);

  const switchMode = useCallback(async (newMode: AppMode) => {
    setActiveMode(newMode);
    const stored = readStoredSession();
    if (stored) writeStoredSession({ ...stored, activeMode: newMode });
  }, []);

  const updateUserProfile = useCallback((data: Partial<User>) => {
    setUser((current) => {
      if (!current) return null;
      const updated = { ...current, ...data };
      const stored = readStoredSession();
      if (stored) writeStoredSession({ ...stored, user: updated });
      return updated;
    });
  }, []);

  const refreshSession = useCallback(async () => {
    const stored = readStoredSession();
    if (!stored) return;
    const expiresAt = Date.now() + (stored.rememberMe ? REMEMBERED_EXPIRY_MS : TRANSIENT_EXPIRY_MS);
    const updated = { ...stored, expiresAt };
    writeStoredSession(updated);
    setSessionExpiresAt(expiresAt);
  }, []);

  const currentSession = deviceSessions.find((session) => session.isCurrent) ?? deviceSessions[0] ?? null;

  return (
    <AuthContext.Provider
      value={{
        user,
        role: user?.role ?? "user",
        activeMode,
        mode: activeMode,
        isAuthenticated: Boolean(user) && !isLoading,
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
        setMode: switchMode,
        updateUserProfile,
        updateUser: updateUserProfile,
        refreshSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
}

export default AuthContext;
